/**
 * Mock adapter — drives `@kiwa/security` v0.1 sbom + secrets-scan
 * semantics (toCycloneDx / toSpdx / validateSbom / lookupAdvisories /
 * evaluateLicense / scanSecrets / isRotationOverdue / markRotated) so the
 * same app code exercises a deterministic SBOM + secrets + scanner
 * ceremony without a real Trivy / Gitleaks binary. Both mock and real
 * adapters satisfy {@link SecurityAdapter}, so the fidelity harness can
 * diff them side-by-side.
 *
 * State model — one session per (sbomId) tuple across the SBOM surface,
 * one session per (scanId) tuple across the secrets + scanner surfaces.
 * Sessions are isolated so per-surface metrics stay separated. Findings
 * live on the secrets session for later rotation ceremonies.
 *
 * The mock intentionally piggy-backs on the same neutral event vocabulary
 * that the parent v1.37-1 semantics packages emit — every op appends the
 * matching neutral event into the trace so the fidelity harness can
 * assert the mock and real adapters produce identical event orderings.
 */

import {
  DEFAULT_LICENSE_POLICY,
  evaluateLicense as evaluateLicenseFn,
  isRotationOverdue,
  lookupAdvisories as lookupAdvisoriesFn,
  markRotated as markRotatedFn,
  scanSecrets,
  toCycloneDx,
  toSbomEvent,
  toSecretsEvent,
  toSpdx,
  validateSbom as validateSbomFn,
  type Advisory,
  type LicenseVerdict,
  type RotationPolicy,
  type RotationTracker,
  type SbomComponent,
  type SecretFinding,
} from '@kiwa/security';
import type {
  AdvisoryFeedInput,
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

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface SbomSession {
  sbomId: string;
  components: SbomComponent[];
  closed: boolean;
}

interface SecretsSession {
  scanId: string;
  rotateWithinDays: number;
  findings: SecretFinding[];
  trackers: RotationTracker[];
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): SecurityAdapter {
  const trace: TraceEvent[] = [];
  const latency = Math.max(opts.latencyMs ?? 1, 0);

  const sbomSessions = new Map<string, SbomSession>();
  const secretsSessions = new Map<string, SecretsSession>();

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

  async function delay(): Promise<number> {
    const start = Date.now();
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }
    return Date.now() - start;
  }

  return {
    mode: 'mock',

    async startSbom(input) {
      sbomSessions.set(input.sbomId, {
        sbomId: input.sbomId,
        components: [],
        closed: false,
      });
      record('startSbom', true, { detail: { sbomId: input.sbomId } });
    },

    async addComponent(input): Promise<SbomAddComponentResult> {
      const session = sbomSessions.get(input.sbomId);
      if (!session) {
        record('addComponent', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      if (session.closed) {
        record('addComponent', false, { errorKind: 'sbom_session_closed' });
        throw new Error('sbom_session_closed');
      }
      if (session.components.some((c) => c.purl === input.component.purl)) {
        record('addComponent', false, { errorKind: 'sbom_component_duplicate' });
        throw new Error('sbom_component_duplicate');
      }
      const latencyMs = await delay();
      session.components.push({ ...input.component });
      const result: SbomAddComponentResult = {
        sbomId: input.sbomId,
        componentCount: session.components.length,
        latencyMs,
      };
      record('addComponent', true, {
        detail: {
          sbomId: input.sbomId,
          purl: input.component.purl,
          componentCount: session.components.length,
        },
      });
      return result;
    },

    async emitCycloneDx(input): Promise<SbomEmitResult> {
      const session = sbomSessions.get(input.sbomId);
      if (!session) {
        record('emitCycloneDx', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      const latencyMs = await delay();
      const doc = toCycloneDx(session.components, input.nowIso);
      toSbomEvent({
        provider: 'helmet',
        verdict: 'allow',
        reason: `mock_cyclonedx_${session.components.length}_components`,
        payload: { format: doc.format, formatVersion: doc.formatVersion },
        timestamp: Date.now(),
      });
      const result: SbomEmitResult = {
        sbomId: input.sbomId,
        format: doc.format,
        formatVersion: doc.formatVersion,
        document: doc,
        latencyMs,
      };
      record('emitCycloneDx', true, {
        detail: {
          sbomId: input.sbomId,
          formatVersion: doc.formatVersion,
          componentCount: doc.components.length,
        },
      });
      return result;
    },

    async emitSpdx(input): Promise<SbomEmitResult> {
      const session = sbomSessions.get(input.sbomId);
      if (!session) {
        record('emitSpdx', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      const latencyMs = await delay();
      const doc = toSpdx(session.components, input.nowIso);
      toSbomEvent({
        provider: 'helmet',
        verdict: 'allow',
        reason: `mock_spdx_${session.components.length}_components`,
        payload: { format: doc.format, formatVersion: doc.formatVersion },
        timestamp: Date.now(),
      });
      const result: SbomEmitResult = {
        sbomId: input.sbomId,
        format: doc.format,
        formatVersion: doc.formatVersion,
        document: doc,
        latencyMs,
      };
      record('emitSpdx', true, {
        detail: {
          sbomId: input.sbomId,
          formatVersion: doc.formatVersion,
          componentCount: doc.components.length,
        },
      });
      return result;
    },

    async validateSbom(input): Promise<SbomValidateResult> {
      const session = sbomSessions.get(input.sbomId);
      if (!session) {
        record('validateSbom', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      const latencyMs = await delay();
      const doc = toCycloneDx(session.components);
      const verdict = validateSbomFn(doc);
      const result: SbomValidateResult = {
        sbomId: input.sbomId,
        ok: verdict.ok,
        errors: verdict.errors,
        latencyMs,
      };
      record('validateSbom', true, {
        detail: {
          sbomId: input.sbomId,
          ok: verdict.ok,
          errorCount: verdict.errors.length,
        },
      });
      return result;
    },

    async evaluateLicense(input): Promise<SbomLicenseResult> {
      const session = sbomSessions.get(input.sbomId);
      if (!session) {
        record('evaluateLicense', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      const latencyMs = await delay();
      const verdicts = session.components.map((c) => ({
        purl: c.purl,
        license: c.license ?? null,
        verdict: evaluateLicenseFn(c.license, DEFAULT_LICENSE_POLICY),
      }));
      const overallVerdict = reduceLicenseVerdicts(verdicts.map((v) => v.verdict));
      const result: SbomLicenseResult = {
        sbomId: input.sbomId,
        verdicts,
        overallVerdict,
        latencyMs,
      };
      record('evaluateLicense', true, {
        detail: {
          sbomId: input.sbomId,
          overallVerdict,
          componentCount: session.components.length,
        },
      });
      return result;
    },

    async closeSbom(input) {
      const session = sbomSessions.get(input.sbomId);
      if (!session) {
        record('closeSbom', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      session.closed = true;
      record('closeSbom', true, {
        detail: {
          sbomId: input.sbomId,
          componentCount: session.components.length,
        },
      });
    },

    async startSecrets(input) {
      secretsSessions.set(input.scanId, {
        scanId: input.scanId,
        rotateWithinDays: input.rotateWithinDays,
        findings: [],
        trackers: [],
        closed: false,
      });
      record('startSecrets', true, {
        detail: { scanId: input.scanId, rotateWithinDays: input.rotateWithinDays },
      });
    },

    async scanSource(input): Promise<SecretsScanResult> {
      const session = secretsSessions.get(input.scanId);
      if (!session) {
        record('scanSource', false, { errorKind: 'secrets_session_missing' });
        throw new Error('secrets_session_missing');
      }
      if (session.closed) {
        record('scanSource', false, { errorKind: 'secrets_session_closed' });
        throw new Error('secrets_session_closed');
      }
      const latencyMs = await delay();
      const findings = scanSecrets(input.source);
      session.findings = findings;
      for (const finding of findings) {
        toSecretsEvent({
          provider: 'coraza',
          finding,
          timestamp: Date.now(),
        });
      }
      const result: SecretsScanResult = {
        scanId: input.scanId,
        findings,
        latencyMs,
      };
      record('scanSource', true, {
        detail: {
          scanId: input.scanId,
          findingCount: findings.length,
        },
      });
      return result;
    },

    async trackRotation(input): Promise<SecretsTrackResult> {
      const session = secretsSessions.get(input.scanId);
      if (!session) {
        record('trackRotation', false, { errorKind: 'secrets_session_missing' });
        throw new Error('secrets_session_missing');
      }
      const finding = session.findings[input.findingIndex];
      if (!finding) {
        record('trackRotation', false, { errorKind: 'secrets_finding_missing' });
        throw new Error('secrets_finding_missing');
      }
      const latencyMs = await delay();
      const policy: RotationPolicy = { rotateWithinDays: session.rotateWithinDays };
      const tracker: RotationTracker = {
        finding,
        discoveredAtMs: input.discoveredAtMs,
        rotatedAtMs: null,
        policy,
      };
      session.trackers[input.findingIndex] = tracker;
      const result: SecretsTrackResult = {
        scanId: input.scanId,
        findingKind: finding.kind,
        discoveredAtMs: input.discoveredAtMs,
        rotateWithinDays: session.rotateWithinDays,
        latencyMs,
      };
      record('trackRotation', true, {
        detail: {
          scanId: input.scanId,
          findingKind: finding.kind,
          rotateWithinDays: session.rotateWithinDays,
        },
      });
      return result;
    },

    async markRotated(input): Promise<SecretsRotateResult> {
      const session = secretsSessions.get(input.scanId);
      if (!session) {
        record('markRotated', false, { errorKind: 'secrets_session_missing' });
        throw new Error('secrets_session_missing');
      }
      const tracker = session.trackers[input.findingIndex];
      if (!tracker) {
        record('markRotated', false, { errorKind: 'secrets_tracker_missing' });
        throw new Error('secrets_tracker_missing');
      }
      const latencyMs = await delay();
      // Determine overdue-at-rotation status against the original policy so
      // the release gate can flag rotations that landed after the SLA.
      const overdueBeforeRotation = isRotationOverdue(tracker, input.rotatedAtMs);
      const rotated = markRotatedFn(tracker, input.rotatedAtMs);
      session.trackers[input.findingIndex] = rotated;
      const result: SecretsRotateResult = {
        scanId: input.scanId,
        findingKind: tracker.finding.kind,
        rotatedAtMs: input.rotatedAtMs,
        overdue: overdueBeforeRotation,
        latencyMs,
      };
      record('markRotated', true, {
        detail: {
          scanId: input.scanId,
          findingKind: tracker.finding.kind,
          overdue: overdueBeforeRotation,
        },
      });
      return result;
    },

    async closeSecrets(input) {
      const session = secretsSessions.get(input.scanId);
      if (!session) {
        record('closeSecrets', false, { errorKind: 'secrets_session_missing' });
        throw new Error('secrets_session_missing');
      }
      session.closed = true;
      record('closeSecrets', true, {
        detail: {
          scanId: input.scanId,
          findingCount: session.findings.length,
        },
      });
    },

    async lookupAdvisories(input): Promise<ScannerLookupResult> {
      const sbomSession = sbomSessions.get(input.sbomId);
      if (!sbomSession) {
        record('lookupAdvisories', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      const scanSession = secretsSessions.get(input.scanId);
      if (!scanSession) {
        record('lookupAdvisories', false, { errorKind: 'secrets_session_missing' });
        throw new Error('secrets_session_missing');
      }
      const latencyMs = await delay();
      const doc = toCycloneDx(sbomSession.components);
      const advisories = lookupAdvisoriesFn(doc, { advisories: input.feed.advisories });
      const result: ScannerLookupResult = {
        scanId: input.scanId,
        advisories,
        latencyMs,
      };
      record('lookupAdvisories', true, {
        detail: {
          scanId: input.scanId,
          sbomId: input.sbomId,
          vulnerableCount: advisories.length,
        },
      });
      return result;
    },

    async buildReport(input): Promise<ScannerReportResult> {
      const sbomSession = sbomSessions.get(input.sbomId);
      if (!sbomSession) {
        record('buildReport', false, { errorKind: 'sbom_session_missing' });
        throw new Error('sbom_session_missing');
      }
      const scanSession = secretsSessions.get(input.scanId);
      if (!scanSession) {
        record('buildReport', false, { errorKind: 'secrets_session_missing' });
        throw new Error('secrets_session_missing');
      }
      const latencyMs = await delay();
      const doc = toCycloneDx(sbomSession.components);
      const advisories = lookupAdvisoriesFn(doc, { advisories: input.feed.advisories });
      const licenseVerdicts = sbomSession.components.map((c) =>
        evaluateLicenseFn(c.license, DEFAULT_LICENSE_POLICY),
      );
      const overallVerdict = reduceOverallVerdict({
        vulnerabilities: advisories,
        licenseVerdicts,
        secretsCount: scanSession.findings.length,
      });
      const result: ScannerReportResult = {
        scanId: input.scanId,
        componentCount: sbomSession.components.length,
        vulnerableCount: advisories.length,
        secretsCount: scanSession.findings.length,
        licenseDenies: licenseVerdicts.filter((v) => v === 'deny').length,
        overallVerdict,
        latencyMs,
      };
      record('buildReport', true, {
        detail: {
          scanId: input.scanId,
          componentCount: result.componentCount,
          vulnerableCount: result.vulnerableCount,
          secretsCount: result.secretsCount,
          licenseDenies: result.licenseDenies,
          overallVerdict,
        },
      });
      return result;
    },

    traces() {
      return trace;
    },

    async reset() {
      sbomSessions.clear();
      secretsSessions.clear();
      trace.length = 0;
    },
  };
}

/** Reduce license verdicts across components — deny wins, then warn, then allow. */
function reduceLicenseVerdicts(verdicts: LicenseVerdict[]): LicenseVerdict {
  if (verdicts.length === 0) return 'allow';
  if (verdicts.includes('deny')) return 'deny';
  if (verdicts.includes('warn')) return 'warn';
  return 'allow';
}

/**
 * Overall scanner verdict — critical / high vulnerabilities or license deny
 * escalate to deny; presence of any secret or medium / low advisory
 * escalates to warn; otherwise allow. This matches the Trivy default
 * severity filter used by CI gates.
 */
function reduceOverallVerdict(input: {
  vulnerabilities: Array<{ component: SbomComponent; advisories: Advisory[] }>;
  licenseVerdicts: LicenseVerdict[];
  secretsCount: number;
}): 'allow' | 'warn' | 'deny' {
  const highOrCritical = input.vulnerabilities.some((r) =>
    r.advisories.some((a) => a.severity === 'high' || a.severity === 'critical'),
  );
  const licenseDeny = input.licenseVerdicts.includes('deny');
  if (highOrCritical || licenseDeny) return 'deny';
  const anyVuln = input.vulnerabilities.length > 0;
  const licenseWarn = input.licenseVerdicts.includes('warn');
  if (anyVuln || input.secretsCount > 0 || licenseWarn) return 'warn';
  return 'allow';
}
