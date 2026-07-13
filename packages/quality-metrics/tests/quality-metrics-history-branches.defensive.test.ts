import { describe, expect, it } from 'vitest';
import {
  captureSnapshot,
  compareToBaseline,
  detectDrift,
  generateTrendReport,
} from '../src/history.js';
import type { MetricSnapshot } from '../src/history.js';
import type { QualityReport } from '../src/types.js';

function makeReport(overrides: Partial<QualityReport> = {}): QualityReport {
  return {
    provider: '@kiwa-lab/test',
    version: '1.0.0',
    reportedAt: '2026-07-13T00:00:00Z',
    coverage: { line: 90, branch: 85, function: 95 },
    testCount: { behavior: 10, integration: 5, e2e: 2, total: 17 },
    fidelity: { mockCoveredMethods: 4, realTotalMethods: 4, ratio: 100 },
    perf: { p50Ms: 10, p95Ms: 50, p99Ms: 100, samples: 100 },
    mutation: { mutations: 50, killed: 40, survived: 10, killRate: 80 },
    ...overrides,
  } as QualityReport;
}

function makeSnapshot(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    capturedAt: '2026-07-13T00:00:00Z',
    label: 'test',
    report: makeReport(),
    ...overrides,
  };
}

describe('captureSnapshot defensive branches', () => {
  it('captures snapshot with label', () => {
    const snap = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-07-13T00:00:00Z',
      label: 'release-v1.0',
    });
    expect(snap.label).toBe('release-v1.0');
  });

  it('captures snapshot without label (defaults to null)', () => {
    const snap = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-07-13T00:00:00Z',
    });
    expect(snap.label).toBeNull();
  });
});

describe('compareToBaseline defensive branches', () => {
  it('handles baseline value 0 with delta 0 (returns 0% not Infinity)', () => {
    const baseline = makeSnapshot({
      report: makeReport({
        coverage: { line: 0, branch: 0, function: 0 },
      }),
    });
    const current = makeSnapshot({
      report: makeReport({
        coverage: { line: 0, branch: 0, function: 0 },
      }),
    });
    const result = compareToBaseline({ current, baseline });
    const lineAxis = result.axisDeltas.find((a) => a.axis === 'coverage.line');
    expect(lineAxis?.deltaPct).toBe(0);
  });

  it('handles baseline value 0 with delta != 0 (returns Infinity)', () => {
    const baseline = makeSnapshot({
      report: makeReport({
        coverage: { line: 0, branch: 0, function: 0 },
      }),
    });
    const current = makeSnapshot({
      report: makeReport({
        coverage: { line: 100, branch: 100, function: 100 },
      }),
    });
    const result = compareToBaseline({ current, baseline });
    const lineAxis = result.axisDeltas.find((a) => a.axis === 'coverage.line');
    expect(lineAxis?.deltaPct).toBe(Infinity);
  });

  it('computes normal delta percentage', () => {
    const baseline = makeSnapshot({
      report: makeReport({
        coverage: { line: 80, branch: 80, function: 80 },
      }),
    });
    const current = makeSnapshot({
      report: makeReport({
        coverage: { line: 90, branch: 90, function: 90 },
      }),
    });
    const result = compareToBaseline({ current, baseline });
    const lineAxis = result.axisDeltas.find((a) => a.axis === 'coverage.line');
    expect(lineAxis?.deltaPct).toBeCloseTo(12.5);
  });
});

describe('detectDrift defensive branches', () => {
  it('classifies coverage improvement (up = better)', () => {
    const baseline = makeSnapshot({
      report: makeReport({
        coverage: { line: 80, branch: 80, function: 80 },
      }),
    });
    const current = makeSnapshot({
      report: makeReport({
        coverage: { line: 95, branch: 95, function: 95 },
      }),
    });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison, thresholdPct: 5 });
    expect(drift.improvements.some((a) => a.axis === 'coverage.line')).toBe(true);
  });

  it('classifies coverage regression (down = worse)', () => {
    const baseline = makeSnapshot({
      report: makeReport({
        coverage: { line: 95, branch: 95, function: 95 },
      }),
    });
    const current = makeSnapshot({
      report: makeReport({
        coverage: { line: 80, branch: 80, function: 80 },
      }),
    });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison, thresholdPct: 5 });
    expect(drift.regressions.some((a) => a.axis === 'coverage.line')).toBe(true);
  });

  it('classifies perf regression (up = worse for latency)', () => {
    const baseline = makeSnapshot({
      report: makeReport({
        perf: { p50Ms: 10, p95Ms: 50, p99Ms: 100, samples: 100 },
      }),
    });
    const current = makeSnapshot({
      report: makeReport({
        perf: { p50Ms: 20, p95Ms: 100, p99Ms: 200, samples: 100 },
      }),
    });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison, thresholdPct: 5 });
    expect(drift.regressions.some((a) => a.axis === 'perf.p95Ms')).toBe(true);
  });

  it('classifies stable when delta within threshold', () => {
    const baseline = makeSnapshot();
    const current = makeSnapshot();
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison, thresholdPct: 5 });
    expect(drift.stable.length).toBeGreaterThan(0);
    expect(drift.regressions).toHaveLength(0);
  });
});

describe('generateTrendReport defensive branches', () => {
  it('generates trend from single snapshot', () => {
    const snaps = [
      makeSnapshot({ label: 'only', capturedAt: '2026-07-13T00:00:00Z' }),
    ];
    const trend = generateTrendReport(snaps);
    expect(trend.snapshotCount).toBe(1);
    expect(trend.firstLabel).toBe('only');
    expect(trend.lastLabel).toBe('only');
  });

  it('generates trend from multiple snapshots with up/down/flat', () => {
    const s1 = makeSnapshot({
      label: 'first',
      report: makeReport({ coverage: { line: 80, branch: 80, function: 80 } }),
    });
    const s2 = makeSnapshot({
      label: 'last',
      report: makeReport({ coverage: { line: 95, branch: 80, function: 70 } }),
    });
    const trend = generateTrendReport([s1, s2]);
    const lineAxis = trend.axisSummary.find(
      (a) => a.axis === 'coverage.line',
    );
    expect(lineAxis?.trend).toBe('up');
    const branchAxis = trend.axisSummary.find(
      (a) => a.axis === 'coverage.branch',
    );
    expect(branchAxis?.trend).toBe('flat');
    const funcAxis = trend.axisSummary.find(
      (a) => a.axis === 'coverage.function',
    );
    expect(funcAxis?.trend).toBe('down');
  });
});
