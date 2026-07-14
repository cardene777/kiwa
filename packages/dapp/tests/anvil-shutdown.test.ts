import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// anvil.ts の SIGTERM / SIGKILL 昇格 / port release / leak / spawn error
// といった終了・失敗 edge case を単体 test で cover する。
// 実 anvil binary を起動する既存 test (tests/anvil.test.ts) は正常経路のみ、
// 本 test は node:child_process と global.fetch を mock して制御する。
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
  execFileSync: vi.fn(),
}));

type KillBehavior = 'exit' | 'noop' | 'throw';

class FakeChild extends EventEmitter {
  pid: number | undefined = 12345;
  exitCode: number | null = null;
  killed = false;
  killResponses: KillBehavior[] = [];
  killCalls: string[] = [];

  kill(signal?: string | number): boolean {
    this.killCalls.push(String(signal ?? ''));
    const response = this.killResponses.shift() ?? 'exit';
    if (response === 'throw') {
      throw new Error('kill failed');
    }
    if (response === 'exit') {
      this.exitCode = 0;
      this.killed = true;
      this.emit('exit', 0, signal ?? null);
    }
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

// waitForReady が 1 回目の interval で resolve(true) するように fetch mock を用意する。
// eth_chainId = 0x7a69 (31337) を返し、eth_blockNumber = 0x0 で pristine 判定 pass。
function makeReadyFetch(): typeof globalThis.fetch {
  return vi.fn(async (_url: unknown, opts: unknown) => {
    const body = JSON.parse((opts as { body: string }).body) as { method: string };
    if (body.method === 'eth_chainId') {
      return {
        ok: true,
        json: async () => ({ result: '0x7a69' }),
      } as Response;
    }
    if (body.method === 'eth_blockNumber') {
      return {
        ok: true,
        json: async () => ({ result: '0x0' }),
      } as Response;
    }
    return { ok: false, json: async () => ({}) } as Response;
  }) as unknown as typeof globalThis.fetch;
}

describe('anvil.ts SIGTERM / SIGKILL / port release edge cases (mocked child_process + fetch)', () => {
  let child: FakeChild;
  let originalFetch: typeof globalThis.fetch;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    child = new FakeChild();
    const cp = await loadCp();
    (cp.spawn as unknown as ReturnType<typeof vi.fn>).mockReset();
    (cp.spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(child);
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReset();
    // default: lsof は non-zero (何も listening していない happy path)
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('lsof exit 1');
    });
    originalFetch = globalThis.fetch;
    globalThis.fetch = makeReadyFetch();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    warnSpy.mockRestore();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('T-SDN-001 stop() child.exitCode が既に set 済なら early return + kill call ゼロ', async () => {
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8901 });
    // 外部 kill や crash で先に exit 済 state を再現する
    child.exitCode = 0;
    await expect(handle.stop()).resolves.toBeUndefined();
    expect(child.killCalls).toEqual([]);
  });

  it('T-SDN-002 stop() SIGTERM → child emit exit → SIGKILL 不要で resolve', async () => {
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8902 });
    child.killResponses = ['exit'];
    await handle.stop();
    expect(child.killCalls).toEqual(['SIGTERM']);
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringMatching(/leaking port/));
  });

  it('T-SDN-003 stop() SIGTERM noop → SHUTDOWN_GRACE_MS 経過で SIGKILL 昇格 → resolve', async () => {
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8903 });
    child.killResponses = ['noop', 'exit']; // SIGTERM 無反応、 SIGKILL で exit
    vi.useFakeTimers();
    const p = handle.stop();
    // SHUTDOWN_GRACE_MS = 2000ms
    await vi.advanceTimersByTimeAsync(2_100);
    await p;
    expect(child.killCalls).toEqual(['SIGTERM', 'SIGKILL']);
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringMatching(/leaking port/));
  });

  it('T-SDN-004 stop() SIGTERM+SIGKILL 両 noop → finalTimer 発火で leak warn + resolve', async () => {
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8904 });
    child.killResponses = ['noop', 'noop']; // 一切 exit しない
    vi.useFakeTimers();
    const p = handle.stop();
    // SHUTDOWN_GRACE_MS + 2000 = 4000ms
    await vi.advanceTimersByTimeAsync(4_100);
    await p;
    expect(child.killCalls).toEqual(['SIGTERM', 'SIGKILL']);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/leaking port 8904/));
  });

  it('T-SDN-005 stop() SIGTERM が throw → catch 経路で safeKill(SIGKILL) fallback + resolve', async () => {
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8905 });
    child.killResponses = ['throw', 'exit'];
    await handle.stop();
    expect(child.killCalls).toEqual(['SIGTERM', 'SIGKILL']);
  });

  it('T-SDN-006 spawn 直後に ENOENT error → onError fatalError → waitForReady reject → throw + release', async () => {
    const anvil = await loadAnvil();
    const cp = await loadCp();
    const enoentChild = new FakeChild();
    (cp.spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(enoentChild);
    // startAnvilProcess は port 指定で attemptLimit=1、単発 spawn → 単発 fail
    const promise = anvil.startAnvilProcess({ port: 8906 });
    // startAnvilProcess は sync で child.on('error', onError) を attach 済のため、直接 emit
    enoentChild.emit('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }));
    await expect(promise).rejects.toThrow(/anvil not found in PATH/);
  });

  it('T-SDN-007 killExistingOnPort → lsof に非 anvil listener → warn skip (process.kill 呼ばず)', async () => {
    const anvil = await loadAnvil();
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      'COMMAND  PID    USER  FD  TYPE  DEVICE  SIZE/OFF NODE NAME\n' +
        '/usr/sbin/nginx  999  root  4u  IPv4  0x1      0t0     TCP  127.0.0.1:8907 (LISTEN)\n',
    );
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true as never);
    const handle = await anvil.startAnvilProcess({ port: 8907, killExistingOnPort: true });
    const execCall = (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(execCall[0]).toBe('lsof');
    expect(execCall[1]).toEqual(expect.arrayContaining(['-iTCP:8907']));
    // baseName='nginx' → not anvil → process.kill 呼ばれない
    expect(killSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/port 8907 occupied by non-anvil/));
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-008 killExistingOnPort → lsof に anvil listener → killPidWithWait(SIGTERM) → SIGKILL 不要', async () => {
    const anvil = await loadAnvil();
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      'COMMAND  PID    USER  FD  TYPE  DEVICE  SIZE/OFF NODE NAME\n' +
        'anvil    99998  user  4u  IPv4  0x1      0t0     TCP  127.0.0.1:8908 (LISTEN)\n',
    );
    // process.kill(pid, 0) は throw で「pid 死亡」判定、 SIGTERM は success を返す
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((_pid: number, sig?: unknown) => {
      if (sig === 0) throw new Error('ESRCH');
      return true;
    }) as unknown as typeof process.kill);
    const handle = await anvil.startAnvilProcess({ port: 8908, killExistingOnPort: true });
    // SIGTERM 送信済
    expect(killSpy).toHaveBeenCalledWith(99998, 'SIGTERM');
    // isPidAlive が false を返して waitForPidExit が true で return → SIGKILL は送られない
    expect(killSpy).not.toHaveBeenCalledWith(99998, 'SIGKILL');
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-009 spawn child が ready 前に exit → waitForReady false → attemptLimit 1 で throw', async () => {
    const anvil = await loadAnvil();
    const cp = await loadCp();
    const exitChild = new FakeChild();
    (cp.spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(exitChild);
    const promise = anvil.startAnvilProcess({ port: 8909 });
    // waitForReady 内部で child.once('exit') が sync attach 済のため、 sync emit で resolve(false) 経路
    exitChild.emit('exit', 1, 'SIGTERM');
    await expect(promise).rejects.toThrow(/anvil failed to listen/);
  });
});
