import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// packages/cli/src/commands/anvil-seed.ts の runAnvilSeed の spawn / fetch /
// filesystem 経路を mock で cover する unit test。 real anvil binary を起動しない。
// pattern SSOT = packages/dapp/tests/anvil-shutdown.test.ts (CAR-1528 段階 3-4 で確立)。

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

class FakeChild extends EventEmitter {
  pid = 54321;
  killed = false;
  killCalls: string[] = [];

  kill(signal?: string | number): boolean {
    this.killCalls.push(String(signal ?? ''));
    this.killed = true;
    // 即座に exit event を発火 (SIGTERM で anvil が正常 shutdown する挙動)
    queueMicrotask(() => this.emit('exit', 0, signal ?? null));
    return true;
  }
}

async function loadAnvilSeed() {
  return await import('../src/commands/anvil-seed.js');
}

async function loadCp() {
  return await import('node:child_process');
}

async function loadFs() {
  return await import('node:fs');
}

let originalFetch: typeof globalThis.fetch;

describe('runAnvilSeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('T-ASD-001 scriptPath 不在で throw + spawn は呼ばれない', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { runAnvilSeed } = await loadAnvilSeed();

    await expect(
      runAnvilSeed({
        scriptPath: '/absolute/missing/script.mjs',
        outPath: '/tmp/out.json',
        cwd: '/tmp',
        port: 9600,
      }),
    ).rejects.toThrow(/anvil seed: script not found/);

    // spawn は呼ばれない (existsSync fail で先に throw)
    expect(vi.mocked(cp.spawn)).not.toHaveBeenCalled();
  });

  it('T-ASD-002 相対 scriptPath は cwd で resolve される', async () => {
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { runAnvilSeed } = await loadAnvilSeed();

    await expect(
      runAnvilSeed({
        scriptPath: 'rel/script.mjs',
        outPath: 'out.json',
        cwd: '/opt/proj',
        port: 9601,
      }),
    ).rejects.toThrow(/\/opt\/proj\/rel\/script\.mjs/);
  });

  it('T-ASD-003 正常系: anvil + script spawn 後 dump-state file 存在で success', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // fetch は即 ok = ready
    globalThis.fetch = vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof globalThis.fetch;

    const anvilChild = new FakeChild();
    const scriptChild = new FakeChild();
    vi.mocked(cp.spawn)
      .mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>)
      .mockReturnValueOnce(scriptChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9602,
      chainId: 31337,
      flushMs: 1,
    });

    // scriptChild を async exit
    await new Promise((r) => setTimeout(r, 10));
    scriptChild.emit('exit', 0, null);

    const result = await promise;
    expect(result).toEqual({ outPath: '/abs/out.json', port: 9602 });

    // anvil spawn args verify
    const anvilCall = vi.mocked(cp.spawn).mock.calls[0]!;
    expect(anvilCall[0]).toBe('anvil');
    expect(anvilCall[1]).toContain('--port');
    expect(anvilCall[1]).toContain('9602');
    expect(anvilCall[1]).toContain('--chain-id');
    expect(anvilCall[1]).toContain('31337');
    expect(anvilCall[1]).toContain('--silent');
    expect(anvilCall[1]).toContain('--dump-state');
  });

  it('T-ASD-004 script exit code 非 0 で throw', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    globalThis.fetch = vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof globalThis.fetch;

    const anvilChild = new FakeChild();
    const scriptChild = new FakeChild();
    vi.mocked(cp.spawn)
      .mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>)
      .mockReturnValueOnce(scriptChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9603,
      flushMs: 1,
    });

    await new Promise((r) => setTimeout(r, 10));
    scriptChild.emit('exit', 3, null);

    await expect(promise).rejects.toThrow(/script exited with code 3/);
  });

  it('T-ASD-005 dump-state file 未生成で throw', async () => {
    const cp = await loadCp();
    const fs = await loadFs();

    // script は存在、 dump-state chk では false
    let call = 0;
    vi.mocked(fs.existsSync).mockImplementation(() => {
      call += 1;
      return call === 1; // 1 回目 = script、 2 回目 = dump-state
    });

    globalThis.fetch = vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof globalThis.fetch;

    const anvilChild = new FakeChild();
    const scriptChild = new FakeChild();
    vi.mocked(cp.spawn)
      .mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>)
      .mockReturnValueOnce(scriptChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9604,
      flushMs: 1,
    });

    await new Promise((r) => setTimeout(r, 10));
    scriptChild.emit('exit', 0, null);

    await expect(promise).rejects.toThrow(/dump-state file was not produced/);
  });

  it('T-ASD-006 getFreePort 経路: port 指定なしで自動割当', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // node:net は mock しない = 実 net.createServer で port 取得
    globalThis.fetch = vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof globalThis.fetch;

    const anvilChild = new FakeChild();
    const scriptChild = new FakeChild();
    vi.mocked(cp.spawn)
      .mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>)
      .mockReturnValueOnce(scriptChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      flushMs: 1,
    });

    await new Promise((r) => setTimeout(r, 20));
    scriptChild.emit('exit', 0, null);

    const result = await promise;
    // getFreePort で自動割当された port が返る (1024+ の任意 port)
    expect(result.port).toBeGreaterThan(1024);
    expect(result.outPath).toBe('/abs/out.json');
  });
});
