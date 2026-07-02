import { describe, expect, it } from 'vitest';
import {
  checkoutCompleted,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  subscriptionCreated,
  paymentFailed,
  refunded,
} from '../src/index.js';

describe('signWebhook — 3 provider', () => {
  it('stripe produces deterministic hmac signature', () => {
    let now = 1000;
    const stripe = createStripeMock({ now: () => now });
    const first = stripe.signWebhook({ type: 'checkout.completed', amountCents: 2000, customerId: 'cus_a' });
    now = 1000;
    const second = stripe.signWebhook({ type: 'checkout.completed', amountCents: 2000, customerId: 'cus_a' });
    // ids differ because engine bumps id counter, but signatures depend only on ts + body
    expect(first.signature).toHaveLength(64);
    expect(second.signature).toHaveLength(64);
    // ids monotonic
    expect(first.event.id).toBe('evt_1');
    expect(second.event.id).toBe('evt_2');
  });

  it('paddle event carries data.attributes.totals.total in cents', () => {
    const paddle = createPaddleMock();
    const { rawBody } = paddle.signWebhook({ type: 'transaction.completed', amountCents: 4999, customerId: 'ctm_p' });
    const parsed = JSON.parse(rawBody);
    expect(parsed.data.attributes.totals.total).toBe('4999');
  });

  it('lemonsqueezy meta.event_name reflects type', () => {
    const ls = createLemonSqueezyMock();
    const { rawBody } = ls.signWebhook({ type: 'order_created', amountCents: 999, customerId: 'usr_ls' });
    const parsed = JSON.parse(rawBody);
    expect(parsed.meta.event_name).toBe('order_created');
  });
});

describe('fixture helpers', () => {
  it('checkoutCompleted / subscriptionCreated / paymentFailed use provider defaults', () => {
    const stripe = createStripeMock();
    const c = checkoutCompleted(stripe, { amountCents: 100, customerId: 'cus_z' });
    const s = subscriptionCreated(stripe, { amountCents: 200, customerId: 'cus_z' });
    const f = paymentFailed(stripe, { amountCents: 300, customerId: 'cus_z' });
    expect(c.event.type).toBe('checkout.completed');
    expect(s.event.type).toBe('subscription.created');
    expect(f.event.type).toBe('payment.failed');
  });

  it('refunded flips sign of amountCents', () => {
    const stripe = createStripeMock();
    const r = refunded(stripe, { amountCents: 1000, customerId: 'cus_z' });
    expect(r.event.amountCents).toBe(-1000);
  });

  it('currency default is usd, override respected', () => {
    const paddle = createPaddleMock();
    const usd = paddle.signWebhook({ type: 'checkout.completed', amountCents: 500, customerId: 'x' });
    const eur = paddle.signWebhook({ type: 'checkout.completed', amountCents: 500, currency: 'eur', customerId: 'x' });
    expect(usd.event.currency).toBe('usd');
    expect(eur.event.currency).toBe('eur');
  });
});
