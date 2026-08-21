// `e2e-generic` の example が Playwright の JSON レポートを書けることを固定する (Issue #2109)。
//
// ## なぜ検査を置くか
//
// #2109 の完了条件は「`tests/e2e/` を持つ 20 example の `playwright.config.ts` が
// JSON レポーターを出力できる」。 実測すると **20 件すべてが `[['list']]` だけ**で、
// 1 件も JSON を書かなかった。
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
// 読み込めば Playwright 自身が正規化した後の値を見られる。 config が compile
// できない状態も同時に捕まる。
//
// ## outputFile を必須にする理由
//
// Playwright の JSON レポーターは `outputFile` が解決できないと
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
// **実際に走らせて file ができることは見ない。** browser の起動と webServer の
// boot が要り、20 example ぶんで数十分かかる。 ここで固定するのは「宣言が
// 揃っていること」 までで、実際に書けるかは e2e を 1 度走らせれば分かる。
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
  it('T-PJR-001 対象の config を 1 件以上見つけている', () => {
    // 集合が空だと以下の each が 1 度も走らず、検査の件数だけが並ぶ。
    expect(
      CONFIGS.length,
      'tests/e2e/ と playwright.config.ts を両方持つ example を 1 件も見つけていない (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it.each(CONFIGS)('T-PJR-002 $example が JSON レポーターを出力先付きで宣言する', async (target) => {
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
