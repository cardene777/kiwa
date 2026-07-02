import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RELEASE_GATE_THRESHOLDS,
  evaluateReleaseGate,
  type QualityReport,
} from '../src/index.js';

function passingReport(): QualityReport {
  return {
    provider: '@kiwa-test/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
  };
}

describe('evaluateReleaseGate — pass', () => {
  it('T-QM-GT-001 passes when every axis clears defaults', () => {
    const verdict = evaluateReleaseGate(passingReport());
    expect(verdict.passed).toBe(true);
    expect(verdict.blockers).toEqual([]);
    expect(verdict.axesEvaluated).toBe(7);
  });

  it('T-QM-GT-002 exposes stable default thresholds SSOT', () => {
    expect(DEFAULT_RELEASE_GATE_THRESHOLDS).toEqual({
      coverageLine: 85,
      coverageBranch: 80,
      coverageFunction: 90,
      fidelityRatio: 70,
      perfP95Ms: 100,
      mutationKillRate: 60,
      behaviorTests: 10,
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
});
