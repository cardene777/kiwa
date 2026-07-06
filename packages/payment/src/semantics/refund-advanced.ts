import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Refund advanced axis — partial refund + refund policy + refund window +
 * chargeback prevention. Real merchants apply time-window policies (30
 * day / 60 day / no-refund), partial refunds with amount caps, and use
 * refunds proactively to head off chargebacks that would otherwise incur
 * $15-$25 fees plus liability shift.
 */
export type RefundState =
  | 'requested'
  | 'partial-issued'
  | 'full-issued'
  | 'window-expired'
  | 'policy-denied';

export interface RefundPolicy {
  /** ms window in which refunds are allowed */
  windowMs: number;
  /** minimum refundable amount in cents */
  minAmountCents?: number;
  /** maximum single-refund amount in cents */
  maxAmountCents?: number;
  /** whether the merchant proactively refunds to prevent chargebacks */
  chargebackPrevention?: boolean;
}

export interface RefundSession {
  chargeId: string;
  originalAmountCents: number;
  chargedAt: number;
  customerId: string;
  currency?: string;
  policy: RefundPolicy;
  refundedCents: number;
  state: RefundState;
  history: AxisStep<RefundState>[];
}

/**
 * Start a refund session against an existing charge. `chargedAt` is the
 * original charge timestamp; the window policy is evaluated relative to
 * this timestamp.
 */
export function startRefund(input: {
  chargeId: string;
  originalAmountCents: number;
  chargedAt: number;
  customerId: string;
  currency?: string;
  policy: RefundPolicy;
}): RefundSession {
  const session: RefundSession = {
    chargeId: input.chargeId,
    originalAmountCents: input.originalAmountCents,
    chargedAt: input.chargedAt,
    customerId: input.customerId,
    policy: input.policy,
    refundedCents: 0,
    state: 'requested',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Issue a partial refund. Fails if the window has expired, if the amount
 * violates policy, or if a prior full refund has already exhausted the
 * charge.
 */
export async function partialRefund(
  adapter: PaymentAdapter,
  session: RefundSession,
  input: { amountCents: number },
): Promise<AxisStep<RefundState>> {
  guardWindow(session);
  guardAmount(session, input.amountCents);
  if (session.refundedCents + input.amountCents > session.originalAmountCents) {
    throw new Error('partialRefund: refund exceeds original charge');
  }
  session.refundedCents += input.amountCents;
  session.state = 'partial-issued';
  return emit(adapter, session, 'refund.partial', input.amountCents);
}

/**
 * Issue a full refund. Marks the session as fully refunded.
 */
export async function fullRefund(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>> {
  guardWindow(session);
  const remaining = session.originalAmountCents - session.refundedCents;
  if (remaining <= 0) {
    throw new Error('fullRefund: no remaining amount to refund');
  }
  session.refundedCents += remaining;
  session.state = 'full-issued';
  return emit(adapter, session, 'refund.full', remaining);
}

/**
 * Explicit deny — the merchant refuses the refund because it violates
 * policy (e.g., digital goods post-download).
 */
export async function denyByPolicy(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>> {
  session.state = 'policy-denied';
  return emit(adapter, session, 'refund.policy_denied', 0);
}

/**
 * Emit the window-expired terminal — refund attempted outside the window.
 */
export async function markWindowExpired(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>> {
  session.state = 'window-expired';
  return emit(adapter, session, 'refund.window_expired', 0);
}

/**
 * Chargeback prevention utility — issues a full refund whenever the
 * merchant preemptively wants to head off a chargeback. Only fires if
 * the policy has `chargebackPrevention: true`.
 */
export async function preventChargeback(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>> {
  if (!session.policy.chargebackPrevention) {
    throw new Error('preventChargeback: chargebackPrevention disabled in policy');
  }
  return fullRefund(adapter, session);
}

function guardWindow(session: RefundSession): void {
  if (Date.now() - session.chargedAt > session.policy.windowMs) {
    throw new Error('refund window has expired');
  }
}

function guardAmount(session: RefundSession, amountCents: number): void {
  if (session.policy.minAmountCents !== undefined && amountCents < session.policy.minAmountCents) {
    throw new Error('amount below minAmountCents');
  }
  if (session.policy.maxAmountCents !== undefined && amountCents > session.policy.maxAmountCents) {
    throw new Error('amount above maxAmountCents');
  }
}

async function emit(
  adapter: PaymentAdapter,
  session: RefundSession,
  neutral:
    | 'refund.partial'
    | 'refund.full'
    | 'refund.window_expired'
    | 'refund.policy_denied',
  amountCents: number,
): Promise<AxisStep<RefundState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<RefundState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents,
    metadata: {
      chargeId: session.chargeId,
      refundedTotalCents: session.refundedCents,
      originalCents: session.originalAmountCents,
      remainingCents: session.originalAmountCents - session.refundedCents,
    },
  };
  session.history.push(step);
  return step;
}
