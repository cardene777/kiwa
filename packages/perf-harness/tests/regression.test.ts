import { describe, expect, it } from 'vitest';
import { buildMeasureResult, detectRegression } from '../src/index.js';

function makeResult(name: string, samples: number[]) {
  return buildMeasureResult(name, samples.length, 0, samples);
}

describe('detectRegression (bootstrap CI on p95)', () => {
  it('T-PH-R-001 flags a 20%+ p95 slowdown as regressed', () => {
    // 大きめの sample を使い bootstrap CI が締まるようにする。
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 3) * 0.05));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 13 + (i % 3) * 0.05));
    const result = detectRegression({ current, baseline });

    expect(result.regressed).toBe(true);
    expect(result.deltaPct).toBeGreaterThanOrEqual(0.2);
    expect(result.verdict).toBe('regressed');
    expect(result.significant).toBe(true);
    expect(result.ci.lower).toBeGreaterThan(0);
  });

  it('T-PH-R-002 flags clear 30% and 50% slowdowns when significant', () => {
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 4) * 0.1));
    const thirty = makeResult('reply', Array.from({ length: 40 }, (_, i) => 13 + (i % 4) * 0.1));
    const fifty = makeResult('reply', Array.from({ length: 40 }, (_, i) => 15 + (i % 4) * 0.1));

    const thirtyResult = detectRegression({ current: thirty, baseline });
    const fiftyResult = detectRegression({ current: fifty, baseline });

    expect(thirtyResult.verdict).toBe('regressed');
    expect(thirtyResult.significant).toBe(true);
    expect(fiftyResult.verdict).toBe('regressed');
    // fifty は more strong signal、 CI 下限も上位。
    expect(fiftyResult.ci.lower).toBeGreaterThan(thirtyResult.ci.lower);
  });

  it('T-PH-R-003 reports improved when p95 drops past the threshold', () => {
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 3) * 0.05));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 7 + (i % 3) * 0.05));
    const result = detectRegression({ current, baseline });

    expect(result.verdict).toBe('improved');
    expect(result.regressed).toBe(false);
    expect(result.deltaPct).toBeLessThan(-0.2);
    expect(result.ci.upper).toBeLessThan(0);
  });

  it('T-PH-R-004 threshold 超過してない差は stable (deltaPct < threshold)', () => {
    // deltaPct 3% は 20% threshold 未満 = 統計的に有意でも regressed にならない。
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 5) * 0.02));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10.3 + (i % 5) * 0.02));
    const result = detectRegression({ current, baseline, threshold: 0.2 });

    expect(result.deltaPct).toBeLessThan(0.2);
    expect(result.verdict).toBe('stable');
    expect(result.regressed).toBe(false);
  });

  it('T-PH-R-005 stays stable for tiny sample counts (<2)', () => {
    const baseline = makeResult('reply', [10]);
    const current = makeResult('reply', [20]);
    const result = detectRegression({ current, baseline, threshold: 0.2 });

    expect(result.significant).toBe(false);
    expect(result.ci).toEqual({ lower: 0, upper: 0 });
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-006 both baseline and current p95 = 0 gives deltaPct = 0 (not Infinity)', () => {
    const baseline = makeResult('reply', [0, 0, 0, 0, 0]);
    const current = makeResult('reply', [0, 0, 0, 0, 0]);
    const result = detectRegression({ current, baseline });
    expect(result.deltaPct).toBe(0);
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-007 empty-samples baseline は退化 CI で stable 判定', () => {
    const baseline = makeResult('reply', []);
    const current = makeResult('reply', [10, 11, 12]);
    const result = detectRegression({ current, baseline });
    expect(result.verdict).toBe('stable');
    expect(result.significant).toBe(false);
  });

  it('T-PH-R-008 identical repeated samples produce CI ≈ 0 → stable', () => {
    const baseline = makeResult('reply', [10, 10, 10, 10, 10]);
    const current = makeResult('reply', [10, 10, 10, 10, 10]);
    const result = detectRegression({ current, baseline });
    expect(result.ci.lower).toBe(0);
    expect(result.ci.upper).toBe(0);
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-010 差が小さすぎる悪化は回帰と判定しない', () => {
    // 0.03ms → 0.04ms は 33% 悪化だが実害がない。相対比だけで判定すると
    // 値が小さい op ほど揺らぎで落ちる。
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]);
    const result = detectRegression({ current, baseline });
    expect(result.deltaPct).toBeGreaterThan(0.2);
    expect(result.significant).toBe(true);
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-011 下限を超える悪化は従来どおり回帰と判定する', () => {
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const current = makeResult('reply', [13, 13, 13, 13, 13, 13]);
    const result = detectRegression({ current, baseline });
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-012 下限は minDeltaMs で調整できる', () => {
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]);
    const result = detectRegression({ current, baseline, minDeltaMs: 0 });
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-009 baseline.p95 = 0 かつ current.p95 > 0 = Infinity delta', () => {
    // Bootstrap CI は current 側 sample から p95 > 0 を復元、 baseline は 0 になるため
    // CI 下限は正の値、 deltaPct は Infinity。 verdict は significant + threshold 超過。
    const baseline = makeResult('reply', [0, 0, 0, 0, 0, 0]);
    const current = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const result = detectRegression({ current, baseline });
    expect(result.deltaPct).toBe(Number.POSITIVE_INFINITY);
    expect(result.verdict).toBe('regressed');
  });
});
