/**
 * Real adapter — drives a Terraform + OPA + cost API style IaC platform
 * when all env keys are set (`KIWA_MODE=real` +
 * `IAC_STACK_READY=1` + `KIWA_TERRAFORM_STATE_URL` +
 * `KIWA_OPA_URL` + `KIWA_COST_API_URL`). On any system without
 * those, the adapter refuses to run and every method reports
 * `KIWA_IAC_ENV_MISSING`. Downstream tests inspect
 * {@link IacAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Terraform state + OPA rego + cost-explorer ceremony is deferred
 * to a follow-up milestone once the terraform-state + OPA-server bundles
 * are available in the CI worker image. This milestone (v1.42-2, Issue
 * CAR-1047) lands the env-detect skeleton + trace so the fidelity harness
 * can uniformly drive both adapters even when only the mock has an actual
 * body. The pattern follows `dogfood-payment-embedded-finance-app/src/adapters/real.ts`
 * (v1.41-2) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import {
  KIWA_IAC_ENV_MISSING,
  type CostAttributeResult,
  type DriftDetectResult,
  type IacAdapter,
  type PlanCaptureResult,
  type PolicyEvaluateResult,
  type TraceEvent,
} from './interface.js';

/**
 * Report whether the current process can talk to a real Terraform + OPA +
 * cost API stack. Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a Terraform state URL + OPA URL +
 * cost API URL are all needed, all of which cost real money to
 * provision. The default answer is "skip real" so unit test workflows
 * stay fast, hermetic, and free.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // IAC_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // KIWA_IAC_ENV_MISSING — a follow-up milestone ships the driver.
  if (process.env['IAC_STACK_READY'] === '1') {
    if (!process.env['KIWA_TERRAFORM_STATE_URL']) return 'KIWA_TERRAFORM_STATE_URL_MISSING';
    if (!process.env['KIWA_OPA_URL']) return 'KIWA_OPA_URL_MISSING';
    if (!process.env['KIWA_COST_API_URL']) return 'KIWA_COST_API_URL_MISSING';
    return null;
  }
  return KIWA_IAC_ENV_MISSING;
}

export function makeRealAdapter(): IacAdapter {
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
    const missing = detectRealEnvMissing() ?? KIWA_IAC_ENV_MISSING;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startPlan(_input) {
      refuse('startPlan');
    },
    async capturePlan(_input): Promise<PlanCaptureResult> {
      refuse('capturePlan');
    },
    async closePlan(_input) {
      refuse('closePlan');
    },

    async startDrift(_input) {
      refuse('startDrift');
    },
    async detectDrift(_input): Promise<DriftDetectResult> {
      refuse('detectDrift');
    },
    async closeDrift(_input) {
      refuse('closeDrift');
    },

    async startPolicy(_input) {
      refuse('startPolicy');
    },
    async evaluatePolicy(_input): Promise<PolicyEvaluateResult> {
      refuse('evaluatePolicy');
    },
    async attributeCost(_input): Promise<CostAttributeResult> {
      refuse('attributeCost');
    },
    async closePolicy(_input) {
      refuse('closePolicy');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
