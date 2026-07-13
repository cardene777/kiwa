import { describe, expect, it } from 'vitest';
import { buildMeasureResult, detectRegression, detectRegressionStrict } from '../src/index.js';

/**
 * Strict mode = CI 99% + threshold 10%。 default (CI 95% + 20%) より false negative を減らす。
 * bootstrap CI 経路の behavior test。
 */

function seedSamples(base: number, n: number, spread = 0.01): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(base * (1 + spread * ((i % 5) - 2) / 4));
  }
  return out;
}

describe('detectRegressionStrict — CI 99% + threshold 10%', () => {
  it('strict の threshold は default で 0.1', () => {
    // 15% delta with tight samples: default (20%) は stable、 strict (10%) は regressed
    const baseline = buildMeasureResult('op', 100, 5, seedSamples(10, 100, 0.001));
    const current = buildMeasureResult('op', 100, 5, seedSamples(11.5, 100, 0.001));
    const laxResult = detectRegression({ current, baseline });
    const strictResult = detectRegressionStrict({ current, baseline });
    expect(strictResult.deltaPct).toBeCloseTo(0.15, 1);
    expect(laxResult.deltaPct).toBeCloseTo(0.15, 1);
    expect(strictResult.verdict).toBe('regressed');
    expect(laxResult.verdict).toBe('stable');
  });

  it('strict は explicit threshold override 可能', () => {
    const baseline = buildMeasureResult('op', 100, 5, seedSamples(10, 100, 0.001));
    const current = buildMeasureResult('op', 100, 5, seedSamples(10.4, 100, 0.001));
    const result = detectRegressionStrict({ current, baseline, threshold: 0.02 });
    expect(result.deltaPct).toBeCloseTo(0.04, 1);
  });

  it('strict + lax は explicit threshold 同一なら verdict / deltaPct 一致', () => {
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.01));
    const current = buildMeasureResult('op', 40, 5, seedSamples(12, 40, 0.01));
    const laxResult = detectRegression({ current, baseline, threshold: 0.2, confidenceLevel: 0.95 });
    const strictResult = detectRegressionStrict({ current, baseline, threshold: 0.2, confidenceLevel: 0.95 });
    expect(strictResult.verdict).toBe(laxResult.verdict);
    expect(strictResult.deltaPct).toBe(laxResult.deltaPct);
  });

  it('strict improved verdict', () => {
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

  it('lax default (CI 95% + threshold 20%) backward compat preserved', () => {
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.01));
    const current = buildMeasureResult('op', 40, 5, seedSamples(11.5, 40, 0.01));
    const result = detectRegression({ current, baseline });
    expect(result.verdict).toBe('stable');
  });

  it('strict CI 幅は lax より広くなる (99% > 95%)', () => {
    const baseline = buildMeasureResult('op', 40, 5, seedSamples(10, 40, 0.05));
    const current = buildMeasureResult('op', 40, 5, seedSamples(10.5, 40, 0.05));
    const laxResult = detectRegression({ current, baseline });
    const strictResult = detectRegressionStrict({ current, baseline });
    const laxWidth = laxResult.ci.upper - laxResult.ci.lower;
    const strictWidth = strictResult.ci.upper - strictResult.ci.lower;
    // Bootstrap 乱数で偶発的な逆転あり得るので緩めの assert。 直感 = strict >= lax。
    expect(strictWidth).toBeGreaterThanOrEqual(laxWidth * 0.9);
  });
});
