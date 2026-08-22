/**
 * `/kiwa-observe` が Playwright の結果も同じ run として集めることを固定する (Issue #2158)。
 *
 * ## なぜ検査を置くか
 *
 * #2155 で `tests/e2e/` を持つ 20 example が `tests/reports/playwright-results.json` を
 * 書けるようになった一方、**読む側が無かった**。 `@kiwa-lab/observability` は
 * `fromPlaywrightJson` を export しているのに、skill が生成する dashboard script は
 * `fromVitestJson` しか呼んでいなかった。
 *
 * 結果として `e2e-generic` layer の 28 組合せ / 50 test が dashboard に 1 件も出ない。
 *
 * ## 2 つの層を分けて見る
 *
 * | 層 | 何を見るか |
 * |---|---|
 * | 契約 (T-OPW-001..004) | skill の宣言。 import / option / path 規則 / runId の共有 |
 * | 帰結 (T-OPW-101..102) | runId を共有しないと何が壊れるかを実 library で示す |
 *
 * 契約だけだと「そう書いてある」 しか言えない。 帰結だけだと skill が別の書き方へ
 * 変わった時に素通りする。
 */
import { describe, expect, it } from 'vitest';

import {
  collectRunHistory,
  detectFlaky,
  fromPlaywrightJson,
  fromVitestJson,
  type PlaywrightJsonReport,
} from '@kiwa-lab/observability';

import { headingSectionIn, skillBody } from './skill-md.js';

const OBSERVE = skillBody('kiwa-observe');

/** Step 1 の script (dashboard 生成) を取る。 次の `### ` で閉じる。 */
function step1(): string {
  return headingSectionIn(OBSERVE, /^### Step 1: dashboard 生成 script を生成$/m);
}

/** Step 0 (試走) を取る。 */
function step0(): string {
  return headingSectionIn(OBSERVE, /^### Step 0: vitest を JSON で走らせる$/m);
}

describe('kiwa-observe が Playwright の結果を読む (#2158)', () => {
  it('T-OPW-001 生成 script が Playwright の record を records へ合流させる', () => {
    const body = step1();
    expect(body, 'import が無い').toContain('fromPlaywrightJson');
    expect(
      body.match(/fromPlaywrightJson\(/g) ?? [],
      'import しているだけで 1 度も呼んでいない',
    ).not.toHaveLength(0);
    // **呼出の存在では足りない**。 helper の中で呼んでいても、その helper を
    // `records` へ足さなければ dashboard には 1 件も出ない (変異試験で実際に残存した)。
    // 分析へ渡る合流点そのものを見る。
    const merge = /const records = \[[\s\S]{0,400}?\];/.exec(body)?.[0];
    expect(merge, 'records の組み立てが読み取れない').toBeTruthy();
    expect(merge!, 'records に vitest 側が入っていない').toMatch(/fromVitestJson\(/);
    expect(
      merge!,
      'records に Playwright 側が入っていない (helper を定義しただけで合流していない)',
    ).toMatch(/PLAYWRIGHT_JSON|fromPlaywrightJson/);
  });

  it('T-OPW-002 vitest と Playwright に同じ runId を渡す', () => {
    const body = step1();
    // runId を別々に採ると同じ観測が 2 run になる (T-OPW-101 がその帰結を示す)。
    const calls = [...body.matchAll(/from(?:Vitest|Playwright)Json\([^;]*?\{\s*runId\s*\}/g)];
    expect(
      calls.length,
      '2 つの converter が同じ runId 変数を受け取る形になっていない',
    ).toBe(2);
  });

  it('T-OPW-003 --playwright-json を option として宣言する', () => {
    const options = headingSectionIn(OBSERVE, /^## オプション$/m);
    expect(options, 'option の宣言が無い').toContain('--playwright-json');
  });

  it('T-OPW-004 読み先を skill 側で組み立てず config の規約に従う', () => {
    const body = step0();
    // path を 2 箇所で決めると、config を変えた時に読み先だけ古くなる。
    // **出現数まで見る**。 説明文と規則ブロックの両方に書くと、片方を変えても
    // 検査が通る (変異試験で実際に残存した)。
    expect(
      body.match(/tests\/reports\/playwright-results\.json/g) ?? [],
      '既定の読み先は規則ブロック 1 箇所にだけ書く',
    ).toHaveLength(1);
    expect(body, '既定の読み先が規則ブロックに無い').toMatch(
      /PLAYWRIGHT_JSON[\s\S]{0,200}tests\/reports\/playwright-results\.json/,
    );
    // 走らせる条件は **宣言文** で見る。 表の中にも同じ語が出るため、
    // 文字列の有無だけだと条件を消しても通る (変異試験で実際に残存した)。
    expect(body, '走らせる条件の宣言が無い').toMatch(
      /playwright\.config\.ts[^\n]*tests\/e2e\/[^\n]*だけ走らせる/,
    );

    // 「無い」 を異常にすると e2e を持たない layer で観測が止まる。
    // **表の全行**を見る。 1 行だけ異常に変えても他の行が同じ語を持つため、
    // 語の有無では落ちない (変異試験で実際に残存した)。
    const rows = [...body.matchAll(/^\| (?!形\b)(?![-\s|]+$)([^|]+)\|([^|]+)\|$/gm)]
      .map((m) => [m[1]!.trim(), m[2]!.trim()] as const)
      .filter(([, how]) => how !== '扱い');
    expect(rows.length, '走らせない / 0 件の扱いを述べた表が無い').toBeGreaterThanOrEqual(4);
    const abnormal = rows.filter(([, how]) => !how.includes('record 0 件'));
    expect(
      abnormal,
      `0 件で続行しない形がある (観測が止まる): ${JSON.stringify(abnormal)}`,
    ).toEqual([]);
  });
});

/** vitest reporter の最小形。 */
function vitestReport(startTime: number) {
  return {
    startTime,
    testResults: [
      {
        testFilePath: '/repo/tests/unit.test.ts',
        assertionResults: [
          { fullName: 'suite > T-UNIT-001 works', status: 'passed' as const, duration: 1 },
        ],
      },
    ],
  };
}

/** Playwright reporter の最小形。 */
function playwrightReport(startTime: string): PlaywrightJsonReport {
  return {
    stats: { startTime },
    suites: [
      {
        title: 'e2e.spec.ts',
        specs: [
          {
            title: 'T-E2E-001 renders',
            tests: [{ status: 'expected', results: [{ status: 'passed', duration: 2 }] }],
          },
        ],
        suites: [],
      },
    ],
  };
}

describe('runId を共有しないと 1 回の観測が 2 run になる (#2158)', () => {
  it('T-OPW-101 同じ runId なら 1 run として数える', () => {
    const runId = 'run-1';
    const records = [
      ...fromVitestJson(vitestReport(1_700_000_000_000), { runId }),
      ...fromPlaywrightJson(playwrightReport('2026-08-22T00:00:00.000Z'), { runId }),
    ];
    expect(records, '両方の reporter から 1 件ずつ取れている').toHaveLength(2);
    expect(new Set(records.map((r) => r.runId)).size, 'run は 1 つ').toBe(1);

    const history = collectRunHistory({ records });
    // minRuns 2 に届かないので「判定していない」 が正しい。
    expect(detectFlaky({ history, minRuns: 2, threshold: 0.1 }), '1 run で flaky 判定はしない').toEqual(
      [],
    );
  });

  it('T-OPW-102 別々の runId にすると同じ観測が 2 run に化ける', () => {
    // 本 test は「壊れた形」 を固定する。 実装が別々の runId を採るようになった時、
    // T-OPW-002 が落ちる前にここで意味が説明できる。
    const vitest = fromVitestJson(vitestReport(1_700_000_000_000), { runId: 'run-vitest' });
    const play = fromPlaywrightJson(playwrightReport('2026-08-22T00:00:00.000Z'), {
      runId: 'run-playwright',
    });
    const runs = new Set([...vitest, ...play].map((r) => r.runId));
    expect(runs.size, '1 回の観測が 2 run として数えられる').toBe(2);
  });
});
