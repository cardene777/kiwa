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

  it('T-OBS-FLA-006 default minRuns = 3', () => {
    const history: RunHistory = {
      records: [rec('T-A-001', 'passed'), rec('T-A-001', 'failed')],
    };
    expect(detectFlaky({ history })).toEqual([]);
  });

  it('T-OBS-FLA-007 default threshold = 0.1 - failure rate 0.05 excluded', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 19; i += 1) recs.push(rec('T-A', 'passed'));
    recs.push(rec('T-A', 'failed'));
    const history: RunHistory = { records: recs };
    expect(detectFlaky({ history })).toEqual([]);
  });

  it('T-OBS-FLA-008 failure rate at threshold edge - included (>= threshold)', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 9; i += 1) recs.push(rec('T-A', 'passed'));
    recs.push(rec('T-A', 'failed'));
    const history: RunHistory = { records: recs };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out.length).toBe(1);
  });

  it('T-OBS-FLA-009 skipped records ignored from totalRuns', () => {
    const history: RunHistory = {
      records: [
        rec('T-A', 'passed'),
        rec('T-A', 'failed'),
        rec('T-A', 'skipped'),
        rec('T-A', 'skipped'),
      ],
    };
    const out = detectFlaky({ history, minRuns: 2, threshold: 0.1 });
    expect(out[0]?.totalRuns).toBe(2);
  });

  it('T-OBS-FLA-010 totalRuns boundary - minRuns exact', () => {
    const history: RunHistory = {
      records: [rec('T-A', 'passed'), rec('T-A', 'failed'), rec('T-A', 'passed')],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out.length).toBe(1);
  });

  it('T-OBS-FLA-011 totalRuns less than minRuns excluded', () => {
    const history: RunHistory = {
      records: [rec('T-A', 'passed'), rec('T-A', 'failed')],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out).toEqual([]);
  });

  it('T-OBS-FLA-012 fullName preserved from first record', () => {
    const recs = [
      { ...rec('T-A', 'passed'), fullName: 'desc > T-A first' },
      { ...rec('T-A', 'failed'), fullName: 'desc > T-A second' },
      { ...rec('T-A', 'passed'), fullName: 'desc > T-A third' },
    ];
    const out = detectFlaky({ history: { records: recs }, minRuns: 3, threshold: 0.1 });
    expect(out[0]?.fullName).toBe('desc > T-A first');
  });

  it('T-OBS-FLA-013 passes / failures counts', () => {
    const history: RunHistory = {
      records: [
        rec('T-A', 'passed'),
        rec('T-A', 'passed'),
        rec('T-A', 'failed'),
        rec('T-A', 'failed'),
        rec('T-A', 'failed'),
      ],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out[0]?.passes).toBe(2);
    expect(out[0]?.failures).toBe(3);
  });

  it('T-OBS-FLA-014 empty history - empty result', () => {
    expect(detectFlaky({ history: { records: [] } })).toEqual([]);
  });

  it('T-OBS-FLA-015 multiple flaky sort by failureRate descending', () => {
    const history: RunHistory = {
      records: [
        rec('T-LO', 'passed'),
        rec('T-LO', 'passed'),
        rec('T-LO', 'passed'),
        rec('T-LO', 'failed'),
        rec('T-HI', 'passed'),
        rec('T-HI', 'failed'),
        rec('T-HI', 'failed'),
        rec('T-HI', 'failed'),
      ],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out[0]?.testId).toBe('T-HI');
    expect(out[1]?.testId).toBe('T-LO');
    expect(out[0]?.failureRate).toBeGreaterThan(out[1]?.failureRate ?? 0);
  });

  it('T-OBS-FLA-016 boundary - passes === totalRuns excluded', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 5; i += 1) recs.push(rec('T-A', 'passed'));
    expect(detectFlaky({ history: { records: recs }, minRuns: 3, threshold: 0.1 })).toEqual([]);
  });

  it('T-OBS-FLA-017 boundary - failures === totalRuns excluded', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 5; i += 1) recs.push(rec('T-A', 'failed'));
    expect(detectFlaky({ history: { records: recs }, minRuns: 3, threshold: 0.1 })).toEqual([]);
  });

  it('T-OBS-FLA-018 custom threshold = 0.5 - 0.4 rate excluded', () => {
    const recs: TestRunRecord[] = [
      rec('T-A', 'passed'),
      rec('T-A', 'passed'),
      rec('T-A', 'passed'),
      rec('T-A', 'failed'),
      rec('T-A', 'failed'),
    ];
    const out = detectFlaky({ history: { records: recs }, minRuns: 3, threshold: 0.5 });
    expect(out).toEqual([]);
  });

  it('T-OBS-FLA-019 multiple testIds tracked independently', () => {
    const history: RunHistory = {
      records: [
        rec('T-A', 'passed'),
        rec('T-B', 'passed'),
        rec('T-A', 'failed'),
        rec('T-B', 'failed'),
        rec('T-A', 'passed'),
        rec('T-B', 'passed'),
      ],
    };
    const out = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    expect(out.length).toBe(2);
    expect(out.map((t) => t.testId).sort()).toEqual(['T-A', 'T-B']);
  });
});
