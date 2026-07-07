/**
 * Provider-neutral Security Adapter surface for the SBOM + secrets scanning
 * dogfood.
 *
 * The app talks to the SBOM + secrets + scanner surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Trivy + Gitleaks scanner stack
 *    (KIWA_TRIVY_ENDPOINT + KIWA_GITLEAKS_ENDPOINT + KIWA_ADVISORY_FEED_URL)
 *    when `KIWA_MODE=real` + `SBOM_SCANNER_READY=1` are set; otherwise every
 *    op reports `KIWA_SBOM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/security` v0.1 sbom +
 *    secrets-scan semantics (toCycloneDx / toSpdx / validateSbom /
 *    lookupAdvisories / evaluateLicense / scanSecrets / isRotationOverdue /
 *    markRotated).
 *
 * Both must satisfy the same 14-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.37-4
 * dogfoods —
 *  - SBOM (CycloneDX 1.5 + SPDX 2.3 emission + validation + license policy)
 *  - secrets (TruffleHog / Gitleaks signatures + entropy + rotation SLA)
 *  - scanner (Trivy vulnerability lookup + OSV / NVD advisory feed +
 *    combined SBOM + vulnerability report)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - sbom-e2e (CycloneDX + SPDX emission + validation + license policy)
 *  - secrets-e2e (regex scan + entropy check + rotation SLA + markRotated)
 *  - scanner-e2e (advisory lookup + Trivy-style report combining sbom +
 *    secrets + license verdicts)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

import type { Advisory, LicenseVerdict, SbomComponent, SbomDocument, SecretFinding, SecretKind } from '@kiwa-test/security';

/** Result of publishing a component into the running SBOM session. */
export interface SbomAddComponentResult {
  sbomId: string;
  componentCount: number;
  latencyMs: number;
}

/** Result of emitting the running session's CycloneDX / SPDX document. */
export interface SbomEmitResult {
  sbomId: string;
  format: 'cyclonedx' | 'spdx';
  formatVersion: string;
  document: SbomDocument;
  latencyMs: number;
}

/** Result of validating the running SBOM session (mandatory fields + purl). */
export interface SbomValidateResult {
  sbomId: string;
  ok: boolean;
  errors: string[];
  latencyMs: number;
}

/** Result of applying the license policy across all session components. */
export interface SbomLicenseResult {
  sbomId: string;
  verdicts: Array<{
    purl: string;
    license: string | null;
    verdict: LicenseVerdict;
  }>;
  overallVerdict: LicenseVerdict;
  latencyMs: number;
}

/** Result of scanning the source for TruffleHog / Gitleaks signatures. */
export interface SecretsScanResult {
  scanId: string;
  findings: SecretFinding[];
  latencyMs: number;
}

/** Result of tracking a discovered finding under a rotation policy. */
export interface SecretsTrackResult {
  scanId: string;
  findingKind: SecretKind;
  discoveredAtMs: number;
  rotateWithinDays: number;
  latencyMs: number;
}

/** Result of marking a tracked finding as rotated. */
export interface SecretsRotateResult {
  scanId: string;
  findingKind: SecretKind;
  rotatedAtMs: number;
  overdue: boolean;
  latencyMs: number;
}

/** Result of looking up OSV / NVD advisories for the session SBOM. */
export interface ScannerLookupResult {
  scanId: string;
  advisories: Array<{
    component: SbomComponent;
    advisories: Advisory[];
  }>;
  latencyMs: number;
}

/** Result of composing an SBOM + secrets + license summary report. */
export interface ScannerReportResult {
  scanId: string;
  componentCount: number;
  vulnerableCount: number;
  secretsCount: number;
  licenseDenies: number;
  overallVerdict: 'allow' | 'warn' | 'deny';
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startSbom'
    | 'addComponent'
    | 'emitCycloneDx'
    | 'emitSpdx'
    | 'validateSbom'
    | 'evaluateLicense'
    | 'closeSbom'
    | 'startSecrets'
    | 'scanSource'
    | 'trackRotation'
    | 'markRotated'
    | 'closeSecrets'
    | 'lookupAdvisories'
    | 'buildReport';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Advisory feed input — mirrored across mock and real adapters. */
export interface AdvisoryFeedInput {
  advisories: Advisory[];
}

/** The Security Adapter — 14 ops across 3 domain surfaces + 3 axes. */
export interface SecurityAdapter {
  readonly mode: 'real' | 'mock';

  // sbom surface (sbom-e2e axis: CycloneDX + SPDX + validation + license)
  startSbom(input: { sbomId: string }): Promise<void>;
  addComponent(input: {
    sbomId: string;
    component: SbomComponent;
  }): Promise<SbomAddComponentResult>;
  emitCycloneDx(input: { sbomId: string; nowIso?: string }): Promise<SbomEmitResult>;
  emitSpdx(input: { sbomId: string; nowIso?: string }): Promise<SbomEmitResult>;
  validateSbom(input: { sbomId: string }): Promise<SbomValidateResult>;
  evaluateLicense(input: { sbomId: string }): Promise<SbomLicenseResult>;
  closeSbom(input: { sbomId: string }): Promise<void>;

  // secrets surface (secrets-e2e axis: scan + entropy + rotation)
  startSecrets(input: { scanId: string; rotateWithinDays: number }): Promise<void>;
  scanSource(input: { scanId: string; source: string }): Promise<SecretsScanResult>;
  trackRotation(input: {
    scanId: string;
    findingIndex: number;
    discoveredAtMs: number;
  }): Promise<SecretsTrackResult>;
  markRotated(input: {
    scanId: string;
    findingIndex: number;
    rotatedAtMs: number;
  }): Promise<SecretsRotateResult>;
  closeSecrets(input: { scanId: string }): Promise<void>;

  // scanner surface (scanner-e2e axis: advisory lookup + composed report)
  lookupAdvisories(input: {
    scanId: string;
    sbomId: string;
    feed: AdvisoryFeedInput;
  }): Promise<ScannerLookupResult>;
  buildReport(input: {
    scanId: string;
    sbomId: string;
    feed: AdvisoryFeedInput;
  }): Promise<ScannerReportResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
