import { describe, expect, it } from 'vitest';
import { createMiniflareCloudflareQueuesEnv } from '../src/cloudflare-queues/miniflare-cloudflare-queues.js';

describe('miniflare-cloudflare-queues defensive branches', () => {
  it('registerConsumer throws when queue is empty string', () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    expect(() =>
      env.registerConsumer({
        queue: '' as never,
        handler: async () => undefined,
      }),
    ).toThrow(/`queue` must be a non-empty string/);
  });

  it('registerConsumer throws when queue is not a string', () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    expect(() =>
      env.registerConsumer({
        queue: 42 as never,
        handler: async () => undefined,
      }),
    ).toThrow(/`queue` must be a non-empty string/);
  });

  it('send throws when queueName is empty', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    await expect(env.send('', 'body' as unknown)).rejects.toThrow(
      /queueName must be a non-empty string/,
    );
  });

  it('send throws when delaySeconds is negative', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    await expect(
      env.send('q1', 'body' as unknown, { delaySeconds: -1 }),
    ).rejects.toThrow(/delaySeconds must be non-negative/);
  });

  it('send with default delaySeconds=0 succeeds', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    const snap = await env.send('q1', { hello: 'world' } as unknown);
    expect(snap.id).toBeDefined();
    expect(snap.state).toBe('pending');
  });

  it('send with explicit delaySeconds delays visibleAt', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    const now = Date.now();
    const snap = await env.send('q1', 'body' as unknown, { delaySeconds: 10 });
    expect(snap.visibleAt).toBeGreaterThanOrEqual(now + 10_000);
  });

  it('stop marks env as stopped and subsequent operations throw', async () => {
    const env = createMiniflareCloudflareQueuesEnv({ queues: ['q1'] });
    await env.stop();
    await expect(env.send('q1', 'body' as unknown)).rejects.toThrow();
  });

  it('accepts explicit pollIntervalMs override', () => {
    const env = createMiniflareCloudflareQueuesEnv({
      queues: ['q1'],
      miniflare: { pollIntervalMs: 5 },
    });
    expect(env.backend).toBe('miniflare');
  });

  it('accepts preseeded consumers via options', () => {
    const env = createMiniflareCloudflareQueuesEnv({
      queues: ['q1'],
      consumers: [
        {
          queue: 'q1',
          handler: async () => undefined,
        },
      ],
    });
    expect(env.queues).toContain('q1');
  });
});
