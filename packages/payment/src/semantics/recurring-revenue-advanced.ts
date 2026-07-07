import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Recurring revenue advanced axis — MRR (Monthly Recurring Revenue) + ARR
 * (Annual Recurring Revenue) + churn tracking + expansion revenue + NRR
 * (Net Revenue Retention). Real SaaS billing platforms (Stripe / Chargebee /
 * Recurly) roll these metrics into cohort analytics: NRR = (MRR_end -
 * churn - contraction + expansion) / MRR_start × 100. The mock reproduces
 * MRR / ARR computation, churn / expansion recording, and NRR rollup.
 */
export type RecurringRevenueState =
  | 'initial'
  | 'mrr-computed'
  | 'churn-recorded'
  | 'expansion-recorded'
  | 'nrr-computed';

export interface RecurringRevenueSnapshot {
  cohortId: string;
  mrrStartCents: number;
  mrrEndCents: number;
  churnCents: number;
  contractionCents: number;
  expansionCents: number;
  newBusinessCents: number;
}

export interface RecurringRevenueSession {
  cohortId: string;
  customerId: string;
  currency?: string;
  snapshot: RecurringRevenueSnapshot;
  computedMrr: number;
  computedArr: number;
  computedNrr: number;
  state: RecurringRevenueState;
  history: AxisStep<RecurringRevenueState>[];
}

/**
 * Start a recurring revenue analytics session for a cohort.
 */
export function startRecurringRevenue(input: {
  cohortId: string;
  customerId: string;
  currency?: string;
  mrrStartCents: number;
}): RecurringRevenueSession {
  if (input.mrrStartCents < 0) {
    throw new Error('startRecurringRevenue: mrrStartCents must be non-negative');
  }
  const snapshot: RecurringRevenueSnapshot = {
    cohortId: input.cohortId,
    mrrStartCents: input.mrrStartCents,
    mrrEndCents: input.mrrStartCents,
    churnCents: 0,
    contractionCents: 0,
    expansionCents: 0,
    newBusinessCents: 0,
  };
  const session: RecurringRevenueSession = {
    cohortId: input.cohortId,
    customerId: input.customerId,
    snapshot,
    computedMrr: input.mrrStartCents,
    computedArr: input.mrrStartCents * 12,
    computedNrr: 100,
    state: 'initial',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Compute MRR / ARR from the current snapshot. MRR = mrrEnd, ARR = MRR × 12.
 */
export async function computeMrr(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
): Promise<AxisStep<RecurringRevenueState>> {
  session.computedMrr = session.snapshot.mrrEndCents;
  session.computedArr = session.computedMrr * 12;
  session.state = 'mrr-computed';
  return emit(adapter, session, 'rr.mrr_computed', {
    mrrCents: session.computedMrr,
    arrCents: session.computedArr,
  });
}

/**
 * Record churned MRR — a subscription cancellation or downgrade to 0.
 */
export async function recordChurn(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
  input: { churnCents: number; subscriptionId: string },
): Promise<AxisStep<RecurringRevenueState>> {
  if (input.churnCents < 0) {
    throw new Error('recordChurn: churnCents must be non-negative');
  }
  session.snapshot.churnCents += input.churnCents;
  session.snapshot.mrrEndCents = Math.max(0, session.snapshot.mrrEndCents - input.churnCents);
  session.state = 'churn-recorded';
  return emit(adapter, session, 'rr.churn_recorded', {
    subscriptionId: input.subscriptionId,
    churnCents: input.churnCents,
    totalChurnCents: session.snapshot.churnCents,
  });
}

/**
 * Record expansion MRR — an upgrade or seat add that grew the account.
 */
export async function recordExpansion(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
  input: { expansionCents: number; subscriptionId: string; kind: 'upgrade' | 'seat-add' | 'usage' },
): Promise<AxisStep<RecurringRevenueState>> {
  if (input.expansionCents < 0) {
    throw new Error('recordExpansion: expansionCents must be non-negative');
  }
  session.snapshot.expansionCents += input.expansionCents;
  session.snapshot.mrrEndCents += input.expansionCents;
  session.state = 'expansion-recorded';
  return emit(adapter, session, 'rr.expansion_recorded', {
    subscriptionId: input.subscriptionId,
    expansionCents: input.expansionCents,
    kind: input.kind,
    totalExpansionCents: session.snapshot.expansionCents,
  });
}

/**
 * Compute NRR (Net Revenue Retention) — the industry-standard growth
 * quality metric. NRR = (MRR_start - churn - contraction + expansion) /
 * MRR_start × 100. NRR > 100% means the cohort grew despite churn.
 */
export async function computeNrr(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
): Promise<AxisStep<RecurringRevenueState>> {
  const { mrrStartCents, churnCents, contractionCents, expansionCents } = session.snapshot;
  if (mrrStartCents === 0) {
    session.computedNrr = 0;
  } else {
    const numerator = mrrStartCents - churnCents - contractionCents + expansionCents;
    session.computedNrr = Math.round((numerator / mrrStartCents) * 10000) / 100;
  }
  session.state = 'nrr-computed';
  return emit(adapter, session, 'rr.nrr_computed', {
    nrr: session.computedNrr,
    mrrStartCents,
    churnCents,
    contractionCents,
    expansionCents,
  });
}

/**
 * Record contraction (downgrade without churn) — separate from churn so
 * NRR captures the difference.
 */
export function recordContraction(
  session: RecurringRevenueSession,
  input: { contractionCents: number },
): RecurringRevenueSession {
  if (input.contractionCents < 0) {
    throw new Error('recordContraction: contractionCents must be non-negative');
  }
  session.snapshot.contractionCents += input.contractionCents;
  session.snapshot.mrrEndCents = Math.max(
    0,
    session.snapshot.mrrEndCents - input.contractionCents,
  );
  return session;
}

async function emit(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
  neutral:
    | 'rr.mrr_computed'
    | 'rr.churn_recorded'
    | 'rr.expansion_recorded'
    | 'rr.nrr_computed',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<RecurringRevenueState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.computedMrr,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<RecurringRevenueState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.computedMrr,
    metadata: {
      cohortId: session.cohortId,
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
