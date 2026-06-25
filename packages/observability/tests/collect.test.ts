import { describe, expect, it } from 'vitest';
import { collectRunHistory, fromVitestJson, type TestRunRecord } from '../src/index.js';

function rec(testId: string, status: 'passed' | 'failed' | 'skipped', startedAt: number): TestRunRecord {
  return {
    testId,
    fullName: `${testId} sample`,
    status,
    durationMs: 1,
    runId: `r-${startedAt}`,
    startedAt,
  };
}

describe('collectRunHistory', () => {
  it('returns merged records when no cap is set', () => {
    const initial = { records: [rec('T-A-001', 'passed', 1)] };
    const out = collectRunHistory({
      history: initial,
      records: [rec('T-A-001', 'failed', 2), rec('T-B-001', 'passed', 3)],
    });
    expect(out.records.length).toBe(3);
  });

  it('caps records per testId with FIFO eviction', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 5; i += 1) recs.push(rec('T-A-001', 'passed', i));
    recs.push(rec('T-B-001', 'failed', 10));
    const out = collectRunHistory({ records: recs, maxPerTest: 3 });
    const aRecs = out.records.filter((r) => r.testId === 'T-A-001');
    expect(aRecs.length).toBe(3);
    expect(aRecs.map((r) => r.startedAt)).toEqual([2, 3, 4]);
    const bRecs = out.records.filter((r) => r.testId === 'T-B-001');
    expect(bRecs.length).toBe(1);
  });
});

describe('fromVitestJson', () => {
  it('extracts T-XXX-NNN test IDs from fullName when present', () => {
    const report = {
      startTime: 100,
      testResults: [
        {
          testFilePath: 'a.test.ts',
          assertionResults: [
            { fullName: 'group > T-API-001 happy path', status: 'passed' as const, duration: 5 },
            { fullName: 'group > T-API-002 sad path', status: 'failed' as const, duration: 8 },
            { fullName: 'group > unrelated test', status: 'passed' as const, duration: 1 },
          ],
        },
      ],
    };
    const records = fromVitestJson(report, { runId: 'run-1' });
    expect(records.length).toBe(3);
    expect(records[0]?.testId).toBe('T-API-001');
    expect(records[1]?.testId).toBe('T-API-002');
    expect(records[2]?.testId).toBe('group > unrelated test');
    expect(records.every((r) => r.runId === 'run-1' && r.startedAt === 100)).toBe(true);
  });
});
