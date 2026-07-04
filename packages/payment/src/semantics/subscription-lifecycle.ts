import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep, type NeutralEventName } from './types.js';

/**
 * Subscription lifecycle state machine. Real providers converge on the
 * same 7-state envelope: created → (upgraded / downgraded / paused /
 * resumed) → canceled → reactivated. This module wraps that envelope with
 * strict transition guards so tests fail loudly on invalid transitions.
 */
export type SubscriptionState =
  | 'active'
  | 'upgraded'
  | 'downgraded'
  | 'paused'
  | 'canceled';

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  state: SubscriptionState;
  history: AxisStep<SubscriptionState>[];
}

/**
 * Create a new subscription. Emits `subscription.created`.
 */
export async function createSubscription(
  adapter: PaymentAdapter,
  input: {
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
  },
): Promise<{ subscription: Subscription; step: AxisStep<SubscriptionState> }> {
  const providerEvent = providerEventName(adapter.provider, 'subscription.created');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.amountCents,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  const subscription: Subscription = {
    id: `sub_${event.id}`,
    customerId: input.customerId,
    planId: input.planId,
    amountCents: input.amountCents,
    state: 'active',
    history: [],
  };
  if (input.currency !== undefined) subscription.currency = input.currency;
  const step: AxisStep<SubscriptionState> = {
    neutralEvent: 'subscription.created',
    providerEvent,
    state: 'active',
    amountCents: input.amountCents,
    metadata: {
      subscriptionId: subscription.id,
      planId: input.planId,
    },
  };
  subscription.history.push(step);
  return { subscription, step };
}

/**
 * Change plan (upgrade or downgrade). The amount change relative to the
 * current plan determines the neutral event: strictly greater = `upgraded`,
 * strictly less = `downgraded`. Equal-amount change is rejected so tests
 * exercise no-op guards explicitly.
 */
export async function changePlan(
  adapter: PaymentAdapter,
  subscription: Subscription,
  input: { newPlanId: string; newAmountCents: number },
): Promise<AxisStep<SubscriptionState>> {
  if (subscription.state === 'canceled') {
    throw new Error(`changePlan: subscription ${subscription.id} is canceled`);
  }
  if (subscription.state === 'paused') {
    throw new Error(`changePlan: subscription ${subscription.id} is paused, resume first`);
  }
  if (input.newAmountCents === subscription.amountCents) {
    throw new Error('changePlan: newAmountCents equals current amountCents (no-op)');
  }
  const isUpgrade = input.newAmountCents > subscription.amountCents;
  const neutral: NeutralEventName = isUpgrade ? 'subscription.upgraded' : 'subscription.downgraded';
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.newAmountCents,
    ...(subscription.currency !== undefined ? { currency: subscription.currency } : {}),
    customerId: subscription.customerId,
  });
  await adapter.emit(event);
  const prevAmount = subscription.amountCents;
  const prevPlan = subscription.planId;
  subscription.amountCents = input.newAmountCents;
  subscription.planId = input.newPlanId;
  subscription.state = isUpgrade ? 'upgraded' : 'downgraded';
  const step: AxisStep<SubscriptionState> = {
    neutralEvent: neutral,
    providerEvent,
    state: subscription.state,
    amountCents: input.newAmountCents,
    metadata: {
      subscriptionId: subscription.id,
      previousPlanId: prevPlan,
      newPlanId: input.newPlanId,
      previousAmountCents: prevAmount,
      newAmountCents: input.newAmountCents,
      isUpgrade,
    },
  };
  subscription.history.push(step);
  return step;
}

/**
 * Pause the subscription. Emits `subscription.paused`. Only allowed from
 * active / upgraded / downgraded states.
 */
export async function pauseSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>> {
  if (subscription.state === 'canceled' || subscription.state === 'paused') {
    throw new Error(`pauseSubscription: subscription is ${subscription.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'subscription.paused');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(subscription.currency !== undefined ? { currency: subscription.currency } : {}),
    customerId: subscription.customerId,
  });
  await adapter.emit(event);
  subscription.state = 'paused';
  const step: AxisStep<SubscriptionState> = {
    neutralEvent: 'subscription.paused',
    providerEvent,
    state: 'paused',
    amountCents: 0,
    metadata: {
      subscriptionId: subscription.id,
      pausedAt: event.timestamp,
    },
  };
  subscription.history.push(step);
  return step;
}

/**
 * Resume a paused subscription. Emits `subscription.resumed`. Only allowed
 * from `paused`.
 */
export async function resumeSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>> {
  if (subscription.state !== 'paused') {
    throw new Error(`resumeSubscription: subscription is ${subscription.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'subscription.resumed');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: subscription.amountCents,
    ...(subscription.currency !== undefined ? { currency: subscription.currency } : {}),
    customerId: subscription.customerId,
  });
  await adapter.emit(event);
  subscription.state = 'active';
  const step: AxisStep<SubscriptionState> = {
    neutralEvent: 'subscription.resumed',
    providerEvent,
    state: 'active',
    amountCents: subscription.amountCents,
    metadata: {
      subscriptionId: subscription.id,
      resumedAt: event.timestamp,
    },
  };
  subscription.history.push(step);
  return step;
}

/**
 * Cancel the subscription. Emits `subscription.canceled`. Idempotent guard:
 * cancelling an already-canceled subscription throws.
 */
export async function cancelSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>> {
  if (subscription.state === 'canceled') {
    throw new Error(`cancelSubscription: subscription is already canceled`);
  }
  const providerEvent = providerEventName(adapter.provider, 'subscription.canceled');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(subscription.currency !== undefined ? { currency: subscription.currency } : {}),
    customerId: subscription.customerId,
  });
  await adapter.emit(event);
  subscription.state = 'canceled';
  const step: AxisStep<SubscriptionState> = {
    neutralEvent: 'subscription.canceled',
    providerEvent,
    state: 'canceled',
    amountCents: 0,
    metadata: {
      subscriptionId: subscription.id,
      canceledAt: event.timestamp,
    },
  };
  subscription.history.push(step);
  return step;
}

/**
 * Reactivate a canceled subscription. Emits `subscription.reactivated`.
 * Only allowed from `canceled` — the subscription returns to `active`.
 */
export async function reactivateSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>> {
  if (subscription.state !== 'canceled') {
    throw new Error(`reactivateSubscription: subscription is ${subscription.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'subscription.reactivated');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: subscription.amountCents,
    ...(subscription.currency !== undefined ? { currency: subscription.currency } : {}),
    customerId: subscription.customerId,
  });
  await adapter.emit(event);
  subscription.state = 'active';
  const step: AxisStep<SubscriptionState> = {
    neutralEvent: 'subscription.reactivated',
    providerEvent,
    state: 'active',
    amountCents: subscription.amountCents,
    metadata: {
      subscriptionId: subscription.id,
      reactivatedAt: event.timestamp,
    },
  };
  subscription.history.push(step);
  return step;
}
