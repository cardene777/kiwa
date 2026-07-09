import { afterEach, describe, expect, it } from 'vitest';
import { setupRabbitMQEnv, type RabbitMQTestEnv } from '@kiwa-lab/queue';
import { fanoutOrderThroughPipeline, runRetryConsumer } from '../src/order-pipeline.js';

const envs: RabbitMQTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(): Promise<RabbitMQTestEnv> {
  const env = await setupRabbitMQEnv();
  envs.push(env);
  return env;
}

describe('queue-rabbitmq-basic PoC — 3-exchange fanout pipeline', () => {
  it('T-RMQ-POC-001 direct + topic + fanout each queue receives the order', async () => {
    const env = await makeEnv();
    const depths = await fanoutOrderThroughPipeline(env, {
      id: 'ord-1',
      region: 'us',
      priority: 'high',
      total: 1250,
    });
    expect(depths).toEqual({ fulfillmentDepth: 1, auditDepth: 1, analyticsDepth: 1 });
  });

  it('T-RMQ-POC-002 unrelated region does not hit fulfillment binding', async () => {
    const env = await makeEnv();
    // eu order is only sent to the eu binding; us fulfillment queue must stay empty.
    await env.declareExchange({ name: 'orders.direct', type: 'direct' });
    await env.declareQueue({ name: 'fulfillment.us' });
    await env.bindQueue({ exchange: 'orders.direct', queue: 'fulfillment.us', routingKey: 'us' });
    await env.publish({ exchange: 'orders.direct', routingKey: 'eu', body: { id: 'x' } });
    expect(env.peek('fulfillment.us')).toHaveLength(0);
  });

  it('T-RMQ-POC-003 topic wildcards route by priority segment', async () => {
    const env = await makeEnv();
    await env.declareExchange({ name: 'orders.topic', type: 'topic' });
    await env.declareQueue({ name: 'high-priority' });
    await env.bindQueue({
      exchange: 'orders.topic',
      queue: 'high-priority',
      routingKey: '*.high',
    });
    await env.publish({ exchange: 'orders.topic', routingKey: 'us.high', body: 1 });
    await env.publish({ exchange: 'orders.topic', routingKey: 'us.low', body: 2 });
    expect(env.peek('high-priority')).toHaveLength(1);
  });
});

describe('queue-rabbitmq-basic PoC — retry with requeue', () => {
  it('T-RMQ-POC-004 fails twice then succeeds on the third delivery', async () => {
    const env = await makeEnv();
    const result = await runRetryConsumer(env, {
      queue: 'retry-queue',
      failuresBeforeSuccess: 2,
    });
    expect(result.finalDeliveryCount).toBe(3);
  });
});

describe('queue-rabbitmq-basic PoC — headers exchange enterprise routing', () => {
  it('T-RMQ-POC-005 x-match=all routes VIP + region tuple correctly', async () => {
    const env = await makeEnv();
    await env.declareExchange({ name: 'ex.vip', type: 'headers' });
    await env.declareQueue({ name: 'q.us-vip' });
    await env.bindQueue({
      exchange: 'ex.vip',
      queue: 'q.us-vip',
      routingKey: '',
      args: { 'x-match': 'all', vip: true, region: 'us' },
    });
    await env.publish({
      exchange: 'ex.vip',
      routingKey: '',
      body: 'match',
      options: { headers: { vip: true, region: 'us' } },
    });
    await env.publish({
      exchange: 'ex.vip',
      routingKey: '',
      body: 'no-match',
      options: { headers: { vip: true, region: 'eu' } },
    });
    expect(env.peek('q.us-vip')).toHaveLength(1);
  });
});

describe('queue-rabbitmq-basic PoC — QoS prefetch limits concurrent processing', () => {
  it('T-RMQ-POC-006 prefetch=1 processes messages strictly one at a time', async () => {
    const env = await makeEnv();
    await env.declareQueue({ name: 'q.serial' });
    let inFlight = 0;
    let peakInFlight = 0;
    const acks: Array<() => void> = [];
    await env.consume({
      queue: 'q.serial',
      handler: (msg) => {
        inFlight += 1;
        if (inFlight > peakInFlight) peakInFlight = inFlight;
        acks.push(() => {
          inFlight -= 1;
          msg.ack();
        });
      },
      options: { prefetch: 1 },
    });
    for (let i = 0; i < 3; i++) {
      await env.sendToQueue({ queue: 'q.serial', body: i });
    }
    await new Promise((r) => setTimeout(r, 20));
    while (acks.length > 0) {
      acks.shift()!();
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(peakInFlight).toBe(1);
    await env.assertQueueDrained('q.serial');
  });
});

describe('queue-rabbitmq-basic PoC — unroutable + mandatory returns', () => {
  it('T-RMQ-POC-007 mandatory publish records a return when no binding matches', async () => {
    const env = await makeEnv();
    await env.declareExchange({ name: 'ex', type: 'direct' });
    await env.publish({
      exchange: 'ex',
      routingKey: 'nowhere',
      body: 'x',
      options: { mandatory: true },
    });
    expect(env.listReturned()).toHaveLength(1);
  });
});

describe('queue-rabbitmq-basic PoC — dead-letter simulation via nack requeue=false', () => {
  it('T-RMQ-POC-008 nack without requeue marks the message dead-nacked', async () => {
    const env = await makeEnv();
    await env.declareQueue({ name: 'q.deadletter' });
    await env.consume({
      queue: 'q.deadletter',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'q.deadletter', body: 'poison' });
    const snap = await env.waitForMessage('q.deadletter', {
      match: (m) => m.state === 'nacked',
    });
    expect(snap.state).toBe('nacked');
  });
});
