/**
 * `src/testcontainers-queue.ts` を in-process の代替実装で覆う検査 (Issue #1939)。
 *
 * この file は BullMQ / ioredis / testcontainers を `await import` で受け取り、
 * duck-typed な interface 越しに使う。 実体を起動しないと 1 行も通らない形に見えるが、
 * import の対象を差し替えれば全経路が in-process で走る。
 *
 * 同じ構造の `cache/src/testcontainers-cache.ts` が
 * `cache/tests/semantics/coverage-fill.test.ts` で 98.91% (363/367) に達しており、
 * 本 file はその形をなぞる。
 *
 * ## 代替実装が何を模しているか
 *
 * BullMQ の Queue は追加した job を保持し、`getJobs` で状態つきの候補を返す。
 * Worker は登録された処理関数を保持するだけで、実行の契機は検査側が握る
 * (`__runWorker`)。 これは「job が処理された」 状態を検査が任意の順で作れるようにするため。
 *
 * 実体との差は BullMQ 自身が抽象している範囲に閉じる。 本 file が確かめるのは
 * `testcontainers-queue.ts` の分岐であって BullMQ の挙動ではない。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// 代替実装が共有する状態。 vi.mock の factory は巻き上げられるため、
// module scope に置いて factory からは参照だけを行う。
// ---------------------------------------------------------------------------

interface FakeJobRecord {
  id: string;
  name: string;
  data: unknown;
  attemptsMade: number;
  state: string;
  returnvalue?: unknown;
  failedReason?: string;
}

const __jobs: FakeJobRecord[] = [];
const __workers: FakeWorker[] = [];
const __closedWorkers: FakeWorker[] = [];
const __redisClients: FakeRedis[] = [];
const __containers: FakeContainer[] = [];

/** `quit()` を失敗させて `disconnect()` への退避経路を通すための切替。 */
let __quitRejects = false;
/** `getWaitingCount` 等が返す残数。 drain 待ちの分岐を作るために使う。 */
let __pendingCounts: Array<[number, number, number]> = [];
/** container の `start()` が返す host / port。 */
let __containerHost = 'fake-host';

let __jobSeq = 0;

class FakeQueue {
  closed = false;
  constructor(
    public readonly name: string,
    public readonly opts: { connection: unknown },
  ) {}

  async add(
    name: string,
    data: unknown,
    opts?: { attempts?: number; delay?: number; jobId?: string },
  ): Promise<{ id?: string; name: string; data: unknown }> {
    __jobSeq += 1;
    const id = opts?.jobId ?? `job-${__jobSeq}`;
    __jobs.push({ id, name, data, attemptsMade: 0, state: 'wait' });
    return { id, name, data };
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  async getWaitingCount(): Promise<number> {
    return __pendingCounts.length > 0 ? (__pendingCounts[0]?.[0] ?? 0) : 0;
  }

  async getActiveCount(): Promise<number> {
    return __pendingCounts.length > 0 ? (__pendingCounts[0]?.[1] ?? 0) : 0;
  }

  async getDelayedCount(): Promise<number> {
    const entry = __pendingCounts.shift();
    return entry ? entry[2] : 0;
  }

  async getJobs(states: string[]): Promise<
    Array<{
      id?: string;
      name: string;
      data: unknown;
      attemptsMade: number;
      returnvalue?: unknown;
      failedReason?: string;
      getState: () => Promise<string>;
    }>
  > {
    return __jobs
      .filter((job) => states.includes(job.state))
      .map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        attemptsMade: job.attemptsMade,
        ...(job.returnvalue !== undefined ? { returnvalue: job.returnvalue } : {}),
        ...(job.failedReason !== undefined ? { failedReason: job.failedReason } : {}),
        getState: async () => job.state,
      }));
  }
}

class FakeWorker {
  closed = false;
  constructor(
    public readonly name: string,
    public readonly handler: (job: {
      id?: string;
      name: string;
      data: unknown;
      attemptsMade: number;
    }) => Promise<unknown>,
    public readonly opts: { connection: unknown; concurrency: number },
  ) {
    __workers.push(this);
  }

  async close(): Promise<void> {
    this.closed = true;
    __closedWorkers.push(this);
  }
}

class FakeRedis {
  disconnected = false;
  quitCalls = 0;
  constructor(
    public readonly url: string,
    public readonly opts: { maxRetriesPerRequest: null },
  ) {
    __redisClients.push(this);
  }

  async quit(): Promise<string> {
    this.quitCalls += 1;
    if (__quitRejects) throw new Error('quit refused');
    return 'OK';
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

class FakeContainer {
  readonly exposed: number[] = [];
  stopped = false;
  constructor(public readonly image: string) {
    __containers.push(this);
  }

  withExposedPorts(port: number): this {
    this.exposed.push(port);
    return this;
  }

  async start(): Promise<{
    stop: () => Promise<void>;
    getHost: () => string;
    getMappedPort: (port: number) => number;
  }> {
    return {
      stop: async () => {
        this.stopped = true;
      },
      getHost: () => __containerHost,
      getMappedPort: (port: number) => port + 1000,
    };
  }
}

vi.mock('bullmq', () => ({ Queue: FakeQueue, Worker: FakeWorker }));
vi.mock('ioredis', () => ({ default: FakeRedis }));
vi.mock('testcontainers', () => ({ GenericContainer: FakeContainer }));

const { createTestcontainersBullMQEnv } = await import('../../src/testcontainers-queue.js');

/** 登録済み worker に job を流し、戻り値または失敗理由を job に書き戻す。 */
async function runWorker(jobName: string): Promise<void> {
  const worker = __workers[__workers.length - 1];
  if (!worker) throw new Error('worker が登録されていない');
  const job = __jobs.find((j) => j.name === jobName);
  if (!job) throw new Error(`job ${jobName} が無い`);
  job.attemptsMade += 1;
  try {
    const result = await worker.handler({
      id: job.id,
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
    });
    job.state = 'completed';
    if (result !== undefined) job.returnvalue = result;
  } catch (caught) {
    job.state = 'failed';
    job.failedReason = caught instanceof Error ? caught.message : String(caught);
  }
}

const envs: Array<{ stop: () => Promise<void> }> = [];

beforeEach(() => {
  __jobs.length = 0;
  __workers.length = 0;
  __closedWorkers.length = 0;
  __redisClients.length = 0;
  __containers.length = 0;
  __quitRejects = false;
  __pendingCounts = [];
  __containerHost = 'fake-host';
  __jobSeq = 0;
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop().catch(() => {});
  }
});

describe('createTestcontainersBullMQEnv — 接続先の決め方', () => {
  it('url を渡すと container を起動しない', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://given:6379' },
    });
    envs.push(env);

    expect(env.mode).toBe('live');
    expect(env.backend).toBe('testcontainers');
    expect(env.queueName).toBe('q');
    expect(env.redisUrl).toBe('redis://given:6379');
    expect(__containers).toHaveLength(0);
  });

  it('url が無ければ container を起動し、その host と port から url を組む', async () => {
    __containerHost = 'container-host';
    const env = await createTestcontainersBullMQEnv({ queueName: 'q' });
    envs.push(env);

    expect(__containers).toHaveLength(1);
    expect(__containers[0]?.image).toBe('redis:7-alpine');
    expect(__containers[0]?.exposed).toEqual([6379]);
    expect(env.redisUrl).toBe('redis://container-host:7379');
  });

  it('image を指定すると既定ではなくその image を使う', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { image: 'redis:6' },
    });
    envs.push(env);

    expect(__containers[0]?.image).toBe('redis:6');
  });
});

describe('createTestcontainersBullMQEnv — job の追加と観測', () => {
  it('addJob は待機中の snapshot を返す', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    const snap = await env.addJob('greet', { to: 'a' });
    expect(snap).toEqual({
      id: 'job-1',
      name: 'greet',
      data: { to: 'a' },
      state: 'waiting',
      attemptsMade: 0,
    });
  });

  it('addJob は attempts / delay / jobId を指定した時だけ渡す', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    const snap = await env.addJob('greet', { to: 'a' }, { attempts: 3, delay: 10, jobId: 'fixed' });
    expect(snap.id).toBe('fixed');
  });

  it('処理が終わった job を assertProcessed が返す', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    env.process(async () => ({ ok: true }));
    await env.addJob('greet', { to: 'a' });
    await runWorker('greet');

    const snap = await env.assertProcessed('greet', { returnValue: { ok: true } });
    expect(snap.state).toBe('completed');
    expect(snap.returnValue).toEqual({ ok: true });
  });

  it('処理関数を登録していない worker は戻り値を持たない', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    env.process(async () => 'first');
    // 2 度目の登録で worker を差し替える。 差し替え前の worker は閉じられる。
    env.process(async () => 'second');
    await env.addJob('greet', {});
    await runWorker('greet');

    const snap = await env.assertProcessed('greet');
    expect(snap.returnValue).toBe('second');
    expect(__closedWorkers).toHaveLength(1);
  });

  it('戻り値が期待と違えば assertProcessed が落ちる', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    env.process(async () => ({ ok: false }));
    await env.addJob('greet', {});
    await runWorker('greet');

    await expect(env.assertProcessed('greet', { returnValue: { ok: true } })).rejects.toThrow(
      /return value mismatch/,
    );
  });

  it('完了していない job に assertProcessed を使うと落ちる', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    env.process(async () => {
      throw new Error('boom');
    });
    await env.addJob('greet', {});
    await runWorker('greet');

    await expect(env.assertProcessed('greet')).rejects.toThrow(/expected job "greet" to complete/);
  });
});

describe('createTestcontainersBullMQEnv — 失敗と再試行', () => {
  async function failingEnv(reason: string) {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);
    env.process(async () => {
      throw new Error(reason);
    });
    await env.addJob('greet', {});
    await runWorker('greet');
    return env;
  }

  it('失敗した job を assertFailed が返す', async () => {
    const env = await failingEnv('boom');
    const snap = await env.assertFailed('greet');
    expect(snap.state).toBe('failed');
    expect(snap.failedReason).toBe('boom');
  });

  it('失敗理由が指定した形と合わなければ落ちる', async () => {
    const env = await failingEnv('boom');
    await expect(env.assertFailed('greet', { reasonMatch: /timeout/ })).rejects.toThrow(
      /did not match/,
    );
  });

  it('試行回数が期待と違えば assertFailed が落ちる', async () => {
    const env = await failingEnv('boom');
    await expect(env.assertFailed('greet', { retry: 3 })).rejects.toThrow(
      /expected 3 attempt\(s\), observed 1/,
    );
  });

  it('失敗していない job に assertFailed を使うと落ちる', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('greet', {});
    await runWorker('greet');

    await expect(env.assertFailed('greet')).rejects.toThrow(/expected job "greet" to fail/);
  });

  it('assertRetried は試行回数が一致する時だけ通る', async () => {
    const env = await failingEnv('boom');
    const snap = await env.assertRetried('greet', 1);
    expect(snap.attemptsMade).toBe(1);
    await expect(env.assertRetried('greet', 2)).rejects.toThrow(/expected 2 attempt\(s\)/);
  });
});

describe('createTestcontainersBullMQEnv — 待機と枯渇', () => {
  it('待っても終わらない job は timeout する', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);
    await env.addJob('slow', {});

    await expect(env.waitForJob('slow', { timeoutMs: 60 })).rejects.toThrow(
      /timeout waiting for job "slow"/,
    );
  });

  it('残数が 0 になれば assertQueueDrained は返る', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    // 1 巡目は残っていて、2 巡目で 0 になる。 待機の分岐を通す。
    __pendingCounts = [
      [1, 0, 0],
      [0, 0, 0],
    ];
    await expect(env.assertQueueDrained()).resolves.toBeUndefined();
  });

  it('残り続ける場合は assertQueueDrained が落ちる', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    // 常に 1 件残す。 shift しても空になったら 0 が返るため、十分な数を積む。
    __pendingCounts = Array.from({ length: 45 }, () => [1, 0, 0] as [number, number, number]);
    await expect(env.assertQueueDrained()).rejects.toThrow(/still has waiting/);
  });

  it('listJobs は同期の形を保つため常に空を返す', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);

    await env.addJob('greet', {});
    expect(env.listJobs()).toEqual([]);
  });
});

describe('createTestcontainersBullMQEnv — 状態の解釈', () => {
  /** job を任意の状態に置いて waitForJob / fetchSnapshot の解釈を見る。 */
  async function envWithJobStates(states: string[]) {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    envs.push(env);
    for (const state of states) {
      __jobs.push({ id: `id-${state}`, name: 'greet', data: {}, attemptsMade: 0, state });
    }
    return env;
  }

  it('完了と失敗が混ざる時は完了を優先する', async () => {
    const env = await envWithJobStates(['failed', 'completed']);
    const snap = await env.waitForJob('greet');
    expect(snap.state).toBe('completed');
    expect(snap.id).toBe('id-completed');
  });

  it('完了が無ければ失敗を採る', async () => {
    const env = await envWithJobStates(['active', 'failed']);
    const snap = await env.waitForJob('greet');
    expect(snap.state).toBe('failed');
  });

  it('待機中の状態名を正規化する', async () => {
    const env = await envWithJobStates(['waiting']);
    await expect(env.waitForJob('greet', { timeoutMs: 40 })).rejects.toThrow(/timeout/);
  });

  it('名前が合う job が無ければ待ち続けて timeout する', async () => {
    const env = await envWithJobStates(['completed']);
    await expect(env.waitForJob('other', { timeoutMs: 40 })).rejects.toThrow(/timeout/);
  });
});

describe('createTestcontainersBullMQEnv — 後始末', () => {
  it('stop は worker と接続と container を順に閉じる', async () => {
    const env = await createTestcontainersBullMQEnv({ queueName: 'q' });
    env.process(async () => 'ok');

    await env.stop();

    expect(__closedWorkers).toHaveLength(1);
    expect(__containers[0]?.stopped).toBe(true);
    // 接続は queue 用と worker 用の 2 本。 どちらも quit を通る。
    expect(__redisClients).toHaveLength(2);
    expect(__redisClients.every((client) => client.quitCalls === 1)).toBe(true);
  });

  it('quit が失敗した接続は disconnect に退避する', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });
    env.process(async () => 'ok');
    __quitRejects = true;

    await env.stop();

    expect(__redisClients.every((client) => client.disconnected)).toBe(true);
  });

  it('worker を登録していなくても stop は通る', async () => {
    const env = await createTestcontainersBullMQEnv({
      queueName: 'q',
      redis: { url: 'redis://x:6379' },
    });

    await expect(env.stop()).resolves.toBeUndefined();
    expect(__closedWorkers).toHaveLength(0);
  });
});
