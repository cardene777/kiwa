import { afterEach, describe, expect, it } from 'vitest';
import { createKafkaMock, isKafkaMock, type KafkaMock } from '../src/index.js';

const mocks: KafkaMock[] = [];

afterEach(() => {
  while (mocks.length > 0) {
    const m = mocks.pop();
    m?.reset();
  }
});

describe('createKafkaMock (basic surface)', () => {
  it('T-KAFKA-001 exposes producer / consumer / admin factories', () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    expect(isKafkaMock(kafka)).toBe(true);
    expect(typeof kafka.producer).toBe('function');
    expect(typeof kafka.consumer).toBe('function');
    expect(typeof kafka.admin).toBe('function');
  });

  it('T-KAFKA-002 producer must connect before send', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await expect(
      producer.send({ topic: 'orders', messages: [{ value: 'x' }] }),
    ).rejects.toThrow(/before connect/);
  });

  it('T-KAFKA-003 producer sends a single message and returns offset 0', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    const result = await producer.send({
      topic: 'orders',
      messages: [{ key: 'user-1', value: { total: 42 } }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.offset).toBe(0);
    expect(result[0]?.topic).toBe('orders');
  });

  it('T-KAFKA-004 keyed messages hash to a stable partition', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    const first = await producer.send({
      topic: 'orders',
      messages: [{ key: 'stable-key', value: 1 }],
    });
    const second = await producer.send({
      topic: 'orders',
      messages: [{ key: 'stable-key', value: 2 }],
    });
    expect(first[0]?.partition).toBe(second[0]?.partition);
  });

  it('T-KAFKA-005 explicit partition overrides the hash', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    const [result] = await producer.send({
      topic: 'orders',
      messages: [{ value: 'x', partition: 2 }],
    });
    expect(result?.partition).toBe(2);
  });

  it('T-KAFKA-006 out-of-range partition throws', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 2 });
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await expect(
      producer.send({ topic: 'orders', messages: [{ value: 'x', partition: 99 }] }),
    ).rejects.toThrow(/out of range/);
  });

  it('T-KAFKA-007 sendBatch flattens multi-record results', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    const results = await producer.sendBatch([
      { topic: 'a', messages: [{ value: 1 }, { value: 2 }] },
      { topic: 'b', messages: [{ value: 3 }] },
    ]);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.topic).sort()).toEqual(['a', 'a', 'b']);
  });
});

describe('createKafkaMock (consumer)', () => {
  it('T-KAFKA-008 consumer reads messages committed to its assigned partitions', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'hello' }] });

    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    const seen: unknown[] = [];
    await consumer.run({
      eachMessage: async (m) => {
        seen.push(m.value);
      },
    });
    expect(seen).toEqual(['hello']);
  });

  it('T-KAFKA-009 auto-commit advances the committed offset', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'a' }, { value: 'b' }] });
    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    await consumer.run({ eachMessage: async () => {} });
    expect(kafka.getCommittedOffset('g1', 'orders', 0)).toBe(2);
  });

  it('T-KAFKA-010 autoCommit=false keeps the offset at the seek origin', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'a' }] });
    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    await consumer.run({ autoCommit: false, eachMessage: async () => {} });
    expect(kafka.getCommittedOffset('g1', 'orders', 0)).toBe(0);
  });

  it('T-KAFKA-011 explicit commitOffsets records the intended offset', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'x' }, { value: 'y' }] });
    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    await consumer.commitOffsets([{ topic: 'orders', partition: 0, offset: 5 }]);
    expect(kafka.getCommittedOffset('g1', 'orders', 0)).toBe(5);
  });

  it('T-KAFKA-012 seek() overrides the read start position for the next run', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'a' }, { value: 'b' }, { value: 'c' }] });
    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    consumer.seek({ topic: 'orders', partition: 0, offset: 2 });
    const seen: unknown[] = [];
    await consumer.run({
      eachMessage: async (m) => {
        seen.push(m.value);
      },
    });
    expect(seen).toEqual(['c']);
  });

  it('T-KAFKA-013 range assigner splits partitions in contiguous blocks', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'seed' }] });
    const c1 = kafka.consumer({ groupId: 'g1', partitionAssigner: 'range' });
    await c1.connect();
    await c1.subscribe({ topics: ['orders'] });
    const assignments = c1.assignments().get('orders') ?? [];
    // Single consumer owns all partitions under range assigner.
    expect(assignments.length).toBe(4);
  });

  it('T-KAFKA-014 round-robin assigner distributes partitions across two consumers', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'seed' }] });
    const c1 = kafka.consumer({ groupId: 'g1', partitionAssigner: 'round-robin' });
    const c2 = kafka.consumer({ groupId: 'g1', partitionAssigner: 'round-robin' });
    await c1.connect();
    await c2.connect();
    await c1.subscribe({ topics: ['orders'] });
    await c2.subscribe({ topics: ['orders'] });
    const a1 = c1.assignments().get('orders') ?? [];
    const a2 = c2.assignments().get('orders') ?? [];
    expect(a1.length + a2.length).toBe(4);
    expect(a1.length).toBe(2);
  });
});

describe('createKafkaMock (admin)', () => {
  it('T-KAFKA-015 admin createTopics + listTopics roundtrip', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'a' }, { topic: 'b', numPartitions: 3 }] });
    const list = await admin.listTopics();
    expect(list.sort()).toEqual(['a', 'b']);
  });

  it('T-KAFKA-016 fetchTopicMetadata returns partition count', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'x', numPartitions: 5 }] });
    const meta = await admin.fetchTopicMetadata({ topics: ['x'] });
    expect(meta.topics[0]?.numPartitions).toBe(5);
  });

  it('T-KAFKA-017 admin.deleteTopics removes the topic from listing', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'z' }] });
    await admin.deleteTopics({ topics: ['z'] });
    expect(await admin.listTopics()).toEqual([]);
  });

  it('T-KAFKA-018 fetchTopicMetadata throws on unknown topic', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const admin = kafka.admin();
    await admin.connect();
    await expect(
      admin.fetchTopicMetadata({ topics: ['nope'] }),
    ).rejects.toThrow(/unknown topic/);
  });
});

describe('createKafkaMock (topic accessors)', () => {
  it('T-KAFKA-019 getTopicMessages returns append order across partitions', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 2 });
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: 'orders',
      messages: [
        { value: 'p0-1', partition: 0 },
        { value: 'p1-1', partition: 1 },
        { value: 'p0-2', partition: 0 },
      ],
    });
    const all = kafka.getTopicMessages('orders');
    expect(all).toHaveLength(3);
    expect(all.map((m) => m.value)).toEqual(['p0-1', 'p0-2', 'p1-1']);
  });

  it('T-KAFKA-020 reset() clears topics + committed offsets', async () => {
    const kafka = createKafkaMock();
    mocks.push(kafka);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'x' }] });
    kafka.reset();
    expect(kafka.getTopicMessages('orders')).toEqual([]);
    expect(kafka.getCommittedOffset('g1', 'orders', 0)).toBeUndefined();
  });

  it('T-KAFKA-021 isKafkaMock rejects non-mocks', () => {
    expect(isKafkaMock({})).toBe(false);
    expect(isKafkaMock(null)).toBe(false);
    expect(isKafkaMock('kafka')).toBe(false);
  });
});
