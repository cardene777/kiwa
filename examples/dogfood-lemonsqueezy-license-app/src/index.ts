/**
 * dogfood-lemonsqueezy-license-app — v1.33-4 Lemon Squeezy dogfood surface
 *
 * Focus — license key issue + activation (per-seat / per-machine) +
 * affiliate program (referral link + commission + tier) + refund window
 * (30 day money-back guarantee + partial refund) + webhook receiver.
 *
 * See README.md for the layout + KIWA_MODE gates.
 */

export { makeMockAdapter, REFUND_WINDOW_MS } from './adapters/mock.js';
export { makeRealAdapter, inspectRealAdapterEnv } from './adapters/real.js';
export type {
  AdapterMode,
  AffiliateConvertInput,
  AffiliateRegisterInput,
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
} from './adapters/interface.js';
export type {
  AffiliateProfile,
  AffiliateReferralRecord,
  AffiliateTierName,
  AppStore,
  LicenseActivation,
  LicenseKeyRecord,
  OrderRecord,
  RefundRecord,
  WebhookRecord,
} from './lib/store.js';
export { createStore } from './lib/store.js';
export {
  TIER_COMMISSION_BPS,
  TIER_PROMOTION_THRESHOLD,
  applyConversion,
  computeCommissionCents,
  evaluateTier,
  reverseConversion,
} from './lib/affiliate-tier.js';
export {
  DEFAULT_POLICY as LICENSE_DEFAULT_POLICY,
  activateLicense,
  deactivateLicense,
  issueLicenseKey,
  revokeLicense,
} from './lib/license-issue.js';
export {
  DEFAULT_POLICY as REFUND_DEFAULT_POLICY,
  THIRTY_DAY_MS,
  evaluateRefund,
  issueRefund,
  totalRefundedForOrder,
} from './lib/refund-window.js';
export { makeCheckoutRoute } from './routes/checkout/handler.js';
export { makeWebhookRoute } from './routes/webhook/handler.js';
export { makeLicenseRoute } from './routes/license/handler.js';
export { makeRefundRoute } from './routes/refund/handler.js';
export { makeAffiliateRoute } from './routes/affiliate/handler.js';
