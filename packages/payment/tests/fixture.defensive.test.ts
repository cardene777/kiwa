import { describe, expect, it } from 'vitest';
import {
  checkoutCompleted,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  PAYMENT_PROVIDERS,
  paymentFailed,
  refunded,
  subscriptionCreated,
} from '../src/index.js';

// Closes the `currency !== undefined` arms in packages/payment/src/fixture.ts.
// sign.test.ts calls every fixture without `currency`, covering only the
// spread-empty-object arm. These cases pass `currency` so both arms of each
// conditional spread are counted.

describe('payment fixture — currency-defined arm', () => {
  it('T-PAY-C-FIX-001 checkoutCompleted forwards explicit currency', () => {
    const stripe = createStripeMock();
    const { event } = checkoutCompleted(stripe, {
      amountCents: 1000,
      currency: 'EUR',
      customerId: 'cus_eur',
    });
    expect(event.currency).toBe('EUR');
    expect(event.type).toContain('checkout');
  });

  it('T-PAY-C-FIX-002 subscriptionCreated forwards explicit currency across providers', () => {
    const paddle = createPaddleMock();
    const { event } = subscriptionCreated(paddle, {
      amountCents: 500,
      currency: 'GBP',
      customerId: 'cus_gbp',
    });
    expect(event.currency).toBe('GBP');
  });

  it('T-PAY-C-FIX-003 paymentFailed forwards explicit currency', () => {
    const lemon = createLemonSqueezyMock();
    const { event } = paymentFailed(lemon, {
      amountCents: 800,
      currency: 'JPY',
      customerId: 'cus_jpy',
    });
    expect(event.currency).toBe('JPY');
    expect(event.amountCents).toBe(800);
  });

  it('T-PAY-C-FIX-004 refunded forwards explicit currency and flips sign', () => {
    const stripe = createStripeMock();
    const { event } = refunded(stripe, {
      amountCents: 2500,
      currency: 'AUD',
      customerId: 'cus_aud',
    });
    expect(event.currency).toBe('AUD');
    expect(event.amountCents).toBe(-2500);
  });

  it('T-PAY-C-FIX-005 refunded with negative input still normalises to negative', () => {
    const stripe = createStripeMock();
    const { event } = refunded(stripe, {
      amountCents: -1500,
      currency: 'USD',
      customerId: 'cus_neg',
    });
    expect(event.amountCents).toBe(-1500);
  });

  it('T-PAY-C-FIX-006 PAYMENT_PROVIDERS enumerates the type union at runtime', () => {
    expect(PAYMENT_PROVIDERS).toEqual(['stripe', 'paddle', 'lemonsqueezy']);
    expect(PAYMENT_PROVIDERS.length).toBe(3);
    for (const p of PAYMENT_PROVIDERS) {
      expect(['stripe', 'paddle', 'lemonsqueezy']).toContain(p);
    }
  });
});
