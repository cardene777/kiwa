import { describe, expect, it } from 'vitest';
import {
  completeSastScan,
  detectSastFinding,
  startSastScan,
  suppressSastFinding,
} from '../../src/index.js';

describe('sast axis', () => {
  it('startSastScan initializes session', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    expect(s.state).toBe('scanning');
    expect(s.provider).toBe('semgrep');
    expect(s.findings).toHaveLength(0);
  });

  it('detectSastFinding adds finding + transitions state', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    const step = detectSastFinding(s, {
      ruleId: 'js.crypto.weak-hash',
      filePath: 'src/auth.ts',
      line: 42,
      severity: 'high',
      message: 'MD5 usage detected',
    });
    expect(step.state).toBe('findings-detected');
    expect(step.metadata.severity).toBe('high');
    expect(s.findings).toHaveLength(1);
  });

  it('suppressSastFinding adds to allowlist', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    const step = suppressSastFinding(s, {
      ruleId: 'legacy-crypto',
      reason: 'legacy migration in progress',
    });
    expect(step.metadata.ruleId).toBe('legacy-crypto');
    expect(s.suppressed.has('legacy-crypto')).toBe(true);
  });

  it('completeSastScan excludes suppressed from critical count', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    detectSastFinding(s, {
      ruleId: 'A',
      filePath: 'a.ts',
      line: 1,
      severity: 'critical',
      message: 'X',
    });
    detectSastFinding(s, {
      ruleId: 'B',
      filePath: 'b.ts',
      line: 2,
      severity: 'critical',
      message: 'Y',
    });
    suppressSastFinding(s, { ruleId: 'A', reason: 'x' });
    const step = completeSastScan(s);
    expect(step.metadata.totalFindings).toBe(2);
    expect(step.metadata.criticalCount).toBe(1);
  });

  it('detectSastFinding rejects when not scanning', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    completeSastScan(s);
    expect(() =>
      detectSastFinding(s, {
        ruleId: 'X',
        filePath: 'x.ts',
        line: 1,
        severity: 'low',
        message: 'x',
      }),
    ).toThrow(/completed/);
  });

  it('history accumulates in order', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    detectSastFinding(s, {
      ruleId: 'A',
      filePath: 'a.ts',
      line: 1,
      severity: 'high',
      message: 'x',
    });
    suppressSastFinding(s, { ruleId: 'A', reason: 'x' });
    completeSastScan(s);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'sast.scan-started',
      'sast.finding-detected',
      'sast.suppressed',
      'sast.scan-completed',
    ]);
  });

  it('multiple findings accumulate', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    for (let i = 0; i < 5; i++) {
      detectSastFinding(s, {
        ruleId: `rule-${i}`,
        filePath: 'x.ts',
        line: i,
        severity: 'medium',
        message: 'x',
      });
    }
    expect(s.findings).toHaveLength(5);
  });

  it('provider is semgrep', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    expect(s.provider).toBe('semgrep');
  });
});
