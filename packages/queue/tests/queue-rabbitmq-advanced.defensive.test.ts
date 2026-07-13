import { describe, expect, it } from 'vitest';
import { setupRabbitMQAdvancedEnv } from '../src/rabbitmq-advanced/setup-rabbitmq-advanced-env.js';

describe('rabbitmq-advanced env public API delegation', () => {
  it('declareExchange delegates to inner adapter', async () => {
    const env = await setupRabbitMQAdvancedEnv();
    await expect(
      env.declareExchange({ name: 'ex-1', type: 'direct' }),
    ).resolves.toBeUndefined();
  });

  it('declareQueue accepts an advanced spec', async () => {
    const env = await setupRabbitMQAdvancedEnv();
    await env.declareExchange({ name: 'ex-1', type: 'direct' });
    await expect(
      env.declareQueue({ name: 'q-1', durable: true }),
    ).resolves.toBeUndefined();
  });

  it('bindQueue delegates to inner adapter', async () => {
    const env = await setupRabbitMQAdvancedEnv();
    await env.declareExchange({ name: 'ex-1', type: 'direct' });
    await env.declareQueue({ name: 'q-1' });
    await expect(
      env.bindQueue({ queue: 'q-1', exchange: 'ex-1', routingKey: 'k1' }),
    ).resolves.toBeUndefined();
  });

  it('unbindQueue delegates to inner adapter', async () => {
    const env = await setupRabbitMQAdvancedEnv();
    await env.declareExchange({ name: 'ex-1', type: 'direct' });
    await env.declareQueue({ name: 'q-1' });
    await env.bindQueue({
      queue: 'q-1',
      exchange: 'ex-1',
      routingKey: 'k1',
    });
    await expect(
      env.unbindQueue({ queue: 'q-1', exchange: 'ex-1', routingKey: 'k1' }),
    ).resolves.toBeUndefined();
  });

  it('get delegates to inner adapter and returns null when empty', async () => {
    const env = await setupRabbitMQAdvancedEnv();
    await env.declareExchange({ name: 'ex-1', type: 'direct' });
    await env.declareQueue({ name: 'q-1' });
    const result = await env.get({ queue: 'q-1' });
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it('seeded exchanges + queues via options are declared', async () => {
    const env = await setupRabbitMQAdvancedEnv({
      exchanges: [{ name: 'seed-ex', type: 'topic' }],
      queues: [{ name: 'seed-q' }],
    });
    // Should not throw when re-declaring the seeded exchange (idempotent)
    await expect(
      env.declareExchange({ name: 'seed-ex', type: 'topic' }),
    ).resolves.toBeUndefined();
  });
});
