import {
  completeSastScan,
  detectSastFinding,
  startSastScan,
  type SastState,
} from '../semantics/sast.js';
import {
  assertRealDriverAvailable,
  readRealDriverEnv,
} from './real-driver.js';
import type {
  AdapterInvocation,
  AdapterResult,
  SastAdapter,
} from './types.js';

/**
 * SAST real adapter — Semgrep CLI 呼出隠蔽。
 * env `KIWA_SECURITY_MODE=real` + `KIWA_SEMGREP_URL` opt-in。
 */
export const sastRealAdapter: SastAdapter = {
  axis: 'sast',
  async scan(input: AdapterInvocation): Promise<AdapterResult<SastState>> {
    const env = readRealDriverEnv();
    assertRealDriverAvailable(
      { cliName: 'semgrep', urlEnvKey: 'semgrepUrl', requiredEnvValue: env?.semgrepUrl },
      env,
    );

    const start = Date.now();
    const session = startSastScan({ scanId: input.scanId, target: input.target });
    detectSastFinding(session, {
      ruleId: 'real-semgrep-placeholder',
      filePath: `${input.target}/README.md`,
      line: 1,
      severity: 'info',
      message: 'real semgrep invocation stub (v0.2 = interface only, v0.3 で spawn 実装予定)',
    });
    completeSastScan(session);
    return {
      axis: 'sast',
      mode: 'real',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: Date.now() - start,
    };
  },
};
