/**
 * Framework-agnostic in-memory store for subscriptions + invoices + emitted
 * events. Mirrors the surface a real database + audit log deployment would
 * expose so the same Next.js route handlers can flip between the real Stripe
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
  ThreeDsSession,
  DunningSession,
} from '@kiwa-lab/payment';

export interface CheckoutRecord {
  sessionId: string;
  paymentIntentId: string;
  customerId: string;
  planId: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  threeDsPaymentIntentId?: string;
}

export interface BillingStore {
  persistSubscription(sub: SemanticSubscription): void;
  getSubscription(id: string): SemanticSubscription | null;
  listSubscriptions(): SemanticSubscription[];

  persistInvoice(inv: SemanticInvoice): void;
  getInvoice(id: string): SemanticInvoice | null;
  listInvoices(): SemanticInvoice[];

  persistCheckout(record: CheckoutRecord): void;
  getCheckout(sessionId: string): CheckoutRecord | null;

  persistThreeDs(session: ThreeDsSession): void;
  getThreeDs(paymentIntentId: string): ThreeDsSession | null;

  persistDunning(session: DunningSession): void;
  getDunning(invoiceId: string): DunningSession | null;

  recordEvent(event: PaymentWebhookEvent): void;
  eventsEmitted(): PaymentWebhookEvent[];

  reset(): void;
}

export function createBillingStore(): BillingStore {
  const subscriptions = new Map<string, SemanticSubscription>();
  const invoices = new Map<string, SemanticInvoice>();
  const checkouts = new Map<string, CheckoutRecord>();
  const threeDsSessions = new Map<string, ThreeDsSession>();
  const dunningSessions = new Map<string, DunningSession>();
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
    persistInvoice(inv) {
      invoices.set(inv.id, inv);
    },
    getInvoice(id) {
      return invoices.get(id) ?? null;
    },
    listInvoices() {
      return [...invoices.values()];
    },
    persistCheckout(record) {
      checkouts.set(record.sessionId, record);
    },
    getCheckout(sessionId) {
      return checkouts.get(sessionId) ?? null;
    },
    persistThreeDs(session) {
      threeDsSessions.set(session.paymentIntentId, session);
    },
    getThreeDs(paymentIntentId) {
      return threeDsSessions.get(paymentIntentId) ?? null;
    },
    persistDunning(session) {
      dunningSessions.set(session.invoiceId, session);
    },
    getDunning(invoiceId) {
      return dunningSessions.get(invoiceId) ?? null;
    },
    recordEvent(event) {
      events.push(event);
    },
    eventsEmitted() {
      return [...events];
    },
    reset() {
      subscriptions.clear();
      invoices.clear();
      checkouts.clear();
      threeDsSessions.clear();
      dunningSessions.clear();
      events.length = 0;
    },
  };
}
