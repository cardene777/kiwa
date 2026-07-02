import { afterEach, describe, expect, it } from 'vitest';
import { setupRabbitMQEnv, type RabbitMQTestEnv } from '../src/index.js';

const envs: RabbitMQTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupRabbitMQEnv (defaults + mode selection)', () => {
  it('T-RMQ-001 defaults to stub backend when no mode is passed', async () => {
    const env = await setupRabbitMQEnv();
    envs.push(env);
    expect(env.backend).toBe('stub');
    expect(env.mode).toBe('mock');
    expect(env.amqpUrl).toBeUndefined();
    expect(env.managementUrl).toBeUndefined();
  });

  it('T-RMQ-002 rejects an unknown mode', async () => {
    await expect(
      setupRabbitMQEnv({ mode: 'invalid' as unknown as 'stub' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('T-RMQ-003 testcontainers mode requires amqpUrl', async () => {
    await expect(setupRabbitMQEnv({ mode: 'testcontainers' })).rejects.toThrow(
      /requires testcontainers\.amqpUrl/,
    );
  });

  it('T-RMQ-004 testcontainers mode rejects an unreachable broker', async () => {
    await expect(
      setupRabbitMQEnv({
        mode: 'testcontainers',
        testcontainers: { amqpUrl: 'amqp://127.0.0.1:1', startupTimeoutMs: 300 },
      }),
    ).rejects.toThrow(/did not respond/);
  }, 2000);

  it('T-RMQ-005 pre-declares exchanges / queues / bindings from options', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'orders', type: 'direct' }],
      queues: [{ name: 'orders.new' }],
      bindings: [{ exchange: 'orders', queue: 'orders.new', routingKey: 'created' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'orders', routingKey: 'created', body: { id: 1 } });
    expect(env.peek('orders.new')).toHaveLength(1);
  });
});

describe('setupRabbitMQEnv (direct exchange)', () => {
  async function makeEnv(): Promise<RabbitMQTestEnv> {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.direct', type: 'direct' }],
      queues: [{ name: 'q.a' }, { name: 'q.b' }],
      bindings: [
        { exchange: 'ex.direct', queue: 'q.a', routingKey: 'alpha' },
        { exchange: 'ex.direct', queue: 'q.b', routingKey: 'beta' },
      ],
    });
    envs.push(env);
    return env;
  }

  it('T-RMQ-006 routes to the matching queue by routing key', async () => {
    const env = await makeEnv();
    await env.publish({ exchange: 'ex.direct', routingKey: 'alpha', body: 'A' });
    expect(env.peek('q.a')).toHaveLength(1);
    expect(env.peek('q.b')).toHaveLength(0);
  });

  it('T-RMQ-007 unroutable publish records nothing on any queue', async () => {
    const env = await makeEnv();
    await env.publish({ exchange: 'ex.direct', routingKey: 'gamma', body: 'X' });
    expect(env.peek('q.a')).toHaveLength(0);
    expect(env.peek('q.b')).toHaveLength(0);
  });

  it('T-RMQ-008 mandatory=true on unroutable publish records a return', async () => {
    const env = await makeEnv();
    await env.publish({
      exchange: 'ex.direct',
      routingKey: 'gamma',
      body: 'X',
      options: { mandatory: true },
    });
    const returned = env.listReturned();
    expect(returned).toHaveLength(1);
    expect(returned[0]?.failedReason).toBe('unroutable');
  });
});

describe('setupRabbitMQEnv (fanout exchange)', () => {
  it('T-RMQ-009 fans out to every bound queue regardless of routing key', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.fan', type: 'fanout' }],
      queues: [{ name: 'q.1' }, { name: 'q.2' }, { name: 'q.3' }],
      bindings: [
        { exchange: 'ex.fan', queue: 'q.1', routingKey: '' },
        { exchange: 'ex.fan', queue: 'q.2', routingKey: '' },
        { exchange: 'ex.fan', queue: 'q.3', routingKey: '' },
      ],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex.fan', routingKey: 'anything', body: 'broadcast' });
    expect(env.peek('q.1')).toHaveLength(1);
    expect(env.peek('q.2')).toHaveLength(1);
    expect(env.peek('q.3')).toHaveLength(1);
  });
});

describe('setupRabbitMQEnv (topic exchange)', () => {
  async function makeEnv(): Promise<RabbitMQTestEnv> {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.topic', type: 'topic' }],
      queues: [{ name: 'q.us' }, { name: 'q.all' }, { name: 'q.critical' }],
      bindings: [
        { exchange: 'ex.topic', queue: 'q.us', routingKey: 'us.*.*' },
        { exchange: 'ex.topic', queue: 'q.all', routingKey: '#' },
        { exchange: 'ex.topic', queue: 'q.critical', routingKey: '*.*.critical' },
      ],
    });
    envs.push(env);
    return env;
  }

  it('T-RMQ-010 * matches exactly one word', async () => {
    const env = await makeEnv();
    await env.publish({ exchange: 'ex.topic', routingKey: 'us.web.info', body: 1 });
    expect(env.peek('q.us')).toHaveLength(1);
  });

  it('T-RMQ-011 # matches zero or more words', async () => {
    const env = await makeEnv();
    await env.publish({ exchange: 'ex.topic', routingKey: 'eu.mobile.warn', body: 2 });
    expect(env.peek('q.all')).toHaveLength(1);
  });

  it('T-RMQ-012 combined patterns can hit multiple queues', async () => {
    const env = await makeEnv();
    await env.publish({ exchange: 'ex.topic', routingKey: 'us.web.critical', body: 3 });
    expect(env.peek('q.us')).toHaveLength(1);
    expect(env.peek('q.all')).toHaveLength(1);
    expect(env.peek('q.critical')).toHaveLength(1);
  });

  it('T-RMQ-013 topic mismatch skips the binding', async () => {
    const env = await makeEnv();
    await env.publish({ exchange: 'ex.topic', routingKey: 'us.web', body: 4 });
    expect(env.peek('q.us')).toHaveLength(0);
    expect(env.peek('q.all')).toHaveLength(1);
  });
});

describe('setupRabbitMQEnv (headers exchange)', () => {
  it('T-RMQ-014 x-match=all requires all headers to match', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.head', type: 'headers' }],
      queues: [{ name: 'q.priority' }],
      bindings: [
        {
          exchange: 'ex.head',
          queue: 'q.priority',
          routingKey: '',
          args: { 'x-match': 'all', priority: 'high', region: 'us' },
        },
      ],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.head',
      routingKey: '',
      body: 'hi',
      options: { headers: { priority: 'high', region: 'us' } },
    });
    expect(env.peek('q.priority')).toHaveLength(1);
    await env.publish({
      exchange: 'ex.head',
      routingKey: '',
      body: 'hi',
      options: { headers: { priority: 'high', region: 'eu' } },
    });
    expect(env.peek('q.priority')).toHaveLength(1);
  });

  it('T-RMQ-015 x-match=any matches if any header aligns', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex.any', type: 'headers' }],
      queues: [{ name: 'q.any' }],
      bindings: [
        {
          exchange: 'ex.any',
          queue: 'q.any',
          routingKey: '',
          args: { 'x-match': 'any', priority: 'high', vip: true },
        },
      ],
    });
    envs.push(env);
    await env.publish({
      exchange: 'ex.any',
      routingKey: '',
      body: 'x',
      options: { headers: { vip: true } },
    });
    expect(env.peek('q.any')).toHaveLength(1);
  });
});

describe('setupRabbitMQEnv (consumer + ack / nack)', () => {
  it('T-RMQ-016 consumer receives messages and acking removes them from the queue', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'q.work' }],
    });
    envs.push(env);
    const processed: string[] = [];
    await env.consume({
      queue: 'q.work',
      handler: (msg) => {
        processed.push(msg.body as string);
        msg.ack();
      },
    });
    await env.sendToQueue({ queue: 'q.work', body: 'A' });
    await env.sendToQueue({ queue: 'q.work', body: 'B' });
    await new Promise((r) => setTimeout(r, 20));
    expect(processed).toEqual(['A', 'B']);
    await env.assertQueueDrained('q.work');
  });

  it('T-RMQ-017 nack with requeue=true redelivers the message', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'q.retry' }],
    });
    envs.push(env);
    let attempt = 0;
    await env.consume({
      queue: 'q.retry',
      handler: (msg) => {
        attempt += 1;
        if (attempt === 1) {
          msg.nack({ requeue: true });
        } else {
          msg.ack();
        }
      },
    });
    await env.sendToQueue({ queue: 'q.retry', body: 'once' });
    await env.assertRequeued('q.retry');
    expect(attempt).toBeGreaterThanOrEqual(2);
  });

  it('T-RMQ-018 nack with requeue=false marks the message nacked', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'q.reject' }],
    });
    envs.push(env);
    await env.consume({
      queue: 'q.reject',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.reject', body: 'drop' });
    const snap = await env.waitForMessage('q.reject', {
      match: (m) => m.state === 'nacked',
    });
    expect(snap.state).toBe('nacked');
  });

  it('T-RMQ-019 noAck consumer auto-acknowledges deliveries', async () => {
    const env = await setupRabbitMQEnv({
      queues: [{ name: 'q.auto' }],
    });
    envs.push(env);
    const processed: string[] = [];
    await env.consume({
      queue: 'q.auto',
      handler: (msg) => {
        processed.push(msg.body as string);
      },
      options: { noAck: true },
    });
    await env.sendToQueue({ queue: 'q.auto', body: 'X' });
    await new Promise((r) => setTimeout(r, 20));
    expect(processed).toEqual(['X']);
    await env.assertQueueDrained('q.auto');
  });
});

describe('setupRabbitMQEnv (basic.get + prefetch + exclusive)', () => {
  it('T-RMQ-020 get returns null on an empty queue and a delivery otherwise', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.get' }] });
    envs.push(env);
    expect(await env.get({ queue: 'q.get' })).toBeNull();
    await env.sendToQueue({ queue: 'q.get', body: 'hello' });
    const delivery = await env.get({ queue: 'q.get' });
    expect(delivery?.body).toBe('hello');
    delivery?.ack();
    await env.assertQueueDrained('q.get');
  });

  it('T-RMQ-021 prefetch caps unacked deliveries per consumer', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.qos' }] });
    envs.push(env);
    let received = 0;
    const unacked: Array<{ ack: () => void }> = [];
    await env.consume({
      queue: 'q.qos',
      handler: (msg) => {
        received += 1;
        unacked.push({ ack: msg.ack });
      },
      options: { prefetch: 2 },
    });
    await env.sendToQueue({ queue: 'q.qos', body: 1 });
    await env.sendToQueue({ queue: 'q.qos', body: 2 });
    await env.sendToQueue({ queue: 'q.qos', body: 3 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toBe(2);
    unacked[0]!.ack();
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toBe(3);
  });

  it('T-RMQ-022 exclusive consumer rejects subsequent registrations', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.excl' }] });
    envs.push(env);
    await env.consume({
      queue: 'q.excl',
      handler: () => {},
      options: { exclusive: true },
    });
    await expect(
      env.consume({ queue: 'q.excl', handler: () => {} }),
    ).rejects.toThrow(/exclusive consumer/);
  });
});

describe('setupRabbitMQEnv (per-message expiration)', () => {
  it('T-RMQ-023 expired messages are marked dead without delivery', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.exp' }] });
    envs.push(env);
    await env.sendToQueue({
      queue: 'q.exp',
      body: 'stale',
      options: { expirationMs: 5 },
    });
    await new Promise((r) => setTimeout(r, 15));
    // Trigger the dead-state flip by attempting to get the message.
    const delivery = await env.get({ queue: 'q.exp' });
    expect(delivery).toBeNull();
    const snap = env.peek('q.exp');
    expect(snap[0]?.state).toBe('dead');
    expect(snap[0]?.failedReason).toBe('expired');
  });
});

describe('setupRabbitMQEnv (topology guards)', () => {
  it('T-RMQ-024 declaring an existing exchange with a different type throws', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex', type: 'direct' }],
    });
    envs.push(env);
    await expect(env.declareExchange({ name: 'ex', type: 'topic' })).rejects.toThrow(
      /cannot redeclare/,
    );
  });

  it('T-RMQ-025 bindQueue rejects unknown exchanges + queues', async () => {
    const env = await setupRabbitMQEnv();
    envs.push(env);
    await expect(
      env.bindQueue({ exchange: 'missing', queue: 'q', routingKey: '' }),
    ).rejects.toThrow(/exchange missing not declared/);
    await env.declareExchange({ name: 'ex', type: 'direct' });
    await expect(
      env.bindQueue({ exchange: 'ex', queue: 'missing', routingKey: '' }),
    ).rejects.toThrow(/queue missing not declared/);
  });

  it('T-RMQ-026 unbindQueue removes the specific binding', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex', type: 'direct' }],
      queues: [{ name: 'q' }],
      bindings: [{ exchange: 'ex', queue: 'q', routingKey: 'k' }],
    });
    envs.push(env);
    await env.unbindQueue({ exchange: 'ex', queue: 'q', routingKey: 'k' });
    await env.publish({ exchange: 'ex', routingKey: 'k', body: 1 });
    expect(env.peek('q')).toHaveLength(0);
  });
});

describe('setupRabbitMQEnv (introspection + reset)', () => {
  it('T-RMQ-027 listPublished exposes every publish observed', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q' }] });
    envs.push(env);
    await env.sendToQueue({ queue: 'q', body: 1 });
    await env.sendToQueue({ queue: 'q', body: 2 });
    expect(env.listPublished()).toHaveLength(2);
  });

  it('T-RMQ-028 assertAcknowledged surfaces deliveryCount when specified', async () => {
    const env = await setupRabbitMQEnv({ queues: [{ name: 'q.ack' }] });
    envs.push(env);
    await env.consume({
      queue: 'q.ack',
      handler: (msg) => msg.ack(),
    });
    await env.sendToQueue({ queue: 'q.ack', body: 'ok' });
    await env.assertAcknowledged('q.ack', { deliveryCount: 1 });
  });

  it('T-RMQ-029 reset clears all in-memory state', async () => {
    const env = await setupRabbitMQEnv({
      exchanges: [{ name: 'ex', type: 'direct' }],
      queues: [{ name: 'q' }],
      bindings: [{ exchange: 'ex', queue: 'q', routingKey: 'k' }],
    });
    envs.push(env);
    await env.publish({ exchange: 'ex', routingKey: 'k', body: 1 });
    await env.reset();
    expect(env.listPublished()).toHaveLength(0);
    // Queue no longer declared after reset — sendToQueue re-declares.
    await env.sendToQueue({ queue: 'q', body: 2 });
    expect(env.peek('q')).toHaveLength(1);
  });
});
