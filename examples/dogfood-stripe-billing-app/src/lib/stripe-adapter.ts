/**
 * 8-axis routing wrapper over `@kiwa-test/payment`'s Stripe adapter surface.
 *
 * This module is the SSOT for how the dogfood app converts a semantics-layer
 * call (e.g. `createSubscription`) into a webhook event, records the effect
 * in the {@link BillingStore}, and appends a trace entry. Both the mock and
 * real adapters build on this module so their behavioural envelopes stay
 * aligned.
 *
 * The 8 axes wired here are the same set the fidelity harness (in
 * `packages/payment/src/semantics/fidelity.ts`) enumerates —
 *   1. dunning
 *   2. retry — dispatched through webhook idempotent delivery inside
 *      `receiveWebhook`
 *   3. 3DS
 *   4. SCA — surfaces through `receiveWebhook` when Stripe emits
 *      `payment_intent.sca_required`
 *   5. PSD2 — mandate is surfaced through checkout options
 *   6. subscription-lifecycle
 *   7. invoice
 *   8. tax + chargeback — surface through `receiveWebhook` dispatch
 *
 * Not all 8 axes need a first-class method on the adapter — the ones the
 * dogfood app exposes end-to-end (checkout / subscription / invoice / 3DS /
 * dunning) get dedicated methods; the rest are exercised through webhook
 * events.
 */

import {
  cancelSubscription as semCancel,
  changePlan as semChangePlan,
  createSubscription as semCreateSubscription,
  creditNoteInvoice as semCreditNote,
  draftInvoice as semDraftInvoice,
  dunningAttempt as semDunningAttempt,
  finalizeDunning as semFinalizeDunning,
  markUncollectible as semMarkUncollectible,
  openInvoice as semOpenInvoice,
  pauseSubscription as semPauseSubscription,
  payInvoice as semPayInvoice,
  reactivateSubscription as semReactivateSubscription,
  resumeSubscription as semResumeSubscription,
  startDunning as semStartDunning,
  startThreeDs as semStartThreeDs,
  threeDsFrictionless as semThreeDsFrictionless,
  threeDsRequestChallenge as semThreeDsRequestChallenge,
  threeDsSubmitChallenge as semThreeDsSubmitChallenge,
  voidInvoice as semVoidInvoice,
  type DunningSession,
  type Invoice as SemanticInvoice,
  type PaymentAdapter,
  type PaymentWebhookEvent,
  type Subscription as SemanticSubscription,
  type ThreeDsSession,
  type ThreeDsTransStatus,
} from '@kiwa-test/payment';
import { createBillingStore, type BillingStore } from './store.js';

/**
 * Runtime bundle wired to a specific {@link PaymentAdapter}. Everything the
 * mock + real adapter need is on this object — semantics helpers pre-bound to
 * the adapter, the store, and the webhook dispatcher.
 */
export interface StripeAxisRuntime {
  readonly adapter: PaymentAdapter;
  readonly store: BillingStore;

  // Checkout
  createCheckout(input: {
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
    requiresThreeDs?: boolean;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    sessionId: string;
    paymentIntentId: string;
    url: string;
    amountCents: number;
    currency: string;
    status: 'open' | 'complete' | 'expired';
    threeDs?: ThreeDsSession;
  }>;

  // Subscription lifecycle
  createSubscription(input: {
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticSubscription>;
  changePlan(input: {
    subscriptionId: string;
    newPlanId: string;
    newAmountCents: number;
  }): Promise<SemanticSubscription>;
  pauseSubscription(id: string): Promise<SemanticSubscription>;
  resumeSubscription(id: string): Promise<SemanticSubscription>;
  cancelSubscription(id: string): Promise<SemanticSubscription>;
  reactivateSubscription(id: string): Promise<SemanticSubscription>;

  // Invoice lifecycle
  draftInvoice(input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticInvoice>;
  openInvoice(id: string): Promise<SemanticInvoice>;
  payInvoice(id: string): Promise<SemanticInvoice>;
  voidInvoice(id: string): Promise<SemanticInvoice>;
  markUncollectible(id: string): Promise<SemanticInvoice>;
  creditNote(input: { invoiceId: string; creditAmountCents: number }): Promise<SemanticInvoice>;

  // 3DS
  submitThreeDs(paymentIntentId: string, transStatus: ThreeDsTransStatus): Promise<ThreeDsSession>;

  // Dunning
  startDunning(input: {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
  }): Promise<DunningSession>;
  runDunningAttempt(invoiceId: string): Promise<DunningSession>;
  finalizeDunningSession(invoiceId: string, succeed: boolean): Promise<DunningSession>;
}

/**
 * Build a runtime bundle bound to `adapter`. Every call routes through the
 * semantics layer + persists the effect in a fresh store. Callers that share
 * a runtime instance across requests share the same store — dogfood tests
 * bootstrap a fresh runtime per test.
 */
export function createStripeAxisRuntime(adapter: PaymentAdapter): StripeAxisRuntime {
  const store = createBillingStore();

  // Wire the shared event recorder. Every semantics call emits at least one
  // webhook event via `adapter.emit`; the store captures the ordered stream
  // so tests can assert on the event log without re-registering a handler.
  adapter.onWebhook((event: PaymentWebhookEvent) => {
    store.recordEvent(event);
  });

  let checkoutSeq = 0;

  return {
    adapter,
    store,

    async createCheckout(input) {
      checkoutSeq += 1;
      const sessionId = `cs_test_${adapter.provider}_${checkoutSeq}`;
      const paymentIntentId = `pi_test_${adapter.provider}_${checkoutSeq}`;
      const successUrl = input.successUrl ?? 'https://example.com/success';
      const cancelUrl = input.cancelUrl ?? 'https://example.com/cancel';
      const currency = input.currency ?? 'usd';
      const url = `https://checkout.stripe.com/pay/${sessionId}?success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;

      let threeDs: ThreeDsSession | undefined;
      if (input.requiresThreeDs) {
        threeDs = semStartThreeDs({
          paymentIntentId,
          amountCents: input.amountCents,
          customerId: input.customerId,
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
        });
        // Emit the challenge_required event so the webhook handler + fidelity
        // harness see the flow start.
        await semThreeDsRequestChallenge(adapter, threeDs);
        store.persistThreeDs(threeDs);
      }

      store.persistCheckout({
        sessionId,
        paymentIntentId,
        customerId: input.customerId,
        planId: input.planId,
        amountCents: input.amountCents,
        currency,
        status: 'open',
        ...(threeDs ? { threeDsPaymentIntentId: threeDs.paymentIntentId } : {}),
      });

      return {
        sessionId,
        paymentIntentId,
        url,
        amountCents: input.amountCents,
        currency,
        status: 'open',
        ...(threeDs ? { threeDs } : {}),
      };
    },

    async createSubscription(input) {
      const { subscription } = await semCreateSubscription(adapter, input);
      store.persistSubscription(subscription);
      return subscription;
    },

    async changePlan(input) {
      const existing = store.getSubscription(input.subscriptionId);
      if (!existing) {
        throw new Error(`changePlan: subscription ${input.subscriptionId} not found`);
      }
      await semChangePlan(adapter, existing, {
        newPlanId: input.newPlanId,
        newAmountCents: input.newAmountCents,
      });
      store.persistSubscription(existing);
      return existing;
    },

    async pauseSubscription(id) {
      const existing = store.getSubscription(id);
      if (!existing) throw new Error(`pauseSubscription: subscription ${id} not found`);
      await semPauseSubscription(adapter, existing);
      store.persistSubscription(existing);
      return existing;
    },

    async resumeSubscription(id) {
      const existing = store.getSubscription(id);
      if (!existing) throw new Error(`resumeSubscription: subscription ${id} not found`);
      await semResumeSubscription(adapter, existing);
      store.persistSubscription(existing);
      return existing;
    },

    async cancelSubscription(id) {
      const existing = store.getSubscription(id);
      if (!existing) throw new Error(`cancelSubscription: subscription ${id} not found`);
      await semCancel(adapter, existing);
      store.persistSubscription(existing);
      return existing;
    },

    async reactivateSubscription(id) {
      const existing = store.getSubscription(id);
      if (!existing) throw new Error(`reactivateSubscription: subscription ${id} not found`);
      await semReactivateSubscription(adapter, existing);
      store.persistSubscription(existing);
      return existing;
    },

    async draftInvoice(input) {
      const { invoice } = await semDraftInvoice(adapter, input);
      store.persistInvoice(invoice);
      return invoice;
    },

    async openInvoice(id) {
      const existing = store.getInvoice(id);
      if (!existing) throw new Error(`openInvoice: invoice ${id} not found`);
      await semOpenInvoice(adapter, existing);
      store.persistInvoice(existing);
      return existing;
    },

    async payInvoice(id) {
      const existing = store.getInvoice(id);
      if (!existing) throw new Error(`payInvoice: invoice ${id} not found`);
      await semPayInvoice(adapter, existing);
      store.persistInvoice(existing);
      return existing;
    },

    async voidInvoice(id) {
      const existing = store.getInvoice(id);
      if (!existing) throw new Error(`voidInvoice: invoice ${id} not found`);
      await semVoidInvoice(adapter, existing);
      store.persistInvoice(existing);
      return existing;
    },

    async markUncollectible(id) {
      const existing = store.getInvoice(id);
      if (!existing) throw new Error(`markUncollectible: invoice ${id} not found`);
      await semMarkUncollectible(adapter, existing);
      store.persistInvoice(existing);
      return existing;
    },

    async creditNote(input) {
      const existing = store.getInvoice(input.invoiceId);
      if (!existing) throw new Error(`creditNote: invoice ${input.invoiceId} not found`);
      await semCreditNote(adapter, existing, { creditAmountCents: input.creditAmountCents });
      store.persistInvoice(existing);
      return existing;
    },

    async submitThreeDs(paymentIntentId, transStatus) {
      const existing = store.getThreeDs(paymentIntentId);
      if (!existing) {
        throw new Error(`submitThreeDs: 3ds session ${paymentIntentId} not found`);
      }
      // Frictionless path — semantics/three-ds treats `Y` from the
      // fingerprint state as the frictionless flow. Real Stripe surfaces
      // this via `payment_intent.succeeded` without a challenge step.
      if (existing.state === 'fingerprint' && transStatus === 'Y') {
        await semThreeDsFrictionless(adapter, existing);
      } else {
        await semThreeDsSubmitChallenge(adapter, existing, { transStatus });
      }
      store.persistThreeDs(existing);
      return existing;
    },

    async startDunning(input) {
      const session = semStartDunning(input);
      store.persistDunning(session);
      return session;
    },

    async runDunningAttempt(invoiceId) {
      const existing = store.getDunning(invoiceId);
      if (!existing) throw new Error(`runDunningAttempt: dunning ${invoiceId} not found`);
      await semDunningAttempt(adapter, existing);
      store.persistDunning(existing);
      return existing;
    },

    async finalizeDunningSession(invoiceId, succeed) {
      const existing = store.getDunning(invoiceId);
      if (!existing) throw new Error(`finalizeDunningSession: dunning ${invoiceId} not found`);
      await semFinalizeDunning(adapter, existing, { succeed });
      store.persistDunning(existing);
      return existing;
    },
  };
}
