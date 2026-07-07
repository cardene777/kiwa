/**
 * Real adapter — drives an Istio + OPA style mTLS + Zero-trust access
 * broker when all env keys are set (`KIWA_MODE=real` +
 * `MTLS_STACK_READY=1` + `KIWA_MTLS_CA_PATH` + `KIWA_ISTIO_URL` +
 * `KIWA_OPA_URL`). On any system without those, the adapter refuses to
 * run and every method reports `KIWA_MTLS_ENV_MISSING`. Downstream tests
 * inspect {@link SecurityAdapter.mode} + the trace to skip real
 * assertions on those systems.
 *
 * The full Istio + OPA ceremony is deferred to a follow-up milestone
 * once the Istio sidecar CA + OPA rego policy bundles are available in
 * the CI worker image. This milestone (v1.39-2, Issue CAR-864) lands
 * the env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-security-rbac-abac-app/src/adapters/real.ts`
 * (v1.37-3) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import type {
  BrokerDecideResult,
  MtlsCtResult,
  MtlsHandshakeResult,
  MtlsOcspResult,
  MtlsPinResult,
  SecurityAdapter,
  TraceEvent,
  ZtJitResult,
  ZtPostureResult,
  ZtRiskResult,
  ZtSegmentResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_MTLS_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Istio + OPA
 * access broker. Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — an Istio sidecar + OPA policy
 * bundle + mTLS CA cert file are all needed, all of which cost seconds
 * to provision. The default answer is "skip real" so unit test workflows
 * stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // MTLS_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['MTLS_STACK_READY'] === '1') {
    if (!process.env['KIWA_MTLS_CA_PATH']) return 'KIWA_MTLS_CA_PATH_MISSING';
    if (!process.env['KIWA_ISTIO_URL']) return 'KIWA_ISTIO_URL_MISSING';
    if (!process.env['KIWA_OPA_URL']) return 'KIWA_OPA_URL_MISSING';
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

    async startMtls(_input) {
      refuse('startMtls');
    },
    async completeHandshake(_input): Promise<MtlsHandshakeResult> {
      refuse('completeHandshake');
    },
    async verifyPin(_input): Promise<MtlsPinResult> {
      refuse('verifyPin');
    },
    async verifyOcsp(_input): Promise<MtlsOcspResult> {
      refuse('verifyOcsp');
    },
    async checkCtLog(_input): Promise<MtlsCtResult> {
      refuse('checkCtLog');
    },
    async closeMtls(_input) {
      refuse('closeMtls');
    },

    async startZeroTrust(_input) {
      refuse('startZeroTrust');
    },
    async evaluatePosture(_input): Promise<ZtPostureResult> {
      refuse('evaluatePosture');
    },
    async scoreRisk(_input): Promise<ZtRiskResult> {
      refuse('scoreRisk');
    },
    async requestJit(_input): Promise<ZtJitResult> {
      refuse('requestJit');
    },
    async enforceMicroSegment(_input): Promise<ZtSegmentResult> {
      refuse('enforceMicroSegment');
    },
    async closeZeroTrust(_input) {
      refuse('closeZeroTrust');
    },

    async startBroker(_input) {
      refuse('startBroker');
    },
    async decideBroker(_input): Promise<BrokerDecideResult> {
      refuse('decideBroker');
    },
    async closeBroker(_input) {
      refuse('closeBroker');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
