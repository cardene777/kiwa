import { describe, expect, it } from 'vitest';
import { buildMeasureResult, detectRegression } from '../src/index.js';

function makeResult(name: string, samples: number[]) {
  return buildMeasureResult(name, samples.length, 0, samples);
}

describe('detectRegression', () => {
  it('T-PH-R-001 flags a 20%+ p95 slowdown as regressed', () => {
    const baseline = makeResult('reply', [9.8, 9.9, 10, 10.1, 10.15, 10.2]);
    const current = makeResult('reply', [11.9, 12, 12.1, 12.15, 12.2, 12.3]);
    const result = detectRegression({ current, baseline });

    expect(result.regressed).toBe(true);
    expect(result.deltaPct).toBeGreaterThanOrEqual(0.2);
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-002 flags clear 30% and 50% slowdowns when significant', () => {
    const baseline = makeResult('reply', [10, 10, 11, 9, 10, 10]);
    const thirty = makeResult('reply', [13, 13, 14, 12, 13, 13]);
    const fifty = makeResult('reply', [15, 15, 16, 14, 15, 15]);

    const thirtyResult = detectRegression({ current: thirty, baseline });
    const fiftyResult = detectRegression({ current: fifty, baseline });

    expect(thirtyResult.verdict).toBe('regressed');
    expect(thirtyResult.significant).toBe(true);
    expect(fiftyResult.verdict).toBe('regressed');
    expect(fiftyResult.welchT).toBeGreaterThan(2);
  });

  it('T-PH-R-003 reports improved when p95 drops past the threshold', () => {
    const baseline = makeResult('reply', [10, 10, 11, 9, 10, 10]);
    const current = makeResult('reply', [7, 7, 8, 6, 7, 7]);
    const result = detectRegression({ current, baseline });

    expect(result.verdict).toBe('improved');
    expect(result.regressed).toBe(false);
    expect(result.deltaPct).toBeLessThan(-0.2);
  });

  it('T-PH-R-004 uses Welch t-test as a smoke signal for significance', () => {
    const baseline = makeResult('reply', [10, 10.1, 9.9, 10.2, 9.8, 10.1]);
    const current = makeResult('reply', [13, 13.1, 12.9, 13.2, 12.8, 13.1]);
    const result = detectRegression({ current, baseline, threshold: 0.2 });

    expect(result.significant).toBe(true);
    expect(result.welchT).toBeGreaterThan(2);
  });

  it('T-PH-R-005 stays stable for tiny sample counts', () => {
    const baseline = makeResult('reply', [10]);
    const current = makeResult('reply', [20]);
    const result = detectRegression({ current, baseline, threshold: 0.2 });

    expect(result.significant).toBe(false);
    expect(result.welchT).toBe(0);
    expect(result.verdict).toBe('stable');
  });
});
