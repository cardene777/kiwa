import { describe, expect, it } from 'vitest';
import { buildMeasureResult } from '../src/measure.js';
import { emitPerfReport } from '../src/report.js';

describe('buildMeasureResult defensive branches', () => {
  it('handles single-sample (variance path with n=1)', () => {
    const result = buildMeasureResult('single', 1, 0, [10]);
    expect(result.stdev).toBe(0);
    expect(result.mean).toBe(10);
    expect(result.minMs).toBe(10);
    expect(result.maxMs).toBe(10);
  });

  it('computes non-zero variance for multi-sample input', () => {
    const result = buildMeasureResult('multi', 3, 0, [5, 10, 15]);
    expect(result.stdev).toBeGreaterThan(0);
    expect(result.mean).toBe(10);
  });

  it('handles empty samples with defaults', () => {
    const result = buildMeasureResult('empty', 0, 0, []);
    expect(result.mean).toBeNaN();
    expect(result.minMs).toBe(0);
    expect(result.maxMs).toBe(0);
  });
});

describe('emitPerfReport defensive branches', () => {
  const baseSamples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const baseResult = buildMeasureResult('test', 10, 2, baseSamples);

  it('emits baseline diff section when baseline provided', () => {
    const baseline = buildMeasureResult('base', 10, 2, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const output = emitPerfReport(baseResult, { baseline });
    expect(output).toContain('Baseline diff');
    expect(output).toContain('| metric |');
    expect(output).toContain('| current |');
  });

  it('emits samples histogram when includeSamples=true', () => {
    const output = emitPerfReport(baseResult, { includeSamples: true });
    expect(output).toContain('Samples histogram');
    expect(output).toContain('| bin | range ms | count | bar |');
  });

  it('emits baseline + samples histogram together', () => {
    const baseline = buildMeasureResult('base', 10, 2, baseSamples);
    const output = emitPerfReport(baseResult, {
      baseline,
      includeSamples: true,
    });
    expect(output).toContain('Baseline diff');
    expect(output).toContain('Samples histogram');
  });

  it('handles baseline with zero p50 (delta pct divide-by-zero guard)', () => {
    const zeroBaseline = buildMeasureResult('zero', 1, 0, [0]);
    const output = emitPerfReport(baseResult, { baseline: zeroBaseline });
    expect(output).toContain('Baseline diff');
  });

  it('omits both sections when no opts provided', () => {
    const output = emitPerfReport(baseResult);
    expect(output).not.toContain('Baseline diff');
    expect(output).not.toContain('Samples histogram');
    expect(output).toContain('Perf Report — test');
  });

  it('emits report with single-sample result', () => {
    const single = buildMeasureResult('single', 1, 0, [42]);
    const output = emitPerfReport(single, { includeSamples: true });
    expect(output).toContain('Perf Report');
    expect(output).toContain('Samples histogram');
  });

  it('emits report with empty samples histogram (no rows)', () => {
    const empty = buildMeasureResult('empty', 0, 0, []);
    const output = emitPerfReport(empty, { includeSamples: true });
    expect(output).toContain('Samples histogram');
  });
});
