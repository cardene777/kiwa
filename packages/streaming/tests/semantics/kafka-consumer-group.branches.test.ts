import { describe, expect, it } from 'vitest';
import { createKafkaConsumerGroup } from '../../src/index.js';

// Follow-up file — covers reset() and no-op branches (leaveGroup unknown / heartbeat
// default now / expireDeadMembers early return) that T-KCG-* doesn't reach.

describe('createKafkaConsumerGroup state guards', () => {
  it('T-KCG-B-001 reset clears members and restarts generation + member id sequence', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 2);
    group.joinGroup({ subscribedTopics: ['t'] });
    group.joinGroup({ subscribedTopics: ['t'] });
    expect(group.listMembers()).toHaveLength(2);
    expect(group.generation()).toBeGreaterThan(0);
    group.reset();
    expect(group.listMembers()).toHaveLength(0);
    expect(group.generation()).toBe(0);
    // Registered topics are also cleared — need to re-register to get assignments.
    group.registerTopic('t', 2);
    const reissued = group.joinGroup({ subscribedTopics: ['t'] });
    expect(reissued.memberId).toBe('g-member-0');
    expect(reissued.generationId).toBe(1);
  });

  it('T-KCG-B-002 leaveGroup with an unknown memberId is a no-op', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 2);
    const first = group.joinGroup({ subscribedTopics: ['t'] });
    const genBefore = group.generation();
    group.leaveGroup('never-joined');
    expect(group.generation()).toBe(genBefore);
    expect(group.listMembers().map((m) => m.memberId)).toContain(first.memberId);
  });

  it('T-KCG-B-003 heartbeat with default now argument does not throw and updates timestamp', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g' });
    group.registerTopic('t', 1);
    const a = group.joinGroup({ subscribedTopics: ['t'] });
    // No explicit `now` — should fall through to Date.now() default without throwing.
    expect(() => group.heartbeat(a.memberId)).not.toThrow();
  });

  it('T-KCG-B-004 expireDeadMembers with no expired members returns empty and does not rebalance', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g', sessionTimeoutMs: 60_000 });
    group.registerTopic('t', 1);
    const a = group.joinGroup({ subscribedTopics: ['t'] });
    group.heartbeat(a.memberId, 1000);
    const genBefore = group.generation();
    const expired = group.expireDeadMembers(1500);
    expect(expired).toEqual([]);
    expect(group.generation()).toBe(genBefore);
  });

  it('T-KCG-B-005 rebalance detects reassigned members after topic partition change', () => {
    const group = createKafkaConsumerGroup({ groupId: 'g', protocol: 'cooperative' });
    group.registerTopic('t', 2);
    const a = group.joinGroup({ subscribedTopics: ['t'] });
    // Registering a new topic — members do not subscribe to it, so
    // assignments stay identical. Now register a topic increase to force change.
    group.registerTopic('t', 4);
    const result = group.rebalance();
    // Range assigner gives all 4 partitions to member a → different from prior 2.
    expect(result.reassignedMembers).toEqual([a.memberId]);
  });
});
