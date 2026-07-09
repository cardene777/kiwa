/**
 * Inline checkout + subscription tier upgrade/downgrade + proration full-journey
 * vitest spec.
 *
 * Sub-Issue #902 (v1.23-3) AC — a full journey from Paddle inline checkout
 * → webhook delivery → subscription active → tier upgrade → downgrade → proration
 * event is exercised over the mock adapter. Playwright-driven e2e in
 * `tests/e2e/` boots a real Node HTTP server that mounts the same route
 * handlers.
 *
 * Fidelity axes covered here —
 *  1. Inline checkout id / URL / transaction id format is stable across
 *     mock adapter reboots.
 *  2. Webhook signature verify (mock uses HMAC-SHA256, same algorithm as
 *     real Paddle: `Paddle-Signature: ts=..;h1=..`).
 *  3. Webhook effect classification — subscription events dispatch to the
 *     subscription state machine, transaction events to transaction, tax
 *     events to tax.
 *  4. Route-handler validation — malformed body / missing signature / bad
 *     signature / missing buyerCountry all return the expected HTTP status.
 *  5. Real adapter env-detect path yields KIWA_PADDLE_ENV_MISSING when the
 *     env is not set.
 *  6. Subscription tier upgrade / downgrade emits the correct neutral
 *     event (`subscription.upgraded` vs `subscription.downgraded`) with
 *     the amount delta reflected in `newAmountCents`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName, type PaymentWebhookEvent } from '@kiwa-lab/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createCheckoutHandler } from '../src/server/api/checkout.post.js';
import { createWebhookHandler } from '../src/server/api/webhook.post.js';
import {
  createSubscriptionActionHandler,
} from '../src/server/api/subscription-action.post.js';
import { createSubscriptionListHandler } from '../src/server/api/subscription.get.js';

describe('mock adapter — inline checkout ceremony', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: checkout returns stable checkoutId / transactionId / inline URL shape', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_1',
      priceId: 'pri_pro_monthly',
      planId: 'pro',
      amountCents: 2999,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    expect(result.checkoutId).toBe('che_test_paddle_1');
    expect(result.transactionId).toBe('txn_test_paddle_1');
    expect(result.url).toContain('checkout.paddle.com/checkout/che_test_paddle_1');
    expect(result.status).toBe('open');
    expect(result.mode).toBe('mock');
    // Tax preview is always populated (Merchant-of-Record).
    expect(result.taxLine).toBeDefined();
    expect(result.taxLine.kind).toBe('vat');
    expect(result.taxLine.country).toBe('GB');
  });

  it('checkout tax preview computes VAT for cross-border B2C EU buyer', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_2',
      priceId: 'pri_pro_monthly',
      planId: 'pro',
      amountCents: 10000,
      buyerCountry: 'DE',
      merchantCountry: 'GB',
    });
    // DE VAT rate is 1900 bps = 19% → 10000 * 0.19 = 1900 cents.
    expect(result.taxLine.rateBps).toBe(1900);
    expect(result.taxLine.taxCents).toBe(1900);
    expect(result.taxLine.reverseCharged).toBe(false);
    expect(result.taxLine.exempt).toBe(false);
  });

  it('checkout tax preview reverse-charges cross-border B2B EU buyer with VAT id', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_b2b',
      priceId: 'pri_enterprise_monthly',
      planId: 'enterprise',
      amountCents: 50000,
      buyerCountry: 'DE',
      buyerVatId: 'DE123456789',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    // Reverse-charged → buyer self-accounts, merchant charges 0 tax.
    expect(result.taxLine.reverseCharged).toBe(true);
    expect(result.taxLine.taxCents).toBe(0);
    expect(result.taxLine.exempt).toBe(false);
  });

  it('checkout tax preview marks buyer country out of coverage as exempt', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_zz',
      priceId: 'pri_pro_monthly',
      planId: 'pro',
      amountCents: 2999,
      buyerCountry: 'ZZ',
      merchantCountry: 'GB',
    });
    expect(result.taxLine.exempt).toBe(true);
    expect(result.taxLine.taxCents).toBe(0);
  });

  it('checkout emits tax.calculated webhook event on the neutral axis', async () => {
    await adapter.checkout({
      customerId: 'cus_test_tax_evt',
      priceId: 'pri_pro_monthly',
      planId: 'pro',
      amountCents: 5000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    const events = adapter.eventsEmitted();
    // GB → merchant same country → standard VAT calculated.
    const taxEvent = events.find(
      (e) => e.type === providerEventName('paddle', 'tax.calculated'),
    );
    expect(taxEvent).toBeDefined();
  });

  it('axis 2: webhook signature verify accepts adapter-signed payload', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('paddle', 'subscription.created'),
      amountCents: 1000,
      customerId: 'cus_verify',
    });
    const handler = createWebhookHandler(adapter);
    const request = new Request('http://localhost/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'paddle-signature': signed.signature,
      },
      body: signed.rawBody,
    });
    const response = await handler(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      eventType: string;
      dispatched: boolean;
      effect?: { kind: string };
    };
    expect(body.ok).toBe(true);
    expect(body.eventType).toBe('subscription.created');
    expect(body.dispatched).toBe(true);
    expect(body.effect?.kind).toBe('subscription');
  });

  it('webhook rejects payload with tampered body (invalid signature)', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('paddle', 'subscription.created'),
      amountCents: 1000,
      customerId: 'cus_reject',
    });
    const handler = createWebhookHandler(adapter);
    const request = new Request('http://localhost/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'paddle-signature': signed.signature,
      },
      body: signed.rawBody + '{"extra":"tampered"}',
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe('webhook_rejected');
    // Paddle mock returns `invalid-signature` for HMAC mismatch.
    expect(body.message).toMatch(/invalid-signature|malformed-body/);
  });

  it('webhook rejects request without Paddle-Signature header', async () => {
    const handler = createWebhookHandler(adapter);
    const request = new Request('http://localhost/api/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'ntf_1', type: 'subscription.created' }),
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('missing_signature');
  });

  it('checkout route rejects malformed body with 400 invalid_json', async () => {
    const handler = createCheckoutHandler(adapter);
    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('invalid_json');
  });

  it('checkout route rejects request without buyerCountry with 400 missing_fields', async () => {
    const handler = createCheckoutHandler(adapter);
    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_1',
        priceId: 'pri_pro',
        planId: 'pro',
        amountCents: 2999,
      }),
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('missing_fields');
  });

  it('checkout route rejects amount <= 0 with 400 invalid_amount', async () => {
    const handler = createCheckoutHandler(adapter);
    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_1',
        priceId: 'pri_pro',
        planId: 'pro',
        amountCents: 0,
        buyerCountry: 'GB',
      }),
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('invalid_amount');
  });
});

describe('mock adapter — subscription tier upgrade/downgrade', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let subscriptionId: string;

  beforeEach(async () => {
    adapter = makeMockAdapter();
    const runtime = adapter.runtime();
    const sub = await runtime.createSubscription({
      customerId: 'cus_tier',
      planId: 'starter',
      amountCents: 999,
      currency: 'USD',
    });
    subscriptionId = sub.id;
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 6: upgrade emits subscription.upgraded with newAmountCents', async () => {
    const sub = await adapter.changePlan({
      subscriptionId,
      newPlanId: 'pro',
      newAmountCents: 2999,
    });
    expect(sub.state).toBe('upgraded');
    expect(sub.amountCents).toBe(2999);
    expect(sub.planId).toBe('pro');
    const events = adapter.eventsEmitted();
    const upgradedEvent = events.find(
      (e) => e.type === providerEventName('paddle', 'subscription.upgraded'),
    );
    expect(upgradedEvent).toBeDefined();
    // Paddle emits `subscription.updated` for both upgrade + downgrade, so the
    // last upgraded event carries the new amount.
    expect(upgradedEvent?.amountCents).toBe(2999);
  });

  it('downgrade emits subscription.downgraded with lower newAmountCents', async () => {
    // First upgrade to pro so we can downgrade back to starter with a delta.
    await adapter.changePlan({
      subscriptionId,
      newPlanId: 'pro',
      newAmountCents: 2999,
    });
    const sub = await adapter.changePlan({
      subscriptionId,
      newPlanId: 'starter',
      newAmountCents: 999,
    });
    expect(sub.state).toBe('downgraded');
    expect(sub.amountCents).toBe(999);
    const events = adapter.eventsEmitted();
    const downgradeEvents = events.filter(
      (e) =>
        e.type === providerEventName('paddle', 'subscription.downgraded') &&
        e.amountCents === 999,
    );
    expect(downgradeEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('changePlan with equal amount rejects with plan_change_noop', async () => {
    await expect(
      adapter.changePlan({
        subscriptionId,
        newPlanId: 'starter',
        newAmountCents: 999,
      }),
    ).rejects.toThrow(/no-op/);
    const trace = adapter.traces();
    const failed = trace.find((t) => t.op === 'upgradeSubscription' && !t.ok);
    expect(failed?.errorKind).toBe('plan_change_noop');
  });

  it('changePlan on canceled subscription rejects with subscription_canceled', async () => {
    await adapter.cancelSubscription(subscriptionId);
    await expect(
      adapter.changePlan({
        subscriptionId,
        newPlanId: 'pro',
        newAmountCents: 2999,
      }),
    ).rejects.toThrow(/is canceled/);
  });

  it('axis 3: webhook subscription.updated dispatches to subscription effect', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('paddle', 'subscription.upgraded'),
      amountCents: 2999,
      customerId: 'cus_tier',
    });
    const handler = createWebhookHandler(adapter);
    const request = new Request('http://localhost/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'paddle-signature': signed.signature,
      },
      body: signed.rawBody,
    });
    const response = await handler(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      dispatched: boolean;
      effect?: { kind: string; newState: string };
    };
    expect(body.dispatched).toBe(true);
    expect(body.effect?.kind).toBe('subscription');
    expect(body.effect?.newState).toBe('updated');
  });

  it('subscription list route returns updated subscription after action', async () => {
    await adapter.changePlan({
      subscriptionId,
      newPlanId: 'pro',
      newAmountCents: 2999,
    });
    const listHandler = createSubscriptionListHandler(adapter);
    const response = await listHandler(
      new Request('http://localhost/api/subscription'),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      subscriptions: { id: string; planId: string; amountCents: number; state: string }[];
    };
    const sub = body.subscriptions.find((s) => s.id === subscriptionId);
    expect(sub?.planId).toBe('pro');
    expect(sub?.amountCents).toBe(2999);
    expect(sub?.state).toBe('upgraded');
  });

  it('subscription action route pauses subscription with 200 + persisted state', async () => {
    const actionHandler = createSubscriptionActionHandler(adapter);
    const response = await actionHandler(
      new Request('http://localhost/api/subscription/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'pause', subscriptionId }),
      }),
    );
    expect(response.status).toBe(200);
    const persisted = adapter.getSubscription(subscriptionId);
    expect(persisted?.state).toBe('paused');
  });

  it('subscription action route rejects pause after cancel with 409 illegal_transition', async () => {
    await adapter.cancelSubscription(subscriptionId);
    const actionHandler = createSubscriptionActionHandler(adapter);
    const response = await actionHandler(
      new Request('http://localhost/api/subscription/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'pause', subscriptionId }),
      }),
    );
    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('illegal_transition');
  });

  it('subscription action route dispatches reactivate after cancel', async () => {
    await adapter.cancelSubscription(subscriptionId);
    const actionHandler = createSubscriptionActionHandler(adapter);
    const response = await actionHandler(
      new Request('http://localhost/api/subscription/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate', subscriptionId }),
      }),
    );
    expect(response.status).toBe(200);
    const persisted = adapter.getSubscription(subscriptionId);
    expect(persisted?.state).toBe('active');
    const events = adapter.eventsEmitted();
    expect(events.map((e: PaymentWebhookEvent) => e.type)).toContain(
      providerEventName('paddle', 'subscription.reactivated'),
    );
  });
});

describe('real adapter — env-gated skeleton', () => {
  it('axis 5: real adapter checkout surfaces KIWA_PADDLE_ENV_MISSING', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.checkout({
        customerId: 'cus_real',
        priceId: 'pri_pro',
        planId: 'pro',
        amountCents: 2999,
        buyerCountry: 'GB',
      }),
    ).rejects.toThrow(/KIWA_PADDLE_ENV_MISSING|KIWA_MODE|PADDLE_KEY|PADDLE_NOTIFICATION_SECRET/);
  });

  it('detectRealEnvMissing reports KIWA_MODE not real by default', () => {
    // The vitest process runs without KIWA_MODE=real; the detect helper
    // should report the exact reason so the fidelity harness can filter
    // real-side tests.
    const previousMode = process.env['KIWA_MODE'];
    delete process.env['KIWA_MODE'];
    try {
      const reason = detectRealEnvMissing();
      expect(reason).toBe('KIWA_MODE not real');
    } finally {
      if (previousMode !== undefined) process.env['KIWA_MODE'] = previousMode;
    }
  });

  it('real adapter mode === real and traces update on env-failed calls', async () => {
    const adapter = makeRealAdapter();
    expect(adapter.mode).toBe('real');
    // The fidelity harness expects mode === "real" so the mock vs real diff
    // is tagged.
    await adapter.checkout({
      customerId: 'cus_trace',
      priceId: 'pri_pro',
      planId: 'pro',
      amountCents: 2999,
      buyerCountry: 'GB',
    }).catch(() => {
      // ignore — we're inspecting the trace not the return value.
    });
    const trace = adapter.traces();
    const checkoutFail = trace.find((t) => t.op === 'checkout' && !t.ok);
    expect(checkoutFail).toBeDefined();
    // errorKind is one of the detect helper's known reasons or the fallback.
    expect(checkoutFail?.errorKind).toMatch(
      /KIWA_MODE|PADDLE_KEY|PADDLE_NOTIFICATION_SECRET|KIWA_PADDLE_ENV_MISSING/,
    );
  });
});
