/**
 * In-memory persistence layer for the dogfood-lemonsqueezy-license-app.
 *
 * Real Lemon Squeezy deployments persist orders, licenses, affiliate
 * referrals, refunds, and webhook idempotency records in a relational
 * store. The dogfood app exposes a minimal typed store so tests can
 * assert on the resulting state without booting a database.
 *
 * All records carry timestamps in ms since epoch so refund-window
 * enforcement and affiliate tier promotion can be driven deterministically
 * by tests injecting `now`.
 */

/**
 * License key record — issued when an order for a "license" variant is
 * paid. `activations` tracks per-seat / per-machine binds up to
 * `maxActivations`; exceeding it produces a `license_limit_reached`
 * error.
 */
export interface LicenseKeyRecord {
  /** stable id, e.g. `lic_abc123` */
  id: string;
  /** the license key value handed to the buyer (opaque) */
  key: string;
  /** the paid order that emitted this license */
  orderId: string;
  /** the buyer */
  customerId: string;
  /** the Lemon Squeezy variant id, e.g. `variant_pro_annual` */
  variantId: string;
  /** issue timestamp (ms since epoch) */
  issuedAt: number;
  /** activation status */
  status: 'active' | 'revoked' | 'expired';
  /** per-seat / per-machine limit */
  maxActivations: number;
  /** currently bound activations */
  activations: LicenseActivation[];
}

/**
 * Single activation of a license key against a specific machine or seat.
 */
export interface LicenseActivation {
  /** stable id, e.g. `lic_inst_abc123_1` */
  instanceId: string;
  /** free-form machine id (mac / hostname / etc) */
  machineId: string;
  /** free-form seat id when the license is per-seat */
  seatId?: string;
  /** activation timestamp */
  activatedAt: number;
  /** revocation timestamp when revoked */
  revokedAt?: number;
  /** current state */
  state: 'active' | 'revoked';
}

/**
 * Affiliate referral record — links a buyer's order to the affiliate who
 * originated the referral. Commission is calculated at order-paid time
 * against the tier that applies at the moment of the sale.
 */
export interface AffiliateReferralRecord {
  /** stable id */
  id: string;
  /** the affiliate who owns the referral link */
  affiliateId: string;
  /** the resulting order after conversion */
  orderId: string;
  /** the buyer */
  customerId: string;
  /** referral timestamp */
  referredAt: number;
  /** commission cents credited to the affiliate */
  commissionCents: number;
  /** tier at which the commission was computed */
  tier: AffiliateTierName;
  /** referral link that was hit */
  referralCode: string;
  /** conversion state */
  state: 'pending' | 'converted' | 'refunded' | 'clawed-back';
}

/**
 * Affiliate profile — carries tier + lifetime commission stats used by
 * the tier evaluation logic.
 */
export interface AffiliateProfile {
  id: string;
  /** unique referral code embedded in the affiliate URL */
  referralCode: string;
  /** current tier */
  tier: AffiliateTierName;
  /** lifetime referred order count */
  lifetimeConversions: number;
  /** lifetime commission cents earned */
  lifetimeCommissionCents: number;
}

/** Affiliate tier names. Higher tier = higher commission percent. */
export type AffiliateTierName = 'bronze' | 'silver' | 'gold';

/**
 * Refund record — created when the merchant issues a full or partial
 * refund. Refunds outside the 30-day window are rejected with a
 * `refund_window_expired` error.
 */
export interface RefundRecord {
  /** stable id */
  id: string;
  /** the refunded order */
  orderId: string;
  /** original order amount */
  originalAmountCents: number;
  /** refunded amount (partial or full) */
  refundedCents: number;
  /** kind of refund */
  kind: 'full' | 'partial';
  /** refund timestamp */
  refundedAt: number;
  /** the buyer */
  customerId: string;
}

/**
 * Order record — captures the order lifecycle so refund + license issue
 * paths can pin against a specific paid order.
 */
export interface OrderRecord {
  id: string;
  customerId: string;
  variantId: string;
  amountCents: number;
  currency: string;
  paidAt: number;
  productKind: 'digital' | 'physical' | 'service' | 'license';
  state: 'paid' | 'refunded' | 'partial-refunded';
  /** license key id when the variant is a licensed product */
  licenseId?: string;
  /** affiliate referral id when the order originated from a referral */
  referralId?: string;
}

/**
 * Webhook idempotency record — Lemon Squeezy re-delivers webhooks on
 * failure, so the app must dedupe by event id.
 */
export interface WebhookRecord {
  eventId: string;
  eventName: string;
  receivedAt: number;
  outcome: 'accepted' | 'duplicate' | 'rejected';
}

/**
 * The whole in-memory store. Instantiate one per test / per request via
 * {@link createStore}.
 */
export interface AppStore {
  licenses: Map<string, LicenseKeyRecord>;
  orders: Map<string, OrderRecord>;
  refunds: Map<string, RefundRecord>;
  webhooks: Map<string, WebhookRecord>;
  affiliates: Map<string, AffiliateProfile>;
  referrals: Map<string, AffiliateReferralRecord>;
}

/**
 * Factory for a fresh, empty store. Tests instantiate a new store per
 * spec so assertions do not leak between cases.
 */
export function createStore(): AppStore {
  return {
    licenses: new Map(),
    orders: new Map(),
    refunds: new Map(),
    webhooks: new Map(),
    affiliates: new Map(),
    referrals: new Map(),
  };
}
