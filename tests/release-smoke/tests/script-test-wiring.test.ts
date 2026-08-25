// Every `scripts/*.test.mjs` is enumerated by a script, and they all pass (#2217).
//
// Four of the thirteen were reachable from no `package.json` script at all —
// 137 checks that nothing ran. One of them had been red since #1957 added an
// import the fixture never copied, and nothing said so, because saying so
// requires running it.
//
// The enumeration is by name rather than by glob on purpose: a half-written
// test file dropped into `scripts/` would otherwise become mandatory the moment
// it lands. Naming them means the list can fall behind, so this axis compares
// the list to the directory.
import { execFile } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

/** The `scripts/*.test.mjs` files that exist. */
function testFilesOnDisk(): string[] {
  return readdirSync(join(REPO_ROOT, 'scripts'))
    .filter((name) => name.endsWith('.test.mjs'))
    .map((name) => `scripts/${name}`)
    .sort();
}

/** Every `scripts/*.test.mjs` any root script hands to a test runner. */
function testFilesEnumerated(): string[] {
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8')) as {
    scripts?: Record<string, string>;
  };
  const found = new Set<string>();
  for (const script of Object.values(manifest.scripts ?? {})) {
    for (const match of script.matchAll(/scripts\/[\w.-]+\.test\.mjs/g)) found.add(match[0]);
  }
  return [...found].sort();
}

/**
 * `node --test` の集計行から件数を読む。
 *
 * 既定 reporter は `ℹ pass 395`、tap reporter は `# pass 395` を出す。 片方だけを
 * 見ると reporter が変わった日に「読めない」 が「0 件」 に化ける。 読めない時は
 * throw する = 0 に倒すと「1 件も走っていない」 と区別できない。
 */
export function summaryCount(stdout: string, label: string): number {
  const match = stdout.match(new RegExp(`^[ℹ#]\\s*${label}\\s+(\\d+)\\s*$`, 'm'));
  if (!match) throw new Error(`"${label}" の集計行が出力に無い:\n${stdout.slice(-800)}`);
  return Number(match[1]);
}

describe('scripts の test が起動経路に載っている (#2217)', () => {
  it('T-SW-001 disk にある test file は全て script から列挙されている', () => {
    const onDisk = testFilesOnDisk();
    expect(onDisk.length, 'scripts/*.test.mjs を 1 件も拾えていない (検査が空振り)').toBeGreaterThan(5);

    const enumerated = testFilesEnumerated();
    const orphans = onDisk.filter((f) => !enumerated.includes(f));
    expect(orphans, `どの script からも起動されない test file がある: ${orphans.join(', ')}`).toEqual([]);
  });

  it('T-SW-002 列挙されているのに存在しない file が無い', () => {
    const onDisk = testFilesOnDisk();
    const enumerated = testFilesEnumerated();
    expect(enumerated.length, 'script が test file を 1 件も列挙していない (検査が空振り)').toBeGreaterThan(5);

    const missing = enumerated.filter((f) => !onDisk.includes(f));
    expect(missing, `列挙されているが存在しない: ${missing.join(', ')}`).toEqual([]);
  });

  it('T-SW-003 列挙された test が全て通る', async () => {
    // 実際に走らせる。 「列挙されている」 と「通る」 は別で、#2217 が見つけた 1 件は
    // 列挙さえされていれば 8 ヶ月前に落ちていた。
    const { stdout } = await execFileAsync('pnpm', ['test:scripts'], {
      cwd: REPO_ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
    expect(summaryCount(stdout, 'pass'), 'test が 1 件も走っていない (検査が空振り)').toBeGreaterThan(100);
    expect(summaryCount(stdout, 'fail'), `scripts の test が落ちている:\n${stdout.slice(-2000)}`).toBe(0);
  }, 300_000);

  it('T-SW-004 集計行を読めない時は 0 件に倒さず throw する', () => {
    // 実 run では reporter が必ず集計行を出すので、この分岐には実物の入力が無い。
    // 0 件に倒す形にすると「1 件も走っていない」 と「読めなかった」 が同じになり、
    // 上の下限 assert がどちらの理由で落ちたか読み手に伝わらなくなる。
    expect(summaryCount('ℹ pass 395\nℹ fail 0\n', 'pass')).toBe(395);
    expect(summaryCount('# pass 12\n# fail 0\n', 'pass'), 'tap reporter の形を読めない').toBe(12);
    expect(() => summaryCount('走ったが集計行が無い\n', 'pass')).toThrow(/集計行が出力に無い/);
    // 数字を伴わない行に引きずられない。
    expect(() => summaryCount('ℹ pass\n', 'pass')).toThrow(/集計行が出力に無い/);
  });
});
