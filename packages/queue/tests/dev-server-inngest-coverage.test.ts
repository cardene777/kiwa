/**
 * `src/inngest/dev-server-inngest.ts` の成功経路を in-process で通す検査 (Issue #2166)。
 *
 * この file は「dev-server を起動する」「HTTP で event を投げる」 の 2 つを外に出す。
 * 既存の検査は届かない URL を渡して `did not respond` を見るだけで、 起動できた後の
 * 経路 (event の POST 先 / 応答の解釈 / 片付けの順) を 1 度も通していない。
 *
 * ## 何を差し替えるか
 *
 * - `node:child_process` の `spawn` ... 実 process を起こさないため。 渡された
 *   command / 引数 / options をそのまま記録し、 検査側が読む
 * - global の `fetch` ... 実 network に出ないため。 呼ばれた URL と body を記録し、
 *   応答は検査ごとに組み立てる
 *
 * 差し替えるのはこの 2 つだけで、 adapter 自身と in-process 側の stub env は実物を使う。
 * 確かめたいのは adapter の組み立てであって、 `child_process` や `fetch` の挙動ではない。
 */
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// spawn の代替。 vi.mock の factory は巻き上げられるため、 状態は module scope に置き
// factory からは参照だけを行う。
// ---------------------------------------------------------------------------

interface SpawnCall {
  cmd: string;
  args: string[];
  opts: { stdio: string; env: NodeJS.ProcessEnv };
}

const __spawnCalls: SpawnCall[] = [];
const __children: FakeChild[] = [];
/** `kill()` を失敗させて stop() の握り潰し経路を通すための切替。 */
let __killThrows = false;

/**
 * 片付けの順序を記録する共有の台帳。
 *
 * `stop()` は in-process 側を止めてから process を落とす。 停止後の 2 状態だけを見ると
 * **逆順にしても通る**ため、両方が起きた順を 1 本の列に積む。
 */
const __stopOrder: string[] = [];
/** `kill()` が呼ばれた瞬間に走る観測 hook。 順序検査だけが使う。 */
let __onKill: (() => void) | null = null;

class FakeChild {
  /** `kill()` に渡された signal。 停止要求の中身を検査するために持つ。 */
  readonly killSignals: string[] = [];
  /**
   * listener は実 `EventEmitter` に載せる。
   *
   * Map に持って直接呼ぶ形にすると、`once` の listener が最初の発火で外れないため
   * **実装では起こり得ない二重発火**を test 側で作れてしまう (実 `proc.once('error')` は
   * 1 度きり)。 実物に載せれば除去の意味論も一緒に検査できる。
   */
  readonly emitter = new EventEmitter();

  kill(signal?: string): boolean {
    this.killSignals.push(signal ?? '');
    // kill が呼ばれた瞬間に in-process 側が既に止まっているかを問う。
    // 停止後の 2 状態だけを見ると逆順でも通るため、この 1 点で順序を固定する。
    __onKill?.();
    __stopOrder.push('process');
    if (__killThrows) throw new Error('kill refused');
    return true;
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    this.emitter.once(event, listener);
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.emitter.on(event, listener);
  }

  /** 実 EventEmitter へ流す。 `once` の除去が効くので二重発火は起こらない。 */
  emit(event: string, ...args: unknown[]): boolean {
    return this.emitter.emit(event, ...args);
  }
}

vi.mock('node:child_process', () => ({
  spawn: (
    cmd: string,
    args: string[],
    opts: { stdio: string; env: NodeJS.ProcessEnv },
  ): FakeChild => {
    __spawnCalls.push({ cmd, args, opts });
    const child = new FakeChild();
    __children.push(child);
    return child;
  },
}));

// ---------------------------------------------------------------------------
// fetch の代替。
// ---------------------------------------------------------------------------

interface FetchCall {
  url: string;
  init: Record<string, unknown> | undefined;
}

const __fetchCalls: FetchCall[] = [];

/** `fetch` の応答として adapter が読む field だけを持つ最小の形。 */
interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

function response(init: {
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}): FakeResponse {
  return {
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    json: init.json ?? (async () => ({})),
    text: init.text ?? (async () => ''),
  };
}

/** 呼ばれた URL を記録しつつ、 検査が渡した実装に処理を委ねる。 */
function stubFetch(
  impl: (url: string, init: Record<string, unknown> | undefined) => Promise<FakeResponse>,
): void {
  vi.stubGlobal('fetch', async (input: unknown, init?: Record<string, unknown>) => {
    const url = String(input);
    __fetchCalls.push({ url, init });
    return impl(url, init);
  });
}

/** probe (health / root) 以外の呼出を「来ないはず」 として落とすための既定。 */
function alwaysOk(): void {
  stubFetch(async () => response({ status: 200, json: async () => ({ ids: ['evt-default'] }) }));
}

const { setupInngestEnv } = await import('../src/inngest/setup-inngest-env.js');

type LiveEnv = Awaited<ReturnType<typeof setupInngestEnv>>;

const envs: LiveEnv[] = [];

beforeEach(() => {
  __onKill = null;
  __stopOrder.length = 0;
  __spawnCalls.length = 0;
  __children.length = 0;
  __fetchCalls.length = 0;
  __killThrows = false;
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop().catch(() => {});
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createDevServerInngestEnv — 既存 dev-server への接続', () => {
  it('T-INNGEST-023 url を渡すと process を起動せず /health を叩く', async () => {
    alwaysOk();
    // 末尾 slash を重ねて渡し、 probe URL の組み立てが正規化することも同時に見る。
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { url: 'http://dev.test:8288//', startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(env.mode).toBe('live');
    expect(env.backend).toBe('dev-server');
    expect(env.appId).toBe('kiwa-test-app');
    expect(env.devServerUrl).toBe('http://dev.test:8288//');
    // url 指定の時は起動しない。 これが崩れると外部管理の dev-server を二重に立てる。
    expect(__spawnCalls).toHaveLength(0);
    expect(__fetchCalls).toHaveLength(1);
    expect(__fetchCalls[0]?.url).toBe('http://dev.test:8288/health');
    expect(__fetchCalls[0]?.init).toEqual({ method: 'GET' });
  });

  it('T-INNGEST-024 sendEvent は /e/test-key に event の wire 形を POST する', async () => {
    stubFetch(async (url) => {
      if (url.endsWith('/health')) return response({ status: 200 });
      return response({ status: 200, json: async () => ({ ids: ['evt-from-server'] }) });
    });
    const env = await setupInngestEnv({
      mode: 'dev-server',
      appId: 'billing-app',
      devServer: { url: 'http://dev.test:8288' },
    });
    envs.push(env);

    const before = Date.now();
    const eventId = await env.sendEvent('invoice/paid', { amount: 100 });
    const after = Date.now();

    // 戻り値は dev-server が採番した id。 in-process 側の id で上書きしない。
    expect(eventId).toBe('evt-from-server');

    const post = __fetchCalls[1];
    expect(post?.url).toBe('http://dev.test:8288/e/test-key');
    expect(post?.init?.method).toBe('POST');
    expect(post?.init?.headers).toEqual({ 'content-type': 'application/json' });
    const body = JSON.parse(String(post?.init?.body)) as {
      name: string;
      data: unknown;
      user: unknown;
      ts: number;
    };
    expect(body.name).toBe('invoice/paid');
    expect(body.data).toEqual({ amount: 100 });
    // user は未指定なら空 object を送る (real Inngest の wire 形に合わせるため)。
    expect(body.user).toEqual({});
    expect(body.ts).toBeGreaterThanOrEqual(before);
    expect(body.ts).toBeLessThanOrEqual(after);
  });

  it('T-INNGEST-025 registerFunction した handler は POST 成功後に in-process で走る', async () => {
    // **両側に marker を置く**。 handler だけを記録すると、実装が POST と handler を
    // 逆順にしても `['handler']` のまま通る = 順序を主張しながら順序を見ていない形になる。
    const order: string[] = [];
    stubFetch(async (url) => {
      if (url.endsWith('/health')) return response({ status: 200 });
      order.push('post');
      return response({ status: 200, json: async () => ({ ids: ['evt-1'] }) });
    });
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { url: 'http://dev.test:8288' },
    });
    envs.push(env);

    env.registerFunction<{ x: number }, number>({
      id: 'double-x',
      event: 'math/double',
      handler: async ({ event }) => {
        order.push('handler');
        return event.data.x * 2;
      },
    });
    await env.sendEvent('math/double', { x: 21 });

    const snap = await env.assertFunctionRan<{ x: number }, number>('double-x', {
      returnValue: 42,
    });
    expect(snap.state).toBe('completed');
    // 順序が逆だと dev-server が受理していない event を処理済みとして観測することになる。
    expect(order, 'POST が handler より先に走る').toEqual(['post', 'handler']);
    expect(__fetchCalls[1]?.url).toBe('http://dev.test:8288/e/test-key');
  });

  it('T-INNGEST-026 応答 JSON に ids が無い / 壊れている時は空 id に落とす', async () => {
    let call = 0;
    stubFetch(async (url) => {
      if (url.endsWith('/health')) return response({ status: 200 });
      call += 1;
      // 1 回目 = ids を持たない JSON、 2 回目 = JSON として読めない応答。
      if (call === 1) return response({ status: 200, json: async () => ({}) });
      return response({
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      });
    });
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { url: 'http://dev.test:8288' },
    });
    envs.push(env);

    // どちらも throw せず空文字に落ちる。 id が取れないことは送信の失敗ではない。
    expect(await env.sendEvent('a/b', {})).toBe('');
    expect(await env.sendEvent('a/b', {})).toBe('');
  });

  it('T-INNGEST-027 非 2xx は event 名 / status / body を含めて throw する', async () => {
    stubFetch(async (url) => {
      if (url.endsWith('/health')) return response({ status: 200 });
      return response({ status: 422, text: async () => 'event name is invalid' });
    });
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { url: 'http://dev.test:8288' },
    });
    envs.push(env);

    await expect(env.sendEvent('bad/event', {})).rejects.toThrow(
      /dev-server rejected event "bad\/event" \(HTTP 422\): event name is invalid/,
    );
  });

  it('T-INNGEST-028 body を読めない失敗応答でも status 付きで throw する', async () => {
    stubFetch(async (url) => {
      if (url.endsWith('/health')) return response({ status: 200 });
      return response({
        status: 500,
        text: async () => {
          throw new Error('stream already consumed');
        },
      });
    });
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { url: 'http://dev.test:8288' },
    });
    envs.push(env);

    // body 取得の失敗で例外を差し替えない = 元の失敗 (HTTP 500) が読めなくなるため。
    await expect(env.sendEvent('x/y', {})).rejects.toThrow(/\(HTTP 500\): $/);
  });

  it('T-INNGEST-029 url 指定時の stop() は in-process 側だけを止める', async () => {
    alwaysOk();
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { url: 'http://dev.test:8288' },
    });
    await env.stop();

    // 外部管理の dev-server は落とさない (起動していないため kill 対象も無い)。
    expect(__children).toHaveLength(0);
    await expect(env.sendEvent('x/y', {})).rejects.toThrow(/after stop/);
  });
});

describe('createDevServerInngestEnv — dev-server の起動', () => {
  it('T-INNGEST-030 url 未指定なら npx inngest-cli を既定 port で起動する', async () => {
    alwaysOk();
    const env = await setupInngestEnv({ mode: 'dev-server' });
    envs.push(env);

    expect(__spawnCalls).toHaveLength(1);
    expect(__spawnCalls[0]?.cmd).toBe('npx');
    expect(__spawnCalls[0]?.args).toEqual([
      '-y',
      'inngest-cli@latest',
      'dev',
      '--port',
      '8288',
      '--no-discovery',
    ]);
    // stdio を握らないと子 process の出力が test の出力に混ざる。
    expect(__spawnCalls[0]?.opts.stdio).toBe('ignore');
    expect(__spawnCalls[0]?.opts.env).toBe(process.env);
    // 起動した先の URL は loopback に固定する (外向きに bind しない)。
    expect(env.devServerUrl).toBe('http://127.0.0.1:8288');
    expect(__fetchCalls[0]?.url).toBe('http://127.0.0.1:8288/health');
  });

  it('T-INNGEST-031 port 指定は起動引数と probe 先の両方に効く', async () => {
    alwaysOk();
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { port: 9999, startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(__spawnCalls[0]?.args).toContain('9999');
    expect(env.devServerUrl).toBe('http://127.0.0.1:9999');
    expect(__fetchCalls[0]?.url).toBe('http://127.0.0.1:9999/health');
  });

  it('T-INNGEST-032 probe は起動直後の失敗を再試行する', async () => {
    let attempt = 0;
    stubFetch(async () => {
      attempt += 1;
      // 1 回目 = 接続不能、 2 回目 = 未 ready、 3 回目で ready。
      if (attempt === 1) throw new Error('ECONNREFUSED');
      if (attempt === 2) return response({ status: 503 });
      return response({ status: 200 });
    });
    const env = await setupInngestEnv({
      mode: 'dev-server',
      devServer: { startupTimeoutMs: 3000 },
    });
    envs.push(env);

    // 起動直後は必ず失敗する。 1 回で諦める形だと dev-server 経路が常に落ちる。
    expect(attempt).toBe(3);
    expect(env.devServerUrl).toBe('http://127.0.0.1:8288');
  });

  it('T-INNGEST-033 probe が timeout したら起動した process を止めてから throw する', async () => {
    stubFetch(async () => response({ status: 503 }));
    await expect(
      setupInngestEnv({ mode: 'dev-server', devServer: { startupTimeoutMs: 50 } }),
    ).rejects.toThrow(
      /Inngest dev-server did not respond at http:\/\/127\.0\.0\.1:8288\/health within 50ms/,
    );

    // 起動だけして掴んだままにすると、 test 終了後に子 process が残る。
    expect(__children).toHaveLength(1);
    expect(__children[0]?.killSignals).toEqual(['SIGTERM']);
  });

  it('T-INNGEST-034 stop() は冪等で、 kill が例外を投げても throw しない', async () => {
    alwaysOk();
    const env = await setupInngestEnv({ mode: 'dev-server' });
    __killThrows = true;

    await env.stop();
    // 2 回目は kill 自体を呼ばない (既に停止済のため)。
    await env.stop();

    expect(__children[0]?.killSignals).toEqual(['SIGTERM']);
  });

  it('T-INNGEST-035 起動した process の error は warn する', async () => {
    alwaysOk();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const env = await setupInngestEnv({ mode: 'dev-server' });
    envs.push(env);

    // 実 EventEmitter へ流す。 実装は `proc.once('error', ...)` なので listener は
    // 1 度きり = 同じ child に 2 度 emit しても 2 度目は誰も受け取らない。
    expect(__children[0]?.emit('error', new Error('spawn ENOENT')), '1 度目は listener が受ける').toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('Inngest dev-server exited with error');

    // `once` なので listener は 1 度目で外れる。 実 EventEmitter は listener の無い
    // `error` を throw するため、**2 度目が throw すること自体**が除去の証拠になる。
    expect(
      () => __children[0]?.emit('error', new Error('again')),
      '2 度目は once で外れている (listener 不在の error は throw する)',
    ).toThrow('again');
    expect(warn, 'once なので warn は増えない').toHaveBeenCalledTimes(1);
  });

  it('T-INNGEST-035b stop 後に初めて起きた error は黙る', async () => {
    alwaysOk();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const env = await setupInngestEnv({ mode: 'dev-server' });

    // **stop 前に 1 度も emit しない**。 同じ child で 2 度目を撃つ形は `once` では
    // 作れないため、stop 後分岐は「初回 emit が stop の後」 でしか到達しない。
    await env.stop();
    expect(__children[0]?.emit('error', new Error('SIGTERM')), 'listener はまだ生きている').toBe(true);
    expect(warn, 'stop 後の error は意図した停止の副作用なので黙る').not.toHaveBeenCalled();
  });

  it('T-INNGEST-036 stop() は in-process 側を止めてから process を落とす', async () => {
    // 停止後の 2 状態だけを見ると逆順でも通る。 起きた順を 1 本の列に積んで比べる。
    alwaysOk();
    const env = await setupInngestEnv({ mode: 'dev-server' });
    env.registerFunction({
      id: 'noop',
      event: 'stop/event',
      handler: async () => 'ok',
    });
    await env.sendEvent('stop/event', {});
    await env.assertFunctionRan('noop');

    __stopOrder.length = 0;
    // in-process 側が止まると `registerFunction` は throw する (stub env の契約)。
    // kill の瞬間にそれを問えば、逆順にした時だけ落ちる。
    __onKill = () => {
      let innerStopped = false;
      try {
        env.registerFunction({ id: 'probe', event: 'probe/e', handler: async () => 'x' });
      } catch {
        innerStopped = true;
      }
      __stopOrder.push(innerStopped ? 'inner' : 'inner-still-running');
      __stopOrder.push('process');
    };

    await env.stop();

    expect(__children[0]?.killSignals).toEqual(['SIGTERM']);
    await expect(env.sendEvent('stop/event', {})).rejects.toThrow(/after stop/);
    expect(
      __stopOrder,
      'kill の時点で in-process 側が既に止まっている (逆順なら inner-still-running になる)',
    ).toEqual(['inner', 'process', 'process']);
  });
});
