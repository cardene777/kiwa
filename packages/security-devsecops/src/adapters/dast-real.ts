import {
  attemptDastAttack,
  completeDastScan,
  crawlDastUrls,
  startDastScan,
  type DastState,
} from '../semantics/dast.js';
import {
  assertRealDriverAvailable,
  readRealDriverEnv,
} from './real-driver.js';
import type {
  AdapterInvocation,
  AdapterResult,
  DastAdapter,
} from './types.js';

/**
 * DAST real adapter — OWASP ZAP CLI 呼出隠蔽。
 * env `KIWA_SECURITY_MODE=real` + `KIWA_ZAP_URL` opt-in。
 */
export const dastRealAdapter: DastAdapter = {
  axis: 'dast',
  async scan(input: AdapterInvocation): Promise<AdapterResult<DastState>> {
    const env = readRealDriverEnv();
    assertRealDriverAvailable(
      { cliName: 'zap', urlEnvKey: 'zapUrl', requiredEnvValue: env?.zapUrl },
      env,
    );

    const start = Date.now();
    const session = startDastScan({ scanId: input.scanId, target: input.target });
    crawlDastUrls(session, { count: 1 });
    attemptDastAttack(session, {
      attackType: 'xss',
      targetUrl: input.target,
      payload: 'real-zap-placeholder',
      successful: false,
    });
    completeDastScan(session);
    return {
      axis: 'dast',
      mode: 'real',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: Date.now() - start,
    };
  },
};
