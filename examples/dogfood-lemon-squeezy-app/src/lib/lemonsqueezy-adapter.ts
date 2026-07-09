/**
 * 8-axis routing wrapper over `@kiwa-lab/payment`'s Lemon Squeezy adapter
 * surface.
 *
 * This module is the SSOT for how the dogfood app converts a semantics-layer
 * call (e.g. `createSubscription` / `openChargeback`) into a webhook event,
 * records the effect in the {@link DogfoodStore}, and appends a trace entry.
 * Both the mock and real adapters build on this module so their behavioural
 * envelopes stay aligned.
 *
 * Lemon Squeezy-specific specialisation vs the Paddle + Stripe dogfood apps —
 *  - Checkout is hosted (redirect to `checkout.lemonsqueezy.com`) instead of
 *    inline (Paddle) or session-based hosted (Stripe). The mock returns a
 *    hosted checkout URL that a real client would open in a browser.
 *  - Orders are Lemon Squeezy's invoice-equivalent (billing = order lifecycle
 *    around `order_created` + `order_refunded`); the semantics layer keeps
 *    the `Invoice` name for cross-provider parity but the store field is
 *    `orders`.
 *  - License keys are unique to Lemon Squeezy — every digital product may
 *    have "License Keys" enabled, in which case order paid emits a license
 *    key that the buyer activates / revokes via a separate license API.
 *    Runtime exposes `issueLicenseKey` / `activateLicense` / `revokeLicense`.
 *  - Refunds are surfaced through `order_refunded`. Runtime supports both
 *    full (equals order total) and partial (delta) refunds via
 *    `refundOrder`.
 *  - Chargebacks — real LS surfaces dispute lifecycle through the same
 *    `order_refunded` event with a `refund_reason: 'dispute'` flag. The
 *    dogfood app models it explicitly through the `chargeback` semantics
 *    axis so evidence submission + representment can be exercised.
 *
 * The 8 axes wired here mirror the fidelity harness enumeration:
 *   1. dunning — surfaces through the semantics dunning helpers
 *   2. retry — dispatched through webhook idempotent delivery inside
 *      `receiveWebhook`
 *   3. 3DS — surfaces as `order_created`
 *   4. SCA — surfaces as `order_created`
 *   5. PSD2 — mandate is surfaced through `subscription_created`
 *   6. subscription-lifecycle
 *   7. invoice (order) + refund (order_refunded)
 *   8. chargeback (dispute → evidence → won/lost)
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
  openChargeback as semOpenChargeback,
  openInvoice as semOpenInvoice,
  pauseSubscription as semPauseSubscription,
  payInvoice as semPayInvoice,
  reactivateSubscription as semReactivateSubscription,
  resolveChargeback as semResolveChargeback,
  resumeSubscription as semResumeSubscription,
  startDunning as semStartDunning,
  submitEvidence as semSubmitEvidence,
  voidInvoice as semVoidInvoice,
  type Chargeback,
  type ChargebackReason,
  type DunningSession,
  type Invoice as SemanticInvoice,
  type PaymentAdapter,
  type PaymentWebhookEvent,
  type Subscription as SemanticSubscription,
} from '@kiwa-lab/payment';
import {
  createDogfoodStore,
  type DogfoodStore,
  type LicenseKeyRecord,
  type RefundRecord,
} from './store.js';

/**
 * Input for a hosted checkout session. Mirrors the fields a real client
 * would submit to Lemon Squeezy's `POST /v1/checkouts` API.
 */
export interface LemonSqueezyCheckoutInput {
  customerId: string;
  variantId: string;
  storeId: string;
  amountCents: number;
  currency?: string;
  productKind?: 'digital' | 'physical' | 'service' | 'license';
  successUrl?: string;
}

export interface LemonSqueezyCheckoutRuntimeResult {
  checkoutId: string;
  orderId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  productKind: 'digital' | 'physical' | 'service' | 'license';
}

/**
 * Input for license key issue. Real Lemon Squeezy issues license keys
 * automatically when an order for a licensed variant is paid. The dogfood
 * app exposes an explicit `issueLicenseKey` step so tests can drive the
 * issue path deterministically.
 */
export interface LicenseKeyIssueInput {
  orderId: string;
  customerId: string;
  variantId: string;
  activationsLimit?: number;
  expiresAt?: number;
}

/**
 * Input for a partial or full refund.
 */
export interface RefundInput {
  orderId: string;
  refundAmountCents?: number;
  reason?: string;
}

/**
 * Runtime bundle wired to a specific {@link PaymentAdapter}. Everything the
 * mock + real adapter need is on this object — semantics helpers pre-bound
 * to the adapter, the store, and the webhook dispatcher.
 */
export interface LemonSqueezyAxisRuntime {
  readonly adapter: PaymentAdapter;
  readonly store: DogfoodStore;

  createCheckout(input: LemonSqueezyCheckoutInput): Promise<LemonSqueezyCheckoutRuntimeResult>;

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

  draftOrder(input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  }): Promise<SemanticInvoice>;
  openOrder(id: string): Promise<SemanticInvoice>;
  payOrder(id: string): Promise<SemanticInvoice>;
  voidOrder(id: string): Promise<SemanticInvoice>;
  markUncollectible(id: string): Promise<SemanticInvoice>;

  issueLicenseKey(input: LicenseKeyIssueInput): Promise<LicenseKeyRecord>;
  activateLicense(input: {
    licenseKeyId: string;
    instanceName: string;
  }): Promise<LicenseKeyRecord>;
  revokeLicense(input: {
    licenseKeyId: string;
    instanceId: string;
  }): Promise<LicenseKeyRecord>;

  refundOrder(input: RefundInput): Promise<{ refund: RefundRecord; order: SemanticInvoice }>;

  openChargeback(input: {
    orderId: string;
    reason: ChargebackReason;
  }): Promise<Chargeback>;
  submitChargebackEvidence(input: {
    chargebackId: string;
    receiptUrl?: string;
    shippingProof?: string;
    customerCommunication?: string;
  }): Promise<Chargeback>;
  resolveChargeback(input: {
    chargebackId: string;
    merchantWon: boolean;
  }): Promise<Chargeback>;

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
export function createLemonSqueezyAxisRuntime(adapter: PaymentAdapter): LemonSqueezyAxisRuntime {
  const store = createDogfoodStore();

  // Wire the shared event recorder. Every semantics call emits at least one
  // webhook event via `adapter.emit`; the store captures the ordered stream
  // so tests can assert on the event log without re-registering a handler.
  adapter.onWebhook((event: PaymentWebhookEvent) => {
    store.recordEvent(event);
  });

  const dunningSessions = new Map<string, DunningSession>();
  const chargebacksById = new Map<string, Chargeback>();

  let checkoutSeq = 0;
  let licenseSeq = 0;
  let refundSeq = 0;
  let activationSeq = 0;

  return {
    adapter,
    store,

    async createCheckout(input) {
      checkoutSeq += 1;
      const checkoutId = `che_test_ls_${checkoutSeq}`;
      const orderId = `ord_test_ls_${checkoutSeq}`;
      const currency = (input.currency ?? 'USD').toUpperCase();
      const productKind = input.productKind ?? 'digital';
      const successUrl = input.successUrl ?? 'https://example.com/success';
      // Real Lemon Squeezy hosted checkout URL:
      // `https://{store}.lemonsqueezy.com/checkout/buy/{variantId}?checkout%5Bcustom%5D%5Buser_id%5D=...`.
      const url = `https://${input.storeId}.lemonsqueezy.com/checkout/buy/${input.variantId}?checkout%5Bcustom%5D%5Buser_id%5D=${encodeURIComponent(input.customerId)}&checkout%5Bredirect_url%5D=${encodeURIComponent(successUrl)}`;

      store.persistCheckout({
        checkoutId,
        orderId,
        customerId: input.customerId,
        variantId: input.variantId,
        storeId: input.storeId,
        productKind,
        amountCents: input.amountCents,
        currency,
        status: 'open',
        successUrl,
      });

      return {
        checkoutId,
        orderId,
        url,
        amountCents: input.amountCents,
        currency,
        status: 'open',
        productKind,
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

    async draftOrder(input) {
      const { invoice } = await semDraftInvoice(adapter, input);
      store.persistOrder(invoice);
      return invoice;
    },

    async openOrder(id) {
      const existing = store.getOrder(id);
      if (!existing) throw new Error(`openOrder: order ${id} not found`);
      await semOpenInvoice(adapter, existing);
      store.persistOrder(existing);
      return existing;
    },

    async payOrder(id) {
      const existing = store.getOrder(id);
      if (!existing) throw new Error(`payOrder: order ${id} not found`);
      await semPayInvoice(adapter, existing);
      store.persistOrder(existing);
      return existing;
    },

    async voidOrder(id) {
      const existing = store.getOrder(id);
      if (!existing) throw new Error(`voidOrder: order ${id} not found`);
      await semVoidInvoice(adapter, existing);
      store.persistOrder(existing);
      return existing;
    },

    async markUncollectible(id) {
      const existing = store.getOrder(id);
      if (!existing) throw new Error(`markUncollectible: order ${id} not found`);
      await semMarkUncollectible(adapter, existing);
      store.persistOrder(existing);
      return existing;
    },

    async issueLicenseKey(input) {
      licenseSeq += 1;
      const id = `lic_test_ls_${licenseSeq}`;
      const key = `LSKEY-${licenseSeq.toString().padStart(4, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const record: LicenseKeyRecord = {
        id,
        key,
        orderId: input.orderId,
        customerId: input.customerId,
        variantId: input.variantId,
        status: 'active',
        activationsLimit: input.activationsLimit ?? 1,
        activationsUsed: 0,
        activations: [],
        createdAt: Date.now(),
      };
      if (input.expiresAt !== undefined) record.expiresAt = input.expiresAt;
      store.persistLicenseKey(record);
      return record;
    },

    async activateLicense(input) {
      const record = store.getLicenseKey(input.licenseKeyId);
      if (!record) throw new Error(`activateLicense: license ${input.licenseKeyId} not found`);
      if (record.status !== 'active') {
        throw new Error(`activateLicense: license ${input.licenseKeyId} is ${record.status}`);
      }
      if (record.activationsUsed >= record.activationsLimit) {
        throw new Error(
          `activateLicense: license ${input.licenseKeyId} activations limit reached (${record.activationsUsed}/${record.activationsLimit})`,
        );
      }
      activationSeq += 1;
      record.activations.push({
        instanceId: `inst_test_ls_${activationSeq}`,
        instanceName: input.instanceName,
        createdAt: Date.now(),
      });
      record.activationsUsed = record.activations.filter((a) => a.revokedAt === undefined).length;
      store.persistLicenseKey(record);
      return record;
    },

    async revokeLicense(input) {
      const record = store.getLicenseKey(input.licenseKeyId);
      if (!record) throw new Error(`revokeLicense: license ${input.licenseKeyId} not found`);
      const activation = record.activations.find((a) => a.instanceId === input.instanceId);
      if (!activation) {
        throw new Error(`revokeLicense: instance ${input.instanceId} not found on license ${input.licenseKeyId}`);
      }
      if (activation.revokedAt !== undefined) {
        throw new Error(`revokeLicense: instance ${input.instanceId} already revoked`);
      }
      activation.revokedAt = Date.now();
      record.activationsUsed = record.activations.filter((a) => a.revokedAt === undefined).length;
      store.persistLicenseKey(record);
      return record;
    },

    async refundOrder(input) {
      const order = store.getOrder(input.orderId);
      if (!order) throw new Error(`refundOrder: order ${input.orderId} not found`);
      if (order.state !== 'paid') {
        throw new Error(
          `refundOrder: order ${input.orderId} must be paid (got ${order.state})`,
        );
      }
      const refundAmount = input.refundAmountCents ?? order.amountCents;
      if (refundAmount <= 0) {
        throw new Error(`refundOrder: refundAmountCents must be > 0 (got ${refundAmount})`);
      }
      if (refundAmount > order.amountCents) {
        throw new Error(
          `refundOrder: refundAmountCents (${refundAmount}) exceeds invoice amount (${order.amountCents})`,
        );
      }
      const kind: 'full' | 'partial' = refundAmount === order.amountCents ? 'full' : 'partial';
      // Full refund → void the order via credit note semantics; partial →
      // credit note only. Both surface as order_refunded through the LS
      // provider dialect.
      await semCreditNote(adapter, order, { creditAmountCents: refundAmount });
      store.persistOrder(order);
      refundSeq += 1;
      const refund: RefundRecord = {
        id: `ref_test_ls_${refundSeq}`,
        orderId: input.orderId,
        customerId: order.customerId,
        amountCents: order.amountCents,
        refundAmountCents: refundAmount,
        kind,
        reason: input.reason ?? 'customer_requested',
        createdAt: Date.now(),
      };
      store.persistRefund(refund);
      return { refund, order };
    },

    async openChargeback(input) {
      const order = store.getOrder(input.orderId);
      if (!order) throw new Error(`openChargeback: order ${input.orderId} not found`);
      const { chargeback } = await semOpenChargeback(adapter, {
        transactionId: order.id,
        customerId: order.customerId,
        amountCents: order.amountCents,
        ...(order.currency !== undefined ? { currency: order.currency } : {}),
        reason: input.reason,
      });
      chargebacksById.set(chargeback.id, chargeback);
      store.persistChargeback(chargeback);
      return chargeback;
    },

    async submitChargebackEvidence(input) {
      const chargeback = chargebacksById.get(input.chargebackId);
      if (!chargeback) {
        throw new Error(`submitChargebackEvidence: chargeback ${input.chargebackId} not found`);
      }
      const evidenceInput: Parameters<typeof semSubmitEvidence>[2] = {};
      if (input.receiptUrl !== undefined) evidenceInput.receiptUrl = input.receiptUrl;
      if (input.shippingProof !== undefined) evidenceInput.shippingProof = input.shippingProof;
      if (input.customerCommunication !== undefined) {
        evidenceInput.customerCommunication = input.customerCommunication;
      }
      await semSubmitEvidence(adapter, chargeback, evidenceInput);
      store.persistChargeback(chargeback);
      return chargeback;
    },

    async resolveChargeback(input) {
      const chargeback = chargebacksById.get(input.chargebackId);
      if (!chargeback) {
        throw new Error(`resolveChargeback: chargeback ${input.chargebackId} not found`);
      }
      await semResolveChargeback(adapter, chargeback, { merchantWon: input.merchantWon });
      store.persistChargeback(chargeback);
      return chargeback;
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
