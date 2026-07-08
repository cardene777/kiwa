/**
 * Provider-neutral Paddle merchant-of-record RP (Relying Party) surface for
 * the dogfood app.
 *
 * The Nuxt 3 app talks to Paddle only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives a real Paddle sandbox / Paddle
 *    Billing v2 API, skipped when the environment cannot reach `PADDLE_KEY`
 *    + `KIWA_MODE=real`)
 *  - {@link makeMockAdapter} (backed by `@kiwa/payment`'s
 *    `createPaddleMock` + 9-axis semantics)
 *
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the release gate.
 *
 * The 4 canonical operations mirror what a real Paddle Billing v2 integration
 * exposes:
 *  - `checkout` — create an inline checkout session (returns checkout id +
 *    transaction id + inline URL + tax preview). Real Paddle:
 *    `paddle.transactions.create()` + `paddlejs.mount()`.
 *  - `receiveWebhook` — verify signature + dispatch to handlers. Real Paddle:
 *    `Paddle-Signature: ts=..;h1=..` header verification.
 *  - `subscription` — CRUD-ish operations (create / upgrade / downgrade /
 *    pause / resume / cancel / reactivate). Real Paddle:
 *    `paddle.subscriptions.*`.
 *  - `transaction` — draft / open / pay / void / uncollectible / credit note.
 *    Real Paddle: `paddle.transactions.*` + `paddle.adjustments.create()`.
 *  - `tax` — recalculate VAT/GST/sales-tax + emit tax event. Real Paddle:
 *    tax is calculated automatically as part of Merchant-of-Record.
 */

import type {
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  TaxLine,
  DunningSession,
  WebhookVerifyResult,
} from '@kiwa/payment';

/**
 * Input for an inline checkout session creation. Mirrors the fields a real
 * client passes to `paddle.transactions.create()` + `paddlejs.mount()`.
 */
export interface CheckoutInput {
  customerId: string;
  priceId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  /**
   * Buyer's country (ISO 3166-1 alpha-2). Drives VAT/GST/sales-tax
   * calculation — Paddle's Merchant-of-Record model requires the buyer
   * country before checkout so the total shown to the buyer includes tax.
   */
  buyerCountry: string;
  /**
   * Optional VAT id for B2B buyers. When present + buyer is in an EU
   * country different from the merchant + the product is digital/service,
   * the tax is reverse-charged (buyer self-accounts).
   */
  buyerVatId?: string;
  /**
   * Merchant's country. Defaults to `GB` in the mock adapter (matches a
   * typical Paddle merchant setup). Determines cross-border tax rules.
   */
  merchantCountry?: string;
  /**
   * Product kind — digital / physical / service. Digital + service are the
   * common SaaS cases; physical is included for e-commerce parity.
   */
  productKind?: 'digital' | 'physical' | 'service';
  /**
   * Success redirect URL — Paddle returns this in the checkout response so
   * the client can redirect after the transaction completes.
   */
  successUrl?: string;
}

/**
 * Output the RP produces after a successful inline checkout session creation.
 *
 * Includes the checkout id + transaction id + inline URL + tax preview so
 * downstream tests can drive the subscription create path without walking
 * the whole flow. `mode` mirrors the caller-visible mode so the fidelity
 * harness traces which adapter emitted the session.
 */
export interface CheckoutResult {
  checkoutId: string;
  transactionId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  /**
   * Tax preview computed at checkout. Paddle's inline checkout iframe
   * shows this to the buyer before they enter card details.
   */
  taxLine: TaxLine;
  mode: 'mock' | 'real';
}

/**
 * Input for the webhook receiver. Mirrors what a real Paddle integration
 * consumes in `POST /webhook` — raw body bytes + `Paddle-Signature` header.
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
 * subscription / transaction mutation.
 */
export interface WebhookReceiveResult {
  verify: WebhookVerifyResult;
  dispatched: boolean;
  effect?: {
    kind: 'subscription' | 'transaction' | 'checkout' | 'tax' | 'dunning';
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
    | 'draftTransaction'
    | 'openTransaction'
    | 'payTransaction'
    | 'voidTransaction'
    | 'markUncollectible'
    | 'creditNoteTransaction'
    | 'calculateTax'
    | 'startDunning'
    | 'dunningAttempt'
    | 'finalizeDunning'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Input for subscription plan change. Real Paddle:
 * `paddle.subscriptions.update({ items: [{ price_id, quantity }] })`.
 */
export interface SubscriptionPlanChangeInput {
  subscriptionId: string;
  newPlanId: string;
  newAmountCents: number;
}

/**
 * Input for a credit note (Paddle adjustment). Real Paddle:
 * `paddle.adjustments.create({ transaction_id, action: 'refund', items })`.
 */
export interface CreditNoteInput {
  transactionId: string;
  creditAmountCents: number;
}

/**
 * Input for on-demand tax recalculation. Called by the tax UI when the
 * buyer changes their address / VAT id after the checkout preview.
 */
export interface TaxCalculationInput {
  customerId: string;
  netAmountCents: number;
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry: string;
  productKind?: 'digital' | 'physical' | 'service';
  currency?: string;
}

export interface PaddleBillingAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Drive a full inline checkout session creation — RP creates a Paddle
   * transaction (real API or mock), calculates tax inline, and returns the
   * checkout id + inline URL + transaction id + tax preview. Both adapters
   * must return the same shape so fidelity axes (checkout id format / URL
   * shape / tax presence) can be compared.
   */
  checkout(input: CheckoutInput): Promise<CheckoutResult>;

  /**
   * Verify the webhook signature + dispatch to any registered handlers. Real
   * Paddle: HMAC-SHA256 over `{ts}:{body}`. Both adapters return the verify
   * result verbatim so signature verify fidelity can be diffed byte-for-byte
   * on the failure paths (bad-signature / stale-timestamp / malformed-body).
   */
  receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult>;

  /**
   * Snapshot every persisted subscription the RP is currently tracking.
   */
  listSubscriptions(): SemanticSubscription[];

  /**
   * Snapshot every persisted transaction.
   */
  listTransactions(): SemanticInvoice[];

  /**
   * Snapshot every persisted tax record (for the tax UI).
   */
  listTaxRecords(): { customerId: string; line: TaxLine; createdAt: number }[];

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
   * Look up a transaction by id.
   */
  getTransaction(id: string): SemanticInvoice | null;

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
   * Draft a new transaction. Real Paddle:
   * `paddle.transactions.create({ status: 'draft', ... })`. Both mock and
   * real must persist in the same shape so the transaction list UI reads
   * the same data.
   */
  draftTransaction(input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticInvoice>;

  /**
   * Transition a transaction through its lifecycle. Same semantics as the
   * `packages/payment` layer — guarded state transitions, throws on invalid.
   */
  openTransaction(transactionId: string): Promise<SemanticInvoice>;
  payTransaction(transactionId: string): Promise<SemanticInvoice>;
  voidTransaction(transactionId: string): Promise<SemanticInvoice>;
  markTransactionUncollectible(transactionId: string): Promise<SemanticInvoice>;
  creditNote(input: CreditNoteInput): Promise<SemanticInvoice>;

  /**
   * Recompute tax for an existing customer (called by the tax UI when the
   * buyer address changes). Emits `tax.calculated` / `tax.reverse_charged`
   * / `tax.exempted` depending on the outcome and appends to the tax record
   * list.
   */
  calculateTax(input: TaxCalculationInput): Promise<TaxLine>;

  /**
   * Start a dunning session for an open transaction. Emits nothing at start
   * — subsequent `runDunningAttempt` + `finalizeDunning` calls emit the
   * actual webhook events.
   */
  startDunningForTransaction(transactionId: string): Promise<DunningSession>;

  /**
   * Run one dunning retry attempt. Emits `dunning.attempt`.
   */
  runDunningAttempt(transactionId: string): Promise<DunningSession>;

  /**
   * Terminal dunning step — mark recovered (succeed=true) or exhausted
   * (succeed=false). Emits `dunning.recovered` or `dunning.exhausted`.
   */
  finalizeDunning(transactionId: string, succeed: boolean): Promise<DunningSession>;

  reset(): Promise<void>;
}
