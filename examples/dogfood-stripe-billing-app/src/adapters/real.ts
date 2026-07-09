/**
 * Real adapter — drives a real Stripe integration or a Stripe testcontainers
 * mock server. On systems without `STRIPE_KEY` set or without `KIWA_MODE=real`
 * the adapter refuses to run and every method reports
 * `KIWA_STRIPE_ENV_MISSING`. Downstream tests inspect
 * {@link StripeBillingAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full real Stripe wiring lands in v1.23-2b (Sub-Issue): a Stripe
 * testcontainers fixture that boots `stripe-mock` (Stripe's OpenAPI-driven
 * mock server) inside a container and exercises the checkout / webhook /
 * subscription / invoice endpoints against it. Sub-Issue #901 (this one)
 * lands the env-detect skeleton so the fidelity harness can uniformly drive
 * both adapters even when only the mock has an actual body.
 */

import type {
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  ThreeDsSession,
  ThreeDsTransStatus,
  DunningSession,
} from '@kiwa-lab/payment';
import type {
  CheckoutInput,
  CheckoutResult,
  CreditNoteInput,
  StripeBillingAdapter,
  SubscriptionPlanChangeInput,
  TraceEvent,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_STRIPE_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Stripe endpoint
 * (`https://api.stripe.com` in real mode, or a `stripe-mock` testcontainers
 * instance in dev). Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate `TraceEvent.errorKind`).
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching Stripe.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // KIWA_MODE must be `real` — anything else keeps the mock in play.
  if (process.env['KIWA_MODE'] !== 'real') return 'KIWA_MODE not real';
  // Real Stripe API requires an authentication key.
  if (!process.env['STRIPE_KEY']) return 'STRIPE_KEY unset';
  // Stripe webhooks require a shared secret to verify signatures.
  if (!process.env['STRIPE_WEBHOOK_SECRET']) return 'STRIPE_WEBHOOK_SECRET unset';
  // The `KIWA_STRIPE_REAL_READY=1` env flag opts in to real API calls once the
  // testcontainers wiring is in place. Until it is set every operation errors
  // out with MISSING_ENV_ERROR — v1.23-2b will ship the testcontainers fixture
  // that flips the flag inside the test setup.
  if (process.env['KIWA_STRIPE_REAL_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): StripeBillingAdapter {
  const trace: TraceEvent[] = [];
  const subscriptions = new Map<string, SemanticSubscription>();
  const invoices = new Map<string, SemanticInvoice>();
  const events: PaymentWebhookEvent[] = [];

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: reason });
    return new Error(`makeRealAdapter.${op}: ${reason}`);
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async checkout(_input: CheckoutInput): Promise<CheckoutResult> {
      throw envError('checkout');
    },

    async receiveWebhook(_input: WebhookReceiveInput): Promise<WebhookReceiveResult> {
      throw envError('receiveWebhook');
    },

    listSubscriptions(): SemanticSubscription[] {
      const list = Array.from(subscriptions.values());
      record('reset', true, { detail: { count: list.length } });
      return list;
    },

    listInvoices(): SemanticInvoice[] {
      return Array.from(invoices.values());
    },

    eventsEmitted(): PaymentWebhookEvent[] {
      return [...events];
    },

    getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },

    getInvoice(id) {
      return invoices.get(id) ?? null;
    },

    async changePlan(_input: SubscriptionPlanChangeInput): Promise<SemanticSubscription> {
      throw envError('upgradeSubscription');
    },

    async pauseSubscription(_id): Promise<SemanticSubscription> {
      throw envError('pauseSubscription');
    },

    async resumeSubscription(_id): Promise<SemanticSubscription> {
      throw envError('resumeSubscription');
    },

    async cancelSubscription(_id): Promise<SemanticSubscription> {
      throw envError('cancelSubscription');
    },

    async reactivateSubscription(_id): Promise<SemanticSubscription> {
      throw envError('reactivateSubscription');
    },

    async draftInvoice(_input): Promise<SemanticInvoice> {
      throw envError('draftInvoice');
    },

    async openInvoice(_id): Promise<SemanticInvoice> {
      throw envError('openInvoice');
    },

    async payInvoice(_id): Promise<SemanticInvoice> {
      throw envError('payInvoice');
    },

    async voidInvoice(_id): Promise<SemanticInvoice> {
      throw envError('voidInvoice');
    },

    async markInvoiceUncollectible(_id): Promise<SemanticInvoice> {
      throw envError('markUncollectible');
    },

    async creditNote(_input: CreditNoteInput): Promise<SemanticInvoice> {
      throw envError('creditNoteInvoice');
    },

    async submitThreeDs(_paymentIntentId, _transStatus: ThreeDsTransStatus): Promise<ThreeDsSession> {
      throw envError('threeDsSubmit');
    },

    async startDunningForInvoice(_invoiceId): Promise<DunningSession> {
      throw envError('startDunning');
    },

    async runDunningAttempt(_invoiceId): Promise<DunningSession> {
      throw envError('dunningAttempt');
    },

    async finalizeDunning(_invoiceId, _succeed): Promise<DunningSession> {
      throw envError('finalizeDunning');
    },

    async reset(): Promise<void> {
      subscriptions.clear();
      invoices.clear();
      events.length = 0;
      trace.length = 0;
      record('reset', true);
    },
  };
}
