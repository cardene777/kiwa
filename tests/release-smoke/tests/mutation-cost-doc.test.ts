// The cost table in `docs/quality/mutation-thresholds.md` has to keep matching
// the configs it describes (Issue #2168).
//
// The table mixes two kinds of number. Measurements (ms per test, collect
// seconds, run durations) are observations — nothing in the repo can derive
// them, and they are only ever as fresh as the run that produced them. Settings
// (concurrency, `timeoutMS`) are different: they are read straight out of each
// `stryker.config.mjs`, so a config change silently makes the prose wrong.
//
// `rules/quality.md § 導出可能記述は人手で書かない` asks for one of three routes
// when writing a derivable value. This file is route 1 for the settings half:
// walk the configs and compare. The measurements stay as written, which is why
// the section names the command that produced each column.
//
// When it fails, the fix is one of:
//   1. the config changed on purpose — update the table row
//   2. the table was wrong — fix the number
//   3. a package left the table — remove its row or add the package back
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const DOC = resolve(REPO_ROOT, 'docs/quality/mutation-thresholds.md');

/** The heading the cost table lives under. */
const SECTION = "### Why one package's mutants cost ten times another's (#2168)";

/**
 * Pull the cost table's package rows out of the section.
 *
 * The row shape is `| \`pkg\` | ms | collect | concurrency | mutants | run | rsm |`.
 * Reading the section rather than the whole file keeps the other tables in this
 * document (tiers, overrides, widening) out of the match.
 */
function readCostRows(): Array<{ pkg: string; concurrency: number }> {
  const doc = readFileSync(DOC, 'utf8');
  const start = doc.indexOf(SECTION);
  expect(start, `見出し「${SECTION}」 が docs に無い`).toBeGreaterThan(-1);

  // The section ends at the next `###` heading, or at the end of the file.
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

/** `concurrency: N` as the package's Stryker config declares it. */
function configConcurrency(pkg: string): number | null {
  const path = resolve(REPO_ROOT, `packages/${pkg}/stryker.config.mjs`);
  const m = /^\s*concurrency:\s*(\d+)\s*,/m.exec(readFileSync(path, 'utf8'));
  return m ? Number(m[1]) : null;
}

describe('mutation cost doc — 表の設定値が config と一致する (#2168)', () => {
  it('T-MCD-001 表が package 行を 1 件以上持つ', () => {
    // 空の表に対して forEach を回すと assert に 1 度も到達せず、必ず通る。
    // 見出しを変えた / 表を消した形をここで落とす。
    expect(readCostRows().length, '表から package 行を 1 つも読めていない').toBeGreaterThan(0);
  });

  it('T-MCD-002 各行の concurrency が stryker.config.mjs と一致する', () => {
    const rows = readCostRows();
    let compared = 0;
    for (const { pkg, concurrency } of rows) {
      const actual = configConcurrency(pkg);
      expect(actual, `packages/${pkg}/stryker.config.mjs に concurrency が無い`).not.toBeNull();
      expect(concurrency, `${pkg} の concurrency が表と config で違う`).toBe(actual);
      compared += 1;
    }
    expect(compared, '1 行も突き合わせていない').toBe(rows.length);
  });

  it('T-MCD-003 concurrency を下げているのは dapp だけ (config 側で見る)', () => {
    // 「dapp は 2、 他は 4」 は **config についての** 主張なので、 表ではなく config を
    // 母集団にする。 表を読むと T-MCD-002 と同じ入力を見ることになり、 config 側だけが
    // 変わった形を 1 件も捕まえられない (実測で 0 件 FAIL だった)。
    const lowered = readCostRows()
      .map((r) => [r.pkg, configConcurrency(r.pkg)] as const)
      .filter(([, c]) => c !== null && c < 4)
      .map(([pkg]) => pkg);
    expect(lowered, 'concurrency < 4 の package が dapp 以外にある').toEqual(['dapp']);
  });

  it('T-MCD-004 dapp だけが timeoutMS を明示している', () => {
    // 本文は「dapp は timeoutMS 60000、 既定は 5000」 と書く。
    // 他 package が明示し始めたら、 その主張が成り立たなくなる。
    const rows = readCostRows();
    const explicit: Array<[string, number]> = [];
    for (const { pkg } of rows) {
      const path = resolve(REPO_ROOT, `packages/${pkg}/stryker.config.mjs`);
      const m = /^\s*timeoutMS:\s*(\d+)\s*,/m.exec(readFileSync(path, 'utf8'));
      if (m) explicit.push([pkg, Number(m[1])]);
    }
    expect(explicit, 'timeoutMS を明示するのは dapp の 60000 だけ').toEqual([['dapp', 60000]]);
  });

  it('T-MCD-005 dapp の Stryker 対象 test は実 browser を起こさない', () => {
    // 本文は「その shape は今の package が持つものではない」 と書く。
    // 実起動が 1 件でも入ったら主張が崩れるので、 呼出の形で見る。
    const dir = resolve(REPO_ROOT, 'packages/dapp/tests');
    const files = readdirSync(dir).filter((f) => f.endsWith('.test.ts'));
    expect(files.length, 'dapp の test file を 1 つも読めていない').toBeGreaterThan(0);

    const launching = files.filter((f) => {
      const body = readFileSync(resolve(dir, f), 'utf8');
      return /\b(chromium|firefox|webkit)\s*\.\s*launch(PersistentContext)?\s*\(/.test(body);
    });
    expect(launching, '実 browser を起こす test が dapp に入った').toEqual([]);
  });
});
