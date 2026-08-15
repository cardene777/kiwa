// Adapter が掘る一時 dir を `@kiwa-lab/core` の `createManagedTempDir` に一本化させる軸
// (Issue #1926)。
//
// `node:fs` の `mkdtemp` / `mkdtempSync` を直接呼ぶと、 掘った dir が `kiwa-` 名前空間に
// 入らず、 異常終了 (crash / Ctrl-C / SIGKILL / OOM) で残った時に誰も回収しない。 後始末は
// `finally` と `dispose` にしか無いので、 そこへ到達しない終わり方が丸ごと漏れる。
//
// 同じ形の事故は #1866 で起きている。 `shared-addresses` の一時 dir が 2 日で 146G 積み、
// ディスクが 3 回満杯になった。 あの時は 1 系統を直したが、 直接呼出が残っている限り
// 次の adapter が同じ入口を作れてしまう。 規範ではなく機械で塞ぐ。
//
// 落ちた時の直し方は 1 つ。 `createManagedTempDir({ label })` に置き換える。 名前空間と
// 次回起動時の回収が付いてくる。
//
// 対象外。
//   - `packages/core/src/temp.ts` = 名前空間の実装そのもの。 ここだけが直接呼ぶ
//   - test file = 一時 dir の寿命が test 内で閉じており、 runner が後始末する
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const PACKAGES_DIR = resolve(REPO_ROOT, 'packages');

/** 名前空間の実装。 ここだけは直接 `mkdtemp` を呼ぶ。 */
const IMPLEMENTATION = 'core/src/temp.ts';

/**
 * `mkdtemp` の入手経路を拾う。
 *
 * import 名は変えられる (`import { mkdtemp as mk }`) ので呼出側だけでは漏れる。 一方
 * `node:fs` を namespace で取る形 (`import * as fs`) や `require` / dynamic import では
 * import 行に `mkdtemp` が現れない。 そこで **入手と呼出の両方** を見る。
 *
 * 静的解析なので、 変数に詰め替える形 (`const f = fs['mkdtemp' + '']`) までは追えない。
 * 追える範囲を広げる方向でしか塞げない領域なので、 実在した形を順に足していく。
 */
const PATTERNS: ReadonlyArray<{ label: string; re: RegExp }> = [
  // `import { mkdtemp } from 'node:fs'` / `... from 'fs/promises'`
  // bare `fs` も受ける = `node:` 付きだけを見ていると `from 'fs'` が素通りする。
  {
    label: 'named import',
    re: /import\s*\{[^}]*\bmkdtemp(Sync)?\b[^}]*\}\s*from\s*['"](node:)?fs(\/promises)?['"]/,
  },
  // `require('node:fs').mkdtempSync` / `const { mkdtemp } = require('fs')`
  { label: 'require', re: /require\s*\(\s*['"](node:)?fs(\/promises)?['"]\s*\)/ },
  // `await import('node:fs')`
  { label: 'dynamic import', re: /import\s*\(\s*['"](node:)?fs(\/promises)?['"]\s*\)/ },
  // `fs.mkdtempSync(...)` — namespace / default import 経由の呼出
  { label: 'member call', re: /\.\s*mkdtemp(Sync)?\s*\(/ },
];

/**
 * fs を取るだけでは違反にならない形。 `mkdtemp` の言及が別に要る。
 *
 * `member call` もここに入れる。 `.mkdtempSync(` は receiver を見ないため、 fs と
 * 無関係な object の同名 method まで拾う。 receiver を binding まで追うには字句解析が
 * 要るので、 **同じ file が fs を取っていること** を条件にして絞る。
 */
const FS_ACCESS_REQUIRED = new Set(['require', 'dynamic import', 'member call']);
const MKDTEMP_MENTION = /\bmkdtemp(Sync)?\b/;
const FS_MODULE_ACCESS = /(from\s*['"]|require\s*\(\s*['"]|import\s*\(\s*['"])(node:)?fs(\/promises)?['"]/;

/** 走査する拡張子。 実行される source すべて。 */
const SOURCE_EXTENSIONS = ['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs'];

/** `packages/<name>/` 直下で走査する dir。 */
const SCANNED_SUBDIRS = ['src', 'scripts'];

// `packages/<name>/src` 配下の `.ts` を集める (test file は除く)。
// 注 = block comment に `packages/*` と `/src` を続けて書くと comment が途中で閉じる。
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      collectSourceFiles(full, out);
      continue;
    }
    if (!SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) continue;
    if (entry.includes('.test.') || entry.includes('.spec.')) continue;
    out.push(full);
  }
  return out;
}

/**
 * comment を落とす。
 *
 * 本文の comment に `mkdtemp` と書いただけで落とすと、 なぜ直接呼んではいけないかを
 * 説明する comment が書けなくなる (この file 自身がそう)。 文字列 literal は残す =
 * `require('node:fs')` の引数は literal なので、 落とすと検出できない。
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

/**
 * 文字列 literal の中身を落とす。
 *
 * 検出規則そのものを説明する source (この file がそう) は、 文字列に `import { mkdtemp }
 * from 'node:fs'` を持つ。 中身を残すと、 説明を書いただけで違反になる。
 *
 * **import / require の指定子は残す**。 module 名は文字列 literal なので、 丸ごと落とすと
 * 何も検出できなくなる。 `from` / `require(` / `import(` の直後だけを残す。
 */
function stripStringLiterals(source: string): string {
  return source.replace(
    /(from\s*|require\s*\(\s*|import\s*\(\s*)?(['"`])(?:\\.|(?!\2)[\s\S])*\2/g,
    (match, keyword: string | undefined) => (keyword === undefined ? '""' : match),
  );
}

function violationOf(source: string): string | null {
  const code = stripStringLiterals(stripComments(source));
  const mentionsMkdtemp = MKDTEMP_MENTION.test(code);
  const touchesFs = FS_MODULE_ACCESS.test(code);
  for (const { label, re } of PATTERNS) {
    if (!re.test(code)) continue;
    // fs を取るだけの形と、 receiver を追えない member call は、 その file が
    // 実際に `mkdtemp` を使い、 かつ fs を取っている時にだけ違反とみなす。
    if (FS_ACCESS_REQUIRED.has(label) && !(mentionsMkdtemp && touchesFs)) continue;
    return label;
  }
  return null;
}

function findDirectMkdtempUsage(): string[] {
  const offenders: string[] = [];
  let packageNames: string[];
  try {
    packageNames = readdirSync(PACKAGES_DIR);
  } catch {
    return offenders;
  }

  for (const name of packageNames) {
    for (const subdir of SCANNED_SUBDIRS) {
      for (const file of collectSourceFiles(join(PACKAGES_DIR, name, subdir))) {
        const rel = relative(PACKAGES_DIR, file);
        if (rel === IMPLEMENTATION) continue;
        const label = violationOf(readFileSync(file, 'utf8'));
        if (label !== null) offenders.push(`${rel} (${label})`);
      }
    }
  }
  return offenders;
}

describe('一時 dir は core の名前空間を通す (#1926)', () => {
  it('走査対象の source file を実際に拾えている', () => {
    // 拾えていない状態で「違反 0 件」 になると、 検査していないのに緑になる。
    // #1821 で実際に踏んだ形なので、 分母が非空であることを先に固定する。
    const total = readdirSync(PACKAGES_DIR).flatMap((name) =>
      SCANNED_SUBDIRS.flatMap((subdir) => collectSourceFiles(join(PACKAGES_DIR, name, subdir))),
    );
    expect(total.length).toBeGreaterThan(100);
  });

  it('scripts 配下も走査に入っている', () => {
    // `src` だけを見ていた間、 `perf-harness/scripts/reference-op-probe.mjs` の
    // 直接呼出が検査を素通りしていた (#1927 review)。
    const scripts = readdirSync(PACKAGES_DIR).flatMap((name) =>
      collectSourceFiles(join(PACKAGES_DIR, name, 'scripts')),
    );
    expect(scripts.length).toBeGreaterThan(0);
  });

  it('名前空間の実装が実在する', () => {
    // 除外 1 件が実体を失うと、 除外だけが残って検査の意味が変わる。
    expect(() => readFileSync(join(PACKAGES_DIR, IMPLEMENTATION), 'utf8')).not.toThrow();
  });

  it('検出規則が 4 経路すべてを拾う', () => {
    // 規則を緩めた時にここが落ちる。 実 file を用意せず、 規則そのものを固定する。
    expect(violationOf("import { mkdtempSync } from 'node:fs';")).toBe('named import');
    expect(violationOf("const { mkdtemp } = require('node:fs/promises');")).toBe('require');
    expect(violationOf("const fs = await import('fs'); fs.mkdtempSync(x);")).not.toBeNull();
    expect(violationOf("import * as fs from 'node:fs'; fs.mkdtempSync(x);")).toBe('member call');
    // `node:` の付かない bare 指定子も検出する。
    expect(violationOf("import { mkdtempSync } from 'fs';")).toBe('named import');
    expect(violationOf("const { mkdtemp } = require('fs/promises');")).toBe('require');
  });

  it('検出規則が正当な code を誤検出しない', () => {
    // comment に書いただけ。
    expect(violationOf('// mkdtemp を直接呼ばない')).toBeNull();
    expect(violationOf('/* import { mkdtempSync } from "node:fs" は禁止 */')).toBeNull();
    // 文字列 literal に規則を書いただけ (この test file 自身がその形)。
    expect(violationOf('const rule = "import { mkdtempSync } from \'node:fs\'";')).toBeNull();
    // fs を mkdtemp 以外で使う形。
    expect(violationOf("const { readFile } = require('node:fs/promises');")).toBeNull();
    // fs と無関係な object の同名 method。
    expect(violationOf('await client.mkdtempSync(x);')).toBeNull();
  });

  it('packages の src と scripts が mkdtemp を直接使わない', () => {
    const offenders = findDirectMkdtempUsage();
    expect(
      offenders,
      `直接 mkdtemp を使っている file がある。 @kiwa-lab/core の createManagedTempDir に置き換える:\n` +
        offenders.map((path) => `  packages/${path}`).join('\n'),
    ).toEqual([]);
  });
});
