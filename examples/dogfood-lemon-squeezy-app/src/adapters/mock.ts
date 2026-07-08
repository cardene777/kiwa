/**
 * Mock adapter — drives `@kiwa/payment`'s `createLemonSqueezyMock` +
 * the 8-axis semantics helpers so the same app code exercises a
 * deterministic Lemon Squeezy envelope without touching the real Lemon
 * Squeezy API.
 *
 * Both mock and real adapters satisfy {@link LemonSqueezyDogfoodAdapter}, so
 * the fidelity harness can diff them side-by-side.
 *
 * The mock uses the deterministic `lswhs_kiwa_lemonsqueezy` signing secret
 * + Date.now as the clock source. v1.23-4b (follow-up) will let the real
 * adapter inject a Lemon Squeezy sandbox instance for real-vs-mock diffs.
 */

import { createLemonSqueezyMock } from '@kiwa/payment';
import type {
  Chargeback,
  DunningSession,
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
} from '@kiwa/payment';
import type {
  CheckoutInput,
  CheckoutResult,
  ChargebackEvidenceInput,
  ChargebackOpenInput,
  ChargebackResolveInput,
  LemonSqueezyDogfoodAdapter,
  LicenseActivateInput,
  LicenseIssueInput,
  LicenseRevokeInput,
  RefundInput,
  RefundResult,
  SubscriptionPlanChangeInput,
  TraceEvent,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from './interface.js';
import {
  createLemonSqueezyAxisRuntime,
  type LemonSqueezyAxisRuntime,
} from '../lib/lemonsqueezy-adapter.js';
import type { LicenseKeyRecord, RefundRecord } from '../lib/store.js';

export interface MakeMockAdapterOptions {
  /**
   * Override the mock webhook secret. Real Lemon Squeezy deployments use
   * per-store secrets from the dashboard; the default matches what
   * `createLemonSqueezyMock()` uses so `signWebhook` output can be verified
   * in the same call.
   */
  secret?: string;
  /**
   * Override the tolerance window (ms) for signature verification. Default
   * 5 min matches real Lemon Squeezy's tolerance for replay protection.
   */
  toleranceMs?: number;
  /**
   * Override the clock — real Lemon Squeezy uses ms since epoch, but tests
   * inject a fixed `now` so signature values are reproducible.
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
  // invoice/order guards
  if (message.includes('cannot void')) return 'order_cannot_void';
  if (message.includes('must be paid')) return 'order_not_paid';
  if (message.includes('exceeds invoice')) return 'refund_exceeds_order';
  if (message.includes('exceeds invoice amount')) return 'refund_exceeds_order';
  if (message.includes('refundAmountCents must be > 0')) return 'refund_non_positive';
  if (message.includes('creditAmountCents must be > 0')) return 'refund_non_positive';
  // license guards
  if (message.includes('activations limit reached')) return 'license_limit_reached';
  if (message.includes('already revoked')) return 'license_already_revoked';
  if (message.includes('instance') && message.includes('not found')) return 'license_instance_not_found';
  // chargeback guards
  // Order matters — resolveChargeback error message contains both "is" and
  // "submit evidence first", so check the more specific pattern first.
  if (message.includes('submit evidence first')) return 'chargeback_evidence_missing';
  if (message.includes('chargeback') && message.includes('is')) return 'chargeback_wrong_state';
  // dunning guards
  if (message.includes('dunning')) return 'dunning_wrong_state';
  // generic not-found
  if (message.includes('not found')) return 'entity_not_found';
  return `${op}_failed`;
}

/**
 * Build a mock adapter satisfying {@link LemonSqueezyDogfoodAdapter}.
 * Delegates every operation to the axis runtime, appends trace entries,
 * and translates semantics-layer errors to stable errorKinds.
 */
export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): LemonSqueezyDogfoodAdapter & {
  /** Escape hatch for tests that need to inspect the raw runtime. */
  readonly runtime: () => LemonSqueezyAxisRuntime;
} {
  const trace: TraceEvent[] = [];
  const paymentAdapter = createLemonSqueezyMock({
    ...(opts.secret !== undefined ? { secret: opts.secret } : {}),
    ...(opts.toleranceMs !== undefined ? { toleranceMs: opts.toleranceMs } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const runtime = createLemonSqueezyAxisRuntime(paymentAdapter);

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
      if (!input.storeId) {
        record('checkout', false, { errorKind: 'missing_store' });
        throw new Error('checkout: storeId is required for Lemon Squeezy hosted checkout');
      }
      if (!input.variantId) {
        record('checkout', false, { errorKind: 'missing_variant' });
        throw new Error('checkout: variantId is required for Lemon Squeezy hosted checkout');
      }
      try {
        const runtimeInput: Parameters<LemonSqueezyAxisRuntime['createCheckout']>[0] = {
          customerId: input.customerId,
          variantId: input.variantId,
          storeId: input.storeId,
          amountCents: input.amountCents,
        };
        if (input.currency !== undefined) runtimeInput.currency = input.currency;
        if (input.productKind !== undefined) runtimeInput.productKind = input.productKind;
        if (input.successUrl !== undefined) runtimeInput.successUrl = input.successUrl;
        const result = await runtime.createCheckout(runtimeInput);
        record('checkout', true, {
          detail: {
            checkoutId: result.checkoutId,
            orderId: result.orderId,
            productKind: result.productKind,
          },
        });
        return {
          checkoutId: result.checkoutId,
          orderId: result.orderId,
          url: result.url,
          amountCents: result.amountCents,
          currency: result.currency,
          status: result.status,
          productKind: result.productKind,
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
        // Idempotent delivery — real Lemon Squeezy deduplicates on
        // notification id at their side. The mock dispatches unconditionally;
        // the effect captures the id so downstream tests can assert on
        // idempotency.
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
    listOrders(): SemanticInvoice[] {
      return runtime.store.listOrders();
    },
    listCheckouts() {
      return runtime.store.listCheckouts().map((c) => ({
        checkoutId: c.checkoutId,
        orderId: c.orderId,
        customerId: c.customerId,
        amountCents: c.amountCents,
        currency: c.currency,
        status: c.status,
      }));
    },
    listLicenseKeys(): LicenseKeyRecord[] {
      return runtime.store.listLicenseKeys();
    },
    listRefunds(): RefundRecord[] {
      return runtime.store.listRefunds();
    },
    listChargebacks(): Chargeback[] {
      return runtime.store.listChargebacks();
    },
    eventsEmitted(): PaymentWebhookEvent[] {
      return runtime.store.eventsEmitted();
    },
    getSubscription(id) {
      return runtime.store.getSubscription(id);
    },
    getOrder(id) {
      return runtime.store.getOrder(id);
    },
    getLicenseKey(id) {
      return runtime.store.getLicenseKey(id);
    },
    getChargeback(id) {
      return runtime.store.getChargeback(id);
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

    async draftOrder(input) {
      try {
        const result = await runtime.draftOrder(input);
        record('draftOrder', true, {
          detail: { orderId: result.id, amountCents: result.amountCents },
        });
        return result;
      } catch (err) {
        record('draftOrder', false, { errorKind: classifyError(err, 'draftOrder') });
        throw err;
      }
    },

    async openOrder(id) {
      try {
        const result = await runtime.openOrder(id);
        record('openOrder', true, { detail: { orderId: id } });
        return result;
      } catch (err) {
        record('openOrder', false, { errorKind: classifyError(err, 'openOrder') });
        throw err;
      }
    },

    async payOrder(id) {
      try {
        const result = await runtime.payOrder(id);
        record('payOrder', true, { detail: { orderId: id } });
        return result;
      } catch (err) {
        record('payOrder', false, { errorKind: classifyError(err, 'payOrder') });
        throw err;
      }
    },

    async voidOrder(id) {
      try {
        const result = await runtime.voidOrder(id);
        record('voidOrder', true, { detail: { orderId: id } });
        return result;
      } catch (err) {
        record('voidOrder', false, { errorKind: classifyError(err, 'voidOrder') });
        throw err;
      }
    },

    async markOrderUncollectible(id) {
      try {
        const result = await runtime.markUncollectible(id);
        record('markUncollectible', true, { detail: { orderId: id } });
        return result;
      } catch (err) {
        record('markUncollectible', false, { errorKind: classifyError(err, 'markUncollectible') });
        throw err;
      }
    },

    async issueLicenseKey(input: LicenseIssueInput): Promise<LicenseKeyRecord> {
      try {
        const result = await runtime.issueLicenseKey(input);
        record('issueLicenseKey', true, {
          detail: {
            licenseKeyId: result.id,
            orderId: input.orderId,
            activationsLimit: result.activationsLimit,
          },
        });
        return result;
      } catch (err) {
        record('issueLicenseKey', false, { errorKind: classifyError(err, 'issueLicenseKey') });
        throw err;
      }
    },

    async activateLicense(input: LicenseActivateInput): Promise<LicenseKeyRecord> {
      try {
        const result = await runtime.activateLicense(input);
        record('activateLicense', true, {
          detail: {
            licenseKeyId: result.id,
            activationsUsed: result.activationsUsed,
            activationsLimit: result.activationsLimit,
          },
        });
        return result;
      } catch (err) {
        record('activateLicense', false, { errorKind: classifyError(err, 'activateLicense') });
        throw err;
      }
    },

    async revokeLicense(input: LicenseRevokeInput): Promise<LicenseKeyRecord> {
      try {
        const result = await runtime.revokeLicense(input);
        record('revokeLicense', true, {
          detail: {
            licenseKeyId: result.id,
            instanceId: input.instanceId,
            activationsUsed: result.activationsUsed,
          },
        });
        return result;
      } catch (err) {
        record('revokeLicense', false, { errorKind: classifyError(err, 'revokeLicense') });
        throw err;
      }
    },

    async refundOrder(input: RefundInput): Promise<RefundResult> {
      try {
        const result = await runtime.refundOrder(input);
        record('refundOrder', true, {
          detail: {
            orderId: input.orderId,
            refundAmountCents: result.refund.refundAmountCents,
            kind: result.refund.kind,
          },
        });
        return result;
      } catch (err) {
        record('refundOrder', false, { errorKind: classifyError(err, 'refundOrder') });
        throw err;
      }
    },

    async openChargeback(input: ChargebackOpenInput): Promise<Chargeback> {
      try {
        const result = await runtime.openChargeback(input);
        record('openChargeback', true, {
          detail: {
            chargebackId: result.id,
            orderId: input.orderId,
            reason: input.reason,
          },
        });
        return result;
      } catch (err) {
        record('openChargeback', false, { errorKind: classifyError(err, 'openChargeback') });
        throw err;
      }
    },

    async submitChargebackEvidence(input: ChargebackEvidenceInput): Promise<Chargeback> {
      try {
        const result = await runtime.submitChargebackEvidence(input);
        record('submitChargebackEvidence', true, {
          detail: {
            chargebackId: result.id,
            state: result.state,
          },
        });
        return result;
      } catch (err) {
        record('submitChargebackEvidence', false, {
          errorKind: classifyError(err, 'submitChargebackEvidence'),
        });
        throw err;
      }
    },

    async resolveChargeback(input: ChargebackResolveInput): Promise<Chargeback> {
      try {
        const result = await runtime.resolveChargeback(input);
        record('resolveChargeback', true, {
          detail: {
            chargebackId: result.id,
            state: result.state,
            merchantWon: input.merchantWon,
          },
        });
        return result;
      } catch (err) {
        record('resolveChargeback', false, {
          errorKind: classifyError(err, 'resolveChargeback'),
        });
        throw err;
      }
    },

    async startDunningForOrder(orderId): Promise<DunningSession> {
      const order = runtime.store.getOrder(orderId);
      if (!order) {
        record('startDunning', false, {
          errorKind: 'entity_not_found',
          detail: { orderId },
        });
        throw new Error(`startDunningForOrder: order ${orderId} not found`);
      }
      try {
        const input: Parameters<LemonSqueezyAxisRuntime['startDunning']>[0] = {
          invoiceId: order.id,
          amountCents: order.amountCents,
          customerId: order.customerId,
        };
        if (order.currency !== undefined) input.currency = order.currency;
        const session = await runtime.startDunning(input);
        record('startDunning', true, {
          detail: { orderId, maxAttempts: session.config.maxAttempts },
        });
        return session;
      } catch (err) {
        record('startDunning', false, { errorKind: classifyError(err, 'startDunning') });
        throw err;
      }
    },

    async runDunningAttempt(orderId): Promise<DunningSession> {
      try {
        const session = await runtime.runDunningAttempt(orderId);
        record('dunningAttempt', true, {
          detail: { orderId, attempt: session.attempt, state: session.state },
        });
        return session;
      } catch (err) {
        record('dunningAttempt', false, { errorKind: classifyError(err, 'dunningAttempt') });
        throw err;
      }
    },

    async finalizeDunning(orderId, succeed): Promise<DunningSession> {
      try {
        const session = await runtime.finalizeDunningSession(orderId, succeed);
        record('finalizeDunning', true, {
          detail: { orderId, state: session.state, succeed },
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
 * Derive the domain effect (subscription / order / license / refund /
 * chargeback / dunning) a webhook event triggered. Lemon Squeezy-specific:
 * `subscription_*` + `order_*` are the main envelope. `order_refunded`
 * covers both refund + chargeback outcomes in real LS; the mock still
 * classifies as `refund` since the semantics layer separates the concerns.
 */
function deriveEffect(event: PaymentWebhookEvent): {
  kind: 'subscription' | 'order' | 'checkout' | 'license' | 'refund' | 'chargeback' | 'dunning';
  entityId: string;
  newState?: string | undefined;
} | undefined {
  const type = event.type;
  const lower = type.toLowerCase();
  if (lower.includes('subscription_payment_failed') || lower.includes('subscription_expired')) {
    return {
      kind: 'dunning',
      entityId: `sub_${event.id}`,
      newState: lastToken(type),
    };
  }
  if (lower.includes('subscription')) {
    return {
      kind: 'subscription',
      entityId: `sub_${event.id}`,
      newState: lastToken(type),
    };
  }
  if (lower.includes('order_refunded')) {
    return {
      kind: 'refund',
      entityId: `ord_${event.id}`,
      newState: 'refunded',
    };
  }
  if (lower.includes('chargeback')) {
    return {
      kind: 'chargeback',
      entityId: `dp_${event.id}`,
      newState: lastToken(type),
    };
  }
  if (lower.includes('order')) {
    return {
      kind: 'order',
      entityId: `ord_${event.id}`,
      newState: lastToken(type),
    };
  }
  if (lower.includes('license')) {
    return {
      kind: 'license',
      entityId: `lic_${event.id}`,
      newState: lastToken(type),
    };
  }
  return undefined;
}

/**
 * Grab the last path token from a provider event name, split on `.` or `_`,
 * so `subscription.created` → `created`, `subscription_payment_failed` →
 * `failed`.
 */
function lastToken(name: string): string {
  const parts = name.split(/[._]/);
  return parts[parts.length - 1] ?? name;
}
