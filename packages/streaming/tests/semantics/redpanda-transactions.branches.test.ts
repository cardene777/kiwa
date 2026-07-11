import { describe, expect, it } from 'vitest';
import { createRedpandaTransactions } from '../../src/index.js';

// Follow-up file — reaches currentProducer null-return, guardEpoch unknown-id
// + producer-id mismatch throws, reset(), and the no-op branch when abort is
// called on an already-terminal txn.

describe('createRedpandaTransactions state guards', () => {
  it('T-RTX-B-001 currentProducer returns null for unknown transactionalId', () => {
    const tx = createRedpandaTransactions();
    expect(tx.currentProducer('tx-unknown')).toBeNull();
  });

  it('T-RTX-B-002 currentProducer returns the current identity after init', () => {
    const tx = createRedpandaTransactions();
    const p = tx.initTransactions('tx-1');
    expect(tx.currentProducer('tx-1')).toEqual(p);
  });

  it('T-RTX-B-003 guardEpoch throws on unknown transactionalId', () => {
    const tx = createRedpandaTransactions();
    expect(() =>
      tx.guardEpoch('tx-unknown', { producerId: 0, epoch: 0 }),
    ).toThrow(/unknown transactionalId/);
  });

  it('T-RTX-B-004 guardEpoch throws on producer id mismatch', () => {
    const tx = createRedpandaTransactions();
    const p = tx.initTransactions('tx-1');
    expect(() =>
      tx.guardEpoch('tx-1', { producerId: p.producerId + 100, epoch: p.epoch }),
    ).toThrow(/producer id mismatch/);
  });

  it('T-RTX-B-005 addPartition without an open transaction rejects', () => {
    const tx = createRedpandaTransactions();
    tx.initTransactions('tx-1');
    expect(() => tx.addPartition('tx-1', 't', 0)).toThrow(/no open transaction/);
  });

  it('T-RTX-B-006 commitTransaction without an open transaction rejects', () => {
    const tx = createRedpandaTransactions();
    tx.initTransactions('tx-1');
    expect(() => tx.commitTransaction('tx-1')).toThrow(/no open transaction/);
  });

  it('T-RTX-B-007 abortTransaction without an open transaction rejects', () => {
    const tx = createRedpandaTransactions();
    tx.initTransactions('tx-1');
    expect(() => tx.abortTransaction('tx-1')).toThrow(/no open transaction/);
  });

  it('T-RTX-B-008 abortTransaction on an already-committed txn is a no-op', () => {
    const tx = createRedpandaTransactions();
    const p = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', p);
    tx.commitTransaction('tx-1');
    expect(tx.currentPhase('tx-1')).toBe('committed');
    // Should not throw; phase stays committed.
    tx.abortTransaction('tx-1');
    expect(tx.currentPhase('tx-1')).toBe('committed');
  });

  it('T-RTX-B-009 abortTransaction on an already-aborted txn is a no-op', () => {
    const tx = createRedpandaTransactions();
    const p = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', p);
    tx.abortTransaction('tx-1');
    tx.abortTransaction('tx-1');
    expect(tx.currentPhase('tx-1')).toBe('aborted');
  });

  it('T-RTX-B-010 currentPhase returns idle for unknown transactionalId', () => {
    const tx = createRedpandaTransactions();
    expect(tx.currentPhase('tx-none')).toBe('idle');
  });

  it('T-RTX-B-011 reset clears producers + transactions and restarts producer ids', () => {
    const tx = createRedpandaTransactions();
    const first = tx.initTransactions('tx-1');
    tx.beginTransaction('tx-1', first);
    tx.reset();
    expect(tx.currentProducer('tx-1')).toBeNull();
    expect(tx.currentPhase('tx-1')).toBe('idle');
    // Producer id sequence resets to 5000.
    const reissued = tx.initTransactions('tx-1');
    expect(reissued.producerId).toBe(5000);
  });
});
