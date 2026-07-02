import { afterEach, describe, expect, it } from 'vitest';
import {
  setupRabbitMQAdvancedEnv,
  type RabbitMQAdvancedTestEnv,
} from '../src/index.js';

const envs: RabbitMQAdvancedTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(
  opts: Parameters<typeof setupRabbitMQAdvancedEnv>[0] = {},
): Promise<RabbitMQAdvancedTestEnv<'mock'>> {
  const env = await setupRabbitMQAdvancedEnv(opts);
  envs.push(env);
  return env;
}

describe('setupRabbitMQAdvancedEnv (defaults)', () => {
  it('T-RMQ-ADV-001 defaults to stub backend', async () => {
    const env = await makeEnv();
    expect(env.backend).toBe('stub');
    expect(env.mode).toBe('mock');
  });

  it('T-RMQ-ADV-002 auto-reconnect defaults are exposed', async () => {
    const env = await makeEnv();
    const cfg = env.autoReconnect.getConfig();
    expect(cfg).toEqual({
      initialDelayMs: 100,
      maxDelayMs: 1000,
      factor: 2,
      maxAttempts: 10,
    });
  });

  it('T-RMQ-ADV-003 auto-reconnect config can be overridden', async () => {
    const env = await makeEnv({
      autoReconnect: { initialDelayMs: 50, factor: 3, maxAttempts: 5 },
    });
    const cfg = env.autoReconnect.getConfig();
    expect(cfg.initialDelayMs).toBe(50);
    expect(cfg.factor).toBe(3);
    expect(cfg.maxAttempts).toBe(5);
  });

  it('T-RMQ-ADV-004 basic API is available (publish + sendToQueue + peek)', async () => {
    const env = await makeEnv({
      queues: [{ name: 'q' }],
    });
    await env.sendToQueue({ queue: 'q', body: 'hi' });
    expect(env.peek('q')).toHaveLength(1);
  });
});

describe('setupRabbitMQAdvancedEnv (DLX routing)', () => {
  it('T-RMQ-ADV-005 nack requeue=false with DLX routes to the DLX exchange', async () => {
    const env = await makeEnv({
      exchanges: [{ name: 'dlx', type: 'direct' }],
      queues: [
        { name: 'q.main', deadLetterExchange: 'dlx', deadLetterRoutingKey: 'failed' },
        { name: 'q.deadletter' },
      ],
      bindings: [{ exchange: 'dlx', queue: 'q.deadletter', routingKey: 'failed' }],
    });
    await env.consume({
      queue: 'q.main',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.main', body: 'poison' });
    const snap = await env.dlx.assertDeadLettered('q.main', { reason: 'rejected' });
    expect(snap.deadLetterExchange).toBe('dlx');
    expect(snap.deadLetterRoutingKey).toBe('failed');
    // Message landed on the DLQ.
    expect(env.peek('q.deadletter')).toHaveLength(1);
  });

  it('T-RMQ-ADV-006 nack without DLX simply nacks, no dead-letter fired', async () => {
    const env = await makeEnv({
      queues: [{ name: 'q.main' }],
    });
    await env.consume({
      queue: 'q.main',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.main', body: 'x' });
    await new Promise((r) => setTimeout(r, 50));
    expect(env.dlx.listDeadLetters()).toHaveLength(0);
  });

  it('T-RMQ-ADV-007 listDeadLetters exposes reason + deliveryCount', async () => {
    const env = await makeEnv({
      exchanges: [{ name: 'dlx', type: 'direct' }],
      queues: [{ name: 'q.main', deadLetterExchange: 'dlx' }],
    });
    await env.consume({
      queue: 'q.main',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.main', body: 'x' });
    const dl = await env.dlx.assertDeadLettered('q.main');
    expect(dl.reason).toBe('rejected');
    expect(dl.deliveryCount).toBeGreaterThanOrEqual(1);
  });

  it('T-RMQ-ADV-008 assertDeadLettered rejects when reason does not match', async () => {
    const env = await makeEnv({
      exchanges: [{ name: 'dlx', type: 'direct' }],
      queues: [{ name: 'q.main', deadLetterExchange: 'dlx' }],
    });
    await env.consume({
      queue: 'q.main',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.main', body: 'x' });
    await expect(
      env.dlx.assertDeadLettered('q.main', { reason: 'expired' }),
    ).rejects.toThrow(/no dead-letter observed/);
  });
});

describe('setupRabbitMQAdvancedEnv (delayed message plugin)', () => {
  it('T-RMQ-ADV-009 publishDelayed requires an already-declared delayed exchange', async () => {
    const env = await makeEnv();
    await expect(
      env.delayed.publishDelayed({
        exchange: 'nope',
        routingKey: '',
        body: 'x',
        delayMs: 100,
      }),
    ).rejects.toThrow(/not a delayed exchange/);
  });

  it('T-RMQ-ADV-010 declareDelayedExchange makes publishDelayed accept it', async () => {
    const env = await makeEnv();
    await env.delayed.declareDelayedExchange({ name: 'ex.d', type: 'x-delayed-message' });
    await env.delayed.publishDelayed({
      exchange: 'ex.d',
      routingKey: '',
      body: 'x',
      delayMs: 100,
    });
    expect(env.delayed.listPending()).toHaveLength(1);
  });

  it('T-RMQ-ADV-011 advanceClock delivers due messages synchronously', async () => {
    const env = await makeEnv({
      delayedExchanges: [{ name: 'ex.d', type: 'x-delayed-message', delayedType: 'direct' }],
      queues: [{ name: 'q.d' }],
      bindings: [{ exchange: 'ex.d', queue: 'q.d', routingKey: 'go' }],
    });
    await env.delayed.publishDelayed({
      exchange: 'ex.d',
      routingKey: 'go',
      body: 'later',
      delayMs: 1000,
    });
    expect(env.peek('q.d')).toHaveLength(0);
    await env.delayed.advanceClock(1500);
    expect(env.peek('q.d')).toHaveLength(1);
  });

  it('T-RMQ-ADV-012 delayed messages honour their delay ordering', async () => {
    const env = await makeEnv({
      delayedExchanges: [{ name: 'ex.d', type: 'x-delayed-message', delayedType: 'direct' }],
      queues: [{ name: 'q.d' }],
      bindings: [{ exchange: 'ex.d', queue: 'q.d', routingKey: 'x' }],
    });
    await env.delayed.publishDelayed({
      exchange: 'ex.d',
      routingKey: 'x',
      body: 'first',
      delayMs: 100,
    });
    await env.delayed.publishDelayed({
      exchange: 'ex.d',
      routingKey: 'x',
      body: 'second',
      delayMs: 200,
    });
    await env.delayed.advanceClock(150);
    expect(env.peek('q.d')).toHaveLength(1);
    await env.delayed.advanceClock(100);
    expect(env.peek('q.d')).toHaveLength(2);
  });

  it('T-RMQ-ADV-013 publishDelayed rejects negative delays', async () => {
    const env = await makeEnv({
      delayedExchanges: [{ name: 'ex.d', type: 'x-delayed-message' }],
    });
    await expect(
      env.delayed.publishDelayed({ exchange: 'ex.d', routingKey: 'x', body: 'y', delayMs: -1 }),
    ).rejects.toThrow(/must be non-negative/);
  });

  it('T-RMQ-ADV-014 listPending only includes undelivered messages', async () => {
    const env = await makeEnv({
      delayedExchanges: [{ name: 'ex.d', type: 'x-delayed-message', delayedType: 'direct' }],
      queues: [{ name: 'q.d' }],
      bindings: [{ exchange: 'ex.d', queue: 'q.d', routingKey: 'k' }],
    });
    await env.delayed.publishDelayed({
      exchange: 'ex.d',
      routingKey: 'k',
      body: 'a',
      delayMs: 10,
    });
    await env.delayed.publishDelayed({
      exchange: 'ex.d',
      routingKey: 'k',
      body: 'b',
      delayMs: 500,
    });
    await env.delayed.advanceClock(50);
    const pending = env.delayed.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.body).toBe('b');
  });
});

describe('setupRabbitMQAdvancedEnv (cluster + quorum)', () => {
  it('T-RMQ-ADV-015 cluster listNodes reflects registered nodes', async () => {
    const env = await makeEnv({
      cluster: {
        nodes: [
          { id: 'n1', role: 'primary', active: true },
          { id: 'n2', role: 'replica', active: true },
          { id: 'n3', role: 'replica', active: true },
        ],
      },
    });
    expect(env.cluster.listNodes()).toHaveLength(3);
  });

  it('T-RMQ-ADV-016 stopNode + startNode flips active flag', async () => {
    const env = await makeEnv({
      cluster: { nodes: [{ id: 'n1', role: 'primary', active: true }] },
    });
    await env.cluster.stopNode('n1');
    expect(env.cluster.listNodes()[0]?.active).toBe(false);
    await env.cluster.startNode('n1');
    expect(env.cluster.listNodes()[0]?.active).toBe(true);
  });

  it('T-RMQ-ADV-017 stopNode on unknown id throws', async () => {
    const env = await makeEnv();
    await expect(env.cluster.stopNode('missing')).rejects.toThrow(/not registered/);
  });

  it('T-RMQ-ADV-018 resolveQueueNode picks an active node deterministically', async () => {
    const env = await makeEnv({
      cluster: {
        nodes: [
          { id: 'n1', role: 'primary', active: true },
          { id: 'n2', role: 'replica', active: true },
          { id: 'n3', role: 'replica', active: true },
        ],
      },
    });
    const a = env.cluster.resolveQueueNode('orders');
    const b = env.cluster.resolveQueueNode('orders');
    expect(a).toBe(b);
    expect(['n1', 'n2', 'n3']).toContain(a);
  });

  it('T-RMQ-ADV-019 resolveQueueNode returns null when no node is active', async () => {
    const env = await makeEnv({
      cluster: { nodes: [{ id: 'n1', role: 'primary', active: false }] },
    });
    expect(env.cluster.resolveQueueNode('q')).toBeNull();
  });

  it('T-RMQ-ADV-020 assertQuorumHealthy requires quorum kind + min replicas', async () => {
    const env = await makeEnv({
      queues: [{ name: 'q.classic' }, { name: 'q.quorum', kind: 'quorum' }],
      cluster: {
        nodes: [
          { id: 'n1', role: 'primary', active: true },
          { id: 'n2', role: 'replica', active: true },
          { id: 'n3', role: 'replica', active: true },
        ],
      },
    });
    expect(() => env.cluster.assertQuorumHealthy('q.quorum')).not.toThrow();
    expect(() => env.cluster.assertQuorumHealthy('q.classic')).toThrow(/not a quorum queue/);
    expect(() => env.cluster.assertQuorumHealthy('missing')).toThrow(/not declared/);
  });

  it('T-RMQ-ADV-021 assertQuorumHealthy fails when active replica count drops', async () => {
    const env = await makeEnv({
      queues: [{ name: 'q.q', kind: 'quorum' }],
      cluster: {
        nodes: [
          { id: 'n1', role: 'primary', active: true },
          { id: 'n2', role: 'replica', active: false },
          { id: 'n3', role: 'replica', active: false },
        ],
      },
    });
    expect(() => env.cluster.assertQuorumHealthy('q.q')).toThrow(/requires 3 active nodes/);
    expect(() => env.cluster.assertQuorumHealthy('q.q', { minReplicas: 1 })).not.toThrow();
  });
});

describe('setupRabbitMQAdvancedEnv (federation)', () => {
  it('T-RMQ-ADV-022 listUpstreams + listLinks reflect registered federation config', async () => {
    const env = await makeEnv({
      federation: {
        upstreams: [{ name: 'up1', uri: 'amqp://upstream-broker:5672' }],
        links: [{ upstreamName: 'up1', downstreamExchange: 'ex.downstream' }],
      },
    });
    expect(env.federation.listUpstreams()).toHaveLength(1);
    expect(env.federation.listLinks()).toHaveLength(1);
  });

  it('T-RMQ-ADV-023 ingestFromUpstream to exchange federates the message', async () => {
    const env = await makeEnv({
      exchanges: [{ name: 'ex.down', type: 'direct' }],
      queues: [{ name: 'q.down' }],
      bindings: [{ exchange: 'ex.down', queue: 'q.down', routingKey: 'k' }],
      federation: {
        upstreams: [{ name: 'up1', uri: 'amqp://x' }],
        links: [{ upstreamName: 'up1', downstreamExchange: 'ex.down' }],
      },
    });
    await env.federation.ingestFromUpstream({
      upstreamName: 'up1',
      exchange: 'ex.down',
      routingKey: 'k',
      body: 'from-upstream',
    });
    expect(env.peek('q.down')).toHaveLength(1);
  });

  it('T-RMQ-ADV-024 ingestFromUpstream rejects unknown upstream', async () => {
    const env = await makeEnv();
    await expect(
      env.federation.ingestFromUpstream({
        upstreamName: 'missing',
        exchange: '',
        routingKey: '',
        body: 'x',
      }),
    ).rejects.toThrow(/not registered/);
  });

  it('T-RMQ-ADV-025 ingestFromUpstream rejects when no link matches', async () => {
    const env = await makeEnv({
      federation: {
        upstreams: [{ name: 'up1', uri: 'amqp://x' }],
      },
    });
    await expect(
      env.federation.ingestFromUpstream({
        upstreamName: 'up1',
        exchange: 'ex.missing',
        routingKey: '',
        body: 'x',
      }),
    ).rejects.toThrow(/no federation link/);
  });
});

describe('setupRabbitMQAdvancedEnv (auto-reconnect)', () => {
  it('T-RMQ-ADV-026 simulateReconnect succeeds after failAttempts', async () => {
    const env = await makeEnv();
    const result = await env.autoReconnect.simulateReconnect({ failAttempts: 2 });
    expect(result.succeeded).toBe(true);
    expect(result.attempts).toBe(3);
    // 100 + 200 = 300 (max 1000 not hit).
    expect(result.totalDelayMs).toBe(300);
  });

  it('T-RMQ-ADV-027 simulateReconnect gives up after maxAttempts', async () => {
    const env = await makeEnv({ autoReconnect: { maxAttempts: 3 } });
    const result = await env.autoReconnect.simulateReconnect({ failAttempts: 10 });
    expect(result.succeeded).toBe(false);
    expect(result.attempts).toBe(3);
  });

  it('T-RMQ-ADV-028 backoff caps at maxDelayMs', async () => {
    const env = await makeEnv({
      autoReconnect: { initialDelayMs: 400, factor: 2, maxDelayMs: 500 },
    });
    const result = await env.autoReconnect.simulateReconnect({ failAttempts: 3 });
    // 400 + 500 (capped) + 500 (capped) = 1400.
    expect(result.totalDelayMs).toBe(1400);
  });
});

describe('setupRabbitMQAdvancedEnv (reset + lifecycle)', () => {
  it('T-RMQ-ADV-029 reset clears DLX + delayed + cluster + federation state', async () => {
    const env = await makeEnv({
      exchanges: [{ name: 'dlx', type: 'direct' }],
      queues: [{ name: 'q', deadLetterExchange: 'dlx' }],
      cluster: { nodes: [{ id: 'n1', role: 'primary', active: true }] },
      federation: { upstreams: [{ name: 'up1', uri: 'amqp://x' }] },
    });
    await env.consume({ queue: 'q', handler: (m) => m.nack({ requeue: false }) });
    await env.sendToQueue({ queue: 'q', body: 'x' });
    await env.dlx.assertDeadLettered('q');
    await env.reset();
    expect(env.dlx.listDeadLetters()).toHaveLength(0);
    expect(env.cluster.listNodes()).toHaveLength(0);
    expect(env.federation.listUpstreams()).toHaveLength(0);
  });

  it('T-RMQ-ADV-030 stop() implicitly resets', async () => {
    const env = await setupRabbitMQAdvancedEnv({
      cluster: { nodes: [{ id: 'n1', role: 'primary', active: true }] },
    });
    await env.stop();
    expect(env.cluster.listNodes()).toHaveLength(0);
  });
});
