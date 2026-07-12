import { describe, expect, it } from 'vitest';
import {
  computeNrr,
  createStripeMock,
  recordChurn,
  recordContraction,
  recordExpansion,
  startRecurringRevenue,
} from '../../src/index.js';

// Closes the reachable branches in packages/payment/src/semantics/recurring-revenue-advanced.ts
// that recurring-revenue-advanced.test.ts leaves open: negative-input guards
// (mrrStartCents / churnCents / expansionCents / contractionCents), NRR
// division-by-zero branch (mrrStartCents === 0 → 0), Math.max clamp on churn
// exceeding mrrEnd, and the `currency !== undefined` arms.

describe('recurring-revenue-advanced — defensive guards', () => {
  it('T-PAY-C-RR2-001 startRecurringRevenue rejects negative MRR', () => {
    expect(() =>
      startRecurringRevenue({
        cohortId: 'c_1',
        customerId: 'cus_rr2_1',
        mrrStartCents: -1,
      }),
    ).toThrow(/non-negative/);
  });

  it('T-PAY-C-RR2-002 recordChurn rejects negative churn', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_2',
      customerId: 'cus_rr2_2',
      mrrStartCents: 10_000,
    });
    await expect(
      recordChurn(adapter, session, { churnCents: -1, subscriptionId: 'sub_2' }),
    ).rejects.toThrow(/non-negative/);
  });

  it('T-PAY-C-RR2-003 recordExpansion rejects negative expansion', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_3',
      customerId: 'cus_rr2_3',
      mrrStartCents: 10_000,
    });
    await expect(
      recordExpansion(adapter, session, {
        expansionCents: -100,
        subscriptionId: 'sub_3',
        kind: 'upgrade',
      }),
    ).rejects.toThrow(/non-negative/);
  });

  it('T-PAY-C-RR2-004 recordContraction rejects negative contraction', () => {
    const session = startRecurringRevenue({
      cohortId: 'c_4',
      customerId: 'cus_rr2_4',
      mrrStartCents: 10_000,
    });
    expect(() =>
      recordContraction(session, { contractionCents: -50 }),
    ).toThrow(/non-negative/);
  });

  it('T-PAY-C-RR2-005 computeNrr returns 0 when mrrStart is 0', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_5',
      customerId: 'cus_rr2_5',
      mrrStartCents: 0,
    });
    const step = await computeNrr(adapter, session);
    expect(session.computedNrr).toBe(0);
    expect(step.metadata.nrr).toBe(0);
  });

  it('T-PAY-C-RR2-006 recordChurn clamps mrrEnd at 0 when churn exceeds', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_6',
      customerId: 'cus_rr2_6',
      mrrStartCents: 500,
    });
    await recordChurn(adapter, session, {
      churnCents: 10_000,
      subscriptionId: 'sub_6',
    });
    expect(session.snapshot.mrrEndCents).toBe(0);
    expect(session.snapshot.churnCents).toBe(10_000);
  });

  it('T-PAY-C-RR2-007 recordContraction clamps mrrEnd at 0 when contraction exceeds', () => {
    const session = startRecurringRevenue({
      cohortId: 'c_7',
      customerId: 'cus_rr2_7',
      mrrStartCents: 200,
    });
    recordContraction(session, { contractionCents: 500 });
    expect(session.snapshot.mrrEndCents).toBe(0);
    expect(session.snapshot.contractionCents).toBe(500);
  });

  it('T-PAY-C-RR2-008 startRecurringRevenue carries currency across compute steps', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_8',
      customerId: 'cus_rr2_8',
      mrrStartCents: 10_000,
      currency: 'JPY',
    });
    expect(session.currency).toBe('JPY');
    await recordExpansion(adapter, session, {
      expansionCents: 500,
      subscriptionId: 'sub_8',
      kind: 'seat-add',
    });
    const nrr = await computeNrr(adapter, session);
    expect(nrr.metadata.nrr).toBeGreaterThan(100);
  });

  it('T-PAY-C-RR2-009 NRR reflects expansion beyond starting MRR (>100)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_9',
      customerId: 'cus_rr2_9',
      mrrStartCents: 10_000,
    });
    await recordExpansion(adapter, session, {
      expansionCents: 2_000,
      subscriptionId: 'sub_9',
      kind: 'usage',
    });
    await computeNrr(adapter, session);
    expect(session.computedNrr).toBe(120);
  });

  it('T-PAY-C-RR2-010 NRR reflects churn (<100)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'c_10',
      customerId: 'cus_rr2_10',
      mrrStartCents: 10_000,
    });
    await recordChurn(adapter, session, {
      churnCents: 2_500,
      subscriptionId: 'sub_10',
    });
    await computeNrr(adapter, session);
    expect(session.computedNrr).toBe(75);
  });
});
