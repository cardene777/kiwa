import { createKafkaMock } from '@kiwa-test/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createProducerRun, type OrderEvent } from '../src/producer/index.js';

let kafkaRef: ReturnType<typeof createKafkaMock> | null = null;

afterEach(() => {
  kafkaRef?.reset();
  kafkaRef = null;
});

function makeMock(partitions = 4) {
  const kafka = createKafkaMock({ defaultPartitionCount: partitions });
  kafkaRef = kafka;
  return kafka;
}

const orders: OrderEvent[] = [
  { orderId: 'o1', region: 'us', total: 100 },
  { orderId: 'o2', region: 'eu', total: 200 },
  { orderId: 'o3', region: 'apac', total: 300 },
  { orderId: 'o4', region: 'us', total: 400 },
];

describe('producer flow — idempotent + partition key + batch', () => {
  it('T-DKP-001 publishBatch sends every event once with distinct partitions per region key', async () => {
    const kafka = makeMock(4);
    const run = createProducerRun(kafka, 'orders');
    await run.connect();
    const results = await run.publishBatch('orders', orders, 100);
    expect(results).toHaveLength(orders.length);
    // us + eu + apac → at most 3 distinct partitions (2 us events may share).
    const partitions = new Set(results.map((r) => r.partition));
    expect(partitions.size).toBeGreaterThanOrEqual(2);
    await run.disconnect();
  });

  it('T-DKP-002 identical sequence number is deduplicated (idempotent producer)', async () => {
    const kafka = makeMock();
    const run = createProducerRun(kafka, 'orders');
    await run.connect();
    const first = await run.publishOrder(orders[0]!, 42);
    // Retry same sequence → empty result set (dedup).
    const dup = await run.publishOrder(orders[0]!, 42);
    expect(first).toHaveLength(1);
    expect(dup).toHaveLength(0);
    expect(run.duplicates()).toBe(1);
    await run.disconnect();
  });

  it('T-DKP-003 same region key hashes to the same partition (stable partition key)', async () => {
    const kafka = makeMock(8);
    const run = createProducerRun(kafka, 'orders');
    await run.connect();
    const [a] = await run.publishOrder({ orderId: 'x1', region: 'eu', total: 10 }, 1);
    const [b] = await run.publishOrder({ orderId: 'x2', region: 'eu', total: 20 }, 2);
    expect(a?.partition).toBe(b?.partition);
    await run.disconnect();
  });

  it('T-DKP-004 publishBatch increments sequence per event starting at startSequence', async () => {
    const kafka = makeMock();
    const run = createProducerRun(kafka, 'orders');
    await run.connect();
    await run.publishBatch('orders', orders, 500);
    // Retry starting from 500 → every event is a duplicate.
    const retry = await run.publishBatch('orders', orders, 500);
    expect(retry).toHaveLength(0);
    expect(run.duplicates()).toBe(orders.length);
    await run.disconnect();
  });
});
