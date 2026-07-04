import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
} from '../../src/index.js';

describe('fidelity harness — 3 provider × 9 axis grid', () => {
  it('produces 27 rows (3 provider × 9 axis)', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    expect(coverage.providers).toEqual(['stripe', 'paddle', 'lemonsqueezy']);
    expect(coverage.axes).toEqual([
      'dunning',
      'retry',
      '3ds',
      'sca',
      'psd2',
      'subscription-lifecycle',
      'invoice',
      'tax',
      'chargeback',
    ]);
    expect(coverage.rows).toHaveLength(27);
  });

  it('every row has at least one neutral event mapped to a provider event', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    for (const row of coverage.rows) {
      expect(row.neutralEvents.length).toBeGreaterThan(0);
      expect(row.providerEvents.length).toBe(row.neutralEvents.length);
      expect(row.providerEvents.every((e) => typeof e === 'string' && e.length > 0)).toBe(true);
    }
  });

  it('single provider slice returns 9 rows', () => {
    const stripeOnly = collectFidelityCoverage([createStripeMock()]);
    expect(stripeOnly.rows).toHaveLength(9);
    expect(stripeOnly.providers).toEqual(['stripe']);
  });

  it('subscription-lifecycle axis covers all 7 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'subscription-lifecycle');
    expect(row?.neutralEvents).toHaveLength(7);
    expect(row?.neutralEvents).toContain('subscription.paused');
    expect(row?.neutralEvents).toContain('subscription.reactivated');
  });

  it('invoice axis covers all 6 neutral events', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const row = coverage.rows.find((r) => r.axis === 'invoice');
    expect(row?.neutralEvents).toHaveLength(6);
    expect(row?.neutralEvents).toContain('invoice.credit_noted');
  });

  it('chargeback axis covers all 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createLemonSqueezyMock()]);
    const row = coverage.rows.find((r) => r.axis === 'chargeback');
    expect(row?.neutralEvents).toHaveLength(4);
    expect(row?.neutralEvents).toEqual([
      'chargeback.opened',
      'chargeback.evidence_submitted',
      'chargeback.won',
      'chargeback.lost',
    ]);
  });
});
