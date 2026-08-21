/**
 * Which test files an example holds, and what a spec says it searched.
 *
 * `## 既存 test との対応` states the breadth of the search that produced the
 * correspondence table. That statement is derived from the tree, so writing it
 * by hand makes it drift: #2141 found the number off in 7 of 8 specs, and the
 * three counts in play disagreed with each other.
 *
 * ## Why files and not test definitions
 *
 * Counting definitions cannot be settled. Ten `X.Y(` forms appear across the
 * examples and they split three ways: definitions (`it.each` / `test.describe`
 * / `describe.runIf` / `describe.skipIf` / `it.skipIf`), things that are not
 * definitions (`test.beforeEach` / `test.afterEach` /
 * `test.describe.configure`), and `test.skip`, which is **both**:
 *
 *     test.skip(!browsersInstalled(), 'reason');   // a directive
 *     test.skip('T-E2E-999 ...', async () => {});  // a skipped test
 *
 * Telling them apart needs the first argument's type, which no pattern over the
 * text can decide. All 23 occurrences today are directives, so any count is
 * right until someone writes the other form.
 *
 * File counts have no such split: a path either matches the glob or it does
 * not. `rules/quality.md § 導出可能記述は人手で書かない` calls for either a
 * check that derives the value or no value at all — this makes the first one
 * possible.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Suffixes a test file can have. */
export const TEST_FILE_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

/** Directory names never searched. */
export const SKIPPED_DIRS = new Set(['node_modules', '.next', '.turbo', 'dist', '.vitest-dist']);

/**
 * How many entries the walk may look at before giving up.
 *
 * A dependency tree is large enough that scanning one turns a wrong skip list
 * into a hang rather than a failure: dropping `node_modules` from
 * `SKIPPED_DIRS` made the check run for minutes instead of failing (measured).
 * A hang cannot be read as "the skip list is wrong", so bound the walk and say
 * what went wrong. The examples' own trees are three orders of magnitude below
 * this (the largest returns 14 files).
 */
export const MAX_ENTRIES_SCANNED = 20000;

/**
 * Test files under `dir`, as paths relative to it, sorted.
 *
 * @throws when the walk exceeds {@link MAX_ENTRIES_SCANNED}.
 * @returns {string[]}
 */
export function listTestFiles(dir, io = {}) {
  const readdir = io.readdirSync ?? readdirSync;
  const stat = io.statSync ?? statSync;
  const found = [];
  let scanned = 0;
  const walk = (current, prefix) => {
    let entries;
    try {
      entries = readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      scanned += 1;
      if (scanned > MAX_ENTRIES_SCANNED) {
        throw new Error(
          `${dir} の走査が ${MAX_ENTRIES_SCANNED} entry を超えた。` +
            ' SKIPPED_DIRS が実際の tree と噛み合っていない可能性がある',
        );
      }
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      const abs = join(current, entry.name);
      // `withFileTypes` reports a symlink as neither file nor directory, so ask
      // for the target: a linked `tests/` dir holds test files like any other.
      const isDir = entry.isDirectory() || (entry.isSymbolicLink() && isDirectory(abs, stat));
      if (isDir) {
        if (!SKIPPED_DIRS.has(entry.name)) walk(abs, rel);
        continue;
      }
      if (TEST_FILE_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) found.push(rel);
    }
  };
  walk(dir, '');
  // 並びを固定するのは、返り値を一覧として比べる呼出のため。 件数だけを見る呼出には
  // 効かない。 **この repo の filesystem (APFS) は readdir が既に整列した並びを返す**ため、
  // ここを外しても手元の検査は 1 件も落ちない (実測)。 ext4 のように hash 順を返す
  // filesystem で意味を持つ。
  return found.sort();
}

function isDirectory(path, stat) {
  try {
    return stat(path).isDirectory();
  } catch {
    return false;
  }
}

/** The line a spec uses to state how many files the search covered. */
export const SEARCHED_FILES_PATTERN = /^- 探索した test file — (\d+) 件/m;

/**
 * The count a spec states, or `null` when it does not state one.
 *
 * @returns {number | null}
 */
export function statedFileCount(specMarkdown) {
  const hit = SEARCHED_FILES_PATTERN.exec(specMarkdown);
  return hit ? Number.parseInt(hit[1], 10) : null;
}
