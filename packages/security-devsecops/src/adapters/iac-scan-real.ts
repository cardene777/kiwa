import {
  analyzeIacResource,
  completeIacScan,
  detectIacMisconfig,
  startIacScan,
  type IacScanState,
} from '../semantics/iac-scan.js';
import {
  assertRealDriverAvailable,
  readRealDriverEnv,
} from './real-driver.js';
import type {
  AdapterInvocation,
  AdapterResult,
  IacAdapter,
} from './types.js';

/**
 * IaC real adapter — tfsec CLI 呼出隠蔽。
 * env `KIWA_SECURITY_MODE=real` + `KIWA_TFSEC_URL` opt-in。
 */
export const iacScanRealAdapter: IacAdapter = {
  axis: 'iac-scan',
  async scan(input: AdapterInvocation): Promise<AdapterResult<IacScanState>> {
    const env = readRealDriverEnv();
    assertRealDriverAvailable(
      { cliName: 'tfsec', urlEnvKey: 'tfsecUrl', requiredEnvValue: env?.tfsecUrl },
      env,
    );

    const start = Date.now();
    const session = startIacScan({ scanId: input.scanId, target: input.target });
    analyzeIacResource(session, { count: 1 });
    detectIacMisconfig(session, {
      ruleId: 'real-tfsec-placeholder',
      resourceType: 'placeholder',
      resourceName: 'placeholder',
      filePath: `${input.target}/main.tf`,
      severity: 'info',
      message: 'real tfsec invocation stub',
    });
    completeIacScan(session);
    return {
      axis: 'iac-scan',
      mode: 'real',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: Date.now() - start,
    };
  },
};
