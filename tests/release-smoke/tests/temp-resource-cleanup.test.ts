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
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const PACKAGES_DIR = resolve(REPO_ROOT, 'packages');

/** 名前空間の実装。 ここだけは直接 `mkdtemp` を呼ぶ。 */
const IMPLEMENTATION = 'core/src/temp.ts';

/**
 * 判定は TypeScript の parser が作る AST で行う。
 *
 * 手書きの走査 (comment / 文字列 / template / 正規表現 / 除算の区別を自前で扱う形) は
 * 収束しなかった。 これらの区別は言語仕様の側が持つもので、 こちらで再実装する対象では
 * ない。
 */
const MKDTEMP_NAMES = new Set(['mkdtemp', 'mkdtempSync']);

/** `node:fs` / `fs` / それぞれの `/promises`。 */
function isFsSpecifier(text: string): boolean {
  return /^(node:)?fs(\/promises)?$/.test(text);
}

/**
 * 判定は 1 つの規則に縮めてある。
 *
 * **「fs module を取っている」 かつ「`mkdtemp` を名前として参照している」 なら違反**。
 * receiver がどの binding を指すかは追わない。
 *
 * 経路ごとに receiver を解決する形は収束しなかった (#1927 の Round 2-5、 MAJOR が
 * 1 → 2 → 3 → 4 と増えた)。 `(await import('fs')).mkdtempSync()` の unwrap、 scope を
 * 跨ぐ shadowing、 `makeClient('fs')` の provenance、 JSX の parse と、 receiver を正確に
 * 解決しようとするたびに別の穴が開いた。 正確な解決には型検査器 (`ts.Program` と symbol
 * 解決) が要り、 release-smoke の 1 軸が負う重さではない。
 *
 * 縮めた規則は receiver を見ないので、 これらの分岐がまとめて消える。
 *
 * **受け入れる誤検出**。 fs を別用途で import している file が、 無関係な object の
 * `mkdtempSync` を呼ぶ形は違反になる。 実在せず、 起きても直し方は自明 (`@kiwa-lab/core`
 * に寄せるか名前を変える) なので受け入れる。
 *
 * **追えない範囲**。 変数への詰め替え (`const f = fs.mkdtempSync; f(x)`) は `mkdtemp` を
 * 名前として参照するため捕まるが、 計算した property 名 (`fs['mkdtemp' + 'Sync']`) は
 * 参照が文字列に化けるため捕まらない。 到達可能性の解析が要る領域で、 塞ぐなら実行時の
 * 検査という別 layer の仕事になる。
 */
function scanSource(source: string, fileName: string): { violation: boolean; parseErrors: number } {
  // **実 file 名で parse する**。 `.tsx` を `.ts` として読むと JSX が構文誤りになり、
  // member access が AST から消えて「違反 0 件」 に化ける (#1927 Round 5)。
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);

  // parse できなかった file を素通しすると、 検査していないのに緑になる。
  const parseErrors = (sourceFile as unknown as { parseDiagnostics?: unknown[] }).parseDiagnostics
    ?.length ?? 0;

  let touchesFs = false;
  let referencesMkdtemp = false;

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (isFsSpecifier(node.moduleSpecifier.text)) touchesFs = true;
    }

    // `import fs = require('node:fs')` (TypeScript の import-equals)。
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression) &&
      isFsSpecifier(node.moduleReference.expression.text)
    ) {
      touchesFs = true;
    }

    // `require('fs')` / `module.require('fs')` / `import('fs')`。
    //
    // **callee を確かめる** = 第 1 引数が `'fs'` の任意の呼出を fs access とみなすと
    // `makeClient('fs')` が引っかかる (#1927 Round 5)。 一方 `require` は素の識別子とも
    // property とも書けるため、両方を受ける (#1927 Round 6)。
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isRequire =
        (ts.isIdentifier(callee) && callee.text === 'require') ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === 'require');
      const isDynamicImport = callee.kind === ts.SyntaxKind.ImportKeyword;
      const arg = node.arguments[0];
      if ((isRequire || isDynamicImport) && arg && ts.isStringLiteral(arg) && isFsSpecifier(arg.text)) {
        touchesFs = true;
      }
    }

    // 名前としての参照。 comment と文字列は Identifier にならないため自然に外れる。
    if (ts.isIdentifier(node) && MKDTEMP_NAMES.has(node.text)) referencesMkdtemp = true;

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return { violation: touchesFs && referencesMkdtemp, parseErrors };
}

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

/** test から規則そのものを固定するための入口。 file 名は既定で `.ts` 相当。 */
function violationOf(source: string, fileName = 'probe.ts'): string | null {
  const { violation } = scanSource(source, fileName);
  return violation ? 'direct mkdtemp' : null;
}

function findDirectMkdtempUsage(): { offenders: string[]; unparsed: string[] } {
  const offenders: string[] = [];
  const unparsed: string[] = [];
  let packageNames: string[];
  try {
    packageNames = readdirSync(PACKAGES_DIR);
  } catch {
    return { offenders, unparsed };
  }

  for (const name of packageNames) {
    for (const subdir of SCANNED_SUBDIRS) {
      for (const file of collectSourceFiles(join(PACKAGES_DIR, name, subdir))) {
        const rel = relative(PACKAGES_DIR, file);
        if (rel === IMPLEMENTATION) continue;
        const { violation, parseErrors } = scanSource(readFileSync(file, 'utf8'), file);
        // parse できない file を素通しすると、 検査していないのに緑になる。
        if (parseErrors > 0) unparsed.push(rel);
        if (violation) offenders.push(rel);
      }
    }
  }
  return { offenders, unparsed };
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

  it('検出規則が fs 経由の入手を経路によらず拾う', () => {
    // 規則を緩めた時にここが落ちる。 実 file を用意せず、 規則そのものを固定する。
    expect(violationOf("import { mkdtempSync } from 'node:fs';")).toBe('direct mkdtemp');
    expect(violationOf("import { mkdtemp as mk } from 'fs';")).toBe('direct mkdtemp');
    expect(violationOf("const { mkdtemp } = require('node:fs/promises');")).toBe('direct mkdtemp');
    expect(violationOf("import * as fs from 'node:fs'; fs.mkdtempSync(x);")).toBe('direct mkdtemp');
    expect(violationOf("const fs = require('fs'); fs.mkdtempSync(x);")).toBe('direct mkdtemp');
    expect(violationOf("require('fs').mkdtempSync(x);")).toBe('direct mkdtemp');
    // receiver を追わないので、 括弧や await で包まれた形も同じに落ちる (#1927 Round 5)。
    expect(violationOf("const p = (await import('fs')).mkdtempSync(x);")).toBe('direct mkdtemp');
    // 変数へ詰め替える形も、 名前として参照するため捕まる。
    expect(violationOf("import * as fs from 'fs'; const f = fs.mkdtempSync; f(x);")).toBe(
      'direct mkdtemp',
    );
    // `require` は素の識別子とも property とも書ける (#1927 Round 6)。
    expect(violationOf("module.require('fs').mkdtempSync(x);")).toBe('direct mkdtemp');
    // TypeScript の import-equals。
    expect(violationOf("import fs = require('node:fs');\nfs.mkdtempSync(x);")).toBe(
      'direct mkdtemp',
    );
  });

  it('検出規則が正当な code を誤検出しない', () => {
    // comment / 文字列 / template の literal 部分 / 正規表現 literal は Identifier に
    // ならないため、 parser の側で自然に外れる。
    expect(violationOf('// mkdtemp を直接呼ばない')).toBeNull();
    expect(violationOf('/* import { mkdtempSync } from "node:fs" は禁止 */')).toBeNull();
    expect(violationOf('const rule = "import { mkdtempSync } from \'node:fs\'";')).toBeNull();
    expect(violationOf('const s = `${`fs.mkdtempSync(x)`}`;')).toBeNull();
    expect(violationOf('const re = /import { mkdtempSync } from "node:fs"/;')).toBeNull();
    // fs を mkdtemp 以外で使う形。
    expect(violationOf("const { readFile } = require('node:fs/promises');")).toBeNull();
    // fs を取っていない file の同名 method。
    expect(violationOf('await client.mkdtempSync(x);')).toBeNull();
    // 第 1 引数が 'fs' なだけの呼出を fs access とみなさない (#1927 Round 5)。
    expect(violationOf("const x = makeClient('fs'); x.mkdtempSync(y);")).toBeNull();
  });

  it('.tsx は実 file 名で parse され、構文誤りにならない', () => {
    // 判定そのものは識別子の有無で決まるため、`.ts` として読んでも検出はできる。
    // file 名が効くのは parse 誤りの側で、誤りが出ると「走査した file をすべて parse
    // できている」 が落ちる = 実 repo に `.tsx` が入った瞬間に検査が止まる (#1927 Round 5)。
    const source = "import * as fs from 'node:fs';\nconst el = <W make={fs.mkdtempSync(x)} />;";

    expect(scanSource(source, 'probe.tsx').parseErrors).toBe(0);
    expect(scanSource(source, 'probe.ts').parseErrors).toBeGreaterThan(0);

    // どちらで読んでも違反判定は変わらない (規則が receiver を追わないため)。
    expect(violationOf(source, 'probe.tsx')).toBe('direct mkdtemp');
  });

  it('走査した file をすべて parse できている', () => {
    // parse に失敗した file を素通しすると、 検査していないのに緑になる。
    const { unparsed } = findDirectMkdtempUsage();
    expect(unparsed, `parse できない file がある:\n${unparsed.join('\n')}`).toEqual([]);
  });

  it('packages の src と scripts が mkdtemp を直接使わない', () => {
    const { offenders } = findDirectMkdtempUsage();
    expect(
      offenders,
      `直接 mkdtemp を使っている file がある。 @kiwa-lab/core の createManagedTempDir に置き換える:\n` +
        offenders.map((path) => `  packages/${path}`).join('\n'),
    ).toEqual([]);
  });
});
