/**
 * Checkout + subscription + invoice full-journey vitest spec.
 *
 * Sub-Issue #901 (v1.23-2) AC — a full journey from checkout session
 * creation → webhook delivery → subscription active → invoice generated is
 * exercised over the mock adapter. Playwright-driven e2e in `tests/e2e/`
 * boots a real Node HTTP server that mounts the same route handlers.
 *
 * Fidelity axes covered here —
 *  1. Checkout session id / url / payment intent id format is stable across
 *     mock adapter reboots.
 *  2. Webhook signature verify (mock uses HMAC-SHA256, same algorithm as
 *     real Stripe).
 *  3. Webhook effect classification — subscription events dispatch to the
 *     subscription state machine, invoice events to invoice.
 *  4. Route-handler validation — malformed body / missing signature / bad
 *     signature all return the expected HTTP status.
 *  5. Real adapter env-detect path yields KIWA_STRIPE_ENV_MISSING when the
 *     env is not set.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  providerEventName,
  type PaymentWebhookEvent,
} from '@kiwa-test/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createCheckoutHandler } from '../src/app/checkout/route.js';
import { createWebhookHandler } from '../src/app/webhook/route.js';
import {
  createSubscriptionActionHandler,
  createSubscriptionListHandler,
} from '../src/app/subscription/route.js';
import {
  createInvoiceActionHandler,
  createInvoiceListHandler,
} from '../src/app/invoice/route.js';

describe('mock adapter — checkout ceremony', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: checkout returns stable session id / payment intent id / url shape', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_1',
      planId: 'pro',
      amountCents: 2999,
    });
    expect(result.sessionId).toBe('cs_test_stripe_1');
    expect(result.paymentIntentId).toBe('pi_test_stripe_1');
    expect(result.url).toContain('checkout.stripe.com/pay/cs_test_stripe_1');
    expect(result.status).toBe('open');
    expect(result.mode).toBe('mock');
    expect(result.threeDs).toBeUndefined();
  });

  it('checkout with requiresThreeDs kicks off 3DS session in fingerprint state → challenge-pending', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_2',
      planId: 'enterprise',
      amountCents: 9999,
      requiresThreeDs: true,
    });
    expect(result.threeDs).toBeDefined();
    // startThreeDs → challenge-pending after threeDsRequestChallenge fires
    expect(result.threeDs?.state).toBe('challenge-pending');
    expect(result.threeDs?.paymentIntentId).toBe('pi_test_stripe_1');
    // The challenge_required webhook was emitted.
    const events = adapter.eventsEmitted();
    expect(events.map((e) => e.type)).toContain(
      providerEventName('stripe', '3ds.challenge_required'),
    );
  });

  it('axis 2: webhook signature verify accepts adapter-signed payload', async () => {
    // Round-trip: adapter signs a payload → route handler verifies + emits.
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('stripe', 'subscription.created'),
      amountCents: 1000,
      customerId: 'cus_verify',
    });
    const handler = createWebhookHandler(adapter);
    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signed.signature,
      },
      body: signed.rawBody,
    });
    const response = await handler(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      eventId: string;
      eventType: string;
      dispatched: boolean;
      effect?: { kind: string; entityId: string; newState?: string };
    };
    expect(body.ok).toBe(true);
    expect(body.dispatched).toBe(true);
    expect(body.effect?.kind).toBe('subscription');
    // Stripe's provider dialect for subscription.created is
    // `customer.subscription.created`; deriveEffect strips to the last
    // token → `created`.
    expect(body.effect?.newState).toBe('created');
  });

  it('webhook rejects bad signature with 400', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('stripe', 'invoice.paid'),
      amountCents: 500,
      customerId: 'cus_bad',
    });
    const handler = createWebhookHandler(adapter);
    // Mutate the signature so HMAC verify fails — flip the last hex nibble.
    // `timingSafeEqual` requires equal buffer length, so we swap one char
    // rather than truncating.
    const last = signed.signature.at(-1) ?? '0';
    const swapped = last === '0' ? '1' : '0';
    const brokenSig = signed.signature.slice(0, -1) + swapped;
    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': brokenSig,
      },
      body: signed.rawBody,
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe('webhook_rejected');
    expect(body.message).toContain('signature verify failed');
  });

  it('webhook rejects missing signature header with 400', async () => {
    const handler = createWebhookHandler(adapter);
    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('missing_signature');
  });

  it('checkout route handler rejects invalid amount with 400', async () => {
    const handler = createCheckoutHandler(adapter);
    const request = new Request('http://localhost/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_bad',
        planId: 'free',
        amountCents: -100,
      }),
    });
    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('invalid_amount');
  });

  it('axis 3: full journey — checkout → webhook → subscription active → invoice generated', async () => {
    const runtime = adapter.runtime();
    // Step 1: checkout session created.
    const checkoutHandler = createCheckoutHandler(adapter);
    const checkoutReq = new Request('http://localhost/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_journey',
        planId: 'basic',
        amountCents: 1500,
      }),
    });
    const checkoutRes = await checkoutHandler(checkoutReq);
    expect(checkoutRes.status).toBe(200);
    const checkoutBody = (await checkoutRes.json()) as {
      sessionId: string;
      paymentIntentId: string;
    };

    // Step 2: webhook simulates Stripe delivering subscription.created.
    const signedSub = runtime.adapter.signWebhook({
      type: providerEventName('stripe', 'subscription.created'),
      amountCents: 1500,
      customerId: 'cus_journey',
    });
    const webhookHandler = createWebhookHandler(adapter);
    const webhookReq = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signedSub.signature,
      },
      body: signedSub.rawBody,
    });
    const webhookRes = await webhookHandler(webhookReq);
    expect(webhookRes.status).toBe(200);

    // Step 3: subscription becomes active via subscription action handler.
    const subActionHandler = createSubscriptionActionHandler(adapter);
    const subReq = new Request('http://localhost/subscription/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        customerId: 'cus_journey',
        planId: 'basic',
        amountCents: 1500,
      }),
    });
    const subRes = await subActionHandler(subReq);
    expect(subRes.status).toBe(200);
    const subBody = (await subRes.json()) as {
      subscription: { id: string; state: string; planId: string };
    };
    expect(subBody.subscription.state).toBe('active');

    // Step 4: subscription list surfaces the persisted record.
    const subListHandler = createSubscriptionListHandler(adapter);
    const subListRes = await subListHandler(new Request('http://localhost/subscription'));
    expect(subListRes.status).toBe(200);
    const subListBody = (await subListRes.json()) as {
      subscriptions: Array<{ id: string; state: string }>;
    };
    expect(subListBody.subscriptions).toHaveLength(1);

    // Step 5: invoice generated + paid.
    const invActionHandler = createInvoiceActionHandler(adapter);
    const draftRes = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          customerId: 'cus_journey',
          amountCents: 1500,
        }),
      }),
    );
    expect(draftRes.status).toBe(200);
    const draftBody = (await draftRes.json()) as { invoice: { id: string; state: string } };
    expect(draftBody.invoice.state).toBe('draft');

    const openRes = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          invoiceId: draftBody.invoice.id,
        }),
      }),
    );
    expect(openRes.status).toBe(200);

    const payRes = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          invoiceId: draftBody.invoice.id,
        }),
      }),
    );
    expect(payRes.status).toBe(200);
    const payBody = (await payRes.json()) as { invoice: { state: string } };
    expect(payBody.invoice.state).toBe('paid');

    // Step 6: invoice list surfaces the persisted paid invoice.
    const invListHandler = createInvoiceListHandler(adapter);
    const invListRes = await invListHandler(new Request('http://localhost/invoice'));
    const invListBody = (await invListRes.json()) as { invoices: Array<{ state: string }> };
    expect(invListBody.invoices).toHaveLength(1);
    expect(invListBody.invoices[0]?.state).toBe('paid');

    // Sanity — the whole journey emitted the expected event sequence.
    const events = adapter.eventsEmitted();
    const eventTypes = events.map((e: PaymentWebhookEvent) => e.type);
    expect(eventTypes).toContain(providerEventName('stripe', 'subscription.created'));
    expect(eventTypes).toContain(providerEventName('stripe', 'invoice.drafted'));
    expect(eventTypes).toContain(providerEventName('stripe', 'invoice.opened'));
    expect(eventTypes).toContain(providerEventName('stripe', 'invoice.paid'));
    // Sequence check — subscription.created fires before invoice.drafted per
    // real Stripe ordering.
    expect(eventTypes.indexOf(providerEventName('stripe', 'subscription.created'))).toBeLessThan(
      eventTypes.indexOf(providerEventName('stripe', 'invoice.drafted')),
    );
  });

  it('subscription action rejects illegal transition (pause after cancel) with 409', async () => {
    const subActionHandler = createSubscriptionActionHandler(adapter);
    // Create → cancel → try to pause (illegal).
    const createRes = await subActionHandler(
      new Request('http://localhost/subscription/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          customerId: 'cus_illegal',
          planId: 'p',
          amountCents: 100,
        }),
      }),
    );
    const createBody = (await createRes.json()) as { subscription: { id: string } };
    await subActionHandler(
      new Request('http://localhost/subscription/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          subscriptionId: createBody.subscription.id,
        }),
      }),
    );
    const pauseRes = await subActionHandler(
      new Request('http://localhost/subscription/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'pause',
          subscriptionId: createBody.subscription.id,
        }),
      }),
    );
    expect(pauseRes.status).toBe(409);
    const pauseBody = (await pauseRes.json()) as { error: string; message: string };
    expect(pauseBody.error).toBe('illegal_transition');
    expect(pauseBody.message).toContain('is canceled');
  });

  it('invoice creditNote after paid rounds a paid invoice → refunded credit note event', async () => {
    const invActionHandler = createInvoiceActionHandler(adapter);
    const drafted = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          customerId: 'cus_credit',
          amountCents: 2000,
        }),
      }),
    );
    const draftedBody = (await drafted.json()) as { invoice: { id: string } };
    await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          invoiceId: draftedBody.invoice.id,
        }),
      }),
    );
    await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          invoiceId: draftedBody.invoice.id,
        }),
      }),
    );
    const creditRes = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'creditNote',
          invoiceId: draftedBody.invoice.id,
          creditAmountCents: 500,
        }),
      }),
    );
    expect(creditRes.status).toBe(200);
    // The credit_noted event was emitted with negative amount.
    const events = adapter.eventsEmitted();
    const credit = events.find(
      (e) => e.type === providerEventName('stripe', 'invoice.credit_noted'),
    );
    expect(credit).toBeDefined();
    expect(credit?.amountCents).toBe(-500);
  });

  it('invoice creditNote exceeding invoice amount rejects with 409', async () => {
    const invActionHandler = createInvoiceActionHandler(adapter);
    const drafted = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          customerId: 'cus_over',
          amountCents: 1000,
        }),
      }),
    );
    const draftedBody = (await drafted.json()) as { invoice: { id: string } };
    await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          invoiceId: draftedBody.invoice.id,
        }),
      }),
    );
    await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          invoiceId: draftedBody.invoice.id,
        }),
      }),
    );
    const overRes = await invActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'creditNote',
          invoiceId: draftedBody.invoice.id,
          creditAmountCents: 5000,
        }),
      }),
    );
    expect(overRes.status).toBe(409);
    const body = (await overRes.json()) as { message: string };
    expect(body.message).toContain('exceeds invoice');
  });
});

describe('mock adapter — trace fidelity', () => {
  it('trace records every op with stable errorKind vocabulary', async () => {
    const adapter = makeMockAdapter();
    await adapter.checkout({ customerId: 'cus_trace', planId: 'p', amountCents: 100 });
    await adapter.draftInvoice({ customerId: 'cus_trace', amountCents: 100 });
    // Trigger an illegal transition to record an errorKind.
    await expect(
      adapter.creditNote({ invoiceId: 'inv_does_not_exist', creditAmountCents: 10 }),
    ).rejects.toThrow();
    const trace = adapter.traces();
    const opNames = trace.map((t) => t.op);
    expect(opNames).toContain('checkout');
    expect(opNames).toContain('draftInvoice');
    expect(opNames).toContain('creditNoteInvoice');
    const failed = trace.find((t) => t.op === 'creditNoteInvoice' && !t.ok);
    expect(failed).toBeDefined();
    expect(failed?.errorKind).toBe('entity_not_found');
    await adapter.reset();
  });

  it('reset clears both store + trace', async () => {
    const adapter = makeMockAdapter();
    await adapter.checkout({ customerId: 'cus_r', planId: 'p', amountCents: 100 });
    expect(adapter.traces().length).toBeGreaterThan(0);
    await adapter.reset();
    // reset itself records a trace entry.
    expect(adapter.traces()).toEqual([{ op: 'reset', ok: true }]);
    expect(adapter.listSubscriptions()).toHaveLength(0);
    expect(adapter.listInvoices()).toHaveLength(0);
    expect(adapter.eventsEmitted()).toHaveLength(0);
  });
});

describe('real adapter — env-gate', () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it('detectRealEnvMissing returns reason when KIWA_MODE=mock', () => {
    process.env['KIWA_MODE'] = 'mock';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
  });

  it('detectRealEnvMissing returns reason when KIWA_MODE unset', () => {
    delete process.env['KIWA_MODE'];
    expect(detectRealEnvMissing()).toBe('KIWA_MODE not real');
  });

  it('detectRealEnvMissing returns reason when STRIPE_KEY unset', () => {
    process.env['KIWA_MODE'] = 'real';
    delete process.env['STRIPE_KEY'];
    expect(detectRealEnvMissing()).toBe('STRIPE_KEY unset');
  });

  it('detectRealEnvMissing returns reason when STRIPE_WEBHOOK_SECRET unset', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['STRIPE_KEY'] = 'sk_test_abc';
    delete process.env['STRIPE_WEBHOOK_SECRET'];
    expect(detectRealEnvMissing()).toBe('STRIPE_WEBHOOK_SECRET unset');
  });

  it('detectRealEnvMissing returns null when full env is set', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['STRIPE_KEY'] = 'sk_test_abc';
    process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_abc';
    process.env['KIWA_STRIPE_REAL_READY'] = '1';
    expect(detectRealEnvMissing()).toBeNull();
  });

  it('real adapter methods throw KIWA_STRIPE_ENV_MISSING when env is not set', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await expect(
      real.checkout({ customerId: 'cus_r', planId: 'p', amountCents: 100 }),
    ).rejects.toThrow(/KIWA_MODE not real|KIWA_STRIPE_ENV_MISSING/);
    const trace = real.traces();
    const failed = trace.find((t) => t.op === 'checkout' && !t.ok);
    expect(failed).toBeDefined();
    expect(failed?.errorKind).toBeDefined();
  });

  it('real adapter reset works even without env', async () => {
    const real = makeRealAdapter();
    await real.reset();
    const trace = real.traces();
    expect(trace).toEqual([{ op: 'reset', ok: true }]);
  });
});
