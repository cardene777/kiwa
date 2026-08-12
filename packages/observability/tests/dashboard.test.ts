import { describe, expect, it } from 'vitest';
import {
  detectFlaky,
  flakyEligibility,
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
    // record が 1 件も無い時に「flaky は無い」 とは書かない (#1909)。 判定に要る
    // run 数に届いていないので、 判定していないことを書く。
    expect(out).toContain('flaky は判定していない');
    expect(out).not.toContain('No flaky tests detected');
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

  it('T-OBS-DSH-007 pass rate is n/a when no pass/fail (only skipped)', () => {
    // 既定を 100% にすると、 1 件も判定していない状態が「全部通った」 と同じ
    // 表示になる (#1909)。 分母が 0 なら計算していないと書く。
    const history: RunHistory = { records: [rec('T-A', 'skipped')] };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('| pass rate | n/a |');
    expect(out).toContain('pass / fail の record が無い');
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

  it('T-OBS-DSH-018 "No flaky tests detected." literal when judged and flaky is empty', () => {
    // 判定した上で 0 件だった場合の文言。 判定材料が要るので、 同じ test の run を
    // minRuns 分与える。 record 0 件で同じ文言を出すのが #1909 の欠陥だった。
    const history: RunHistory = {
      records: [rec('T-A', 'passed'), rec('T-A', 'passed'), rec('T-A', 'passed')],
    };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('No flaky tests detected.');
    expect(out).toContain('(1 test を判定)');
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

/**
 * 「判定していない」 と「判定した上で無い」 の区別 (#1909)。
 *
 * contract layer の runner は Foundry / Hardhat で vitest ではないため、 観測は
 * record 0 件で回る。 それが `pass rate 100.0%` と `No flaky tests detected.` に
 * なっていた = 走らせていない状態と、 走らせて全部通った状態が同じ表示になる。
 *
 * 同じ形が vitest 系 layer にもある。 chain は history を持ち越さないので 1 run
 * しか無く、 `detectFlaky` の `minRuns` (既定 3) に **どの test も届かない**。
 * つまり flaky の行は、 どの layer でも一度も判定の結果ではなかった。
 */
describe('renderDashboard が判定していないことを判定結果と混同しない', () => {
  /** 同じ testId を n 回走らせた history。 */
  function runs(testId: string, statuses: ('passed' | 'failed' | 'skipped')[]): RunHistory {
    return { records: statuses.map((s) => rec(testId, s)) };
  }

  it('record 0 件で pass rate を出さない', () => {
    const out = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    expect(out).toContain('| pass rate | n/a |');
    expect(out).not.toContain('| pass rate | 100.0% |');
    expect(out).toContain('test の実行結果を 1 件も受け取っていない');
  });

  it('record 0 件と全 pass が同じ表示にならない', () => {
    // #1909 が踏んだ形。 2 つを並べて、 render 結果が一致しないことを直接見る。
    const empty = renderDashboard({ history: { records: [] }, flaky: [], gaps: [] });
    const allPassed = renderDashboard({
      history: runs('T-A', ['passed', 'passed', 'passed']),
      flaky: [],
      gaps: [],
    });
    expect(empty).not.toBe(allPassed);
    expect(allPassed).toContain('| pass rate | 100.0% |');
  });

  it('1 run しか無ければ flaky を判定していないと書く', () => {
    // chain が毎回この形になる。 history を持ち越さないため run は 1 回で、
    // minRuns 3 にどの test も届かない。
    const out = renderDashboard({
      history: { records: [rec('T-A', 'passed'), rec('T-B', 'failed')] },
      flaky: [],
      gaps: [],
    });
    expect(out).toContain('flaky は判定していない');
    expect(out).toContain('run が 3 回要るが、 最大 1 回しか無い');
    expect(out).not.toContain('No flaky tests detected');
  });

  it('minRuns に届いた test があれば判定したと書く', () => {
    const out = renderDashboard({ history: runs('T-A', ['passed', 'passed', 'passed']), flaky: [], gaps: [] });
    expect(out).toContain('No flaky tests detected. (1 test を判定)');
  });

  it('判定対象の数え方が detectFlaky と揃っている', () => {
    // 表示と検出が別々に数えると、 「判定した」 と書きながら検出は飛ばしている
    // 状態になる。 skipped を数えない規則も含めて同じ helper を通す。
    const history: RunHistory = {
      records: [
        rec('T-A', 'passed'),
        rec('T-A', 'failed'),
        rec('T-A', 'passed'),
        rec('T-B', 'skipped'),
        rec('T-B', 'skipped'),
        rec('T-B', 'skipped'),
      ],
    };
    const eligibility = flakyEligibility({ history });
    expect(eligibility.eligible, 'skipped だけの test を判定対象に数えている').toBe(1);
    expect(eligibility.maxRuns).toBe(3);

    const flaky = detectFlaky({ history });
    const out = renderDashboard({ history, flaky, gaps: [] });
    expect(flaky.map((f) => f.testId)).toEqual(['T-A']);
    expect(out).toContain('| T-A |');
  });

  it('検出済みの flaky を再判定で隠さない', () => {
    // 呼出側が `minRuns: 2` で検出し、 表示側に同じ値を渡さなかった形。 表示側の
    // 再判定 (既定 3) を先に見ると、 **実際に検出した flaky が「判定していない」 に
    // 化ける** (Round 1 F1、 examples/full-stack-poc で再現)。 渡された結果が優先。
    const history = runs('T-A', ['passed', 'failed']);
    const flaky = detectFlaky({ history, minRuns: 2, threshold: 0.1 });
    expect(flaky.map((f) => f.testId), '前提: minRuns 2 なら検出される').toEqual(['T-A']);

    const out = renderDashboard({ history, flaky, gaps: [] });
    expect(out).toContain('| T-A |');
    expect(out).not.toContain('flaky は判定していない');
  });

  it('minRuns を変えた時に表示が追随する', () => {
    // 呼出側が `detectFlaky` に別の値を渡したなら、 表示にも同じ値を渡す。
    const history = runs('T-A', ['passed', 'failed']);
    const strict = renderDashboard({ history, flaky: [], gaps: [], flakyMinRuns: 3 });
    const loose = renderDashboard({
      history,
      flaky: detectFlaky({ history, minRuns: 2 }),
      gaps: [],
      flakyMinRuns: 2,
    });
    expect(strict).toContain('flaky は判定していない');
    expect(loose).not.toContain('flaky は判定していない');
    expect(loose).toContain('| T-A |');
  });

  it('skip のみの run は pass rate を出さず、 record 0 件とも区別する', () => {
    const skipped = renderDashboard({ history: runs('T-A', ['skipped']), flaky: [], gaps: [] });
    expect(skipped).toContain('| pass rate | n/a |');
    expect(skipped).toContain('pass / fail の record が無い');
    expect(skipped).not.toContain('test の実行結果を 1 件も受け取っていない');
    expect(skipped).toContain('| total records | 1 |');
  });
});
