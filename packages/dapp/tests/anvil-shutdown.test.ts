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

// waitForReady 内 fetch を method 別 call 順で制御する helper。
// chainId / block それぞれに schedule 配列を渡すと、 call N 回目に該当 step を返す。
// schedule 尽き後は default (chainId=0x7a69 ok / block=0x0 ok) に fallback して eventual
// 成功 (resolves(true)) を担保する。 iter 1 で意図した uncover branch を hit、
// iter 2 以降で正常経路を返して startAnvilProcess の handle 解決まで進める。
type FetchStep = { ok: boolean; result?: unknown };
function makeSteppedFetch(
  chainIdSchedule: FetchStep[],
  blockSchedule: FetchStep[],
): typeof globalThis.fetch {
  let ci = 0;
  let bi = 0;
  const chainDefault: FetchStep = { ok: true, result: '0x7a69' };
  const blockDefault: FetchStep = { ok: true, result: '0x0' };
  return vi.fn(async (_url: unknown, opts: unknown) => {
    const body = JSON.parse((opts as { body: string }).body) as { method: string };
    if (body.method === 'eth_chainId') {
      const step = chainIdSchedule[ci++] ?? chainDefault;
      return { ok: step.ok, json: async () => ({ result: step.result }) } as Response;
    }
    if (body.method === 'eth_blockNumber') {
      const step = blockSchedule[bi++] ?? blockDefault;
      return { ok: step.ok, json: async () => ({ result: step.result }) } as Response;
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

  // --- 段階 4 追加 test (T-SDN-010〜017): anvil.ts Branch coverage 77.55% → 80%+ 到達 ---
  // 段階 3 で cover 済の SIGTERM / SIGKILL / port release 経路の siblings
  // (onError 非 ENOENT / waitForReady 内 fetch response 各種 fail / killPidWithWait
  // SIGTERM throw / safeKill catch) を狙う。

  it('T-SDN-010 onError が ENOENT 以外 error を受けた場合 fatalError 未 set + console.warn のみ実行', async () => {
    const anvil = await loadAnvil();
    // spawn 直後に非 ENOENT error 発火 → onError 内 !== 'ENOENT' 分岐で console.warn のみ
    const startPromise = anvil.startAnvilProcess({ port: 8910 });
    // startAnvilProcess は spawn → onError attach まで sync 走行、 await waitForReady で yield
    // よって emit 時点で onError は attach 済
    child.emit('error', Object.assign(new Error('spawn EACCES'), { code: 'EACCES' }));
    // waitForReady は fetch mock (ready) で resolve(true) → handle 取得
    const handle = await startPromise;
    // 非 ENOENT なので fatalError は set されず waitForReady は正常継続、 console.warn 呼出のみ
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/anvil child process error before ready.*spawn EACCES/),
    );
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-011 waitForReady で chainRes.ok=false → early return → 次 iter で success → resolve', async () => {
    // iter 1 は chainId call が !ok で早期 return (line 216 相当 branch hit)、
    // iter 2 で default fallback (ok:true) を返し正常経路で resolve(true)
    globalThis.fetch = makeSteppedFetch([{ ok: false }], []);
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8911 });
    // handle 取得成功 = iter 2 以降で resolve(true) 到達
    expect(handle.port).toBe(8911);
    expect(handle.pid).toBe(12345);
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-012 waitForReady chainId 不一致 → early return → 次 iter で match → resolve', async () => {
    // expectedChainId=31337 に対し iter 1 は 0x1 (chainId=1) を返して mismatch 分岐 (line 223 相当) hit、
    // iter 2 で default 0x7a69 (chainId=31337) が返り match → resolve
    globalThis.fetch = makeSteppedFetch([{ ok: true, result: '0x1' }], []);
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8912, chainId: 31337 });
    expect(handle.port).toBe(8912);
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-013 waitForReady chainId が非 string (result=null) → NaN 判定 return → 次 iter で resolve', async () => {
    // iter 1: result=null → typeof !== 'string' → chainId=NaN → !isFinite 分岐で return
    // (line 220 ternary 非 string branch + line 222 !isFinite=true branch を同時 hit)
    globalThis.fetch = makeSteppedFetch([{ ok: true, result: null }], []);
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8913, chainId: 31337 });
    expect(handle.port).toBe(8913);
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-014 waitForReady blockRes.ok=false → early return → 次 iter で resolve', async () => {
    // iter 1: chainId ok だが blockRes !ok → line 243 相当 branch hit
    // iter 2: default で両方 ok → resolve(true)
    globalThis.fetch = makeSteppedFetch([], [{ ok: false }]);
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8914 });
    expect(handle.port).toBe(8914);
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-015 waitForReady 既存 block あり (orphan anvil) → early return → 次 iter で clean chain', async () => {
    // iter 1: block.result='0x5' (非 0x0) → orphan anvil 判定で return (line 245 相当)
    // iter 2: default で 0x0 → pristine 判定 pass → resolve(true)
    globalThis.fetch = makeSteppedFetch([], [{ ok: true, result: '0x5' }]);
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8915 });
    expect(handle.port).toBe(8915);
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-016 killPidWithWait SIGTERM が throw → 最初の catch で早期 return (SIGKILL 送信なし)', async () => {
    // killExistingOnPort → lsof に anvil listener → process.kill(SIGTERM) が throw
    // → killPidWithWait 内 SIGTERM の catch (line 152 相当) で早期 return
    // → waitForPidExit / SIGKILL / isPidAlive のいずれも呼ばれない
    const anvil = await loadAnvil();
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      'COMMAND  PID    USER  FD  TYPE  DEVICE  SIZE/OFF NODE NAME\n' +
        'anvil    77777  user  4u  IPv4  0x1      0t0     TCP  127.0.0.1:8916 (LISTEN)\n',
    );
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((_pid: number, sig?: unknown) => {
      if (sig === 'SIGTERM') throw new Error('ESRCH');
      return true;
    }) as unknown as typeof process.kill);
    const handle = await anvil.startAnvilProcess({ port: 8916, killExistingOnPort: true });
    // SIGTERM を試行して throw されたことは記録される
    expect(killSpy).toHaveBeenCalledWith(77777, 'SIGTERM');
    // catch で return したため SIGKILL / (pid, 0) いずれも呼ばれていない
    expect(killSpy).not.toHaveBeenCalledWith(77777, 'SIGKILL');
    expect(killSpy).not.toHaveBeenCalledWith(77777, 0);
    child.killResponses = ['exit'];
    await handle.stop();
  });

  it('T-SDN-017 stop() SIGTERM+SIGKILL 両 throw → safeKill catch 経路で swallow → resolve', async () => {
    // stopProcess の SIGTERM が throw → catch 内 safeKill(child) を呼ぶ →
    // safeKill 内 child.kill('SIGKILL') も throw → safeKill catch (line 266 相当) で握り潰し →
    // finish(false) で resolve、 timer は catch 内で全 clearTimeout 済
    const anvil = await loadAnvil();
    const handle = await anvil.startAnvilProcess({ port: 8917 });
    child.killResponses = ['throw', 'throw']; // SIGTERM + safeKill(SIGKILL) 両 throw
    await handle.stop();
    // 両 signal が試行された = safeKill が呼ばれた証拠
    expect(child.killCalls).toEqual(['SIGTERM', 'SIGKILL']);
    // finalTimer は clearTimeout 済のため leak warn は出ない
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringMatching(/leaking port 8917/));
  });
});
