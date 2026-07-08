/**
 * v1.66-3 docs 補強 — tutorial 126 code snippet 検証。
 * 44 milestone 連続 snippet validation streak = v1.23 → v1.66。 kiwa 史上最長記録更新継続。
 * systematic pattern 41 度目適用、 depth-5 pattern 3 例目確定 実運用継続
 * (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 の 3 例安定化到達 = 「絶対的 rule」 昇格 signal 到達済 の 継続深化)。
 */
import { describe, expect, it } from 'vitest';
import {
  captureSnapshot,
  evaluateReleaseGate,
  type QualityReport,
} from '../src/index.js';

function makeReport(overrides?: {
  coverageLine?: number;
  perfP95Ms?: number;
}): QualityReport {
  return {
    provider: '@kiwa-test/example',
    version: '0.1.0',
    reportedAt: '2026-07-08T00:00:00Z',
    coverage: { line: overrides?.coverageLine ?? 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: overrides?.perfP95Ms ?? 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
  };
}

describe('tutorial 126 — Step 1 baseline snapshot snippet', () => {
  it('captureSnapshot で release-v1.65 baseline を record', () => {
    const baseline = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-06-01T00:00:00Z',
      label: 'release-v1.65',
    });
    expect(baseline.label).toBe('release-v1.65');
    expect(baseline.capturedAt).toBe('2026-06-01T00:00:00Z');
  });
});

describe('tutorial 126 — Step 2 driftEnabled + driftBaseline セット snippet', () => {
  it('evaluateReleaseGate に 3 field セット で axesEvaluated = 8', () => {
    const baseline = captureSnapshot({
      report: makeReport(),
      capturedAt: '2026-06-01T00:00:00Z',
      label: 'release-v1.65',
    });
    const verdict = evaluateReleaseGate(makeReport(), {}, {
      driftEnabled: true,
      driftBaseline: baseline,
      driftThresholdPct: 5.0,
    });
    expect(verdict.axesEvaluated).toBe(8);
    expect(verdict.passed).toBe(true);
  });
});

describe('tutorial 126 — Step 3 drift.* blocker 抽出 snippet', () => {
  it('coverage regression で drift.coverage.line blocker が filter で取得可', () => {
    const baseline = captureSnapshot({
      report: makeReport({ coverageLine: 100 }),
      capturedAt: '2026-06-01T00:00:00Z',
      label: 'baseline',
    });
    const verdict = evaluateReleaseGate(makeReport({ coverageLine: 80 }), {}, {
      driftEnabled: true,
      driftBaseline: baseline,
    });
    const driftBlockers = verdict.blockers.filter((b) => b.axis.startsWith('drift.'));
    expect(driftBlockers.length).toBeGreaterThan(0);
    expect(driftBlockers.find((b) => b.axis === 'drift.coverage.line')).toBeDefined();
  });
});

describe('tutorial 126 — Step 4 backward compat snippet', () => {
  it('context 省略で v0.5 挙動 に 戻る (axesEvaluated = 7)', () => {
    const legacyVerdict = evaluateReleaseGate(makeReport());
    expect(legacyVerdict.axesEvaluated).toBe(7);
    expect(legacyVerdict.passed).toBe(true);
  });

  it('driftEnabled: false で v0.5 挙動 に 戻る (drift lane 加算なし)', () => {
    const baseline = captureSnapshot({
      report: makeReport({ coverageLine: 100 }),
      capturedAt: 't0',
      label: 'baseline',
    });
    const verdict = evaluateReleaseGate(makeReport({ coverageLine: 80 }), {}, {
      driftBaseline: baseline,
      driftEnabled: false,
    });
    expect(verdict.axesEvaluated).toBe(7);
    expect(verdict.blockers.filter((b) => b.axis.startsWith('drift.'))).toEqual([]);
  });
});
