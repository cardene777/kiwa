import { describe, expect, it } from 'vitest';
import { createExactlyOnceSemantics } from '../../src/index.js';

// Follow-up file — covers the abort-without-txn throw and reset() body that
// T-EOS-CP-* doesn't reach.

describe('createExactlyOnceSemantics state guards', () => {
  it('T-EOS-CP-B-001 abort outside a txn rejects', () => {
    const eos = createExactlyOnceSemantics({ provider: 'kafka', transactionalId: 'tx-b1' });
    expect(() => eos.abort()).toThrow(/abort without active transaction/);
  });

  it('T-EOS-CP-B-002 reset returns state to idle and re-enables begin', () => {
    const eos = createExactlyOnceSemantics({ provider: 'kafka', transactionalId: 'tx-b2' });
    eos.begin();
    eos.send({ topic: 't', value: 'x', key: null });
    eos.commit();
    expect(eos.state()).toBe('committed');
    eos.reset();
    expect(eos.state()).toBe('idle');
    // begin restarts the batch sequence.
    eos.begin();
    eos.send({ topic: 't', value: 'a', key: null });
    const emitted = eos.commit();
    // First reset drops batchSeq back to 0; begin bumps to 1 → tx-b2::1.
    expect(emitted[0]?.headers['x-kiwa-txn-id']).toBe('tx-b2::1');
  });

  it('T-EOS-CP-B-003 reset clears aborted batch memory so filter passes prior ghosts', () => {
    const eos = createExactlyOnceSemantics({ provider: 'kafka', transactionalId: 'tx-b3' });
    eos.begin();
    eos.send({ topic: 't', value: 'ghost', key: null });
    eos.abort();
    eos.reset();
    // After reset, a ghost header from the aborted batch is no longer filtered.
    const ghost = {
      topic: 't',
      partition: 0,
      offset: 0,
      timestamp: 0,
      key: null,
      value: 'ghost',
      headers: { 'x-kiwa-txn-id': 'tx-b3::1' },
    } as const;
    expect(eos.filter([ghost])).toEqual([ghost]);
  });
});
