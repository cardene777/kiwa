/**
 * Webhook receiver + hosted checkout flow. Exercises signature verify,
 * order_created / license_activated / refund_issued dispatch, webhook
 * idempotency (redelivery dedupe), and the checkout URL redirect shape.
 */

import { describe, expect, it } from 'vitest';
import {
  inspectRealAdapterEnv,
  makeCheckoutRoute,
  makeMockAdapter,
  makeRealAdapter,
  makeWebhookRoute,
} from '../src/index.js';

describe('checkout — hosted URL shape', () => {
  it('checkout returns a Lemon Squeezy hosted URL with the variant id', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeCheckoutRoute(adapter);
    const result = await route({
      customerId: 'cust_co_1',
      variantId: 'variant_pro',
      storeId: 'kiwa-license-store',
      amountCents: 9900,
    });
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.body.url).toMatch(
        /^https:\/\/kiwa-license-store\.lemonsqueezy\.com\/checkout\/buy\/variant_pro\?/,
      );
      expect(result.body.mode).toBe('mock');
    }
  });

  it('checkout embeds affiliate referral code as aff query param', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeCheckoutRoute(adapter);
    const result = await route({
      customerId: 'cust_co_2',
      variantId: 'variant_pro',
      storeId: 'kiwa-license-store',
      amountCents: 9900,
      referralCode: 'AFF-XYZ',
    });
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.body.url).toContain('aff=AFF-XYZ');
      expect(result.body.referralCode).toBe('AFF-XYZ');
    }
  });

  it('checkout returns 400 for non-positive amount', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeCheckoutRoute(adapter);
    const result = await route({
      customerId: 'cust_co_3',
      variantId: 'variant_pro',
      storeId: 'kiwa-license-store',
      amountCents: 0,
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(400);
      expect(result.body.error).toBe('amount_must_be_positive');
    }
  });

  it('checkout returns 400 when customer or variant is empty', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeCheckoutRoute(adapter);
    const result = await route({
      customerId: '',
      variantId: 'variant',
      storeId: 'store',
      amountCents: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.body.error).toBe('customer_and_variant_required');
  });
});

describe('webhook — signature verify + dispatch', () => {
  it('rejects a webhook with a tampered signature', async () => {
    const { adapter } = makeMockAdapter();
    const { rawBody } = adapter.signWebhookForTest({
      provider: 'lemonsqueezy',
      id: 'evt_1',
      type: 'order_created',
      amountCents: 9900,
      currency: 'USD',
      customerId: 'cust_wh_1',
      timestamp: Date.now(),
      raw: '',
    });
    const route = makeWebhookRoute(adapter);
    const result = await route({
      rawBody,
      signature: 'deadbeef', // wrong signature
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(400);
      expect(result.body.reason).toBe('bad-signature');
    }
  });

  it('accepts a webhook with a valid signature and dispatches order_created', async () => {
    const { adapter, store } = makeMockAdapter();
    const { rawBody, signature } = adapter.signWebhookForTest({
      provider: 'lemonsqueezy',
      id: 'evt_ok_1',
      type: 'order_created',
      amountCents: 5000,
      currency: 'USD',
      customerId: 'cust_wh_ok_1',
      timestamp: Date.now(),
      raw: '',
    });
    const route = makeWebhookRoute(adapter);
    const result = await route({ rawBody, signature });
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.body.dispatched).toBe(true);
      expect(result.body.effect?.kind).toBe('order');
    }
    expect(store.webhooks.size).toBe(1);
  });

  it('dedupes redelivered webhooks by event id', async () => {
    const { adapter, store } = makeMockAdapter();
    const { rawBody, signature } = adapter.signWebhookForTest({
      provider: 'lemonsqueezy',
      id: 'evt_dup_1',
      type: 'order_created',
      amountCents: 1000,
      currency: 'USD',
      customerId: 'cust_wh_dup_1',
      timestamp: Date.now(),
      raw: '',
    });
    const route = makeWebhookRoute(adapter);
    await route({ rawBody, signature });
    const second = await route({ rawBody, signature });
    expect(store.webhooks.size).toBe(1);
    if (second.ok === true) expect(second.body.effect?.newState).toBe('duplicate');
  });

  it('dispatches license_activated events into effect kind=license', async () => {
    const { adapter } = makeMockAdapter();
    const { rawBody, signature } = adapter.signWebhookForTest({
      provider: 'lemonsqueezy',
      id: 'evt_lic_1',
      type: 'license_activated',
      amountCents: 0,
      currency: 'USD',
      customerId: 'cust_lic_1',
      timestamp: Date.now(),
      raw: '',
    });
    const route = makeWebhookRoute(adapter);
    const result = await route({ rawBody, signature });
    expect(result.ok).toBe(true);
    if (result.ok === true) expect(result.body.effect?.kind).toBe('license');
  });

  it('dispatches refund_issued events into effect kind=refund', async () => {
    const { adapter } = makeMockAdapter();
    const { rawBody, signature } = adapter.signWebhookForTest({
      provider: 'lemonsqueezy',
      id: 'evt_ref_1',
      type: 'refund_issued',
      amountCents: 5000,
      currency: 'USD',
      customerId: 'cust_ref_1',
      timestamp: Date.now(),
      raw: '',
    });
    const route = makeWebhookRoute(adapter);
    const result = await route({ rawBody, signature });
    expect(result.ok).toBe(true);
    if (result.ok === true) expect(result.body.effect?.kind).toBe('refund');
  });
});

describe('real adapter env-gate', () => {
  it('inspectRealAdapterEnv reports default-mock for empty env', () => {
    const snapshot = inspectRealAdapterEnv({});
    expect(snapshot.mode).toBe('mock');
    expect(snapshot.reason).toBe('default-mock');
    expect(snapshot.effective).toBe('mock');
  });

  it('inspectRealAdapterEnv reports missing-key when KIWA_MODE=real without key', () => {
    const snapshot = inspectRealAdapterEnv({ KIWA_MODE: 'real' });
    expect(snapshot.reason).toBe('missing-key');
    expect(snapshot.effective).toBe('mock');
  });

  it('inspectRealAdapterEnv reports kiwa-mode-real with key + ready', () => {
    const snapshot = inspectRealAdapterEnv({
      KIWA_MODE: 'real',
      LEMONSQUEEZY_KEY: 'sk_sandbox',
      KIWA_LEMONSQUEEZY_REAL_READY: '1',
    });
    expect(snapshot.mode).toBe('real');
    expect(snapshot.reason).toBe('kiwa-mode-real');
    expect(snapshot.effective).toBe('real');
  });

  it('inspectRealAdapterEnv reports invalid-mode for unrecognised KIWA_MODE', () => {
    const snapshot = inspectRealAdapterEnv({ KIWA_MODE: 'garbage' });
    expect(snapshot.reason).toBe('invalid-mode');
  });

  it('makeRealAdapter surfaces KIWA_LEMONSQUEEZY_ENV_MISSING for every op when env is empty', async () => {
    const real = makeRealAdapter({ env: {} });
    await expect(real.checkout({
      customerId: 'c',
      variantId: 'v',
      storeId: 's',
      amountCents: 100,
    })).rejects.toThrow('KIWA_LEMONSQUEEZY_ENV_MISSING:checkout');
    await expect(real.issueLicenseKey({
      orderId: 'o',
      customerId: 'c',
      variantId: 'v',
    })).rejects.toThrow('KIWA_LEMONSQUEEZY_ENV_MISSING:issueLicenseKey');
    await expect(real.refund({
      orderId: 'o',
      amountCents: 100,
      now: 0,
    })).rejects.toThrow('KIWA_LEMONSQUEEZY_ENV_MISSING:refund');
  });

  it('makeRealAdapter with real env but no ready flag falls back to env-missing', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        LEMONSQUEEZY_KEY: 'sk_sandbox',
      },
    });
    // ready flag missing → effective 'mock' → env_missing branch fires
    await expect(real.checkout({
      customerId: 'c',
      variantId: 'v',
      storeId: 's',
      amountCents: 100,
    })).rejects.toThrow('KIWA_LEMONSQUEEZY_ENV_MISSING:checkout');
  });

  it('makeRealAdapter with real env + ready flag surfaces REAL_NOT_IMPLEMENTED', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        LEMONSQUEEZY_KEY: 'sk_sandbox',
        KIWA_LEMONSQUEEZY_REAL_READY: '1',
      },
    });
    await expect(real.checkout({
      customerId: 'c',
      variantId: 'v',
      storeId: 's',
      amountCents: 100,
    })).rejects.toThrow('KIWA_LEMONSQUEEZY_REAL_NOT_IMPLEMENTED:checkout');
  });
});
