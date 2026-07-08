import type { AxisStep, Severity } from './types.js';

/**
 * SAST (Static Application Security Testing) axis — code scan → finding
 * detection → severity classification → suppression / completion。
 * Semgrep-neutral pattern。
 */
export type SastState = 'idle' | 'scanning' | 'findings-detected' | 'completed';

export interface SastFinding {
  ruleId: string;
  filePath: string;
  line: number;
  severity: Severity;
  message: string;
}

export interface SastSession {
  scanId: string;
  provider: 'semgrep';
  target: string;
  findings: SastFinding[];
  suppressed: Set<string>;
  state: SastState;
  history: AxisStep<SastState>[];
}

export function startSastScan(input: { scanId: string; target: string }): SastSession {
  const session: SastSession = {
    scanId: input.scanId,
    provider: 'semgrep',
    target: input.target,
    findings: [],
    suppressed: new Set(),
    state: 'scanning',
    history: [],
  };
  const step: AxisStep<SastState> = {
    neutralEvent: 'sast.scan-started',
    provider: 'semgrep',
    state: 'scanning',
    metadata: { scanId: input.scanId, target: input.target },
  };
  session.history.push(step);
  return session;
}

export function detectSastFinding(
  session: SastSession,
  finding: SastFinding,
): AxisStep<SastState> {
  if (session.state !== 'scanning' && session.state !== 'findings-detected') {
    throw new Error(`detectSastFinding: session is ${session.state}`);
  }
  session.findings.push(finding);
  session.state = 'findings-detected';
  const step: AxisStep<SastState> = {
    neutralEvent: 'sast.finding-detected',
    provider: 'semgrep',
    state: 'findings-detected',
    metadata: {
      scanId: session.scanId,
      ruleId: finding.ruleId,
      severity: finding.severity,
      filePath: finding.filePath,
      line: finding.line,
    },
  };
  session.history.push(step);
  return step;
}

export function suppressSastFinding(
  session: SastSession,
  input: { ruleId: string; reason: string },
): AxisStep<SastState> {
  session.suppressed.add(input.ruleId);
  const step: AxisStep<SastState> = {
    neutralEvent: 'sast.suppressed',
    provider: 'semgrep',
    state: session.state,
    metadata: {
      scanId: session.scanId,
      ruleId: input.ruleId,
      reason: input.reason,
    },
  };
  session.history.push(step);
  return step;
}

export function completeSastScan(session: SastSession): AxisStep<SastState> {
  session.state = 'completed';
  const criticalCount = session.findings.filter(
    (f) => f.severity === 'critical' && !session.suppressed.has(f.ruleId),
  ).length;
  const step: AxisStep<SastState> = {
    neutralEvent: 'sast.scan-completed',
    provider: 'semgrep',
    state: 'completed',
    metadata: {
      scanId: session.scanId,
      totalFindings: session.findings.length,
      suppressedCount: session.suppressed.size,
      criticalCount,
    },
  };
  session.history.push(step);
  return step;
}
