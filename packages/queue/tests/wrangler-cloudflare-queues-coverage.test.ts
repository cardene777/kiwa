/**
 * `src/cloudflare-queues/wrangler-cloudflare-queues.ts` の成功経路を in-process で
 * 通す検査 (Issue #2166)。
 *
 * この adapter は `wrangler dev --local` を起こして疎通を確かめ、 message の流れ自体は
 * miniflare 側の in-process 実装に委ねる。 既存の検査は届かない URL を渡して
 * `did not respond` を見るだけで、 起動できた後 (委譲 / 片付けの順) を通していない。
 *
 * ## 何を差し替えるか
 *
 * - `node:child_process` の `spawn` ... 実 process を起こさないため
 * - global の `fetch` ... 実 network に出ないため
 *
 * miniflare 側の env は実物を使う。 確かめたいのは wrangler adapter の組み立てで、
 * message lifecycle の正しさは miniflare 側の検査が別に持つ。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudflareQueueBatch } from '../src/index.js';

// ---------------------------------------------------------------------------
// spawn の代替。 vi.mock の factory は巻き上げられるため状態は module scope に置く。
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

class FakeChild {
  readonly killSignals: string[] = [];
  readonly onceListeners = new Map<string, (...args: unknown[]) => void>();
  readonly onListeners = new Map<string, (...args: unknown[]) => void>();

  kill(signal?: string): boolean {
    this.killSignals.push(signal ?? '');
    if (__killThrows) throw new Error('kill refused');
    return true;
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    this.onceListeners.set(event, listener);
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.onListeners.set(event, listener);
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
// fetch の代替。 wrangler の probe は status しか読まない。
// ---------------------------------------------------------------------------

const __fetchCalls: Array<{ url: string; init: Record<string, unknown> | undefined }> = [];

function stubFetch(
  impl: (url: string) => Promise<{ status: number }>,
): void {
  vi.stubGlobal('fetch', async (input: unknown, init?: Record<string, unknown>) => {
    const url = String(input);
    __fetchCalls.push({ url, init });
    return impl(url);
  });
}

const { setupCloudflareQueuesEnv } = await import(
  '../src/cloudflare-queues/setup-cloudflare-queues-env.js'
);

type Env = Awaited<ReturnType<typeof setupCloudflareQueuesEnv>>;

const envs: Env[] = [];

beforeEach(() => {
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

describe('createWranglerCloudflareQueuesEnv — 既存 wrangler への接続', () => {
  it('T-CFQ-033 url を渡すと process を起動せず root を叩く', async () => {
    stubFetch(async () => ({ status: 200 }));
    // 末尾 slash を重ねて渡し、 probe 先の正規化も同時に見る。
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { url: 'http://wr.test:8787//', startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(env.mode).toBe('live');
    expect(env.backend).toBe('wrangler');
    expect(env.devServerUrl).toBe('http://wr.test:8787//');
    expect(__spawnCalls).toHaveLength(0);
    expect(__fetchCalls).toHaveLength(1);
    expect(__fetchCalls[0]?.url).toBe('http://wr.test:8787');
    expect(__fetchCalls[0]?.init).toEqual({ method: 'GET' });
  });

  it('T-CFQ-034 route を持たない worker が返す 404 も「起動済」 と読む', async () => {
    // wrangler dev は route 未定義でも port を握る。 200 だけを ready とすると
    // 空の worker を立てた開発者が永久に timeout する。
    stubFetch(async () => ({ status: 404 }));
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { url: 'http://wr.test:8787', startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(env.devServerUrl).toBe('http://wr.test:8787');
    expect(__fetchCalls).toHaveLength(1);
  });

  it('T-CFQ-035 queues / send / consumer は miniflare 側に委譲される', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      queues: ['emails'],
      wrangler: { url: 'http://wr.test:8787' },
    });
    envs.push(env);

    // 事前 provision した queue 名が getter から見える = inner を参照している。
    expect(env.queues).toEqual(['emails']);

    const observed: string[] = [];
    env.registerConsumer<{ userId: string }>({
      queue: 'emails',
      handler: (batch: CloudflareQueueBatch<{ userId: string }>) => {
        for (const msg of batch.messages) {
          observed.push(msg.body.userId);
          msg.ack();
        }
      },
    });
    const snapshot = await env.send('emails', { userId: 'u-1' });
    expect(snapshot.queueName).toBe('emails');

    const acked = await env.assertAcknowledged<{ userId: string }>('emails');
    expect(acked.state).toBe('ack');
    expect(observed).toEqual(['u-1']);
    await env.assertQueueDrained('emails');
    expect(env.listMessages('emails')).toHaveLength(1);
    expect(env.listDeadLetters()).toEqual([]);

    // 起動確認の 1 回だけで、 message の往復では wire を使わない (v0.2 scope)。
    expect(__fetchCalls).toHaveLength(1);
  });

  it('T-CFQ-036 retry / DLQ の観測も miniflare 側の結果がそのまま見える', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { url: 'http://wr.test:8787' },
    });
    envs.push(env);

    env.registerConsumer({
      queue: 'jobs',
      maxRetries: 2,
      deadLetterQueue: 'jobs-dlq',
      handler: (batch) => {
        batch.retryAll();
      },
    });
    await env.send('jobs', { n: 1 });

    const retried = await env.assertRetried('jobs', 2);
    expect(retried.attempts).toBeGreaterThanOrEqual(2);
    const dead = await env.assertDeadLettered('jobs', { dlq: 'jobs-dlq' });
    expect(dead.state).toBe('dead');
    expect(env.listDeadLetters('jobs-dlq')).toHaveLength(1);
  });

  it('T-CFQ-037 url 指定時の stop() は in-process 側だけを止める', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { url: 'http://wr.test:8787' },
    });
    await env.stop();

    expect(__children).toHaveLength(0);
    await expect(env.send('emails', {})).rejects.toThrow(/after stop/);
  });
});

describe('createWranglerCloudflareQueuesEnv — wrangler の起動', () => {
  it('T-CFQ-038 url 未指定なら npx wrangler dev を既定 port + --local で起動する', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({ mode: 'wrangler' });
    envs.push(env);

    expect(__spawnCalls).toHaveLength(1);
    expect(__spawnCalls[0]?.cmd).toBe('npx');
    // --local が落ちると Cloudflare の本番 edge に接続しにいく。
    expect(__spawnCalls[0]?.args).toEqual([
      '-y',
      'wrangler@latest',
      'dev',
      '--port',
      '8787',
      '--local',
    ]);
    expect(__spawnCalls[0]?.opts.stdio).toBe('ignore');
    expect(__spawnCalls[0]?.opts.env).toBe(process.env);
    expect(env.devServerUrl).toBe('http://127.0.0.1:8787');
    expect(__fetchCalls[0]?.url).toBe('http://127.0.0.1:8787');
  });

  it('T-CFQ-039 port 指定は起動引数と probe 先の両方に効く', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { port: 8123, startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(__spawnCalls[0]?.args).toContain('8123');
    expect(env.devServerUrl).toBe('http://127.0.0.1:8123');
    expect(__fetchCalls[0]?.url).toBe('http://127.0.0.1:8123');
  });

  it('T-CFQ-040 probe は bind 前の接続失敗を再試行する', async () => {
    let attempt = 0;
    stubFetch(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('ECONNREFUSED');
      return { status: 500 };
    });
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { startupTimeoutMs: 3000 },
    });
    envs.push(env);

    // 2 回目の 500 で ready と判定する = 応答が返る = port を握っている。
    expect(attempt).toBe(2);
  });

  it('T-CFQ-041 probe が timeout したら起動した process を止めてから throw する', async () => {
    stubFetch(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(
      setupCloudflareQueuesEnv({ mode: 'wrangler', wrangler: { startupTimeoutMs: 50 } }),
    ).rejects.toThrow(
      /wrangler dev did not respond at http:\/\/127\.0\.0\.1:8787 within 50ms/,
    );

    expect(__children).toHaveLength(1);
    expect(__children[0]?.killSignals).toEqual(['SIGTERM']);
  });

  it('T-CFQ-042 stop() は冪等で、 kill が例外を投げても throw しない', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({ mode: 'wrangler' });
    __killThrows = true;

    await env.stop();
    await env.stop();

    expect(__children[0]?.killSignals).toEqual(['SIGTERM']);
  });

  it('T-CFQ-043 起動した process の error は stop 前だけ warn する', async () => {
    stubFetch(async () => ({ status: 200 }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const env = await setupCloudflareQueuesEnv({ mode: 'wrangler' });

    const onError = __children[0]?.onceListeners.get('error');
    expect(onError).toBeTypeOf('function');
    onError?.(new Error('spawn ENOENT'));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('wrangler dev exited with error');

    await env.stop();
    onError?.(new Error('SIGTERM'));
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('T-CFQ-044 stop() は in-process 側を止めてから process を落とす', async () => {
    stubFetch(async () => ({ status: 200 }));
    const env = await setupCloudflareQueuesEnv({ mode: 'wrangler' });
    await env.send('emails', { n: 1 });

    await env.stop();
    expect(__children[0]?.killSignals).toEqual(['SIGTERM']);
    await expect(env.send('emails', { n: 2 })).rejects.toThrow(/after stop/);
  });
});
