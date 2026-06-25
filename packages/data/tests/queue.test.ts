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
});
