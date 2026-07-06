/**
 * Framework-agnostic in-memory store for the Paddle Billing v2 subscription
 * domain objects.
 *
 * The mock runtime persists customers, subscriptions, prorations, retention
 * offers, coupon stacks, refunds, and emitted webhook events here so the
 * route handlers can stay stateless and the tests can boot a fresh isolated
 * runtime per case.
 */

import type {
  CouponStackResult,
  PaddleCustomer,
  ProrationResult,
  RefundResult,
  RetentionOfferResult,
  SubscriptionAppWebhookEvent,
  SubscriptionResult,
} from '../adapters/interface.js';

export interface SubscriptionStore {
  persistCustomer(customer: PaddleCustomer): void;
  getCustomer(id: string): PaddleCustomer | null;
  listCustomers(): PaddleCustomer[];

  persistSubscription(subscription: SubscriptionResult): void;
  getSubscription(id: string): SubscriptionResult | null;
  listSubscriptions(): SubscriptionResult[];

  persistProration(proration: ProrationResult): void;
  listProrations(): ProrationResult[];

  persistRetentionOffer(offer: RetentionOfferResult): void;
  getRetentionOffer(id: string): RetentionOfferResult | null;
  listRetentionOffers(): RetentionOfferResult[];

  persistCouponStack(stack: CouponStackResult): void;
  listCouponStacks(): CouponStackResult[];

  persistRefund(refund: RefundResult): void;
  listRefunds(): RefundResult[];

  recordEvent(event: SubscriptionAppWebhookEvent): void;
  eventsEmitted(): SubscriptionAppWebhookEvent[];

  reset(): void;
}

/**
 * Build a fresh in-memory subscription store. Tests create one runtime per
 * case and call `reset()` in `afterEach` so no state bleeds across cases.
 */
export function createSubscriptionStore(): SubscriptionStore {
  const customers = new Map<string, PaddleCustomer>();
  const subscriptions = new Map<string, SubscriptionResult>();
  const prorations: ProrationResult[] = [];
  const retentionOffers = new Map<string, RetentionOfferResult>();
  const couponStacks: CouponStackResult[] = [];
  const refunds: RefundResult[] = [];
  const events: SubscriptionAppWebhookEvent[] = [];

  return {
    persistCustomer(customer) {
      customers.set(customer.id, { ...customer });
    },
    getCustomer(id) {
      const customer = customers.get(id);
      return customer ? { ...customer } : null;
    },
    listCustomers() {
      return Array.from(customers.values(), (customer) => ({ ...customer }));
    },
    persistSubscription(subscription) {
      subscriptions.set(subscription.id, cloneSubscription(subscription));
    },
    getSubscription(id) {
      const subscription = subscriptions.get(id);
      return subscription ? cloneSubscription(subscription) : null;
    },
    listSubscriptions() {
      return Array.from(subscriptions.values(), cloneSubscription);
    },
    persistProration(proration) {
      prorations.push({ ...proration });
    },
    listProrations() {
      return prorations.map((proration) => ({ ...proration }));
    },
    persistRetentionOffer(offer) {
      retentionOffers.set(offer.id, { ...offer });
    },
    getRetentionOffer(id) {
      const offer = retentionOffers.get(id);
      return offer ? { ...offer } : null;
    },
    listRetentionOffers() {
      return Array.from(retentionOffers.values(), (offer) => ({ ...offer }));
    },
    persistCouponStack(stack) {
      couponStacks.push({
        ...stack,
        activeCoupons: [...stack.activeCoupons],
      });
    },
    listCouponStacks() {
      return couponStacks.map((stack) => ({
        ...stack,
        activeCoupons: [...stack.activeCoupons],
      }));
    },
    persistRefund(refund) {
      refunds.push({ ...refund });
    },
    listRefunds() {
      return refunds.map((refund) => ({ ...refund }));
    },
    recordEvent(event) {
      const entry: SubscriptionAppWebhookEvent = {
        ...event,
        ...(event.detail !== undefined ? { detail: { ...event.detail } } : {}),
      };
      events.push(entry);
    },
    eventsEmitted() {
      return events.map((event) => ({
        ...event,
        ...(event.detail !== undefined ? { detail: { ...event.detail } } : {}),
      }));
    },
    reset() {
      customers.clear();
      subscriptions.clear();
      prorations.length = 0;
      retentionOffers.clear();
      couponStacks.length = 0;
      refunds.length = 0;
      events.length = 0;
    },
  };
}

function cloneSubscription(subscription: SubscriptionResult): SubscriptionResult {
  return {
    ...subscription,
    couponCodes: [...subscription.couponCodes],
  };
}
