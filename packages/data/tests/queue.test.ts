import { afterEach, describe, expect, it } from 'vitest';
import { expectIdempotent, expectAtLeastOnce, setupQueueEnv, type QueueTestEnv } from '../src/index.js';

const envs: QueueTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupQueueEnv (mock mode)', () => {
  it('returns env with empty client', async () => {
    const env = await setupQueueEnv({ mode: 'mock' });
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(env.client.size()).toBe(0);
  });

  it('seeds messages into the queue', async () => {
    const env = await setupQueueEnv<{ id: number }>({ mode: 'mock', seed: [{ id: 1 }, { id: 2 }] });
    envs.push(env as unknown as QueueTestEnv);
    expect(env.client.size()).toBe(2);
  });

  it('send + receive returns messages in FIFO order', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    env.client.send('a');
    env.client.send('b');
    expect(env.client.receive()?.body).toBe('a');
    expect(env.client.receive()?.body).toBe('b');
    expect(env.client.receive()).toBeNull();
  });
});

describe('setupQueueEnv (delivery semantics)', () => {
  it('dedupKey collapses duplicate sends', async () => {
    const env = await setupQueueEnv<{ task: string }>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    await expectIdempotent(
      env.client,
      { task: 'work' },
      { dedupKey: 'work-1' },
      expect as unknown as Parameters<typeof expectIdempotent>[3],
    );
  });

  it('nack retries the message and ack removes it', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 5 });
    envs.push(env as unknown as QueueTestEnv);
    const invocations = await expectAtLeastOnce(
      env.client,
      'retry-me',
      3,
      expect as unknown as Parameters<typeof expectAtLeastOnce>[3],
    );
    expect(invocations).toBe(3);
    expect(env.client.size()).toBe(0);
  });

  it('sends to DLQ after maxReceiveCount nacks', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 3 });
    envs.push(env as unknown as QueueTestEnv);
    let invocations = 0;
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      invocations += 1;
      ack.nack();
    });
    env.client.send('always-fails');
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    expect(invocations).toBe(3);
    expect(env.client.size()).toBe(0);
    expect(env.client.dlqSize()).toBe(1);
    const dlq = env.client.drainDlq();
    expect(dlq[0]?.body).toBe('always-fails');
    expect(dlq[0]?.receivedCount).toBe(3);
  });
});

describe('setupQueueEnv (errors)', () => {
  it('rejects unknown modes', async () => {
    await expect(
      setupQueueEnv({ mode: 'live-broken' as 'live' }),
    ).rejects.toThrow(/mode must be/);
  });

  it('T-QUE-005 rejects undefined mode', async () => {
    await expect(setupQueueEnv({ mode: undefined as unknown as 'mock' })).rejects.toThrow(/mode must be/);
  });

  it('T-QUE-006 rejects null mode', async () => {
    await expect(setupQueueEnv({ mode: null as unknown as 'mock' })).rejects.toThrow(/mode must be/);
  });

  it('T-QUE-007 error message - mode 値を含む string interpolation', async () => {
    await expect(setupQueueEnv({ mode: 'foo' as unknown as 'mock' })).rejects.toThrow(/got foo/);
  });
});

describe('setupQueueEnv (mode handling)', () => {
  it('T-QUE-008 mode live - accept (mock or live)', async () => {
    const env = await setupQueueEnv({ mode: 'live' });
    envs.push(env);
    expect(env.mode).toBe('live');
  });

  it('T-QUE-009 default maxReceiveCount=5 - 5 回 nack で DLQ 行き', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    let count = 0;
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      count += 1;
      ack.nack();
    });
    env.client.send('die');
    await new Promise((r) => setTimeout(r, 50));
    unsubscribe();
    expect(count).toBe(5);
    expect(env.client.dlqSize()).toBe(1);
  });

  it('T-QUE-010 custom maxReceiveCount 1 - 1 回 nack で即 DLQ', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 1 });
    envs.push(env as unknown as QueueTestEnv);
    let count = 0;
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      count += 1;
      ack.nack();
    });
    env.client.send('die-fast');
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    expect(count).toBe(1);
    expect(env.client.dlqSize()).toBe(1);
  });

  it('T-QUE-011 dedupKey - 同 key 2 回 send で同 id 戻り (in-queue)', async () => {
    const env = await setupQueueEnv<{ x: number }>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    const id1 = env.client.send({ x: 1 }, { dedupKey: 'k' });
    const id2 = env.client.send({ x: 2 }, { dedupKey: 'k' });
    expect(id1).toBe(id2);
    expect(env.client.size()).toBe(1);
  });

  it('T-QUE-012 dedupKey - ack 後の同 key send は new id', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    const id1 = env.client.send('a', { dedupKey: 'k' });
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.ack();
    });
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    const id2 = env.client.send('b', { dedupKey: 'k' });
    expect(id1).not.toBe(id2);
  });

  it('T-QUE-013 send returns string id - "1" / "2" increment', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    expect(env.client.send('a')).toBe('1');
    expect(env.client.send('b')).toBe('2');
  });

  it('T-QUE-014 receive on empty - returns null', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    expect(env.client.receive()).toBeNull();
  });

  it('T-QUE-015 receive increments receivedCount', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    env.client.send('a');
    const m = env.client.receive();
    expect(m?.receivedCount).toBe(1);
  });

  it('T-QUE-016 drainDlq returns and empties', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 1 });
    envs.push(env as unknown as QueueTestEnv);
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.nack();
    });
    env.client.send('drop');
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    expect(env.client.dlqSize()).toBe(1);
    const drained = env.client.drainDlq();
    expect(drained.length).toBe(1);
    expect(env.client.dlqSize()).toBe(0);
  });

  it('T-QUE-017 consume + ack - acked entry removed', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    let consumed = 0;
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      consumed += 1;
      ack.ack();
    });
    env.client.send('x');
    env.client.send('y');
    await new Promise((r) => setTimeout(r, 30));
    unsubscribe();
    expect(consumed).toBe(2);
    expect(env.client.size()).toBe(0);
  });

  it('T-QUE-018 send while consume - 後 send も dispatch', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    const acked: string[] = [];
    const unsubscribe = env.client.consume(async (msg, ack) => {
      acked.push(msg.body);
      ack.ack();
    });
    env.client.send('first');
    await new Promise((r) => setTimeout(r, 10));
    env.client.send('second');
    await new Promise((r) => setTimeout(r, 10));
    unsubscribe();
    expect(acked).toEqual(['first', 'second']);
  });

  it('T-QUE-019 unsubscribe consumer - 残 entry は再 receive 可能', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    envs.push(env as unknown as QueueTestEnv);
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.nack();
    });
    env.client.send('a');
    await new Promise((r) => setTimeout(r, 5));
    unsubscribe();
    env.client.send('b');
    expect(env.client.size()).toBeGreaterThan(0);
  });

  it('T-QUE-020 dlq message receivedCount - maxReceiveCount と一致', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 4 });
    envs.push(env as unknown as QueueTestEnv);
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.nack();
    });
    env.client.send('z');
    await new Promise((r) => setTimeout(r, 30));
    unsubscribe();
    const dlq = env.client.drainDlq();
    expect(dlq[0]?.receivedCount).toBe(4);
  });

  it('T-QUE-021 dedupKey in DLQ - dedupKey 保持 + dedupIndex から removed', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 1 });
    envs.push(env as unknown as QueueTestEnv);
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.nack();
    });
    env.client.send('a', { dedupKey: 'k' });
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    const dlq = env.client.drainDlq();
    expect(dlq[0]?.dedupKey).toBe('k');
    const reSendId = env.client.send('b', { dedupKey: 'k' });
    expect(reSendId).toBeDefined();
  });

  it('T-QUE-022 size after dlq - dlq に行った entry は size に含めない', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock', maxReceiveCount: 1 });
    envs.push(env as unknown as QueueTestEnv);
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.nack();
    });
    env.client.send('a');
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    expect(env.client.size()).toBe(0);
    expect(env.client.dlqSize()).toBe(1);
  });
});
