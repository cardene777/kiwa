import { describe, expect, it } from 'vitest';
import type { MetricSnapshot, QualityReport } from '@kiwa/quality-metrics';
import {
  collectRolling,
  evaluateWithLearnedThreshold,
  explainLearnedGate,
  learnFromHistory,
  snapshotForRelease,
} from '../src/workflow.js';

function makeReport(overrides?: {
  coverageLine?: number;
  perfP95Ms?: number;
}): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '2.1.0',
    reportedAt: '2026-07-08T00:00:00Z',
    coverage: { line: overrides?.coverageLine ?? 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: overrides?.perfP95Ms ?? 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
  };
}

describe('dogfood-quality-metrics-adaptive-threshold-app (v2.1-2、 statistical inference 実運用)', () => {
  it('Pattern 1: collectRolling — window 内 は 全 保持', () => {
    const s1 = snapshotForRelease({ report: makeReport(), timestamp: 't0', label: 'r0' });
    const s2 = snapshotForRelease({ report: makeReport(), timestamp: 't1', label: 'r1' });
    const next = collectRolling({ history: [s1], newSnapshot: s2, windowSize: 10 });
    expect(next).toHaveLength(2);
  });

  it('Pattern 1: collectRolling — window 超過 で 最古 削除', () => {
    const history = Array.from({ length: 10 }, (_, i) =>
      snapshotForRelease({ report: makeReport(), timestamp: `t${i}`, label: `r${i}` }),
    );
    const newest = snapshotForRelease({ report: makeReport(), timestamp: 't10', label: 'r10' });
    const next = collectRolling({ history, newSnapshot: newest, windowSize: 10 });
    expect(next).toHaveLength(10);
    expect(next[0]!.label).toBe('r1');
    expect(next[9]!.label).toBe('r10');
  });

  it('Pattern 2: learnFromHistory — default (k=2, minSample=3) で 標準学習', () => {
    const history = [80, 82, 85, 87, 90].map((v, i) =>
      snapshotForRelease({ report: makeReport({ coverageLine: v }), timestamp: `t${i}`, label: `r${i}` }),
    );
    const report = learnFromHistory({ history });
    expect(report.usedSnapshotCount).toBe(5);
    expect(report.perAxis['coverage.line']).toBeDefined();
    expect(report.aggregateThresholdPct).toBeGreaterThan(0);
  });

  it('Pattern 2: learnFromHistory — stdevMultiplier=3 で 保守的 threshold', () => {
    const history = [50, 55, 45, 60, 40].map((v, i) =>
      snapshotForRelease({ report: makeReport({ perfP95Ms: v }), timestamp: `t${i}`, label: `r${i}` }),
    );
    const r2 = learnFromHistory({ history, stdevMultiplier: 2 });
    const r3 = learnFromHistory({ history, stdevMultiplier: 3 });
    expect(r3.perAxis['perf.p95Ms']!.recommendedThresholdPct).toBeGreaterThan(
      r2.perAxis['perf.p95Ms']!.recommendedThresholdPct,
    );
  });

  it('Pattern 3: evaluateWithLearnedThreshold — history 空 で v0.5 挙動 fallback', () => {
    const { verdict, usedThresholdPct } = evaluateWithLearnedThreshold({
      current: makeReport(),
      history: [],
      learned: { perAxis: {}, aggregateThresholdPct: 0, usedSnapshotCount: 0 },
    });
    expect(verdict.axesEvaluated).toBe(7);
    expect(usedThresholdPct).toBe(0);
  });

  it('Pattern 3: evaluateWithLearnedThreshold — 学習 threshold で release evaluate', () => {
    const history = [90, 91, 92, 93, 94].map((v, i) =>
      snapshotForRelease({ report: makeReport({ coverageLine: v }), timestamp: `t${i}`, label: `r${i}` }),
    );
    const learned = learnFromHistory({ history });
    const { verdict, usedThresholdPct } = evaluateWithLearnedThreshold({
      current: makeReport({ coverageLine: 94 }),
      history,
      learned,
    });
    expect(usedThresholdPct).toBe(learned.aggregateThresholdPct);
    expect(verdict.axesEvaluated).toBe(8); // drift lane +1
  });

  it('Pattern 3: evaluateWithLearnedThreshold — 学習外 の 急落 で drift blocker 発火', () => {
    const history = [95, 95, 95, 95, 95].map((v, i) =>
      snapshotForRelease({ report: makeReport({ coverageLine: v }), timestamp: `t${i}`, label: `r${i}` }),
    );
    const learned = learnFromHistory({ history });
    // stable history = threshold 極小、 急落 で 確実に drift 発火
    const { verdict } = evaluateWithLearnedThreshold({
      current: makeReport({ coverageLine: 70 }),
      history,
      learned,
    });
    const drift = verdict.blockers.find((b) => b.axis === 'drift.coverage.line');
    expect(drift).toBeDefined();
  });

  it('Pattern 4: explainLearnedGate — drift blocker を axis 別 threshold と併記', () => {
    const history = [95, 95, 95, 95, 95].map((v, i) =>
      snapshotForRelease({ report: makeReport({ coverageLine: v }), timestamp: `t${i}`, label: `r${i}` }),
    );
    const learned = learnFromHistory({ history });
    const { verdict } = evaluateWithLearnedThreshold({
      current: makeReport({ coverageLine: 70 }),
      history,
      learned,
    });
    const explained = explainLearnedGate({ verdict, learned });
    expect(explained.length).toBeGreaterThan(0);
    expect(explained[0]?.message).toContain('learned-gate breach');
    expect(explained[0]?.message).toContain('threshold');
  });

  it('Pattern 4: explainLearnedGate — drift なし で 空配列', () => {
    const history = [90, 91, 92, 93, 94].map((v, i) =>
      snapshotForRelease({ report: makeReport({ coverageLine: v }), timestamp: `t${i}`, label: `r${i}` }),
    );
    const learned = learnFromHistory({ history });
    const { verdict } = evaluateWithLearnedThreshold({
      current: makeReport({ coverageLine: 95 }),
      history,
      learned,
    });
    expect(explainLearnedGate({ verdict, learned })).toEqual([]);
  });

  it('4 pattern 統合 workflow — rolling collect → learn → evaluate → explain chain', () => {
    // Step 1: 過去 5 release の history を rolling で 保持
    let history: MetricSnapshot[] = [];
    for (let i = 0; i < 5; i++) {
      const snap = snapshotForRelease({
        report: makeReport({ coverageLine: 90 + i }),
        timestamp: `t${i}`,
        label: `release-${i}`,
      });
      history = collectRolling({ history, newSnapshot: snap, windowSize: 10 });
    }
    expect(history).toHaveLength(5);

    // Step 2: 学習
    const learned = learnFromHistory({ history });
    expect(learned.perAxis['coverage.line']).toBeDefined();

    // Step 3: 新 release を 学習 threshold で 評価
    const { verdict, usedThresholdPct } = evaluateWithLearnedThreshold({
      current: makeReport({ coverageLine: 96 }),
      history,
      learned,
    });
    expect(usedThresholdPct).toBe(learned.aggregateThresholdPct);
    expect(verdict.axesEvaluated).toBe(8);

    // Step 4: drift blocker が あれば PR コメント 生成
    const explained = explainLearnedGate({ verdict, learned });
    for (const item of explained) {
      expect(item.message).toContain('learned-gate breach');
    }
  });
});
