/**
 * Provider-neutral Paddle Billing v2 subscription RP surface for the dogfood
 * app.
 *
 * The app talks to Paddle only through this contract so the same route
 * handlers can flip between `createPaddleMock()` and the env-gated real
 * driver skeleton. The five operation groups mirror the subscription-
 * lifecycle concerns this sub-issue verifies end-to-end: customer signup,
 * subscription creation + trial, mid-cycle plan changes (proration), retention
 * offers (pause + resume + downgrade), and coupon stacking + refund window.
 */

import type {
  PaymentWebhookEvent,
  WebhookVerifyResult,
} from '@kiwa-lab/payment';

export type SubscriptionAppMode = 'mock' | 'real';
export type CustomerStatus = 'active' | 'archived';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'paused'
  | 'past-due'
  | 'canceled';
export type RetentionOfferKind = 'pause' | 'downgrade' | 'coupon';
export type RefundStatus = 'granted' | 'denied';

/**
 * Customer signup input. Matches the minimum data Paddle Billing v2 collects
 * before it can create a subscription for the customer.
 */
export interface CreateCustomerInput {
  email: string;
  country?: string;
}

/**
 * Stored Paddle Billing v2 customer snapshot. `defaultPaymentMethodId` gets
 * populated as soon as the first subscription is created so downstream tests
 * can assert on payment-method vault semantics without touching the semantics
 * package directly.
 */
export interface PaddleCustomer {
  id: string;
  email: string;
  country: string;
  status: CustomerStatus;
  defaultPaymentMethodId: string | null;
  createdAt: number;
}

/**
 * Subscription creation input. The name stays `SubscribeInput` to mirror the
 * marketplace app pattern where the top-level operation accepts one canonical
 * input envelope.
 */
export interface SubscribeInput {
  customerId: string;
  priceId: string;
  planPriceCents: number;
  currency?: string;
  trialDays?: number;
  couponCode?: string;
  idempotencyKey?: string;
  createdAtMs?: number;
}

/**
 * Stored subscription snapshot. Captures both Paddle-visible fields (Billing
 * v2 `data.attributes.status` semantics) and the marketplace arithmetic the
 * proration / retention tests assert on (`currentCyclePriceCents`,
 * `discountPercent`, `trialEndsAt`).
 */
export interface SubscriptionResult {
  id: string;
  customerId: string;
  priceId: string;
  planPriceCents: number;
  currentCyclePriceCents: number;
  currency: string;
  status: SubscriptionStatus;
  trialDays: number;
  trialEndsAt: number | null;
  discountPercent: number;
  couponCodes: string[];
  createdAt: number;
  activatedAt: number | null;
  pausedAt: number | null;
  canceledAt: number | null;
  idempotencyKey?: string;
}

/**
 * Trial extension input. Paddle Billing v2 lets merchants stretch a trial by
 * up to 30 additional days from `trialEndsAt`.
 */
export interface ExtendTrialInput {
  subscriptionId: string;
  additionalDays: number;
  createdAtMs?: number;
}

/**
 * Proration input for mid-cycle plan changes. Paddle Billing v2 computes the
 * proration delta from the ratio of days elapsed in the current cycle.
 */
export interface ApplyProrationInput {
  subscriptionId: string;
  newPriceId: string;
  newPlanPriceCents: number;
  daysElapsed: number;
  daysInCycle: number;
  createdAtMs?: number;
}

/**
 * Stored proration snapshot. `deltaCents` is positive for upgrades and
 * negative for downgrades so tests can assert on credit balance behaviour.
 */
export interface ProrationResult {
  id: string;
  subscriptionId: string;
  oldPriceId: string;
  newPriceId: string;
  deltaCents: number;
  daysElapsed: number;
  daysInCycle: number;
  createdAt: number;
}

/**
 * Retention offer input — pause / downgrade / coupon offered before cancel.
 */
export interface RetentionOfferInput {
  subscriptionId: string;
  kind: RetentionOfferKind;
  /** for kind='pause' — number of days to pause the subscription */
  pauseDays?: number;
  /** for kind='downgrade' — target priceId + monthly price */
  newPriceId?: string;
  newPlanPriceCents?: number;
  /** for kind='coupon' — percent discount to apply */
  couponCode?: string;
  couponPercentOff?: number;
  createdAtMs?: number;
}

/**
 * Stored retention offer snapshot. `accepted` is set when the customer takes
 * the offer; otherwise the subscription proceeds to cancellation.
 */
export interface RetentionOfferResult {
  id: string;
  subscriptionId: string;
  kind: RetentionOfferKind;
  accepted: boolean;
  pauseDays?: number;
  newPriceId?: string;
  newPlanPriceCents?: number;
  couponCode?: string;
  couponPercentOff?: number;
  createdAt: number;
}

/**
 * Coupon stack input. Stackable coupons combine additively (capped at 100%),
 * non-stackable coupons replace any existing coupon set.
 */
export interface StackCouponInput {
  subscriptionId: string;
  code: string;
  percentOff: number;
  stackable?: boolean;
  createdAtMs?: number;
}

/**
 * Stored coupon stack snapshot after applying one coupon.
 */
export interface CouponStackResult {
  subscriptionId: string;
  activeCoupons: string[];
  totalPercentOff: number;
  discountedCents: number;
  createdAt: number;
}

/**
 * Refund window input. Paddle Billing v2 refund policy has a hard 14-day
 * cutoff by default; tests exercise both inside- and outside-window paths.
 */
export interface RefundInput {
  subscriptionId: string;
  requestedAtMs: number;
  refundWindowDays?: number;
}

/**
 * Stored refund snapshot. `reason` is populated only on denied refunds so
 * tests can distinguish valid granted refunds from policy rejections.
 */
export interface RefundResult {
  id: string;
  subscriptionId: string;
  status: RefundStatus;
  amountCents: number;
  requestedAt: number;
  reason?: string;
}

/**
 * Webhook receive input. Mirrors what a real Paddle webhook route consumes:
 * untouched raw body bytes plus the `Paddle-Signature` header.
 */
export interface WebhookReceiveInput {
  rawBody: string;
  signature: string;
  toleranceMs?: number;
}

/**
 * Webhook receive result. `dispatched` stays false for unknown event types or
 * signature failures so the route handler can surface the exact rejection.
 */
export interface WebhookReceiveResult {
  verify: WebhookVerifyResult;
  dispatched: boolean;
}

/**
 * Subscription event log entry. The underlying payment adapter supplies the
 * Paddle-shaped envelope; this app adds `detail` so tests can assert on
 * subscription-specific payload metadata such as `subscriptionId` or
 * `retentionKind`.
 */
export interface SubscriptionAppWebhookEvent extends PaymentWebhookEvent {
  detail?: Record<string, unknown>;
}

/**
 * Trace event emitted by every public adapter operation. Downstream fidelity
 * tests compare the ordered trace across mock and real adapters to detect
 * missing branches or diverging error classifications.
 */
export interface TraceEvent {
  op:
    | 'createCustomer'
    | 'getCustomer'
    | 'listCustomers'
    | 'createSubscription'
    | 'extendTrial'
    | 'activateSubscription'
    | 'cancelSubscription'
    | 'listSubscriptions'
    | 'applyProration'
    | 'listProrations'
    | 'offerRetention'
    | 'acceptRetention'
    | 'listRetentionOffers'
    | 'stackCoupon'
    | 'listCouponStacks'
    | 'requestRefund'
    | 'listRefunds'
    | 'receiveWebhook'
    | 'reset';
  ok: boolean;
  errorKind?: string;
  detail?: Record<string, unknown>;
}

/**
 * Shared adapter contract implemented by both the mock and real driver
 * skeleton. The route handlers stay framework-neutral because this is the
 * only surface they depend on.
 */
export interface PaddleSubscriptionAdapter {
  readonly mode: SubscriptionAppMode;
  readonly traces: () => TraceEvent[];

  createCustomer(input: CreateCustomerInput): Promise<PaddleCustomer>;
  getCustomer(id: string): Promise<PaddleCustomer>;
  listCustomers(): PaddleCustomer[];

  createSubscription(input: SubscribeInput): Promise<SubscriptionResult>;
  extendTrial(input: ExtendTrialInput): Promise<SubscriptionResult>;
  activateSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  listSubscriptions(filter?: { customerId?: string }): SubscriptionResult[];

  applyProration(input: ApplyProrationInput): Promise<ProrationResult>;
  listProrations(filter?: { subscriptionId?: string }): ProrationResult[];

  offerRetention(input: RetentionOfferInput): Promise<RetentionOfferResult>;
  acceptRetention(offerId: string): Promise<RetentionOfferResult>;
  listRetentionOffers(filter?: { subscriptionId?: string }): RetentionOfferResult[];

  stackCoupon(input: StackCouponInput): Promise<CouponStackResult>;
  listCouponStacks(filter?: { subscriptionId?: string }): CouponStackResult[];

  requestRefund(input: RefundInput): Promise<RefundResult>;
  listRefunds(filter?: { subscriptionId?: string }): RefundResult[];

  eventsEmitted(): SubscriptionAppWebhookEvent[];
  receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult>;
  reset(): Promise<void>;
}
