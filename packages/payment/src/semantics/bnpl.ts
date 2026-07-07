import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * BNPL (Buy Now Pay Later) axis — installment plan + risk scoring + credit
 * decisioning + late fee. Real BNPL providers (Klarna / Affirm / Afterpay)
 * split a purchase into 2-6 installments, run a soft credit check + risk
 * score at checkout, and charge a late fee if a scheduled installment
 * misses its due date. The mock reproduces plan creation, per-installment
 * schedule emission, risk score emission, and late fee emission.
 */
export type BnplState =
  | 'initial'
  | 'plan-created'
  | 'installments-scheduled'
  | 'risk-scored'
  | 'active'
  | 'late-fee-charged'
  | 'settled'
  | 'defaulted';

export interface BnplConfig {
  /** number of installments (2-6 typical) */
  installments: number;
  /** ms between installment due dates */
  installmentIntervalMs?: number;
  /** minimum risk score (0-100) required to approve */
  minRiskScore?: number;
  /** late fee charged per missed installment, in cents */
  lateFeeCents?: number;
}

export interface BnplSession {
  planId: string;
  customerId: string;
  totalCents: number;
  currency?: string;
  config: Required<BnplConfig>;
  installmentAmountCents: number;
  installmentsScheduled: number;
  installmentsPaid: number;
  riskScore: number;
  lateFeesTotalCents: number;
  state: BnplState;
  history: AxisStep<BnplState>[];
}

const BNPL_DEFAULTS: Omit<Required<BnplConfig>, 'installments'> = {
  installmentIntervalMs: 14 * 24 * 60 * 60 * 1000, // 14 days
  minRiskScore: 50,
  lateFeeCents: 700, // 7.00
};

/**
 * Create a BNPL plan. Splits `totalCents` into equal installments (rounded
 * to integer cents; the last installment absorbs any rounding remainder).
 */
export async function createBnplPlan(
  adapter: PaymentAdapter,
  input: {
    planId: string;
    customerId: string;
    totalCents: number;
    currency?: string;
    config: BnplConfig;
  },
): Promise<{ session: BnplSession; step: AxisStep<BnplState> }> {
  if (input.totalCents <= 0) {
    throw new Error('createBnplPlan: totalCents must be positive');
  }
  const config: Required<BnplConfig> = {
    ...BNPL_DEFAULTS,
    ...input.config,
  };
  if (config.installments < 2 || config.installments > 12) {
    throw new Error('createBnplPlan: installments must be between 2 and 12');
  }
  const installmentAmount = Math.floor(input.totalCents / config.installments);
  const session: BnplSession = {
    planId: input.planId,
    customerId: input.customerId,
    totalCents: input.totalCents,
    config,
    installmentAmountCents: installmentAmount,
    installmentsScheduled: 0,
    installmentsPaid: 0,
    riskScore: 0,
    lateFeesTotalCents: 0,
    state: 'plan-created',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  const step = await emit(adapter, session, 'bnpl.plan_created', {
    planId: session.planId,
    installments: config.installments,
    installmentAmountCents: installmentAmount,
    totalCents: input.totalCents,
  });
  return { session, step };
}

/**
 * Schedule the next installment — advances the schedule pointer and emits
 * the neutral event. Throws once all installments are scheduled.
 */
export async function scheduleInstallment(
  adapter: PaymentAdapter,
  session: BnplSession,
): Promise<AxisStep<BnplState>> {
  if (session.installmentsScheduled >= session.config.installments) {
    throw new Error('scheduleInstallment: all installments already scheduled');
  }
  session.installmentsScheduled += 1;
  session.state = 'installments-scheduled';
  const dueOffsetMs = session.config.installmentIntervalMs * session.installmentsScheduled;
  return emit(adapter, session, 'bnpl.installment_scheduled', {
    installmentIndex: session.installmentsScheduled,
    dueOffsetMs,
    installmentAmountCents: session.installmentAmountCents,
  });
}

/**
 * Run risk scoring on the customer. Score below `config.minRiskScore`
 * marks the plan as defaulted and blocks further activity.
 */
export async function scoreRisk(
  adapter: PaymentAdapter,
  session: BnplSession,
  input: { score: number; creditBureau?: string },
): Promise<AxisStep<BnplState>> {
  if (input.score < 0 || input.score > 100) {
    throw new Error('scoreRisk: score must be between 0 and 100');
  }
  session.riskScore = input.score;
  if (input.score < session.config.minRiskScore) {
    session.state = 'defaulted';
  } else {
    session.state = session.state === 'plan-created' ? 'risk-scored' : 'active';
  }
  return emit(adapter, session, 'bnpl.risk_scored', {
    score: input.score,
    passed: input.score >= session.config.minRiskScore,
    creditBureau: input.creditBureau ?? 'internal',
  });
}

/**
 * Charge a late fee for a missed installment.
 */
export async function chargeLateFee(
  adapter: PaymentAdapter,
  session: BnplSession,
  input: { installmentIndex: number },
): Promise<AxisStep<BnplState>> {
  if (session.state === 'settled' || session.state === 'defaulted') {
    throw new Error(`chargeLateFee: session is ${session.state}`);
  }
  if (input.installmentIndex < 1 || input.installmentIndex > session.config.installments) {
    throw new Error('chargeLateFee: installmentIndex out of range');
  }
  session.lateFeesTotalCents += session.config.lateFeeCents;
  session.state = 'late-fee-charged';
  return emit(adapter, session, 'bnpl.late_fee_charged', {
    installmentIndex: input.installmentIndex,
    lateFeeCents: session.config.lateFeeCents,
    totalLateFees: session.lateFeesTotalCents,
  });
}

/**
 * Mark an installment as paid. Once all installments are paid the session
 * enters `settled`.
 */
export function markInstallmentPaid(session: BnplSession): BnplSession {
  session.installmentsPaid += 1;
  if (session.installmentsPaid >= session.config.installments) {
    session.state = 'settled';
  } else if (session.state !== 'late-fee-charged') {
    session.state = 'active';
  }
  return session;
}

async function emit(
  adapter: PaymentAdapter,
  session: BnplSession,
  neutral:
    | 'bnpl.plan_created'
    | 'bnpl.installment_scheduled'
    | 'bnpl.risk_scored'
    | 'bnpl.late_fee_charged',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<BnplState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.installmentAmountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<BnplState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.installmentAmountCents,
    metadata: {
      planId: session.planId,
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
