import { createKafkaMock } from '@kiwa-lab/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createConsumerRun } from '../src/consumer/index.js';

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

async function seed(topic: string, count: number, kafka: ReturnType<typeof createKafkaMock>) {
  const producer = kafka.producer();
  await producer.connect();
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await producer.send({
      topic,
      messages: [{ key: `k-${i}`, value: { seq: i } }],
    });
  }
  await producer.disconnect();
}

describe('consumer flow — consumer group + offset commit + rebalance', () => {
  it('T-DKC-001 single consumer reads all messages from all partitions', async () => {
    const kafka = makeMock(4);
    await seed('events', 8, kafka);
    const c = createConsumerRun(kafka, { groupId: 'g1', partitionAssigner: 'round-robin' });
    await c.connect();
    const rb = await c.subscribe(['events'], { fromBeginning: true });
    expect(rb.assignments.get('events')?.length).toBe(4);
    const consumed = await c.consume({ autoCommit: true });
    expect(consumed.length).toBe(8);
    await c.disconnect();
  });

  it('T-DKC-002 two consumers in the same group split the partitions', async () => {
    const kafka = makeMock(4);
    await seed('events', 8, kafka);
    const c1 = createConsumerRun(
      kafka,
      { groupId: 'g2', partitionAssigner: 'round-robin' },
      { consumerId: 'A' },
    );
    const c2 = createConsumerRun(
      kafka,
      { groupId: 'g2', partitionAssigner: 'round-robin' },
      { consumerId: 'B' },
    );
    await c1.connect();
    await c2.connect();
    await c1.subscribe(['events'], { fromBeginning: true });
    await c2.subscribe(['events'], { fromBeginning: true });
    // Read the *current* assignments after both consumers have joined so the
    // rebalance has settled — the RebalanceEvent snapshot returned from
    // subscribe() is stale for the first consumer.
    const a1 = c1.consumer.assignments().get('events') ?? [];
    const a2 = c2.consumer.assignments().get('events') ?? [];
    expect(a1.length + a2.length).toBe(4);
    expect(a1.length).toBeGreaterThan(0);
    expect(a2.length).toBeGreaterThan(0);
    const consumed1 = await c1.consume({ autoCommit: true });
    const consumed2 = await c2.consume({ autoCommit: true });
    expect(consumed1.length + consumed2.length).toBe(8);
    await c1.disconnect();
    await c2.disconnect();
  });

  it('T-DKC-003 autoCommit=false leaves committed offset at 0 after consume', async () => {
    const kafka = makeMock(1);
    await seed('events', 3, kafka);
    const c = createConsumerRun(kafka, { groupId: 'gnc' });
    await c.connect();
    await c.subscribe(['events'], { fromBeginning: true });
    await c.consume({ autoCommit: false });
    expect(kafka.getCommittedOffset('gnc', 'events', 0)).toBe(0);
    await c.disconnect();
  });

  it('T-DKC-004 explicit commit records the intended offset', async () => {
    const kafka = makeMock(1);
    await seed('events', 5, kafka);
    const c = createConsumerRun(kafka, { groupId: 'gm' });
    await c.connect();
    await c.subscribe(['events'], { fromBeginning: true });
    await c.commit([{ topic: 'events', partition: 0, offset: 3 }]);
    expect(kafka.getCommittedOffset('gm', 'events', 0)).toBe(3);
    await c.disconnect();
  });

  it('T-DKC-005 subscribe emits a rebalance event with the assignment snapshot', async () => {
    const kafka = makeMock(2);
    await seed('events', 2, kafka);
    const c = createConsumerRun(kafka, { groupId: 'gr' });
    await c.connect();
    const rb = await c.subscribe(['events'], { fromBeginning: true });
    expect(rb.consumerId).toBeDefined();
    expect(rb.triggeredAt).toBeGreaterThan(0);
    expect(rb.assignments.get('events')?.length).toBe(2);
    expect(c.rebalances().length).toBe(1);
    await c.disconnect();
  });
});
