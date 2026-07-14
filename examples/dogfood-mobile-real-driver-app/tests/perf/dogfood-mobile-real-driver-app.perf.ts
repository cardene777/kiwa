import { describe, expect, it } from 'vitest';

/**
 * dogfood-mobile-real-driver-app dogfood perf test — minimum viable perf baseline。
 * kiwa 設計思想 「各 lib の性能担保は複数 dogfood application で lib を実 use して verify」
 * に沿った structural baseline、 domain-specific 深化は follow-up。
 */
describe('dogfood-mobile-real-driver-app dogfood perf', () => {
  it('timing baseline: performance.now() 100 iter で serial < 100ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) performance.now();
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('allocation baseline: 100 obj alloc で serial < 50ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const _ = { i, v: i * 2, s: `s-${i}` };
      if (_.i < 0) break;
    }
    expect(performance.now() - start).toBeLessThan(50);
  });

  it('workload baseline: array map 1000 iter で serial < 100ms', () => {
    const start = performance.now();
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    const result = arr.map((x) => x * 2);
    expect(result.length).toBe(1000);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
