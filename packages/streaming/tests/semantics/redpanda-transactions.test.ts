import { describe, expect, it } from 'vitest';
import {
  createRedpandaTransactions,
  isRedpandaTransactions,
} from '../../src/index.js';

describe('createRedpandaTransactions', () => {
  it('T-RTX-001 initTransactions assigns producerId + epoch 0', () => {
    const tx = createRedpandaTransactions();
    expect(isRedpandaTransactions(tx)).toBe(true);
    const producer = tx.initTransactions('tx-1');
    expect(producer.epoch).toBe(0);
    expect(producer.transactionalId).toBe('tx-1');
  });

  it('T-RTX-002 bumpEpoch fences the old identity', () => {
    const tx = createRedpandaTransactions();
    const p1 = tx.initTransactions('tx-1');
    const p2 = tx.bumpEpoch('tx-1');
    expect(p2.epoch).toBe(1);
    expect(() => tx.guardEpoch('tx-1', p1)).toThrow(/InvalidProducerEpoch/);
  });

  it('T-RTX-003 beginTransaction → addPartition → commit walks the state machine', () => {
    const tx = createRedpandaTransactions();
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    tx.addPartition('tx-1', 'orders', 0);
    expect(tx.currentPhase('tx-1')).toBe('ongoing');
    tx.commitTransaction('tx-1');
    expect(tx.currentPhase('tx-1')).toBe('committed');
  });

  it('T-RTX-004 abort works from ongoing phase', () => {
    const tx = createRedpandaTransactions();
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    tx.abortTransaction('tx-1', 'test-forced');
    expect(tx.currentPhase('tx-1')).toBe('aborted');
  });

  it('T-RTX-005 double begin without commit/abort is rejected', () => {
    const tx = createRedpandaTransactions();
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    expect(() => tx.beginTransaction('tx-1', producer)).toThrow(/already ongoing/);
  });

  it('T-RTX-006 commit outside ongoing phase is rejected', () => {
    const tx = createRedpandaTransactions();
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    tx.commitTransaction('tx-1');
    expect(() => tx.commitTransaction('tx-1')).toThrow(/cannot commit/);
  });

  it('T-RTX-007 expireStale auto-aborts timed-out transactions', () => {
    const tx = createRedpandaTransactions({ transactionTimeoutMs: 100 });
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    // Simulate a very-later sweep.
    const expired = tx.expireStale(Date.now() + 5000);
    expect(expired).toContain('tx-1');
    expect(tx.currentPhase('tx-1')).toBe('aborted');
  });

  it('T-RTX-008 addPartition after commit is rejected', () => {
    const tx = createRedpandaTransactions();
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    tx.commitTransaction('tx-1');
    expect(() => tx.addPartition('tx-1', 't', 0)).toThrow(/cannot add partition/);
  });

  it('T-RTX-009 bumpEpoch fences an in-flight transaction', () => {
    const tx = createRedpandaTransactions();
    const producer = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', producer);
    tx.bumpEpoch('tx-1');
    expect(tx.currentPhase('tx-1')).toBe('aborted');
  });
});
