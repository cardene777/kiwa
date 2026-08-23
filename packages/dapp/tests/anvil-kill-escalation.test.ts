import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// tests/anvil-shutdown.test.ts は「SIGTERM で即消える」 経路までしか通していないため、
// killAnvilProcessesOnPort → killPidWithWait の昇格側 (waitForPidExit の polling →
// timeout → SIGKILL) と、 waitForReady の deadline 超過が残っていた。
// 外部依存 3 つ (lsof 実行 / signal 送出 / anvil への fetch) を差し替えて、
// 実 process も実 anvil も起こさずにその 3 経路を通す。
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
  execFileSync: vi.fn(),
}));

class FakeChild extends EventEmitter {
  pid: number | undefined = 24680;
  exitCode: number | null = null;
  killed = false;
  killCalls: string[] = [];

  kill(signal?: string | number): boolean {
    this.killCalls.push(String(signal ?? ''));
    this.exitCode = 0;
    this.killed = true;
    this.emit('exit', 0, signal ?? null);
    return true;
  }
  unref(): void {
    // no-op
  }
}

async function loadAnvil() {
  return await import('../src/anvil.js');
}
async function loadCp() {
  return await import('node:child_process');
}

/** anvil が listening 済で block 0 (pristine) を返す fetch。 実 network は張らない。 */
function makeReadyFetch(): typeof globalThis.fetch {
  return vi.fn(async (_url: unknown, opts: unknown) => {
    const body = JSON.parse((opts as { body: string }).body) as { method: string };
    const result = body.method === 'eth_chainId' ? '0x7a69' : '0x0';
    return { ok: true, json: async () => ({ result }) } as Response;
  }) as unknown as typeof globalThis.fetch;
}

function lsofLine(port: number, command: string, pid: number): string {
  return (
    'COMMAND  PID    USER  FD  TYPE  DEVICE  SIZE/OFF NODE NAME\n' +
    `${command}  ${pid}  user  4u  IPv4  0x1      0t0     TCP  127.0.0.1:${port} (LISTEN)\n`
  );
}

describe('anvil.ts kill 昇格 / 起動 timeout (mocked child_process + fetch)', () => {
  let child: FakeChild;
  let originalFetch: typeof globalThis.fetch;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    child = new FakeChild();
    const cp = await loadCp();
    (cp.spawn as unknown as ReturnType<typeof vi.fn>).mockReset();
    (cp.spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReset();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('lsof exit 1');
    });
    originalFetch = globalThis.fetch;
    globalThis.fetch = makeReadyFetch();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('T-SDN-020 SIGTERM に反応しない占有 anvil は timeout 後 SIGKILL へ昇格する', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      lsofLine(8930, 'anvil', 55555),
    );
    // SIGTERM では消えず SIGKILL で初めて消える占有 process を再現する
    let killed = false;
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) {
        if (killed) throw new Error('ESRCH');
        return true;
      }
      if (signal === 'SIGKILL') killed = true;
      return true;
    }) as unknown as typeof process.kill);

    const handle = await loadAnvil().then((anvil) =>
      anvil.startAnvilProcess({ port: 8930, killExistingOnPort: true }),
    );

    expect(killSpy).toHaveBeenCalledWith(55555, 'SIGTERM');
    expect(killSpy).toHaveBeenCalledWith(55555, 'SIGKILL');
    // SIGTERM 待ちが 1 回で終わらず polling している (即 return なら probe は 1 回)
    expect(killSpy.mock.calls.filter((call) => call[1] === 0).length).toBeGreaterThan(2);
    await handle.stop();
  }, 20_000);

  it('T-SDN-021 非 anvil listener の warn 出力が失敗しても listener 走査は続く', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      lsofLine(8931, '/usr/sbin/nginx', 31311) +
        'anvil    31312  user  4u  IPv4  0x1      0t0     TCP  127.0.0.1:8931 (LISTEN)\n',
    );
    // stdout が閉じた状況等で console.warn 自体が throw しても、 後続 listener の
    // kill まで巻き添えにしない (listener ごとの try/catch)
    warnSpy.mockImplementation(() => {
      throw new Error('EPIPE');
    });
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) throw new Error('ESRCH');
      return true;
    }) as unknown as typeof process.kill);

    const handle = await loadAnvil().then((anvil) =>
      anvil.startAnvilProcess({ port: 8931, killExistingOnPort: true }),
    );

    // 1 件目 (nginx) の warn が throw しても 2 件目 (anvil) は kill される
    expect(killSpy).toHaveBeenCalledWith(31312, 'SIGTERM');
    await handle.stop();
  });

  it('T-SDN-022 anvil が ready 応答を返さないまま起動 timeout を超えたら throw する', async () => {
    // fetch が常に失敗 = anvil が listening しない状況。 deadline 超過で resolve(false)
    globalThis.fetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof globalThis.fetch;

    const anvil = await loadAnvil();
    vi.useFakeTimers();
    // reject は timer を進めた瞬間に起きるため、 先に結果を受ける側を張っておく
    const settled = anvil
      .startAnvilProcess({ port: 8932 })
      .then(() => null, (error: Error) => error);
    // STARTUP_TIMEOUT_MS = 10_000、 poll 間隔 25ms
    await vi.advanceTimersByTimeAsync(10_200);

    expect((await settled)?.message).toMatch(/anvil failed to listen within 10000ms/);
    // ready 到達前に諦めた child は片付ける
    expect(child.killCalls).toContain('SIGKILL');
  });
});
