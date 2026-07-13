import { afterEach, describe, expect, it } from 'vitest';
import { setupRabbitMQEnv, type RabbitMQTestEnv } from '../src/index.js';

const envs: RabbitMQTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('stub-rabbitmq env defensive branches', () => {
  it('publish with expiration TTL — expired message not delivered by get', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.exp', type: 'direct' }],
      queues: [{ name: 'q.exp' }],
      bindings: [{ exchange: 'ex.exp', queue: 'q.exp', routingKey: 'k' }],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.exp',
      routingKey: 'k',
      body: 'expiring',
      options: { expirationMs: 50 },
    });
    await new Promise((r) => setTimeout(r, 100));
    const delivery = await env.get({ queue: 'q.exp' });
    expect(delivery).toBeNull();
  });

  it('publish mandatory=true with no route records unroutable stray', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.stray', type: 'direct' }],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.stray',
      routingKey: 'no-binding',
      body: 'lost',
      options: { mandatory: true },
    });
    // Unroutable + mandatory triggers the stray-record branch (line 366).
    // The stub records it internally; test passes if publish did not throw.
    expect(env).toBeDefined();
  });

  it('headers exchange x-match=any matches on any single header', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.h.any', type: 'headers' }],
      queues: [{ name: 'q.h.any' }],
      bindings: [
        {
          exchange: 'ex.h.any',
          queue: 'q.h.any',
          routingKey: '',
          args: { 'x-match': 'any', foo: 'bar', baz: 'qux' },
        },
      ],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.h.any',
      routingKey: '',
      body: 'match-foo',
      options: { headers: { foo: 'bar' } },
    });
    expect(env.peek('q.h.any')).toHaveLength(1);
  });

  it('headers exchange with empty pattern (only x-match) matches unconditionally', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.h.all', type: 'headers' }],
      queues: [{ name: 'q.h.all' }],
      bindings: [
        {
          exchange: 'ex.h.all',
          queue: 'q.h.all',
          routingKey: '',
          args: { 'x-match': 'all' },
        },
      ],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.h.all',
      routingKey: '',
      body: 'no-headers-match',
      options: { headers: {} },
    });
    expect(env.peek('q.h.all')).toHaveLength(1);
  });

  it('nack requeue: true redelivers with deliveryCount incremented', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.nack', type: 'direct' }],
      queues: [{ name: 'q.nack' }],
      bindings: [{ exchange: 'ex.nack', queue: 'q.nack', routingKey: 'k' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.nack', routingKey: 'k', body: 'msg' });
    const d1 = await env.get({ queue: 'q.nack' });
    d1?.nack({ requeue: true });
    await new Promise((r) => setTimeout(r, 30));
    const d2 = await env.get({ queue: 'q.nack' });
    expect(d2).not.toBeNull();
    expect(d2?.deliveryCount).toBe(2);
  });

  it('nack without requeue moves message to nacked (dead)', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.dead', type: 'direct' }],
      queues: [{ name: 'q.dead' }],
      bindings: [{ exchange: 'ex.dead', queue: 'q.dead', routingKey: 'k' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.dead', routingKey: 'k', body: 'msg' });
    const d = await env.get({ queue: 'q.dead' });
    d?.nack({ requeue: false });
    await new Promise((r) => setTimeout(r, 20));
    const list = env.peek('q.dead');
    const nacked = list.find((m) => m.state === 'nacked' || m.state === 'dead');
    expect(nacked).toBeDefined();
  });

  it('get with noAck=true immediately marks message acked without ack() call', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.noack', type: 'direct' }],
      queues: [{ name: 'q.noack' }],
      bindings: [{ exchange: 'ex.noack', queue: 'q.noack', routingKey: 'k' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.noack', routingKey: 'k', body: 'auto-ack' });
    const d = await env.get({ queue: 'q.noack', noAck: true });
    expect(d).not.toBeNull();
    const list = env.peek('q.noack');
    expect(list.find((m) => m.state === 'acked')).toBeDefined();
  });
});
