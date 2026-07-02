import { describe, expect, it } from 'vitest';
import { buildMeasureResult, evaluatePerfGate } from '../src/index.js';

function resultFrom(samples: number[]) {
  return buildMeasureResult('reply', samples.length, 5, samples);
}

describe('evaluatePerfGate', () => {
  it('T-PH-G-001 passes when all provided axes clear thresholds', () => {
    const gate = evaluatePerfGate({
      result: resultFrom([10, 11, 12, 13, 14]),
      thresholds: { p95Ms: 20, costUsd: 0.1, tokens: 4000, accuracy: 0.8 },
      metrics: { costUsd: 0.01, tokens: 300, accuracy: 0.9 },
    });

    expect(gate.verdict.passed).toBe(true);
    expect(gate.breaches).toEqual([]);
    expect(gate.verdict.axesEvaluated).toBe(4);
  });

  it('T-PH-G-002 fails a single perf axis breach', () => {
    const gate = evaluatePerfGate({
      result: resultFrom([10, 11, 12, 13, 50]),
      thresholds: { p95Ms: 20 },
    });

    expect(gate.verdict.passed).toBe(false);
    expect(gate.breaches[0]?.axis).toBe('perf.p95Ms');
  });

  it('T-PH-G-003 no thresholds is a no-op with empty metrics', () => {
    const gate = evaluatePerfGate({
      result: resultFrom([10, 11, 12]),
      thresholds: {},
    });

    expect(gate.verdict).toEqual({
      passed: true,
      blockers: [],
      axesEvaluated: 0,
    });
    expect(gate.report.perf.samples).toBe(0);
    expect(gate.report.testCount.total).toBe(0);
  });

  it('T-PH-G-004 treats missing optional metrics as a breach when thresholded', () => {
    const gate = evaluatePerfGate({
      result: resultFrom([10, 11, 12]),
      thresholds: { tokens: 100 },
    });

    expect(gate.verdict.passed).toBe(false);
    expect(gate.breaches[0]?.axis).toBe('token.totalTokens');
  });

  it('T-PH-G-005 integrates with evaluateReleaseGate-style blocker shape', () => {
    const gate = evaluatePerfGate({
      result: resultFrom([10, 11, 12, 13, 30]),
      thresholds: { p95Ms: 15 },
    });

    expect(gate.verdict.blockers).toContainEqual({
      axis: 'perf.p95Ms',
      threshold: 15,
      actual: gate.report.perf.p95Ms,
      op: '<=',
    });
  });
});
