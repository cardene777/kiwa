/**
 * `src/sqs/localstack-sqs.ts` の成功経路を in-process で通す検査 (Issue #2166)。
 *
 * この adapter は LocalStack の health endpoint で疎通を確かめてから env を組み、
 * message の状態は stub 実装が持つ。 既存の検査は届かない endpoint を渡して timeout を
 * 見るだけで、 LocalStack が生きていた場合 (probe 先の組み立て / 委譲) を通していない。
 *
 * 差し替えるのは global の `fetch` だけ。 stub env は実物を使う。 確かめたいのは
 * adapter が「どこを叩き、 何を委譲するか」 であって、 message の遷移ではない。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FetchCall {
  url: string;
  init: { signal?: unknown } | undefined;
}

const __fetchCalls: FetchCall[] = [];

function stubFetch(impl: (url: string) => Promise<{ ok: boolean; status: number }>): void {
  vi.stubGlobal('fetch', async (input: unknown, init?: FetchCall['init']) => {
    const url = String(input);
    __fetchCalls.push({ url, init });
    return impl(url);
  });
}

/** health endpoint が 200 を返す LocalStack。 */
function healthyLocalstack(): void {
  stubFetch(async () => ({ ok: true, status: 200 }));
}

const { setupSQSEnv } = await import('../src/sqs/setup-sqs-env.js');

type Env = Awaited<ReturnType<typeof setupSQSEnv>>;

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

describe('createLocalstackSQSEnv — 疎通確認', () => {
  it('T-SQS-041 endpoint の末尾 slash を正規化して health を叩く', async () => {
    healthyLocalstack();
    const env = await setupSQSEnv({
      mode: 'localstack',
      localstack: { endpoint: 'http://localstack.test:4566//', startupTimeoutMs: 1000 },
    });
    envs.push(env);

    expect(env.mode).toBe('live');
    expect(env.backend).toBe('localstack');
    expect(env.endpoint).toBe('http://localstack.test:4566//');
    expect(__fetchCalls).toHaveLength(1);
    // slash を潰さないと `//_localstack/health` になり 404 で永久に ready にならない。
    expect(__fetchCalls[0]?.url).toBe('http://localstack.test:4566/_localstack/health');
    // 応答が返らない時に諦められるよう signal を渡す。
    expect(__fetchCalls[0]?.init?.signal).toBeDefined();
  });

  it('T-SQS-042 起動途中の失敗は再試行し、 200 が返った時点で先へ進む', async () => {
    let attempt = 0;
    stubFetch(async () => {
      attempt += 1;
      // 1 回目 = 接続不能、 2 回目 = 起動中 (503)、 3 回目で ready。
      if (attempt === 1) throw new Error('ECONNREFUSED');
      if (attempt === 2) return { ok: false, status: 503 };
      return { ok: true, status: 200 };
    });
    const env = await setupSQSEnv({
      mode: 'localstack',
      localstack: { endpoint: 'http://localstack.test:4566', startupTimeoutMs: 3000 },
    });
    envs.push(env);

    expect(attempt).toBe(3);
    expect(env.endpoint).toBe('http://localstack.test:4566');
  });

  it('T-SQS-043 timeout 時は最後に観測した HTTP status を理由に載せる', async () => {
    stubFetch(async () => ({ ok: false, status: 502 }));
    // 理由が空だと「起動していない」 と「起動したが健康でない」 を切り分けられない。
    await expect(
      setupSQSEnv({
        mode: 'localstack',
        localstack: { endpoint: 'http://localstack.test:4566', startupTimeoutMs: 50 },
      }),
    ).rejects.toThrow(
      /LocalStack at "http:\/\/localstack\.test:4566" did not respond within 50ms — probe returned HTTP 502/,
    );
  });

  it('T-SQS-044 timeout 時は通信そのものの失敗も理由に載せる', async () => {
    stubFetch(async () => {
      throw new Error('getaddrinfo ENOTFOUND localstack.test');
    });
    await expect(
      setupSQSEnv({
        mode: 'localstack',
        localstack: { endpoint: 'http://localstack.test:4566', startupTimeoutMs: 50 },
      }),
    ).rejects.toThrow(/did not respond within 50ms — getaddrinfo ENOTFOUND localstack\.test/);
  });
});

describe('createLocalstackSQSEnv — stub 実装への委譲', () => {
  async function makeEnv(queues?: Parameters<typeof setupSQSEnv>[0]): Promise<Env> {
    healthyLocalstack();
    const env = await setupSQSEnv({
      ...queues,
      mode: 'localstack',
      localstack: { endpoint: 'http://localstack.test:4566', startupTimeoutMs: 1000 },
    });
    envs.push(env);
    return env;
  }

  it('T-SQS-045 起動時 provision と createQueue が queues getter に反映される', async () => {
    const env = await makeEnv({ queues: [{ name: 'emails' }] });

    expect(env.queues).toEqual(['emails']);
    await env.createQueue({ name: 'notifications' });
    // getter が inner を参照していないと、 後から作った queue が見えない。
    expect(env.queues.sort()).toEqual(['emails', 'notifications']);
  });

  it('T-SQS-046 send / receive / delete が委譲され、 状態も観測できる', async () => {
    const env = await makeEnv({ queues: [{ name: 'q' }] });

    const snap = await env.send('q', { id: '1' }, { delaySeconds: 0 });
    expect(snap.queueName).toBe('q');
    expect(snap.messageId).toBeTypeOf('string');
    expect(snap.receiveCount).toBe(0);

    const received = await env.receive<{ id: string }>('q');
    expect(received).toHaveLength(1);
    expect(received[0]?.body).toEqual({ id: '1' });
    received[0]?.delete();

    const deleted = await env.assertDeleted('q', { receiveCount: 1 });
    expect(deleted.state).toBe('deleted');
    expect(env.listMessages('q')).toHaveLength(1);
    await env.assertQueueDrained('q');

    // message の往復では wire を使わない (v0.2 scope)。
    expect(__fetchCalls).toHaveLength(1);
  });

  it('T-SQS-047 sendBatch / deleteBatch が receiptHandle 経由で委譲される', async () => {
    const env = await makeEnv({ queues: [{ name: 'q' }] });

    const snaps = await env.sendBatch('q', [
      { id: 'a', body: { id: 'a' } },
      { id: 'b', body: { id: 'b' } },
    ]);
    expect(snaps).toHaveLength(2);

    const received = await env.receive('q', { maxMessages: 10 });
    expect(received).toHaveLength(2);
    await env.deleteBatch(
      'q',
      received.map((r) => ({ id: r.messageId, receiptHandle: r.receiptHandle })),
    );
    expect(await env.receive('q')).toHaveLength(0);
  });

  it('T-SQS-048 waitForMessage が終端まで待つ', async () => {
    const env = await makeEnv({ queues: [{ name: 'q' }] });

    await env.send('q', { id: '1' });
    // 受信 → 削除を非同期に走らせ、 待ち側が終端を観測できることを見る。
    void (async () => {
      const received = await env.receive('q');
      received[0]?.delete();
    })();

    const snap = await env.waitForMessage<{ id: string }>('q', { timeoutMs: 1000 });
    expect(snap.state).toBe('deleted');
  });

  it('T-SQS-049 DLQ 経路の観測も委譲される', async () => {
    const env = await makeEnv({
      queues: [
        {
          name: 'src',
          visibilityTimeoutSeconds: 0.05,
          redrivePolicy: { deadLetterTargetArn: 'dlq', maxReceiveCount: 2 },
        },
        { name: 'dlq' },
      ],
    });

    await env.send('src', { id: '1' });
    // maxReceiveCount を超えるまで受信し直す。
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await env.receive('src');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 100);
        (timer as unknown as { unref?: () => void }).unref?.();
      });
    }

    const dead = await env.assertDeadLettered('src', { dlq: 'dlq', receiveCount: 3 });
    expect(dead.state).toBe('dead');
    expect(env.listDeadLetters('dlq')).toHaveLength(1);
  });

  it('T-SQS-050 stop() は in-process 側まで届く', async () => {
    const env = await makeEnv({ queues: [{ name: 'q' }] });

    await env.send('q', { id: '1' });
    await env.stop();
    envs.pop();

    // stop が素通しなら send がそのまま通ってしまう。
    await expect(env.send('q', { id: '2' })).rejects.toThrow(/after stop/);
    expect(env.queues).toEqual([]);
  });
});
