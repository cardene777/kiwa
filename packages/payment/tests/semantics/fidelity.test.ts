import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
} from '../../src/index.js';

describe('fidelity harness — 3 provider × 17 axis grid (v0.3 9 + v0.4 8)', () => {
  it('produces 51 rows (3 provider × 17 axis)', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    expect(coverage.providers).toEqual(['stripe', 'paddle', 'lemonsqueezy']);
    expect(coverage.axes).toEqual([
      // v0.3
      'dunning',
      'retry',
      '3ds',
      'sca',
      'psd2',
      'subscription-lifecycle',
      'invoice',
      'tax',
      'chargeback',
      // v0.4
      'orchestration',
      'revenue-recovery',
      'refund-advanced',
      'dispute',
      'webhook-idempotency-advanced',
      'tax-localization',
      'subscription-state-machine',
      'payment-method-vault',
    ]);
    expect(coverage.rows).toHaveLength(51);
  });

  it('v0.4 slice is 3 provider × 8 axis = 24 combination', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    const v04Axes = [
      'orchestration',
      'revenue-recovery',
      'refund-advanced',
      'dispute',
      'webhook-idempotency-advanced',
      'tax-localization',
      'subscription-state-machine',
      'payment-method-vault',
    ];
    const v04Rows = coverage.rows.filter((r) => v04Axes.includes(r.axis));
    expect(v04Rows).toHaveLength(24);
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

  it('single provider slice returns 17 rows', () => {
    const stripeOnly = collectFidelityCoverage([createStripeMock()]);
    expect(stripeOnly.rows).toHaveLength(17);
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

  it('orchestration axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'orchestration');
    expect(row?.neutralEvents).toEqual([
      'orchestration.routed',
      'orchestration.failed_over',
      'orchestration.circuit_opened',
      'orchestration.circuit_closed',
    ]);
  });

  it('revenue-recovery axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const row = coverage.rows.find((r) => r.axis === 'revenue-recovery');
    expect(row?.neutralEvents).toEqual([
      'recovery.smart_retry_scheduled',
      'recovery.dunning_cascade_step',
      'recovery.card_updated',
      'recovery.network_tokenized',
    ]);
  });

  it('dispute axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createLemonSqueezyMock()]);
    const row = coverage.rows.find((r) => r.axis === 'dispute');
    expect(row?.neutralEvents).toEqual([
      'dispute.evidence_submitted',
      'dispute.represented',
      'dispute.arbitration_opened',
      'dispute.liability_shifted',
    ]);
  });

  it('webhook-idempotency-advanced axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'webhook-idempotency-advanced');
    expect(row?.neutralEvents).toEqual([
      'webhook.dedup_hit',
      'webhook.replay_blocked',
      'webhook.signature_rotated',
      'webhook.poison_queued',
    ]);
  });

  it('tax-localization axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'tax-localization');
    expect(row?.neutralEvents).toEqual([
      'tax.vat_calculated',
      'tax.gst_calculated',
      'tax.sales_tax_calculated',
      'tax.dac7_reported',
    ]);
  });

  it('subscription-state-machine axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const row = coverage.rows.find((r) => r.axis === 'subscription-state-machine');
    expect(row?.neutralEvents).toEqual([
      'subscription.grace_period_entered',
      'subscription.grace_period_exited',
      'subscription.proration_applied',
      'subscription.coupon_stacked',
    ]);
  });

  it('payment-method-vault axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createLemonSqueezyMock()]);
    const row = coverage.rows.find((r) => r.axis === 'payment-method-vault');
    expect(row?.neutralEvents).toEqual([
      'vault.token_created',
      'vault.token_revoked',
      'vault.migrated',
      'vault.pci_scope_verified',
    ]);
  });

  it('refund-advanced axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'refund-advanced');
    expect(row?.neutralEvents).toEqual([
      'refund.partial',
      'refund.full',
      'refund.window_expired',
      'refund.policy_denied',
    ]);
  });
});
