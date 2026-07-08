import type { AxisStep, Severity } from './types.js';

/**
 * SCA (Software Composition Analysis) axis — Trivy-style dependency scan +
 * CVE lookup + license flagging。
 */
export type ScaState = 'idle' | 'analyzing' | 'vulns-detected' | 'completed';

export interface ScaVuln {
  cveId: string;
  package: string;
  version: string;
  severity: Severity;
  fixedVersion?: string;
}

export interface ScaLicenseFlag {
  package: string;
  license: string;
  reason: 'copyleft' | 'unknown' | 'restricted';
}

export interface ScaSession {
  scanId: string;
  provider: 'trivy';
  target: string;
  vulns: ScaVuln[];
  licenseFlags: ScaLicenseFlag[];
  dependencyCount: number;
  state: ScaState;
  history: AxisStep<ScaState>[];
}

export function startScaScan(input: { scanId: string; target: string }): ScaSession {
  const session: ScaSession = {
    scanId: input.scanId,
    provider: 'trivy',
    target: input.target,
    vulns: [],
    licenseFlags: [],
    dependencyCount: 0,
    state: 'analyzing',
    history: [],
  };
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.dependency-analyzed',
    provider: 'trivy',
    state: 'analyzing',
    metadata: { scanId: input.scanId, target: input.target },
  };
  session.history.push(step);
  return session;
}

export function analyzeScaDependency(
  session: ScaSession,
  input: { count: number },
): AxisStep<ScaState> {
  session.dependencyCount += input.count;
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.dependency-analyzed',
    provider: 'trivy',
    state: session.state,
    metadata: { scanId: session.scanId, count: input.count, totalCount: session.dependencyCount },
  };
  session.history.push(step);
  return step;
}

export function detectScaVuln(session: ScaSession, vuln: ScaVuln): AxisStep<ScaState> {
  session.vulns.push(vuln);
  session.state = 'vulns-detected';
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.vuln-detected',
    provider: 'trivy',
    state: 'vulns-detected',
    metadata: {
      scanId: session.scanId,
      cveId: vuln.cveId,
      package: vuln.package,
      severity: vuln.severity,
      hasFix: vuln.fixedVersion !== undefined,
    },
  };
  session.history.push(step);
  return step;
}

export function flagScaLicense(session: ScaSession, flag: ScaLicenseFlag): AxisStep<ScaState> {
  session.licenseFlags.push(flag);
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.license-flagged',
    provider: 'trivy',
    state: session.state,
    metadata: {
      scanId: session.scanId,
      package: flag.package,
      license: flag.license,
      reason: flag.reason,
    },
  };
  session.history.push(step);
  return step;
}

export function completeScaScan(session: ScaSession): AxisStep<ScaState> {
  session.state = 'completed';
  const criticalCount = session.vulns.filter((v) => v.severity === 'critical').length;
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.scan-completed',
    provider: 'trivy',
    state: 'completed',
    metadata: {
      scanId: session.scanId,
      dependencyCount: session.dependencyCount,
      vulnCount: session.vulns.length,
      licenseFlagCount: session.licenseFlags.length,
      criticalCount,
    },
  };
  session.history.push(step);
  return step;
}
