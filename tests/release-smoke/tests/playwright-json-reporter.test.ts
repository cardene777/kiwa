// `e2e-generic` の example が Playwright の JSON レポートを書けることを固定する (Issue #2109)。
//
// ## なぜ検査を置くか
//
// #2109 の完了条件は「`tests/e2e/` を持つ 20 example の `playwright.config.ts` が
// JSON レポーターを出力できる」。 実測すると `'list'` が 1 件、`[['list']]` が
// 19 件で、1 件も JSON を書かなかった。
//
// `@kiwa-lab/observability` の `fromPlaywrightJson` は実行履歴の入口だが、
// 入力を作る側が無いまま置かれていた。
//
// ## なぜ config を読み込むのか (text を見ないのか)
//
// `reporter` の書き方は 1 通りではない。 実測で `'list'` (裸の文字列) と
// `[['list']]` (配列) の 2 形があり、Playwright はどちらも受ける。 正規表現で
// 見分けようとすると、**形が 1 つ増えるたびに検査が静かに素通りする**。
//
// 読み込めば config が実際に export する値を見られ、下の helper で対応 shape を
// 明示的に正規化できる。 config の構文 error や import error も同時に捕まる。
//
// ## outputFile を必須にする理由
//
// Playwright の JSON レポーターは config や環境変数から `outputFile` が解決できないと
// **stdout へ書く** (`printsToStdio()` が `!this._resolvedOutputFile` を返す)。
// `list` と混ざって console が読めなくなるうえ、後段が読む file もできない。
//
// 解決は **config が置かれた dir からの相対**で行われる
// (`resolveOutputFile` が `path.resolve(options.configDir, options.outputFile)`)。
// なので `tests/reports/` を書けば example ごとの dir に落ちる。 この path は
// `.gitignore` の `examples/*/tests/reports/` が既に覆っており、vitest 側の
// `vitest-results.json` と同じ場所になる。
//
// ## 何を見ないか
//
// **Playwright reporter を実行して file ができることまでは見ない。** ここは repo の
// config 宣言を固定する gate で、Playwright 自身の書き込み動作は再検査しない。
// browser / webServer を起動しない `playwright test --list` で別途 smoke できる。
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from './skill-md.js';

/** JSON レポートの出力先 (config dir からの相対)。 */
export const JSON_REPORT_REL = 'tests/reports/playwright-results.json';

/** `tests/e2e/` と `playwright.config.ts` を両方持つ example を列挙する。 */
function collectConfigs(): { example: string; abs: string }[] {
  const examplesDir = resolve(REPO_ROOT, 'examples');
  const out: { example: string; abs: string }[] = [];
  for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(examplesDir, entry.name);
    if (!existsSync(join(dir, 'tests', 'e2e'))) continue;
    const config = join(dir, 'playwright.config.ts');
    if (!existsSync(config)) continue;
    out.push({ example: entry.name, abs: config });
  }
  return out.sort((a, b) => (a.example < b.example ? -1 : 1));
}

const CONFIGS = collectConfigs();
const REQUIRED_CONFIG_COUNT = 20;

/** reporter の宣言を `[name, options]` の組へ正規化する。 */
function normalizeReporter(reporter: unknown): [string, Record<string, unknown>][] {
  if (typeof reporter === 'string') return [[reporter, {}]];
  if (!Array.isArray(reporter)) return [];
  // `[['list'], ['json', {...}]]` と `['list', {...}]` を見分ける。 前者は要素が
  // 配列、後者は先頭が文字列になる。
  if (typeof reporter[0] === 'string') {
    return [[reporter[0], (reporter[1] ?? {}) as Record<string, unknown>]];
  }
  return reporter
    .filter((entry): entry is [string, Record<string, unknown>?] => Array.isArray(entry))
    .map((entry) => [entry[0], (entry[1] ?? {}) as Record<string, unknown>]);
}

describe('e2e-generic の Playwright config — JSON レポート (#2109)', () => {
  it(`T-PJR-001 完了条件の ${REQUIRED_CONFIG_COUNT} config 以上を見つけている`, () => {
    // 下限を固定しないと、config が 1 件だけ残った部分空振りでも以下の each は通る。
    expect(
      CONFIGS.length,
      'tests/e2e/ と playwright.config.ts を両方持つ example を 1 件も見つけていない (検査が空振りしている)',
    ).toBeGreaterThan(0);
    expect(
      CONFIGS.length,
      `tests/e2e/ と playwright.config.ts を両方持つ example が ${REQUIRED_CONFIG_COUNT} 件未満 (検査が部分空振りしている)`,
    ).toBeGreaterThanOrEqual(REQUIRED_CONFIG_COUNT);
  });

  it.each([
    { label: '裸の文字列', reporter: 'list', expected: [['list', {}]] },
    { label: '単一 tuple', reporter: ['list', {}], expected: [['list', {}]] },
    {
      label: 'reporter 配列',
      reporter: [['list'], ['json', { outputFile: JSON_REPORT_REL }]],
      expected: [['list', {}], ['json', { outputFile: JSON_REPORT_REL }]],
    },
  ])('T-PJR-002 normalizeReporter が $label を分ける', ({ reporter, expected }) => {
    expect(normalizeReporter(reporter)).toEqual(expected);
  });

  it.each(CONFIGS)('T-PJR-003 $example が JSON レポーターを出力先付きで宣言する', async (target) => {
    const loaded = (await import(pathToFileURL(target.abs).href)) as { default?: unknown };
    const config = loaded.default as { reporter?: unknown } | undefined;
    expect(config, `${target.example} の config が default export を持たない`).toBeTruthy();

    const reporters = normalizeReporter(config!.reporter);
    expect(
      reporters.length,
      `${target.example} の reporter を読み取れない: ${JSON.stringify(config!.reporter)}`,
    ).toBeGreaterThan(0);

    const json = reporters.find(([name]) => name === 'json');
    expect(json, `${target.example} が json レポーターを宣言していない`).toBeTruthy();
    expect(
      json![1]['outputFile'],
      `${target.example} の json レポーターの outputFile が ${JSON_REPORT_REL} でない (未設定なら stdout へ書かれる): ${JSON.stringify(json![1]['outputFile'])}`,
    ).toBe(JSON_REPORT_REL);

    // console 側を落とさない。 json だけにすると実行中に何も表示されなくなる。
    expect(
      reporters.some(([name]) => name === 'list'),
      `${target.example} が list レポーターを失っている`,
    ).toBe(true);
  });
});
