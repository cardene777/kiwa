import { describe, expect, it } from 'vitest';
import {
  computeMrr,
  computeNrr,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  type PaymentAdapter,
  recordChurn,
  recordContraction,
  recordExpansion,
  startRecurringRevenue,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('recurring-revenue-advanced axis — MRR + ARR + churn + expansion + NRR', () => {
  it('startRecurringRevenue rejects negative mrrStart', () => {
    expect(() =>
      startRecurringRevenue({
        cohortId: 'coh_bad',
        customerId: 'cus',
        mrrStartCents: -1,
      }),
    ).toThrow(/non-negative/);
  });

  it('startRecurringRevenue seeds ARR = MRR × 12', () => {
    const s = startRecurringRevenue({
      cohortId: 'coh_1',
      customerId: 'cus_1',
      mrrStartCents: 10000,
    });
    expect(s.computedMrr).toBe(10000);
    expect(s.computedArr).toBe(120000);
    expect(s.computedNrr).toBe(100);
  });

  it.each(providers)('$name: computeMrr emits mrr_computed', async ({ make }) => {
    const adapter = make();
    const s = startRecurringRevenue({
      cohortId: 'coh_c',
      customerId: 'cus',
      mrrStartCents: 5000,
    });
    const step = await computeMrr(adapter, s);
    expect(step.neutralEvent).toBe('rr.mrr_computed');
    expect(step.metadata.mrrCents).toBe(5000);
    expect(step.metadata.arrCents).toBe(60000);
    expect(s.state).toBe('mrr-computed');
  });

  it.each(providers)('$name: recordChurn subtracts from mrrEnd', async ({ make }) => {
    const adapter = make();
    const s = startRecurringRevenue({
      cohortId: 'coh_ch',
      customerId: 'cus',
      mrrStartCents: 10000,
    });
    const step = await recordChurn(adapter, s, { churnCents: 3000, subscriptionId: 'sub_1' });
    expect(step.neutralEvent).toBe('rr.churn_recorded');
    expect(s.snapshot.churnCents).toBe(3000);
    expect(s.snapshot.mrrEndCents).toBe(7000);
  });

  it('recordChurn clamps mrrEnd at 0', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_clamp',
      customerId: 'cus',
      mrrStartCents: 1000,
    });
    await recordChurn(adapter, s, { churnCents: 5000, subscriptionId: 'sub_over' });
    expect(s.snapshot.mrrEndCents).toBe(0);
  });

  it('recordChurn rejects negative', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_bad_ch',
      customerId: 'cus',
      mrrStartCents: 1000,
    });
    await expect(
      recordChurn(adapter, s, { churnCents: -1, subscriptionId: 'x' }),
    ).rejects.toThrow(/non-negative/);
  });

  it.each(providers)('$name: recordExpansion increases mrrEnd', async ({ make }) => {
    const adapter = make();
    const s = startRecurringRevenue({
      cohortId: 'coh_exp',
      customerId: 'cus',
      mrrStartCents: 5000,
    });
    const step = await recordExpansion(adapter, s, {
      expansionCents: 2000,
      subscriptionId: 'sub_up',
      kind: 'upgrade',
    });
    expect(step.neutralEvent).toBe('rr.expansion_recorded');
    expect(step.metadata.kind).toBe('upgrade');
    expect(s.snapshot.expansionCents).toBe(2000);
    expect(s.snapshot.mrrEndCents).toBe(7000);
  });

  it('recordExpansion rejects negative', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_neg_exp',
      customerId: 'cus',
      mrrStartCents: 1000,
    });
    await expect(
      recordExpansion(adapter, s, { expansionCents: -1, subscriptionId: 'x', kind: 'upgrade' }),
    ).rejects.toThrow(/non-negative/);
  });

  it('recordExpansion tracks 3 kinds independently in history', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_kinds',
      customerId: 'cus',
      mrrStartCents: 1000,
    });
    await recordExpansion(adapter, s, { expansionCents: 100, subscriptionId: 'a', kind: 'upgrade' });
    await recordExpansion(adapter, s, { expansionCents: 200, subscriptionId: 'b', kind: 'seat-add' });
    await recordExpansion(adapter, s, { expansionCents: 300, subscriptionId: 'c', kind: 'usage' });
    expect(s.snapshot.expansionCents).toBe(600);
    expect(s.snapshot.mrrEndCents).toBe(1600);
    expect(s.history.map((h) => h.metadata.kind)).toEqual(['upgrade', 'seat-add', 'usage']);
  });

  it.each(providers)('$name: computeNrr calculates 100% for stable cohort', async ({ make }) => {
    const adapter = make();
    const s = startRecurringRevenue({
      cohortId: 'coh_stable',
      customerId: 'cus',
      mrrStartCents: 10000,
    });
    const step = await computeNrr(adapter, s);
    expect(step.neutralEvent).toBe('rr.nrr_computed');
    expect(s.computedNrr).toBe(100);
  });

  it('computeNrr calculates < 100 with churn', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_neg_nrr',
      customerId: 'cus',
      mrrStartCents: 10000,
    });
    await recordChurn(adapter, s, { churnCents: 2000, subscriptionId: 'x' });
    await computeNrr(adapter, s);
    expect(s.computedNrr).toBe(80);
  });

  it('computeNrr calculates > 100 with net expansion', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_gain',
      customerId: 'cus',
      mrrStartCents: 10000,
    });
    await recordChurn(adapter, s, { churnCents: 1000, subscriptionId: 'x' });
    await recordExpansion(adapter, s, {
      expansionCents: 3000,
      subscriptionId: 'y',
      kind: 'upgrade',
    });
    await computeNrr(adapter, s);
    expect(s.computedNrr).toBe(120);
  });

  it('computeNrr with 0 mrrStart returns 0', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_zero',
      customerId: 'cus',
      mrrStartCents: 0,
    });
    const step = await computeNrr(adapter, s);
    expect(step.metadata.nrr).toBe(0);
    expect(s.computedNrr).toBe(0);
  });

  it('recordContraction reduces mrrEnd separately from churn', () => {
    const s = startRecurringRevenue({
      cohortId: 'coh_contract',
      customerId: 'cus',
      mrrStartCents: 5000,
    });
    recordContraction(s, { contractionCents: 1000 });
    expect(s.snapshot.contractionCents).toBe(1000);
    expect(s.snapshot.mrrEndCents).toBe(4000);
  });

  it('recordContraction rejects negative', () => {
    const s = startRecurringRevenue({
      cohortId: 'coh_neg_c',
      customerId: 'cus',
      mrrStartCents: 1000,
    });
    expect(() => recordContraction(s, { contractionCents: -1 })).toThrow(/non-negative/);
  });

  it('recordContraction clamps mrrEnd at 0', () => {
    const s = startRecurringRevenue({
      cohortId: 'coh_clamp2',
      customerId: 'cus',
      mrrStartCents: 500,
    });
    recordContraction(s, { contractionCents: 1000 });
    expect(s.snapshot.mrrEndCents).toBe(0);
  });

  it('computeNrr respects contraction in numerator', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_nrrc',
      customerId: 'cus',
      mrrStartCents: 10000,
    });
    recordContraction(s, { contractionCents: 500 });
    await recordChurn(adapter, s, { churnCents: 500, subscriptionId: 'x' });
    await recordExpansion(adapter, s, {
      expansionCents: 1000,
      subscriptionId: 'y',
      kind: 'seat-add',
    });
    await computeNrr(adapter, s);
    // (10000 - 500 - 500 + 1000) / 10000 = 1.0 → 100%
    expect(s.computedNrr).toBe(100);
  });

  it('computed NRR rounds to 2 decimal places', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_round',
      customerId: 'cus',
      mrrStartCents: 30000,
    });
    await recordChurn(adapter, s, { churnCents: 100, subscriptionId: 'x' });
    await computeNrr(adapter, s);
    // (30000 - 100) / 30000 = 0.99666... → 99.67
    expect(s.computedNrr).toBe(99.67);
  });

  it('history captures full lifecycle', async () => {
    const adapter = createStripeMock();
    const s = startRecurringRevenue({
      cohortId: 'coh_hist',
      customerId: 'cus_hist',
      mrrStartCents: 5000,
    });
    await computeMrr(adapter, s);
    await recordChurn(adapter, s, { churnCents: 500, subscriptionId: 'a' });
    await recordExpansion(adapter, s, {
      expansionCents: 1500,
      subscriptionId: 'b',
      kind: 'upgrade',
    });
    await computeNrr(adapter, s);
    expect(s.history).toHaveLength(4);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'rr.mrr_computed',
      'rr.churn_recorded',
      'rr.expansion_recorded',
      'rr.nrr_computed',
    ]);
  });
});
