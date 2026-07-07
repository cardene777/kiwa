/**
 * Real adapter — drives a Klarna + Affirm + Afterpay style BNPL platform
 * when all env keys are set (`KIWA_MODE=real` + `BNPL_STACK_READY=1` +
 * `KIWA_KLARNA_API_KEY` + `KIWA_AFFIRM_API_URL` + `KIWA_AFTERPAY_API_URL`
 * + `KIWA_CREDIT_BUREAU_URL`). On any system without those, the adapter
 * refuses to run and every method reports `KIWA_BNPL_ENV_MISSING`.
 * Downstream tests inspect {@link PaymentAdapter.mode} + the trace to
 * skip real assertions on those systems.
 *
 * The full Klarna / Affirm / Afterpay ceremony is deferred to a follow-up
 * milestone once the credit-bureau fixture bundles are available in the
 * CI worker image. This milestone (v1.41-3, Issue CAR-979) lands the
 * env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-payment-embedded-finance-app/src/adapters/real.ts`
 * (v1.41-2) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import type {
  CollectionLateFeeResult,
  CollectionMarkPaidResult,
  CollectionSettleResult,
  CollectionStatusResult,
  PaymentAdapter,
  PlanCreateResult,
  PlanScheduleResult,
  RiskScoreResult,
  RiskThresholdResult,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_BNPL_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Klarna / Affirm /
 * Afterpay BNPL platform. Returns `null` on capable systems, or a short
 * reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a Klarna API key + Affirm API URL +
 * Afterpay API URL + credit-bureau URL are all needed, all of which cost
 * real money to provision. The default answer is "skip real" so unit
 * test workflows stay fast, hermetic, and free.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // BNPL_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['BNPL_STACK_READY'] === '1') {
    if (!process.env['KIWA_KLARNA_API_KEY']) return 'KIWA_KLARNA_API_KEY_MISSING';
    if (!process.env['KIWA_AFFIRM_API_URL']) return 'KIWA_AFFIRM_API_URL_MISSING';
    if (!process.env['KIWA_AFTERPAY_API_URL']) return 'KIWA_AFTERPAY_API_URL_MISSING';
    if (!process.env['KIWA_CREDIT_BUREAU_URL']) return 'KIWA_CREDIT_BUREAU_URL_MISSING';
    return null;
  }
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): PaymentAdapter {
  const trace: TraceEvent[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function refuse(op: TraceEvent['op']): never {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startPlan(_input) {
      refuse('startPlan');
    },
    async createPlan(_input): Promise<PlanCreateResult> {
      refuse('createPlan');
    },
    async scheduleInstallment(_input): Promise<PlanScheduleResult> {
      refuse('scheduleInstallment');
    },
    async closePlan(_input) {
      refuse('closePlan');
    },

    async startRisk(_input) {
      refuse('startRisk');
    },
    async scoreCustomerRisk(_input): Promise<RiskScoreResult> {
      refuse('scoreCustomerRisk');
    },
    async checkRiskThreshold(_input): Promise<RiskThresholdResult> {
      refuse('checkRiskThreshold');
    },
    async closeRisk(_input) {
      refuse('closeRisk');
    },

    async startCollection(_input) {
      refuse('startCollection');
    },
    async chargeLateFee(_input): Promise<CollectionLateFeeResult> {
      refuse('chargeLateFee');
    },
    async markPaid(_input): Promise<CollectionMarkPaidResult> {
      refuse('markPaid');
    },
    async settlePlan(_input): Promise<CollectionSettleResult> {
      refuse('settlePlan');
    },
    async checkCollectionStatus(_input): Promise<CollectionStatusResult> {
      refuse('checkCollectionStatus');
    },
    async closeCollection(_input) {
      refuse('closeCollection');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
