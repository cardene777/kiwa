import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  providerEventName,
  type PaymentProvider,
  type BillingAxis,
} from '../../src/index.js';

/**
 * Provider parity for the v0.4 axes — each provider must emit a
 * recognisable string for every new neutral event so downstream tests
 * can filter by provider dialect without silent misses.
 */
const V04_AXES: BillingAxis[] = [
  'orchestration',
  'revenue-recovery',
  'refund-advanced',
  'dispute',
  'webhook-idempotency-advanced',
  'tax-localization',
  'subscription-state-machine',
  'payment-method-vault',
];

const PROVIDERS: PaymentProvider[] = ['stripe', 'paddle', 'lemonsqueezy'];

describe('v0.4 provider parity', () => {
  const coverage = collectFidelityCoverage([
    createStripeMock(),
    createPaddleMock(),
    createLemonSqueezyMock(),
  ]);

  for (const provider of PROVIDERS) {
    for (const axis of V04_AXES) {
      it(`${provider} × ${axis}: has non-empty provider events`, () => {
        const row = coverage.rows.find((r) => r.provider === provider && r.axis === axis);
        expect(row, `no row for ${provider} × ${axis}`).toBeDefined();
        expect(row?.providerEvents.length).toBeGreaterThan(0);
        for (const pe of row?.providerEvents ?? []) {
          expect(typeof pe).toBe('string');
          expect(pe.length).toBeGreaterThan(0);
          // Provider events should not still carry the exact neutral name
          // (e.g. 'orchestration.routed', 'recovery.smart_retry_scheduled').
          // The dialect always translates them to a real provider event id.
          expect(pe).not.toMatch(
            /^(orchestration\.|recovery\.|dispute\.evidence|dispute\.represented|dispute\.arbitration|dispute\.liability|vault\.token|vault\.migrated|vault\.pci)/,
          );
        }
      });
    }
  }

  it('providerEventName falls back gracefully for unknown lookup', () => {
    // Using type-cast to exercise fallback branch of providerEventName.
    const name = providerEventName('stripe', 'orchestration.routed');
    expect(name).toBe('payment_intent.created');
  });

  it('v0.4 orchestration.circuit_closed differs by provider', () => {
    const stripe = providerEventName('stripe', 'orchestration.circuit_closed');
    const paddle = providerEventName('paddle', 'orchestration.circuit_closed');
    const lemon = providerEventName('lemonsqueezy', 'orchestration.circuit_closed');
    expect(stripe).toBe('radar.early_fraud_warning.updated');
    expect(paddle).toBe('transaction.updated');
    expect(lemon).toBe('order_created');
  });

  it('dispute.liability_shifted uses stripe funds_reinstated', () => {
    expect(providerEventName('stripe', 'dispute.liability_shifted')).toBe(
      'charge.dispute.funds_reinstated',
    );
  });

  it('tax.dac7_reported has provider dialect for all 3', () => {
    const stripe = providerEventName('stripe', 'tax.dac7_reported');
    const paddle = providerEventName('paddle', 'tax.dac7_reported');
    const lemon = providerEventName('lemonsqueezy', 'tax.dac7_reported');
    expect(stripe).toBe('tax.settings.updated');
    expect(paddle).toBe('transaction.updated');
    expect(lemon).toBe('order_created');
  });

  it('vault.token_created maps correctly per provider', () => {
    expect(providerEventName('stripe', 'vault.token_created')).toBe('payment_method.attached');
    expect(providerEventName('paddle', 'vault.token_created')).toBe('payment_method.saved');
    expect(providerEventName('lemonsqueezy', 'vault.token_created')).toBe('subscription_created');
  });

  it('subscription.grace_period_entered maps correctly per provider', () => {
    expect(providerEventName('stripe', 'subscription.grace_period_entered')).toBe(
      'customer.subscription.updated',
    );
    expect(providerEventName('paddle', 'subscription.grace_period_entered')).toBe(
      'subscription.past_due',
    );
    expect(providerEventName('lemonsqueezy', 'subscription.grace_period_entered')).toBe(
      'subscription_paused',
    );
  });

  it('recovery.card_updated maps correctly per provider', () => {
    expect(providerEventName('stripe', 'recovery.card_updated')).toBe(
      'payment_method.card_automatically_updated',
    );
    expect(providerEventName('paddle', 'recovery.card_updated')).toBe('payment_method.saved');
    expect(providerEventName('lemonsqueezy', 'recovery.card_updated')).toBe(
      'subscription_updated',
    );
  });

  it('webhook.signature_rotated has provider dialect for all 3', () => {
    expect(providerEventName('stripe', 'webhook.signature_rotated')).toBe(
      'webhook_endpoint.updated',
    );
    expect(providerEventName('paddle', 'webhook.signature_rotated')).toBe(
      'notification.updated',
    );
    expect(providerEventName('lemonsqueezy', 'webhook.signature_rotated')).toBe(
      'order_created',
    );
  });
});
