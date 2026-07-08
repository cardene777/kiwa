import { describe, expect, it } from 'vitest';
import {
  captureSnapshot,
  learnAdaptiveThreshold,
  pickThresholdForAxis,
  type QualityReport,
} from '../src/index.js';

function makeReport(overrides?: {
  coverageLine?: number;
  perfP95Ms?: number;
  mutationKillRate?: number;
}): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '2.0.0',
    reportedAt: '2026-07-08T00:00:00Z',
    coverage: { line: overrides?.coverageLine ?? 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: overrides?.perfP95Ms ?? 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: overrides?.mutationKillRate ?? 70 },
  };
}

describe('v2.1 learnAdaptiveThreshold — 統計的異常検知 の 基本 SSOT', () => {
  it('T-QM-AT-001 snapshots < 2 で 空 perAxis + aggregate=0', () => {
    const report = learnAdaptiveThreshold({ snapshots: [] });
    expect(report.perAxis).toEqual({});
    expect(report.aggregateThresholdPct).toBe(0);
    expect(report.usedSnapshotCount).toBe(0);
  });

  it('T-QM-AT-002 minSampleCount 未満 axis は 除外', () => {
    const s = [
      captureSnapshot({ report: makeReport(), capturedAt: 't0' }),
      captureSnapshot({ report: makeReport({ coverageLine: 91 }), capturedAt: 't1' }),
    ];
    // consecutive delta 1 個 のみ、 default minSampleCount=3 未満で 全 axis 除外
    const report = learnAdaptiveThreshold({ snapshots: s });
    expect(Object.keys(report.perAxis)).toHaveLength(0);
    expect(report.aggregateThresholdPct).toBe(0);
  });

  it('T-QM-AT-003 stable snapshot 列 (全 axis 同値) で recommended = 0', () => {
    const s = Array.from({ length: 5 }, (_, i) =>
      captureSnapshot({ report: makeReport(), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    expect(report.perAxis['coverage.line']?.meanDeltaPct).toBe(0);
    expect(report.perAxis['coverage.line']?.stdevDeltaPct).toBe(0);
    expect(report.perAxis['coverage.line']?.recommendedThresholdPct).toBe(0);
  });

  it('T-QM-AT-004 上昇 trend で mean > 0、 recommended = |mean| + 2*stdev', () => {
    const s = [80, 82, 84, 86, 88].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    const t = report.perAxis['coverage.line']!;
    expect(t.meanDeltaPct).toBeGreaterThan(0);
    expect(t.sampleCount).toBe(4);
    // stdev = 0 の 一定率上昇 でも |mean| 分 の threshold が引かれる
    expect(t.recommendedThresholdPct).toBeGreaterThan(0);
  });

  it('T-QM-AT-005 volatile axis (perf.p95Ms 大幅変動) の stdev > 安定 axis stdev', () => {
    const s = [50, 80, 30, 100, 20].map((v, i) =>
      captureSnapshot({ report: makeReport({ perfP95Ms: v }), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    // coverage.line は 全期間 一定 = stdev 0、 perf.p95Ms は 大幅変動 = stdev >> 0
    expect(report.perAxis['coverage.line']?.stdevDeltaPct).toBe(0);
    expect(report.perAxis['perf.p95Ms']?.stdevDeltaPct).toBeGreaterThan(10);
  });

  it('T-QM-AT-006 stdevMultiplier=3 で threshold が 2 の 場合より 広い', () => {
    const s = [50, 60, 40, 70, 30].map((v, i) =>
      captureSnapshot({ report: makeReport({ perfP95Ms: v }), capturedAt: `t${i}` }),
    );
    const r2 = learnAdaptiveThreshold({ snapshots: s, stdevMultiplier: 2 });
    const r3 = learnAdaptiveThreshold({ snapshots: s, stdevMultiplier: 3 });
    expect(r3.perAxis['perf.p95Ms']!.recommendedThresholdPct).toBeGreaterThan(
      r2.perAxis['perf.p95Ms']!.recommendedThresholdPct,
    );
  });

  it('T-QM-AT-007 baseline=0 の deltaPct=Infinity は sample から 除外', () => {
    const s = [
      captureSnapshot({ report: makeReport({ perfP95Ms: 0 }), capturedAt: 't0' }),
      captureSnapshot({ report: makeReport({ perfP95Ms: 50 }), capturedAt: 't1' }),
      captureSnapshot({ report: makeReport({ perfP95Ms: 55 }), capturedAt: 't2' }),
      captureSnapshot({ report: makeReport({ perfP95Ms: 60 }), capturedAt: 't3' }),
      captureSnapshot({ report: makeReport({ perfP95Ms: 58 }), capturedAt: 't4' }),
    ];
    const report = learnAdaptiveThreshold({ snapshots: s });
    // t0→t1 で baseline=0 → Infinity で 除外、 有効 sample = 3 (t1→t2, t2→t3, t3→t4)
    expect(report.perAxis['perf.p95Ms']?.sampleCount).toBe(3);
    expect(Number.isFinite(report.perAxis['perf.p95Ms']!.recommendedThresholdPct)).toBe(true);
  });

  it('T-QM-AT-008 minSampleCount カスタム値 で filter 制御', () => {
    const s = [80, 82, 84, 86].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    // sample = 3、 minSample=4 で 除外
    const r4 = learnAdaptiveThreshold({ snapshots: s, minSampleCount: 4 });
    expect(r4.perAxis['coverage.line']).toBeUndefined();
    // minSample=3 で 含まれる
    const r3 = learnAdaptiveThreshold({ snapshots: s, minSampleCount: 3 });
    expect(r3.perAxis['coverage.line']).toBeDefined();
  });

  it('T-QM-AT-009 aggregateThresholdPct = 全 perAxis threshold の 平均', () => {
    const s = [50, 55, 60, 65, 70].map((v, i) =>
      captureSnapshot({ report: makeReport({ perfP95Ms: v }), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    const thresholds = Object.values(report.perAxis).map((t) => t.recommendedThresholdPct);
    const expectedAvg = thresholds.reduce((a, b) => a + b, 0) / thresholds.length;
    expect(report.aggregateThresholdPct).toBeCloseTo(expectedAvg, 5);
  });
});

describe('v2.1 pickThresholdForAxis — axis 別 fallback SSOT', () => {
  it('T-QM-AT-010 axis 名 が perAxis に存在 → 個別 threshold', () => {
    const s = [80, 85, 90, 95].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    expect(pickThresholdForAxis(report, 'coverage.line')).toBe(
      report.perAxis['coverage.line']!.recommendedThresholdPct,
    );
  });

  it('T-QM-AT-011 axis 名 が perAxis に不在 → aggregate fallback', () => {
    const s = [80, 85, 90, 95].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    expect(pickThresholdForAxis(report, 'nonexistent.axis')).toBe(report.aggregateThresholdPct);
  });

  it('T-QM-AT-012 axis 名 undefined → aggregate 直接返却', () => {
    const s = [80, 85, 90, 95].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const report = learnAdaptiveThreshold({ snapshots: s });
    expect(pickThresholdForAxis(report)).toBe(report.aggregateThresholdPct);
  });
});

describe('v2.1 shape 契約 preserving 絶対維持', () => {
  it('T-QM-AT-013 QualityReport / MetricSnapshot / DriftDetection は 触っていない (v0.5-v0.6 API 変更 0)', () => {
    // v2.1 は 新規 file の 追加 のみ、 既存 API は 触らない
    const s = captureSnapshot({ report: makeReport(), capturedAt: 't0' });
    expect(s).toHaveProperty('capturedAt');
    expect(s).toHaveProperty('label');
    expect(s).toHaveProperty('report');
    expect(Object.keys(s.report)).toContain('coverage');
    expect(Object.keys(s.report)).toContain('mutation');
  });
});
