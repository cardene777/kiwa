import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
} from '../../src/index.js';

describe('fidelity harness — 3 provider × 25 axis grid (v0.3 9 + v0.4 8 + v0.5 8)', () => {
  it('produces 75 rows (3 provider × 25 axis)', () => {
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
      // v0.5
      'embedded-finance',
      'bnpl',
      'crypto-payment',
      'fx-cross-border',
      'recurring-revenue-advanced',
      'payment-orchestration-ii',
      'fraud-detection-advanced',
      'regulatory-reporting',
    ]);
    expect(coverage.rows).toHaveLength(75);
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

  it('single provider slice returns 25 rows', () => {
    const stripeOnly = collectFidelityCoverage([createStripeMock()]);
    expect(stripeOnly.rows).toHaveLength(25);
    expect(stripeOnly.providers).toEqual(['stripe']);
  });

  it('v0.5 slice is 3 provider × 8 axis = 24 combination', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    const v05Axes = [
      'embedded-finance',
      'bnpl',
      'crypto-payment',
      'fx-cross-border',
      'recurring-revenue-advanced',
      'payment-orchestration-ii',
      'fraud-detection-advanced',
      'regulatory-reporting',
    ];
    const v05Rows = coverage.rows.filter((r) => v05Axes.includes(r.axis));
    expect(v05Rows).toHaveLength(24);
  });

  it('embedded-finance axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'embedded-finance');
    expect(row?.neutralEvents).toEqual([
      'embedded.account_opened',
      'embedded.card_issued',
      'embedded.kyc_verified',
      'embedded.kyb_verified',
    ]);
  });

  it('bnpl axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const row = coverage.rows.find((r) => r.axis === 'bnpl');
    expect(row?.neutralEvents).toEqual([
      'bnpl.plan_created',
      'bnpl.installment_scheduled',
      'bnpl.risk_scored',
      'bnpl.late_fee_charged',
    ]);
  });

  it('crypto-payment axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createLemonSqueezyMock()]);
    const row = coverage.rows.find((r) => r.axis === 'crypto-payment');
    expect(row?.neutralEvents).toEqual([
      'crypto.invoice_created',
      'crypto.tx_confirmed',
      'crypto.gas_abstracted',
      'crypto.wallet_linked',
    ]);
  });

  it('fx-cross-border axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'fx-cross-border');
    expect(row?.neutralEvents).toEqual([
      'fx.rate_locked',
      'fx.settlement_initiated',
      'fx.settlement_completed',
      'fx.rate_expired',
    ]);
  });

  it('recurring-revenue-advanced axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const row = coverage.rows.find((r) => r.axis === 'recurring-revenue-advanced');
    expect(row?.neutralEvents).toEqual([
      'rr.mrr_computed',
      'rr.churn_recorded',
      'rr.expansion_recorded',
      'rr.nrr_computed',
    ]);
  });

  it('payment-orchestration-ii axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createLemonSqueezyMock()]);
    const row = coverage.rows.find((r) => r.axis === 'payment-orchestration-ii');
    expect(row?.neutralEvents).toEqual([
      'po2.smart_routed',
      'po2.ml_scored',
      'po2.fallback_triggered',
      'po2.cascade_exhausted',
    ]);
  });

  it('fraud-detection-advanced axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const row = coverage.rows.find((r) => r.axis === 'fraud-detection-advanced');
    expect(row?.neutralEvents).toEqual([
      'fraud.device_scored',
      'fraud.biometric_verified',
      'fraud.velocity_flagged',
      'fraud.ml_blocked',
    ]);
  });

  it('regulatory-reporting axis covers 4 neutral events', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const row = coverage.rows.find((r) => r.axis === 'regulatory-reporting');
    expect(row?.neutralEvents).toEqual([
      'reg.pci_reported',
      'reg.psd2_reported',
      'reg.dora_reported',
      'reg.sar_filed',
    ]);
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
