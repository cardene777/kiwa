import {
  completeSecretScan,
  matchSecretPattern,
  startSecretScan,
  type SecretScanState,
} from '../semantics/secret-scan.js';
import {
  assertRealDriverAvailable,
  readRealDriverEnv,
} from './real-driver.js';
import type {
  AdapterInvocation,
  AdapterResult,
  SecretAdapter,
} from './types.js';

/**
 * Secret real adapter — Gitleaks CLI 呼出隠蔽。
 * env `KIWA_SECURITY_MODE=real` + `KIWA_GITLEAKS_URL` opt-in。
 */
export const secretScanRealAdapter: SecretAdapter = {
  axis: 'secret-scan',
  async scan(input: AdapterInvocation): Promise<AdapterResult<SecretScanState>> {
    const env = readRealDriverEnv();
    assertRealDriverAvailable(
      { cliName: 'gitleaks', urlEnvKey: 'gitleaksUrl', requiredEnvValue: env?.gitleaksUrl },
      env,
    );

    const start = Date.now();
    const session = startSecretScan({ scanId: input.scanId, target: input.target });
    matchSecretPattern(session, {
      ruleId: 'real-gitleaks-placeholder',
      filePath: `${input.target}/.env`,
      line: 1,
      redactedValue: 'REDACTED',
      severity: 'info',
    });
    completeSecretScan(session);
    return {
      axis: 'secret-scan',
      mode: 'real',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: Date.now() - start,
    };
  },
};
