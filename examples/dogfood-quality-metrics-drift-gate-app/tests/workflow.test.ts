import { describe, expect, it } from 'vitest';
import type { QualityReport } from '@kiwa/quality-metrics';
import {
  buildBaselineSnapshot,
  evaluateWithDriftGate,
  explainDriftBlockers,
  tryReleaseWithoutDrift,
  verifyReleaseWithDrift,
} from '../src/workflow.js';

function makeReport(overrides?: {
  coverageLine?: number;
  coverageBranch?: number;
  perfP95Ms?: number;
  mutationKillRate?: number;
  behaviorTests?: number;
}): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '0.1.0',
    reportedAt: '2026-07-08T00:00:00Z',
    coverage: {
      line: overrides?.coverageLine ?? 90,
      branch: overrides?.coverageBranch ?? 82,
      function: 95,
    },
    testCount: {
      behavior: overrides?.behaviorTests ?? 20,
      integration: 5,
      e2e: 2,
      total: (overrides?.behaviorTests ?? 20) + 5 + 2,
    },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: overrides?.perfP95Ms ?? 50, p99Ms: 80, samples: 100 },
    mutation: {
      mutations: 40,
      killed: 28,
      survived: 12,
      killRate: overrides?.mutationKillRate ?? 70,
    },
  };
}

describe('dogfood-quality-metrics-drift-gate-app (v1.66-2、 depth-5 pattern 3 例目確定 実運用継続)', () => {
  it('Pattern 1: evaluateWithDriftGate — 標準 経路 で driftEnabled+driftBaseline セット、 stable release pass', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport(),
      timestamp: '2026-06-01T00:00:00Z',
      label: 'baseline-v1.65',
    });
    const verdict = evaluateWithDriftGate({
      current: makeReport(),
      baseline,
    });
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8); // base 7 + drift lane 1
  });

  it('Pattern 1: evaluateWithDriftGate — coverage regression で drift.coverage.line blocker 発火', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport({ coverageLine: 100 }),
      timestamp: '2026-06-01T00:00:00Z',
      label: 'baseline',
    });
    const verdict = evaluateWithDriftGate({
      current: makeReport({ coverageLine: 80 }),
      baseline,
      thresholdPct: 5.0,
    });
    expect(verdict.passed).toBe(false);
    const driftBlocker = verdict.blockers.find((b) => b.axis === 'drift.coverage.line');
    expect(driftBlocker).toBeDefined();
    expect(driftBlocker?.threshold).toBe(-5.0);
  });

  it('Pattern 1: evaluateWithDriftGate — extraContext で mutation.tier 統合 (drift + tier 二重 lane)', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport(),
      timestamp: 't0',
      label: 'baseline',
    });
    const verdict = evaluateWithDriftGate({
      current: makeReport(),
      baseline,
      extraContext: { mutationTier: 'framework' }, // Framework 70 % floor
    });
    expect(verdict.axesEvaluated).toBe(9); // base 7 + drift 1 + mutation.tier 1
    expect(verdict.passed).toBe(true); // killRate 70 = Framework tier ちょうど pass
  });

  it('Pattern 2: verifyReleaseWithDrift — baseline あり で usedDriftGate=true', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport(),
      timestamp: 't0',
      label: 'baseline',
    });
    const { verdict, usedDriftGate } = verifyReleaseWithDrift({
      current: makeReport(),
      baseline,
    });
    expect(usedDriftGate).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('Pattern 2: verifyReleaseWithDrift — baseline なし (初回 release) で usedDriftGate=false + v0.5 挙動', () => {
    const { verdict, usedDriftGate } = verifyReleaseWithDrift({
      current: makeReport(),
    });
    expect(usedDriftGate).toBe(false);
    expect(verdict.axesEvaluated).toBe(7); // v0.5 まで の base 7 axis のみ
    expect(verdict.passed).toBe(true);
  });

  it('Pattern 2: verifyReleaseWithDrift — thresholdPct 上書き で 厳格 判定', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport({ coverageLine: 100 }),
      timestamp: 't0',
      label: 'baseline',
    });
    // 100 → 96 = -4% で default 5% では stable、 厳格 3% では regression
    const { verdict: strict } = verifyReleaseWithDrift({
      current: makeReport({ coverageLine: 96 }),
      baseline,
      thresholdPct: 3.0,
    });
    expect(strict.passed).toBe(false);
    const { verdict: loose } = verifyReleaseWithDrift({
      current: makeReport({ coverageLine: 96 }),
      baseline,
      thresholdPct: 5.0,
    });
    expect(loose.passed).toBe(true);
  });

  it('Pattern 3: explainDriftBlockers — drift.* blocker のみ 抽出 (既存 axis fail は 除外)', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport({ coverageLine: 100, coverageBranch: 100 }),
      timestamp: 't0',
      label: 'baseline',
    });
    const verdict = evaluateWithDriftGate({
      current: makeReport({ coverageLine: 60, coverageBranch: 60 }), // 既存 coverage.line 85 未満 + drift 二重 fail
      baseline,
    });
    const drifts = explainDriftBlockers(verdict);
    // drift.coverage.line + drift.coverage.branch の 2 件、 coverage.line (既存 axis) は 除外
    const axes = drifts.map((d) => d.axis);
    expect(axes).toContain('drift.coverage.line');
    expect(axes).toContain('drift.coverage.branch');
    expect(axes.every((a) => a.startsWith('drift.'))).toBe(true);
    // message に threshold + delta が 含まれる (actionable 出力)
    expect(drifts[0]?.message).toContain('regression detected');
    expect(drifts[0]?.message).toContain('threshold');
  });

  it('Pattern 3: explainDriftBlockers — drift 発火なし で 空配列', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport(),
      timestamp: 't0',
      label: 'baseline',
    });
    const verdict = evaluateWithDriftGate({
      current: makeReport(),
      baseline,
    });
    expect(explainDriftBlockers(verdict)).toEqual([]);
  });

  it('Pattern 4: tryReleaseWithoutDrift — driftEnabled=false で v0.5 挙動 に 戻る (backward compat verify)', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport({ coverageLine: 100 }),
      timestamp: 't0',
      label: 'baseline',
    });
    const { verdict, driftBypassed } = tryReleaseWithoutDrift({
      current: makeReport({ coverageLine: 80 }), // 100 → 80 で -20% regression だが drift off
      baseline,
    });
    expect(driftBypassed).toBe(true);
    expect(verdict.axesEvaluated).toBe(7); // drift lane 加算なし
    expect(verdict.blockers.filter((b) => b.axis.startsWith('drift.'))).toEqual([]);
  });

  it('Pattern 4: tryReleaseWithoutDrift — 既存 axis fail は drift off でも 発火 (coverage.line 60 % 未満)', () => {
    const baseline = buildBaselineSnapshot({
      report: makeReport(),
      timestamp: 't0',
      label: 'baseline',
    });
    const { verdict, driftBypassed } = tryReleaseWithoutDrift({
      current: makeReport({ coverageLine: 60 }),
      baseline,
    });
    expect(verdict.passed).toBe(false); // 既存 coverage.line axis fail
    expect(driftBypassed).toBe(true); // drift.* は 一切 発火せず
    expect(verdict.blockers.find((b) => b.axis === 'coverage.line')).toBeDefined();
  });

  it('4 pattern 統合 workflow — dogfood consumer が buildBaseline → verify → explain → fallback を chain', () => {
    // Step 1: buildBaselineSnapshot で release-v1.65 を record
    const baseline = buildBaselineSnapshot({
      report: makeReport({ coverageLine: 95, perfP95Ms: 40 }),
      timestamp: '2026-06-01T00:00:00Z',
      label: 'release-v1.65',
    });

    // Step 2: verifyReleaseWithDrift で v1.66 candidate を check
    const { verdict: v1, usedDriftGate } = verifyReleaseWithDrift({
      current: makeReport({ coverageLine: 88, perfP95Ms: 60 }), // 95 → 88 = -7.4% + perf 40 → 60 = +50% 悪化
      baseline,
      thresholdPct: 5.0,
    });
    expect(usedDriftGate).toBe(true);
    expect(v1.passed).toBe(false);

    // Step 3: explainDriftBlockers で PR コメント 生成
    const drifts = explainDriftBlockers(v1);
    expect(drifts.length).toBeGreaterThanOrEqual(2); // coverage.line + perf.p95Ms

    // Step 4: tryReleaseWithoutDrift で 一時 bypass (hotfix release 経路)
    const { verdict: v2, driftBypassed } = tryReleaseWithoutDrift({
      current: makeReport({ coverageLine: 88, perfP95Ms: 60 }),
      baseline,
    });
    expect(driftBypassed).toBe(true);
    expect(v2.passed).toBe(true); // 既存 axis は 全 pass、 drift bypass で release 可
  });
});
