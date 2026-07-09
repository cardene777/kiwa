import { describe, expect, it } from 'vitest';
import { evaluateReleaseGate } from '../src/index.js';
import type { QualityReport } from '../src/index.js';

function baseReport(): QualityReport {
  return {
    version: '1.0',
    reportedAt: '2026-07-08T00:00:00Z',
    provider: '@kiwa-lab/core',
    coverage: { line: 90, branch: 85, function: 95 },
    fidelity: { ratio: 80, methodTotal: 10, methodCovered: 8 },
    perf: { p50Ms: 5, p95Ms: 30, p99Ms: 50, samples: 100 },
    mutation: { mutations: 100, killed: 65, survived: 35, killRate: 65 },
    testCount: { unit: 20, integration: 5, e2e: 2, behavior: 15, total: 42 },
  } as unknown as QualityReport;
}

describe('release gate — v0.4 perf strict axis', () => {
  it('lax mode (strict != true) skips strict axis, axesEvaluated stays 7', () => {
    const report = baseReport();
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(7);
    expect(verdict.blockers).toEqual([]);
  });

  it('strict mode with p95 <= 50 + baseline exists → pass, axesEvaluated += 2', () => {
    const report = baseReport();
    report.perf.strict = true;
    report.perf.baselineExists = true;
    report.perf.p95Ms = 30; // <= 50 strict cap
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(9); // 7 base + strict.p95Ms + strict.baseline
  });

  it('strict mode with p95 > 50 → fail on perf.strict.p95Ms', () => {
    const report = baseReport();
    report.perf.strict = true;
    report.perf.baselineExists = true;
    report.perf.p95Ms = 60; // > 50 strict cap
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const strictBlocker = verdict.blockers.find((b) => b.axis === 'perf.strict.p95Ms');
    expect(strictBlocker).toBeDefined();
    expect(strictBlocker?.threshold).toBe(50);
    expect(strictBlocker?.actual).toBe(60);
  });

  it('strict mode with baseline missing → fail on perf.strict.baseline', () => {
    const report = baseReport();
    report.perf.strict = true;
    report.perf.baselineExists = false;
    report.perf.p95Ms = 30;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const baselineBlocker = verdict.blockers.find((b) => b.axis === 'perf.strict.baseline');
    expect(baselineBlocker).toBeDefined();
  });

  it('strict mode with both p95 exceed + baseline missing → 2 blockers', () => {
    const report = baseReport();
    report.perf.strict = true;
    report.perf.baselineExists = false;
    report.perf.p95Ms = 60;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers.filter((b) => b.axis.startsWith('perf.strict.'))).toHaveLength(2);
  });

  it('custom strict threshold override honored', () => {
    const report = baseReport();
    report.perf.strict = true;
    report.perf.baselineExists = true;
    report.perf.p95Ms = 30;
    const verdict = evaluateReleaseGate(report, { perfStrictP95Ms: 20 });
    // 30 > 20 → fail
    expect(verdict.passed).toBe(false);
  });

  it('perfStrictRequireBaseline=false skips baseline check', () => {
    const report = baseReport();
    report.perf.strict = true;
    report.perf.baselineExists = false;
    report.perf.p95Ms = 30;
    const verdict = evaluateReleaseGate(report, { perfStrictRequireBaseline: false });
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8); // 7 base + strict.p95Ms のみ
  });
});
