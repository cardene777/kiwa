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

  it('T-OBS-COL-003 empty history empty records - returns empty', () => {
    const out = collectRunHistory({ records: [] });
    expect(out.records.length).toBe(0);
  });

  it('T-OBS-COL-004 no history opts.history undefined - records only', () => {
    const out = collectRunHistory({ records: [rec('T-A-001', 'passed', 1)] });
    expect(out.records.length).toBe(1);
  });

  it('T-OBS-COL-005 maxPerTest = 1 - keep last record only per testId', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 5; i += 1) recs.push(rec('T-X', 'passed', i));
    const out = collectRunHistory({ records: recs, maxPerTest: 1 });
    expect(out.records.length).toBe(1);
    expect(out.records[0]?.startedAt).toBe(4);
  });

  it('T-OBS-COL-006 maxPerTest = 0 falsy - returns combined (no cap branch)', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 5; i += 1) recs.push(rec('T-X', 'passed', i));
    const out = collectRunHistory({ records: recs, maxPerTest: 0 });
    expect(out.records.length).toBe(5);
  });

  it('T-OBS-COL-007 records sorted by startedAt ascending after cap', () => {
    const recs = [rec('T-A', 'passed', 5), rec('T-B', 'passed', 1), rec('T-A', 'passed', 3)];
    const out = collectRunHistory({ records: recs, maxPerTest: 5 });
    expect(out.records.map((r) => r.startedAt)).toEqual([1, 3, 5]);
  });

  it('T-OBS-COL-008 history records preserved in combined array order', () => {
    const initial = { records: [rec('T-A', 'passed', 1)] };
    const out = collectRunHistory({
      history: initial,
      records: [rec('T-B', 'passed', 2)],
    });
    expect(out.records[0]?.testId).toBe('T-A');
    expect(out.records[1]?.testId).toBe('T-B');
  });

  it('T-OBS-COL-009 multiple testIds - each capped independently', () => {
    const recs: TestRunRecord[] = [];
    for (let i = 0; i < 3; i += 1) recs.push(rec('T-A', 'passed', i));
    for (let i = 10; i < 13; i += 1) recs.push(rec('T-B', 'passed', i));
    const out = collectRunHistory({ records: recs, maxPerTest: 2 });
    expect(out.records.filter((r) => r.testId === 'T-A').length).toBe(2);
    expect(out.records.filter((r) => r.testId === 'T-B').length).toBe(2);
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

  it('T-OBS-FVJ-002 missing startTime defaults to 0', () => {
    const report = {
      testResults: [
        {
          assertionResults: [{ title: 'plain', status: 'passed' as const, duration: 1 }],
        },
      ],
    };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records[0]?.startedAt).toBe(0);
  });

  it('T-OBS-FVJ-003 missing fullName falls back to title', () => {
    const report = {
      testResults: [{ assertionResults: [{ title: 'only-title', status: 'passed' as const }] }],
    };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records[0]?.fullName).toBe('only-title');
  });

  it('T-OBS-FVJ-004 missing both fullName and title - empty string fullName / testId', () => {
    const report = { testResults: [{ assertionResults: [{ status: 'passed' as const }] }] };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records[0]?.fullName).toBe('');
    expect(records[0]?.testId).toBe('');
  });

  it('T-OBS-FVJ-005 status mapping - passed/failed/skipped/pending', () => {
    const report = {
      testResults: [
        {
          assertionResults: [
            { title: 'a', status: 'passed' as const },
            { title: 'b', status: 'failed' as const },
            { title: 'c', status: 'skipped' as const },
            { title: 'd', status: 'pending' as const },
          ],
        },
      ],
    };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records.map((r) => r.status)).toEqual(['passed', 'failed', 'skipped', 'skipped']);
  });

  it('T-OBS-FVJ-006 duration default 0 when undefined', () => {
    const report = { testResults: [{ assertionResults: [{ title: 'x', status: 'passed' as const }] }] };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records[0]?.durationMs).toBe(0);
  });

  it('T-OBS-FVJ-007 empty testResults - empty output array', () => {
    const records = fromVitestJson({ testResults: [] }, { runId: 'r' });
    expect(records).toEqual([]);
  });

  it('T-OBS-FVJ-008 multiple files aggregated into single flat array', () => {
    const report = {
      testResults: [
        { assertionResults: [{ title: 'T-X-001', status: 'passed' as const }] },
        { assertionResults: [{ title: 'T-Y-001', status: 'passed' as const }] },
      ],
    };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records.length).toBe(2);
    expect(records.map((r) => r.testId)).toEqual(['T-X-001', 'T-Y-001']);
  });

  it('T-OBS-FVJ-009 regex matches T-XXX-NNN inside longer fullName', () => {
    const report = {
      testResults: [
        { assertionResults: [{ fullName: 'desc > nested > T-FOO-007 bar', status: 'passed' as const }] },
      ],
    };
    const records = fromVitestJson(report, { runId: 'r' });
    expect(records[0]?.testId).toBe('T-FOO-007');
  });

  it('T-OBS-FVJ-010 runId propagation', () => {
    const report = {
      testResults: [{ assertionResults: [{ title: 'x', status: 'passed' as const }] }],
    };
    const records = fromVitestJson(report, { runId: 'custom-run-42' });
    expect(records[0]?.runId).toBe('custom-run-42');
  });
});
