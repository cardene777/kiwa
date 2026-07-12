import { describe, expect, it } from 'vitest';
import { createKafkaMock } from '../src/index.js';

// Follow-up file — closes the reachable disconnect / isConnected / connect-guard
// / getter-null branches in kafka.js that kafka.test.ts leaves open.

describe('createKafkaMock producer disconnect + isConnected', () => {
  it('T-KAFKA-B-001 producer.isConnected reflects connect / disconnect transitions', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    expect(producer.isConnected()).toBe(false);
    await producer.connect();
    expect(producer.isConnected()).toBe(true);
    await producer.disconnect();
    expect(producer.isConnected()).toBe(false);
  });

  it('T-KAFKA-B-002 producer.send after disconnect rejects with "before connect"', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    await producer.disconnect();
    await expect(
      producer.send({ topic: 'orders', messages: [{ value: 'x' }] }),
    ).rejects.toThrow(/producer\.send before connect/);
  });

  it('T-KAFKA-B-003 explicit negative partition is rejected as out-of-range', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 2 });
    const producer = kafka.producer();
    await producer.connect();
    await expect(
      producer.send({ topic: 'orders', messages: [{ value: 'x', partition: -1 }] }),
    ).rejects.toThrow(/out of range/);
  });

  it('T-KAFKA-B-004 keyless messages use the round-robin sticky partitioner', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 3 });
    const producer = kafka.producer();
    await producer.connect();
    // Three messages with no key spread across 3 partitions via total-count % N.
    const results = await producer.send({
      topic: 'orders',
      messages: [{ value: 1 }, { value: 2 }, { value: 3 }],
    });
    const partitions = results.map((r) => r.partition).sort();
    expect(new Set(partitions).size).toBe(3);
  });

  it('T-KAFKA-B-005 null explicit key routes through the key === null branch', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    const producer = kafka.producer();
    await producer.connect();
    const [result] = await producer.send({
      topic: 'orders',
      messages: [{ key: null, value: 'nullish' }],
    });
    // Sticky partitioner picks partition 0 for the first message.
    expect(result?.partition).toBe(0);
  });
});

describe('createKafkaMock consumer disconnect + assignments', () => {
  it('T-KAFKA-B-006 consumer.isConnected reflects connect / disconnect transitions', async () => {
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'g' });
    expect(consumer.isConnected()).toBe(false);
    await consumer.connect();
    expect(consumer.isConnected()).toBe(true);
    await consumer.disconnect();
    expect(consumer.isConnected()).toBe(false);
  });

  it('T-KAFKA-B-007 consumer.subscribe before connect rejects', async () => {
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'g' });
    await expect(consumer.subscribe({ topics: ['t'] })).rejects.toThrow(/before connect/);
  });

  it('T-KAFKA-B-008 consumer.run before connect rejects', async () => {
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'g' });
    await expect(consumer.run({ eachMessage: async () => {} })).rejects.toThrow(/before connect/);
  });

  it('T-KAFKA-B-009 consumer.disconnect removes the member from the shared group state', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    const consumer = kafka.consumer({ groupId: 'g', partitionAssigner: 'range' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['t'] });
    expect(consumer.assignments().get('t')?.length ?? 0).toBeGreaterThan(0);
    await consumer.disconnect();
    // After disconnect, the shared member state no longer holds an assignment.
    const survivorAssignments = consumer.assignments().get('t') ?? [];
    expect(survivorAssignments).toEqual([]);
  });

  it('T-KAFKA-B-010 consumer.run skips topics that were subscribed but never produced against', async () => {
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'g' });
    await consumer.connect();
    // Subscribe first (ensureTopic runs), then delete the topic via admin so
    // the internal `topics.get(topicName)` returns undefined during run().
    await consumer.subscribe({ topics: ['ghost'] });
    const admin = kafka.admin();
    await admin.connect();
    await admin.deleteTopics({ topics: ['ghost'] });
    let called = 0;
    await consumer.run({
      eachMessage: async () => {
        called += 1;
      },
    });
    expect(called).toBe(0);
  });

  it('T-KAFKA-B-011 consumer.run auto-commits per message when autoCommit defaults to true', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'a' }, { value: 'b' }, { value: 'c' }] });
    const consumer = kafka.consumer({ groupId: 'g' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    let processed = 0;
    await consumer.run({
      eachMessage: async () => {
        processed += 1;
      },
    });
    expect(processed).toBe(3);
    expect(kafka.getCommittedOffset('g', 'orders', 0)).toBe(3);
  });
});

describe('createKafkaMock admin disconnect + guards', () => {
  it('T-KAFKA-B-012 admin.disconnect drops the connected flag', async () => {
    const kafka = createKafkaMock();
    const admin = kafka.admin();
    await admin.connect();
    await admin.disconnect();
    // After disconnect every admin verb rejects with "before connect".
    await expect(admin.listTopics()).rejects.toThrow(/before connect/);
  });

  it('T-KAFKA-B-013 admin verbs reject before connect', async () => {
    const kafka = createKafkaMock();
    const admin = kafka.admin();
    await expect(admin.createTopics({ topics: [{ topic: 't' }] })).rejects.toThrow(/before connect/);
    await expect(admin.listTopics()).rejects.toThrow(/before connect/);
    await expect(admin.deleteTopics({ topics: ['t'] })).rejects.toThrow(/before connect/);
    await expect(admin.fetchTopicMetadata({ topics: ['t'] })).rejects.toThrow(/before connect/);
  });
});

describe('createKafkaMock commit + run against fresh topics', () => {
  it('T-KAFKA-B-C001 commitOffsets against a topic without existing offsets creates the entry', async () => {
    const kafka = createKafkaMock();
    const consumer = kafka.consumer({ groupId: 'g' });
    await consumer.connect();
    // No subscribe / no autoCommit run — commitOffsets hits the
    // `group.offsets.get(topic) ?? new Map()` fresh-topic branch.
    await consumer.commitOffsets([{ topic: 'fresh', partition: 0, offset: 3 }]);
    expect(kafka.getCommittedOffset('g', 'fresh', 0)).toBe(3);
  });

  it('T-KAFKA-B-C002 run against a topic without prior offsets and no subscription fromBeginning', async () => {
    const kafka = createKafkaMock();
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'fresh', messages: [{ value: 'a' }] });
    const consumer = kafka.consumer({ groupId: 'g' });
    await consumer.connect();
    // fromBeginning=false → no prefilled offset entries, first run() will
    // hit the fresh-topic `?? new Map()` and `?? 0` branches simultaneously.
    await consumer.subscribe({ topics: ['fresh'] });
    const seen: unknown[] = [];
    await consumer.run({
      eachMessage: async (m) => {
        seen.push(m.value);
      },
    });
    // With no offset entry, startOffset falls back to 0 → the seed is read.
    expect(seen).toEqual(['a']);
  });
});

describe('createKafkaMock rebalance across deleted topics', () => {
  it('T-KAFKA-B-016 rebalance assigns empty buckets when a subscribed topic was deleted', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 2 });
    // c1 subscribes to `ghost` which creates the internal state, admin then
    // deletes it, c2 joins the group and forces a rebalance. During the
    // rebalance the ghost topic hits the `!topic || memberIds.length === 0`
    // arm because topics.get('ghost') is now undefined.
    const c1 = kafka.consumer({ groupId: 'g' });
    await c1.connect();
    await c1.subscribe({ topics: ['ghost'] });
    const admin = kafka.admin();
    await admin.connect();
    await admin.deleteTopics({ topics: ['ghost'] });
    const c2 = kafka.consumer({ groupId: 'g' });
    await c2.connect();
    await c2.subscribe({ topics: ['other'] });
    // Assignments for the deleted topic collapse to empty on every member.
    expect(c1.assignments().get('ghost') ?? []).toEqual([]);
    expect(c2.assignments().get('ghost')).toBeUndefined();
  });
});

describe('createKafkaMock topic accessors on missing state', () => {
  it('T-KAFKA-B-014 getTopicMessages returns empty for an unknown topic', () => {
    const kafka = createKafkaMock();
    expect(kafka.getTopicMessages('never-produced')).toEqual([]);
  });

  it('T-KAFKA-B-015 getCommittedOffset returns undefined for unknown group / unknown topic', async () => {
    const kafka = createKafkaMock();
    // Unknown group.
    expect(kafka.getCommittedOffset('none', 'never', 0)).toBeUndefined();
    // Known group + unknown topic.
    const consumer = kafka.consumer({ groupId: 'g' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['seen'] });
    expect(kafka.getCommittedOffset('g', 'never', 0)).toBeUndefined();
  });
});
