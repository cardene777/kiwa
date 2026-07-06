/**
 * Provider-neutral surface for the v1.33-4 dogfood app. Two
 * implementations exist —
 *
 *  - {@link makeMockAdapter} — backed by @kiwa-test/payment's
 *    `createLemonSqueezyMock` + a small in-memory store for licenses,
 *    orders, refunds, and affiliate records.
 *  - {@link makeRealAdapter} — env-gated Lemon Squeezy sandbox skeleton
 *    that surfaces `KIWA_LEMONSQUEEZY_ENV_MISSING` until CI wires up the
 *    real sandbox fixture.
 *
 * The 6 canonical operations mirror what a real Lemon Squeezy REST
 * integration exposes for license + affiliate + refund flows:
 *
 *  - `checkout` — create a hosted checkout session, optionally with an
 *    affiliate referral code.
 *  - `receiveWebhook` — verify + dispatch order_created / license_activated /
 *    refund_issued events.
 *  - `issueLicenseKey` — explicit license issue path (idempotent by orderId).
 *  - `activateLicense` — bind license to machine / seat.
 *  - `refund` — full or partial refund enforcing the 30-day window.
 *  - `affiliateReferral` — record a referral + compute commission at
 *    order-paid time using tier policy.
 */

import type { PaymentWebhookEvent, WebhookVerifyResult } from '@kiwa-test/payment';
import type {
  AffiliateReferralRecord,
  LicenseActivation,
  LicenseKeyRecord,
  OrderRecord,
  RefundRecord,
} from '../lib/store.js';

/**
 * Runtime mode reported through {@link CheckoutResult.mode} so tests can
 * diff mock vs real emissions side-by-side.
 */
export type AdapterMode = 'mock' | 'real';

/**
 * Input for the hosted checkout session creation. `referralCode` links
 * the resulting order to an affiliate for commission calculation on
 * order paid.
 */
export interface CheckoutInput {
  customerId: string;
  variantId: string;
  storeId: string;
  amountCents: number;
  currency?: string;
  productKind?: 'digital' | 'physical' | 'service' | 'license';
  successUrl?: string;
  referralCode?: string;
  /** override clock for deterministic tests */
  now?: number;
}

/**
 * Result of hosted checkout session creation.
 */
export interface CheckoutResult {
  checkoutId: string;
  orderId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  productKind: 'digital' | 'physical' | 'service' | 'license';
  mode: AdapterMode;
  referralCode: string | undefined;
}

/**
 * Webhook receive input — raw body + X-Signature. Real LS signs the
 * body only (no timestamp); the mock still uses a timestamp so stale
 * events can be rejected in tests.
 */
export interface WebhookReceiveInput {
  rawBody: string;
  signature: string;
  toleranceMs?: number;
}

/**
 * Webhook receive result — verify outcome + effect on the store.
 */
export interface WebhookReceiveResult {
  verify: WebhookVerifyResult;
  dispatched: boolean;
  effect?: {
    kind: 'order' | 'license' | 'refund' | 'affiliate';
    entityId: string;
    newState?: string;
  };
}

/** Input to explicit license issue. */
export interface LicenseIssueInput {
  orderId: string;
  customerId: string;
  variantId: string;
  maxActivations?: number;
  bindKind?: 'per-machine' | 'per-seat';
  now?: number;
}

/** Input to license activate. */
export interface LicenseActivateInput {
  licenseKey: string;
  machineId: string;
  seatId?: string;
  now?: number;
}

/** Input to license deactivate. */
export interface LicenseDeactivateInput {
  licenseKey: string;
  instanceId: string;
  now?: number;
}

/** Input to refund. */
export interface RefundInput {
  orderId: string;
  amountCents: number;
  now: number;
  chargebackPrevention?: boolean;
}

/** Result of refund. */
export interface RefundResult {
  refund: RefundRecord;
  order: OrderRecord;
  licenseRevoked: boolean;
}

/** Input to register an affiliate. */
export interface AffiliateRegisterInput {
  affiliateId: string;
  referralCode: string;
}

/** Input to record a referral conversion (called on order paid). */
export interface AffiliateConvertInput {
  referralCode: string;
  orderId: string;
  customerId: string;
  orderAmountCents: number;
  now?: number;
}

/**
 * The dogfood adapter surface. Real + mock adapters implement this so
 * the routes are provider-neutral.
 */
export interface LemonSqueezyLicenseAdapter {
  readonly mode: AdapterMode;

  checkout(input: CheckoutInput): Promise<CheckoutResult>;

  receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult>;

  signWebhookForTest(event: PaymentWebhookEvent): { rawBody: string; signature: string };

  issueLicenseKey(input: LicenseIssueInput): Promise<LicenseKeyRecord>;

  activateLicense(input: LicenseActivateInput): Promise<LicenseActivation>;

  deactivateLicense(input: LicenseDeactivateInput): Promise<LicenseActivation>;

  refund(input: RefundInput): Promise<RefundResult>;

  registerAffiliate(input: AffiliateRegisterInput): Promise<void>;

  recordAffiliateConversion(input: AffiliateConvertInput): Promise<AffiliateReferralRecord>;

  refundAffiliateCommission(orderId: string): Promise<AffiliateReferralRecord | undefined>;
}
