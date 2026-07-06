import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol, isKafkaRawProtocol } from '../../src/index.js';

describe('createKafkaRawProtocol', () => {
  it('T-KRP-001 initProducerId returns a fresh (producerId, epoch=0)', () => {
    const protocol = createKafkaRawProtocol();
    expect(isKafkaRawProtocol(protocol)).toBe(true);
    const identity = protocol.initProducerId();
    expect(identity.epoch).toBe(0);
    expect(protocol.isValidEpoch(identity)).toBe(true);
  });

  it('T-KRP-002 fenceProducer bumps epoch and old epoch is invalid', () => {
    const protocol = createKafkaRawProtocol();
    const initial = protocol.initProducerId();
    const fenced = protocol.fenceProducer(initial.producerId);
    expect(fenced.epoch).toBe(1);
    expect(protocol.isValidEpoch(initial)).toBe(false);
    expect(protocol.isValidEpoch(fenced)).toBe(true);
  });

  it('T-KRP-003 fenceProducer rejects unknown producer ids', () => {
    const protocol = createKafkaRawProtocol();
    expect(() => protocol.fenceProducer(999)).toThrow(/unknown producer id/);
  });

  it('T-KRP-004 valid txn transitions Empty → Ongoing → PrepareCommit → CompleteCommit → Empty', () => {
    const protocol = createKafkaRawProtocol();
    expect(protocol.transactionState()).toBe('Empty');
    protocol.transitionTransaction('Empty', 'Ongoing');
    protocol.transitionTransaction('Ongoing', 'PrepareCommit');
    protocol.transitionTransaction('PrepareCommit', 'CompleteCommit');
    protocol.transitionTransaction('CompleteCommit', 'Empty');
    expect(protocol.transactionState()).toBe('Empty');
  });

  it('T-KRP-005 invalid txn transitions are rejected', () => {
    const protocol = createKafkaRawProtocol();
    protocol.transitionTransaction('Empty', 'Ongoing');
    // Skipping PrepareCommit is not allowed.
    expect(() => protocol.transitionTransaction('Ongoing', 'CompleteCommit')).toThrow(/invalid txn transition/);
  });

  it('T-KRP-006 openFetchSession assigns a session id and epoch 0', () => {
    const protocol = createKafkaRawProtocol();
    const session = protocol.openFetchSession();
    expect(session.sessionId).toBeGreaterThan(0);
    expect(session.epoch).toBe(0);
    expect(protocol.bumpFetchSession(session.sessionId)).toBe(1);
    expect(protocol.bumpFetchSession(session.sessionId)).toBe(2);
  });

  it('T-KRP-007 ISR growth respects replicationFactor cap', () => {
    const protocol = createKafkaRawProtocol({ replicationFactor: 2, minInSyncReplicas: 1 });
    protocol.addToIsr('t', 0, 1);
    protocol.addToIsr('t', 0, 2);
    expect(() => protocol.addToIsr('t', 0, 3)).toThrow(/ISR size cannot exceed/);
  });

  it('T-KRP-008 high-watermark advances only when ISR meets min.insync.replicas', () => {
    const protocol = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    protocol.addToIsr('t', 0, 1);
    // 1 replica, minInSyncReplicas=2 → HW frozen at 0.
    expect(protocol.advanceHighWatermark('t', 0, 5)).toBe(0);
    protocol.addToIsr('t', 0, 2);
    // 2 replicas → HW can move.
    expect(protocol.advanceHighWatermark('t', 0, 5)).toBe(5);
    expect(protocol.getHighWatermark('t', 0)).toBe(5);
  });

  it('T-KRP-009 removeFromIsr freezes further HW advances until re-added', () => {
    const protocol = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    protocol.addToIsr('t', 0, 1);
    protocol.addToIsr('t', 0, 2);
    protocol.advanceHighWatermark('t', 0, 3);
    protocol.removeFromIsr('t', 0, 2);
    expect(protocol.advanceHighWatermark('t', 0, 7)).toBe(3);
  });

  it('T-KRP-010 reset clears all state', () => {
    const protocol = createKafkaRawProtocol();
    protocol.initProducerId();
    protocol.transitionTransaction('Empty', 'Ongoing');
    protocol.openFetchSession();
    protocol.reset();
    expect(protocol.transactionState()).toBe('Empty');
    // Session ids restart from 1 after reset.
    expect(protocol.openFetchSession().sessionId).toBe(1);
  });
});
