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

/**
 * Coverage batch 1 — setup-rabbitmq-advanced-env. Existing suite covers DLX
 * rejection, delayed advanceClock, cluster, federation-to-exchange, and
 * auto-reconnect. Missing branches: delivery-limit dead-letter reason,
 * waitForDelivery-based delayed dispatch, federation sendToQueue path.
 */

describe('setupRabbitMQAdvancedEnv (DLX — delivery-limit branch)', () => {
  it('T-RMQ-ADV-031 nack requeue=false with maxDeliveries but no DLX exercises the delivery-limit branch', async () => {
    // No DLX exchange configured but maxDeliveries=1 — the else-if in the
    // wrapped nack fires. dispatchDeadLetter early-returns because dlx is
    // undefined; the important thing for coverage is the branch runs.
    const env = await makeEnv({
      queues: [{ name: 'q.limit', maxDeliveries: 1 }],
    });
    await env.consume({
      queue: 'q.limit',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.limit', body: 'x' });
    await new Promise((r) => setTimeout(r, 50));
    // Nothing lands on the dead-letter list because there is no DLX.
    expect(env.dlx.listDeadLetters()).toHaveLength(0);
  });

  it('T-RMQ-ADV-032 nack requeue=false with BOTH DLX and maxDeliveries prefers the rejected reason', async () => {
    // Both branches technically apply — the code takes the first (rejected).
    // Guard: only one dead-letter fires, and reason=rejected.
    const env = await makeEnv({
      exchanges: [{ name: 'dlx.both', type: 'direct' }],
      queues: [
        {
          name: 'q.both',
          deadLetterExchange: 'dlx.both',
          maxDeliveries: 1,
        },
      ],
    });
    await env.consume({
      queue: 'q.both',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.both', body: 'x' });
    const dl = await env.dlx.assertDeadLettered('q.both');
    expect(dl.reason).toBe('rejected');
    expect(env.dlx.listDeadLetters()).toHaveLength(1);
  });
});

describe('setupRabbitMQAdvancedEnv (delayed — waitForDelivery)', () => {
  it('T-RMQ-ADV-033 waitForDelivery resolves once the delay has elapsed', async () => {
    const env = await makeEnv({
      delayedExchanges: [
        { name: 'ex.wait', type: 'x-delayed-message', delayedType: 'direct' },
      ],
      queues: [{ name: 'q.wait' }],
      bindings: [{ exchange: 'ex.wait', queue: 'q.wait', routingKey: 'k' }],
    });
    await env.delayed.publishDelayed({
      exchange: 'ex.wait',
      routingKey: 'k',
      body: 'later',
      delayMs: 20,
    });
    const snap = await env.delayed.waitForDelivery('ex.wait', { timeoutMs: 500 });
    expect(snap.exchange).toBe('ex.wait');
    expect(snap.routingKey).toBe('k');
  });

  it('T-RMQ-ADV-034 waitForDelivery rejects when nothing arrives within the timeout', async () => {
    const env = await makeEnv({
      delayedExchanges: [
        { name: 'ex.never', type: 'x-delayed-message', delayedType: 'direct' },
      ],
    });
    // No publishDelayed call — waitForDelivery should time out.
    await expect(
      env.delayed.waitForDelivery('ex.never', { timeoutMs: 30 }),
    ).rejects.toThrow(/no delayed message delivered/);
  });
});

describe('setupRabbitMQAdvancedEnv (consume — options-defined branch)', () => {
  it('T-RMQ-ADV-036 consume with explicit options forwards them through the DLX wrapper', async () => {
    const env = await makeEnv({
      queues: [{ name: 'q.opt' }],
    });
    const seen: unknown[] = [];
    await env.consume({
      queue: 'q.opt',
      handler: (msg) => {
        seen.push(msg.body);
        msg.ack();
      },
      // Pass an explicit options object so the `if (input.options !== undefined)`
      // branch inside the DLX wrapper is exercised.
      options: { consumerTag: 'tagged-consumer', prefetch: 5 },
    });
    await env.sendToQueue({ queue: 'q.opt', body: 'ping' });
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toEqual(['ping']);
  });
});

describe('setupRabbitMQAdvancedEnv (publish — inner passthrough)', () => {
  it('T-RMQ-ADV-037 publish path routes through inner publish and lands on the bound queue', async () => {
    const env = await makeEnv({
      exchanges: [{ name: 'ex.pub', type: 'direct' }],
      queues: [{ name: 'q.pub' }],
      bindings: [{ exchange: 'ex.pub', queue: 'q.pub', routingKey: 'k' }],
    });
    // The advanced env delegates publish to inner.publish — exercise that
    // path directly (existing tests use sendToQueue for most flows).
    await env.publish({ exchange: 'ex.pub', routingKey: 'k', body: 'ping' });
    expect(env.peek('q.pub')).toHaveLength(1);
  });
});

describe('setupRabbitMQAdvancedEnv (federation — sendToQueue path)', () => {
  it('T-RMQ-ADV-035 ingestFromUpstream routes to downstreamQueue when the link points at a queue', async () => {
    const env = await makeEnv({
      queues: [{ name: 'q.down' }],
      federation: {
        upstreams: [{ name: 'up1', uri: 'amqp://upstream' }],
        // Link points at a downstream queue instead of an exchange.
        links: [{ upstreamName: 'up1', downstreamQueue: 'q.down' }],
      },
    });
    await env.federation.ingestFromUpstream({
      upstreamName: 'up1',
      exchange: '',
      routingKey: '',
      body: { from: 'upstream' },
    });
    expect(env.peek('q.down')).toHaveLength(1);
  });
});
