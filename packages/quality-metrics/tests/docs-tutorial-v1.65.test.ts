/**
 * v1.65-3 docs 補強 — tutorial 125 code snippet 検証。
 * 43 milestone 連続 snippet validation streak = v1.23 → v1.65。 kiwa 史上最長記録更新継続。
 * systematic pattern 40 度目適用、 depth-5 pattern 3 例目確定 (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65)。
 */
import { describe, expect, it } from 'vitest';
import {
  captureSnapshot,
  compareToBaseline,
  detectDrift,
  generateTrendReport,
  type QualityReport,
} from '../src/index.js';

function makeReport(coverageLine = 90): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: coverageLine, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
  };
}

describe('tutorial 125 — captureSnapshot snippet', () => {
  it('MetricSnapshot に label + timestamp + report 保持', () => {
    const snapshot = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-07-08T00:00:00Z',
      label: 'release-v1.65',
    });
    expect(snapshot.label).toBe('release-v1.65');
    expect(snapshot.capturedAt).toBe('2026-07-08T00:00:00Z');
  });
});

describe('tutorial 125 — compareToBaseline snippet', () => {
  it('axis 別 delta 計算', () => {
    const current = captureSnapshot({ report: makeReport(95), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport(90), capturedAt: 't0' });
    const comparison = compareToBaseline({ current, baseline });
    const coverageDelta = comparison.axisDeltas.find((d) => d.axis === 'coverage.line');
    expect(coverageDelta?.delta).toBe(5);
  });
});

describe('tutorial 125 — detectDrift snippet', () => {
  it('threshold 判定で 3 category (regression/improvement/stable)', () => {
    const current = captureSnapshot({ report: makeReport(70), capturedAt: 't1' });
    const baseline = captureSnapshot({ report: makeReport(90), capturedAt: 't0' });
    const drift = detectDrift({
      comparison: compareToBaseline({ current, baseline }),
      thresholdPct: 5.0,
    });
    expect(drift.category).toBe('regression');
    expect(['regression', 'improvement', 'stable']).toContain(drift.category);
  });
});

describe('tutorial 125 — generateTrendReport snippet', () => {
  it('multi-snapshot trend 集計', () => {
    const snapshots = [
      captureSnapshot({ report: makeReport(80), capturedAt: 't0', label: 'v1.63' }),
      captureSnapshot({ report: makeReport(85), capturedAt: 't1', label: 'v1.64' }),
      captureSnapshot({ report: makeReport(90), capturedAt: 't2', label: 'v1.65' }),
    ];
    const trend = generateTrendReport(snapshots);
    expect(trend.snapshotCount).toBe(3);
    expect(trend.firstLabel).toBe('v1.63');
    expect(trend.lastLabel).toBe('v1.65');
    const coverageSummary = trend.axisSummary.find((a) => a.axis === 'coverage.line');
    expect(coverageSummary?.trend).toBe('up');
  });
});
