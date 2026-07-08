import { describe, expect, it } from 'vitest';
import type { QualityReport } from '@kiwa-test/quality-metrics';
import {
  captureReleaseSnapshot,
  findRegressions,
  generateReleaseTrend,
  verifyNoRegression,
} from '../src/workflow.js';

function makeReport(overrides?: {
  coverageLine?: number;
  perfP95Ms?: number;
  mutationKillRate?: number;
}): QualityReport {
  return {
    provider: '@kiwa-test/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: overrides?.coverageLine ?? 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: overrides?.perfP95Ms ?? 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: overrides?.mutationKillRate ?? 70 },
  };
}

describe('dogfood-quality-metrics-history-app (v1.65-2、 depth-5 pattern 3 例目確定)', () => {
  it('captureReleaseSnapshot = label + timestamp 付き MetricSnapshot', () => {
    const snapshot = captureReleaseSnapshot({
      report: makeReport(),
      timestamp: '2026-07-08T00:00:00Z',
      label: 'release-v1.65',
    });
    expect(snapshot.label).toBe('release-v1.65');
    expect(snapshot.capturedAt).toBe('2026-07-08T00:00:00Z');
  });

  it('verifyNoRegression = stable release で passed=true', () => {
    const current = captureReleaseSnapshot({
      report: makeReport(),
      timestamp: 't1',
      label: 'current',
    });
    const baseline = captureReleaseSnapshot({
      report: makeReport(),
      timestamp: 't0',
      label: 'baseline',
    });
    const { passed, drift } = verifyNoRegression({ current, baseline });
    expect(passed).toBe(true);
    expect(drift.category).toBe('stable');
  });

  it('verifyNoRegression = coverage 悪化 で passed=false', () => {
    const current = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 70 }),
      timestamp: 't1',
      label: 'current',
    });
    const baseline = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 90 }),
      timestamp: 't0',
      label: 'baseline',
    });
    const { passed, drift } = verifyNoRegression({ current, baseline });
    expect(passed).toBe(false);
    expect(drift.category).toBe('regression');
  });

  it('verifyNoRegression = perf 改善 で passed=true (improvement)', () => {
    const current = captureReleaseSnapshot({
      report: makeReport({ perfP95Ms: 30 }),
      timestamp: 't1',
      label: 'current',
    });
    const baseline = captureReleaseSnapshot({
      report: makeReport({ perfP95Ms: 50 }),
      timestamp: 't0',
      label: 'baseline',
    });
    const { passed, drift } = verifyNoRegression({ current, baseline });
    expect(passed).toBe(true);
    expect(drift.category).toBe('improvement');
  });

  it('verifyNoRegression = カスタム threshold 対応', () => {
    const current = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 88 }),
      timestamp: 't1',
      label: 'current',
    });
    const baseline = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 90 }),
      timestamp: 't0',
      label: 'baseline',
    });
    // 5% threshold = 2/90 = 2.2% → stable
    const strict = verifyNoRegression({ current, baseline, thresholdPct: 5.0 });
    expect(strict.passed).toBe(true);
    // 1% threshold = 2.2% > 1% → regression
    const lenient = verifyNoRegression({ current, baseline, thresholdPct: 1.0 });
    expect(lenient.passed).toBe(false);
  });

  it('generateReleaseTrend = 複数 release の trend 生成', () => {
    const snapshots = [
      captureReleaseSnapshot({
        report: makeReport({ coverageLine: 80 }),
        timestamp: 't0',
        label: 'v1.63',
      }),
      captureReleaseSnapshot({
        report: makeReport({ coverageLine: 85 }),
        timestamp: 't1',
        label: 'v1.64',
      }),
      captureReleaseSnapshot({
        report: makeReport({ coverageLine: 90 }),
        timestamp: 't2',
        label: 'v1.65',
      }),
    ];
    const trend = generateReleaseTrend(snapshots);
    expect(trend.snapshotCount).toBe(3);
    expect(trend.firstLabel).toBe('v1.63');
    expect(trend.lastLabel).toBe('v1.65');
  });

  it('findRegressions = regression axis のみ抽出', () => {
    const current = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 70, perfP95Ms: 100 }),
      timestamp: 't1',
      label: 'current',
    });
    const baseline = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 90, perfP95Ms: 50 }),
      timestamp: 't0',
      label: 'baseline',
    });
    const regressions = findRegressions({ current, baseline });
    expect(regressions.length).toBeGreaterThan(0);
    expect(regressions.every((r) => r.axis && typeof r.deltaPct === 'number')).toBe(true);
  });

  it('shape 契約 preserving = snapshot は QualityReport 保持', () => {
    const report = makeReport();
    const snapshot = captureReleaseSnapshot({
      report,
      timestamp: 't0',
      label: 'test',
    });
    expect(snapshot.report).toBe(report);
  });

  it('empty snapshots で generateReleaseTrend が 空 trend 返却', () => {
    const trend = generateReleaseTrend([]);
    expect(trend.snapshotCount).toBe(0);
    expect(trend.axisSummary).toEqual([]);
  });

  it('4 pattern workflow (capture + verify + generate + findRegressions) 一貫性', () => {
    const baseline = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 90, perfP95Ms: 50 }),
      timestamp: 't0',
      label: 'v1.64',
    });
    const current = captureReleaseSnapshot({
      report: makeReport({ coverageLine: 88, perfP95Ms: 55 }),
      timestamp: 't1',
      label: 'v1.65',
    });

    // verifyNoRegression + findRegressions が 一致した結果を返す
    const verify = verifyNoRegression({ current, baseline });
    const regressions = findRegressions({ current, baseline });
    expect(verify.drift.regressions.length).toBe(regressions.length);
  });
});
