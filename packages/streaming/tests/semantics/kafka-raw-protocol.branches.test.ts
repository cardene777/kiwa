import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol } from '../../src/index.js';

// Follow-up file — covers transitionTransaction mismatch throw, removeFromIsr /
// getIsr on empty ISR, advanceHighWatermark on stale offset, and the
// getHighWatermark default that T-KRP-* doesn't reach.

describe('createKafkaRawProtocol state guards', () => {
  it('T-KRP-B-001 transitionTransaction throws when current state differs from from', () => {
    const protocol = createKafkaRawProtocol();
    // Current state is Empty; requesting from=Ongoing is a mismatch.
    expect(() =>
      protocol.transitionTransaction('Ongoing', 'PrepareCommit'),
    ).toThrow(/txn state mismatch/);
  });

  it('T-KRP-B-002 bumpFetchSession throws for unknown sessionId', () => {
    const protocol = createKafkaRawProtocol();
    expect(() => protocol.bumpFetchSession(999)).toThrow(/fetch session 999 not open/);
  });

  it('T-KRP-B-003 removeFromIsr on a topic-partition that never had an ISR is a no-op', () => {
    const protocol = createKafkaRawProtocol();
    expect(() => protocol.removeFromIsr('empty', 0, 42)).not.toThrow();
    expect(protocol.getIsr('empty', 0)).toEqual([]);
  });

  it('T-KRP-B-004 getIsr returns empty array for unknown topic-partition', () => {
    const protocol = createKafkaRawProtocol();
    expect(protocol.getIsr('never-registered', 5)).toEqual([]);
  });

  it('T-KRP-B-005 getHighWatermark returns 0 for unknown topic-partition', () => {
    const protocol = createKafkaRawProtocol();
    expect(protocol.getHighWatermark('none', 0)).toBe(0);
  });

  it('T-KRP-B-006 advanceHighWatermark keeps HW when nextOffset <= current', () => {
    const protocol = createKafkaRawProtocol({ replicationFactor: 2, minInSyncReplicas: 1 });
    protocol.addToIsr('t', 0, 1);
    expect(protocol.advanceHighWatermark('t', 0, 10)).toBe(10);
    // Same offset — HW stays.
    expect(protocol.advanceHighWatermark('t', 0, 10)).toBe(10);
    // Lower offset — HW stays.
    expect(protocol.advanceHighWatermark('t', 0, 5)).toBe(10);
    expect(protocol.getHighWatermark('t', 0)).toBe(10);
  });
});
