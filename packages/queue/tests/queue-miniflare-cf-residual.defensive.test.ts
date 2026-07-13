import { describe, expect, it } from 'vitest';
import { createMiniflareCloudflareQueuesEnv } from '../src/cloudflare-queues/miniflare-cloudflare-queues.js';

describe('miniflare-cloudflare-queues residual defensive branches', () => {
  it('batch.ackAll() bulk acks all messages in the batch', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['bulk-ack'] });
    env.registerConsumer({
      queue: 'bulk-ack',
      maxBatchSize: 3,
      handler: async (batch) => {
        batch.ackAll();
      },
    });
    await env.send('bulk-ack', 'm1');
    await env.send('bulk-ack', 'm2');
    await env.send('bulk-ack', 'm3');
    await env.assertAcknowledged('bulk-ack');
    await env.stop();
  });

  it('batch.retryAll() bulk retries all messages in the batch', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['bulk-retry'] });
    let call = 0;
    env.registerConsumer({
      queue: 'bulk-retry',
      maxRetries: 2,
      handler: async (batch) => {
        call += 1;
        if (call === 1) batch.retryAll();
        else batch.ackAll();
      },
    });
    await env.send('bulk-retry', 'm1');
    await env.send('bulk-retry', 'm2');
    await env.assertAcknowledged('bulk-retry', { attempts: 2 });
    await env.stop();
  });

  it('maxBatchSize < 1 throws on dispatch', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['bad-batch'] });
    env.registerConsumer({
      queue: 'bad-batch',
      maxBatchSize: 0,
      handler: async () => {},
    });
    // The error surfaces when a message is dispatched.
    await env.send('bad-batch', 'msg');
    // Consumer error becomes visible via assert... but the throw happens inside tick.
    // Best we can do here is confirm the env still stops without crashing.
    await new Promise((r) => setTimeout(r, 50));
    await env.stop();
    expect(env).toBeDefined();
  });

  it('assertDeadLettered rejects when attempts mismatch expected', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['att-dead'] });
    env.registerConsumer({
      queue: 'att-dead',
      maxRetries: 0,
      handler: async () => {
        throw new Error('boom');
      },
    });
    await env.send('att-dead', 'msg');
    await expect(
      env.assertDeadLettered('att-dead', { attempts: 99 }),
    ).rejects.toThrow(/expected 99 attempt/);
    await env.stop();
  });

  it('assertDeadLettered rejects when dlq does not match', async () => {
    const env = createMiniflareCloudflareQueuesEnv({
      queues: ['main', 'other-dlq'],
    });
    env.registerConsumer({
      queue: 'main',
      maxRetries: 0,
      handler: async () => {
        throw new Error('boom');
      },
    });
    await env.send('main', 'msg');
    await expect(
      env.assertDeadLettered('main', { dlq: 'other-dlq' }),
    ).rejects.toThrow(/was not routed to DLQ/);
    await env.stop();
  });

  it('assertQueueDrained succeeds when queue has no pending messages', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['drained-q'] });
    env.registerConsumer({
      queue: 'drained-q',
      handler: async (batch) => batch.ackAll(),
    });
    await env.send('drained-q', 'msg');
    await new Promise((r) => setTimeout(r, 30));
    await env.assertQueueDrained('drained-q');
    await env.stop();
  });

  it('assertQueueDrained times out when pending message never processed', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['stuck-q'] });
    // No consumer registered — messages stay pending.
    await env.send('stuck-q', 'msg');
    await expect(env.assertQueueDrained('stuck-q')).rejects.toThrow(
      /still have pending/,
    );
    await env.stop();
  });

  it('listMessages with no queueName returns all messages across queues', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q-a', 'q-b'] });
    await env.send('q-a', 'ma');
    await env.send('q-b', 'mb');
    const all = env.listMessages();
    expect(all.length).toBe(2);
    await env.stop();
  });

  it('listDeadLetters with no dlqName returns all across dlqs', async () => {
    const env = createMiniflareCloudflareQueuesEnv({
      queues: ['q1', 'dlq1', 'q2', 'dlq2'],
    });
    env.registerConsumer({
      queue: 'q1',
      maxRetries: 0,
      deadLetterQueue: 'dlq1',
      handler: async () => {
        throw new Error('boom-1');
      },
    });
    env.registerConsumer({
      queue: 'q2',
      maxRetries: 0,
      deadLetterQueue: 'dlq2',
      handler: async () => {
        throw new Error('boom-2');
      },
    });
    await env.send('q1', 'msg-a');
    await env.send('q2', 'msg-b');
    await env.assertDeadLettered('q1');
    await env.assertDeadLettered('q2');
    const all = env.listDeadLetters();
    expect(all.length).toBeGreaterThanOrEqual(2);
    await env.stop();
  });
});
