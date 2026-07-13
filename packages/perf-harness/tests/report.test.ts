import { describe, expect, it } from 'vitest';
import { buildMeasureResult, emitPerfReport } from '../src/index.js';

describe('emitPerfReport', () => {
  it('T-PH-REP-001 renders markdown without baseline', () => {
    const result = buildMeasureResult('reply', 5, 1, [1, 2, 3, 4, 5]);
    expect(emitPerfReport(result)).toMatchInlineSnapshot(`
      "# Perf Report — reply

      | metric | value |
      |---|---|
      | iterations | 5 |
      | warmup | 1 |
      | p50 | 3.00ms |
      | p95 | 4.80ms |
      | p99 | 4.96ms |
      | mean | 3.00ms |
      | stdev | 1.58ms |
      | min | 1.00ms |
      | max | 5.00ms |
      | total | 15.00ms |
      "
    `);
  });

  it('T-PH-REP-002 renders baseline diff and histogram', () => {
    const baseline = buildMeasureResult('reply', 5, 1, [1, 2, 3, 4, 5]);
    const current = buildMeasureResult('reply', 5, 1, [2, 3, 4, 5, 6]);
    expect(
      emitPerfReport(current, { baseline, includeSamples: true }),
    ).toMatchInlineSnapshot(`
      "# Perf Report — reply

      | metric | value |
      |---|---|
      | iterations | 5 |
      | warmup | 1 |
      | p50 | 4.00ms |
      | p95 | 5.80ms |
      | p99 | 5.96ms |
      | mean | 4.00ms |
      | stdev | 1.58ms |
      | min | 2.00ms |
      | max | 6.00ms |
      | total | 20.00ms |

      ## Baseline diff

      | metric | current | baseline | delta ms | delta % |
      |---|---|---|---|---|
      | p50 | 4.00ms | 3.00ms | +1.00ms | +33.33% |
      | p95 | 5.80ms | 4.80ms | +1.00ms | +20.83% |
      | p99 | 5.96ms | 4.96ms | +1.00ms | +20.16% |
      | mean | 4.00ms | 3.00ms | +1.00ms | +33.33% |
      | min | 2.00ms | 1.00ms | +1.00ms | +100.00% |
      | max | 6.00ms | 5.00ms | +1.00ms | +20.00% |
      | total | 20.00ms | 15.00ms | +5.00ms | +33.33% |

      ## Samples histogram

      | bin | range ms | count | bar |
      |---|---|---|---|
      | 1 | 2.00-2.40 | 1 | ########## |
      | 2 | 2.40-2.80 | 0 |  |
      | 3 | 2.80-3.20 | 1 | ########## |
      | 4 | 3.20-3.60 | 0 |  |
      | 5 | 3.60-4.00 | 0 |  |
      | 6 | 4.00-4.40 | 1 | ########## |
      | 7 | 4.40-4.80 | 0 |  |
      | 8 | 4.80-5.20 | 1 | ########## |
      | 9 | 5.20-5.60 | 0 |  |
      | 10 | 5.60-6.00 | 1 | ########## |
      "
    `);
  });
});
