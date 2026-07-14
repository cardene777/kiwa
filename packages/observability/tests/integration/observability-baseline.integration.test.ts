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

describe('observability integration — detectFlaky workflow', () => {
  it('T-INT-D-001 detectFlaky 100% pass = flaky でない', () => {
    const history = {
      records: [
        makeRecord('t1', 'passed', 'r1'),
        makeRecord('t1', 'passed', 'r2'),
        makeRecord('t1', 'passed', 'r3'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(result.length).toBe(0);
  });

  it('T-INT-D-002 detectFlaky mixed pass/fail = flaky 検知', () => {
    const history = {
      records: [
        makeRecord('t1', 'passed', 'r1'),
        makeRecord('t1', 'failed', 'r2'),
        makeRecord('t1', 'passed', 'r3'),
        makeRecord('t1', 'failed', 'r4'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.testId).toBe('t1');
  });

  it('T-INT-D-003 minRuns 未達なら flaky 対象外', () => {
    const history = {
      records: [
        makeRecord('t1', 'passed', 'r1'),
        makeRecord('t1', 'failed', 'r2'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 5, threshold: 0.1 });
    expect(result.length).toBe(0);
  });

  it('T-INT-D-004 全 fail は flaky ではない (常時 fail)', () => {
    const history = {
      records: [
        makeRecord('t1', 'failed', 'r1'),
        makeRecord('t1', 'failed', 'r2'),
        makeRecord('t1', 'failed', 'r3'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    // failure rate = 1.0 で threshold 0.1 超過だが 0 < rate < 1 でないため flaky でない
    expect(result.length).toBe(0);
  });

  it('T-INT-D-005 複数 test の flaky 検知', () => {
    const history = {
      records: [
        makeRecord('t1', 'passed', 'r1'),
        makeRecord('t1', 'failed', 'r2'),
        makeRecord('t1', 'passed', 'r3'),
        makeRecord('t2', 'passed', 'r1'),
        makeRecord('t2', 'passed', 'r2'),
        makeRecord('t2', 'passed', 'r3'),
      ],
    };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(result.map((r) => r.testId)).toContain('t1');
    expect(result.map((r) => r.testId)).not.toContain('t2');
  });
});
