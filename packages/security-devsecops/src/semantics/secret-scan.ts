import type { AxisStep, Severity } from './types.js';

/**
 * Secret scan axis — Gitleaks-style secret pattern matching + entropy
 * analysis + allowlist support。
 */
export type SecretScanState = 'idle' | 'scanning' | 'secrets-found' | 'completed';

export interface SecretMatch {
  ruleId: string;
  matchType: 'pattern' | 'entropy';
  filePath: string;
  line: number;
  redactedValue: string;
  severity: Severity;
}

export interface SecretScanSession {
  scanId: string;
  provider: 'gitleaks';
  target: string;
  matches: SecretMatch[];
  allowlisted: Set<string>;
  state: SecretScanState;
  history: AxisStep<SecretScanState>[];
}

export function startSecretScan(input: { scanId: string; target: string }): SecretScanSession {
  const session: SecretScanSession = {
    scanId: input.scanId,
    provider: 'gitleaks',
    target: input.target,
    matches: [],
    allowlisted: new Set(),
    state: 'scanning',
    history: [],
  };
  const step: AxisStep<SecretScanState> = {
    neutralEvent: 'secret.pattern-matched',
    provider: 'gitleaks',
    state: 'scanning',
    metadata: { scanId: input.scanId, target: input.target },
  };
  session.history.push(step);
  return session;
}

export function matchSecretPattern(
  session: SecretScanSession,
  match: Omit<SecretMatch, 'matchType'>,
): AxisStep<SecretScanState> {
  const full: SecretMatch = { ...match, matchType: 'pattern' };
  session.matches.push(full);
  session.state = 'secrets-found';
  const step: AxisStep<SecretScanState> = {
    neutralEvent: 'secret.pattern-matched',
    provider: 'gitleaks',
    state: 'secrets-found',
    metadata: {
      scanId: session.scanId,
      ruleId: match.ruleId,
      severity: match.severity,
      filePath: match.filePath,
    },
  };
  session.history.push(step);
  return step;
}

export function flagSecretEntropy(
  session: SecretScanSession,
  input: { filePath: string; line: number; entropyScore: number; redactedValue: string },
): AxisStep<SecretScanState> {
  const match: SecretMatch = {
    ruleId: 'entropy',
    matchType: 'entropy',
    filePath: input.filePath,
    line: input.line,
    redactedValue: input.redactedValue,
    severity: input.entropyScore >= 4.5 ? 'high' : 'medium',
  };
  session.matches.push(match);
  session.state = 'secrets-found';
  const step: AxisStep<SecretScanState> = {
    neutralEvent: 'secret.entropy-flagged',
    provider: 'gitleaks',
    state: 'secrets-found',
    metadata: {
      scanId: session.scanId,
      entropyScore: input.entropyScore,
      filePath: input.filePath,
    },
  };
  session.history.push(step);
  return step;
}

export function allowlistSecret(
  session: SecretScanSession,
  input: { ruleId: string; reason: string },
): AxisStep<SecretScanState> {
  session.allowlisted.add(input.ruleId);
  const step: AxisStep<SecretScanState> = {
    neutralEvent: 'secret.allowlisted',
    provider: 'gitleaks',
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

export function completeSecretScan(session: SecretScanSession): AxisStep<SecretScanState> {
  session.state = 'completed';
  const activeMatches = session.matches.filter((m) => !session.allowlisted.has(m.ruleId));
  const step: AxisStep<SecretScanState> = {
    neutralEvent: 'secret.scan-completed',
    provider: 'gitleaks',
    state: 'completed',
    metadata: {
      scanId: session.scanId,
      totalMatches: session.matches.length,
      allowlistedCount: session.allowlisted.size,
      activeCount: activeMatches.length,
    },
  };
  session.history.push(step);
  return step;
}
