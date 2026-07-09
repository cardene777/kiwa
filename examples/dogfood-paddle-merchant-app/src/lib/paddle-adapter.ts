/**
 * 8-axis routing wrapper over `@kiwa-lab/payment`'s Paddle adapter surface.
 *
 * This module is the SSOT for how the dogfood app converts a semantics-layer
 * call (e.g. `createSubscription`) into a webhook event, records the effect
 * in the {@link BillingStore}, and appends a trace entry. Both the mock and
 * real adapters build on this module so their behavioural envelopes stay
 * aligned.
 *
 * Paddle-specific specialisation vs the Stripe dogfood app —
 *  - Checkout is inline (embedded via Paddle.js) instead of a hosted
 *    session, so `createCheckout` returns a `checkoutId` + open-token style
 *    URL that the client mounts inline (`https://checkout.paddle.com/checkout/{checkoutId}`).
 *  - Transactions are Paddle's invoice-equivalent (billing = transaction
 *    lifecycle); we keep the `Invoice` semantics name for cross-provider
 *    parity but the store field is `transactions`.
 *  - Tax is Merchant-of-Record + always calculated inline (Paddle handles
 *    VAT/GST/sales-tax for the merchant); the runtime exposes an explicit
 *    `calculateAndEmitTax` step.
 *
 * The 8 axes wired here mirror the fidelity harness enumeration:
 *   1. dunning
 *   2. retry — dispatched through webhook idempotent delivery inside
 *      `receiveWebhook`
 *   3. 3DS — Paddle surfaces via `transaction.updated`
 *   4. SCA — surfaces through `receiveWebhook` when Paddle emits
 *      `transaction.updated` with SCA required
 *   5. PSD2 — mandate is surfaced through `payment_method.saved`
 *   6. subscription-lifecycle
 *   7. invoice (transaction)
 *   8. tax (VAT/GST/sales-tax) + chargeback — surface through
 *      `receiveWebhook` dispatch
 */

import {
  calculateTax as semCalcTax,
  cancelSubscription as semCancel,
  changePlan as semChangePlan,
  createSubscription as semCreateSubscription,
  creditNoteInvoice as semCreditNote,
  draftInvoice as semDraftInvoice,
  dunningAttempt as semDunningAttempt,
  emitTaxLine as semEmitTaxLine,
  finalizeDunning as semFinalizeDunning,
  markUncollectible as semMarkUncollectible,
  openInvoice as semOpenInvoice,
  pauseSubscription as semPauseSubscription,
  payInvoice as semPayInvoice,
  reactivateSubscription as semReactivateSubscription,
  resumeSubscription as semResumeSubscription,
  startDunning as semStartDunning,
  voidInvoice as semVoidInvoice,
  type DunningSession,
  type Invoice as SemanticInvoice,
  type PaymentAdapter,
  type PaymentWebhookEvent,
  type Subscription as SemanticSubscription,
  type TaxLine,
} from '@kiwa-lab/payment';
import { createBillingStore, type BillingStore } from './store.js';

/**
 * Input for the checkout step. Mirrors Paddle's inline checkout create
 * payload (`transaction` create + `paddlejs.mount`). buyerCountry + optional
 * buyerVatId feed the tax calculation so the merchant preview matches what
 * the buyer sees inside the inline checkout iframe.
 */
export interface PaddleCheckoutInput {
  customerId: string;
  priceId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry?: string;
  productKind?: 'digital' | 'physical' | 'service';
  successUrl?: string;
}

export interface PaddleCheckoutRuntimeResult {
  checkoutId: string;
  transactionId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  taxLine: TaxLine;
}

/**
 * Runtime bundle wired to a specific {@link PaymentAdapter}. Everything the
 * mock + real adapter need is on this object — semantics helpers pre-bound
 * to the adapter, the store, and the webhook dispatcher.
 */
export interface PaddleAxisRuntime {
  readonly adapter: PaymentAdapter;
  readonly store: BillingStore;

  createCheckout(input: PaddleCheckoutInput): Promise<PaddleCheckoutRuntimeResult>;

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

  draftTransaction(input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticInvoice>;
  openTransaction(id: string): Promise<SemanticInvoice>;
  payTransaction(id: string): Promise<SemanticInvoice>;
  voidTransaction(id: string): Promise<SemanticInvoice>;
  markUncollectible(id: string): Promise<SemanticInvoice>;
  creditNote(input: { transactionId: string; creditAmountCents: number }): Promise<SemanticInvoice>;

  calculateAndEmitTax(input: {
    customerId: string;
    netAmountCents: number;
    buyerCountry: string;
    buyerVatId?: string;
    merchantCountry: string;
    productKind?: 'digital' | 'physical' | 'service';
    currency?: string;
  }): Promise<TaxLine>;

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
export function createPaddleAxisRuntime(adapter: PaymentAdapter): PaddleAxisRuntime {
  const store = createBillingStore();

  // Wire the shared event recorder. Every semantics call emits at least one
  // webhook event via `adapter.emit`; the store captures the ordered stream
  // so tests can assert on the event log without re-registering a handler.
  adapter.onWebhook((event: PaymentWebhookEvent) => {
    store.recordEvent(event);
  });

  const dunningSessions = new Map<string, DunningSession>();

  let checkoutSeq = 0;

  return {
    adapter,
    store,

    async createCheckout(input) {
      checkoutSeq += 1;
      const checkoutId = `che_test_paddle_${checkoutSeq}`;
      const transactionId = `txn_test_paddle_${checkoutSeq}`;
      const successUrl = input.successUrl ?? 'https://example.com/success';
      const currency = input.currency ?? 'USD';
      const merchantCountry = input.merchantCountry ?? 'GB';
      // Paddle inline checkout URL — client embeds via `Paddle.Checkout.open`
      // with a `transaction` field; the dogfood app returns the raw URL for
      // completeness so tests can assert on the redirect shape.
      const url = `https://checkout.paddle.com/checkout/${checkoutId}?success=${encodeURIComponent(successUrl)}`;

      // Calculate tax inline — Paddle's Merchant-of-Record model always
      // computes tax at checkout, so the buyer sees the total including
      // VAT/GST/sales-tax before submitting the payment.
      const taxLine = semCalcTax({
        netAmountCents: input.amountCents,
        buyerCountry: input.buyerCountry,
        ...(input.buyerVatId !== undefined ? { buyerVatId: input.buyerVatId } : {}),
        merchantCountry,
        ...(input.productKind !== undefined ? { productKind: input.productKind } : {}),
      });

      // Emit the tax event so the fidelity harness sees the tax axis fired.
      const taxEmitInput: Parameters<typeof semEmitTaxLine>[1] = {
        customerId: input.customerId,
        line: taxLine,
      };
      if (input.currency !== undefined) taxEmitInput.currency = input.currency;
      await semEmitTaxLine(adapter, taxEmitInput);

      const checkoutInput: import('./store.js').CheckoutRecord = {
        checkoutId,
        transactionId,
        customerId: input.customerId,
        priceId: input.priceId,
        planId: input.planId,
        amountCents: input.amountCents,
        currency,
        status: 'open',
        buyerCountry: input.buyerCountry,
        merchantCountry,
        taxLine,
      };
      if (input.buyerVatId !== undefined) checkoutInput.buyerVatId = input.buyerVatId;
      store.persistCheckout(checkoutInput);

      // Persist a tax record so the tax UI can render the audit trail.
      store.persistTax({
        id: `tax_${checkoutId}`,
        customerId: input.customerId,
        line: taxLine,
        createdAt: Date.now(),
      });

      return {
        checkoutId,
        transactionId,
        url,
        amountCents: input.amountCents,
        currency,
        status: 'open',
        taxLine,
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

    async draftTransaction(input) {
      const { invoice } = await semDraftInvoice(adapter, input);
      store.persistTransaction(invoice);
      return invoice;
    },

    async openTransaction(id) {
      const existing = store.getTransaction(id);
      if (!existing) throw new Error(`openTransaction: transaction ${id} not found`);
      await semOpenInvoice(adapter, existing);
      store.persistTransaction(existing);
      return existing;
    },

    async payTransaction(id) {
      const existing = store.getTransaction(id);
      if (!existing) throw new Error(`payTransaction: transaction ${id} not found`);
      await semPayInvoice(adapter, existing);
      store.persistTransaction(existing);
      return existing;
    },

    async voidTransaction(id) {
      const existing = store.getTransaction(id);
      if (!existing) throw new Error(`voidTransaction: transaction ${id} not found`);
      await semVoidInvoice(adapter, existing);
      store.persistTransaction(existing);
      return existing;
    },

    async markUncollectible(id) {
      const existing = store.getTransaction(id);
      if (!existing) throw new Error(`markUncollectible: transaction ${id} not found`);
      await semMarkUncollectible(adapter, existing);
      store.persistTransaction(existing);
      return existing;
    },

    async creditNote(input) {
      const existing = store.getTransaction(input.transactionId);
      if (!existing) throw new Error(`creditNote: transaction ${input.transactionId} not found`);
      await semCreditNote(adapter, existing, { creditAmountCents: input.creditAmountCents });
      store.persistTransaction(existing);
      return existing;
    },

    async calculateAndEmitTax(input) {
      const line = semCalcTax({
        netAmountCents: input.netAmountCents,
        buyerCountry: input.buyerCountry,
        ...(input.buyerVatId !== undefined ? { buyerVatId: input.buyerVatId } : {}),
        merchantCountry: input.merchantCountry,
        ...(input.productKind !== undefined ? { productKind: input.productKind } : {}),
      });
      const emitInput: Parameters<typeof semEmitTaxLine>[1] = {
        customerId: input.customerId,
        line,
      };
      if (input.currency !== undefined) emitInput.currency = input.currency;
      await semEmitTaxLine(adapter, emitInput);
      store.persistTax({
        id: `tax_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        customerId: input.customerId,
        line,
        createdAt: Date.now(),
      });
      return line;
    },

    async startDunning(input) {
      const session = semStartDunning(input);
      dunningSessions.set(input.invoiceId, session);
      return session;
    },

    async runDunningAttempt(invoiceId) {
      const existing = dunningSessions.get(invoiceId);
      if (!existing) throw new Error(`runDunningAttempt: dunning ${invoiceId} not found`);
      await semDunningAttempt(adapter, existing);
      return existing;
    },

    async finalizeDunningSession(invoiceId, succeed) {
      const existing = dunningSessions.get(invoiceId);
      if (!existing) throw new Error(`finalizeDunningSession: dunning ${invoiceId} not found`);
      await semFinalizeDunning(adapter, existing, { succeed });
      return existing;
    },
  };
}
