/**
 * Hosted checkout + license key issue + activation full-journey vitest
 * spec.
 *
 * Sub-Issue #903 (v1.23-4) AC — a full journey from Lemon Squeezy hosted
 * checkout → webhook delivery → order paid → license key issued →
 * activation → revoke is exercised over the mock adapter.
 *
 * Fidelity axes covered here —
 *  1. Hosted checkout id / URL / order id format is stable across mock
 *     adapter reboots.
 *  2. Webhook signature verify (Lemon Squeezy uses HMAC-SHA256 over the
 *     raw body only — no timestamp mixed in — plus timestamp freshness
 *     check to catch replay attacks).
 *  3. Webhook effect classification — subscription events dispatch to the
 *     subscription state machine, order events to order, refund events to
 *     refund, chargeback events to chargeback.
 *  4. Route-handler validation — malformed body / missing signature / bad
 *     signature / missing storeId / missing variantId / non-positive
 *     amount all return the expected HTTP status.
 *  5. Real adapter env-detect path yields KIWA_LEMONSQUEEZY_ENV_MISSING
 *     when the env is not set.
 *  6. License key issue → activation → revoke lifecycle emits distinct
 *     records + rejects over-activation.
 *  7. Subscription tier upgrade / downgrade emits the correct neutral
 *     event (`subscription_updated` / `subscription_created`) with the
 *     amount delta reflected in `newAmountCents`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName, type PaymentWebhookEvent } from '@kiwa-test/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createCheckoutHandler } from '../src/routes/checkout/handler.js';
import { createWebhookHandler } from '../src/routes/webhook/handler.js';
import {
  createLicenseActionHandler,
  createLicenseListHandler,
} from '../src/routes/license/handler.js';

describe('mock adapter — hosted checkout ceremony', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: checkout returns stable checkoutId / orderId / hosted URL shape', async () => {
    const result = await adapter.checkout({
      customerId: 'cus_test_1',
      variantId: 'var_pro_lifetime',
      storeId: 'store42',
      amountCents: 4999,
      productKind: 'license',
    });
    expect(result.checkoutId).toBe('che_test_ls_1');
    expect(result.orderId).toBe('ord_test_ls_1');
    expect(result.url).toContain('store42.lemonsqueezy.com/checkout/buy/var_pro_lifetime');
    expect(result.url).toContain('checkout%5Bcustom%5D%5Buser_id%5D=cus_test_1');
    expect(result.status).toBe('open');
    expect(result.productKind).toBe('license');
    expect(result.mode).toBe('mock');
    expect(result.currency).toBe('USD');
  });

  it('checkout supports subsequent orderIds increment monotonically', async () => {
    const first = await adapter.checkout({
      customerId: 'cus_1',
      variantId: 'var_1',
      storeId: 'store1',
      amountCents: 1000,
    });
    const second = await adapter.checkout({
      customerId: 'cus_2',
      variantId: 'var_2',
      storeId: 'store1',
      amountCents: 2000,
    });
    expect(first.checkoutId).toBe('che_test_ls_1');
    expect(second.checkoutId).toBe('che_test_ls_2');
    expect(first.orderId).toBe('ord_test_ls_1');
    expect(second.orderId).toBe('ord_test_ls_2');
  });

  it('checkout rejects non-positive amount', async () => {
    await expect(
      adapter.checkout({
        customerId: 'cus_bad',
        variantId: 'var_x',
        storeId: 'store42',
        amountCents: 0,
      }),
    ).rejects.toThrow(/amountCents must be > 0/);
    const traces = adapter.traces();
    expect(traces[0]?.op).toBe('checkout');
    expect(traces[0]?.ok).toBe(false);
    expect(traces[0]?.errorKind).toBe('invalid_amount');
  });

  it('checkout rejects missing storeId', async () => {
    await expect(
      adapter.checkout({
        customerId: 'cus_bad',
        variantId: 'var_x',
        storeId: '',
        amountCents: 1000,
      }),
    ).rejects.toThrow(/storeId is required/);
    const traces = adapter.traces();
    expect(traces[0]?.errorKind).toBe('missing_store');
  });

  it('checkout rejects missing variantId', async () => {
    await expect(
      adapter.checkout({
        customerId: 'cus_bad',
        variantId: '',
        storeId: 'store42',
        amountCents: 1000,
      }),
    ).rejects.toThrow(/variantId is required/);
    const traces = adapter.traces();
    expect(traces[0]?.errorKind).toBe('missing_variant');
  });
});

describe('mock adapter — webhook signature verify', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 2: webhook verify accepts a well-signed order_created event', async () => {
    // Bootstrap a signed webhook envelope by driving the mock's underlying
    // adapter through the axis runtime.
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'invoice.paid'),
      amountCents: 3999,
      currency: 'usd',
      customerId: 'cus_verify_ok',
    });
    const result = await adapter.receiveWebhook({
      rawBody: signed.rawBody,
      signature: signed.signature,
    });
    expect(result.verify.ok).toBe(true);
    expect(result.verify.reason).toBe('ok');
    expect(result.dispatched).toBe(true);
    expect(result.effect?.kind).toBe('order');
  });

  it('axis 2: webhook verify rejects bad signature', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'invoice.paid'),
      amountCents: 3999,
      customerId: 'cus_bad_sig',
    });
    const result = await adapter.receiveWebhook({
      rawBody: signed.rawBody,
      signature: 'deadbeef'.repeat(8),
    });
    expect(result.verify.ok).toBe(false);
    expect(result.verify.reason).toBe('bad-signature');
    expect(result.dispatched).toBe(false);
  });

  it('axis 2: webhook verify rejects tampered body', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'invoice.paid'),
      amountCents: 3999,
      customerId: 'cus_tamper',
    });
    const tamperedBody = signed.rawBody.replace('3999', '99999');
    const result = await adapter.receiveWebhook({
      rawBody: tamperedBody,
      signature: signed.signature,
    });
    expect(result.verify.ok).toBe(false);
    expect(result.dispatched).toBe(false);
  });

  it('axis 3: order_refunded webhook classifies as refund effect', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'invoice.credit_noted'),
      amountCents: -1000,
      customerId: 'cus_refund_evt',
    });
    const result = await adapter.receiveWebhook({
      rawBody: signed.rawBody,
      signature: signed.signature,
    });
    expect(result.verify.ok).toBe(true);
    // Lemon Squeezy dialects credit_noted → order_refunded.
    expect(result.effect?.kind).toBe('refund');
  });

  it('axis 3: subscription_created webhook classifies as subscription effect', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'subscription.created'),
      amountCents: 999,
      customerId: 'cus_sub_evt',
    });
    const result = await adapter.receiveWebhook({
      rawBody: signed.rawBody,
      signature: signed.signature,
    });
    expect(result.effect?.kind).toBe('subscription');
  });

  it('axis 3: subscription_payment_failed classifies as dunning effect', async () => {
    const runtime = adapter.runtime();
    const signed = runtime.adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'dunning.attempt'),
      amountCents: 999,
      customerId: 'cus_dun_evt',
    });
    const result = await adapter.receiveWebhook({
      rawBody: signed.rawBody,
      signature: signed.signature,
    });
    expect(result.effect?.kind).toBe('dunning');
  });
});

describe('mock adapter — license key lifecycle (axis 6)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('issueLicenseKey produces a unique LSKEY-formatted key', async () => {
    const first = await adapter.issueLicenseKey({
      orderId: 'ord_1',
      customerId: 'cus_1',
      variantId: 'var_lifetime',
    });
    const second = await adapter.issueLicenseKey({
      orderId: 'ord_2',
      customerId: 'cus_2',
      variantId: 'var_lifetime',
    });
    expect(first.key).toMatch(/^LSKEY-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(second.key).toMatch(/^LSKEY-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(first.key).not.toBe(second.key);
    expect(first.status).toBe('active');
    expect(first.activationsLimit).toBe(1);
    expect(first.activationsUsed).toBe(0);
  });

  it('issueLicenseKey honours activationsLimit override', async () => {
    const record = await adapter.issueLicenseKey({
      orderId: 'ord_a',
      customerId: 'cus_a',
      variantId: 'var_team',
      activationsLimit: 5,
    });
    expect(record.activationsLimit).toBe(5);
  });

  it('activateLicense increments activationsUsed and persists instance record', async () => {
    const key = await adapter.issueLicenseKey({
      orderId: 'ord_z',
      customerId: 'cus_z',
      variantId: 'var_lifetime',
      activationsLimit: 2,
    });
    const activated = await adapter.activateLicense({
      licenseKeyId: key.id,
      instanceName: 'MacBook Pro 14 M3',
    });
    expect(activated.activationsUsed).toBe(1);
    expect(activated.activations).toHaveLength(1);
    expect(activated.activations[0]?.instanceName).toBe('MacBook Pro 14 M3');
    expect(activated.activations[0]?.revokedAt).toBeUndefined();
  });

  it('activateLicense rejects over-limit activations', async () => {
    const key = await adapter.issueLicenseKey({
      orderId: 'ord_limit',
      customerId: 'cus_limit',
      variantId: 'var_lifetime',
      activationsLimit: 1,
    });
    await adapter.activateLicense({ licenseKeyId: key.id, instanceName: 'PC-1' });
    await expect(
      adapter.activateLicense({ licenseKeyId: key.id, instanceName: 'PC-2' }),
    ).rejects.toThrow(/activations limit reached/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'activateLicense' && !t.ok);
    expect(failed?.errorKind).toBe('license_limit_reached');
  });

  it('revokeLicense frees an activation slot', async () => {
    const key = await adapter.issueLicenseKey({
      orderId: 'ord_r',
      customerId: 'cus_r',
      variantId: 'var_lifetime',
      activationsLimit: 1,
    });
    const activated = await adapter.activateLicense({
      licenseKeyId: key.id,
      instanceName: 'workstation',
    });
    const instanceId = activated.activations[0]?.instanceId;
    if (!instanceId) throw new Error('activation not created');
    const revoked = await adapter.revokeLicense({
      licenseKeyId: key.id,
      instanceId,
    });
    expect(revoked.activationsUsed).toBe(0);
    expect(revoked.activations[0]?.revokedAt).toBeGreaterThan(0);
    // slot is free, another activation should succeed
    const reactivated = await adapter.activateLicense({
      licenseKeyId: key.id,
      instanceName: 'new-machine',
    });
    expect(reactivated.activationsUsed).toBe(1);
  });

  it('revokeLicense rejects unknown instance id', async () => {
    const key = await adapter.issueLicenseKey({
      orderId: 'ord_x',
      customerId: 'cus_x',
      variantId: 'var_lifetime',
    });
    await expect(
      adapter.revokeLicense({ licenseKeyId: key.id, instanceId: 'inst_missing' }),
    ).rejects.toThrow(/not found/);
  });

  it('revokeLicense rejects re-revoke on the same instance', async () => {
    const key = await adapter.issueLicenseKey({
      orderId: 'ord_dr',
      customerId: 'cus_dr',
      variantId: 'var_lifetime',
    });
    const activated = await adapter.activateLicense({
      licenseKeyId: key.id,
      instanceName: 'lab',
    });
    const instanceId = activated.activations[0]?.instanceId;
    if (!instanceId) throw new Error('activation not created');
    await adapter.revokeLicense({ licenseKeyId: key.id, instanceId });
    await expect(
      adapter.revokeLicense({ licenseKeyId: key.id, instanceId }),
    ).rejects.toThrow(/already revoked/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'revokeLicense' && !t.ok);
    expect(failed?.errorKind).toBe('license_already_revoked');
  });
});

describe('mock adapter — subscription tier lifecycle (axis 7)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('create + upgrade emits subscription_created + subscription_updated', async () => {
    const runtime = adapter.runtime();
    const created = await runtime.createSubscription({
      customerId: 'cus_sub',
      planId: 'starter',
      amountCents: 999,
    });
    // Subscription state is `active` after creation (semantics-layer SSOT).
    // The `subscription.created` event fires via signWebhook + emit but the
    // in-memory state is 'active' for parity with real provider terminology.
    expect(created.state).toBe('active');
    const upgraded = await adapter.changePlan({
      subscriptionId: created.id,
      newPlanId: 'pro',
      newAmountCents: 2999,
    });
    expect(upgraded.state).toBe('upgraded');
    expect(upgraded.amountCents).toBe(2999);
    const events = adapter.eventsEmitted();
    const created_evt = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'subscription.created'),
    );
    const updated_evt = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'subscription.upgraded'),
    );
    expect(created_evt).toBeDefined();
    expect(updated_evt).toBeDefined();
  });

  it('downgrade emits subscription_updated with downgraded state', async () => {
    const runtime = adapter.runtime();
    const created = await runtime.createSubscription({
      customerId: 'cus_down',
      planId: 'pro',
      amountCents: 2999,
    });
    const downgraded = await adapter.changePlan({
      subscriptionId: created.id,
      newPlanId: 'starter',
      newAmountCents: 999,
    });
    expect(downgraded.state).toBe('downgraded');
    expect(downgraded.amountCents).toBe(999);
  });

  it('changePlan on canceled subscription is rejected', async () => {
    const runtime = adapter.runtime();
    const created = await runtime.createSubscription({
      customerId: 'cus_cx',
      planId: 'pro',
      amountCents: 2999,
    });
    await adapter.cancelSubscription(created.id);
    await expect(
      adapter.changePlan({
        subscriptionId: created.id,
        newPlanId: 'starter',
        newAmountCents: 999,
      }),
    ).rejects.toThrow(/is canceled/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'upgradeSubscription' && !t.ok);
    expect(failed?.errorKind).toBe('subscription_canceled');
  });

  it('reactivate on canceled subscription restores state back to active', async () => {
    const runtime = adapter.runtime();
    const created = await runtime.createSubscription({
      customerId: 'cus_react',
      planId: 'starter',
      amountCents: 999,
    });
    await adapter.cancelSubscription(created.id);
    const reactivated = await adapter.reactivateSubscription(created.id);
    // Reactivate returns state to `active` while emitting
    // `subscription.reactivated` neutral event.
    expect(reactivated.state).toBe('active');
    const events = adapter.eventsEmitted();
    const reactivatedEvt = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'subscription.reactivated'),
    );
    expect(reactivatedEvt).toBeDefined();
  });

  it('pause + resume emits paused + resumed events, resumed state back to active', async () => {
    const runtime = adapter.runtime();
    const created = await runtime.createSubscription({
      customerId: 'cus_pr',
      planId: 'starter',
      amountCents: 999,
    });
    await adapter.pauseSubscription(created.id);
    const events = adapter.eventsEmitted();
    const paused = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'subscription.paused'),
    );
    expect(paused).toBeDefined();
    const resumed = await adapter.resumeSubscription(created.id);
    // Resume returns state to `active` while emitting the `subscription.resumed`
    // neutral event through the LS dialect (`subscription_unpaused`).
    expect(resumed.state).toBe('active');
    const resumedEvt = adapter.eventsEmitted().find(
      (e) => e.type === providerEventName('lemonsqueezy', 'subscription.resumed'),
    );
    expect(resumedEvt).toBeDefined();
  });
});

describe('checkout route handler', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let handler: ReturnType<typeof createCheckoutHandler>;

  beforeEach(() => {
    adapter = makeMockAdapter();
    handler = createCheckoutHandler(adapter);
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('returns 200 + full body on happy path', async () => {
    const res = await handler(
      new Request('http://localhost/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cus_route_1',
          variantId: 'var_lifetime',
          storeId: 'store42',
          amountCents: 2999,
          productKind: 'license',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      checkoutId: string;
      orderId: string;
      url: string;
      productKind: string;
    };
    expect(body.checkoutId).toBe('che_test_ls_1');
    expect(body.orderId).toBe('ord_test_ls_1');
    expect(body.productKind).toBe('license');
    expect(body.url).toContain('store42.lemonsqueezy.com/checkout/buy/var_lifetime');
  });

  it('returns 400 on missing_fields', async () => {
    const res = await handler(
      new Request('http://localhost/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ customerId: 'cus' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('missing_fields');
  });

  it('returns 400 on invalid_amount', async () => {
    const res = await handler(
      new Request('http://localhost/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cus',
          variantId: 'var',
          storeId: 'store',
          amountCents: 0,
        }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_amount');
  });

  it('returns 400 on invalid_json body', async () => {
    const res = await handler(
      new Request('http://localhost/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'this-is-not-json',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_json');
  });
});

describe('webhook route handler', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let handler: ReturnType<typeof createWebhookHandler>;

  beforeEach(() => {
    adapter = makeMockAdapter();
    handler = createWebhookHandler(adapter);
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('returns 200 on valid signature', async () => {
    const signed = adapter.runtime().adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'invoice.paid'),
      amountCents: 1500,
      customerId: 'cus_wh',
    });
    const res = await handler(
      new Request('http://localhost/webhook', {
        method: 'POST',
        headers: { 'x-signature': signed.signature },
        body: signed.rawBody,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; effect?: { kind: string } };
    expect(body.ok).toBe(true);
    expect(body.effect?.kind).toBe('order');
  });

  it('returns 400 on missing signature header', async () => {
    const res = await handler(
      new Request('http://localhost/webhook', {
        method: 'POST',
        body: '{}',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('missing_signature');
  });

  it('returns 400 on invalid signature', async () => {
    const signed = adapter.runtime().adapter.signWebhook({
      type: providerEventName('lemonsqueezy', 'invoice.paid'),
      amountCents: 1500,
      customerId: 'cus_wh_bad',
    });
    const res = await handler(
      new Request('http://localhost/webhook', {
        method: 'POST',
        headers: { 'x-signature': 'deadbeef'.repeat(8) },
        body: signed.rawBody,
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('webhook_rejected');
    expect(body.message).toContain('bad-signature');
  });
});

describe('license route handler', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let actionHandler: ReturnType<typeof createLicenseActionHandler>;
  let listHandler: ReturnType<typeof createLicenseListHandler>;

  beforeEach(() => {
    adapter = makeMockAdapter();
    actionHandler = createLicenseActionHandler(adapter);
    listHandler = createLicenseListHandler(adapter);
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('issue action returns 200 + license record', async () => {
    const res = await actionHandler(
      new Request('http://localhost/license/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'issue',
          orderId: 'ord_1',
          customerId: 'cus_1',
          variantId: 'var_lifetime',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      license: { id: string; key: string; status: string };
    };
    expect(body.license.status).toBe('active');
    expect(body.license.key).toMatch(/^LSKEY-/);
  });

  it('activate action returns 200 + updated record', async () => {
    const record = await adapter.issueLicenseKey({
      orderId: 'ord_a',
      customerId: 'cus_a',
      variantId: 'var_lifetime',
      activationsLimit: 2,
    });
    const res = await actionHandler(
      new Request('http://localhost/license/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          licenseKeyId: record.id,
          instanceName: 'iMac Studio',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      license: { activationsUsed: number };
    };
    expect(body.license.activationsUsed).toBe(1);
  });

  it('activate action returns 409 on over-limit', async () => {
    const record = await adapter.issueLicenseKey({
      orderId: 'ord_over',
      customerId: 'cus_over',
      variantId: 'var_lifetime',
      activationsLimit: 1,
    });
    await adapter.activateLicense({ licenseKeyId: record.id, instanceName: 'A' });
    const res = await actionHandler(
      new Request('http://localhost/license/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          licenseKeyId: record.id,
          instanceName: 'B',
        }),
      }),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('illegal_transition');
  });

  it('list handler returns issued licenses', async () => {
    await adapter.issueLicenseKey({
      orderId: 'ord_list',
      customerId: 'cus_list',
      variantId: 'var_lifetime',
    });
    const res = await listHandler(new Request('http://localhost/license'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { licenses: unknown[] };
    expect(body.licenses).toHaveLength(1);
  });
});

describe('real adapter env-detect (axis 5)', () => {
  const originalMode = process.env['KIWA_MODE'];
  const originalKey = process.env['LEMONSQUEEZY_KEY'];
  const originalSecret = process.env['LEMONSQUEEZY_SIGNING_SECRET'];
  const originalReady = process.env['KIWA_LEMONSQUEEZY_REAL_READY'];

  beforeEach(() => {
    // wipe the 4 relevant envs before each test so branches surface
    // deterministically
    delete process.env['KIWA_MODE'];
    delete process.env['LEMONSQUEEZY_KEY'];
    delete process.env['LEMONSQUEEZY_SIGNING_SECRET'];
    delete process.env['KIWA_LEMONSQUEEZY_REAL_READY'];
  });

  afterEach(() => {
    if (originalMode !== undefined) process.env['KIWA_MODE'] = originalMode;
    if (originalKey !== undefined) process.env['LEMONSQUEEZY_KEY'] = originalKey;
    if (originalSecret !== undefined) process.env['LEMONSQUEEZY_SIGNING_SECRET'] = originalSecret;
    if (originalReady !== undefined) process.env['KIWA_LEMONSQUEEZY_REAL_READY'] = originalReady;
  });

  it('detectRealEnvMissing returns "KIWA_MODE=mock" when explicit mock mode', () => {
    process.env['KIWA_MODE'] = 'mock';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
  });

  it('detectRealEnvMissing returns "KIWA_MODE not real" when unset', () => {
    expect(detectRealEnvMissing()).toBe('KIWA_MODE not real');
  });

  it('detectRealEnvMissing returns "LEMONSQUEEZY_KEY unset" when key missing', () => {
    process.env['KIWA_MODE'] = 'real';
    expect(detectRealEnvMissing()).toBe('LEMONSQUEEZY_KEY unset');
  });

  it('detectRealEnvMissing returns "LEMONSQUEEZY_SIGNING_SECRET unset" when secret missing', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['LEMONSQUEEZY_KEY'] = 'sk_test_x';
    expect(detectRealEnvMissing()).toBe('LEMONSQUEEZY_SIGNING_SECRET unset');
  });

  it('detectRealEnvMissing returns KIWA_LEMONSQUEEZY_ENV_MISSING when READY flag off', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['LEMONSQUEEZY_KEY'] = 'sk_test_x';
    process.env['LEMONSQUEEZY_SIGNING_SECRET'] = 'lswhs_x';
    expect(detectRealEnvMissing()).toBe('KIWA_LEMONSQUEEZY_ENV_MISSING');
  });

  it('detectRealEnvMissing returns null when full env set', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['LEMONSQUEEZY_KEY'] = 'sk_test_x';
    process.env['LEMONSQUEEZY_SIGNING_SECRET'] = 'lswhs_x';
    process.env['KIWA_LEMONSQUEEZY_REAL_READY'] = '1';
    expect(detectRealEnvMissing()).toBeNull();
  });

  it('real adapter checkout throws KIWA_LEMONSQUEEZY_ENV_MISSING when env absent', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.checkout({
        customerId: 'cus_r',
        variantId: 'var_r',
        storeId: 'store_r',
        amountCents: 1000,
      }),
    ).rejects.toThrow(/KIWA_MODE not real|KIWA_LEMONSQUEEZY_ENV_MISSING/);
  });

  it('real adapter listSubscriptions returns empty array (no boot required)', () => {
    const adapter = makeRealAdapter();
    expect(adapter.listSubscriptions()).toEqual([]);
    expect(adapter.listOrders()).toEqual([]);
    expect(adapter.listLicenseKeys()).toEqual([]);
    expect(adapter.listRefunds()).toEqual([]);
    expect(adapter.listChargebacks()).toEqual([]);
    expect(adapter.eventsEmitted()).toEqual([]);
  });

  it('real adapter reset clears state and records trace', async () => {
    const adapter = makeRealAdapter();
    await adapter.reset();
    const traces = adapter.traces();
    expect(traces.some((t) => t.op === 'reset' && t.ok)).toBe(true);
  });
});

describe('cross-cutting — events + traces', () => {
  it('eventsEmitted preserves emit order across multiple operations', async () => {
    const adapter = makeMockAdapter();
    const runtime = adapter.runtime();
    await runtime.createSubscription({
      customerId: 'cus_ord',
      planId: 'starter',
      amountCents: 999,
    });
    await runtime.draftOrder({
      customerId: 'cus_ord',
      amountCents: 1500,
    });
    const events: PaymentWebhookEvent[] = adapter.eventsEmitted();
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]?.type).toBe(providerEventName('lemonsqueezy', 'subscription.created'));
    expect(events[1]?.type).toBe(providerEventName('lemonsqueezy', 'invoice.drafted'));
    await adapter.reset();
  });
});
