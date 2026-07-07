/**
 * Real adapter — drives a Stripe Treasury + Unit + Column style BaaS
 * platform when all env keys are set (`KIWA_MODE=real` +
 * `EMBEDDED_FINANCE_STACK_READY=1` + `KIWA_STRIPE_TREASURY_KEY` +
 * `KIWA_UNIT_API_URL` + `KIWA_COLUMN_API_URL`). On any system without
 * those, the adapter refuses to run and every method reports
 * `KIWA_EMBEDDED_FINANCE_ENV_MISSING`. Downstream tests inspect
 * {@link PaymentAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Stripe Treasury / Unit / Column ceremony is deferred to a
 * follow-up milestone once the KYC / KYB fixture bundles are available
 * in the CI worker image. This milestone (v1.41-2, Issue CAR-978) lands
 * the env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-security-mtls-zero-trust-app/src/adapters/real.ts`
 * (v1.39-2) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import type {
  CardActivateResult,
  CardIssueResult,
  CardSpendResult,
  KybVerifyResult,
  KycThresholdResult,
  KycVerifyResult,
  PaymentAdapter,
  TraceEvent,
  TreasuryFundResult,
  TreasuryOpenResult,
  TreasuryTransferResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_EMBEDDED_FINANCE_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Stripe Treasury /
 * Unit / Column BaaS platform. Returns `null` on capable systems, or a
 * short reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a Stripe Treasury key + Unit API URL +
 * Column API URL are all needed, all of which cost real money to
 * provision. The default answer is "skip real" so unit test workflows
 * stay fast, hermetic, and free.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // EMBEDDED_FINANCE_STACK_READY=1 opts in to real ceremonies once the
  // driver is available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['EMBEDDED_FINANCE_STACK_READY'] === '1') {
    if (!process.env['KIWA_STRIPE_TREASURY_KEY']) return 'KIWA_STRIPE_TREASURY_KEY_MISSING';
    if (!process.env['KIWA_UNIT_API_URL']) return 'KIWA_UNIT_API_URL_MISSING';
    if (!process.env['KIWA_COLUMN_API_URL']) return 'KIWA_COLUMN_API_URL_MISSING';
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

    async startTreasury(_input) {
      refuse('startTreasury');
    },
    async openAccount(_input): Promise<TreasuryOpenResult> {
      refuse('openAccount');
    },
    async fundAccount(_input): Promise<TreasuryFundResult> {
      refuse('fundAccount');
    },
    async transferFunds(_input): Promise<TreasuryTransferResult> {
      refuse('transferFunds');
    },
    async closeTreasury(_input) {
      refuse('closeTreasury');
    },

    async startCard(_input) {
      refuse('startCard');
    },
    async issueCard(_input): Promise<CardIssueResult> {
      refuse('issueCard');
    },
    async activateCard(_input): Promise<CardActivateResult> {
      refuse('activateCard');
    },
    async spendCard(_input): Promise<CardSpendResult> {
      refuse('spendCard');
    },
    async closeCard(_input) {
      refuse('closeCard');
    },

    async startKyc(_input) {
      refuse('startKyc');
    },
    async verifyIndividual(_input): Promise<KycVerifyResult> {
      refuse('verifyIndividual');
    },
    async verifyBusiness(_input): Promise<KybVerifyResult> {
      refuse('verifyBusiness');
    },
    async checkScoreThreshold(_input): Promise<KycThresholdResult> {
      refuse('checkScoreThreshold');
    },
    async closeKyc(_input) {
      refuse('closeKyc');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
