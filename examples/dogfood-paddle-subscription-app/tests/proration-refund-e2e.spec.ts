/**
 * Proration + refund window fidelity spec.
 *
 * Covers mid-cycle plan change proration arithmetic (upgrade / downgrade
 * credits), refund window enforcement (inside + outside cutoff), listing
 * order, emitted Paddle Billing v2 webhook events, and env-gated real-mode
 * failures.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName } from '@kiwa/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  applyProrationHandler,
  listProrationsHandler,
} from '../src/app/proration/route.js';
import { requestRefundHandler } from '../src/app/retention/route.js';

const NOW = 1_700_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

describe('mock adapter — proration + refund window flows', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(async () => {
    adapter = makeMockAdapter({ now: () => NOW });
    await adapter.createCustomer({ email: 'buyer@example.com' });
    await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      createdAtMs: NOW,
    });
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: applyProration upgrade returns positive deltaCents', async () => {
    const proration = await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_pro_plus',
      newPlanPriceCents: 19_900,
      daysElapsed: 15,
      daysInCycle: 30,
    });
    expect(proration.deltaCents).toBe(5_000);
    expect(proration.oldPriceId).toBe('pri_pro');
    expect(proration.newPriceId).toBe('pri_pro_plus');
  });

  it('axis 2: applyProration downgrade returns negative deltaCents', async () => {
    const proration = await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_basic',
      newPlanPriceCents: 4_900,
      daysElapsed: 15,
      daysInCycle: 30,
    });
    expect(proration.deltaCents).toBe(-2_500);
  });

  it('axis 3: applyProration updates subscription plan + price', async () => {
    await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_pro_plus',
      newPlanPriceCents: 19_900,
      daysElapsed: 15,
      daysInCycle: 30,
    });
    const subscription = adapter.runtime().store.getSubscription('sub_test_1');
    expect(subscription?.priceId).toBe('pri_pro_plus');
    expect(subscription?.planPriceCents).toBe(19_900);
    expect(subscription?.currentCyclePriceCents).toBe(19_900);
  });

  it('axis 4: applyProration invalid daysInCycle throws invalid_cycle', async () => {
    await expect(
      adapter.applyProration({
        subscriptionId: 'sub_test_1',
        newPriceId: 'pri_pro_plus',
        newPlanPriceCents: 19_900,
        daysElapsed: 15,
        daysInCycle: 0,
      }),
    ).rejects.toMatchObject({ reason: 'invalid_cycle' });
  });

  it('axis 5: applyProration daysElapsed out of range throws invalid_elapsed', async () => {
    await expect(
      adapter.applyProration({
        subscriptionId: 'sub_test_1',
        newPriceId: 'pri_pro_plus',
        newPlanPriceCents: 19_900,
        daysElapsed: 40,
        daysInCycle: 30,
      }),
    ).rejects.toMatchObject({ reason: 'invalid_elapsed' });
  });

  it('axis 6: applyProration on canceled subscription throws already_canceled', async () => {
    await adapter.cancelSubscription('sub_test_1');
    await expect(
      adapter.applyProration({
        subscriptionId: 'sub_test_1',
        newPriceId: 'pri_pro_plus',
        newPlanPriceCents: 19_900,
        daysElapsed: 15,
        daysInCycle: 30,
      }),
    ).rejects.toMatchObject({ reason: 'already_canceled' });
  });

  it('axis 7: applyProration on unknown subscription throws entity_not_found', async () => {
    await expect(
      adapter.applyProration({
        subscriptionId: 'sub_missing',
        newPriceId: 'pri_pro_plus',
        newPlanPriceCents: 19_900,
        daysElapsed: 15,
        daysInCycle: 30,
      }),
    ).rejects.toMatchObject({ reason: 'entity_not_found' });
  });

  it('axis 8: applyProration emits subscription.proration_applied provider event', async () => {
    await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_pro_plus',
      newPlanPriceCents: 19_900,
      daysElapsed: 15,
      daysInCycle: 30,
    });
    const paddleEventName = providerEventName(
      'paddle',
      'subscription.proration_applied' as never,
    );
    const matched = adapter.eventsEmitted().find((event) => event.type === paddleEventName);
    expect(matched).toBeDefined();
  });

  it('axis 9: listProrations sorted by createdAt ascending', async () => {
    await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_pro_plus',
      newPlanPriceCents: 19_900,
      daysElapsed: 10,
      daysInCycle: 30,
      createdAtMs: NOW,
    });
    await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_pro_ultra',
      newPlanPriceCents: 29_900,
      daysElapsed: 20,
      daysInCycle: 30,
      createdAtMs: NOW + 1_000,
    });
    const handler = listProrationsHandler(adapter);
    const response = await handler(
      new Request('http://localhost/proration?subscriptionId=sub_test_1', { method: 'GET' }),
    );
    const body = (await response.json()) as { prorations: Array<{ createdAt: number }> };
    expect(body.prorations.map((proration) => proration.createdAt)).toEqual([NOW, NOW + 1_000]);
  });

  it('axis 10: applyProration handler returns HTTP 200 with proration', async () => {
    const handler = applyProrationHandler(adapter);
    const response = await handler(
      new Request('http://localhost/proration', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: 'sub_test_1',
          newPriceId: 'pri_pro_plus',
          newPlanPriceCents: 19_900,
          daysElapsed: 15,
          daysInCycle: 30,
        }),
      }),
    );
    const body = (await response.json()) as { proration: { deltaCents: number } };
    expect(response.status).toBe(200);
    expect(body.proration.deltaCents).toBe(5_000);
  });

  it('axis 11: requestRefund inside 14-day window returns granted', async () => {
    const refund = await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 10 * DAY_MS,
    });
    expect(refund.status).toBe('granted');
    expect(refund.amountCents).toBe(9_900);
    expect(refund.reason).toBeUndefined();
  });

  it('axis 12: requestRefund outside 14-day window returns denied', async () => {
    const refund = await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 30 * DAY_MS,
    });
    expect(refund.status).toBe('denied');
    expect(refund.amountCents).toBe(0);
    expect(refund.reason).toBe('refund_window_exceeded');
  });

  it('axis 13: requestRefund custom refundWindowDays 30 grants refund at day 20', async () => {
    const refund = await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 20 * DAY_MS,
      refundWindowDays: 30,
    });
    expect(refund.status).toBe('granted');
  });

  it('axis 14: requestRefund at exact 14-day boundary grants refund', async () => {
    const refund = await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 14 * DAY_MS,
    });
    expect(refund.status).toBe('granted');
  });

  it('axis 15: requestRefund emits subscription.refund_granted webhook event', async () => {
    await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 5 * DAY_MS,
    });
    const eventTypes = adapter.eventsEmitted().map((event) => event.type);
    expect(eventTypes).toContain('subscription.refund_granted');
  });

  it('axis 16: requestRefund handler denied refund returns HTTP 200 with denied status', async () => {
    const handler = requestRefundHandler(adapter);
    const response = await handler(
      new Request('http://localhost/retention/refund', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: 'sub_test_1',
          requestedAtMs: NOW + 60 * DAY_MS,
        }),
      }),
    );
    const body = (await response.json()) as {
      refund: { status: string; reason?: string };
    };
    expect(response.status).toBe(200);
    expect(body.refund.status).toBe('denied');
    expect(body.refund.reason).toBe('refund_window_exceeded');
  });

  it('axis 17: real adapter applyProration throws KIWA_PADDLE_ENV_MISSING', async () => {
    const realAdapter = makeRealAdapter();
    await expect(
      realAdapter.applyProration({
        subscriptionId: 'sub_real',
        newPriceId: 'pri_real_plus',
        newPlanPriceCents: 19_900,
        daysElapsed: 15,
        daysInCycle: 30,
      }),
    ).rejects.toThrow(/KIWA_PADDLE_ENV_MISSING/);
    await realAdapter.reset();
  });

  it('axis 18: multiple refund requests emit correct provider event names', async () => {
    await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 5 * DAY_MS,
    });
    await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 60 * DAY_MS,
    });
    const eventTypes = adapter.eventsEmitted().map((event) => event.type);
    expect(eventTypes).toContain('subscription.refund_granted');
    expect(eventTypes).toContain('subscription.refund_denied');
  });

  it('axis 19: trace event ordering after applyProration + requestRefund', async () => {
    await adapter.applyProration({
      subscriptionId: 'sub_test_1',
      newPriceId: 'pri_pro_plus',
      newPlanPriceCents: 19_900,
      daysElapsed: 15,
      daysInCycle: 30,
    });
    await adapter.requestRefund({
      subscriptionId: 'sub_test_1',
      requestedAtMs: NOW + 5 * DAY_MS,
    });
    expect(
      adapter
        .traces()
        .filter((trace) => ['applyProration', 'requestRefund'].includes(trace.op))
        .map((trace) => trace.op),
    ).toEqual(['applyProration', 'requestRefund']);
  });
});
