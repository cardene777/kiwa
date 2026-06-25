import { describe, expect, it } from 'vitest';
import { detectFlaky, type RunHistory, type TestRunRecord } from '../src/index.js';

function rec(testId: string, status: 'passed' | 'failed' | 'skipped'): TestRunRecord {
  return { testId, fullName: testId, status, durationMs: 1, runId: 'r', startedAt: 0 };
}

describe('detectFlaky', () => {
  it('ignores tests that always pass', () => {
    const history: RunHistory = {
      records: [rec('T-A-001', 'passed'), rec('T-A-001', 'passed'), rec('T-A-001', 'passed')],
    };
    expect(detectFlaky({ history })).toEqual([]);
  });

  it('ignores tests that always fail (= broken, not flaky)', () => {
    const history: RunHistory = {
      records: [rec('T-A-001', 'failed'), rec('T-A-001', 'failed'), rec('T-A-001', 'failed')],
    };
    expect(detectFlaky({ history })).toEqual([]);
  });

  it('flags tests with mixed pass / fail', () => {
    const history: RunHistory = {
      records: [
        rec('T-A-001', 'passed'),
        rec('T-A-001', 'failed'),
        rec('T-A-001', 'passed'),
        rec('T-A-001', 'failed'),
      ],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out.length).toBe(1);
    expect(out[0]?.testId).toBe('T-A-001');
    expect(out[0]?.failureRate).toBeCloseTo(0.5, 5);
  });

  it('respects minRuns threshold', () => {
    const history: RunHistory = {
      records: [rec('T-A-001', 'passed'), rec('T-A-001', 'failed')],
    };
    expect(detectFlaky({ history, minRuns: 3 })).toEqual([]);
  });

  it('sorts results by failure rate descending', () => {
    const history: RunHistory = {
      records: [
        rec('T-A-001', 'passed'),
        rec('T-A-001', 'failed'),
        rec('T-A-001', 'passed'),
        rec('T-B-001', 'passed'),
        rec('T-B-001', 'failed'),
        rec('T-B-001', 'failed'),
      ],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out.map((t) => t.testId)).toEqual(['T-B-001', 'T-A-001']);
  });
});
