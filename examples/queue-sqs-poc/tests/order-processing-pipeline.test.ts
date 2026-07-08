import { afterEach, describe, expect, it } from 'vitest';
import { setupSQSEnv, type SQSTestEnv } from '@kiwa/queue';
import {
  collectFifoDeliveries,
  createBillingSink,
  drainQueue,
  type OrderEvent,
} from '../src/order-processing-pipeline.js';

const envs: SQSTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(): Promise<SQSTestEnv> {
  const env = await setupSQSEnv({
    queues: [
      {
        name: 'orders',
        visibilityTimeoutSeconds: 0.05,
        redrivePolicy: { deadLetterTargetArn: 'orders-dlq', maxReceiveCount: 3 },
      },
      { name: 'orders-dlq' },
    ],
  });
  envs.push(env);
  return env;
}

describe('SQS PoC — order processing pipeline (happy path)', () => {
  it('T-SQS-POC-001 charges every order that lands on the queue', async () => {
    const env = await makeEnv();
    const sink = createBillingSink();
    const orders: OrderEvent[] = [
      { orderId: 'o-1', amount: 100, customer: 'a' },
      { orderId: 'o-2', amount: 200, customer: 'b' },
      { orderId: 'o-3', amount: 300, customer: 'c' },
    ];
    for (const o of orders) await env.send('orders', o);
    await drainQueue(env, 'orders', sink);
    expect(sink.charges.map((c) => c.orderId).sort()).toEqual(['o-1', 'o-2', 'o-3']);
    await env.assertQueueDrained('orders');
  });

  it('T-SQS-POC-002 batch send + batch delete round-trip', async () => {
    const env = await makeEnv();
    const sink = createBillingSink();
    const orders: OrderEvent[] = Array.from({ length: 5 }, (_, i) => ({
      orderId: `b-${i}`,
      amount: 10 * i,
      customer: `c-${i}`,
    }));
    await env.sendBatch(
      'orders',
      orders.map((o, i) => ({ id: `e-${i}`, body: o })),
    );
    await drainQueue(env, 'orders', sink);
    expect(sink.charges).toHaveLength(5);
  });
});

describe('SQS PoC — order processing pipeline (retry + DLQ)', () => {
  it('T-SQS-POC-003 transient failures burn attempts then deliver', async () => {
    const env = await makeEnv();
    const sink = createBillingSink({ transientFailures: 2 });
    await env.send('orders', { orderId: 'o-1', amount: 50, customer: 'x' });
    await drainQueue(env, 'orders', sink);
    expect(sink.charges).toHaveLength(1);
    expect(sink.charges[0]?.orderId).toBe('o-1');
  });

  it('T-SQS-POC-004 permanent failures exceed maxReceiveCount and route to DLQ', async () => {
    const env = await makeEnv();
    const sink = createBillingSink({ hardFailureFor: ['broken-1'] });
    await env.send('orders', { orderId: 'broken-1', amount: 999, customer: 'x' });
    // Drive receive count past maxReceiveCount=3.
    await drainQueue(env, 'orders', sink, { maxIterations: 30 });
    const dlqEntries = env.listDeadLetters('orders-dlq');
    expect(dlqEntries).toHaveLength(1);
    expect(dlqEntries[0]?.body).toEqual({ orderId: 'broken-1', amount: 999, customer: 'x' });
  });

  it('T-SQS-POC-005 mixed batch — some succeed, some DLQ', async () => {
    const env = await makeEnv();
    const sink = createBillingSink({ hardFailureFor: ['broken-1'] });
    await env.send('orders', { orderId: 'o-good', amount: 100, customer: 'a' });
    await env.send('orders', { orderId: 'broken-1', amount: 999, customer: 'b' });
    await env.send('orders', { orderId: 'o-good-2', amount: 200, customer: 'c' });
    await drainQueue(env, 'orders', sink, { maxIterations: 30 });
    expect(sink.charges.map((c) => c.orderId).sort()).toEqual(['o-good', 'o-good-2']);
    expect(env.listDeadLetters('orders-dlq')).toHaveLength(1);
  });
});

describe('SQS PoC — FIFO ordering', () => {
  it('T-SQS-POC-006 FIFO queue preserves per-group ordering', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'orders.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    await env.send(
      'orders.fifo',
      { orderId: 'a1', amount: 10, customer: 'a' },
      { messageGroupId: 'customer-a', messageDeduplicationId: 'a1' },
    );
    await env.send(
      'orders.fifo',
      { orderId: 'a2', amount: 20, customer: 'a' },
      { messageGroupId: 'customer-a', messageDeduplicationId: 'a2' },
    );
    await env.send(
      'orders.fifo',
      { orderId: 'b1', amount: 30, customer: 'b' },
      { messageGroupId: 'customer-b', messageDeduplicationId: 'b1' },
    );
    const deliveries = await collectFifoDeliveries(env, 'orders.fifo');
    // customer-a events preserve a1 → a2 order; customer-b arrives independently.
    const groupA = deliveries.filter((d) => d.groupId === 'customer-a').map((d) => d.orderId);
    const groupB = deliveries.filter((d) => d.groupId === 'customer-b').map((d) => d.orderId);
    expect(groupA).toEqual(['a1', 'a2']);
    expect(groupB).toEqual(['b1']);
  });

  it('T-SQS-POC-007 FIFO deduplication collapses duplicate sends', async () => {
    const env = await setupSQSEnv({
      queues: [{ name: 'orders.fifo', kind: 'fifo' }],
    });
    envs.push(env);
    const first = await env.send(
      'orders.fifo',
      { orderId: 'o-1', amount: 10, customer: 'a' },
      { messageGroupId: 'c-a', messageDeduplicationId: 'dedup-1' },
    );
    const second = await env.send(
      'orders.fifo',
      { orderId: 'o-1-duplicate', amount: 999, customer: 'evil' },
      { messageGroupId: 'c-a', messageDeduplicationId: 'dedup-1' },
    );
    // Duplicate dedup id returns the original message unchanged.
    expect(second.messageId).toBe(first.messageId);
    expect(env.listMessages('orders.fifo')).toHaveLength(1);
  });
});

describe('SQS PoC — long polling', () => {
  it('T-SQS-POC-008 waitTimeSeconds picks up a message that arrives late', async () => {
    const env = await makeEnv();
    const receivePromise = env.receive('orders', { waitTimeSeconds: 1 });
    setTimeout(() => {
      void env.send('orders', { orderId: 'late-1', amount: 5, customer: 'x' });
    }, 30);
    const received = await receivePromise;
    expect(received).toHaveLength(1);
    expect(received[0]?.body).toEqual({ orderId: 'late-1', amount: 5, customer: 'x' });
  });
});
