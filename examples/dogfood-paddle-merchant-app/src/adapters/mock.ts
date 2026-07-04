/**
 * Mock adapter — drives `@kiwa-test/payment`'s `createPaddleMock` + the
 * 9-axis semantics helpers so the same app code exercises a deterministic
 * Paddle Billing v2 envelope without touching the real Paddle API.
 *
 * Both mock and real adapters satisfy {@link PaddleBillingAdapter}, so the
 * fidelity harness can diff them side-by-side.
 *
 * The mock uses the deterministic `pdl_ntfset_kiwa_paddle` notification
 * secret + Date.now as the clock source. v1.23-3b (follow-up) will let the
 * real adapter inject a Paddle sandbox instance for real-vs-mock diffs.
 */

import { createPaddleMock } from '@kiwa-test/payment';
import type {
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  DunningSession,
  TaxLine,
} from '@kiwa-test/payment';
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
import { createPaddleAxisRuntime, type PaddleAxisRuntime } from '../lib/paddle-adapter.js';

export interface MakeMockAdapterOptions {
  /**
   * Override the mock notification secret. Real Paddle deployments use
   * `pdl_ntfset_*` values from the dashboard; the default matches what
   * `createPaddleMock()` uses so `signWebhook` output can be verified in
   * the same call.
   */
  secret?: string;
  /**
   * Override the tolerance window (ms) for signature verification. Default
   * 5 min matches real Paddle's tolerance for replay protection.
   */
  toleranceMs?: number;
  /**
   * Override the clock — real Paddle uses ms since epoch, but tests inject
   * a fixed `now` so signature values are reproducible.
   */
  now?: () => number;
}

/**
 * Map a semantics-layer rejection to a stable trace `errorKind`. Sub-Issue
 * downstream tests assert on these — keeping the mapping in one place lets
 * later Sub-Issues extend it without editing every test.
 */
function classifyError(err: unknown, op: TraceEvent['op']): string {
  const message = err instanceof Error ? err.message : String(err);
  // subscription-lifecycle guards
  if (message.includes('is canceled')) return 'subscription_canceled';
  if (message.includes('is paused')) return 'subscription_paused';
  if (message.includes('newAmountCents equals current amountCents')) return 'plan_change_noop';
  if (message.includes('already canceled')) return 'subscription_already_canceled';
  if (message.includes('resumeSubscription') && message.includes('is')) return 'resume_wrong_state';
  if (message.includes('reactivateSubscription') && message.includes('is')) return 'reactivate_wrong_state';
  // invoice/transaction guards
  if (message.includes('cannot void')) return 'transaction_cannot_void';
  if (message.includes('must be paid')) return 'transaction_not_paid';
  if (message.includes('exceeds invoice')) return 'credit_exceeds_transaction';
  if (message.includes('creditAmountCents must be > 0')) return 'credit_non_positive';
  // dunning guards
  if (message.includes('dunning')) return 'dunning_wrong_state';
  // generic not-found
  if (message.includes('not found')) return 'entity_not_found';
  return `${op}_failed`;
}

/**
 * Build a mock adapter satisfying {@link PaddleBillingAdapter}. Delegates
 * every operation to the axis runtime, appends trace entries, and translates
 * semantics-layer errors to stable errorKinds.
 */
export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): PaddleBillingAdapter & {
  /** Escape hatch for tests that need to inspect the raw runtime. */
  readonly runtime: () => PaddleAxisRuntime;
} {
  const trace: TraceEvent[] = [];
  const paymentAdapter = createPaddleMock({
    ...(opts.secret !== undefined ? { secret: opts.secret } : {}),
    ...(opts.toleranceMs !== undefined ? { toleranceMs: opts.toleranceMs } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const runtime = createPaddleAxisRuntime(paymentAdapter);

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],
    runtime: () => runtime,

    async checkout(input: CheckoutInput): Promise<CheckoutResult> {
      if (input.amountCents <= 0) {
        record('checkout', false, { errorKind: 'invalid_amount' });
        throw new Error(`checkout: amountCents must be > 0 (got ${input.amountCents})`);
      }
      if (!input.buyerCountry) {
        record('checkout', false, { errorKind: 'missing_buyer_country' });
        throw new Error('checkout: buyerCountry is required for Paddle Merchant-of-Record tax calculation');
      }
      try {
        const runtimeInput: Parameters<PaddleAxisRuntime['createCheckout']>[0] = {
          customerId: input.customerId,
          priceId: input.priceId,
          planId: input.planId,
          amountCents: input.amountCents,
          buyerCountry: input.buyerCountry,
        };
        if (input.currency !== undefined) runtimeInput.currency = input.currency;
        if (input.buyerVatId !== undefined) runtimeInput.buyerVatId = input.buyerVatId;
        if (input.merchantCountry !== undefined) runtimeInput.merchantCountry = input.merchantCountry;
        if (input.productKind !== undefined) runtimeInput.productKind = input.productKind;
        if (input.successUrl !== undefined) runtimeInput.successUrl = input.successUrl;
        const result = await runtime.createCheckout(runtimeInput);
        record('checkout', true, {
          detail: {
            checkoutId: result.checkoutId,
            transactionId: result.transactionId,
            taxCents: result.taxLine.taxCents,
            taxKind: result.taxLine.kind,
          },
        });
        return {
          checkoutId: result.checkoutId,
          transactionId: result.transactionId,
          url: result.url,
          amountCents: result.amountCents,
          currency: result.currency,
          status: result.status,
          taxLine: result.taxLine,
          mode: 'mock',
        };
      } catch (err) {
        record('checkout', false, { errorKind: classifyError(err, 'checkout') });
        throw err;
      }
    },

    async receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult> {
      try {
        const verifyInput: Parameters<typeof paymentAdapter.verifyWebhook>[0] = {
          rawBody: input.rawBody,
          signature: input.signature,
        };
        if (input.toleranceMs !== undefined) verifyInput.toleranceMs = input.toleranceMs;
        const verify = paymentAdapter.verifyWebhook(verifyInput);
        if (!verify.ok || !verify.event) {
          record('receiveWebhook', false, {
            errorKind: verify.reason,
            detail: { reason: verify.reason },
          });
          return { verify, dispatched: false };
        }
        // Idempotent delivery — real Paddle deduplicates on notification id
        // at their side. The mock dispatches unconditionally; the effect
        // captures the id so downstream tests can assert on idempotency.
        await paymentAdapter.emit(verify.event);
        const effect = deriveEffect(verify.event);
        record('receiveWebhook', true, {
          detail: {
            eventId: verify.event.id,
            eventType: verify.event.type,
            effect: effect?.kind,
          },
        });
        return {
          verify,
          dispatched: true,
          ...(effect ? { effect } : {}),
        };
      } catch (err) {
        record('receiveWebhook', false, { errorKind: classifyError(err, 'receiveWebhook') });
        throw err;
      }
    },

    listSubscriptions(): SemanticSubscription[] {
      return runtime.store.listSubscriptions();
    },
    listTransactions(): SemanticInvoice[] {
      return runtime.store.listTransactions();
    },
    listTaxRecords() {
      return runtime.store.listTax().map((r) => ({
        customerId: r.customerId,
        line: r.line,
        createdAt: r.createdAt,
      }));
    },
    eventsEmitted(): PaymentWebhookEvent[] {
      return runtime.store.eventsEmitted();
    },
    getSubscription(id) {
      return runtime.store.getSubscription(id);
    },
    getTransaction(id) {
      return runtime.store.getTransaction(id);
    },

    async changePlan(input: SubscriptionPlanChangeInput): Promise<SemanticSubscription> {
      try {
        const result = await runtime.changePlan(input);
        const opKind = result.state === 'downgraded' ? 'downgradeSubscription' : 'upgradeSubscription';
        record(opKind, true, {
          detail: {
            subscriptionId: result.id,
            newPlanId: input.newPlanId,
            newAmountCents: input.newAmountCents,
            state: result.state,
          },
        });
        return result;
      } catch (err) {
        record('upgradeSubscription', false, {
          errorKind: classifyError(err, 'upgradeSubscription'),
          detail: { subscriptionId: input.subscriptionId },
        });
        throw err;
      }
    },

    async pauseSubscription(id) {
      try {
        const result = await runtime.pauseSubscription(id);
        record('pauseSubscription', true, { detail: { subscriptionId: id } });
        return result;
      } catch (err) {
        record('pauseSubscription', false, { errorKind: classifyError(err, 'pauseSubscription') });
        throw err;
      }
    },

    async resumeSubscription(id) {
      try {
        const result = await runtime.resumeSubscription(id);
        record('resumeSubscription', true, { detail: { subscriptionId: id } });
        return result;
      } catch (err) {
        record('resumeSubscription', false, { errorKind: classifyError(err, 'resumeSubscription') });
        throw err;
      }
    },

    async cancelSubscription(id) {
      try {
        const result = await runtime.cancelSubscription(id);
        record('cancelSubscription', true, { detail: { subscriptionId: id } });
        return result;
      } catch (err) {
        record('cancelSubscription', false, { errorKind: classifyError(err, 'cancelSubscription') });
        throw err;
      }
    },

    async reactivateSubscription(id) {
      try {
        const result = await runtime.reactivateSubscription(id);
        record('reactivateSubscription', true, { detail: { subscriptionId: id } });
        return result;
      } catch (err) {
        record('reactivateSubscription', false, {
          errorKind: classifyError(err, 'reactivateSubscription'),
        });
        throw err;
      }
    },

    async draftTransaction(input) {
      try {
        const result = await runtime.draftTransaction(input);
        record('draftTransaction', true, {
          detail: { transactionId: result.id, amountCents: result.amountCents },
        });
        return result;
      } catch (err) {
        record('draftTransaction', false, { errorKind: classifyError(err, 'draftTransaction') });
        throw err;
      }
    },

    async openTransaction(id) {
      try {
        const result = await runtime.openTransaction(id);
        record('openTransaction', true, { detail: { transactionId: id } });
        return result;
      } catch (err) {
        record('openTransaction', false, { errorKind: classifyError(err, 'openTransaction') });
        throw err;
      }
    },

    async payTransaction(id) {
      try {
        const result = await runtime.payTransaction(id);
        record('payTransaction', true, { detail: { transactionId: id } });
        return result;
      } catch (err) {
        record('payTransaction', false, { errorKind: classifyError(err, 'payTransaction') });
        throw err;
      }
    },

    async voidTransaction(id) {
      try {
        const result = await runtime.voidTransaction(id);
        record('voidTransaction', true, { detail: { transactionId: id } });
        return result;
      } catch (err) {
        record('voidTransaction', false, { errorKind: classifyError(err, 'voidTransaction') });
        throw err;
      }
    },

    async markTransactionUncollectible(id) {
      try {
        const result = await runtime.markUncollectible(id);
        record('markUncollectible', true, { detail: { transactionId: id } });
        return result;
      } catch (err) {
        record('markUncollectible', false, { errorKind: classifyError(err, 'markUncollectible') });
        throw err;
      }
    },

    async creditNote(input: CreditNoteInput) {
      try {
        const result = await runtime.creditNote(input);
        record('creditNoteTransaction', true, {
          detail: { transactionId: input.transactionId, creditAmountCents: input.creditAmountCents },
        });
        return result;
      } catch (err) {
        record('creditNoteTransaction', false, { errorKind: classifyError(err, 'creditNoteTransaction') });
        throw err;
      }
    },

    async calculateTax(input: TaxCalculationInput): Promise<TaxLine> {
      try {
        const line = await runtime.calculateAndEmitTax(input);
        record('calculateTax', true, {
          detail: {
            customerId: input.customerId,
            buyerCountry: input.buyerCountry,
            taxKind: line.kind,
            taxCents: line.taxCents,
            reverseCharged: line.reverseCharged,
            exempt: line.exempt,
          },
        });
        return line;
      } catch (err) {
        record('calculateTax', false, { errorKind: classifyError(err, 'calculateTax') });
        throw err;
      }
    },

    async startDunningForTransaction(transactionId): Promise<DunningSession> {
      const txn = runtime.store.getTransaction(transactionId);
      if (!txn) {
        record('startDunning', false, {
          errorKind: 'entity_not_found',
          detail: { transactionId },
        });
        throw new Error(`startDunningForTransaction: transaction ${transactionId} not found`);
      }
      try {
        const input: Parameters<PaddleAxisRuntime['startDunning']>[0] = {
          invoiceId: txn.id,
          amountCents: txn.amountCents,
          customerId: txn.customerId,
        };
        if (txn.currency !== undefined) input.currency = txn.currency;
        const session = await runtime.startDunning(input);
        record('startDunning', true, {
          detail: { transactionId, maxAttempts: session.config.maxAttempts },
        });
        return session;
      } catch (err) {
        record('startDunning', false, { errorKind: classifyError(err, 'startDunning') });
        throw err;
      }
    },

    async runDunningAttempt(transactionId): Promise<DunningSession> {
      try {
        const session = await runtime.runDunningAttempt(transactionId);
        record('dunningAttempt', true, {
          detail: { transactionId, attempt: session.attempt, state: session.state },
        });
        return session;
      } catch (err) {
        record('dunningAttempt', false, { errorKind: classifyError(err, 'dunningAttempt') });
        throw err;
      }
    },

    async finalizeDunning(transactionId, succeed): Promise<DunningSession> {
      try {
        const session = await runtime.finalizeDunningSession(transactionId, succeed);
        record('finalizeDunning', true, {
          detail: { transactionId, state: session.state, succeed },
        });
        return session;
      } catch (err) {
        record('finalizeDunning', false, { errorKind: classifyError(err, 'finalizeDunning') });
        throw err;
      }
    },

    async reset(): Promise<void> {
      runtime.store.reset();
      trace.length = 0;
      record('reset', true);
    },
  };
}

/**
 * Derive the domain effect (subscription / transaction / tax / dunning) a
 * webhook event triggered. Paddle-specific: `subscription.*` +
 * `transaction.*` + `adjustment.*` are the main envelope, plus tax events
 * surface as `transaction.updated` in real Paddle.
 */
function deriveEffect(event: PaymentWebhookEvent): {
  kind: 'subscription' | 'transaction' | 'checkout' | 'tax' | 'dunning';
  entityId: string;
  newState?: string | undefined;
} | undefined {
  const type = event.type;
  const lower = type.toLowerCase();
  if (lower.includes('subscription')) {
    const state = lastToken(type);
    return {
      kind: 'subscription',
      entityId: `sub_${event.id}`,
      newState: state,
    };
  }
  if (lower.includes('adjustment')) {
    // Paddle credit note ⇒ adjustment.created — classify as transaction
    // effect since downstream tests treat it as billing-side.
    return {
      kind: 'transaction',
      entityId: `txn_${event.id}`,
      newState: 'credit_noted',
    };
  }
  if (lower.includes('transaction')) {
    return {
      kind: 'transaction',
      entityId: `txn_${event.id}`,
      newState: lastToken(type),
    };
  }
  if (lower.includes('payment_method') || lower.includes('mandate')) {
    // PSD2 surfaces via payment_method.saved / payment_method.deleted.
    return {
      kind: 'transaction',
      entityId: event.customerId,
      newState: lastToken(type),
    };
  }
  return undefined;
}

/**
 * Grab the last path token from a provider event name, split on `.` or `_`,
 * so `subscription.created` → `created`, `transaction.payment_failed` →
 * `failed`.
 */
function lastToken(name: string): string {
  const parts = name.split(/[._]/);
  return parts[parts.length - 1] ?? name;
}
