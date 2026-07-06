import { describe, expect, it } from 'vitest';
import { createKafkaConsumerGroup, isKafkaConsumerGroup } from '../../src/index.js';

describe('createKafkaConsumerGroup', () => {
  it('T-KCG-001 joinGroup returns a memberId and increments generation', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    expect(isKafkaConsumerGroup(group)).toBe(true);
    group.registerTopic('t', 4);
    const first = group.joinGroup({ subscribedTopics: ['t'] });
    expect(first.memberId).toContain('g-member-');
    expect(first.generationId).toBe(1);
    const second = group.joinGroup({ subscribedTopics: ['t'] });
    expect(second.generationId).toBe(2);
  });

  it('T-KCG-002 range assigner splits partitions across members', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 4);
    group.joinGroup({ subscribedTopics: ['t'] });
    group.joinGroup({ subscribedTopics: ['t'] });
    const members = group.listMembers();
    expect(members).toHaveLength(2);
    const perMember = members.map((m) => m.assignedPartitions.get('t') ?? []);
    const total = perMember.flat();
    expect(total.sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it('T-KCG-003 static member reconnect skips rebalance', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 2);
    const first = group.joinGroup({ subscribedTopics: ['t'], groupInstanceId: 'pod-1' });
    const genAfterFirst = group.generation();
    const rejoin = group.joinGroup({ subscribedTopics: ['t'], groupInstanceId: 'pod-1' });
    expect(rejoin.memberId).toBe(first.memberId);
    expect(group.generation()).toBe(genAfterFirst);
  });

  it('T-KCG-004 leaveGroup triggers a rebalance', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 2);
    const a = group.joinGroup({ subscribedTopics: ['t'] });
    group.joinGroup({ subscribedTopics: ['t'] });
    const before = group.generation();
    group.leaveGroup(a.memberId);
    expect(group.generation()).toBe(before + 1);
    expect(group.listMembers()).toHaveLength(1);
  });

  it('T-KCG-005 heartbeat rejects unknown members', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    expect(() => group.heartbeat('nope')).toThrow(/unknown member/);
  });

  it('T-KCG-006 expireDeadMembers removes members past sessionTimeout', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g', sessionTimeoutMs: 1000 });
    group.registerTopic('t', 1);
    const a = group.joinGroup({ subscribedTopics: ['t'] });
    group.heartbeat(a.memberId, 0);
    const removed = group.expireDeadMembers(5000);
    expect(removed).toEqual([a.memberId]);
    expect(group.listMembers()).toHaveLength(0);
  });

  it('T-KCG-007 cooperative protocol only reassigns members whose partitions changed', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g', protocol: 'cooperative' });
    group.registerTopic('t', 4);
    const a = group.joinGroup({ subscribedTopics: ['t'] });
    const b = group.joinGroup({ subscribedTopics: ['t'] });
    // Force a rebalance with the same set — result should reassign nobody.
    const result = group.rebalance();
    expect(result.reassignedMembers).toEqual([]);
    // Sanity: assignments still exist for both.
    expect(result.assignments.get(a.memberId)?.get('t') ?? []).toHaveLength(2);
    expect(result.assignments.get(b.memberId)?.get('t') ?? []).toHaveLength(2);
  });
});
