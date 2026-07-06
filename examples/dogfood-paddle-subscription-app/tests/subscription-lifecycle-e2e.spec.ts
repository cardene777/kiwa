/**
 * Subscription lifecycle + customer signup + trial extension fidelity spec.
 *
 * Covers deterministic customer ids, subscription creation with trial windows,
 * idempotent create, activate + cancel state transitions, trial extension
 * arithmetic, insertion-order listing, trace capture, env-gated real mode,
 * and emitted Paddle Billing v2 webhook events.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  createSubscriptionHandler,
  getCustomerHandler,
  listSubscriptionsHandler,
} from '../src/app/subscription/route.js';
import { extendTrialHandler } from '../src/app/trial/route.js';

const NOW = 1_700_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

describe('mock adapter — subscription lifecycle flows', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter({ now: () => NOW });
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: createCustomer returns stable ctm_test_1 + defaultPaymentMethodId null', async () => {
    const customer = await adapter.createCustomer({ email: 'buyer-1@example.com' });
    expect(customer.id).toBe('ctm_test_1');
    expect(customer.defaultPaymentMethodId).toBeNull();
    expect(customer.status).toBe('active');
  });

  it('axis 2: multiple createCustomer increments id', async () => {
    const first = await adapter.createCustomer({ email: 'buyer-1@example.com' });
    const second = await adapter.createCustomer({ email: 'buyer-2@example.com' });
    expect(first.id).toBe('ctm_test_1');
    expect(second.id).toBe('ctm_test_2');
  });

  it('axis 3: createCustomer duplicate email throws duplicate_email', async () => {
    await adapter.createCustomer({ email: 'dup@example.com' });
    await expect(adapter.createCustomer({ email: 'dup@example.com' })).rejects.toMatchObject({
      reason: 'duplicate_email',
    });
  });

  it('axis 4: createCustomer missing email throws invalid_input', async () => {
    await expect(adapter.createCustomer({ email: '' })).rejects.toMatchObject({
      reason: 'invalid_input',
    });
  });

  it('axis 5: createSubscription without trial starts active', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    expect(subscription.id).toBe('sub_test_1');
    expect(subscription.status).toBe('active');
    expect(subscription.trialEndsAt).toBeNull();
    expect(subscription.activatedAt).toBe(NOW);
  });

  it('axis 6: createSubscription with trialDays starts trialing + trialEndsAt set', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      trialDays: 14,
    });
    expect(subscription.status).toBe('trialing');
    expect(subscription.trialDays).toBe(14);
    expect(subscription.trialEndsAt).toBe(NOW + 14 * DAY_MS);
    expect(subscription.activatedAt).toBeNull();
  });

  it('axis 7: createSubscription attaches default payment method to customer on first call', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    expect(adapter.runtime().store.getCustomer('ctm_test_1')?.defaultPaymentMethodId).toBeNull();
    await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    expect(adapter.runtime().store.getCustomer('ctm_test_1')?.defaultPaymentMethodId).toBe(
      'pm_test_1',
    );
  });

  it('axis 8: createSubscription idempotency key returns same subscription on retry', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const first = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      idempotencyKey: 'idem-1',
    });
    const second = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      idempotencyKey: 'idem-1',
    });
    expect(second.id).toBe(first.id);
  });

  it('axis 9: createSubscription with unknown customer throws entity_not_found', async () => {
    await expect(
      adapter.createSubscription({
        customerId: 'ctm_missing',
        priceId: 'pri_pro',
        planPriceCents: 9_900,
      }),
    ).rejects.toMatchObject({ reason: 'entity_not_found' });
  });

  it('axis 10: createSubscription with planPriceCents <= 0 throws invalid_amount', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    await expect(
      adapter.createSubscription({
        customerId: 'ctm_test_1',
        priceId: 'pri_pro',
        planPriceCents: 0,
      }),
    ).rejects.toMatchObject({ reason: 'invalid_amount' });
  });

  it('axis 11: extendTrial extends trialEndsAt by requested days', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      trialDays: 14,
    });
    const extended = await adapter.extendTrial({
      subscriptionId: subscription.id,
      additionalDays: 10,
    });
    expect(extended.trialDays).toBe(24);
    expect(extended.trialEndsAt).toBe(NOW + 24 * DAY_MS);
  });

  it('axis 12: extendTrial on non-trialing subscription throws not_trialing', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    await expect(
      adapter.extendTrial({ subscriptionId: subscription.id, additionalDays: 7 }),
    ).rejects.toMatchObject({ reason: 'not_trialing' });
  });

  it('axis 13: extendTrial with additionalDays <= 0 throws invalid_trial_days', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      trialDays: 14,
    });
    await expect(
      adapter.extendTrial({ subscriptionId: subscription.id, additionalDays: 0 }),
    ).rejects.toMatchObject({ reason: 'invalid_trial_days' });
  });

  it('axis 14: activateSubscription transitions trialing to active', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      trialDays: 14,
    });
    const activated = await adapter.activateSubscription(subscription.id);
    expect(activated.status).toBe('active');
    expect(activated.activatedAt).toBe(NOW);
  });

  it('axis 15: activateSubscription on already-active throws already_active', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    await expect(adapter.activateSubscription(subscription.id)).rejects.toMatchObject({
      reason: 'already_active',
    });
  });

  it('axis 16: cancelSubscription transitions to canceled', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    const canceled = await adapter.cancelSubscription(subscription.id);
    expect(canceled.status).toBe('canceled');
    expect(canceled.canceledAt).toBe(NOW);
  });

  it('axis 17: cancelSubscription twice throws already_canceled', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    await adapter.cancelSubscription(subscription.id);
    await expect(adapter.cancelSubscription(subscription.id)).rejects.toMatchObject({
      reason: 'already_canceled',
    });
  });

  it('axis 18: listSubscriptions filter by customerId returns only that customer subscriptions', async () => {
    await adapter.createCustomer({ email: 'first@example.com' });
    await adapter.createCustomer({ email: 'second@example.com' });
    await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    await adapter.createSubscription({
      customerId: 'ctm_test_2',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    const handler = listSubscriptionsHandler(adapter);
    const response = await handler(
      new Request('http://localhost/subscription?customerId=ctm_test_1', { method: 'GET' }),
    );
    const body = (await response.json()) as {
      subscriptions: Array<{ customerId: string }>;
    };
    expect(body.subscriptions).toHaveLength(1);
    expect(body.subscriptions[0]?.customerId).toBe('ctm_test_1');
  });

  it('axis 19: getCustomer route returns the persisted snapshot', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com', country: 'JP' });
    const handler = getCustomerHandler(adapter);
    const response = await handler(
      new Request('http://localhost/customer?customerId=ctm_test_1', { method: 'GET' }),
    );
    const body = (await response.json()) as { customer: { country: string } };
    expect(response.status).toBe(200);
    expect(body.customer.country).toBe('JP');
  });

  it('axis 20: real adapter detectRealEnvMissing returns KIWA_MODE not real when unset', () => {
    const prevMode = process.env['KIWA_MODE'];
    const prevKey = process.env['PADDLE_API_KEY'];
    const prevReady = process.env['KIWA_PADDLE_REAL_READY'];
    delete process.env['KIWA_MODE'];
    delete process.env['PADDLE_API_KEY'];
    delete process.env['KIWA_PADDLE_REAL_READY'];
    expect(detectRealEnvMissing()).toBe('KIWA_MODE not real');
    if (prevMode !== undefined) process.env['KIWA_MODE'] = prevMode;
    if (prevKey !== undefined) process.env['PADDLE_API_KEY'] = prevKey;
    if (prevReady !== undefined) process.env['KIWA_PADDLE_REAL_READY'] = prevReady;
  });

  it('axis 21: real adapter createSubscription throws KIWA_PADDLE_ENV_MISSING', async () => {
    const realAdapter = makeRealAdapter();
    await expect(
      realAdapter.createSubscription({
        customerId: 'ctm_real',
        priceId: 'pri_real',
        planPriceCents: 9_900,
      }),
    ).rejects.toThrow(/KIWA_PADDLE_ENV_MISSING/);
    await realAdapter.reset();
  });

  it('axis 22: trace event contains op=createSubscription + detail.subscriptionId', async () => {
    await adapter.createCustomer({ email: 'trace@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    const event = adapter.traces().find((trace) => trace.op === 'createSubscription');
    expect(event?.detail?.['subscriptionId']).toBe(subscription.id);
  });

  it('axis 23: createSubscription emits subscription.created webhook event', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
    });
    const events = adapter.eventsEmitted();
    // customer.created + subscription.created (paddle dialect stays subscription.created)
    const created = events.find((event) => event.type === 'subscription.created');
    expect(created).toBeDefined();
    expect(created?.detail?.['subscriptionId']).toBe(subscription.id);
  });

  it('axis 24: extendTrial handler flow returns extended trial in JSON', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      trialDays: 14,
    });
    const handler = extendTrialHandler(adapter);
    const response = await handler(
      new Request('http://localhost/trial/extend', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: subscription.id, additionalDays: 7 }),
      }),
    );
    const body = (await response.json()) as { subscription: { trialDays: number } };
    expect(response.status).toBe(200);
    expect(body.subscription.trialDays).toBe(21);
  });

  it('axis 25: createSubscription handler validates missing planPriceCents with 400', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const handler = createSubscriptionHandler(adapter);
    const response = await handler(
      new Request('http://localhost/subscription', {
        method: 'POST',
        body: JSON.stringify({ customerId: 'ctm_test_1', priceId: 'pri_pro' }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('axis 26: subscription trace ordering create then activate then cancel', async () => {
    await adapter.createCustomer({ email: 'buyer@example.com' });
    const subscription = await adapter.createSubscription({
      customerId: 'ctm_test_1',
      priceId: 'pri_pro',
      planPriceCents: 9_900,
      trialDays: 14,
    });
    await adapter.activateSubscription(subscription.id);
    await adapter.cancelSubscription(subscription.id);
    expect(
      adapter
        .traces()
        .filter((trace) =>
          ['createSubscription', 'activateSubscription', 'cancelSubscription'].includes(trace.op),
        )
        .map((trace) => trace.op),
    ).toEqual(['createSubscription', 'activateSubscription', 'cancelSubscription']);
  });
});
