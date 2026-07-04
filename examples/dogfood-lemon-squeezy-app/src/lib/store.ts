/**
 * Framework-agnostic in-memory store for Lemon Squeezy dogfood data —
 * checkout sessions + subscriptions + orders (Lemon Squeezy's
 * invoice-equivalent) + license keys + refunds + chargeback disputes +
 * emitted webhook events.
 *
 * Mirrors the surface a real database + audit log deployment would expose so
 * the same SvelteKit endpoints can flip between the real Lemon Squeezy
 * sandbox driver and the `@kiwa-test/payment` mock without knowing which is
 * in play.
 *
 * The store is in-memory + per-instance; production RPs swap this for a
 * database. The mock is fine for a dogfood app because every test bootstraps
 * a fresh server.
 */

import type {
  Chargeback,
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
} from '@kiwa-test/payment';

/**
 * Lemon Squeezy hosted checkout session. Real Lemon Squeezy returns a
 * checkout `id` + hosted checkout URL (`https://{store}.lemonsqueezy.com/
 * checkout/buy/{variantId}?checkout%5Bcustom%5D%5Buser_id%5D=...`) that
 * the merchant redirects the buyer to. The dogfood app mirrors the shape
 * so route handlers stay Lemon Squeezy-flavoured.
 */
export interface CheckoutRecord {
  checkoutId: string;
  orderId: string;
  customerId: string;
  variantId: string;
  storeId: string;
  productKind: 'digital' | 'physical' | 'service' | 'license';
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  successUrl: string;
  /**
   * When `productKind === 'license'` the checkout issues a license key on
   * completion. The keyed `licenseKeyId` is only populated once the
   * downstream order paid webhook fires.
   */
  licenseKeyId?: string;
}

/**
 * License key issued by Lemon Squeezy. Real LS surfaces the key + a set of
 * activation instances (device / hostname). The dogfood app tracks the
 * canonical fields the license UI cares about.
 */
export interface LicenseKeyRecord {
  id: string;
  key: string;
  orderId: string;
  customerId: string;
  variantId: string;
  status: 'active' | 'inactive' | 'expired' | 'disabled';
  activationsLimit: number;
  activationsUsed: number;
  /**
   * Activation instances — each entry is a call to `POST /license/activate`.
   * Ordered oldest-first.
   */
  activations: LicenseActivation[];
  createdAt: number;
  expiresAt?: number;
}

export interface LicenseActivation {
  instanceId: string;
  instanceName: string;
  createdAt: number;
  revokedAt?: number;
}

/**
 * Refund record. Real Lemon Squeezy refunds fire `order_refunded` with the
 * refunded total. The dogfood app supports both full and partial refunds
 * so the release gate can diff both branches.
 */
export interface RefundRecord {
  id: string;
  orderId: string;
  customerId: string;
  amountCents: number;
  /**
   * Amount refunded in this record. For full refunds equals the order
   * amount; for partials it is the delta.
   */
  refundAmountCents: number;
  kind: 'full' | 'partial';
  reason: string;
  createdAt: number;
}

export interface DogfoodStore {
  persistCheckout(record: CheckoutRecord): void;
  getCheckout(checkoutId: string): CheckoutRecord | null;
  listCheckouts(): CheckoutRecord[];

  persistSubscription(sub: SemanticSubscription): void;
  getSubscription(id: string): SemanticSubscription | null;
  listSubscriptions(): SemanticSubscription[];

  persistOrder(inv: SemanticInvoice): void;
  getOrder(id: string): SemanticInvoice | null;
  listOrders(): SemanticInvoice[];

  persistLicenseKey(key: LicenseKeyRecord): void;
  getLicenseKey(id: string): LicenseKeyRecord | null;
  getLicenseKeyByKey(key: string): LicenseKeyRecord | null;
  listLicenseKeys(): LicenseKeyRecord[];

  persistRefund(record: RefundRecord): void;
  listRefunds(): RefundRecord[];
  listRefundsByOrder(orderId: string): RefundRecord[];

  persistChargeback(dispute: Chargeback): void;
  getChargeback(id: string): Chargeback | null;
  listChargebacks(): Chargeback[];

  recordEvent(event: PaymentWebhookEvent): void;
  eventsEmitted(): PaymentWebhookEvent[];

  reset(): void;
}

/**
 * Build a fresh {@link DogfoodStore}. Uses Map + array for O(1) lookup and
 * ordered append semantics. `reset()` clears every collection in place so
 * per-test bootstraps do not leak state across `describe` blocks.
 */
export function createDogfoodStore(): DogfoodStore {
  const checkouts = new Map<string, CheckoutRecord>();
  const subscriptions = new Map<string, SemanticSubscription>();
  const orders = new Map<string, SemanticInvoice>();
  const licenseKeys = new Map<string, LicenseKeyRecord>();
  const refunds: RefundRecord[] = [];
  const chargebacks = new Map<string, Chargeback>();
  const events: PaymentWebhookEvent[] = [];

  return {
    persistCheckout(record) {
      checkouts.set(record.checkoutId, record);
    },
    getCheckout(checkoutId) {
      return checkouts.get(checkoutId) ?? null;
    },
    listCheckouts() {
      return [...checkouts.values()];
    },

    persistSubscription(sub) {
      subscriptions.set(sub.id, sub);
    },
    getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },
    listSubscriptions() {
      return [...subscriptions.values()];
    },

    persistOrder(inv) {
      orders.set(inv.id, inv);
    },
    getOrder(id) {
      return orders.get(id) ?? null;
    },
    listOrders() {
      return [...orders.values()];
    },

    persistLicenseKey(key) {
      licenseKeys.set(key.id, key);
    },
    getLicenseKey(id) {
      return licenseKeys.get(id) ?? null;
    },
    getLicenseKeyByKey(key) {
      for (const record of licenseKeys.values()) {
        if (record.key === key) return record;
      }
      return null;
    },
    listLicenseKeys() {
      return [...licenseKeys.values()];
    },

    persistRefund(record) {
      refunds.push(record);
    },
    listRefunds() {
      return [...refunds];
    },
    listRefundsByOrder(orderId) {
      return refunds.filter((r) => r.orderId === orderId);
    },

    persistChargeback(dispute) {
      chargebacks.set(dispute.id, dispute);
    },
    getChargeback(id) {
      return chargebacks.get(id) ?? null;
    },
    listChargebacks() {
      return [...chargebacks.values()];
    },

    recordEvent(event) {
      events.push(event);
    },
    eventsEmitted() {
      return [...events];
    },

    reset() {
      checkouts.clear();
      subscriptions.clear();
      orders.clear();
      licenseKeys.clear();
      refunds.length = 0;
      chargebacks.clear();
      events.length = 0;
    },
  };
}
