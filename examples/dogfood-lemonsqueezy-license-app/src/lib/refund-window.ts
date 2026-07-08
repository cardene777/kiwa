/**
 * Refund window enforcement — evaluates whether a refund is allowed
 * against a paid order given the merchant's 30-day money-back guarantee
 * policy. Refunds inside the window can be full or partial; refunds
 * outside the window are rejected with `refund_window_expired`.
 *
 * Wraps @kiwa/payment refund-advanced axis conceptually (window +
 * policy caps) with a dogfood-scope surface — the routes call these
 * helpers instead of the raw axis so tests can pin against clear return
 * shapes and error kinds.
 */

import type { AppStore, OrderRecord, RefundRecord } from './store.js';
import { revokeLicense } from './license-issue.js';

/**
 * The Lemon Squeezy default 30-day money-back guarantee. Callers can
 * override via {@link RefundWindowPolicy}.
 */
export const THIRTY_DAY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Refund window + amount policy configuration. `chargebackPrevention`
 * mirrors the @kiwa/payment axis flag — when true, the merchant is
 * willing to refund even outside the window to head off chargeback fees.
 */
export interface RefundWindowPolicy {
  /** window in ms (default 30 day) */
  windowMs: number;
  /** minimum refund cents (per attempt) */
  minAmountCents?: number;
  /** maximum refund cents (per attempt) */
  maxAmountCents?: number;
  /** allow refund outside window to preempt chargeback */
  chargebackPrevention?: boolean;
}

/**
 * Default 30-day money-back policy — no min / max caps, no chargeback
 * override.
 */
export const DEFAULT_POLICY: RefundWindowPolicy = {
  windowMs: THIRTY_DAY_MS,
};

/**
 * Evaluate whether a refund would be accepted against the order given
 * the current `now` timestamp. Returns a discriminated result so
 * callers can produce stable error kinds. `priorRefundedCents` is the
 * total already refunded against the order — passed in so the guard
 * can reject a partial refund that would push cumulative refunds past
 * the original order amount.
 */
export function evaluateRefund(
  order: OrderRecord,
  input: {
    amountCents: number;
    now: number;
    policy?: RefundWindowPolicy;
    priorRefundedCents?: number;
  },
):
  | { allowed: true; kind: 'full' | 'partial' }
  | {
      allowed: false;
      reason:
        | 'window_expired'
        | 'amount_below_min'
        | 'amount_above_max'
        | 'amount_exceeds_original'
        | 'order_already_fully_refunded'
        | 'non_positive_amount';
    } {
  const policy = input.policy ?? DEFAULT_POLICY;
  const priorRefunded = input.priorRefundedCents ?? 0;
  if (input.amountCents <= 0) {
    return { allowed: false, reason: 'non_positive_amount' };
  }
  if (order.state === 'refunded') {
    return { allowed: false, reason: 'order_already_fully_refunded' };
  }
  const outsideWindow = input.now - order.paidAt > policy.windowMs;
  if (outsideWindow && policy.chargebackPrevention !== true) {
    return { allowed: false, reason: 'window_expired' };
  }
  if (
    policy.minAmountCents !== undefined &&
    input.amountCents < policy.minAmountCents
  ) {
    return { allowed: false, reason: 'amount_below_min' };
  }
  if (
    policy.maxAmountCents !== undefined &&
    input.amountCents > policy.maxAmountCents
  ) {
    return { allowed: false, reason: 'amount_above_max' };
  }
  if (priorRefunded + input.amountCents > order.amountCents) {
    return { allowed: false, reason: 'amount_exceeds_original' };
  }
  const totalAfter = priorRefunded + input.amountCents;
  const kind: 'full' | 'partial' =
    totalAfter === order.amountCents ? 'full' : 'partial';
  return { allowed: true, kind };
}

/**
 * Issue a refund + write the resulting record to the store. Revokes
 * the associated license on full refund (mirrors merchant policy —
 * refunded license keys are recovered).
 */
export function issueRefund(
  store: AppStore,
  input: {
    orderId: string;
    amountCents: number;
    now: number;
    policy?: RefundWindowPolicy;
  },
): RefundRecord {
  const order = store.orders.get(input.orderId);
  if (order === undefined) throw new Error('order_not_found');
  const priorRefundedCents = totalRefundedForOrder(store, input.orderId);
  const evaluation = evaluateRefund(order, {
    amountCents: input.amountCents,
    now: input.now,
    priorRefundedCents,
    ...(input.policy !== undefined ? { policy: input.policy } : {}),
  });
  if (evaluation.allowed !== true) {
    throw new Error(`refund_${evaluation.reason}`);
  }
  const id = `ref_${store.refunds.size + 1}_${input.orderId}`;
  const refund: RefundRecord = {
    id,
    orderId: input.orderId,
    originalAmountCents: order.amountCents,
    refundedCents: input.amountCents,
    kind: evaluation.kind,
    refundedAt: input.now,
    customerId: order.customerId,
  };
  store.refunds.set(id, refund);
  order.state = evaluation.kind === 'full' ? 'refunded' : 'partial-refunded';
  if (evaluation.kind === 'full' && order.licenseId !== undefined) {
    const license = store.licenses.get(order.licenseId);
    if (license !== undefined) {
      revokeLicense(store, { licenseKey: license.key, now: input.now });
    }
  }
  return refund;
}

/**
 * Sum the refunded cents for a specific order — used to prevent an
 * over-refund via multiple partial refunds.
 */
export function totalRefundedForOrder(
  store: AppStore,
  orderId: string,
): number {
  let total = 0;
  for (const refund of store.refunds.values()) {
    if (refund.orderId === orderId) total += refund.refundedCents;
  }
  return total;
}
