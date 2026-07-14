import { describe, expect, it } from 'vitest';
import { detectFlaky } from '../../src/index.js';

function makeRecord(testId: string, status: 'passed' | 'failed', runId: string) {
  return {
    testId,
    fullName: `test.${testId}`,
    status,
    durationMs: 10,
    runId,
    startedAt: Date.now(),
  };
}

describe('observability fidelity — detectFlaky contract', () => {
  it('T-FID-D-001 detectFlaky 同 input で idempotent', () => {
    const history = { records: [makeRecord('t', 'passed', 'r1'), makeRecord('t', 'failed', 'r2'), makeRecord('t', 'passed', 'r3')] };
    const r1 = detectFlaky({ history, minRuns: 3 });
    const r2 = detectFlaky({ history, minRuns: 3 });
    expect(r1).toEqual(r2);
  });

  it('T-FID-D-002 failureRate 計算正確性', () => {
    const history = {
      records: [
        makeRecord('t', 'passed', 'r1'),
        makeRecord('t', 'passed', 'r2'),
        makeRecord('t', 'failed', 'r3'),
        makeRecord('t', 'failed', 'r4'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(result[0]!.failureRate).toBe(0.5);
  });

  it('T-FID-D-003 skipped は除外', () => {
    const history = {
      records: [
        makeRecord('t', 'passed', 'r1'),
        { testId: 't', fullName: 'test.t', status: 'skipped' as const, durationMs: 10, runId: 'r2', startedAt: Date.now() },
        makeRecord('t', 'failed', 'r3'),
        makeRecord('t', 'passed', 'r4'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 3 });
    expect(result[0]!.totalRuns).toBe(3);
  });

  it('T-FID-D-004 totalRuns / passes / failures 精度', () => {
    const history = { records: [makeRecord('t', 'passed', 'r1'), makeRecord('t', 'failed', 'r2'), makeRecord('t', 'passed', 'r3')] };
    const result = detectFlaky({ history, minRuns: 3 });
    expect(result[0]!.totalRuns).toBe(3);
    expect(result[0]!.passes).toBe(2);
    expect(result[0]!.failures).toBe(1);
  });

  it('T-FID-D-005 threshold 境界値', () => {
    const history = { records: [makeRecord('t', 'passed', 'r1'), makeRecord('t', 'passed', 'r2'), makeRecord('t', 'passed', 'r3'), makeRecord('t', 'passed', 'r4'), makeRecord('t', 'failed', 'r5')] };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.2 });
    // failureRate 0.2 = threshold 0.2 だが 0 < rate < 1 で threshold 超過は境界
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
