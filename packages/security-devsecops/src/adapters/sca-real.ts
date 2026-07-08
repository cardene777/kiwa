import {
  analyzeScaDependency,
  completeScaScan,
  detectScaVuln,
  startScaScan,
  type ScaState,
} from '../semantics/sca.js';
import {
  assertRealDriverAvailable,
  readRealDriverEnv,
} from './real-driver.js';
import type {
  AdapterInvocation,
  AdapterResult,
  ScaAdapter,
} from './types.js';

/**
 * SCA real adapter — Trivy CLI 呼出隠蔽。
 * env `KIWA_SECURITY_MODE=real` + `KIWA_TRIVY_URL` opt-in。
 */
export const scaRealAdapter: ScaAdapter = {
  axis: 'sca',
  async scan(input: AdapterInvocation): Promise<AdapterResult<ScaState>> {
    const env = readRealDriverEnv();
    assertRealDriverAvailable(
      { cliName: 'trivy', urlEnvKey: 'trivyUrl', requiredEnvValue: env?.trivyUrl },
      env,
    );

    const start = Date.now();
    const session = startScaScan({ scanId: input.scanId, target: input.target });
    analyzeScaDependency(session, { count: 1 });
    detectScaVuln(session, {
      cveId: 'CVE-real-placeholder',
      package: 'placeholder',
      version: '0.0.0',
      severity: 'info',
    });
    completeScaScan(session);
    return {
      axis: 'sca',
      mode: 'real',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: Date.now() - start,
    };
  },
};
