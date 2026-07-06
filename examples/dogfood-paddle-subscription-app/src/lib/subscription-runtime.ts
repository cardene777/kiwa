/**
 * Paddle Billing v2 subscription domain runtime bound to a concrete payment
 * adapter.
 *
 * This is the SSOT for how subscription operations update the in-memory store
 * and which Paddle-shaped webhook events they emit. Both the mock adapter and
 * the future real driver skeleton build on this runtime so event ordering and
 * arithmetic stay aligned across modes.
 */

import {
  providerEventName,
  type PaymentAdapter,
  type PaymentWebhookEvent,
} from '@kiwa-test/payment';
import type {
  ApplyProrationInput,
  CouponStackResult,
  CreateCustomerInput,
  ExtendTrialInput,
  PaddleCustomer,
  ProrationResult,
  RefundInput,
  RefundResult,
  RetentionOfferInput,
  RetentionOfferResult,
  StackCouponInput,
  SubscribeInput,
  SubscriptionAppWebhookEvent,
  SubscriptionResult,
} from '../adapters/interface.js';
import {
  createSubscriptionStore,
  type SubscriptionStore,
} from './store.js';

export interface SubscriptionRuntime {
  readonly adapter: PaymentAdapter;
  readonly store: SubscriptionStore;

  createCustomer(input: CreateCustomerInput): Promise<PaddleCustomer>;
  getCustomer(id: string): Promise<PaddleCustomer>;
  listCustomers(): PaddleCustomer[];

  createSubscription(input: SubscribeInput): Promise<SubscriptionResult>;
  extendTrial(input: ExtendTrialInput): Promise<SubscriptionResult>;
  activateSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  listSubscriptions(filter?: { customerId?: string }): SubscriptionResult[];

  applyProration(input: ApplyProrationInput): Promise<ProrationResult>;
  listProrations(filter?: { subscriptionId?: string }): ProrationResult[];

  offerRetention(input: RetentionOfferInput): Promise<RetentionOfferResult>;
  acceptRetention(offerId: string): Promise<RetentionOfferResult>;
  listRetentionOffers(filter?: { subscriptionId?: string }): RetentionOfferResult[];

  stackCoupon(input: StackCouponInput): Promise<CouponStackResult>;
  listCouponStacks(filter?: { subscriptionId?: string }): CouponStackResult[];

  requestRefund(input: RefundInput): Promise<RefundResult>;
  listRefunds(filter?: { subscriptionId?: string }): RefundResult[];
}

export interface CreateSubscriptionRuntimeOptions {
  now?: () => number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_REFUND_WINDOW_DAYS = 14;

/**
 * Build a subscription runtime on top of a payment adapter. The runtime owns
 * deterministic ids, subscription state transitions, trial arithmetic,
 * proration deltas, retention offer flows, coupon stacking, and refund
 * window enforcement.
 */
export function createSubscriptionRuntime(
  adapter: PaymentAdapter,
  opts: CreateSubscriptionRuntimeOptions = {},
): SubscriptionRuntime {
  const store = createSubscriptionStore();
  const now = opts.now ?? Date.now;

  adapter.onWebhook((event: PaymentWebhookEvent) => {
    store.recordEvent(event as SubscriptionAppWebhookEvent);
  });

  let customerSeq = 0;
  let subscriptionSeq = 0;
  let prorationSeq = 0;
  let retentionSeq = 0;
  let refundSeq = 0;

  return {
    adapter,
    store,

    async createCustomer(input) {
      if (!input.email || !input.email.includes('@')) {
        throw subscriptionError('invalid_input', 'createCustomer: email is required');
      }
      const duplicate = store
        .listCustomers()
        .find((customer) => customer.email === input.email);
      if (duplicate) {
        throw subscriptionError(
          'duplicate_email',
          `createCustomer: duplicate email ${input.email}`,
        );
      }

      customerSeq += 1;
      const customer: PaddleCustomer = {
        id: `ctm_test_${customerSeq}`,
        email: input.email,
        country: input.country ?? 'US',
        status: 'active',
        defaultPaymentMethodId: null,
        createdAt: now(),
      };
      store.persistCustomer(customer);
      await emitSubscriptionEvent(adapter, {
        neutralType: 'customer.created',
        amountCents: 0,
        customerId: customer.email,
        detail: { customerId: customer.id, status: customer.status },
      });
      return customer;
    },

    async getCustomer(id) {
      return requireCustomer(store, id, 'getCustomer');
    },

    listCustomers() {
      return store.listCustomers();
    },

    async createSubscription(input) {
      if (input.planPriceCents <= 0) {
        throw subscriptionError(
          'invalid_amount',
          `createSubscription: planPriceCents must be > 0 (got ${input.planPriceCents})`,
        );
      }
      const customer = requireCustomer(store, input.customerId, 'createSubscription');

      if (input.idempotencyKey) {
        const existing = store
          .listSubscriptions()
          .find((subscription) => subscription.idempotencyKey === input.idempotencyKey);
        if (existing) return existing;
      }

      subscriptionSeq += 1;
      const createdAt = input.createdAtMs ?? now();
      const trialDays = input.trialDays ?? 0;
      const trialEndsAt =
        trialDays > 0 ? createdAt + trialDays * MS_PER_DAY : null;
      const initialStatus: SubscriptionResult['status'] = trialEndsAt ? 'trialing' : 'active';
      const activatedAt = trialEndsAt ? null : createdAt;

      // Coupons attached at signup only register the code; the discount
      // percent stays at 0 until the tests explicitly stack a coupon.
      const subscription: SubscriptionResult = {
        id: `sub_test_${subscriptionSeq}`,
        customerId: input.customerId,
        priceId: input.priceId,
        planPriceCents: input.planPriceCents,
        currentCyclePriceCents: input.planPriceCents,
        currency: input.currency ?? 'usd',
        status: initialStatus,
        trialDays,
        trialEndsAt,
        discountPercent: 0,
        couponCodes: input.couponCode ? [input.couponCode] : [],
        createdAt,
        activatedAt,
        pausedAt: null,
        canceledAt: null,
        ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
      };
      store.persistSubscription(subscription);

      // Attach a default payment method the first time we see the customer.
      if (customer.defaultPaymentMethodId === null) {
        store.persistCustomer({
          ...customer,
          defaultPaymentMethodId: `pm_test_${customerSeq}`,
        });
      }

      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.created',
        amountCents: subscription.planPriceCents,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          priceId: subscription.priceId,
          status: subscription.status,
        },
      });

      return subscription;
    },

    async extendTrial(input) {
      if (input.additionalDays <= 0) {
        throw subscriptionError(
          'invalid_trial_days',
          `extendTrial: additionalDays must be > 0 (got ${input.additionalDays})`,
        );
      }
      const subscription = requireSubscription(store, input.subscriptionId, 'extendTrial');
      if (subscription.status !== 'trialing') {
        throw subscriptionError(
          'not_trialing',
          `extendTrial: subscription ${subscription.id} is ${subscription.status}, must be trialing`,
        );
      }
      const additionalMs = input.additionalDays * MS_PER_DAY;
      const extended: SubscriptionResult = {
        ...subscription,
        trialDays: subscription.trialDays + input.additionalDays,
        trialEndsAt: (subscription.trialEndsAt ?? now()) + additionalMs,
      };
      store.persistSubscription(extended);
      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.trial_extended',
        amountCents: 0,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          additionalDays: input.additionalDays,
          trialEndsAt: extended.trialEndsAt,
        },
      });
      return extended;
    },

    async activateSubscription(subscriptionId) {
      const subscription = requireSubscription(store, subscriptionId, 'activateSubscription');
      if (subscription.status === 'active') {
        throw subscriptionError(
          'already_active',
          `activateSubscription: subscription ${subscription.id} is already active`,
        );
      }
      if (subscription.status === 'canceled') {
        throw subscriptionError(
          'already_canceled',
          `activateSubscription: subscription ${subscription.id} is canceled`,
        );
      }
      const activatedAt = now();
      const activated: SubscriptionResult = {
        ...subscription,
        status: 'active',
        activatedAt,
        pausedAt: null,
      };
      store.persistSubscription(activated);
      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.activated',
        amountCents: subscription.currentCyclePriceCents,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: { subscriptionId: subscription.id, activatedAt },
      });
      return activated;
    },

    async cancelSubscription(subscriptionId) {
      const subscription = requireSubscription(store, subscriptionId, 'cancelSubscription');
      if (subscription.status === 'canceled') {
        throw subscriptionError(
          'already_canceled',
          `cancelSubscription: subscription ${subscription.id} is already canceled`,
        );
      }
      const canceledAt = now();
      const canceled: SubscriptionResult = {
        ...subscription,
        status: 'canceled',
        canceledAt,
      };
      store.persistSubscription(canceled);
      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.canceled',
        amountCents: 0,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: { subscriptionId: subscription.id, canceledAt },
      });
      return canceled;
    },

    listSubscriptions(filter) {
      return store
        .listSubscriptions()
        .filter(
          (subscription) =>
            filter?.customerId === undefined || subscription.customerId === filter.customerId,
        );
    },

    async applyProration(input) {
      if (input.daysInCycle <= 0) {
        throw subscriptionError(
          'invalid_cycle',
          `applyProration: daysInCycle must be > 0 (got ${input.daysInCycle})`,
        );
      }
      if (input.daysElapsed < 0 || input.daysElapsed > input.daysInCycle) {
        throw subscriptionError(
          'invalid_elapsed',
          `applyProration: daysElapsed must be in [0, ${input.daysInCycle}]`,
        );
      }
      const subscription = requireSubscription(store, input.subscriptionId, 'applyProration');
      if (subscription.status === 'canceled') {
        throw subscriptionError(
          'already_canceled',
          `applyProration: subscription ${subscription.id} is canceled`,
        );
      }

      const oldRemainingCents = Math.round(
        (subscription.currentCyclePriceCents *
          (input.daysInCycle - input.daysElapsed)) /
          input.daysInCycle,
      );
      const newRemainingCents = Math.round(
        (input.newPlanPriceCents * (input.daysInCycle - input.daysElapsed)) /
          input.daysInCycle,
      );
      const deltaCents = newRemainingCents - oldRemainingCents;

      const oldPriceId = subscription.priceId;
      const updatedSubscription: SubscriptionResult = {
        ...subscription,
        priceId: input.newPriceId,
        planPriceCents: input.newPlanPriceCents,
        currentCyclePriceCents: input.newPlanPriceCents,
      };
      store.persistSubscription(updatedSubscription);

      prorationSeq += 1;
      const proration: ProrationResult = {
        id: `pro_test_${prorationSeq}`,
        subscriptionId: subscription.id,
        oldPriceId,
        newPriceId: input.newPriceId,
        deltaCents,
        daysElapsed: input.daysElapsed,
        daysInCycle: input.daysInCycle,
        createdAt: input.createdAtMs ?? now(),
      };
      store.persistProration(proration);

      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.proration_applied',
        amountCents: Math.abs(deltaCents),
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          deltaCents,
          isUpgrade: deltaCents > 0,
        },
      });

      return proration;
    },

    listProrations(filter) {
      return store
        .listProrations()
        .filter(
          (proration) =>
            filter?.subscriptionId === undefined ||
            proration.subscriptionId === filter.subscriptionId,
        )
        .sort((left, right) => left.createdAt - right.createdAt);
    },

    async offerRetention(input) {
      const subscription = requireSubscription(store, input.subscriptionId, 'offerRetention');
      if (subscription.status === 'canceled') {
        throw subscriptionError(
          'already_canceled',
          `offerRetention: subscription ${subscription.id} is canceled`,
        );
      }
      if (input.kind === 'pause' && (!input.pauseDays || input.pauseDays <= 0)) {
        throw subscriptionError('invalid_pause_days', 'offerRetention: pauseDays required for pause offer');
      }
      if (input.kind === 'downgrade' && (!input.newPriceId || !input.newPlanPriceCents)) {
        throw subscriptionError(
          'invalid_downgrade',
          'offerRetention: newPriceId + newPlanPriceCents required for downgrade offer',
        );
      }
      if (
        input.kind === 'coupon' &&
        (!input.couponCode || input.couponPercentOff === undefined)
      ) {
        throw subscriptionError(
          'invalid_coupon_offer',
          'offerRetention: couponCode + couponPercentOff required for coupon offer',
        );
      }

      retentionSeq += 1;
      const offer: RetentionOfferResult = {
        id: `ret_test_${retentionSeq}`,
        subscriptionId: subscription.id,
        kind: input.kind,
        accepted: false,
        ...(input.pauseDays !== undefined ? { pauseDays: input.pauseDays } : {}),
        ...(input.newPriceId !== undefined ? { newPriceId: input.newPriceId } : {}),
        ...(input.newPlanPriceCents !== undefined
          ? { newPlanPriceCents: input.newPlanPriceCents }
          : {}),
        ...(input.couponCode !== undefined ? { couponCode: input.couponCode } : {}),
        ...(input.couponPercentOff !== undefined
          ? { couponPercentOff: input.couponPercentOff }
          : {}),
        createdAt: input.createdAtMs ?? now(),
      };
      store.persistRetentionOffer(offer);
      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.retention_offered',
        amountCents: 0,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          offerId: offer.id,
          kind: offer.kind,
        },
      });
      return offer;
    },

    async acceptRetention(offerId) {
      const offer = store.getRetentionOffer(offerId);
      if (!offer) {
        throw subscriptionError('entity_not_found', `acceptRetention: offer ${offerId} not found`);
      }
      if (offer.accepted) {
        throw subscriptionError(
          'already_accepted',
          `acceptRetention: offer ${offer.id} already accepted`,
        );
      }
      const subscription = requireSubscription(store, offer.subscriptionId, 'acceptRetention');

      const accepted: RetentionOfferResult = { ...offer, accepted: true };
      store.persistRetentionOffer(accepted);

      const updatedSubscription = applyRetentionOffer(subscription, offer, now);
      store.persistSubscription(updatedSubscription);

      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.retention_accepted',
        amountCents: 0,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          offerId: offer.id,
          kind: offer.kind,
        },
      });
      return accepted;
    },

    listRetentionOffers(filter) {
      return store
        .listRetentionOffers()
        .filter(
          (offer) =>
            filter?.subscriptionId === undefined ||
            offer.subscriptionId === filter.subscriptionId,
        )
        .sort((left, right) => left.createdAt - right.createdAt);
    },

    async stackCoupon(input) {
      if (input.percentOff <= 0 || input.percentOff > 100) {
        throw subscriptionError(
          'invalid_coupon_percent',
          `stackCoupon: percentOff must be in (0, 100] (got ${input.percentOff})`,
        );
      }
      const subscription = requireSubscription(store, input.subscriptionId, 'stackCoupon');
      if (subscription.status === 'canceled') {
        throw subscriptionError(
          'already_canceled',
          `stackCoupon: subscription ${subscription.id} is canceled`,
        );
      }
      const previousCoupons = subscription.couponCodes;
      const stackable = input.stackable !== false;
      const nextCoupons = stackable ? [...previousCoupons, input.code] : [input.code];
      const nextPercent = stackable
        ? Math.min(subscription.discountPercent + input.percentOff, 100)
        : Math.min(input.percentOff, 100);
      const discountedCents = Math.round(
        (subscription.currentCyclePriceCents * (100 - nextPercent)) / 100,
      );
      const updatedSubscription: SubscriptionResult = {
        ...subscription,
        discountPercent: nextPercent,
        couponCodes: nextCoupons,
      };
      store.persistSubscription(updatedSubscription);

      const stack: CouponStackResult = {
        subscriptionId: subscription.id,
        activeCoupons: nextCoupons,
        totalPercentOff: nextPercent,
        discountedCents,
        createdAt: input.createdAtMs ?? now(),
      };
      store.persistCouponStack(stack);

      await emitSubscriptionEvent(adapter, {
        neutralType: 'subscription.coupon_stacked',
        amountCents: subscription.currentCyclePriceCents,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          couponCode: input.code,
          totalPercentOff: nextPercent,
          discountedCents,
        },
      });
      return stack;
    },

    listCouponStacks(filter) {
      return store
        .listCouponStacks()
        .filter(
          (stack) =>
            filter?.subscriptionId === undefined ||
            stack.subscriptionId === filter.subscriptionId,
        )
        .sort((left, right) => left.createdAt - right.createdAt);
    },

    async requestRefund(input) {
      const subscription = requireSubscription(store, input.subscriptionId, 'requestRefund');
      const refundWindowDays = input.refundWindowDays ?? DEFAULT_REFUND_WINDOW_DAYS;
      const ageMs = input.requestedAtMs - subscription.createdAt;
      const withinWindow = ageMs >= 0 && ageMs <= refundWindowDays * MS_PER_DAY;

      refundSeq += 1;
      const refund: RefundResult = withinWindow
        ? {
            id: `rfd_test_${refundSeq}`,
            subscriptionId: subscription.id,
            status: 'granted',
            amountCents: subscription.currentCyclePriceCents,
            requestedAt: input.requestedAtMs,
          }
        : {
            id: `rfd_test_${refundSeq}`,
            subscriptionId: subscription.id,
            status: 'denied',
            amountCents: 0,
            requestedAt: input.requestedAtMs,
            reason: 'refund_window_exceeded',
          };
      store.persistRefund(refund);

      await emitSubscriptionEvent(adapter, {
        neutralType:
          refund.status === 'granted' ? 'subscription.refund_granted' : 'subscription.refund_denied',
        amountCents: refund.amountCents,
        currency: subscription.currency,
        customerId: subscription.customerId,
        detail: {
          subscriptionId: subscription.id,
          refundId: refund.id,
          status: refund.status,
        },
      });
      return refund;
    },

    listRefunds(filter) {
      return store
        .listRefunds()
        .filter(
          (refund) =>
            filter?.subscriptionId === undefined ||
            refund.subscriptionId === filter.subscriptionId,
        )
        .sort((left, right) => left.requestedAt - right.requestedAt);
    },
  };
}

function applyRetentionOffer(
  subscription: SubscriptionResult,
  offer: RetentionOfferResult,
  now: () => number,
): SubscriptionResult {
  if (offer.kind === 'pause' && offer.pauseDays) {
    return {
      ...subscription,
      status: 'paused',
      pausedAt: now(),
    };
  }
  if (offer.kind === 'downgrade' && offer.newPriceId && offer.newPlanPriceCents) {
    return {
      ...subscription,
      priceId: offer.newPriceId,
      planPriceCents: offer.newPlanPriceCents,
      currentCyclePriceCents: offer.newPlanPriceCents,
    };
  }
  if (offer.kind === 'coupon' && offer.couponCode && offer.couponPercentOff) {
    const nextPercent = Math.min(subscription.discountPercent + offer.couponPercentOff, 100);
    return {
      ...subscription,
      discountPercent: nextPercent,
      couponCodes: [...subscription.couponCodes, offer.couponCode],
    };
  }
  return subscription;
}

function requireCustomer(
  store: SubscriptionStore,
  customerId: string,
  op: string,
): PaddleCustomer {
  const customer = store.getCustomer(customerId);
  if (!customer) {
    throw subscriptionError('entity_not_found', `${op}: customer ${customerId} not found`);
  }
  return customer;
}

function requireSubscription(
  store: SubscriptionStore,
  subscriptionId: string,
  op: string,
): SubscriptionResult {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription) {
    throw subscriptionError(
      'entity_not_found',
      `${op}: subscription ${subscriptionId} not found`,
    );
  }
  return subscription;
}

function subscriptionError(reason: string, message: string): Error & { reason: string } {
  const err = new Error(message) as Error & { reason: string };
  err.reason = reason;
  return err;
}

async function emitSubscriptionEvent(
  adapter: PaymentAdapter,
  input: {
    neutralType: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  const signed = adapter.signWebhook({
    type: subscriptionEventName(input.neutralType),
    amountCents: input.amountCents,
    customerId: input.customerId,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  });
  const event: SubscriptionAppWebhookEvent = {
    ...signed.event,
    ...(input.detail !== undefined ? { detail: input.detail } : {}),
  };
  await adapter.emit(event);
}

function subscriptionEventName(neutralType: string): string {
  return providerEventName('paddle', neutralType as never);
}
