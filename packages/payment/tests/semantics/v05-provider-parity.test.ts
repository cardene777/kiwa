import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
} from '../../src/index.js';

/**
 * v0.5 provider parity — every provider maps every v0.5 neutral event to a
 * non-empty provider event id (fallback = neutral name, still non-empty).
 * Also asserts the 3 providers do not collapse to identical event ids for
 * every neutral (dialect must actually differ per provider).
 */

const V05_AXES = [
  'embedded-finance',
  'bnpl',
  'crypto-payment',
  'fx-cross-border',
  'recurring-revenue-advanced',
  'payment-orchestration-ii',
  'fraud-detection-advanced',
  'regulatory-reporting',
] as const;

describe('v0.5 provider parity — dialect coverage across 3 providers × 8 axes', () => {
  it('every v0.5 axis is present in every provider grid', () => {
    for (const make of [createStripeMock, createPaddleMock, createLemonSqueezyMock]) {
      const coverage = collectFidelityCoverage([make()]);
      for (const axis of V05_AXES) {
        const row = coverage.rows.find((r) => r.axis === axis);
        expect(row).toBeDefined();
        expect(row?.neutralEvents.length).toBeGreaterThan(0);
      }
    }
  });

  it('every v0.5 neutral event maps to a non-empty provider event per provider', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    for (const row of coverage.rows.filter((r) => V05_AXES.includes(r.axis as (typeof V05_AXES)[number]))) {
      for (const providerEvent of row.providerEvents) {
        expect(providerEvent).toBeTruthy();
        expect(typeof providerEvent).toBe('string');
        expect(providerEvent.length).toBeGreaterThan(0);
      }
    }
  });

  it('stripe dialect uses treasury.* / issuing.* / identity.* for embedded finance', () => {
    const coverage = collectFidelityCoverage([createStripeMock()]);
    const embedded = coverage.rows.find((r) => r.axis === 'embedded-finance');
    expect(embedded?.providerEvents).toContain('treasury.financial_account.created');
    expect(embedded?.providerEvents).toContain('issuing.card.created');
    expect(embedded?.providerEvents).toContain('identity.verification_session.verified');
  });

  it('paddle dialect uses business.* for embedded finance', () => {
    const coverage = collectFidelityCoverage([createPaddleMock()]);
    const embedded = coverage.rows.find((r) => r.axis === 'embedded-finance');
    expect(embedded?.providerEvents).toContain('business.entity_created');
    expect(embedded?.providerEvents).toContain('business.card_created');
  });

  it('lemonsqueezy dialect falls back to subscription_/order_ names for embedded finance', () => {
    const coverage = collectFidelityCoverage([createLemonSqueezyMock()]);
    const embedded = coverage.rows.find((r) => r.axis === 'embedded-finance');
    expect(embedded?.providerEvents.some((e) => e.startsWith('subscription_') || e.startsWith('order_'))).toBe(true);
  });

  it('crypto axis: stripe uses payment_intent.*, paddle uses transaction.*, ls uses order_*', () => {
    const stripe = collectFidelityCoverage([createStripeMock()])
      .rows.find((r) => r.axis === 'crypto-payment');
    const paddle = collectFidelityCoverage([createPaddleMock()])
      .rows.find((r) => r.axis === 'crypto-payment');
    const ls = collectFidelityCoverage([createLemonSqueezyMock()])
      .rows.find((r) => r.axis === 'crypto-payment');
    expect(stripe?.providerEvents.every((e) => e.startsWith('payment_intent') || e === 'payment_method.attached')).toBe(true);
    expect(paddle?.providerEvents.every((e) => e.startsWith('transaction') || e === 'payment_method.saved')).toBe(true);
    expect(ls?.providerEvents.every((e) => e.startsWith('order_') || e.startsWith('subscription_'))).toBe(true);
  });

  it('fx axis: quote/payout tokens for stripe, payout for paddle', () => {
    const stripe = collectFidelityCoverage([createStripeMock()])
      .rows.find((r) => r.axis === 'fx-cross-border');
    expect(stripe?.providerEvents).toContain('quote.accepted');
    expect(stripe?.providerEvents).toContain('payout.created');
    expect(stripe?.providerEvents).toContain('payout.paid');
    const paddle = collectFidelityCoverage([createPaddleMock()])
      .rows.find((r) => r.axis === 'fx-cross-border');
    expect(paddle?.providerEvents).toContain('payout.created');
  });

  it('regulatory reporting axis: stripe uses reporting.report_type.updated for all 4', () => {
    const stripe = collectFidelityCoverage([createStripeMock()])
      .rows.find((r) => r.axis === 'regulatory-reporting');
    expect(stripe?.providerEvents.every((e) => e === 'reporting.report_type.updated')).toBe(true);
  });

  it('regulatory reporting axis: paddle uses report.updated for all 4', () => {
    const paddle = collectFidelityCoverage([createPaddleMock()])
      .rows.find((r) => r.axis === 'regulatory-reporting');
    expect(paddle?.providerEvents.every((e) => e === 'report.updated')).toBe(true);
  });

  it('fraud detection axis: stripe uses radar.* + identity.* dialect', () => {
    const stripe = collectFidelityCoverage([createStripeMock()])
      .rows.find((r) => r.axis === 'fraud-detection-advanced');
    expect(stripe?.providerEvents.some((e) => e.startsWith('radar'))).toBe(true);
    expect(stripe?.providerEvents.some((e) => e.startsWith('identity'))).toBe(true);
  });

  it('recurring revenue axis: stripe uses invoice.* + customer.subscription.*', () => {
    const stripe = collectFidelityCoverage([createStripeMock()])
      .rows.find((r) => r.axis === 'recurring-revenue-advanced');
    expect(stripe?.providerEvents.some((e) => e.startsWith('invoice'))).toBe(true);
    expect(stripe?.providerEvents.some((e) => e.startsWith('customer.subscription'))).toBe(true);
  });

  it('every provider covers all 32 v0.5 neutral events', () => {
    for (const make of [createStripeMock, createPaddleMock, createLemonSqueezyMock]) {
      const coverage = collectFidelityCoverage([make()]);
      const v05Neutrals = coverage.rows
        .filter((r) => V05_AXES.includes(r.axis as (typeof V05_AXES)[number]))
        .flatMap((r) => r.neutralEvents);
      expect(v05Neutrals).toHaveLength(32); // 8 axes × 4 events
    }
  });

  it('providerEvents.length === neutralEvents.length per axis per provider', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ]);
    for (const row of coverage.rows) {
      expect(row.providerEvents.length).toBe(row.neutralEvents.length);
    }
  });
});
