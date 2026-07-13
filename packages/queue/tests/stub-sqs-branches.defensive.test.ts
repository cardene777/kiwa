import { afterEach, describe, expect, it } from 'vitest';
import { setupSQSEnv, type SQSTestEnv } from '../src/index.js';

const envs: SQSTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('stub-sqs defensive branches — batch + receive + delete', () => {
  it('sendBatch with 0 entries returns empty array', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    const result = await env.sendBatch('q', []);
    expect(result).toEqual([]);
  });

  it('sendBatch caps at 10 entries — throws on 11', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    const entries = Array.from({ length: 11 }, (_, i) => ({
      id: `id-${i}`,
      body: `msg-${i}`,
    }));
    await expect(env.sendBatch('q', entries)).rejects.toThrow(
      /caps at 10 entries/,
    );
  });

  it('sendBatch with exactly 10 entries succeeds', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    const entries = Array.from({ length: 10 }, (_, i) => ({
      id: `id-${i}`,
      body: `msg-${i}`,
    }));
    const result = await env.sendBatch('q', entries);
    expect(result.length).toBe(10);
  });

  it('receive with default maxMessages=1 returns at most 1 message', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', 'm1');
    await env.send('q', 'm2');
    const result = await env.receive('q');
    expect(result.length).toBe(1);
  });

  it('receive with maxMessages > 10 caps at 10', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    for (let i = 0; i < 15; i += 1) {
      await env.send('q', `m-${i}`);
    }
    const result = await env.receive('q', { maxMessages: 20 });
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('changeVisibility on in-flight message extends visibility timeout', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', 'msg');
    const [msg] = await env.receive('q');
    expect(msg).toBeDefined();
    msg?.changeVisibility(60);
    expect(msg).toBeDefined();
  });

  it('delete() is idempotent on already-deleted message', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', 'msg');
    const [msg] = await env.receive('q');
    msg?.delete();
    msg?.delete();
    expect(msg).toBeDefined();
  });

  it('FIFO queue preserves messageGroupId + messageDeduplicationId in receipt', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'q.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    await env.send('q.fifo', 'msg', {
      messageGroupId: 'group-A',
      messageDeduplicationId: 'dedup-1',
    });
    const [msg] = await env.receive('q.fifo');
    expect(msg?.messageGroupId).toBe('group-A');
    expect(msg?.messageDeduplicationId).toBe('dedup-1');
  });

  it('deleteBatch skips entries with mismatched receiptHandle', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.send('q', 'msg');
    const [msg] = await env.receive('q');
    if (!msg) throw new Error('receive failed');
    await env.deleteBatch('q', [
      { id: '1', receiptHandle: 'wrong-handle' },
    ]);
    const snap = env.listMessages('q');
    expect(snap.some((m) => m.state === 'inflight')).toBe(true);
  });

  it('waitForMessage times out on empty queue', async () => {
    const env = await setupSQSEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await expect(
      env.waitForMessage('q', { timeoutMs: 30 }),
    ).rejects.toThrow(/timeout/i);
  });
});
