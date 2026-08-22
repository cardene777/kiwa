/**
 * `src/rabbitmq/testcontainers-rabbitmq.ts` の成功経路を in-process で通す検査
 * (Issue #2166)。
 *
 * この adapter は amqp URL から management API の在り処を導き、 aliveness-test で
 * broker の生存を確かめてから env を組む。 message の状態は stub 実装が持つ。
 * 既存の検査は届かない URL を渡して timeout を見るだけで、 broker が生きていた場合
 * (probe URL の組み立て / 認証 header / 委譲) を 1 度も通していない。
 *
 * 差し替えるのは global の `fetch` だけ。 stub env は実物を使う。 確かめたいのは
 * adapter が「どこを叩き、 何を委譲するか」 であって、 message の遷移ではない。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FetchCall {
  url: string;
  init: { headers?: Record<string, string>; signal?: unknown } | undefined;
}

const __fetchCalls: FetchCall[] = [];

function stubFetch(impl: (url: string) => Promise<{ ok: boolean; status: number }>): void {
  vi.stubGlobal('fetch', async (input: unknown, init?: FetchCall['init']) => {
    const url = String(input);
    __fetchCalls.push({ url, init });
    return impl(url);
  });
}

/** aliveness-test が 200 を返す broker。 */
function aliveBroker(): void {
  stubFetch(async () => ({ ok: true, status: 200 }));
}

const { setupRabbitMQEnv } = await import('../src/rabbitmq/setup-rabbitmq-env.js');

type Env = Awaited<ReturnType<typeof setupRabbitMQEnv>>;

const envs: Env[] = [];

beforeEach(() => {
  __fetchCalls.length = 0;
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop().catch(() => {});
  }
  vi.unstubAllGlobals();
});

describe('createTestcontainersRabbitMQEnv — 生存確認', () => {
  it('T-RMQ-045 amqp URL の host から management API を導いて aliveness-test を叩く', async () => {
    aliveBroker();
    const env = await setupRabbitMQEnv({
      mode: 'testcontainers',
      testcontainers: { amqpUrl: 'amqp://broker.test:5672', startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(env.mode).toBe('live');
    expect(env.backend).toBe('testcontainers');
    expect(env.amqpUrl).toBe('amqp://broker.test:5672');
    // amqp の 5672 ではなく management の 15672 を見る。 port を取り違えると
    // 生存確認が必ず失敗する。
    expect(env.managementUrl).toBe('http://broker.test:15672');
    expect(__fetchCalls).toHaveLength(1);
    // vhost `/` は URL encode して渡す。 生のままだと path が 1 段深く解釈される。
    expect(__fetchCalls[0]?.url).toBe(
      'http://broker.test:15672/api/aliveness-test/%2F',
    );
    // 認証情報を持たない URL では header を足さない。
    expect(__fetchCalls[0]?.init?.headers).toEqual({});
    // 応答が返らない時に諦められるよう signal を渡す。
    expect(__fetchCalls[0]?.init?.signal).toBeDefined();
  });

  it('T-RMQ-046 amqp URL に埋めた資格情報を Basic 認証 header に載せる', async () => {
    aliveBroker();
    // guest 以外 + percent encode を含む形で、 復号してから base64 する経路を見る。
    const env = await setupRabbitMQEnv({
      mode: 'testcontainers',
      testcontainers: {
        amqpUrl: 'amqp://kiwa%40app:p%40ss word@broker.test:5672',
        startupTimeoutMs: 1000,
      },
    });
    envs.push(env);

    const auth = __fetchCalls[0]?.init?.headers?.Authorization;
    expect(auth).toBeTypeOf('string');
    const decoded = Buffer.from(String(auth).replace('Basic ', ''), 'base64').toString();
    expect(decoded).toBe('kiwa@app:p@ss word');
  });

  it('T-RMQ-047 amqp URL として解釈できない値でも既定の management 先に落とす', async () => {
    aliveBroker();
    // URL を組めない時に throw すると、 生存確認の前段で理由の分からない失敗になる。
    const env = await setupRabbitMQEnv({
      mode: 'testcontainers',
      testcontainers: { amqpUrl: 'not-a-url', startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(env.amqpUrl).toBe('not-a-url');
    expect(env.managementUrl).toBe('http://localhost:15672');
    expect(__fetchCalls[0]?.url).toBe('http://localhost:15672/api/aliveness-test/%2F');
    expect(__fetchCalls[0]?.init?.headers).toEqual({});
  });

  it('T-RMQ-048 起動途中の失敗は再試行し、 200 が返った時点で先へ進む', async () => {
    let attempt = 0;
    stubFetch(async () => {
      attempt += 1;
      // 1 回目 = 接続不能、 2 回目 = 起動中 (503)、 3 回目で alive。
      if (attempt === 1) throw new Error('ECONNREFUSED');
      if (attempt === 2) return { ok: false, status: 503 };
      return { ok: true, status: 200 };
    });
    const env = await setupRabbitMQEnv({
      mode: 'testcontainers',
      testcontainers: { amqpUrl: 'amqp://broker.test:5672', startupTimeoutMs: 3000 },
    });
    envs.push(env);

    expect(attempt).toBe(3);
    expect(env.managementUrl).toBe('http://broker.test:15672');
  });

  it('T-RMQ-049 timeout 時は最後に観測した HTTP status を理由に載せる', async () => {
    stubFetch(async () => ({ ok: false, status: 503 }));
    // 理由が空だと「落ちている」 と「認証で弾かれている」 を切り分けられない。
    await expect(
      setupRabbitMQEnv({
        mode: 'testcontainers',
        testcontainers: { amqpUrl: 'amqp://broker.test:5672', startupTimeoutMs: 50 },
      }),
    ).rejects.toThrow(
      /RabbitMQ broker at amqp:\/\/broker\.test:5672 did not respond within 50ms: aliveness-test returned HTTP 503/,
    );
  });

  it('T-RMQ-050 timeout 時は通信そのものの失敗も理由に載せる', async () => {
    stubFetch(async () => {
      throw new Error('getaddrinfo ENOTFOUND broker.test');
    });
    await expect(
      setupRabbitMQEnv({
        mode: 'testcontainers',
        testcontainers: { amqpUrl: 'amqp://broker.test:5672', startupTimeoutMs: 50 },
      }),
    ).rejects.toThrow(/did not respond within 50ms: getaddrinfo ENOTFOUND broker\.test/);
  });
});

describe('createTestcontainersRabbitMQEnv — stub 実装への委譲', () => {
  async function makeEnv(): Promise<Env> {
    aliveBroker();
    const env = await setupRabbitMQEnv({
      mode: 'testcontainers',
      exchanges: [{ name: 'ex.direct', type: 'direct' }],
      queues: [{ name: 'q.a' }],
      bindings: [{ exchange: 'ex.direct', queue: 'q.a', routingKey: 'k' }],
      testcontainers: { amqpUrl: 'amqp://broker.test:5672', startupTimeoutMs: 1000 },
    });
    envs.push(env);
    return env;
  }

  it('T-RMQ-051 起動時の topology 宣言と publish / peek が live env でも効く', async () => {
    const env = await makeEnv();

    await env.publish({ exchange: 'ex.direct', routingKey: 'k', body: { id: 1 } });
    expect(env.peek('q.a')).toHaveLength(1);
    expect(env.listPublished()).toHaveLength(1);
    expect(env.listReturned()).toEqual([]);
  });

  it('T-RMQ-052 後から宣言した topology も委譲先に届く', async () => {
    const env = await makeEnv();

    await env.declareExchange({ name: 'ex.topic', type: 'topic' });
    await env.declareQueue({ name: 'q.b' });
    await env.bindQueue({ exchange: 'ex.topic', queue: 'q.b', routingKey: 'a.#' });
    await env.publish({ exchange: 'ex.topic', routingKey: 'a.b', body: { id: 2 } });
    expect(env.peek('q.b')).toHaveLength(1);

    // unbind した後は届かない = bind / unbind が同じ実体を触っている。
    await env.unbindQueue({ exchange: 'ex.topic', queue: 'q.b', routingKey: 'a.#' });
    await env.publish({ exchange: 'ex.topic', routingKey: 'a.c', body: { id: 3 } });
    expect(env.peek('q.b')).toHaveLength(1);
  });

  it('T-RMQ-053 sendToQueue / get / consume と ack 系の観測が委譲される', async () => {
    const env = await makeEnv();

    await env.sendToQueue({ queue: 'q.a', body: { id: 10 } });
    const got = await env.get<{ id: number }>({ queue: 'q.a' });
    expect(got?.body).toEqual({ id: 10 });
    got?.ack();

    await env.sendToQueue({ queue: 'q.a', body: { id: 11 } });
    const seen: number[] = [];
    env.consume<{ id: number }>({
      queue: 'q.a',
      handler: (delivery) => {
        seen.push(delivery.body.id);
        delivery.ack();
      },
    });
    const snap = await env.waitForMessage<{ id: number }>('q.a');
    expect(snap.state).toBe('acked');
    expect(seen).toEqual([11]);

    await env.assertAcknowledged('q.a');
    await env.assertQueueDrained('q.a');
  });

  it('T-RMQ-054 requeue の観測と reset / stop も委譲される', async () => {
    const env = await makeEnv();

    let attempts = 0;
    env.consume({
      queue: 'q.a',
      handler: (delivery) => {
        attempts += 1;
        // 1 回目だけ差し戻し、 2 回目で受理する。
        if (attempts === 1) delivery.nack({ requeue: true });
        else delivery.ack();
      },
    });
    await env.sendToQueue({ queue: 'q.a', body: { id: 20 } });
    await env.assertRequeued('q.a');
    expect(attempts).toBeGreaterThanOrEqual(2);

    await env.reset();
    expect(env.listPublished()).toEqual([]);

    // stop() まで届いていることを、 起動時に宣言した topology が消えることで見る。
    // 消えないと live env の stop が stub を素通ししていることになる。
    await env.declareQueue({ name: 'q.c' });
    await env.sendToQueue({ queue: 'q.c', body: { id: 30 } });
    expect(env.peek('q.c')).toHaveLength(1);
    await env.stop();
    envs.pop();
    await expect(env.get({ queue: 'q.c' })).rejects.toThrow(/queue q\.c not declared/);
    expect(env.peek('q.c')).toEqual([]);
    expect(env.listPublished()).toEqual([]);
  });
});
