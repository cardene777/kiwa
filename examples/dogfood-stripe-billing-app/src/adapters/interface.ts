/**
 * Provider-neutral Stripe billing RP (Relying Party) surface for the dogfood
 * app.
 *
 * The Next.js app talks to Stripe only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives a real Stripe API / Stripe
 *    testcontainers-shaped mock server, skipped when the environment cannot
 *    reach `STRIPE_KEY` + `KIWA_MODE=real`)
 *  - {@link makeMockAdapter} (backed by `@kiwa/payment`'s
 *    `createStripeMock` + 9-axis semantics)
 *
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the release gate.
 *
 * The 4 canonical operations mirror what a real Stripe integration exposes:
 *  - `checkout` — create a checkout session (returns session id + url +
 *    payment intent). Real Stripe: `stripe.checkout.sessions.create()`.
 *  - `receiveWebhook` — verify signature + dispatch to handlers. Real Stripe:
 *    `stripe.webhooks.constructEvent(rawBody, signature, secret)`.
 *  - `subscription` — CRUD-ish operations (create / upgrade / downgrade /
 *    pause / resume / cancel / reactivate). Real Stripe:
 *    `stripe.subscriptions.*`.
 *  - `invoice` — draft / open / pay / void / uncollectible / credit note.
 *    Real Stripe: `stripe.invoices.*`.
 */

import type {
  Invoice as SemanticInvoice,
  Subscription as SemanticSubscription,
  ThreeDsSession,
  ThreeDsTransStatus,
  DunningSession,
  PaymentWebhookEvent,
  WebhookVerifyResult,
} from '@kiwa/payment';

/**
 * Input for a checkout session creation. Mirrors the fields a real client
 * passes to `stripe.checkout.sessions.create()`.
 */
export interface CheckoutInput {
  customerId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  /**
   * When true, the session issues a 3D Secure challenge flow before the
   * subscription is created. Sub-Issue #901 e2e exercises both frictionless
   * and challenge paths.
   */
  requiresThreeDs?: boolean;
  /**
   * Success + cancel redirect URLs — Stripe returns these in the session
   * response. The dogfood app uses `about:blank#success` / `about:blank#cancel`
   * defaults because the e2e never navigates to a real destination.
   */
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Output the RP produces after a successful checkout session creation.
 *
 * Includes the session id + payment intent id + optional 3DS session so
 * downstream tests can drive the challenge submit path without walking the
 * whole flow. `mode` mirrors the caller-visible mode so fidelity harness
 * traces which adapter emitted the session.
 */
export interface CheckoutResult {
  sessionId: string;
  paymentIntentId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  threeDs?: ThreeDsSession;
  mode: 'mock' | 'real';
}

/**
 * Input for the webhook receiver. Mirrors what a real Stripe integration
 * consumes in `POST /webhook` — raw body bytes + `Stripe-Signature` header.
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
 * subscription / invoice mutation.
 */
export interface WebhookReceiveResult {
  verify: WebhookVerifyResult;
  dispatched: boolean;
  /**
   * When the webhook mutated a subscription or invoice, the id + new state
   * so tests can assert on the side effect without re-reading the store.
   */
  effect?: {
    kind: 'subscription' | 'invoice' | 'checkout' | '3ds' | 'dunning';
    entityId: string;
    newState?: string | undefined;
  };
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream fidelity tests diff the trace across the two adapters to
 * detect behavioural divergences.
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
    | 'draftInvoice'
    | 'openInvoice'
    | 'payInvoice'
    | 'voidInvoice'
    | 'markUncollectible'
    | 'creditNoteInvoice'
    | 'threeDsSubmit'
    | 'threeDsFrictionless'
    | 'startDunning'
    | 'dunningAttempt'
    | 'finalizeDunning'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Input for subscription plan change. Real Stripe:
 * `stripe.subscriptions.update({ items: [{ id, price }] })`.
 */
export interface SubscriptionPlanChangeInput {
  subscriptionId: string;
  newPlanId: string;
  newAmountCents: number;
}

/**
 * Input for a credit note. Real Stripe:
 * `stripe.creditNotes.create({ invoice, amount })`.
 */
export interface CreditNoteInput {
  invoiceId: string;
  creditAmountCents: number;
}

export interface StripeBillingAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Drive a full checkout session creation — RP creates a Stripe checkout
   * session (real API or mock), optionally kicks off a 3DS session, and
   * returns the session id + url + payment intent id. Both adapters must
   * return the same shape so fidelity axes (session id format / url shape /
   * 3DS presence) can be compared.
   */
  checkout(input: CheckoutInput): Promise<CheckoutResult>;

  /**
   * Verify the webhook signature + dispatch to any registered handlers. Real
   * Stripe: `stripe.webhooks.constructEvent()`. Both adapters return the
   * verify result verbatim so signature verify fidelity can be diffed
   * byte-for-byte on the failure paths (bad-signature / stale-timestamp /
   * malformed-body).
   */
  receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult>;

  /**
   * Snapshot every persisted subscription the RP is currently tracking.
   * Sub-Issue #901 uses this to assert on side effects after webhook dispatch.
   */
  listSubscriptions(): SemanticSubscription[];

  /**
   * Snapshot every persisted invoice.
   */
  listInvoices(): SemanticInvoice[];

  /**
   * Snapshot every webhook event the RP has emitted so tests can assert on
   * ordering without re-registering a handler.
   */
  eventsEmitted(): PaymentWebhookEvent[];

  /**
   * Look up a subscription by id.
   */
  getSubscription(id: string): SemanticSubscription | null;

  /**
   * Look up an invoice by id.
   */
  getInvoice(id: string): SemanticInvoice | null;

  /**
   * Change plan (upgrade or downgrade). The amount delta determines which
   * neutral event is emitted (semantics/subscription-lifecycle enforces
   * `upgraded` vs `downgraded` state transition).
   */
  changePlan(input: SubscriptionPlanChangeInput): Promise<SemanticSubscription>;

  /**
   * Pause / resume / cancel / reactivate — thin wrappers over the semantics
   * layer, one method per neutral event so route handlers stay simple.
   */
  pauseSubscription(id: string): Promise<SemanticSubscription>;
  resumeSubscription(id: string): Promise<SemanticSubscription>;
  cancelSubscription(id: string): Promise<SemanticSubscription>;
  reactivateSubscription(id: string): Promise<SemanticSubscription>;

  /**
   * Draft a new invoice. Real Stripe: `stripe.invoices.create()`. Both mock
   * and real must persist the invoice in the same shape so the invoice list
   * UI reads the same data.
   */
  draftInvoice(input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticInvoice>;

  /**
   * Transition an invoice through its lifecycle. Same semantics as the
   * `packages/payment` layer — guarded state transitions, throws on invalid.
   */
  openInvoice(invoiceId: string): Promise<SemanticInvoice>;
  payInvoice(invoiceId: string): Promise<SemanticInvoice>;
  voidInvoice(invoiceId: string): Promise<SemanticInvoice>;
  markInvoiceUncollectible(invoiceId: string): Promise<SemanticInvoice>;
  creditNote(input: CreditNoteInput): Promise<SemanticInvoice>;

  /**
   * Submit the 3DS challenge result for a pending checkout session. Real
   * Stripe returns `Y` / `A` / `N` / `U` / `R` transStatus values (EMVCo
   * 3DS 2.2); the mock uses the same vocabulary so the fidelity harness
   * can compare byte-for-byte.
   */
  submitThreeDs(sessionId: string, transStatus: ThreeDsTransStatus): Promise<ThreeDsSession>;

  /**
   * Start a dunning session for an open invoice. Emits nothing at start —
   * subsequent `runDunningAttempt` + `finalizeDunning` calls emit the actual
   * webhook events. Real Stripe drives this on their own schedule; the mock
   * uses semantics/dunning to reproduce the observable envelope.
   */
  startDunningForInvoice(invoiceId: string): Promise<DunningSession>;

  /**
   * Run one dunning retry attempt. Emits `dunning.attempt`.
   */
  runDunningAttempt(invoiceId: string): Promise<DunningSession>;

  /**
   * Terminal dunning step — mark recovered (succeed=true) or exhausted
   * (succeed=false). Emits `dunning.recovered` or `dunning.exhausted`.
   */
  finalizeDunning(invoiceId: string, succeed: boolean): Promise<DunningSession>;

  reset(): Promise<void>;
}
