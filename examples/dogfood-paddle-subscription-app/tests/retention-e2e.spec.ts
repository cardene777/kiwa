/**
 * Retention offer + coupon stacking fidelity spec.
 *
 * Covers pause / downgrade / coupon retention offers, offer acceptance state
 * transitions, coupon stacking arithmetic (additive + non-stackable),
 * insertion-order listing, trace capture, emitted Paddle Billing v2 webhook
 * events, and env-gated real-mode failures.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  listRetentionOffersHandler,
  offerRetentionHandler,
  stackCouponHandler,
} from '../src/app/retention/route.js';

const NOW = 1_700_000_000_000;

describe('mock adapter — retention offer + coupon flows', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(async () => {
    adapter = makeMockAdapter({ now: () => NOW });
    await adapter.createCustomer({ email: 'buyer@example.com' });
    await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: offerRetention pause returns kind=pause + pauseDays', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'pause',
      pauseDays: 30,
    });
    expect(offer.id).toBe('ret_test_1');
    expect(offer.kind).toBe('pause');
    expect(offer.pauseDays).toBe(30);
    expect(offer.accepted).toBe(false);
  });

  it('axis 2: offerRetention downgrade returns kind=downgrade + newPriceId', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'downgrade',
      newPriceId: 'pri_basic',
      newPlanPriceCents: 4_900,
    });
    expect(offer.kind).toBe('downgrade');
    expect(offer.newPriceId).toBe('pri_basic');
    expect(offer.newPlanPriceCents).toBe(4_900);
  });

  it('axis 3: offerRetention coupon returns kind=coupon + percentOff', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'coupon',
      couponCode: 'RETAIN20',
      couponPercentOff: 20,
    });
    expect(offer.kind).toBe('coupon');
    expect(offer.couponCode).toBe('RETAIN20');
    expect(offer.couponPercentOff).toBe(20);
  });

  it('axis 4: offerRetention pause without pauseDays throws invalid_pause_days', async () => {
    await expect(
      adapter.offerRetention({ subscriptionId: 'sub_test_1', kind: 'pause' }),
    ).rejects.toMatchObject({ reason: 'invalid_pause_days' });
  });

  it('axis 5: offerRetention downgrade without newPriceId throws invalid_downgrade', async () => {
    await expect(
      adapter.offerRetention({ subscriptionId: 'sub_test_1', kind: 'downgrade' }),
    ).rejects.toMatchObject({ reason: 'invalid_downgrade' });
  });

  it('axis 6: offerRetention coupon without couponCode throws invalid_coupon_offer', async () => {
    await expect(
      adapter.offerRetention({ subscriptionId: 'sub_test_1', kind: 'coupon' }),
    ).rejects.toMatchObject({ reason: 'invalid_coupon_offer' });
  });

  it('axis 7: acceptRetention pause pauses the subscription', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'pause',
      pauseDays: 30,
    });
    const accepted = await adapter.acceptRetention(offer.id);
    expect(accepted.accepted).toBe(true);
    const subscription = adapter.runtime().store.getSubscription('sub_test_1');
    expect(subscription?.status).toBe('paused');
    expect(subscription?.pausedAt).toBe(NOW);
  });

  it('axis 8: acceptRetention downgrade updates subscription plan price', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'downgrade',
      newPriceId: 'pri_basic',
      newPlanPriceCents: 4_900,
    });
    await adapter.acceptRetention(offer.id);
    const subscription = adapter.runtime().store.getSubscription('sub_test_1');
    expect(subscription?.priceId).toBe('pri_basic');
    expect(subscription?.planPriceCents).toBe(4_900);
  });

  it('axis 9: acceptRetention coupon updates discountPercent + couponCodes', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'coupon',
      couponCode: 'RETAIN20',
      couponPercentOff: 20,
    });
    await adapter.acceptRetention(offer.id);
    const subscription = adapter.runtime().store.getSubscription('sub_test_1');
    expect(subscription?.discountPercent).toBe(20);
    expect(subscription?.couponCodes).toContain('RETAIN20');
  });

  it('axis 10: acceptRetention twice throws already_accepted', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'pause',
      pauseDays: 30,
    });
    await adapter.acceptRetention(offer.id);
    await expect(adapter.acceptRetention(offer.id)).rejects.toMatchObject({
      reason: 'already_accepted',
    });
  });

  it('axis 11: offerRetention on canceled subscription throws already_canceled', async () => {
    await adapter.cancelSubscription('sub_test_1');
    await expect(
      adapter.offerRetention({
        subscriptionId: 'sub_test_1',
        kind: 'pause',
        pauseDays: 30,
      }),
    ).rejects.toMatchObject({ reason: 'already_canceled' });
  });

  it('axis 12: stackCoupon single stackable adds to discountPercent', async () => {
    const stack = await adapter.stackCoupon({
      subscriptionId: 'sub_test_1',
      code: 'PROMO10',
      percentOff: 10,
    });
    expect(stack.totalPercentOff).toBe(10);
    expect(stack.discountedCents).toBe(8_910);
    expect(stack.activeCoupons).toEqual(['PROMO10']);
  });

  it('axis 13: stackCoupon multiple stackable combine additively (capped at 100)', async () => {
    await adapter.stackCoupon({ subscriptionId: 'sub_test_1', code: 'A', percentOff: 40 });
    const stack = await adapter.stackCoupon({
      subscriptionId: 'sub_test_1',
      code: 'B',
      percentOff: 30,
    });
    expect(stack.totalPercentOff).toBe(70);
    expect(stack.discountedCents).toBe(2_970);
    expect(stack.activeCoupons).toEqual(['A', 'B']);
  });

  it('axis 14: stackCoupon percent exceeding 100 caps at 100', async () => {
    await adapter.stackCoupon({ subscriptionId: 'sub_test_1', code: 'A', percentOff: 70 });
    const stack = await adapter.stackCoupon({
      subscriptionId: 'sub_test_1',
      code: 'B',
      percentOff: 50,
    });
    expect(stack.totalPercentOff).toBe(100);
    expect(stack.discountedCents).toBe(0);
  });

  it('axis 15: stackCoupon non-stackable replaces existing codes', async () => {
    await adapter.stackCoupon({ subscriptionId: 'sub_test_1', code: 'A', percentOff: 40 });
    const stack = await adapter.stackCoupon({
      subscriptionId: 'sub_test_1',
      code: 'EXCLUSIVE',
      percentOff: 25,
      stackable: false,
    });
    expect(stack.activeCoupons).toEqual(['EXCLUSIVE']);
    expect(stack.totalPercentOff).toBe(25);
  });

  it('axis 16: stackCoupon invalid percentOff throws invalid_coupon_percent', async () => {
    await expect(
      adapter.stackCoupon({ subscriptionId: 'sub_test_1', code: 'BAD', percentOff: 0 }),
    ).rejects.toMatchObject({ reason: 'invalid_coupon_percent' });
    await expect(
      adapter.stackCoupon({ subscriptionId: 'sub_test_1', code: 'BAD', percentOff: 101 }),
    ).rejects.toMatchObject({ reason: 'invalid_coupon_percent' });
  });

  it('axis 17: stackCoupon on canceled subscription throws already_canceled', async () => {
    await adapter.cancelSubscription('sub_test_1');
    await expect(
      adapter.stackCoupon({ subscriptionId: 'sub_test_1', code: 'A', percentOff: 10 }),
    ).rejects.toMatchObject({ reason: 'already_canceled' });
  });

  it('axis 18: listRetentionOffers filter by subscriptionId returns only related offers', async () => {
    await adapter.createCustomer({ email: 'buyer-2@example.com' });
    await adapter.createSubscription({
      customerId: 'ctm_test_2',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'pause',
      pauseDays: 30,
    });
    await adapter.offerRetention({
      subscriptionId: 'sub_test_2',
      kind: 'coupon',
      couponCode: 'C',
      couponPercentOff: 15,
    });
    const handler = listRetentionOffersHandler(adapter);
    const response = await handler(
      new Request('http://localhost/retention?subscriptionId=sub_test_1', { method: 'GET' }),
    );
    const body = (await response.json()) as {
      offers: Array<{ subscriptionId: string }>;
    };
    expect(body.offers).toHaveLength(1);
    expect(body.offers[0]?.subscriptionId).toBe('sub_test_1');
  });

  it('axis 19: offerRetention handler validates missing kind with 400', async () => {
    const handler = offerRetentionHandler(adapter);
    const response = await handler(
      new Request('http://localhost/retention/offer', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: 'sub_test_1' }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('axis 20: stackCoupon handler returns HTTP 200 with stack details', async () => {
    const handler = stackCouponHandler(adapter);
    const response = await handler(
      new Request('http://localhost/retention/coupon', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: 'sub_test_1',
          code: 'FRIENDS15',
          percentOff: 15,
        }),
      }),
    );
    const body = (await response.json()) as { stack: { totalPercentOff: number } };
    expect(response.status).toBe(200);
    expect(body.stack.totalPercentOff).toBe(15);
  });

  it('axis 21: retention offer emits subscription.retention_offered webhook event', async () => {
    await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'pause',
      pauseDays: 30,
    });
    const eventTypes = adapter.eventsEmitted().map((event) => event.type);
    expect(eventTypes).toContain('subscription.retention_offered');
  });

  it('axis 22: trace ordering offerRetention then acceptRetention', async () => {
    const offer = await adapter.offerRetention({
      subscriptionId: 'sub_test_1',
      kind: 'coupon',
      couponCode: 'RETAIN',
      couponPercentOff: 20,
    });
    await adapter.acceptRetention(offer.id);
    expect(
      adapter
        .traces()
        .filter((trace) => ['offerRetention', 'acceptRetention'].includes(trace.op))
        .map((trace) => trace.op),
    ).toEqual(['offerRetention', 'acceptRetention']);
  });

  it('axis 23: real adapter offerRetention throws KIWA_PADDLE_ENV_MISSING', async () => {
    const realAdapter = makeRealAdapter();
    await expect(
      realAdapter.offerRetention({
        subscriptionId: 'sub_real',
        kind: 'pause',
        pauseDays: 30,
      }),
    ).rejects.toThrow(/KIWA_PADDLE_ENV_MISSING/);
    await realAdapter.reset();
  });
});
