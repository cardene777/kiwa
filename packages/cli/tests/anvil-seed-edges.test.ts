import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// packages/cli/src/commands/anvil-seed.ts のうち tests/anvil-seed.test.ts が
// 通っていない失敗経路 (anvil が上がらない / 空き port を取れない / SIGTERM に
// 応じない / 終了 code が signal 由来) を走らせる behavior test。
//
// 検査対象はいずれも「待ち」 を含むので時間は fake timer で進める。 実 anvil も
// 実 script も起動しない (spawn は差し替え、 port 探索の net も差し替え、 fetch は
// globalThis 側で置換)。 差し替えるのは外部依存だけで、 runAnvilSeed 自身は実物。

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('node:net', () => ({
  createServer: vi.fn(),
}));

/** SIGTERM を受けたら exit を出す子 process の代役 (行儀の良い anvil)。 */
class FakeChild extends EventEmitter {
  pid = 54321;
  killCalls: string[] = [];

  kill(signal?: string | number): boolean {
    this.killCalls.push(String(signal ?? ''));
    queueMicrotask(() => this.emit('exit', 0, signal ?? null));
    return true;
  }
}

/** kill を受けても終わらない子 process。 SIGKILL 経路を出すために要る。 */
class StubbornChild extends EventEmitter {
  pid = 54322;
  killCalls: string[] = [];

  kill(signal?: string | number): boolean {
    this.killCalls.push(String(signal ?? ''));
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

async function loadNet() {
  return await import('node:net');
}

let originalFetch: typeof globalThis.fetch;

/** 常に ok を返す fetch。 anvil が即座に応答した状態。 */
function readyFetch(): typeof globalThis.fetch {
  return vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof globalThis.fetch;
}

describe('runAnvilSeed の起動待ち', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it('T-ASD-010 応答が来ないまま制限時間を過ぎたら anvil を止めて throw する', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // 接続そのものが拒否される状態。 例外を握らないと待ちの loop が 1 周目で
    // 落ち、 「起動が遅いだけ」 と「起動しない」 を区別できなくなる。
    const refused = vi.fn(async () => {
      throw new Error('ECONNREFUSED 127.0.0.1:9700');
    });
    globalThis.fetch = refused as unknown as typeof globalThis.fetch;

    const anvilChild = new FakeChild();
    vi.mocked(cp.spawn).mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9700,
    });
    const settled = expect(promise).rejects.toThrow(
      /anvil seed: failed to start on port 9700 within 10000ms/,
    );

    // 100ms 間隔の再試行を制限時間 (10s) の先まで進める。
    await vi.advanceTimersByTimeAsync(11_000);
    await settled;

    // 1 周では諦めていない = 再試行が実際に回っている。
    expect(refused.mock.calls.length).toBeGreaterThan(1);
    // 起動待ちで諦めた anvil は放置せず止める。 残すと port を握ったままになる。
    expect(anvilChild.killCalls).toContain('SIGTERM');
    // script 側は spawn していない (起動していない anvil に流す意味がない)。
    expect(vi.mocked(cp.spawn)).toHaveBeenCalledTimes(1);
  });

  it('T-ASD-011 anvil が先に落ちていたら止め直さずに throw する', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    globalThis.fetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof globalThis.fetch;

    const anvilChild = new FakeChild();
    vi.mocked(cp.spawn).mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9701,
    });
    const settled = expect(promise).rejects.toThrow(/failed to start on port 9701/);

    // anvil 自身が起動に失敗して終了した状態。
    anvilChild.emit('exit', 1, null);
    await vi.advanceTimersByTimeAsync(11_000);
    await settled;

    // 既に終わっている相手に signal を送らない。
    expect(anvilChild.killCalls).toEqual([]);
  });

  it('T-ASD-012 応答が非 2xx の間は待ち続け、 ok になったら先へ進む', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // anvil は listen しているが JSON-RPC をまだ返せない状態。 `ok` を見ずに
    // 「接続できた = 準備完了」 とすると、 script が空の chain に当たる。
    let attempts = 0;
    globalThis.fetch = vi.fn(async () => {
      attempts += 1;
      return { ok: attempts >= 3 } as Response;
    }) as unknown as typeof globalThis.fetch;

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
      port: 9702,
      flushMs: 1,
    });

    // 2 回 not-ok を返してから ok になるまで進める。
    await vi.advanceTimersByTimeAsync(300);
    expect(vi.mocked(cp.spawn)).toHaveBeenCalledTimes(2);

    scriptChild.emit('exit', 0, null);
    await vi.advanceTimersByTimeAsync(10);
    await expect(promise).resolves.toEqual({ outPath: '/abs/out.json', port: 9702 });
    expect(attempts).toBe(3);
  });
});

describe('runAnvilSeed の後片付け', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it('T-ASD-013 SIGTERM に応じない anvil には 3 秒後に SIGKILL を送る', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    globalThis.fetch = readyFetch();

    const anvilChild = new StubbornChild();
    const scriptChild = new FakeChild();
    vi.mocked(cp.spawn)
      .mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>)
      .mockReturnValueOnce(scriptChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9703,
      flushMs: 1,
    });

    await vi.advanceTimersByTimeAsync(0);
    scriptChild.emit('exit', 0, null);
    await vi.advanceTimersByTimeAsync(10);

    // まず SIGTERM。 この時点では待ちに入っていて解決していない。
    expect(anvilChild.killCalls).toEqual(['SIGTERM']);

    await vi.advanceTimersByTimeAsync(3000);
    // 応じないので SIGKILL に上げる。 送らないと CLI が終わっても anvil が残る。
    expect(anvilChild.killCalls).toEqual(['SIGTERM', 'SIGKILL']);
    await expect(promise).resolves.toEqual({ outPath: '/abs/out.json', port: 9703 });
  });

  it('T-ASD-014 flushMs 未指定なら既定の 500ms だけ dump-state の書き出しを待つ', async () => {
    const cp = await loadCp();
    const fs = await loadFs();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    globalThis.fetch = readyFetch();

    const anvilChild = new FakeChild();
    const scriptChild = new FakeChild();
    vi.mocked(cp.spawn)
      .mockReturnValueOnce(anvilChild as unknown as ReturnType<typeof cp.spawn>)
      .mockReturnValueOnce(scriptChild as unknown as ReturnType<typeof cp.spawn>);

    const { runAnvilSeed } = await loadAnvilSeed();
    let settled = false;
    const promise = runAnvilSeed({
      scriptPath: '/abs/script.mjs',
      outPath: '/abs/out.json',
      cwd: '/abs',
      port: 9704,
    }).then((r) => {
      settled = true;
      return r;
    });

    await vi.advanceTimersByTimeAsync(0);
    scriptChild.emit('exit', 0, null);

    // 待ちを飛ばすと dump-state が書き終わる前に anvil を止めることになる。
    await vi.advanceTimersByTimeAsync(499);
    expect(settled).toBe(false);
    expect(anvilChild.killCalls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toEqual({ outPath: '/abs/out.json', port: 9704 });
  });
});

describe('runAnvilSeed の port 探索', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /**
   * `net.createServer` の代役。 `listen` の callback で `address()` が何を返すか、
   * `close` が error を渡すかを個別に指定できる。
   */
  function fakeServer(address: unknown, closeError: Error | null = null) {
    const closed: boolean[] = [];
    return {
      handle: {
        unref: () => undefined,
        on: () => undefined,
        listen: (_port: number, _host: string, cb: () => void) => {
          cb();
        },
        address: () => address,
        close: (cb?: (err?: Error) => void) => {
          closed.push(true);
          if (cb) cb(closeError ?? undefined);
        },
      },
      closed,
    };
  }

  it('T-ASD-016 address() が port を持たなければ reject する', async () => {
    // unix socket に bind した server は文字列を返す。 その戻り値から port を
    // 取り出そうとすると undefined が anvil の --port に渡る。
    const fs = await loadFs();
    const net = await loadNet();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const server = fakeServer('/tmp/some.sock');
    vi.mocked(net.createServer).mockReturnValue(server.handle as unknown as ReturnType<typeof net.createServer>);

    const { runAnvilSeed } = await loadAnvilSeed();
    await expect(
      runAnvilSeed({ scriptPath: '/abs/script.mjs', outPath: '/abs/out.json', cwd: '/abs' }),
    ).rejects.toThrow(/getFreePort failed/);

    // 諦める時も listen した server は閉じる。
    expect(server.closed).toEqual([true]);
  });

  it('T-ASD-017 探索用 server の close が失敗したら その error で reject する', async () => {
    const fs = await loadFs();
    const net = await loadNet();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const server = fakeServer({ port: 4321 }, new Error('EBADF: bad file descriptor'));
    vi.mocked(net.createServer).mockReturnValue(server.handle as unknown as ReturnType<typeof net.createServer>);

    const { runAnvilSeed } = await loadAnvilSeed();
    // 閉じ切れていない server の port を anvil に渡すと EADDRINUSE になる。
    // 握り潰さず、 close の失敗をそのまま呼出側に返す。
    await expect(
      runAnvilSeed({ scriptPath: '/abs/script.mjs', outPath: '/abs/out.json', cwd: '/abs' }),
    ).rejects.toThrow(/EBADF/);
  });
});
