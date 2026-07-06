import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Subscription state machine axis — grace period + pause / resume +
 * proration + coupon stacking. Real subscription billing has a distinct
 * grace period (past-due but not yet cancelled), first-class pause /
 * resume (Stripe `paused_collection`, Paddle `subscription.paused`),
 * mid-cycle proration for plan changes, and stackable discounts /
 * coupons whose effective percent must be recomputed on every renewal.
 */
export type SubscriptionMachineState =
  | 'active'
  | 'grace-period'
  | 'paused'
  | 'canceled'
  | 'expired';

export interface CouponEntry {
  code: string;
  percentOff: number;
  amountOffCents?: number;
  /** ms until the coupon expires; 0 = never */
  ttlMs?: number;
  /** whether this coupon can stack with others */
  stackable?: boolean;
}

export interface SubscriptionMachineSession {
  subscriptionId: string;
  customerId: string;
  planPriceCents: number;
  currency?: string;
  currentCyclePriceCents: number;
  state: SubscriptionMachineState;
  gracePeriodMs: number;
  gracePeriodEnteredAt: number | null;
  pausedAt: number | null;
  coupons: CouponEntry[];
  history: AxisStep<SubscriptionMachineState>[];
}

/**
 * Start a subscription state-machine session against an existing
 * subscription. This wraps the v0.3 subscription-lifecycle axis with the
 * fine-grained payment-side state (grace period + coupon stacking) that
 * downstream tests need to assert on.
 */
export function startSubscriptionMachine(input: {
  subscriptionId: string;
  customerId: string;
  planPriceCents: number;
  currency?: string;
  gracePeriodMs?: number;
}): SubscriptionMachineSession {
  const session: SubscriptionMachineSession = {
    subscriptionId: input.subscriptionId,
    customerId: input.customerId,
    planPriceCents: input.planPriceCents,
    currentCyclePriceCents: input.planPriceCents,
    state: 'active',
    gracePeriodMs: input.gracePeriodMs ?? 7 * 24 * 60 * 60 * 1000,
    gracePeriodEnteredAt: null,
    pausedAt: null,
    coupons: [],
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Enter grace period after payment failure. Grace period is a bounded
 * window where the subscription is still active from the customer's POV
 * but the merchant has stopped granting renewed entitlement.
 */
export async function enterGracePeriod(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
): Promise<AxisStep<SubscriptionMachineState>> {
  if (session.state !== 'active') {
    throw new Error(`enterGracePeriod: session is ${session.state}, must be active`);
  }
  session.state = 'grace-period';
  session.gracePeriodEnteredAt = Date.now();
  return emit(adapter, session, 'subscription.grace_period_entered', {
    graceEndsAt: session.gracePeriodEnteredAt + session.gracePeriodMs,
  });
}

/**
 * Exit grace period — either payment recovered (returns to active) or
 * timeout reached (returns to expired).
 */
export async function exitGracePeriod(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  input: { recovered: boolean },
): Promise<AxisStep<SubscriptionMachineState>> {
  if (session.state !== 'grace-period') {
    throw new Error(`exitGracePeriod: session is ${session.state}`);
  }
  session.state = input.recovered ? 'active' : 'expired';
  session.gracePeriodEnteredAt = null;
  return emit(adapter, session, 'subscription.grace_period_exited', {
    recovered: input.recovered,
  });
}

/**
 * Apply proration for a mid-cycle plan change. `daysElapsed` is the number
 * of days into the current billing cycle; `newPlanPriceCents` is the target
 * plan's monthly price.
 */
export async function applyProration(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  input: {
    daysElapsed: number;
    daysInCycle: number;
    newPlanPriceCents: number;
  },
): Promise<AxisStep<SubscriptionMachineState>> {
  if (input.daysInCycle <= 0) {
    throw new Error('applyProration: daysInCycle must be positive');
  }
  const oldRemainingCents = Math.round(
    (session.currentCyclePriceCents * (input.daysInCycle - input.daysElapsed)) / input.daysInCycle,
  );
  const newRemainingCents = Math.round(
    (input.newPlanPriceCents * (input.daysInCycle - input.daysElapsed)) / input.daysInCycle,
  );
  const prorationDeltaCents = newRemainingCents - oldRemainingCents;
  session.currentCyclePriceCents = input.newPlanPriceCents;
  return emit(adapter, session, 'subscription.proration_applied', {
    daysElapsed: input.daysElapsed,
    daysInCycle: input.daysInCycle,
    prorationDeltaCents,
    oldPlanCents: session.planPriceCents,
    newPlanCents: input.newPlanPriceCents,
  });
}

/**
 * Add a coupon to the stack. Non-stackable coupons replace any existing
 * coupon; stackable coupons combine.
 */
export async function stackCoupon(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  input: CouponEntry,
): Promise<AxisStep<SubscriptionMachineState>> {
  if (input.stackable === false) {
    session.coupons = [input];
  } else {
    // Only stackable coupons combine; non-stackable existing coupons stay.
    const nonStackable = session.coupons.filter((c) => c.stackable === false);
    const stackable = session.coupons.filter((c) => c.stackable !== false);
    session.coupons = [...nonStackable, ...stackable, input];
  }
  const totalPercent = session.coupons.reduce((acc, c) => acc + c.percentOff, 0);
  const cappedPercent = Math.min(totalPercent, 100);
  const discountedCents = Math.round(
    (session.currentCyclePriceCents * (100 - cappedPercent)) / 100,
  );
  return emit(adapter, session, 'subscription.coupon_stacked', {
    couponCode: input.code,
    stackSize: session.coupons.length,
    totalPercentOff: cappedPercent,
    discountedCents,
  });
}

async function emit(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  neutral:
    | 'subscription.grace_period_entered'
    | 'subscription.grace_period_exited'
    | 'subscription.proration_applied'
    | 'subscription.coupon_stacked',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<SubscriptionMachineState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.currentCyclePriceCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<SubscriptionMachineState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.currentCyclePriceCents,
    metadata: {
      subscriptionId: session.subscriptionId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
