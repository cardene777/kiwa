/**
 * Real adapter — drives a real Paddle sandbox integration. On systems
 * without `PADDLE_KEY` set or without `KIWA_MODE=real` the adapter refuses
 * to run and every method reports `KIWA_PADDLE_ENV_MISSING`. Downstream
 * tests inspect {@link PaddleBillingAdapter.mode} + the trace to skip real
 * assertions on those systems.
 *
 * The full real Paddle sandbox wiring lands in v1.23-3b (follow-up
 * Sub-Issue): a Paddle sandbox fixture that boots a live sandbox tenant and
 * exercises the transaction / webhook / subscription endpoints against it.
 * v1.23-3 (this one) lands the env-detect skeleton so the fidelity harness
 * can uniformly drive both adapters even when only the mock has an actual
 * body.
 */

import type {
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  DunningSession,
  TaxLine,
} from '@kiwa/payment';
import type {
  CheckoutInput,
  CheckoutResult,
  CreditNoteInput,
  PaddleBillingAdapter,
  SubscriptionPlanChangeInput,
  TaxCalculationInput,
  TraceEvent,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_PADDLE_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Paddle sandbox
 * endpoint (`https://sandbox-api.paddle.com` in real mode). Returns `null`
 * on capable systems, or a short reason string when the env is missing
 * (used to populate `TraceEvent.errorKind`).
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching Paddle sandbox.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (process.env['KIWA_MODE'] !== 'real') return 'KIWA_MODE not real';
  // Real Paddle API requires an API key.
  if (!process.env['PADDLE_KEY']) return 'PADDLE_KEY unset';
  // Paddle webhooks require a shared notification secret to verify
  // `Paddle-Signature: ts=..;h1=..` headers.
  if (!process.env['PADDLE_NOTIFICATION_SECRET']) return 'PADDLE_NOTIFICATION_SECRET unset';
  // The `KIWA_PADDLE_REAL_READY=1` env flag opts in to real API calls once
  // the sandbox wiring is in place. Until it is set every operation errors
  // out with MISSING_ENV_ERROR — v1.23-3b will ship the sandbox fixture
  // that flips the flag inside the test setup.
  if (process.env['KIWA_PADDLE_REAL_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): PaddleBillingAdapter {
  const trace: TraceEvent[] = [];
  const subscriptions = new Map<string, SemanticSubscription>();
  const transactions = new Map<string, SemanticInvoice>();
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
      return Array.from(subscriptions.values());
    },

    listTransactions(): SemanticInvoice[] {
      return Array.from(transactions.values());
    },

    listTaxRecords() {
      return [];
    },

    eventsEmitted(): PaymentWebhookEvent[] {
      return [...events];
    },

    getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },

    getTransaction(id) {
      return transactions.get(id) ?? null;
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

    async draftTransaction(_input): Promise<SemanticInvoice> {
      throw envError('draftTransaction');
    },

    async openTransaction(_id): Promise<SemanticInvoice> {
      throw envError('openTransaction');
    },

    async payTransaction(_id): Promise<SemanticInvoice> {
      throw envError('payTransaction');
    },

    async voidTransaction(_id): Promise<SemanticInvoice> {
      throw envError('voidTransaction');
    },

    async markTransactionUncollectible(_id): Promise<SemanticInvoice> {
      throw envError('markUncollectible');
    },

    async creditNote(_input: CreditNoteInput): Promise<SemanticInvoice> {
      throw envError('creditNoteTransaction');
    },

    async calculateTax(_input: TaxCalculationInput): Promise<TaxLine> {
      throw envError('calculateTax');
    },

    async startDunningForTransaction(_transactionId): Promise<DunningSession> {
      throw envError('startDunning');
    },

    async runDunningAttempt(_transactionId): Promise<DunningSession> {
      throw envError('dunningAttempt');
    },

    async finalizeDunning(_transactionId, _succeed): Promise<DunningSession> {
      throw envError('finalizeDunning');
    },

    async reset(): Promise<void> {
      subscriptions.clear();
      transactions.clear();
      events.length = 0;
      trace.length = 0;
      record('reset', true);
    },
  };
}
