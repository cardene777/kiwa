/**
 * v2.1-3 docs 補強 — tutorial 128 code snippet 検証。
 * 47 milestone 連続 snippet validation streak = v1.23 → v2.1。 kiwa 史上最長記録更新継続。
 * systematic pattern 44 度目適用 (statistical inference variant)、 4 PR rhythm 復帰、
 * depth-5 実運用継続 pattern 3 例目 の compound 深化。
 */
import { describe, expect, it } from 'vitest';
import {
  captureSnapshot,
  evaluateReleaseGate,
  learnAdaptiveThreshold,
  pickThresholdForAxis,
  type QualityReport,
} from '../src/index.js';

function makeReport(overrides?: { coverageLine?: number }): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '2.1.0',
    reportedAt: '2026-07-08T00:00:00Z',
    coverage: { line: overrides?.coverageLine ?? 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
  };
}

describe('tutorial 128 — Step 1 rolling history snippet', () => {
  it('rolling window で snapshot を 10 個 保持', () => {
    let history = Array.from({ length: 10 }, (_, i) =>
      captureSnapshot({ report: makeReport(), capturedAt: `t${i}` }),
    );
    const newest = captureSnapshot({ report: makeReport(), capturedAt: 't10' });
    history = [...history, newest].slice(-10);
    expect(history).toHaveLength(10);
    expect(history[9]!.capturedAt).toBe('t10');
  });
});

describe('tutorial 128 — Step 2 adaptive threshold 学習 snippet', () => {
  it('learnAdaptiveThreshold で 5 snapshot から perAxis + aggregate 算出', () => {
    const history = [80, 82, 85, 87, 90].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const learned = learnAdaptiveThreshold({
      snapshots: history,
      stdevMultiplier: 2,
      minSampleCount: 3,
    });
    expect(learned.perAxis['coverage.line']).toBeDefined();
    expect(learned.aggregateThresholdPct).toBeGreaterThan(0);
  });
});

describe('tutorial 128 — Step 3 学習 threshold で evaluateReleaseGate snippet', () => {
  it('evaluateReleaseGate に learned.aggregateThresholdPct を injection', () => {
    const history = [90, 91, 92, 93, 94].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const learned = learnAdaptiveThreshold({ snapshots: history });
    const verdict = evaluateReleaseGate(makeReport({ coverageLine: 94 }), {}, {
      driftEnabled: true,
      driftBaseline: history[history.length - 1]!,
      driftThresholdPct: learned.aggregateThresholdPct,
    });
    expect(verdict.axesEvaluated).toBe(8); // drift lane +1
  });
});

describe('tutorial 128 — Step 4 pickThresholdForAxis snippet', () => {
  it('axis 個別 threshold + aggregate fallback', () => {
    const history = [80, 82, 85, 87, 90].map((v, i) =>
      captureSnapshot({ report: makeReport({ coverageLine: v }), capturedAt: `t${i}` }),
    );
    const learned = learnAdaptiveThreshold({ snapshots: history });
    const coverageThreshold = pickThresholdForAxis(learned, 'coverage.line');
    const fallback = pickThresholdForAxis(learned, 'nonexistent.axis');
    expect(coverageThreshold).toBe(learned.perAxis['coverage.line']!.recommendedThresholdPct);
    expect(fallback).toBe(learned.aggregateThresholdPct);
  });
});
