/**
 * Provider-neutral Lemon Squeezy dogfood RP (Relying Party) surface.
 *
 * The SvelteKit app talks to Lemon Squeezy only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives a real Lemon Squeezy sandbox / Lemon
 *    Squeezy REST API, skipped when the environment cannot reach
 *    `LEMONSQUEEZY_KEY` + `KIWA_MODE=real`)
 *  - {@link makeMockAdapter} (backed by `@kiwa-test/payment`'s
 *    `createLemonSqueezyMock` + 8-axis semantics)
 *
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the release gate.
 *
 * The 6 canonical operation groups mirror what a real Lemon Squeezy REST
 * integration exposes:
 *  - `checkout` — create a hosted checkout session (returns checkout id +
 *    order id + hosted URL). Real LS: `POST /v1/checkouts`.
 *  - `receiveWebhook` — verify signature + dispatch to handlers. Real LS:
 *    `X-Signature: hmac_sha256(body)` header verification against a
 *    per-store webhook secret.
 *  - `subscription` — CRUD-ish operations (create / upgrade / downgrade /
 *    pause / resume / cancel / reactivate). Real LS: `POST /v1/subscriptions`
 *    + `PATCH /v1/subscriptions/{id}`.
 *  - `order` — draft / open / pay / void / uncollectible.
 *  - `license` — issue / activate / revoke license keys. Real LS: license
 *    keys emit automatically on order paid for licensed variants; the API
 *    surfaces activation via `POST /v1/licenses/activate`.
 *  - `refund` — full / partial refund. Real LS: `POST /v1/orders/{id}/refund`.
 *  - `dispute` — chargeback dispute (opened → evidence → won / lost).
 */

import type {
  Chargeback,
  ChargebackReason,
  DunningSession,
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  WebhookVerifyResult,
} from '@kiwa-test/payment';
import type { LicenseKeyRecord, RefundRecord } from '../lib/store.js';

/**
 * Input for a hosted checkout session creation.
 */
export interface CheckoutInput {
  customerId: string;
  variantId: string;
  storeId: string;
  amountCents: number;
  currency?: string;
  productKind?: 'digital' | 'physical' | 'service' | 'license';
  successUrl?: string;
}

/**
 * Output the RP produces after a successful hosted checkout session
 * creation. `mode` mirrors the caller-visible mode so the fidelity harness
 * traces which adapter emitted the session.
 */
export interface CheckoutResult {
  checkoutId: string;
  orderId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  productKind: 'digital' | 'physical' | 'service' | 'license';
  mode: 'mock' | 'real';
}

/**
 * Input for the webhook receiver. Mirrors what a real Lemon Squeezy
 * integration consumes in `POST /webhook` — raw body bytes +
 * `X-Signature` header.
 */
export interface WebhookReceiveInput {
  rawBody: string;
  signature: string;
  toleranceMs?: number;
}

/**
 * Output the RP produces after a webhook receive. The verify result carries
 * the parsed event on success (or a stable rejection reason on failure), and
 * `dispatched` is true when the event triggered at least one downstream
 * subscription / order / license / chargeback mutation.
 */
export interface WebhookReceiveResult {
  verify: WebhookVerifyResult;
  dispatched: boolean;
  effect?: {
    kind: 'subscription' | 'order' | 'checkout' | 'license' | 'refund' | 'chargeback' | 'dunning';
    entityId: string;
    newState?: string | undefined;
  };
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream fidelity tests diff the trace across the two adapters
 * to detect behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'checkout'
    | 'receiveWebhook'
    | 'createSubscription'
    | 'upgradeSubscription'
    | 'downgradeSubscription'
    | 'pauseSubscription'
    | 'resumeSubscription'
    | 'cancelSubscription'
    | 'reactivateSubscription'
    | 'draftOrder'
    | 'openOrder'
    | 'payOrder'
    | 'voidOrder'
    | 'markUncollectible'
    | 'issueLicenseKey'
    | 'activateLicense'
    | 'revokeLicense'
    | 'refundOrder'
    | 'openChargeback'
    | 'submitChargebackEvidence'
    | 'resolveChargeback'
    | 'startDunning'
    | 'dunningAttempt'
    | 'finalizeDunning'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface SubscriptionPlanChangeInput {
  subscriptionId: string;
  newPlanId: string;
  newAmountCents: number;
}

export interface LicenseIssueInput {
  orderId: string;
  customerId: string;
  variantId: string;
  activationsLimit?: number;
  expiresAt?: number;
}

export interface LicenseActivateInput {
  licenseKeyId: string;
  instanceName: string;
}

export interface LicenseRevokeInput {
  licenseKeyId: string;
  instanceId: string;
}

export interface RefundInput {
  orderId: string;
  refundAmountCents?: number;
  reason?: string;
}

export interface RefundResult {
  refund: RefundRecord;
  order: SemanticInvoice;
}

export interface ChargebackOpenInput {
  orderId: string;
  reason: ChargebackReason;
}

export interface ChargebackEvidenceInput {
  chargebackId: string;
  receiptUrl?: string;
  shippingProof?: string;
  customerCommunication?: string;
}

export interface ChargebackResolveInput {
  chargebackId: string;
  merchantWon: boolean;
}

export interface LemonSqueezyDogfoodAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Drive a hosted checkout session creation — RP creates a Lemon Squeezy
   * checkout (real API or mock), and returns the checkout id + hosted URL +
   * order id. Both adapters must return the same shape so fidelity axes
   * (checkout id format / URL shape / order id) can be compared.
   */
  checkout(input: CheckoutInput): Promise<CheckoutResult>;

  /**
   * Verify the webhook signature + dispatch to any registered handlers.
   * Real Lemon Squeezy: HMAC-SHA256 over the raw body only (no timestamp
   * mixed in). Both adapters return the verify result verbatim so signature
   * verify fidelity can be diffed byte-for-byte on the failure paths.
   */
  receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult>;

  listSubscriptions(): SemanticSubscription[];
  listOrders(): SemanticInvoice[];
  listCheckouts(): { checkoutId: string; orderId: string; customerId: string; amountCents: number; currency: string; status: 'open' | 'complete' | 'expired' }[];
  listLicenseKeys(): LicenseKeyRecord[];
  listRefunds(): RefundRecord[];
  listChargebacks(): Chargeback[];
  eventsEmitted(): PaymentWebhookEvent[];

  getSubscription(id: string): SemanticSubscription | null;
  getOrder(id: string): SemanticInvoice | null;
  getLicenseKey(id: string): LicenseKeyRecord | null;
  getChargeback(id: string): Chargeback | null;

  changePlan(input: SubscriptionPlanChangeInput): Promise<SemanticSubscription>;
  pauseSubscription(id: string): Promise<SemanticSubscription>;
  resumeSubscription(id: string): Promise<SemanticSubscription>;
  cancelSubscription(id: string): Promise<SemanticSubscription>;
  reactivateSubscription(id: string): Promise<SemanticSubscription>;

  draftOrder(input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticInvoice>;
  openOrder(orderId: string): Promise<SemanticInvoice>;
  payOrder(orderId: string): Promise<SemanticInvoice>;
  voidOrder(orderId: string): Promise<SemanticInvoice>;
  markOrderUncollectible(orderId: string): Promise<SemanticInvoice>;

  /**
   * Issue a license key. Real LS: emits when order paid for a licensed
   * variant; the dogfood app exposes explicit issue so tests can drive the
   * path deterministically.
   */
  issueLicenseKey(input: LicenseIssueInput): Promise<LicenseKeyRecord>;
  /**
   * Register an activation instance on an existing license key. Real LS:
   * `POST /v1/licenses/activate`.
   */
  activateLicense(input: LicenseActivateInput): Promise<LicenseKeyRecord>;
  /**
   * Revoke a previously registered activation instance. Real LS:
   * `POST /v1/licenses/deactivate`.
   */
  revokeLicense(input: LicenseRevokeInput): Promise<LicenseKeyRecord>;

  /**
   * Refund an order (full or partial). Real LS: `POST /v1/orders/{id}/refund`.
   * Emits `order_refunded`.
   */
  refundOrder(input: RefundInput): Promise<RefundResult>;

  /**
   * Open a chargeback dispute against a paid order. Real LS: surfaces
   * disputes through `order_refunded` with `refund_reason: 'dispute'`.
   * The dogfood app models it explicitly through the `chargeback` semantics
   * axis so representment can be exercised.
   */
  openChargeback(input: ChargebackOpenInput): Promise<Chargeback>;
  /**
   * Submit merchant evidence in defence of a chargeback. Emits
   * `chargeback.evidence_submitted`. Only allowed from `opened`.
   */
  submitChargebackEvidence(input: ChargebackEvidenceInput): Promise<Chargeback>;
  /**
   * Terminal chargeback step — mark won (funds returned) or lost (funds
   * forfeit + dispute fee).
   */
  resolveChargeback(input: ChargebackResolveInput): Promise<Chargeback>;

  startDunningForOrder(orderId: string): Promise<DunningSession>;
  runDunningAttempt(orderId: string): Promise<DunningSession>;
  finalizeDunning(orderId: string, succeed: boolean): Promise<DunningSession>;

  reset(): Promise<void>;
}
