import { describe, expect, it } from 'vitest';
import {
  analyzeIacResource,
  checkIacCompliance,
  completeIacScan,
  detectIacMisconfig,
  startIacScan,
} from '../../src/index.js';

describe('iac-scan axis', () => {
  it('startIacScan initializes with tfsec', () => {
    const s = startIacScan({ scanId: 's-1', target: 'infra/' });
    expect(s.provider).toBe('tfsec');
  });

  it('analyzeIacResource accumulates count', () => {
    const s = startIacScan({ scanId: 's-1', target: '.' });
    analyzeIacResource(s, { count: 20 });
    expect(s.resourceCount).toBe(20);
  });

  it('detectIacMisconfig records misconfig', () => {
    const s = startIacScan({ scanId: 's-1', target: '.' });
    const step = detectIacMisconfig(s, {
      ruleId: 'AWS-S3-BUCKET-PUBLIC',
      resourceType: 'aws_s3_bucket',
      resourceName: 'logs',
      filePath: 'main.tf',
      severity: 'critical',
      message: 'Public bucket',
    });
    expect(step.state).toBe('misconfig-found');
    expect(step.metadata.severity).toBe('critical');
  });

  it('checkIacCompliance records compliance check', () => {
    const s = startIacScan({ scanId: 's-1', target: '.' });
    const step = checkIacCompliance(s, {
      framework: 'soc2',
      controlId: 'CC-6.1',
      passed: true,
    });
    expect(step.metadata.framework).toBe('soc2');
    expect(step.metadata.passed).toBe(true);
  });

  it('completeIacScan counts critical + compliance fails', () => {
    const s = startIacScan({ scanId: 's-1', target: '.' });
    detectIacMisconfig(s, {
      ruleId: 'X',
      resourceType: 'aws',
      resourceName: 'x',
      filePath: 'x.tf',
      severity: 'critical',
      message: 'x',
    });
    checkIacCompliance(s, { framework: 'cis-benchmark', controlId: '1.1', passed: false });
    const step = completeIacScan(s);
    expect(step.metadata.criticalCount).toBe(1);
    expect(step.metadata.complianceFailCount).toBe(1);
  });

  it('history accumulates events', () => {
    const s = startIacScan({ scanId: 's-1', target: '.' });
    analyzeIacResource(s, { count: 5 });
    detectIacMisconfig(s, {
      ruleId: 'X',
      resourceType: 'x',
      resourceName: 'x',
      filePath: 'x.tf',
      severity: 'high',
      message: 'x',
    });
    checkIacCompliance(s, { framework: 'pci-dss', controlId: '1.1', passed: true });
    completeIacScan(s);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'iac.resource-analyzed',
      'iac.resource-analyzed',
      'iac.misconfig-detected',
      'iac.compliance-checked',
      'iac.scan-completed',
    ]);
  });

  it('all 4 compliance frameworks work', () => {
    const s = startIacScan({ scanId: 's-1', target: '.' });
    for (const framework of ['soc2', 'cis-benchmark', 'pci-dss', 'hipaa'] as const) {
      const step = checkIacCompliance(s, { framework, controlId: 'x', passed: true });
      expect(step.metadata.framework).toBe(framework);
    }
    expect(s.compliance).toHaveLength(4);
  });
});
