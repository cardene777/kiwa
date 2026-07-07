/**
 * Real adapter — drives a Trivy + Gitleaks scanner stack when the env keys
 * are set (`KIWA_MODE=real` + `SBOM_SCANNER_READY=1` + `KIWA_TRIVY_ENDPOINT`
 * + `KIWA_GITLEAKS_ENDPOINT` + `KIWA_ADVISORY_FEED_URL`). On any system
 * without those, the adapter refuses to run and every method reports
 * `KIWA_SBOM_ENV_MISSING`. Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Trivy + Gitleaks ceremony is deferred to a follow-up milestone
 * once the scanner containers are available in the CI worker image. This
 * milestone (v1.37-4, Sub-Issue CAR-828) lands the env-detect skeleton +
 * trace so the fidelity harness can uniformly drive both adapters even
 * when only the mock has an actual body. The pattern follows
 * `dogfood-security-rbac-abac-app/src/adapters/real.ts` (v1.37-3) — env
 * detection reports which key is missing so the downstream release-gate
 * row can distinguish "not configured" from "ran and diverged".
 */

import type {
  ScannerLookupResult,
  ScannerReportResult,
  SbomAddComponentResult,
  SbomEmitResult,
  SbomLicenseResult,
  SbomValidateResult,
  SecretsRotateResult,
  SecretsScanResult,
  SecretsTrackResult,
  SecurityAdapter,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_SBOM_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Trivy + Gitleaks
 * scanner stack. Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — Trivy needs a running scanner + a
 * live OSV / NVD advisory feed URL, Gitleaks needs its rule engine
 * endpoint, all of which cost seconds to provision. The default answer is
 * "skip real" so unit test workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up scanner
  // containers.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // SBOM_SCANNER_READY=1 opts in to real ceremonies once the scanner
  // containers are available. Until it is set every ceremony errors out
  // with MISSING_ENV_ERROR — a follow-up milestone ships the drivers.
  if (process.env['SBOM_SCANNER_READY'] === '1') {
    if (!process.env['KIWA_TRIVY_ENDPOINT']) {
      return 'KIWA_TRIVY_ENDPOINT_MISSING';
    }
    if (!process.env['KIWA_GITLEAKS_ENDPOINT']) {
      return 'KIWA_GITLEAKS_ENDPOINT_MISSING';
    }
    if (!process.env['KIWA_ADVISORY_FEED_URL']) {
      return 'KIWA_ADVISORY_FEED_URL_MISSING';
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

    async startSbom() {
      refuse('startSbom');
      throw new Error(MISSING_ENV_ERROR);
    },
    async addComponent(): Promise<SbomAddComponentResult> {
      refuse('addComponent');
      throw new Error(MISSING_ENV_ERROR);
    },
    async emitCycloneDx(): Promise<SbomEmitResult> {
      refuse('emitCycloneDx');
      throw new Error(MISSING_ENV_ERROR);
    },
    async emitSpdx(): Promise<SbomEmitResult> {
      refuse('emitSpdx');
      throw new Error(MISSING_ENV_ERROR);
    },
    async validateSbom(): Promise<SbomValidateResult> {
      refuse('validateSbom');
      throw new Error(MISSING_ENV_ERROR);
    },
    async evaluateLicense(): Promise<SbomLicenseResult> {
      refuse('evaluateLicense');
      throw new Error(MISSING_ENV_ERROR);
    },
    async closeSbom() {
      refuse('closeSbom');
      throw new Error(MISSING_ENV_ERROR);
    },
    async startSecrets() {
      refuse('startSecrets');
      throw new Error(MISSING_ENV_ERROR);
    },
    async scanSource(): Promise<SecretsScanResult> {
      refuse('scanSource');
      throw new Error(MISSING_ENV_ERROR);
    },
    async trackRotation(): Promise<SecretsTrackResult> {
      refuse('trackRotation');
      throw new Error(MISSING_ENV_ERROR);
    },
    async markRotated(): Promise<SecretsRotateResult> {
      refuse('markRotated');
      throw new Error(MISSING_ENV_ERROR);
    },
    async closeSecrets() {
      refuse('closeSecrets');
      throw new Error(MISSING_ENV_ERROR);
    },
    async lookupAdvisories(): Promise<ScannerLookupResult> {
      refuse('lookupAdvisories');
      throw new Error(MISSING_ENV_ERROR);
    },
    async buildReport(): Promise<ScannerReportResult> {
      refuse('buildReport');
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
