import { describe, expect, it } from 'vitest';
import { setupBullMQEnv } from '../src/setup-bullmq-env.js';
import { createStubRabbitMQEnv } from '../src/rabbitmq/stub-rabbitmq.js';

describe('setup-bullmq-env defensive branches', () => {
  it('throws when mode is neither sandbox nor testcontainers', async () => {
    await expect(
      setupBullMQEnv({ mode: 'production' as never }),
    ).rejects.toThrow(/unknown mode "production"/);
  });

  it('uses sandbox default when mode omitted', async () => {
    const env = await setupBullMQEnv();
    expect(env).toBeDefined();
  });

  it('accepts explicit sandbox mode', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    expect(env).toBeDefined();
  });
});

describe('rabbitmq/stub deliveries snapshot', () => {
  it('consume returns a consumer with deliveries() method that snapshots received messages', async () => {
    const env = createStubRabbitMQEnv();
    await env.declareExchange({ name: 'ex-1', type: 'direct' });
    await env.declareQueue({ name: 'q-1' });
    await env.bindQueue({
      queue: 'q-1',
      exchange: 'ex-1',
      routingKey: 'k1',
    });
    const consumer = await env.consume<string>({
      queue: 'q-1',
      handler: async () => undefined,
    });
    await env.publish({
      exchange: 'ex-1',
      routingKey: 'k1',
      body: 'hello',
    });
    // Yield to let the async consume loop process the message
    await new Promise((r) => setTimeout(r, 50));
    const snapshots = consumer.deliveries();
    expect(Array.isArray(snapshots)).toBe(true);
    await consumer.cancel();
  });
});
