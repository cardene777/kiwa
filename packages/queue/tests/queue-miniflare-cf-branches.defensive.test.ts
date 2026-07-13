import { describe, expect, it } from 'vitest';
import { createMiniflareCloudflareQueuesEnv } from '../src/cloudflare-queues/miniflare-cloudflare-queues.js';

describe('miniflare-cloudflare-queues advanced defensive branches', () => {
  it('message exceeds maxRetries → dead-lettered with reason', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['fail-q'] });
    env.registerConsumer({
      queue: 'fail-q',
      maxRetries: 1,
      handler: async () => {
        throw new Error('permanent-fail');
      },
    });
    await env.send('fail-q', 'msg');
    const snap = await env.assertDeadLettered('fail-q', {
      reasonMatch: /permanent-fail/,
    });
    expect(snap.state).toBe('dead');
    await env.stop();
  });

  it('dead-letter routes message to configured DLQ', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['main-q', 'dlq-q'] });
    env.registerConsumer({
      queue: 'main-q',
      maxRetries: 0,
      deadLetterQueue: 'dlq-q',
      handler: async () => {
        throw new Error('to-dlq');
      },
    });
    await env.send('main-q', 'msg');
    await env.assertDeadLettered('main-q', { dlq: 'dlq-q' });
    await env.stop();
  });

  it('duplicate ack() on same message is ignored (idempotent)', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['idem-q'] });
    env.registerConsumer({
      queue: 'idem-q',
      handler: async (batch) => {
        for (const msg of batch.messages) {
          msg.ack();
          msg.ack();
        }
      },
    });
    await env.send('idem-q', 'msg');
    await env.assertAcknowledged('idem-q', { attempts: 1 });
    await env.stop();
  });

  it('assertDeadLettered rejects when state is ack (not dead)', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['ack-q'] });
    env.registerConsumer({
      queue: 'ack-q',
      handler: async (batch) => {
        for (const msg of batch.messages) msg.ack();
      },
    });
    await env.send('ack-q', 'msg');
    await expect(
      env.assertDeadLettered('ack-q'),
    ).rejects.toThrow(/expected message on "ack-q" to be dead-lettered/);
    await env.stop();
  });

  it('assertAcknowledged rejects when attempts mismatch', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['att-q'] });
    env.registerConsumer({
      queue: 'att-q',
      handler: async (batch) => {
        for (const msg of batch.messages) msg.ack();
      },
    });
    await env.send('att-q', 'msg');
    await expect(
      env.assertAcknowledged('att-q', { attempts: 99 }),
    ).rejects.toThrow(/expected 99 attempt/);
    await env.stop();
  });

  it('assertDeadLettered rejects when reasonMatch does not match', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['rm-q'] });
    env.registerConsumer({
      queue: 'rm-q',
      maxRetries: 0,
      handler: async () => {
        throw new Error('actual-reason');
      },
    });
    await env.send('rm-q', 'msg');
    await expect(
      env.assertDeadLettered('rm-q', { reasonMatch: /wrong-reason/ }),
    ).rejects.toThrow(/did not match/);
    await env.stop();
  });

  it('assertRetried rejects when attempt count mismatches expected', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['ret-q'] });
    env.registerConsumer({
      queue: 'ret-q',
      handler: async (batch) => {
        for (const msg of batch.messages) msg.ack();
      },
    });
    await env.send('ret-q', 'msg');
    await expect(env.assertRetried('ret-q', 5)).rejects.toThrow(
      /expected 5 attempt/,
    );
    await env.stop();
  });
});
