import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RELEASE_GATE_THRESHOLDS,
  captureSnapshot,
  evaluateReleaseGate,
  type QualityReport,
} from '../src/index.js';

function passingReport(): QualityReport {
  return {
    provider: '@kiwa-lab/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
  };
}

describe('evaluateReleaseGate — pass (non AI-LLM)', () => {
  it('T-QM-GT-001 passes when every axis clears defaults', () => {
    const verdict = evaluateReleaseGate(passingReport());
    expect(verdict.passed).toBe(true);
    expect(verdict.blockers).toEqual([]);
    expect(verdict.axesEvaluated).toBe(7);
  });

  it('T-QM-GT-002 exposes stable default thresholds SSOT (v0.4 13 axis + optional strict 2)', () => {
    expect(DEFAULT_RELEASE_GATE_THRESHOLDS).toEqual({
      coverageLine: 85,
      coverageBranch: 80,
      coverageFunction: 90,
      fidelityRatio: 70,
      perfP95Ms: 100,
      mutationKillRate: 60,
      behaviorTests: 10,
      costPerRequestUsd: 0.1,
      latencyP95Ms: 3000,
      totalTokens: 4000,
      accuracyScore: 0.8,
      perfStrictP95Ms: 50,
      perfStrictRequireBaseline: true,
    });
  });
});

describe('evaluateReleaseGate — fail', () => {
  it('T-QM-GT-003 blocks when line coverage below floor', () => {
    const report = passingReport();
    report.coverage.line = 60;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers).toContainEqual({
      axis: 'coverage.line',
      threshold: 85,
      actual: 60,
      op: '>=',
    });
  });

  it('T-QM-GT-004 blocks when branch coverage below floor', () => {
    const report = passingReport();
    report.coverage.branch = 50;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('coverage.branch');
  });

  it('T-QM-GT-005 blocks when function coverage below floor', () => {
    const report = passingReport();
    report.coverage.function = 70;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('coverage.function');
  });

  it('T-QM-GT-006 blocks when fidelity ratio below floor', () => {
    const report = passingReport();
    report.fidelity.ratio = 50;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('fidelity.ratio');
  });

  it('T-QM-GT-007 blocks when perf p95 above ceiling', () => {
    const report = passingReport();
    report.perf.p95Ms = 500;
    const verdict = evaluateReleaseGate(report);
    const blocker = verdict.blockers.find((b) => b.axis === 'perf.p95Ms');
    expect(blocker?.op).toBe('<=');
    expect(blocker?.threshold).toBe(100);
  });

  it('T-QM-GT-008 blocks when mutation kill rate below floor', () => {
    const report = passingReport();
    report.mutation.killRate = 20;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('mutation.killRate');
  });

  it('T-QM-GT-009 blocks when behavior test count below floor', () => {
    const report = passingReport();
    report.testCount.behavior = 3;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('testCount.behavior');
  });

  it('T-QM-GT-010 reports all blockers, not just the first', () => {
    const report = passingReport();
    report.coverage.line = 10;
    report.mutation.killRate = 10;
    const verdict = evaluateReleaseGate(report);
    const axes = verdict.blockers.map((b) => b.axis);
    expect(axes).toContain('coverage.line');
    expect(axes).toContain('mutation.killRate');
  });

  it('T-QM-GT-011 honours overridden thresholds', () => {
    const verdict = evaluateReleaseGate(passingReport(), {
      coverageLine: 99,
    });
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers[0]?.axis).toBe('coverage.line');
    expect(verdict.blockers[0]?.threshold).toBe(99);
  });

  it('T-QM-GT-012 non AI-LLM provider does not require AI-LLM 4 axes', () => {
    // AI-LLM 4 軸を含まない report が非 AI-LLM provider では pass する。
    const verdict = evaluateReleaseGate(passingReport());
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(7);
    expect(verdict.blockers.find((b) => b.axis === 'cost.perRequestUsd')).toBeUndefined();
  });
});

describe('evaluateReleaseGate — v0.6 drift 統合 axis 群', () => {
  it('T-QM-GT-013 driftEnabled + driftBaseline 両立時のみ drift axis 発火 (axesEvaluated +1)', () => {
    const baselineReport = passingReport();
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
      label: 'baseline-v1.65',
    });
    const currentReport = passingReport();
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
    });
    expect(verdict.axesEvaluated).toBe(8);
    expect(verdict.passed).toBe(true);
  });

  it('T-QM-GT-014 driftEnabled=false / driftBaseline 不在で 完全 skip (v0.5 まで の 7 axis 挙動 維持)', () => {
    const baselineReport = passingReport();
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    // Case A: driftEnabled 省略、 driftBaseline 存在 → skip
    const verdictA = evaluateReleaseGate(currentReport, {}, {
      driftBaseline: baselineSnapshot,
    });
    expect(verdictA.axesEvaluated).toBe(7);
    // Case B: driftEnabled=true、 driftBaseline 省略 → skip
    const verdictB = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
    });
    expect(verdictB.axesEvaluated).toBe(7);
    // Case C: 両方省略 → skip (backward compat 絶対 維持)
    const verdictC = evaluateReleaseGate(currentReport, {}, {});
    expect(verdictC.axesEvaluated).toBe(7);
  });

  it('T-QM-GT-015 coverage regression 検知 で drift.coverage.line blocker 発火 (100 → 80)', () => {
    const baselineReport = passingReport();
    baselineReport.coverage.line = 100;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.coverage.line = 80;
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
      driftThresholdPct: 5.0,
    });
    expect(verdict.passed).toBe(false);
    const driftBlocker = verdict.blockers.find((b) => b.axis === 'drift.coverage.line');
    expect(driftBlocker).toBeDefined();
    expect(driftBlocker?.threshold).toBe(-5.0);
    expect(driftBlocker?.op).toBe('>=');
  });

  it('T-QM-GT-016 perf regression 検知 (上昇 = 悪化) で drift.perf.p95Ms blocker 発火', () => {
    const baselineReport = passingReport();
    baselineReport.perf.p95Ms = 30;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.perf.p95Ms = 60;
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
    });
    expect(verdict.passed).toBe(false);
    const driftBlocker = verdict.blockers.find((b) => b.axis === 'drift.perf.p95Ms');
    expect(driftBlocker).toBeDefined();
  });

  it('T-QM-GT-017 improvement (perf 30 → 20) は drift blocker 発火せず pass', () => {
    const baselineReport = passingReport();
    baselineReport.perf.p95Ms = 30;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.perf.p95Ms = 20;
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
    });
    expect(verdict.passed).toBe(true);
    expect(verdict.blockers.filter((b) => b.axis.startsWith('drift.'))).toEqual([]);
  });

  it('T-QM-GT-018 threshold 未満 の 変動 は stable 扱い で drift blocker 発火せず (coverage 90 → 91)', () => {
    const baselineReport = passingReport();
    baselineReport.coverage.line = 90;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.coverage.line = 91;
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
      driftThresholdPct: 5.0,
    });
    expect(verdict.passed).toBe(true);
  });

  it('T-QM-GT-019 driftThresholdPct 省略 で default 5.0 適用', () => {
    const baselineReport = passingReport();
    baselineReport.coverage.line = 90;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.coverage.line = 86; // 90 → 86 = -4.4% で threshold 5.0 未満、 stable
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
    });
    expect(verdict.passed).toBe(true);
  });

  it('T-QM-GT-020 複数 regression 検知 で 個別 drift blocker 群 が 1:1 で 積まれる', () => {
    const baselineReport = passingReport();
    baselineReport.coverage.line = 100;
    baselineReport.coverage.branch = 100;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.coverage.line = 80;
    currentReport.coverage.branch = 80; // 82 default → 80 で -2.4% だが 100 → 80 なら -20%
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
    });
    const driftAxes = verdict.blockers.filter((b) => b.axis.startsWith('drift.')).map((b) => b.axis);
    expect(driftAxes).toContain('drift.coverage.line');
    expect(driftAxes).toContain('drift.coverage.branch');
  });

  it('T-QM-GT-021 drift 統合 は 既存 axis 群 と 並存 (drift + coverage 二重 fail)', () => {
    const baselineReport = passingReport();
    baselineReport.coverage.line = 100;
    const baselineSnapshot = captureSnapshot({
      report: baselineReport,
      capturedAt: '2026-06-01T00:00:00Z',
    });
    const currentReport = passingReport();
    currentReport.coverage.line = 60; // 既存 coverage.line 85 未満 で fail + drift 100 → 60 で -40% regression
    const verdict = evaluateReleaseGate(currentReport, {}, {
      driftEnabled: true,
      driftBaseline: baselineSnapshot,
    });
    expect(verdict.passed).toBe(false);
    const axes = verdict.blockers.map((b) => b.axis);
    expect(axes).toContain('coverage.line'); // 既存 axis fail
    expect(axes).toContain('drift.coverage.line'); // drift 統合 axis fail
  });
});
