/**
 * Real adapter — drives an in-toto + sigstore + cosign supply chain
 * stack when all env keys are set (`KIWA_MODE=real` +
 * `COSIGN_STACK_READY=1` + `KIWA_COSIGN_BIN` + `KIWA_IN_TOTO_URL` +
 * `KIWA_REKOR_URL` + `KIWA_COSIGN_TRUST_ROOT`). On any system without
 * those, the adapter refuses to run and every method reports
 * `KIWA_COSIGN_ENV_MISSING`. Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full cosign sign + rekor upload + in-toto attest ceremony is
 * deferred to a follow-up milestone once the testcontainers cosign +
 * rekor image bundle is available in the CI worker image. This
 * milestone (v1.39-4, Issue CAR-866) lands the env-detect skeleton +
 * trace so the fidelity harness can uniformly drive both adapters even
 * when only the mock has an actual body. The pattern follows
 * `dogfood-security-mtls-zero-trust-app/src/adapters/real.ts` (v1.39-2)
 * and `dogfood-security-siem-incident-app/src/adapters/real.ts`
 * (v1.39-3) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import type {
  AttestationResult,
  OrchestrateResult,
  ProvenanceResult,
  ReproducibleResult,
  SecurityAdapter,
  SlsaLevelResult,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_COSIGN_ENV_MISSING';

/**
 * Report whether the current process can talk to a real cosign + rekor +
 * in-toto supply chain stack. Returns `null` on capable systems, or a
 * short reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a cosign binary path + an in-toto
 * transparency URL + a Rekor endpoint + a cosign trust root are all
 * needed, all of which cost seconds to provision. The default answer
 * is "skip real" so unit test workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // COSIGN_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['COSIGN_STACK_READY'] === '1') {
    if (!process.env['KIWA_COSIGN_BIN']) return 'KIWA_COSIGN_BIN_MISSING';
    if (!process.env['KIWA_IN_TOTO_URL']) return 'KIWA_IN_TOTO_URL_MISSING';
    if (!process.env['KIWA_REKOR_URL']) return 'KIWA_REKOR_URL_MISSING';
    if (!process.env['KIWA_COSIGN_TRUST_ROOT']) {
      return 'KIWA_COSIGN_TRUST_ROOT_MISSING';
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

  function refuse(op: TraceEvent['op']): never {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startSlsa(_input) {
      refuse('startSlsa');
    },
    async verifySlsaLevel(_input): Promise<SlsaLevelResult> {
      refuse('verifySlsaLevel');
    },
    async closeSlsa(_input) {
      refuse('closeSlsa');
    },

    async startReproducible(_input) {
      refuse('startReproducible');
    },
    async matchReproducibleBuild(_input): Promise<ReproducibleResult> {
      refuse('matchReproducibleBuild');
    },
    async closeReproducible(_input) {
      refuse('closeReproducible');
    },

    async startAttestation(_input) {
      refuse('startAttestation');
    },
    async signProvenance(_input): Promise<ProvenanceResult> {
      refuse('signProvenance');
    },
    async verifyAttestation(_input): Promise<AttestationResult> {
      refuse('verifyAttestation');
    },
    async closeAttestation(_input) {
      refuse('closeAttestation');
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
