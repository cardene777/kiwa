// The cost table in `docs/quality/mutation-thresholds.md` has to keep matching
// the configs it describes (Issue #2168).
//
// The table mixes two kinds of number. Measurements (ms per test, collect
// seconds, run durations, mutant counts) are observations of one run — nothing
// in a fresh checkout can derive them, and `mutation-report/` is gitignored.
// Settings (concurrency, `timeoutMS`) are different: they are read straight out
// of each `stryker.config.mjs`, so a config change silently makes the prose
// wrong.
//
// `rules/quality.md § 導出可能記述は人手で書かない` asks for one of three routes
// when writing a derivable value. This file is route 1 for the settings half.
//
// The population matters. #2174 review round 1 found that asserting "only
// `dapp` lowers concurrency" against the *table's* package set was already
// false repo-wide: `e2e` and `ui` also run at 2, and `e2e` also sets
// `timeoutMS`. Claims about configs are checked against every config.
//
// When it fails, the fix is one of:
//   1. the config changed on purpose — update the table row and the prose
//   2. the table was wrong — fix the number
//   3. a package left the table — remove its row or add the package back
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const DOC = resolve(REPO_ROOT, 'docs/quality/mutation-thresholds.md');
const PACKAGES = resolve(REPO_ROOT, 'packages');

/** The heading the cost table lives under. */
const SECTION = '### Why per-mutant cost varies so much between packages (#2168)';

/**
 * Pull the cost table's package rows out of the section.
 *
 * The row shape is `| \`pkg\` | ms | collect | concurrency | mutants | run | cap |`.
 * Reading the section rather than the whole file keeps the other tables in this
 * document (tiers, overrides, widening) out of the match.
 */
function readCostRows(): Array<{ pkg: string; concurrency: number }> {
  const doc = readFileSync(DOC, 'utf8');
  const start = doc.indexOf(SECTION);
  expect(start, `見出し「${SECTION}」 が docs に無い`).toBeGreaterThan(-1);

  // The section ends at the next `### ` heading, or at the end of the file.
  const after = doc.slice(start + SECTION.length);
  const end = after.indexOf('\n### ');
  const section = end === -1 ? after : after.slice(0, end);

  const rows: Array<{ pkg: string; concurrency: number }> = [];
  for (const line of section.split('\n')) {
    const m = /^\|\s*`([a-z0-9-]+)`\s*\|[^|]*\|[^|]*\|\s*(\d+)\s*\|/.exec(line);
    if (m) rows.push({ pkg: m[1]!, concurrency: Number(m[2]) });
  }
  return rows;
}

interface ConfigRow {
  pkg: string;
  concurrency: number | null;
  timeoutMS: number | null;
}

/** Every package that carries a Stryker config, with the settings it declares. */
function readAllConfigs(): ConfigRow[] {
  const out: ConfigRow[] = [];
  for (const pkg of readdirSync(PACKAGES)) {
    const path = join(PACKAGES, pkg, 'stryker.config.mjs');
    let body: string;
    try {
      body = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    const c = /^\s*concurrency:\s*(\d+)\s*,/m.exec(body);
    const t = /^\s*timeoutMS:\s*(\d+)\s*,/m.exec(body);
    out.push({
      pkg,
      concurrency: c ? Number(c[1]) : null,
      timeoutMS: t ? Number(t[1]) : null,
    });
  }
  return out;
}

/** Every `*.test.ts` under a directory, including subdirectories. */
function walkTests(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...walkTests(path));
    } else if (name.endsWith('.test.ts')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * その file が `@playwright/test` から **値の binding を宣言している** か。
 *
 * 正規表現では判定できない。 `import { type Page } from '...'` は行頭が
 * `import type` ではないので runtime に見えるが、 取り込む binding は 0 個で
 * 値は 1 つも来ない。 逆に side-effect import (`import '...'`) と double quote の
 * 形は行頭の pattern から漏れる (#2174 r2-f5)。 AST なら import clause と各
 * specifier の `isTypeOnly` をそのまま読める。
 *
 * **判定するのは宣言であって emit 後の依存ではない** (#2174 r3-f1)。
 * `verbatimModuleSyntax` が false の時、 型位置でしか使わない値 import は
 * TypeScript が消去するため、 ここで「値」 と答えた file が emit 後には
 * 依存を持たないことがありうる。 emit 後まで見るには dapp の compiler options で
 * 変換した出力を読む必要があり、 release-smoke から別 package の build に
 * 依存することになる。 docs 側の記述も「declare value imports」 に合わせてあり、
 * この検査はその文言をそのまま守る。
 *
 * 値の re-export (`export { expect } from '...'`) も宣言なので数える。
 */
function importsPlaywrightAtRuntime(path: string): boolean {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const stmt of source.statements) {
    // `export { x } from '@playwright/test'` — 値の re-export も module を引く。
    if (ts.isExportDeclaration(stmt)) {
      const spec = stmt.moduleSpecifier;
      if (!spec || !ts.isStringLiteral(spec) || spec.text !== '@playwright/test') continue;
      if (stmt.isTypeOnly) continue;
      const clause = stmt.exportClause;
      // `export * from` は clause を持たない = 値を通す。
      if (!clause) return true;
      if (ts.isNamespaceExport(clause)) return true;
      if (clause.elements.some((el) => !el.isTypeOnly)) return true;
      continue;
    }

    if (!ts.isImportDeclaration(stmt)) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (stmt.moduleSpecifier.text !== '@playwright/test') continue;

    const clause = stmt.importClause;
    // `import '@playwright/test'` — binding は無いが評価される = 値の取り込み。
    if (!clause) return true;
    // `import type { ... }` — 型のみ。
    if (clause.isTypeOnly) continue;
    // `import def from` — default binding は値。
    if (clause.name) return true;

    const bindings = clause.namedBindings;
    if (!bindings) continue;
    // `import * as ns from` — 名前空間は値。
    if (ts.isNamespaceImport(bindings)) return true;
    // `import { a, type B } from` — `isTypeOnly` でない specifier が 1 つでもあれば値。
    if (bindings.elements.some((el) => !el.isTypeOnly)) return true;
  }
  return false;
}

describe('mutation cost doc — 表の設定値が config と一致する (#2168)', () => {
  it('T-MCD-001 表が package 行を 1 件以上持つ', () => {
    // 空の表に対して forEach を回すと assert に 1 度も到達せず、必ず通る。
    // 見出しを変えた / 表を消した形をここで落とす。
    expect(readCostRows().length, '表から package 行を 1 つも読めていない').toBeGreaterThan(0);
  });

  it('T-MCD-002 各行の concurrency が stryker.config.mjs と一致する', () => {
    const rows = readCostRows();
    // 下限は rows.length 側に課す。 突き合わせ件数と行数の一致は loop が必ず
    // 1 回ずつ増やすので空集合でも成立し、下限にならない (#2174 r1-f10)。
    expect(rows.length, '突き合わせる行が 1 つも無い').toBeGreaterThan(0);

    const byPkg = new Map(readAllConfigs().map((c) => [c.pkg, c.concurrency]));
    for (const { pkg, concurrency } of rows) {
      expect(byPkg.has(pkg), `packages/${pkg}/stryker.config.mjs が無い`).toBe(true);
      expect(concurrency, `${pkg} の concurrency が表と config で違う`).toBe(byPkg.get(pkg));
    }
  });

  it('T-MCD-003 concurrency を下げている package が本文の列挙と一致する', () => {
    // 本文は「dapp / e2e / ui の 3 つが 2 で走る」 と書く。 母集団は **全 config** で、
    // 表の package 集合ではない。 表を母集団にすると、表に載っていない package が
    // 下げても気付けない (#2174 r1-f6 で実際に外していた)。
    const configs = readAllConfigs();
    expect(configs.length, 'stryker config を 1 つも読めていない').toBeGreaterThan(0);

    // 名前だけを比べると、 e2e が 2 から 1 に変わっても通る。 値まで組で比べる。
    const lowered = configs
      .filter((c) => c.concurrency !== null && c.concurrency < 4)
      .map((c) => [c.pkg, c.concurrency] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));
    expect(lowered, 'concurrency < 4 の package と値が本文の列挙と違う').toEqual([
      ['dapp', 2],
      ['e2e', 2],
      ['ui', 2],
    ]);
  });

  it('T-MCD-004 timeoutMS を明示する package が本文の列挙と一致する', () => {
    // 本文は「dapp と e2e が 60000 を置く」 と書く。 既定値そのものは本文から外した =
    // Stryker の schema default を検査で確かめる手段が無く、literal が腐る (#2174 r1-f8)。
    const configs = readAllConfigs();
    expect(configs.length, 'stryker config を 1 つも読めていない').toBeGreaterThan(0);

    const explicit = configs
      .filter((c) => c.timeoutMS !== null)
      .map((c) => [c.pkg, c.timeoutMS] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));
    expect(explicit, 'timeoutMS を明示する package が本文の列挙と違う').toEqual([
      ['dapp', 60000],
      ['e2e', 60000],
    ]);
  });

  it('T-MCD-005 dapp の test は browser launcher を呼ばない (subdir 込み)', () => {
    // Stryker の include は `.vitest-dist/tests/**/*.test.js` で再帰的。 直下だけを
    // 見ると subdir に起動が入っても通る (#2174 r1-f7)。
    const dir = resolve(REPO_ROOT, 'packages/dapp/tests');
    const files = walkTests(dir);
    expect(files.length, 'dapp の test file を 1 つも読めていない').toBeGreaterThan(0);

    // 起動経路は launch / launchPersistentContext / launchServer / connectOverCDP / connect の 5 形。
    const launcher =
      /\b(chromium|firefox|webkit)\s*\.\s*(launch|launchPersistentContext|launchServer|connectOverCDP|connect)\s*\(/;
    const launching = files
      .filter((f) => launcher.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(dir.length + 1));
    expect(launching, '実 browser を起こす test が dapp に入った').toEqual([]);
  });

  it('T-MCD-006 dapp の src が @playwright/test の値 binding を宣言している', () => {
    // 本文は「4 module が value import を宣言する」 と書く。 型参照だけに変わったら
    // その記述が実物とずれるので、実物から数える (#2174 r1-f5 / r3-f1)。
    const dir = resolve(REPO_ROOT, 'packages/dapp/src');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    expect(files.length, 'dapp の src file を 1 つも読めていない').toBeGreaterThan(0);

    const runtime = files.filter((f) => importsPlaywrightAtRuntime(resolve(dir, f))).sort();
    expect(runtime, '@playwright/test の値 binding を宣言する src file が本文と違う').toEqual([
      'balance-change.ts',
      'expect-custom-error.ts',
      'expect-event.ts',
      'fixture.ts',
    ]);
  });
});
