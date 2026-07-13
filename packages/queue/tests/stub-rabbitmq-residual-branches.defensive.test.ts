import { afterEach, describe, expect, it } from 'vitest';
import { setupRabbitMQEnv, type RabbitMQTestEnv } from '../src/index.js';

const envs: RabbitMQTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('stub-rabbitmq residual defensive branches', () => {
  it('ensureQueue with maxLength preserves the field', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'bounded-q', maxLength: 5 }],
    });
    envs.push(env);
    for (let i = 0; i < 3; i += 1) {
      await env.publish({ exchange: '', routingKey: 'bounded-q', body: `m-${i}` });
    }
    expect(env.peek('bounded-q').length).toBe(3);
  });

  it('ensureQueue with args field preserves the field', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'args-q', args: { 'x-max-priority': 10 } }],
    });
    envs.push(env);
    await env.publish({ exchange: '', routingKey: 'args-q', body: 'msg' });
    expect(env.peek('args-q').length).toBe(1);
  });

  it('assertQueueDrained succeeds when queue is empty', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'empty-q' }],
    });
    envs.push(env);
    await expect(env.assertQueueDrained('empty-q')).resolves.toBeUndefined();
  });

  it('exchange with autoDelete + internal + args preserved', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [
        {
          name: 'full-ex',
          type: 'direct',
          durable: false,
          autoDelete: true,
          internal: true,
          args: { 'x-custom': 'val' },
        },
      ],
    });
    envs.push(env);
    // Publish should still work.
    await env.declareQueue({ name: 'attached-q' });
    await env.bindQueue({
      exchange: 'full-ex',
      queue: 'attached-q',
      routingKey: 'k',
    });
    await env.publish({ exchange: 'full-ex', routingKey: 'k', body: 'msg' });
    expect(env.peek('attached-q').length).toBe(1);
  });

  it('bindQueue throws when queue is not declared', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.no-q', type: 'direct' }],
    });
    envs.push(env);
    await expect(
      env.bindQueue({
        exchange: 'ex.no-q',
        queue: 'undeclared-q',
        routingKey: 'k',
      }),
    ).rejects.toThrow(/queue undeclared-q not declared/);
  });

  it('publish to default (empty) exchange routes directly to queue by name', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'direct-target-q' }],
    });
    envs.push(env);
    await env.publish({
      exchange: '',
      routingKey: 'direct-target-q',
      body: 'msg',
    });
    expect(env.peek('direct-target-q').length).toBe(1);
  });

  it('exclusive queue preserves the exclusive flag', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'excl-q', exclusive: true }],
    });
    envs.push(env);
    await env.publish({ exchange: '', routingKey: 'excl-q', body: 'msg' });
    expect(env.peek('excl-q').length).toBe(1);
  });

  it('headers exchange with only x-match field matches unconditionally (all mode)', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.uncond', type: 'headers' }],
      queues: [{ name: 'q.uncond' }],
      bindings: [
        {
          exchange: 'ex.uncond',
          queue: 'q.uncond',
          routingKey: '',
          args: { 'x-match': 'all' },
        },
      ],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.uncond',
      routingKey: '',
      body: 'any-headers',
      options: { headers: { anything: 'goes' } },
    });
    expect(env.peek('q.uncond').length).toBe(1);
  });
});
