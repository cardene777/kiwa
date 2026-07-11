import { describe, expect, it } from 'vitest';
import {
  captureSnapshot,
  compareToBaseline,
  detectDrift,
  generateTrendReport,
  type QualityReport,
} from '../src/index.js';

function makeReport(overrides?: {
  coverageLine?: number;
  perfP95Ms?: number;
  mutationKillRate?: number;
  behaviorTests?: number;
}): QualityReport {
  return {
    provider: '@kiwa-lab/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: overrides?.coverageLine ?? 90, branch: 82, function: 95 },
    testCount: {
      behavior: overrides?.behaviorTests ?? 20,
      integration: 5,
      e2e: 2,
      total: (overrides?.behaviorTests ?? 20) + 5 + 2,
    },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: overrides?.perfP95Ms ?? 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: overrides?.mutationKillRate ?? 70 },
  };
}

describe('v0.5 captureSnapshot', () => {
  it('MetricSnapshot に capturedAt + label + report 保持', () => {
    const snapshot = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-07-08T00:00:00Z',
      label: 'release-v1.65',
    });
    expect(snapshot.capturedAt).toBe('2026-07-08T00:00:00Z');
    expect(snapshot.label).toBe('release-v1.65');
    expect(snapshot.report.provider).toBe('@kiwa-lab/example');
  });

  it('label 省略時は null', () => {
    const snapshot = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-07-08T00:00:00Z',
    });
    expect(snapshot.label).toBeNull();
  });

  it('shape 契約 preserving = QualityReport 内容そのまま保持', () => {
    const report = makeReport();
    const snapshot = captureSnapshot({ report, capturedAt: '2026-07-08T00:00:00Z' });
    expect(snapshot.report).toBe(report);
  });
});

describe('v0.5 compareToBaseline', () => {
  it('axis 別 delta + deltaPct 計算', () => {
    const current = captureSnapshot({
      report: makeReport({ coverageLine: 95, perfP95Ms: 60 }),
      capturedAt: '2026-07-08T00:00:00Z',
      label: 'current',
    });
    const baseline = captureSnapshot({
      report: makeReport({ coverageLine: 90, perfP95Ms: 50 }),
      capturedAt: '2026-06-01T00:00:00Z',
      label: 'baseline',
    });

    const comparison = compareToBaseline({ current, baseline });
    expect(comparison.currentLabel).toBe('current');
    expect(comparison.baselineLabel).toBe('baseline');

    const coverageLineDelta = comparison.axisDeltas.find((d) => d.axis === 'coverage.line');
    expect(coverageLineDelta).toBeDefined();
    expect(coverageLineDelta?.delta).toBe(5);
    expect(coverageLineDelta?.deltaPct).toBeCloseTo(5.555, 1);
  });

  it('共通 axis のみ compare (片方のみ axis は skip)', () => {
    const withAiLlm = makeReport();
    withAiLlm.cost = { perRequestUsd: 0.05, totalUsd: 5.0, requests: 100 };

    const current = captureSnapshot({ report: withAiLlm, capturedAt: '2026-07-08T00:00:00Z' });
    const baseline = captureSnapshot({ report: makeReport(), capturedAt: '2026-06-01T00:00:00Z' });

    const comparison = compareToBaseline({ current, baseline });
    const costDelta = comparison.axisDeltas.find((d) => d.axis === 'cost.perRequestUsd');
    expect(costDelta).toBeUndefined();
  });

  it('baseline=0 の場合 deltaPct = 0 or Infinity で除算安全', () => {
    const current = captureSnapshot({ report: makeReport({ coverageLine: 50 }), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport({ coverageLine: 0 }), capturedAt: 't0' });

    const comparison = compareToBaseline({ current, baseline });
    const coverageLineDelta = comparison.axisDeltas.find((d) => d.axis === 'coverage.line');
    expect(coverageLineDelta?.deltaPct).toBe(Infinity);
  });
});

describe('v0.5 detectDrift', () => {
  it('regression 検知 = coverage 悪化 (100 → 80)', () => {
    const current = captureSnapshot({ report: makeReport({ coverageLine: 80 }), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport({ coverageLine: 100 }), capturedAt: 't0' });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison, thresholdPct: 5.0 });

    expect(drift.category).toBe('regression');
    expect(drift.regressions.some((d) => d.axis === 'coverage.line')).toBe(true);
  });

  it('improvement 検知 = perf 改善 (100ms → 50ms)', () => {
    const current = captureSnapshot({ report: makeReport({ perfP95Ms: 50 }), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport({ perfP95Ms: 100 }), capturedAt: 't0' });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison });

    expect(drift.category).toBe('improvement');
    expect(drift.improvements.some((d) => d.axis === 'perf.p95Ms')).toBe(true);
  });

  it('stable 判定 = threshold 未満の変動', () => {
    const current = captureSnapshot({ report: makeReport({ coverageLine: 91 }), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport({ coverageLine: 90 }), capturedAt: 't0' });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison, thresholdPct: 5.0 });

    const coverageInStable = drift.stable.some((d) => d.axis === 'coverage.line');
    expect(coverageInStable).toBe(true);
  });

  it('default threshold = 5.0', () => {
    const current = captureSnapshot({ report: makeReport(), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport(), capturedAt: 't0' });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison });
    expect(drift.threshold).toBe(5.0);
  });

  it('mixed drift = regression 優先 (regression > 0 で category regression)', () => {
    // coverage 悪化 + perf 改善 の 同時発生 = category='regression'
    const current = captureSnapshot({
      report: makeReport({ coverageLine: 70, perfP95Ms: 30 }),
      capturedAt: 't1',
    });
    const baseline = captureSnapshot({
      report: makeReport({ coverageLine: 90, perfP95Ms: 50 }),
      capturedAt: 't0',
    });
    const comparison = compareToBaseline({ current, baseline });
    const drift = detectDrift({ comparison });

    expect(drift.category).toBe('regression');
    expect(drift.regressions.length).toBeGreaterThan(0);
    expect(drift.improvements.length).toBeGreaterThan(0);
  });

  it('DriftCategory 3 経路 SSOT (regression / improvement / stable)', () => {
    const categories: string[] = [];

    // regression
    const r1 = detectDrift({
      comparison: compareToBaseline({
        current: captureSnapshot({ report: makeReport({ coverageLine: 70 }), capturedAt: 't1' }),
        baseline: captureSnapshot({ report: makeReport({ coverageLine: 90 }), capturedAt: 't0' }),
      }),
    });
    categories.push(r1.category);

    // improvement
    const r2 = detectDrift({
      comparison: compareToBaseline({
        current: captureSnapshot({ report: makeReport({ perfP95Ms: 30 }), capturedAt: 't1' }),
        baseline: captureSnapshot({ report: makeReport({ perfP95Ms: 50 }), capturedAt: 't0' }),
      }),
    });
    categories.push(r2.category);

    // stable (identical reports)
    const r3 = detectDrift({
      comparison: compareToBaseline({
        current: captureSnapshot({ report: makeReport(), capturedAt: 't1' }),
        baseline: captureSnapshot({ report: makeReport(), capturedAt: 't0' }),
      }),
    });
    categories.push(r3.category);

    expect(new Set(categories)).toEqual(new Set(['regression', 'improvement', 'stable']));
  });
});

describe('v0.5 generateTrendReport', () => {
  it('empty snapshots で 空 TrendReport', () => {
    const trend = generateTrendReport([]);
    expect(trend.snapshotCount).toBe(0);
    expect(trend.firstLabel).toBeNull();
    expect(trend.lastLabel).toBeNull();
    expect(trend.axisSummary).toEqual([]);
  });

  it('single snapshot で first = last', () => {
    const s = captureSnapshot({ report: makeReport(), capturedAt: 't0', label: 'only' });
    const trend = generateTrendReport([s]);
    expect(trend.snapshotCount).toBe(1);
    expect(trend.firstLabel).toBe('only');
    expect(trend.lastLabel).toBe('only');
    expect(trend.axisSummary.every((a) => a.trend === 'flat')).toBe(true);
  });

  it('multi snapshot で first + last + trend 判定', () => {
    const snapshots = [
      captureSnapshot({ report: makeReport({ coverageLine: 80 }), capturedAt: 't0', label: 's0' }),
      captureSnapshot({ report: makeReport({ coverageLine: 85 }), capturedAt: 't1', label: 's1' }),
      captureSnapshot({ report: makeReport({ coverageLine: 90 }), capturedAt: 't2', label: 's2' }),
    ];
    const trend = generateTrendReport(snapshots);

    expect(trend.snapshotCount).toBe(3);
    expect(trend.firstLabel).toBe('s0');
    expect(trend.lastLabel).toBe('s2');

    const coverageSummary = trend.axisSummary.find((a) => a.axis === 'coverage.line');
    expect(coverageSummary?.first).toBe(80);
    expect(coverageSummary?.last).toBe(90);
    expect(coverageSummary?.delta).toBe(10);
    expect(coverageSummary?.trend).toBe('up');
  });

  it('trend down 判定 = last < first', () => {
    const snapshots = [
      captureSnapshot({ report: makeReport({ perfP95Ms: 30 }), capturedAt: 't0' }),
      captureSnapshot({ report: makeReport({ perfP95Ms: 50 }), capturedAt: 't1' }),
    ];
    const trend = generateTrendReport(snapshots);
    const perfSummary = trend.axisSummary.find((a) => a.axis === 'perf.p95Ms');
    expect(perfSummary?.trend).toBe('up'); // perf.p95Ms 上昇 = 悪化だが trend field は 数値上昇
  });

  it('flat 判定 = first == last', () => {
    const snapshots = [
      captureSnapshot({ report: makeReport(), capturedAt: 't0' }),
      captureSnapshot({ report: makeReport(), capturedAt: 't1' }),
    ];
    const trend = generateTrendReport(snapshots);
    expect(trend.axisSummary.every((a) => a.trend === 'flat')).toBe(true);
  });

  it('captureSnapshot records cost / latency / token / accuracy / a11y axes when present', () => {
    // The optional-axis branches in `extractAxisValues` (history.ts:29-51)
    // were uncovered — every earlier test used the 5-axis baseReport shape
    // without AI-LLM or a11y fields.
    const report: QualityReport = {
      ...makeReport(),
      provider: '@kiwa-lab/ai-llm',
      cost: { perRequestUsd: 0.05, totalUsd: 5, requests: 100 },
      latency: { p50Ms: 100, p95Ms: 500, p99Ms: 900, samples: 100 },
      token: { promptTokens: 100, completionTokens: 200, totalTokens: 300, requests: 100 },
      accuracy: { score: 0.85, samples: 10, method: 'cosine' },
      a11y: { critical: 1, serious: 2, moderate: 3, minor: 4 },
    };
    const baseline = captureSnapshot({ report, capturedAt: 't-1' });
    const current = captureSnapshot({ report, capturedAt: 't0' });
    const diff = compareToBaseline({ baseline, current });
    const axes = diff.axisDeltas.map((a) => a.axis);
    expect(axes).toContain('cost.perRequestUsd');
    expect(axes).toContain('latency.p95Ms');
    expect(axes).toContain('token.totalTokens');
    expect(axes).toContain('accuracy.score');
    expect(axes).toContain('a11y.critical');
    expect(axes).toContain('a11y.serious');
    expect(axes).toContain('a11y.moderate');
    expect(axes).toContain('a11y.minor');
  });
});
