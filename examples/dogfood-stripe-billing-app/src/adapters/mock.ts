/**
 * Mock adapter — drives `@kiwa-test/payment`'s `createStripeMock` +
 * the 9-axis semantics helpers so the same app code exercises a
 * deterministic Stripe billing envelope without touching the real Stripe
 * API. Both mock and real adapters satisfy {@link StripeBillingAdapter}, so
 * the fidelity harness can diff them side-by-side.
 *
 * The mock uses the deterministic `whsec_kiwa_stripe` secret + Date.now as
 * the clock source. Sub-Issue #857 (v1.21-2b) will let the real adapter
 * inject a testcontainers Stripe instance for real-vs-mock byte-for-byte
 * diffs.
 */

import { createStripeMock } from '@kiwa-test/payment';
import type {
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  ThreeDsSession,
  ThreeDsTransStatus,
  DunningSession,
} from '@kiwa-test/payment';
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
import { createStripeAxisRuntime, type StripeAxisRuntime } from '../lib/stripe-adapter.js';

export interface MakeMockAdapterOptions {
  /**
   * Override the mock secret. Real Stripe deployments use `whsec_*` values
   * from the dashboard; the default matches what `createStripeMock()` uses so
   * `signWebhook` output can be verified in the same call.
   */
  secret?: string;
  /**
   * Override the tolerance window (ms) for signature verification. Default 5
   * min matches real Stripe's tolerance for replay protection.
   */
  toleranceMs?: number;
  /**
   * Override the clock — real Stripe uses ms since epoch, but tests inject a
   * fixed `now` so signature values are reproducible.
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
  // invoice guards
  if (message.includes('cannot void')) return 'invoice_cannot_void';
  if (message.includes('must be paid')) return 'invoice_not_paid';
  if (message.includes('exceeds invoice')) return 'credit_exceeds_invoice';
  if (message.includes('creditAmountCents must be > 0')) return 'credit_non_positive';
  // 3ds guards
  if (message.includes('threeDs')) return 'threeds_wrong_state';
  // dunning guards
  if (message.includes('dunning')) return 'dunning_wrong_state';
  // generic not-found
  if (message.includes('not found')) return 'entity_not_found';
  return `${op}_failed`;
}

/**
 * Build a mock adapter satisfying {@link StripeBillingAdapter}. Delegates
 * every operation to the axis runtime, appends trace entries, and translates
 * semantics-layer errors to stable errorKinds.
 */
export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): StripeBillingAdapter & {
  /** Escape hatch for tests that need to inspect the raw runtime. */
  readonly runtime: () => StripeAxisRuntime;
} {
  const trace: TraceEvent[] = [];
  const paymentAdapter = createStripeMock({
    ...(opts.secret !== undefined ? { secret: opts.secret } : {}),
    ...(opts.toleranceMs !== undefined ? { toleranceMs: opts.toleranceMs } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const runtime = createStripeAxisRuntime(paymentAdapter);

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
      try {
        const result = await runtime.createCheckout(input);
        record('checkout', true, {
          detail: {
            sessionId: result.sessionId,
            paymentIntentId: result.paymentIntentId,
            requiresThreeDs: input.requiresThreeDs === true,
          },
        });
        return {
          sessionId: result.sessionId,
          paymentIntentId: result.paymentIntentId,
          url: result.url,
          amountCents: result.amountCents,
          currency: result.currency,
          status: result.status,
          ...(result.threeDs ? { threeDs: result.threeDs } : {}),
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
        // Idempotent delivery — real Stripe deduplicates on event.id at the
        // Stripe side. The mock dispatches unconditionally; the effect
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
    listInvoices(): SemanticInvoice[] {
      return runtime.store.listInvoices();
    },
    eventsEmitted(): PaymentWebhookEvent[] {
      return runtime.store.eventsEmitted();
    },
    getSubscription(id) {
      return runtime.store.getSubscription(id);
    },
    getInvoice(id) {
      return runtime.store.getInvoice(id);
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

    async draftInvoice(input) {
      try {
        const result = await runtime.draftInvoice(input);
        record('draftInvoice', true, {
          detail: { invoiceId: result.id, amountCents: result.amountCents },
        });
        return result;
      } catch (err) {
        record('draftInvoice', false, { errorKind: classifyError(err, 'draftInvoice') });
        throw err;
      }
    },

    async openInvoice(id) {
      try {
        const result = await runtime.openInvoice(id);
        record('openInvoice', true, { detail: { invoiceId: id } });
        return result;
      } catch (err) {
        record('openInvoice', false, { errorKind: classifyError(err, 'openInvoice') });
        throw err;
      }
    },

    async payInvoice(id) {
      try {
        const result = await runtime.payInvoice(id);
        record('payInvoice', true, { detail: { invoiceId: id } });
        return result;
      } catch (err) {
        record('payInvoice', false, { errorKind: classifyError(err, 'payInvoice') });
        throw err;
      }
    },

    async voidInvoice(id) {
      try {
        const result = await runtime.voidInvoice(id);
        record('voidInvoice', true, { detail: { invoiceId: id } });
        return result;
      } catch (err) {
        record('voidInvoice', false, { errorKind: classifyError(err, 'voidInvoice') });
        throw err;
      }
    },

    async markInvoiceUncollectible(id) {
      try {
        const result = await runtime.markUncollectible(id);
        record('markUncollectible', true, { detail: { invoiceId: id } });
        return result;
      } catch (err) {
        record('markUncollectible', false, { errorKind: classifyError(err, 'markUncollectible') });
        throw err;
      }
    },

    async creditNote(input: CreditNoteInput) {
      try {
        const result = await runtime.creditNote(input);
        record('creditNoteInvoice', true, {
          detail: { invoiceId: input.invoiceId, creditAmountCents: input.creditAmountCents },
        });
        return result;
      } catch (err) {
        record('creditNoteInvoice', false, { errorKind: classifyError(err, 'creditNoteInvoice') });
        throw err;
      }
    },

    async submitThreeDs(paymentIntentId, transStatus: ThreeDsTransStatus): Promise<ThreeDsSession> {
      try {
        const result = await runtime.submitThreeDs(paymentIntentId, transStatus);
        const isFrictionless = result.state === 'frictionless';
        record(isFrictionless ? 'threeDsFrictionless' : 'threeDsSubmit', true, {
          detail: {
            paymentIntentId,
            transStatus,
            finalState: result.state,
          },
        });
        return result;
      } catch (err) {
        record('threeDsSubmit', false, {
          errorKind: classifyError(err, 'threeDsSubmit'),
          detail: { paymentIntentId },
        });
        throw err;
      }
    },

    async startDunningForInvoice(invoiceId): Promise<DunningSession> {
      const invoice = runtime.store.getInvoice(invoiceId);
      if (!invoice) {
        record('startDunning', false, {
          errorKind: 'entity_not_found',
          detail: { invoiceId },
        });
        throw new Error(`startDunningForInvoice: invoice ${invoiceId} not found`);
      }
      try {
        const input: Parameters<StripeAxisRuntime['startDunning']>[0] = {
          invoiceId: invoice.id,
          amountCents: invoice.amountCents,
          customerId: invoice.customerId,
        };
        if (invoice.currency !== undefined) input.currency = invoice.currency;
        const session = await runtime.startDunning(input);
        record('startDunning', true, {
          detail: { invoiceId, maxAttempts: session.config.maxAttempts },
        });
        return session;
      } catch (err) {
        record('startDunning', false, { errorKind: classifyError(err, 'startDunning') });
        throw err;
      }
    },

    async runDunningAttempt(invoiceId): Promise<DunningSession> {
      try {
        const session = await runtime.runDunningAttempt(invoiceId);
        record('dunningAttempt', true, {
          detail: { invoiceId, attempt: session.attempt, state: session.state },
        });
        return session;
      } catch (err) {
        record('dunningAttempt', false, { errorKind: classifyError(err, 'dunningAttempt') });
        throw err;
      }
    },

    async finalizeDunning(invoiceId, succeed): Promise<DunningSession> {
      try {
        const session = await runtime.finalizeDunningSession(invoiceId, succeed);
        record('finalizeDunning', true, {
          detail: { invoiceId, state: session.state, succeed },
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
 * Derive the domain effect (subscription / invoice / 3ds / dunning) a webhook
 * event triggered. Real Stripe deployments would trigger downstream mutation
 * on receipt; the dogfood mock treats the event log as SSOT (semantics helpers
 * already applied the mutation before the emit), so this is a read-side
 * classification only.
 *
 * The classification walks the provider dialect (Stripe:
 * `customer.subscription.created`, Paddle: `subscription.created`, Lemon
 * Squeezy: `subscription_created`) — a substring / underscore-normalised
 * match is enough since the 3 provider dialects have disjoint keyword
 * families for each axis.
 */
function deriveEffect(event: PaymentWebhookEvent): {
  kind: 'subscription' | 'invoice' | 'checkout' | '3ds' | 'dunning';
  entityId: string;
  newState?: string | undefined;
} | undefined {
  const type = event.type;
  const lower = type.toLowerCase();
  // Order matters — check subscription before dunning because Stripe's
  // dunning webhooks are `invoice.payment_failed` etc, which look like an
  // invoice event but the semantics layer emits them under the dunning axis.
  // The neutral event name is not carried on the webhook payload though, so
  // we fall back to keyword classification. Prefer `invoice.` prefix →
  // invoice kind; only classify as dunning when the caller wired the neutral
  // name explicitly (dogfood mock does not emit dunning via receiveWebhook).
  if (lower.includes('subscription')) {
    // Strip family prefix to get a short state hint (`created` / `updated` /
    // `paused` / `resumed` / `canceled`). Works across all 3 providers.
    const state = lastToken(type);
    return {
      kind: 'subscription',
      entityId: `sub_${event.id}`,
      newState: state,
    };
  }
  if (lower.includes('invoice') || lower.includes('transaction') || lower.includes('order')) {
    return {
      kind: 'invoice',
      entityId: `inv_${event.id}`,
      newState: lastToken(type),
    };
  }
  if (lower.includes('payment_intent') || lower.includes('3ds')) {
    return {
      kind: '3ds',
      entityId: event.customerId,
      newState: lastToken(type),
    };
  }
  if (lower.includes('mandate') || lower.includes('payment_method')) {
    // PSD2 axis surfaces as mandate events on Stripe / payment_method on
    // Paddle & Lemon Squeezy. Group as `invoice` for effect kind because
    // downstream tests treat mandate as billing-side effect.
    return {
      kind: 'invoice',
      entityId: event.customerId,
      newState: lastToken(type),
    };
  }
  if (lower.includes('dispute') || lower.includes('chargeback')) {
    return {
      kind: 'invoice',
      entityId: `inv_${event.id}`,
      newState: lastToken(type),
    };
  }
  return undefined;
}

/**
 * Grab the last path token from a provider event name, split on `.` or `_`,
 * so `customer.subscription.created` → `created`, `subscription_created` →
 * `created`, `invoice.payment_failed` → `failed`.
 */
function lastToken(name: string): string {
  const parts = name.split(/[._]/);
  return parts[parts.length - 1] ?? name;
}
