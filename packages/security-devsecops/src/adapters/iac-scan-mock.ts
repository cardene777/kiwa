import {
  analyzeIacResource,
  checkIacCompliance,
  completeIacScan,
  detectIacMisconfig,
  startIacScan,
  type IacScanState,
} from '../semantics/iac-scan.js';
import type {
  AdapterInvocation,
  AdapterResult,
  IacAdapter,
} from './types.js';

/**
 * IaC mock adapter — tfsec-style deterministic replay。 1 misconfig + 1 pass +
 * 1 fail compliance check。
 */
export const iacScanMockAdapter: IacAdapter = {
  axis: 'iac-scan',
  async scan(input: AdapterInvocation): Promise<AdapterResult<IacScanState>> {
    const session = startIacScan({ scanId: input.scanId, target: input.target });
    analyzeIacResource(session, { count: 18 });
    detectIacMisconfig(session, {
      ruleId: 'aws-s3-public-read',
      resourceType: 'aws_s3_bucket',
      resourceName: 'main-bucket',
      filePath: `${input.target}/main.tf`,
      severity: 'high',
      message: 'S3 bucket allows public read',
    });
    checkIacCompliance(session, { framework: 'cis-benchmark', controlId: 'CIS-2.1.1', passed: true });
    checkIacCompliance(session, { framework: 'soc2', controlId: 'CC6.6', passed: false });
    completeIacScan(session);
    return {
      axis: 'iac-scan',
      mode: 'mock',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: 1,
    };
  },
};
