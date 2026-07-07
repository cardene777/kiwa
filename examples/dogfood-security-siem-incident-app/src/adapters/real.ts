/**
 * Real adapter — drives a Splunk + PagerDuty style SIEM + incident
 * response orchestrator when all env keys are set (`KIWA_MODE=real` +
 * `SIEM_STACK_READY=1` + `KIWA_SIEM_ENDPOINT` + `KIWA_PAGERDUTY_URL` +
 * `KIWA_LOKI_URL` + `KIWA_SIEM_TOKEN`). On any system without those,
 * the adapter refuses to run and every method reports
 * `KIWA_SIEM_ENV_MISSING`. Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Splunk HEC + Loki push + PagerDuty escalation ceremony is
 * deferred to a follow-up milestone once the testcontainers Loki /
 * Grafana image + Splunk HEC token bundle are available in the CI
 * worker image. This milestone (v1.39-3, Issue CAR-865) lands the
 * env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-security-mtls-zero-trust-app/src/adapters/real.ts`
 * (v1.39-2) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import type {
  IrEscalationResult,
  IrForensicsResult,
  IrPlaybookResult,
  IrPostMortemResult,
  IrSeverityResult,
  OrchestrateResult,
  SecurityAdapter,
  SiemCorrelateResult,
  SiemRetentionResult,
  SiemSealResult,
  SiemStructureResult,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_SIEM_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Splunk +
 * PagerDuty SIEM + SOAR platform. Returns `null` on capable systems,
 * or a short reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a Splunk HEC endpoint + a Loki
 * push URL + a PagerDuty routing key + a SIEM token are all needed,
 * all of which cost seconds to provision. The default answer is
 * "skip real" so unit test workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // SIEM_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['SIEM_STACK_READY'] === '1') {
    if (!process.env['KIWA_SIEM_ENDPOINT']) return 'KIWA_SIEM_ENDPOINT_MISSING';
    if (!process.env['KIWA_PAGERDUTY_URL']) return 'KIWA_PAGERDUTY_URL_MISSING';
    if (!process.env['KIWA_LOKI_URL']) return 'KIWA_LOKI_URL_MISSING';
    if (!process.env['KIWA_SIEM_TOKEN']) return 'KIWA_SIEM_TOKEN_MISSING';
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

  function refuse(op: TraceEvent['op']): never {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startSiem(_input) {
      refuse('startSiem');
    },
    async structureEvent(_input): Promise<SiemStructureResult> {
      refuse('structureEvent');
    },
    async sealEvents(_input): Promise<SiemSealResult> {
      refuse('sealEvents');
    },
    async applyRetention(_input): Promise<SiemRetentionResult> {
      refuse('applyRetention');
    },
    async correlate(_input): Promise<SiemCorrelateResult> {
      refuse('correlate');
    },
    async closeSiem(_input) {
      refuse('closeSiem');
    },

    async startIncident(_input) {
      refuse('startIncident');
    },
    async triggerPlaybook(_input): Promise<IrPlaybookResult> {
      refuse('triggerPlaybook');
    },
    async classifySeverity(_input): Promise<IrSeverityResult> {
      refuse('classifySeverity');
    },
    async escalate(_input): Promise<IrEscalationResult> {
      refuse('escalate');
    },
    async captureForensics(_input): Promise<IrForensicsResult> {
      refuse('captureForensics');
    },
    async recordPostMortem(_input): Promise<IrPostMortemResult> {
      refuse('recordPostMortem');
    },
    async closeIncident(_input) {
      refuse('closeIncident');
    },

    async startOrchestrator(_input) {
      refuse('startOrchestrator');
    },
    async orchestrateDecision(_input): Promise<OrchestrateResult> {
      refuse('orchestrateDecision');
    },
    async closeOrchestrator(_input) {
      refuse('closeOrchestrator');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
