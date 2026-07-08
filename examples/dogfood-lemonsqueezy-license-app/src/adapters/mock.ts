/**
 * Mock adapter — drives @kiwa/payment's `createLemonSqueezyMock` +
 * the local license / affiliate / refund logic so tests exercise the
 * full path without touching the real Lemon Squeezy sandbox.
 *
 * The mock owns an in-memory store; the routes accept the store via
 * closure so the adapter and routes stay decoupled from any HTTP
 * framework. That mirrors dogfood-lemon-squeezy-app v1.23-4's
 * framework-neutral route factories.
 */

import { createLemonSqueezyMock } from '@kiwa/payment';
import type { PaymentAdapter, PaymentWebhookEvent } from '@kiwa/payment';
import type {
  AffiliateConvertInput,
  AffiliateRegisterInput,
  AdapterMode,
  CheckoutInput,
  CheckoutResult,
  LemonSqueezyLicenseAdapter,
  LicenseActivateInput,
  LicenseDeactivateInput,
  LicenseIssueInput,
  RefundInput,
  RefundResult,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from './interface.js';
import type {
  AffiliateProfile,
  AffiliateReferralRecord,
  AppStore,
  LicenseActivation,
  LicenseKeyRecord,
  OrderRecord,
} from '../lib/store.js';
import { createStore } from '../lib/store.js';
import {
  activateLicense as coreActivate,
  deactivateLicense as coreDeactivate,
  issueLicenseKey as coreIssue,
} from '../lib/license-issue.js';
import {
  DEFAULT_POLICY as REFUND_DEFAULT,
  issueRefund,
  THIRTY_DAY_MS,
} from '../lib/refund-window.js';
import {
  applyConversion,
  reverseConversion,
} from '../lib/affiliate-tier.js';

export interface MakeMockAdapterOptions {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
  /** override the store — otherwise a fresh one is created */
  store?: AppStore;
}

/**
 * Build a mock adapter. Returns the adapter + the underlying store so
 * tests can assert on state without going through the adapter surface.
 */
export function makeMockAdapter(options?: MakeMockAdapterOptions): {
  adapter: LemonSqueezyLicenseAdapter;
  store: AppStore;
  raw: PaymentAdapter;
} {
  const store = options?.store ?? createStore();
  const now = options?.now ?? (() => Date.now());
  const rawAdapter = createLemonSqueezyMock({
    secret: options?.secret ?? 'lswhs_kiwa_lemonsqueezy',
    toleranceMs: options?.toleranceMs ?? 5 * 60 * 1000,
    now,
  });
  const mode: AdapterMode = 'mock';

  /**
   * Local claw-back function extracted from the adapter surface so the
   * refund path can invoke it without relying on `this` binding (safe
   * for callers that destructure the adapter methods).
   */
  const clawBackReferral = async (
    orderId: string,
  ): Promise<AffiliateReferralRecord | undefined> => {
    const referral = findReferralByOrder(store, orderId);
    if (referral === undefined) return undefined;
    if (referral.state !== 'converted') return referral;
    const affiliate = store.affiliates.get(referral.affiliateId);
    if (affiliate === undefined) return referral;
    reverseConversion(affiliate, referral.commissionCents);
    referral.state = 'clawed-back';
    return referral;
  };

  const adapter: LemonSqueezyLicenseAdapter = {
    mode,

    async checkout(input: CheckoutInput): Promise<CheckoutResult> {
      const stamp = input.now ?? now();
      const orderId = `ord_${store.orders.size + 1}_${stamp}`;
      const checkoutId = `co_${store.orders.size + 1}_${stamp}`;
      const currency = input.currency ?? 'USD';
      const productKind = input.productKind ?? 'license';
      const url = buildHostedCheckoutUrl({
        storeId: input.storeId,
        variantId: input.variantId,
        customerId: input.customerId,
        ...(input.successUrl !== undefined ? { successUrl: input.successUrl } : {}),
        ...(input.referralCode !== undefined ? { referralCode: input.referralCode } : {}),
      });
      const order: OrderRecord = {
        id: orderId,
        customerId: input.customerId,
        variantId: input.variantId,
        amountCents: input.amountCents,
        currency,
        paidAt: stamp,
        productKind,
        state: 'paid',
      };
      store.orders.set(orderId, order);
      return {
        checkoutId,
        orderId,
        url,
        amountCents: input.amountCents,
        currency,
        status: 'complete',
        productKind,
        mode,
        referralCode: input.referralCode,
      };
    },

    async receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult> {
      const verify = rawAdapter.verifyWebhook({
        rawBody: input.rawBody,
        signature: input.signature,
        ...(input.toleranceMs !== undefined ? { toleranceMs: input.toleranceMs } : {}),
      });
      if (verify.ok !== true || verify.event === null) {
        return { verify, dispatched: false };
      }
      const event = verify.event;
      const existing = store.webhooks.get(event.id);
      if (existing !== undefined) {
        return {
          verify,
          dispatched: false,
          effect: { kind: dispatchKind(event.type), entityId: event.id, newState: 'duplicate' },
        };
      }
      store.webhooks.set(event.id, {
        eventId: event.id,
        eventName: event.type,
        receivedAt: now(),
        outcome: 'accepted',
      });
      const effect = handleEventEffect(store, event, now);
      return { verify, dispatched: effect !== undefined, ...(effect !== undefined ? { effect } : {}) };
    },

    signWebhookForTest(event) {
      const { rawBody, signature } = rawAdapter.signWebhook({
        type: event.type,
        amountCents: event.amountCents,
        currency: event.currency,
        customerId: event.customerId,
        timestamp: event.timestamp,
      });
      return { rawBody, signature };
    },

    async issueLicenseKey(input: LicenseIssueInput): Promise<LicenseKeyRecord> {
      return coreIssue(store, {
        orderId: input.orderId,
        customerId: input.customerId,
        variantId: input.variantId,
        ...(input.maxActivations !== undefined || input.bindKind !== undefined
          ? {
              policy: {
                maxActivations: input.maxActivations ?? 5,
                bindKind: input.bindKind ?? 'per-machine',
              },
            }
          : {}),
        ...(input.now !== undefined ? { now: input.now } : {}),
      });
    },

    async activateLicense(input: LicenseActivateInput): Promise<LicenseActivation> {
      return coreActivate(store, input);
    },

    async deactivateLicense(input: LicenseDeactivateInput): Promise<LicenseActivation> {
      return coreDeactivate(store, input);
    },

    async refund(input: RefundInput): Promise<RefundResult> {
      const order = store.orders.get(input.orderId);
      if (order === undefined) throw new Error('order_not_found');
      const policy = {
        ...REFUND_DEFAULT,
        ...(input.chargebackPrevention === true ? { chargebackPrevention: true } : {}),
      };
      const priorLicenseId = order.licenseId;
      const priorLicenseStatus =
        priorLicenseId !== undefined ? store.licenses.get(priorLicenseId)?.status : undefined;
      const refund = issueRefund(store, {
        orderId: input.orderId,
        amountCents: input.amountCents,
        now: input.now,
        policy,
      });
      let licenseRevoked = false;
      if (priorLicenseId !== undefined) {
        const licenseAfter = store.licenses.get(priorLicenseId);
        if (
          licenseAfter !== undefined &&
          licenseAfter.status === 'revoked' &&
          priorLicenseStatus !== 'revoked'
        ) {
          licenseRevoked = true;
        }
      }
      if (refund.kind === 'full') {
        await clawBackReferral(order.id);
      }
      return { refund, order, licenseRevoked };
    },

    async registerAffiliate(input: AffiliateRegisterInput): Promise<void> {
      const profile: AffiliateProfile = {
        id: input.affiliateId,
        referralCode: input.referralCode,
        tier: 'bronze',
        lifetimeConversions: 0,
        lifetimeCommissionCents: 0,
      };
      store.affiliates.set(input.affiliateId, profile);
    },

    async recordAffiliateConversion(
      input: AffiliateConvertInput,
    ): Promise<AffiliateReferralRecord> {
      const affiliate = findAffiliateByCode(store, input.referralCode);
      if (affiliate === undefined) throw new Error('affiliate_not_found');
      const stamp = input.now ?? now();
      const { tier, commissionCents } = applyConversion(affiliate, input.orderAmountCents);
      const id = `ref_${store.referrals.size + 1}_${input.orderId}`;
      const record: AffiliateReferralRecord = {
        id,
        affiliateId: affiliate.id,
        orderId: input.orderId,
        customerId: input.customerId,
        referredAt: stamp,
        commissionCents,
        tier,
        referralCode: input.referralCode,
        state: 'converted',
      };
      store.referrals.set(id, record);
      const order = store.orders.get(input.orderId);
      if (order !== undefined) order.referralId = id;
      return record;
    },

    async refundAffiliateCommission(orderId: string) {
      return clawBackReferral(orderId);
    },
  };
  return { adapter, store, raw: rawAdapter };
}

/**
 * Build the hosted checkout URL Lemon Squeezy would redirect the buyer
 * to. Real LS uses
 * `https://{store}.lemonsqueezy.com/checkout/buy/{variantId}?checkout%5Bcustom%5D%5Buser_id%5D=...`.
 * The mock uses the same shape so tests can assert on the URL format.
 */
function buildHostedCheckoutUrl(input: {
  storeId: string;
  variantId: string;
  customerId: string;
  successUrl?: string;
  referralCode?: string;
}): string {
  const params = new URLSearchParams();
  params.set('checkout[custom][user_id]', input.customerId);
  if (input.successUrl !== undefined) params.set('checkout[success_url]', input.successUrl);
  if (input.referralCode !== undefined) params.set('aff', input.referralCode);
  return `https://${input.storeId}.lemonsqueezy.com/checkout/buy/${input.variantId}?${params.toString()}`;
}

/**
 * Classify a raw webhook event type into a dispatch kind (for tracing).
 * Real LS event names use `order_created`, `license_key_created`,
 * `subscription_created`, etc.
 */
function dispatchKind(eventType: string): 'order' | 'license' | 'refund' | 'affiliate' {
  if (eventType.includes('license')) return 'license';
  if (eventType.includes('refund')) return 'refund';
  if (eventType.includes('affiliate')) return 'affiliate';
  return 'order';
}

/**
 * Apply the webhook event's downstream effect on the store. The dogfood
 * app dispatches order_created / license_activated / refund_issued into
 * store mutations so tests can drive lifecycle changes via signed events
 * (matches how a real merchant integrates the receiver).
 */
function handleEventEffect(
  store: AppStore,
  event: PaymentWebhookEvent,
  clock: () => number,
): { kind: 'order' | 'license' | 'refund' | 'affiliate'; entityId: string; newState?: string } | undefined {
  const kind = dispatchKind(event.type);
  if (kind === 'order' && event.type === 'order_created') {
    const stamp = event.timestamp || clock();
    const orderId = `ord_evt_${event.id}`;
    if (!store.orders.has(orderId)) {
      const record: OrderRecord = {
        id: orderId,
        customerId: event.customerId,
        variantId: `var_${event.customerId}`,
        amountCents: event.amountCents,
        currency: event.currency,
        paidAt: stamp,
        productKind: 'license',
        state: 'paid',
      };
      store.orders.set(orderId, record);
    }
    return { kind, entityId: orderId, newState: 'paid' };
  }
  if (kind === 'license' && event.type === 'license_activated') {
    return { kind, entityId: event.id, newState: 'active' };
  }
  if (kind === 'refund' && event.type === 'refund_issued') {
    return { kind, entityId: event.id, newState: 'refunded' };
  }
  return { kind, entityId: event.id };
}

function findAffiliateByCode(
  store: AppStore,
  code: string,
): AffiliateProfile | undefined {
  for (const affiliate of store.affiliates.values()) {
    if (affiliate.referralCode === code) return affiliate;
  }
  return undefined;
}

function findReferralByOrder(
  store: AppStore,
  orderId: string,
): AffiliateReferralRecord | undefined {
  for (const referral of store.referrals.values()) {
    if (referral.orderId === orderId) return referral;
  }
  return undefined;
}

/** Convenience — re-export the 30-day window constant. */
export const REFUND_WINDOW_MS = THIRTY_DAY_MS;
