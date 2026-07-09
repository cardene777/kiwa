/**
 * Framework-agnostic in-memory store for Paddle merchant-of-record data —
 * subscriptions + transactions (Paddle's invoice-equivalent) + tax lines +
 * checkout sessions + emitted webhook events.
 *
 * Mirrors the surface a real database + audit log deployment would expose so
 * the same Nuxt 3 server routes can flip between the real Paddle sandbox
 * driver and the `@kiwa-lab/payment` mock without knowing which is in play.
 *
 * The store is in-memory + per-instance; production RPs swap this for a
 * database. The mock is fine for a dogfood app because every test bootstraps
 * a fresh server.
 */

import type {
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
  TaxLine,
} from '@kiwa-lab/payment';

/**
 * Paddle inline checkout session. Real Paddle returns a checkout `id` +
 * hosted checkout URL that the merchant embeds via Paddle.js. The dogfood
 * app mirrors the shape so route handlers stay Paddle-flavoured.
 */
export interface CheckoutRecord {
  checkoutId: string;
  transactionId: string;
  customerId: string;
  priceId: string;
  planId: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry: string;
  taxLine?: TaxLine;
}

/**
 * Tax record — every tax calculation the merchant did is persisted so the
 * tax UI can show a running list of VAT/GST/sales-tax decisions per
 * customer + jurisdiction. Real Paddle Merchant-of-Record handles this
 * automatically; the dogfood app stores enough to reproduce the invoice
 * upcoming preview.
 */
export interface TaxRecord {
  id: string;
  customerId: string;
  line: TaxLine;
  createdAt: number;
}

export interface BillingStore {
  persistSubscription(sub: SemanticSubscription): void;
  getSubscription(id: string): SemanticSubscription | null;
  listSubscriptions(): SemanticSubscription[];

  persistTransaction(inv: SemanticInvoice): void;
  getTransaction(id: string): SemanticInvoice | null;
  listTransactions(): SemanticInvoice[];

  persistCheckout(record: CheckoutRecord): void;
  getCheckout(checkoutId: string): CheckoutRecord | null;
  listCheckouts(): CheckoutRecord[];

  persistTax(record: TaxRecord): void;
  listTax(): TaxRecord[];

  recordEvent(event: PaymentWebhookEvent): void;
  eventsEmitted(): PaymentWebhookEvent[];

  reset(): void;
}

/**
 * Build a fresh {@link BillingStore}. Uses Map + array for O(1) lookup and
 * ordered append semantics. `reset()` clears every collection in place so
 * per-test bootstraps do not leak state across `describe` blocks.
 */
export function createBillingStore(): BillingStore {
  const subscriptions = new Map<string, SemanticSubscription>();
  const transactions = new Map<string, SemanticInvoice>();
  const checkouts = new Map<string, CheckoutRecord>();
  const taxes: TaxRecord[] = [];
  const events: PaymentWebhookEvent[] = [];

  return {
    persistSubscription(sub) {
      subscriptions.set(sub.id, sub);
    },
    getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },
    listSubscriptions() {
      return [...subscriptions.values()];
    },
    persistTransaction(inv) {
      transactions.set(inv.id, inv);
    },
    getTransaction(id) {
      return transactions.get(id) ?? null;
    },
    listTransactions() {
      return [...transactions.values()];
    },
    persistCheckout(record) {
      checkouts.set(record.checkoutId, record);
    },
    getCheckout(checkoutId) {
      return checkouts.get(checkoutId) ?? null;
    },
    listCheckouts() {
      return [...checkouts.values()];
    },
    persistTax(record) {
      taxes.push(record);
    },
    listTax() {
      return [...taxes];
    },
    recordEvent(event) {
      events.push(event);
    },
    eventsEmitted() {
      return [...events];
    },
    reset() {
      subscriptions.clear();
      transactions.clear();
      checkouts.clear();
      taxes.length = 0;
      events.length = 0;
    },
  };
}
