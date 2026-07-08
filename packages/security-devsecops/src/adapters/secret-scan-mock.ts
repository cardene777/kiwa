import {
  completeSecretScan,
  flagSecretEntropy,
  matchSecretPattern,
  startSecretScan,
  type SecretScanState,
} from '../semantics/secret-scan.js';
import type {
  AdapterInvocation,
  AdapterResult,
  SecretAdapter,
} from './types.js';

/**
 * Secret mock adapter — Gitleaks-style deterministic replay。
 */
export const secretScanMockAdapter: SecretAdapter = {
  axis: 'secret-scan',
  async scan(input: AdapterInvocation): Promise<AdapterResult<SecretScanState>> {
    const session = startSecretScan({ scanId: input.scanId, target: input.target });
    matchSecretPattern(session, {
      ruleId: 'aws-access-key',
      filePath: `${input.target}/.env`,
      line: 3,
      redactedValue: 'AKIA****REDACTED',
      severity: 'critical',
    });
    flagSecretEntropy(session, {
      filePath: `${input.target}/config.ts`,
      line: 11,
      entropyScore: 4.8,
      redactedValue: 'r4nd0m****',
    });
    completeSecretScan(session);
    return {
      axis: 'secret-scan',
      mode: 'mock',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: 1,
    };
  },
};
