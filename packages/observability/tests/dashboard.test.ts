import { describe, expect, it } from 'vitest';
import {
  detectFlaky,
  renderDashboard,
  type RunHistory,
  type SpecCoverageGap,
  type TestRunRecord,
} from '../src/index.js';

function rec(testId: string, status: 'passed' | 'failed' | 'skipped'): TestRunRecord {
  return { testId, fullName: `${testId} sample`, status, durationMs: 1, runId: 'r', startedAt: 0 };
}

describe('renderDashboard', () => {
  it('renders an empty dashboard cleanly', () => {
    const out = renderDashboard({
      history: { records: [] },
      flaky: [],
      gaps: [],
    });
    expect(out).toContain('# kiwa observability dashboard');
    expect(out).toContain('No flaky tests detected');
    expect(out).toContain('No spec coverage gaps detected');
  });

  it('summarizes pass / fail / skipped totals', () => {
    const history: RunHistory = {
      records: [
        rec('T-A-001', 'passed'),
        rec('T-A-002', 'failed'),
        rec('T-A-003', 'skipped'),
      ],
    };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('| total records | 3 |');
    expect(out).toContain('| passes | 1 |');
    expect(out).toContain('| failures | 1 |');
    expect(out).toContain('| skipped | 1 |');
    expect(out).toContain('| pass rate | 50.0% |');
  });

  it('renders detected flaky tests as a table', () => {
    const history: RunHistory = {
      records: [
        rec('T-A-001', 'passed'),
        rec('T-A-001', 'failed'),
        rec('T-A-001', 'passed'),
      ],
    };
    const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    const out = renderDashboard({ history, flaky, gaps: [] });
    expect(out).toContain('| T-A-001 |');
    expect(out).toContain('33.3%');
  });

  it('renders coverage gaps per module', () => {
    const gap: SpecCoverageGap = {
      module: 'items',
      layer: 'api',
      specCaseCount: 3,
      missingTcIds: ['T-API-001', 'T-API-002'],
      extraTcIds: ['T-API-999'],
    };
    const out = renderDashboard({
      history: { records: [] },
      flaky: [],
      gaps: [gap],
    });
    expect(out).toContain('### items (api)');
    expect(out).toContain('- T-API-001');
    expect(out).toContain('- T-API-999');
  });

  it('T-OBS-DSH-005 pass rate 100% with all passes', () => {
    const history: RunHistory = {
      records: [rec('T-A', 'passed'), rec('T-A', 'passed')],
    };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('| pass rate | 100.0% |');
  });

  it('T-OBS-DSH-006 pass rate 0% with all failures', () => {
    const history: RunHistory = {
      records: [rec('T-A', 'failed'), rec('T-A', 'failed')],
    };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('| pass rate | 0.0% |');
  });

  it('T-OBS-DSH-007 pass rate defaults to 100% when no pass/fail (only skipped)', () => {
    const history: RunHistory = { records: [rec('T-A', 'skipped')] };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('| pass rate | 100.0% |');
  });

  it('T-OBS-DSH-008 markdown header structure', () => {
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(out).toContain('# kiwa observability dashboard');
    expect(out).toContain('## Summary');
    expect(out).toContain('## Flaky tests');
    expect(out).toContain('## Code coverage');
    expect(out).toContain('## Spec coverage gaps');
  });

  it('T-OBS-DSH-009 summary table header "| metric | value |"', () => {
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(out).toContain('| metric | value |');
  });

  it('T-OBS-DSH-010 flaky table header columns', () => {
    const history: RunHistory = {
      records: [rec('T-A', 'passed'), rec('T-A', 'failed'), rec('T-A', 'passed')],
    };
    const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    const out = renderDashboard({ history, flaky, gaps: [] });
    expect(out).toContain('| testId | failure rate | runs (pass / fail) | name |');
  });

  it('T-OBS-DSH-011 flaky table cell format includes failure rate percentage with one decimal', () => {
    const history: RunHistory = {
      records: [rec('T-A', 'passed'), rec('T-A', 'failed'), rec('T-A', 'passed')],
    };
    const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    const out = renderDashboard({ history, flaky, gaps: [] });
    expect(out).toContain('33.3%');
  });

  it('T-OBS-DSH-012 gap with no missing/extra TC IDs - prints match message', () => {
    const gap: SpecCoverageGap = {
      module: 'items',
      layer: 'api',
      missingTcIds: [],
      extraTcIds: [],
      // 解析できた上での一致。 0 件だと別の文言になる (#1910)。
      specCaseCount: 3,
    };
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [gap] });
    expect(out).toContain('spec と test が完全に一致');
  });

  // 「解析できた上での一致」 と「1 件も解析できなかった」 を分ける。 両方とも
  // missing / extra が空になるため、 件数を見ないと同じ文字列になる (#1910 で実測)。
  it('T-OBS-DSH-012b spec から 1 件も読めなかった時は一致と書かない', () => {
    const unparsed: SpecCoverageGap = {
      module: 'items',
      layer: 'contract',
      missingTcIds: [],
      extraTcIds: [],
      specCaseCount: 0,
    };
    const matched: SpecCoverageGap = { ...unparsed, specCaseCount: 32 };
    const render = (gap: SpecCoverageGap): string =>
      renderDashboard({ history: { records: [] }, flaky: [], gaps: [gap] });

    expect(render(unparsed)).toContain('spec から case を 1 件も読めなかった');
    expect(render(unparsed)).not.toContain('完全に一致');
    expect(render(matched)).toContain('完全に一致');
    // 同じ文字列を出さない。 これが #1896 で誰も気付かなかった形。
    expect(render(unparsed)).not.toBe(render(matched));
  });

  // 未解析の警告は gap の有無から独立。 test 側に既知形式の id があると、 一致判定に
  // 入らないため警告が消えていた (#1910 Round 1)。 読めていない以上、 その id を extra と
  // 断定もできない。
  it('T-OBS-DSH-012d 未解析で test 側に id がある時も警告を出す', () => {
    const gap: SpecCoverageGap = {
      module: 'items',
      layer: 'contract',
      missingTcIds: [],
      extraTcIds: ['T-API-001'],
      specCaseCount: 0,
    };
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [gap] });
    expect(out).toContain('spec から case を 1 件も読めなかった');
    // extra と断定しない。 id 自体は手がかりとして残す。
    expect(out).not.toContain('Extra TC IDs');
    expect(out).toContain('extra とは断定できない');
    expect(out).toContain('T-API-001');
  });

  // 件数を本文に出す。 出さないと「一致」 が何件に対する一致か読み手に判らない。
  it('T-OBS-DSH-012c 一致の時は spec の case 件数を出す', () => {
    const gap: SpecCoverageGap = {
      module: 'items',
      layer: 'contract',
      missingTcIds: [],
      extraTcIds: [],
      specCaseCount: 32,
    };
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [gap] });
    expect(out).toContain('32 件');
  });

  it('T-OBS-DSH-013 gap with missing only - shows missing section', () => {
    const gap: SpecCoverageGap = {
      module: 'x',
      layer: 'api',
      missingTcIds: ['T-MIS-001'],
      extraTcIds: [],
      specCaseCount: 1,
    };
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [gap] });
    expect(out).toContain('Missing TC IDs');
    expect(out).toContain('T-MIS-001');
    expect(out).not.toContain('Extra TC IDs');
  });

  it('T-OBS-DSH-014 gap with extra only - shows extra section', () => {
    const gap: SpecCoverageGap = {
      module: 'x',
      layer: 'api',
      missingTcIds: [],
      extraTcIds: ['T-EXT-001'],
      // spec は読めている。 0 件だと「未解析」 の分岐に入り、 この test の主題
      // (extra だけが出る) を確かめられない。
      specCaseCount: 1,
    };
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [gap] });
    expect(out).toContain('Extra TC IDs');
    expect(out).toContain('T-EXT-001');
    expect(out).not.toContain('Missing TC IDs');
  });

  it('T-OBS-DSH-015 multiple gaps - each rendered as separate section', () => {
    const gaps: SpecCoverageGap[] = [
      { module: 'a', layer: 'api', missingTcIds: [], extraTcIds: [], specCaseCount: 2 },
      { module: 'b', layer: 'ui', missingTcIds: [], extraTcIds: [], specCaseCount: 2 },
    ];
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps });
    expect(out).toContain('### a (api)');
    expect(out).toContain('### b (ui)');
  });

  it('T-OBS-DSH-016 coverage section "No coverage data provided." literal when no coverage', () => {
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(out).toContain('No coverage data provided.');
  });

  it('T-OBS-DSH-017 coverage table headers when coverage provided', () => {
    const summary = {
      total: {
        path: 'total',
        statements: { total: 10, covered: 8, skipped: 0, pct: 80 },
        branches: { total: 10, covered: 7, skipped: 0, pct: 70 },
        functions: { total: 10, covered: 9, skipped: 0, pct: 90 },
        lines: { total: 10, covered: 8, skipped: 0, pct: 80 },
      },
      files: [],
    };
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [], coverage: summary });
    expect(out).toContain('| metric | covered | total | pct |');
  });

  it('T-OBS-DSH-018 "No flaky tests detected." literal when flaky is empty', () => {
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(out).toContain('No flaky tests detected.');
  });

  it('T-OBS-DSH-019 "No spec coverage gaps detected." literal when gaps is empty', () => {
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(out).toContain('No spec coverage gaps detected.');
  });

  it('T-OBS-DSH-020 dashboard returns string', () => {
    const result = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
