/**
 * Real adapter — drives a Casbin-style policy store when both env keys
 * are set (`KIWA_MODE=real` + `AUTHZ_STORE_READY=1` + `KIWA_POLICY_STORE_URL`).
 * On any system without those, the adapter refuses to run and every
 * method reports `KIWA_AUTHZ_ENV_MISSING`. Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Casbin ceremony is deferred to a follow-up milestone once
 * the policy store binary + adapter driver are available in the CI
 * worker image. This milestone (v1.37-3, Sub-Issue CAR-827) lands the
 * env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-security-csp-headers-app/src/adapters/real.ts`
 * (v1.37-2) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import type {
  AbacEvaluateResult,
  CombinedEvaluateResult,
  PolicyActivateResult,
  PolicyPublishResult,
  PolicyRollbackResult,
  RbacCheckResult,
  RbacExpandResult,
  SecurityAdapter,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_AUTHZ_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Casbin-style
 * policy store. Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — Casbin requires a policy store
 * (postgres / mysql / redis) + the driver needs a URL, all of which
 * cost seconds to provision. The default answer is "skip real" so unit
 * test workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up a policy store.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // AUTHZ_STORE_READY=1 opts in to real ceremonies once the store adapter
  // is available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['AUTHZ_STORE_READY'] === '1') {
    if (!process.env['KIWA_POLICY_STORE_URL']) {
      return 'KIWA_POLICY_STORE_URL_MISSING';
    }
    return null;
  }
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): SecurityAdapter {
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

  function refuse(op: TraceEvent['op']): void {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
  }

  return {
    mode: 'real',

    async startRbac() {
      refuse('startRbac');
      throw new Error(MISSING_ENV_ERROR);
    },
    async attachRole() {
      refuse('attachRole');
      throw new Error(MISSING_ENV_ERROR);
    },
    async expandRoles(): Promise<RbacExpandResult> {
      refuse('expandRoles');
      throw new Error(MISSING_ENV_ERROR);
    },
    async checkPermission(): Promise<RbacCheckResult> {
      refuse('checkPermission');
      throw new Error(MISSING_ENV_ERROR);
    },
    async closeRbac() {
      refuse('closeRbac');
      throw new Error(MISSING_ENV_ERROR);
    },
    async startAbac() {
      refuse('startAbac');
      throw new Error(MISSING_ENV_ERROR);
    },
    async attachRule() {
      refuse('attachRule');
      throw new Error(MISSING_ENV_ERROR);
    },
    async evaluateAbac(): Promise<AbacEvaluateResult> {
      refuse('evaluateAbac');
      throw new Error(MISSING_ENV_ERROR);
    },
    async evaluateCombined(): Promise<CombinedEvaluateResult> {
      refuse('evaluateCombined');
      throw new Error(MISSING_ENV_ERROR);
    },
    async closeAbac() {
      refuse('closeAbac');
      throw new Error(MISSING_ENV_ERROR);
    },
    async startPolicyStore() {
      refuse('startPolicyStore');
      throw new Error(MISSING_ENV_ERROR);
    },
    async publishPolicy(): Promise<PolicyPublishResult> {
      refuse('publishPolicy');
      throw new Error(MISSING_ENV_ERROR);
    },
    async activatePolicy(): Promise<PolicyActivateResult> {
      refuse('activatePolicy');
      throw new Error(MISSING_ENV_ERROR);
    },
    async rollbackPolicy(): Promise<PolicyRollbackResult> {
      refuse('rollbackPolicy');
      throw new Error(MISSING_ENV_ERROR);
    },
    async closePolicyStore() {
      refuse('closePolicyStore');
      throw new Error(MISSING_ENV_ERROR);
    },

    traces() {
      return trace;
    },
    async reset() {
      trace.length = 0;
    },
  };
}
