import { describe, expect, it } from 'vitest';
import {
  collectRunHistory,
  fromPlaywrightJson,
  fromVitestJson,
  type TestRunRecord,
} from '../src/index.js';

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

  it('T-OBS-COL-010 startedAt が同じ record は追記順を保つ', () => {
    // startTime を持たない Vitest report は全件 0。testId ごとに束ねた順へ並べ替えると、
    // run の到着順を使う前回比較が古い run を選ぶ。
    const recs = [rec('T-A', 'passed', 0), rec('T-B', 'passed', 0), rec('T-A', 'failed', 0)];
    const out = collectRunHistory({ records: recs, maxPerTest: 5 });
    expect(out.records, '同時刻の record が testId 単位に並べ替えられている').toEqual(recs);
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

describe('fromPlaywrightJson', () => {
  it('flattens nested suites and joins the trail into fullName', () => {
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-02T03:04:05.000Z' },
        suites: [
          {
            title: 'reorg-4scenario.spec.ts',
            specs: [],
            suites: [
              {
                title: 'reorg 4-scenario e2e',
                specs: [
                  {
                    title: 'T-DR-001 pending tx dropped',
                    tests: [{ status: 'expected', results: [{ status: 'passed', duration: 12 }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
      { runId: 'r-1' },
    );
    expect(out).toEqual([
      {
        testId: 'T-DR-001',
        fullName: 'reorg-4scenario.spec.ts > reorg 4-scenario e2e > T-DR-001 pending tx dropped',
        status: 'passed',
        durationMs: 12,
        runId: 'r-1',
        startedAt: Date.parse('2026-01-02T03:04:05.000Z'),
      },
    ]);
  });

  it('maps every playwright status onto the three record states', () => {
    const spec = (title: string, status: 'expected' | 'unexpected' | 'flaky' | 'skipped') => ({
      title,
      tests: [{ status, results: [] }],
    });
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-01T00:00:00.000Z' },
        suites: [
          {
            title: '',
            specs: [
              spec('T-E2E-001 ok', 'expected'),
              spec('T-E2E-002 broken', 'unexpected'),
              spec('T-E2E-003 retried', 'flaky'),
              spec('T-E2E-004 skipped', 'skipped'),
            ],
          },
        ],
      },
      { runId: 'r-2' },
    );
    expect(out.map((r) => [r.testId, r.status])).toEqual([
      ['T-E2E-001', 'passed'],
      ['T-E2E-002', 'failed'],
      // retry で通ったものは通った側に寄せる。 flaky の検出は detectFlaky が履歴から行う。
      ['T-E2E-003', 'passed'],
      ['T-E2E-004', 'skipped'],
    ]);
  });

  it('keeps a test whose results array is empty', () => {
    // 未実行を落とすと「実行していない」 が「存在しない」 に化けて、
    // 突き合わせが実物とずれる。
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-01T00:00:00.000Z' },
        suites: [
          {
            title: '',
            specs: [{ title: 'T-E2E-005 never ran', tests: [{ status: 'skipped', results: [] }] }],
          },
        ],
      },
      { runId: 'r-3' },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.status).toBe('skipped');
    expect(out[0]?.durationMs).toBe(0);
  });

  it('falls back to the last result when the test has no status', () => {
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-01T00:00:00.000Z' },
        suites: [
          {
            title: '',
            specs: [
              {
                title: 'T-E2E-006 retried then passed',
                tests: [
                  {
                    results: [
                      { status: 'failed', duration: 7 },
                      { status: 'passed', duration: 5 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { runId: 'r-4' },
    );
    expect(out[0]?.status).toBe('passed');
    expect(out[0]?.durationMs).toBe(12);
  });

  it('merges projects into one logical record without counting one run multiple times', () => {
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-01T00:00:00.000Z' },
        suites: [
          {
            title: 'multi-project.spec.ts',
            specs: [
              {
                title: 'T-E2E-009 cross-browser',
                tests: [
                  { status: 'expected', results: [{ status: 'passed', duration: 3 }] },
                  { status: 'unexpected', results: [{ status: 'failed', duration: 4 }] },
                ],
              },
            ],
          },
        ],
      },
      { runId: 'r-projects' },
    );

    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      testId: 'T-E2E-009',
      status: 'failed',
      durationMs: 7,
      runId: 'r-projects',
    });
  });

  it('uses fullName as the id when no TC id is present', () => {
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-01T00:00:00.000Z' },
        suites: [
          {
            title: 'flow',
            specs: [{ title: 'renders the page', tests: [{ status: 'expected', results: [] }] }],
          },
        ],
      },
      { runId: 'r-5' },
    );
    expect(out[0]?.testId).toBe('flow > renders the page');
  });

  it('drops empty titles from fullName', () => {
    // 空の区切りが混ざると ID の切り出しに影響する。 名前の無い suite と
    // 名前の無い spec の **両方** を 1 つの入力で通し、落とす場所が 1 つで
    // 足りることを確かめる。
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-01T00:00:00.000Z' },
        suites: [
          {
            title: '',
            specs: [],
            suites: [
              {
                title: '',
                specs: [
                  { title: 'T-E2E-007 x', tests: [{ status: 'expected', results: [] }] },
                  { title: '', tests: [{ status: 'expected', results: [] }] },
                ],
              },
            ],
          },
        ],
      },
      { runId: 'r-6' },
    );
    expect(out.map((r) => r.fullName)).toEqual(['T-E2E-007 x', '']);
  });

  it('produces no record for a spec that has no tests', () => {
    // Playwright は project を 1 つも解決できない spec に空の `tests` を返しうる。
    // 合成の record を作ると「実行していない」 が「1 件通った」 に化ける。
    const out = fromPlaywrightJson(
      {
        stats: { startTime: '2026-01-02T03:04:05.000Z' },
        suites: [
          {
            title: 'flow',
            specs: [
              { title: 'T-E2E-009 unresolved', tests: [] },
              {
                title: 'T-E2E-010 ran',
                tests: [{ status: 'expected', results: [{ status: 'passed', duration: 1 }] }],
              },
            ],
          },
        ],
      },
      { runId: 'r-9' },
    );
    expect(out.map((r) => r.testId)).toEqual(['T-E2E-010']);
  });

  it('returns an empty array for a report with no suites', () => {
    expect(
      fromPlaywrightJson(
        { stats: { startTime: '2026-01-01T00:00:00.000Z' }, suites: [] },
        { runId: 'r-7' },
      ),
    ).toEqual([]);
  });

  it('falls back to 0 when startTime is not parseable', () => {
    const out = fromPlaywrightJson(
      {
        stats: { startTime: 'not a date' },
        suites: [
          {
            title: '',
            specs: [{ title: 'T-E2E-008 x', tests: [{ results: [] }] }],
          },
        ],
      },
      { runId: 'r-8' },
    );
    expect(out[0]?.startedAt).toBe(0);
  });
});
