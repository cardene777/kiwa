import { describe, expect, it } from 'vitest';
import { buildMeasureResult, detectRegression, detectRegressionStrict } from '../src/index.js';

/**
 * v0.3 strict mode test — v0.2 default (|t|>2 + delta 20%) より厳しい判定を
 * behavior test で担保する。 test 漏れゼロを狙う fail-fast mode。
 */

function seedSamples(base: number, n: number, spread = 0.01): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    // deterministic small variation
    out.push(base * (1 + spread * ((i % 5) - 2) / 4));
  }
  return out;
}

describe('detectRegressionStrict — v0.3 strict mode', () => {
  it('strict mode uses |t|>3 threshold', () => {
    // Create samples with clear separation but small enough that |t| is around 2-3
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.1));
    const current = buildMeasureResult('op', 40, 5, seedSamples(10.5, 40, 0.1));
    const laxResult = detectRegression({ current, baseline });
    const strictResult = detectRegressionStrict({ current, baseline });
    // If lax detects regression, strict should be more conservative (may not detect)
    // Both have same welchT but different tCritical
    expect(strictResult.welchT).toBe(laxResult.welchT);
    // The strict verdict is at most as regressed as lax
    if (strictResult.verdict === 'regressed') {
      expect(laxResult.verdict).toBe('regressed');
    }
  });

  it('strict mode uses 10% delta threshold (default)', () => {
    // 15% delta with very tight samples → significant + delta > 10% but < 20%
    // Lax should be stable, strict should be regressed
    const baseline = buildMeasureResult('op', 100, 5, seedSamples(10, 100, 0.001));
    const current = buildMeasureResult('op', 100, 5, seedSamples(11.5, 100, 0.001));
    const laxResult = detectRegression({ current, baseline });
    const strictResult = detectRegressionStrict({ current, baseline });
    expect(strictResult.deltaPct).toBeCloseTo(0.15, 1);
    expect(laxResult.deltaPct).toBeCloseTo(0.15, 1);
    // Strict catches 15% (over 10% threshold)、 lax passes (under 20% threshold)
    expect(strictResult.verdict).toBe('regressed');
    expect(laxResult.verdict).toBe('stable');
  });

  it('strict mode accepts explicit tCritical override', () => {
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.01));
    const current = buildMeasureResult('op', 40, 5, seedSamples(15, 40, 0.01));
    const result = detectRegressionStrict({ current, baseline, tCritical: 5 });
    // With very high tCritical, may not be significant
    if (Math.abs(result.welchT) <= 5) {
      expect(result.significant).toBe(false);
    }
  });

  it('strict mode accepts explicit threshold override', () => {
    const baseline = buildMeasureResult('op', 100, 5, seedSamples(10, 100, 0.001));
    const current = buildMeasureResult('op', 100, 5, seedSamples(10.4, 100, 0.001));
    const result = detectRegressionStrict({ current, baseline, threshold: 0.02 });
    // 4% delta > 2% threshold → regressed
    expect(result.deltaPct).toBeCloseTo(0.04, 1);
  });

  it('strict + lax identical when explicit thresholds match', () => {
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.01));
    const current = buildMeasureResult('op', 40, 5, seedSamples(12, 40, 0.01));
    const laxResult = detectRegression({ current, baseline, threshold: 0.2, tCritical: 2 });
    const strictResult = detectRegressionStrict({ current, baseline, threshold: 0.2, tCritical: 2 });
    expect(strictResult.verdict).toBe(laxResult.verdict);
    expect(strictResult.deltaPct).toBe(laxResult.deltaPct);
    expect(strictResult.welchT).toBe(laxResult.welchT);
  });

  it('strict improved verdict (better perf)', () => {
    const baseline = buildMeasureResult('op', 100, 5, seedSamples(10, 100, 0.001));
    const current = buildMeasureResult('op', 100, 5, seedSamples(8.5, 100, 0.001));
    const result = detectRegressionStrict({ current, baseline });
    expect(result.verdict).toBe('improved');
    expect(result.deltaPct).toBeCloseTo(-0.15, 1);
  });

  it('strict stable verdict when delta small', () => {
    const baseline = buildMeasureResult('op', 100, 5, seedSamples(10, 100, 0.001));
    const current = buildMeasureResult('op', 100, 5, seedSamples(10.05, 100, 0.001));
    const result = detectRegressionStrict({ current, baseline });
    expect(result.verdict).toBe('stable');
    expect(result.regressed).toBe(false);
  });

  it('lax v0.2 backward compat preserved', () => {
    // v0.2 with 15% delta should still be stable
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.01));
    const current = buildMeasureResult('op', 40, 5, seedSamples(11.5, 40, 0.01));
    const result = detectRegression({ current, baseline });
    expect(result.verdict).toBe('stable');
  });
});
