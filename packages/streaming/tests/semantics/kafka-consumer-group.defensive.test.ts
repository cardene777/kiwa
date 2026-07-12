import { describe, expect, it } from 'vitest';
import { createKafkaConsumerGroup } from '../../src/index.js';

// Follow-up file — closes the reachable branches in kafka-consumer-group.js
// that kafka-consumer-group.branches.test.ts leaves open: the
// `partitionCount === 0` arm of the `assignRange` early return (member
// subscribes to a topic that was never registered) and the same short-circuit
// with the empty-members alternative.
//
// Complements kafka-consumer-group.branches.test.ts (T-KCG-B-001..005).

describe('createKafkaConsumerGroup defensive guards', () => {
  it('T-KCG-B-006 assignRange short-circuits when a subscribed topic has no partitions registered', () => {
    // Deliberately do NOT registerTopic('ghost', N) — partitionCount defaults
    // to 0 → assignRange returns the empty-buckets map without splitting.
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    const joined = group.joinGroup({ subscribedTopics: ['ghost'] });
    const members = group.listMembers();
    const me = members.find((m) => m.memberId === joined.memberId);
    // The member exists but owns zero partitions for the unregistered topic.
    expect(me?.assignedPartitions.get('ghost') ?? []).toEqual([]);
  });

  it('T-KCG-B-007 rebalance with zero members produces an empty assignments view', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 4);
    // No members registered → performRebalance path where memberIds is empty.
    const result = group.rebalance();
    expect(result.assignments.size).toBe(0);
    expect(result.reassignedMembers).toEqual([]);
  });

  it('T-KCG-B-008 heartbeat throws for unknown member ids', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    expect(() => group.heartbeat('never-joined')).toThrow(/unknown member/);
  });

  it('T-KCG-B-009 static group members reuse memberId + skip rebalance on rejoin', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 4);
    const first = group.joinGroup({
      subscribedTopics: ['t'],
      groupInstanceId: 'static-a',
    });
    const genBefore = group.generation();
    // Rejoin with the same static instance id — memberId returns unchanged
    // and generation stays put (KIP-345 static membership).
    const second = group.joinGroup({
      subscribedTopics: ['t'],
      groupInstanceId: 'static-a',
    });
    expect(second.memberId).toBe(first.memberId);
    expect(group.generation()).toBe(genBefore);
  });
});
