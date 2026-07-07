/**
 * Real adapter — drives a LitmusChaos + Gremlin + PagerDuty AIOps +
 * runbook style stack when all env keys are set (`KIWA_MODE=real` +
 * `CHAOS_AIOPS_STACK_READY=1` + `KIWA_CHAOS_ENGINE_URL` +
 * `KIWA_AIOPS_API_URL` + `KIWA_RUNBOOK_URL`). On any system without
 * those, the adapter refuses to run and every method reports
 * `KIWA_CHAOS_AIOPS_ENV_MISSING`. Downstream tests inspect
 * {@link ChaosAiopsAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full fault-injection + blast-radius + anomaly + remediation + RCA
 * + correlation ceremony is deferred to a follow-up milestone once the
 * chaos-engine + AIOps + runbook API mocks are available in the CI
 * worker image. This milestone (v1.42-4, Issue CAR-1049) lands the
 * env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-observability-llm-ops-app/src/adapters/real.ts`
 * (v1.42-3) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import {
  KIWA_CHAOS_AIOPS_ENV_MISSING,
  type AlertCorrelateResult,
  type AnomalyDetectResult,
  type ChaosAiopsAdapter,
  type FaultInjectResult,
  type RemediationExecuteResult,
  type RollbackTriggerResult,
  type RootCauseAnalyzeResult,
  type TraceEvent,
} from './interface.js';

/**
 * Report whether the current process can talk to a real chaos-engine +
 * AIOps API + runbook API stack. Returns `null` on capable systems, or
 * a short reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a chaos-engine URL + AIOps API URL
 * + runbook URL are all needed, all of which cost real infrastructure
 * to provision. The default answer is "skip real" so unit test
 * workflows stay fast, hermetic, and free.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // CHAOS_AIOPS_STACK_READY=1 opts in to real ceremonies once the
  // driver is available. Until it is set every ceremony errors out with
  // KIWA_CHAOS_AIOPS_ENV_MISSING — a follow-up milestone ships the
  // driver.
  if (process.env['CHAOS_AIOPS_STACK_READY'] === '1') {
    if (!process.env['KIWA_CHAOS_ENGINE_URL']) {
      return 'KIWA_CHAOS_ENGINE_URL_MISSING';
    }
    if (!process.env['KIWA_AIOPS_API_URL']) {
      return 'KIWA_AIOPS_API_URL_MISSING';
    }
    if (!process.env['KIWA_RUNBOOK_URL']) {
      return 'KIWA_RUNBOOK_URL_MISSING';
    }
    return null;
  }
  return KIWA_CHAOS_AIOPS_ENV_MISSING;
}

export function makeRealAdapter(): ChaosAiopsAdapter {
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
    const missing = detectRealEnvMissing() ?? KIWA_CHAOS_AIOPS_ENV_MISSING;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startChaos(_input) {
      refuse('startChaos');
    },
    async injectFault(_input): Promise<FaultInjectResult> {
      refuse('injectFault');
    },
    async triggerRollback(_input): Promise<RollbackTriggerResult> {
      refuse('triggerRollback');
    },
    async closeChaos(_input) {
      refuse('closeChaos');
    },

    async startRemediation(_input) {
      refuse('startRemediation');
    },
    async detectAnomaly(_input): Promise<AnomalyDetectResult> {
      refuse('detectAnomaly');
    },
    async executeRemediation(_input): Promise<RemediationExecuteResult> {
      refuse('executeRemediation');
    },
    async closeRemediation(_input) {
      refuse('closeRemediation');
    },

    async startRca(_input) {
      refuse('startRca');
    },
    async analyzeRootCause(_input): Promise<RootCauseAnalyzeResult> {
      refuse('analyzeRootCause');
    },
    async correlateAlerts(_input): Promise<AlertCorrelateResult> {
      refuse('correlateAlerts');
    },
    async closeRca(_input) {
      refuse('closeRca');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
