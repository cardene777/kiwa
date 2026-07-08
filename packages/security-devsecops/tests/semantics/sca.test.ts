import { describe, expect, it } from 'vitest';
import {
  analyzeScaDependency,
  completeScaScan,
  detectScaVuln,
  flagScaLicense,
  startScaScan,
} from '../../src/index.js';

describe('sca axis', () => {
  it('startScaScan initializes with trivy provider', () => {
    const s = startScaScan({ scanId: 's-1', target: 'package.json' });
    expect(s.provider).toBe('trivy');
    expect(s.state).toBe('analyzing');
  });

  it('analyzeScaDependency accumulates count', () => {
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    analyzeScaDependency(s, { count: 100 });
    analyzeScaDependency(s, { count: 50 });
    expect(s.dependencyCount).toBe(150);
  });

  it('detectScaVuln adds vuln + transitions', () => {
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    const step = detectScaVuln(s, {
      cveId: 'CVE-2024-1234',
      package: 'lodash',
      version: '4.17.20',
      severity: 'high',
      fixedVersion: '4.17.21',
    });
    expect(step.state).toBe('vulns-detected');
    expect(step.metadata.hasFix).toBe(true);
  });

  it('flagScaLicense records license flag', () => {
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    const step = flagScaLicense(s, {
      package: 'gpl-lib',
      license: 'GPL-3.0',
      reason: 'copyleft',
    });
    expect(step.metadata.reason).toBe('copyleft');
    expect(s.licenseFlags).toHaveLength(1);
  });

  it('completeScaScan counts critical', () => {
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    detectScaVuln(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      severity: 'critical',
    });
    detectScaVuln(s, {
      cveId: 'B',
      package: 'y',
      version: '1',
      severity: 'medium',
    });
    const step = completeScaScan(s);
    expect(step.metadata.criticalCount).toBe(1);
    expect(step.metadata.vulnCount).toBe(2);
  });

  it('history includes analyze + vuln + license events', () => {
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    analyzeScaDependency(s, { count: 10 });
    detectScaVuln(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      severity: 'high',
    });
    flagScaLicense(s, { package: 'y', license: 'GPL', reason: 'copyleft' });
    completeScaScan(s);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'sca.dependency-analyzed',
      'sca.dependency-analyzed',
      'sca.vuln-detected',
      'sca.license-flagged',
      'sca.scan-completed',
    ]);
  });

  it('vuln with no fix has hasFix=false', () => {
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    const step = detectScaVuln(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      severity: 'high',
    });
    expect(step.metadata.hasFix).toBe(false);
  });
});
