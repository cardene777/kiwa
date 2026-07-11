import { afterEach, describe, expect, it } from 'vitest';
import { setupRabbitMQEnv, type RabbitMQTestEnv } from '../src/index.js';

const envs: RabbitMQTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

/**
 * Coverage batch 1 — stub-rabbitmq internals. Existing suite covers
 * declared topology, direct/topic/fanout/headers routing, ack/nack, prefetch.
 * These add: topic `#` mid-pattern matching, ensureExchange re-declare with
 * matching type, default exchange routing, assertAcknowledged deliveryCount
 * mismatch, assertRequeued timeout, assertQueueDrained pending guard,
 * consume rejects on exclusive collision, get on undeclared queue, waitForMessage
 * timeout, consume with cancel + exclusive-second-registration guard.
 */

describe('setupRabbitMQEnv (stub — topic `#` matcher edge cases)', () => {
  it('T-RMQ-030 `#` matches zero words (empty span)', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.h', type: 'topic' }],
      queues: [{ name: 'q.h' }],
      // `#.critical` should match `critical` alone (zero words before `#`).
      bindings: [{ exchange: 'ex.h', queue: 'q.h', routingKey: '#.critical' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.h', routingKey: 'critical', body: 1 });
    expect(env.peek('q.h')).toHaveLength(1);
  });

  it('T-RMQ-031 `#` in the middle matches an arbitrary number of words', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.m', type: 'topic' }],
      queues: [{ name: 'q.m' }],
      // `us.#.critical` should match `us.web.critical`, `us.mobile.beta.critical`.
      bindings: [{ exchange: 'ex.m', queue: 'q.m', routingKey: 'us.#.critical' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.m', routingKey: 'us.web.critical', body: 1 });
    await env.publish({
      exchange: 'ex.m',
      routingKey: 'us.mobile.beta.critical',
      body: 2,
    });
    expect(env.peek('q.m')).toHaveLength(2);
  });

  it('T-RMQ-032 `#` mid-pattern rejects a non-matching tail', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.n', type: 'topic' }],
      queues: [{ name: 'q.n' }],
      bindings: [{ exchange: 'ex.n', queue: 'q.n', routingKey: 'us.#.critical' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.n', routingKey: 'us.web.info', body: 1 });
    expect(env.peek('q.n')).toHaveLength(0);
  });
});

describe('setupRabbitMQEnv (stub — declare / redeclare invariants)', () => {
  it('T-RMQ-033 re-declaring an exchange with the same type is idempotent', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.same', type: 'direct' }],
    });
    envs.push(env);
    // Second declaration with matching type returns the existing exchange
    // and does not throw.
    await env.declareExchange({ name: 'ex.same', type: 'direct' });
    // Bind + publish work exactly as before.
    await env.declareQueue({ name: 'q.same' });
    await env.bindQueue({ exchange: 'ex.same', queue: 'q.same', routingKey: 'k' });
    await env.publish({ exchange: 'ex.same', routingKey: 'k', body: 1 });
    expect(env.peek('q.same')).toHaveLength(1);
  });

  it('T-RMQ-034 default exchange routes by queue name', async () => {
    // Default exchange = "" always routes to the queue whose name equals the
    // routing key.
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.default' }] });
    envs.push(env);
    await env.publish({ exchange: '', routingKey: 'q.default', body: 'hi' });
    expect(env.peek('q.default')).toHaveLength(1);
  });

  it('T-RMQ-035 default exchange with an unknown queue name is unroutable', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.default' }] });
    envs.push(env);
    await env.publish({ exchange: '', routingKey: 'nowhere', body: 'hi' });
    expect(env.peek('q.default')).toHaveLength(0);
  });
});

describe('setupRabbitMQEnv (stub — get + consume guards)', () => {
  it('T-RMQ-036 get on an undeclared queue throws', async () => {
    const env = await setupRabbitMQEnv();
    envs.push(env);
    await expect(env.get({ queue: 'q.missing' })).rejects.toThrow(
      /queue q.missing not declared/,
    );
  });

  it('T-RMQ-037 consume on an undeclared queue throws', async () => {
    const env = await setupRabbitMQEnv();
    envs.push(env);
    await expect(
      env.consume({ queue: 'q.missing', handler: () => {} }),
    ).rejects.toThrow(/queue q.missing not declared/);
  });

  it('T-RMQ-038 exclusive-second-registration rejects when siblings already exist', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.x' }] });
    envs.push(env);
    // First non-exclusive consumer is fine.
    await env.consume({ queue: 'q.x', handler: () => {} });
    // Registering another consumer WITH exclusive=true must reject because
    // a non-exclusive sibling is already active.
    await expect(
      env.consume({ queue: 'q.x', handler: () => {}, options: { exclusive: true } }),
    ).rejects.toThrow(/cannot register exclusive consumer/);
  });

  it('T-RMQ-039 consumer cancel stops further deliveries', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.c' }] });
    envs.push(env);
    const received: unknown[] = [];
    const consumer = await env.consume({
      queue: 'q.c',
      handler: (msg) => {
        received.push(msg.body);
        msg.ack();
      },
    });
    await consumer.cancel();
    await env.sendToQueue({ queue: 'q.c', body: 'ignored' });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
  });
});

describe('setupRabbitMQEnv (stub — async handler that rejects)', () => {
  it('T-RMQ-044 an async handler whose promise rejects does not disturb the consumer loop', async () => {
    // A rejected promise from the handler must not blow up — it should be
    // absorbed by the defensive `result.catch(() => {})`. The message stays
    // in unacked until explicitly nacked, matching real AMQP semantics.
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.reject' }] });
    envs.push(env);
    let handlerCalls = 0;
    await env.consume({
      queue: 'q.reject',
      handler: async () => {
        handlerCalls += 1;
        throw new Error('handler-oops');
      },
    });
    await env.sendToQueue({ queue: 'q.reject', body: 1 });
    // Let the microtask queue drain so the async handler runs.
    await new Promise((r) => setTimeout(r, 20));
    expect(handlerCalls).toBe(1);
    // Message is still unacked — assertQueueDrained rejects because ready +
    // unacked count > 0.
    await expect(env.assertQueueDrained('q.reject')).rejects.toThrow(
      /still has 1 pending messages/,
    );
  });
});

describe('setupRabbitMQEnv (stub — assertion mismatch + timeout guards)', () => {
  it('T-RMQ-040 assertAcknowledged rejects when deliveryCount mismatches', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.a' }] });
    envs.push(env);
    await env.consume({
      queue: 'q.a',
      handler: (msg) => msg.ack(),
    });
    await env.sendToQueue({ queue: 'q.a', body: 'x' });
    await expect(
      env.assertAcknowledged('q.a', { deliveryCount: 42 }),
    ).rejects.toThrow(/expected deliveryCount 42/);
  });

  it('T-RMQ-041 waitForMessage rejects on timeout when nothing terminal happens', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.wait' }] });
    envs.push(env);
    await env.sendToQueue({ queue: 'q.wait', body: 'stuck' });
    // No consumer, no get — the message never leaves `ready` so waitForMessage
    // (which only returns for acked/nacked/dead) times out.
    await expect(
      env.waitForMessage('q.wait', { timeoutMs: 30 }),
    ).rejects.toThrow(/timeout waiting for message on q.wait/);
  });

  it('T-RMQ-042 assertRequeued rejects when no redelivery ever fires', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.norequeue' }] });
    envs.push(env);
    // Consumer that always acks — deliveryCount stays at 1, assertRequeued
    // walks the full 5s window and then rejects.
    await env.consume({ queue: 'q.norequeue', handler: (msg) => msg.ack() });
    await env.sendToQueue({ queue: 'q.norequeue', body: 'x' });
    await expect(env.assertRequeued('q.norequeue')).rejects.toThrow(
      /timeout waiting for requeued delivery/,
    );
  }, 6000);

  it('T-RMQ-043 assertQueueDrained rejects when a ready message is still pending', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.drain' }] });
    envs.push(env);
    await env.sendToQueue({ queue: 'q.drain', body: 'x' });
    await expect(env.assertQueueDrained('q.drain')).rejects.toThrow(
      /still has 1 pending messages/,
    );
  });
});
