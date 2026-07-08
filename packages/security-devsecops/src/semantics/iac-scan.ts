import type { AxisStep, Severity } from './types.js';

/**
 * IaC scan axis — tfsec-style Terraform / CloudFormation misconfiguration
 * detection + compliance policy check (SOC 2 / CIS Benchmark)。
 */
export type IacScanState = 'idle' | 'analyzing' | 'misconfig-found' | 'completed';

export interface IacMisconfig {
  ruleId: string;
  resourceType: string;
  resourceName: string;
  filePath: string;
  severity: Severity;
  message: string;
}

export interface IacComplianceCheck {
  framework: 'soc2' | 'cis-benchmark' | 'pci-dss' | 'hipaa';
  controlId: string;
  passed: boolean;
}

export interface IacScanSession {
  scanId: string;
  provider: 'tfsec';
  target: string;
  misconfigs: IacMisconfig[];
  compliance: IacComplianceCheck[];
  resourceCount: number;
  state: IacScanState;
  history: AxisStep<IacScanState>[];
}

export function startIacScan(input: { scanId: string; target: string }): IacScanSession {
  const session: IacScanSession = {
    scanId: input.scanId,
    provider: 'tfsec',
    target: input.target,
    misconfigs: [],
    compliance: [],
    resourceCount: 0,
    state: 'analyzing',
    history: [],
  };
  const step: AxisStep<IacScanState> = {
    neutralEvent: 'iac.resource-analyzed',
    provider: 'tfsec',
    state: 'analyzing',
    metadata: { scanId: input.scanId, target: input.target },
  };
  session.history.push(step);
  return session;
}

export function analyzeIacResource(
  session: IacScanSession,
  input: { count: number },
): AxisStep<IacScanState> {
  session.resourceCount += input.count;
  const step: AxisStep<IacScanState> = {
    neutralEvent: 'iac.resource-analyzed',
    provider: 'tfsec',
    state: session.state,
    metadata: { scanId: session.scanId, count: input.count, totalCount: session.resourceCount },
  };
  session.history.push(step);
  return step;
}

export function detectIacMisconfig(
  session: IacScanSession,
  misconfig: IacMisconfig,
): AxisStep<IacScanState> {
  session.misconfigs.push(misconfig);
  session.state = 'misconfig-found';
  const step: AxisStep<IacScanState> = {
    neutralEvent: 'iac.misconfig-detected',
    provider: 'tfsec',
    state: 'misconfig-found',
    metadata: {
      scanId: session.scanId,
      ruleId: misconfig.ruleId,
      resourceType: misconfig.resourceType,
      severity: misconfig.severity,
    },
  };
  session.history.push(step);
  return step;
}

export function checkIacCompliance(
  session: IacScanSession,
  check: IacComplianceCheck,
): AxisStep<IacScanState> {
  session.compliance.push(check);
  const step: AxisStep<IacScanState> = {
    neutralEvent: 'iac.compliance-checked',
    provider: 'tfsec',
    state: session.state,
    metadata: {
      scanId: session.scanId,
      framework: check.framework,
      controlId: check.controlId,
      passed: check.passed,
    },
  };
  session.history.push(step);
  return step;
}

export function completeIacScan(session: IacScanSession): AxisStep<IacScanState> {
  session.state = 'completed';
  const criticalCount = session.misconfigs.filter((m) => m.severity === 'critical').length;
  const complianceFailCount = session.compliance.filter((c) => !c.passed).length;
  const step: AxisStep<IacScanState> = {
    neutralEvent: 'iac.scan-completed',
    provider: 'tfsec',
    state: 'completed',
    metadata: {
      scanId: session.scanId,
      resourceCount: session.resourceCount,
      misconfigCount: session.misconfigs.length,
      complianceCount: session.compliance.length,
      criticalCount,
      complianceFailCount,
    },
  };
  session.history.push(step);
  return step;
}
