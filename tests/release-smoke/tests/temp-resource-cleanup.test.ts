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
 * `mkdtemp` の入手経路を、TypeScript の parser が作る AST で判定する。
 *
 * **手書きの走査はやめた** (#1927 の Round 2 / 3 / 4)。 comment ・ 文字列 ・ template の
 * 展開式 ・ 正規表現 literal ・ 除算との区別を自前で扱う形は 3 round 連続で fix 由来の
 * 欠陥を出し、 severity が下がらなかった。 `rules/quality.md § Round 収束判定` の暴走
 * signal (同一 root cause 3 連続 / 同じ箇所を 3 round / 検証済 scope が広がらない) が
 * 揃ったため、 round を重ねずに設計へ戻している。
 *
 * parser に委ねると、 これらの区別は言語仕様の側が持つ。 判定に残るのは「どの node を
 * 違反とみなすか」 だけになる。
 *
 * 追えない範囲は変わらず残る。 変数への詰め替え (`const f = fs.mkdtempSync; f(x)`) と
 * 計算した property 名 (`fs['mkdtemp' + 'Sync']`) は、 到達可能性の解析が要るため
 * 対象外。 この境界は意図的で、 塞ぐなら別 layer (実行時の検査) の仕事になる。
 */
const MKDTEMP_NAMES = new Set(['mkdtemp', 'mkdtempSync']);

/** `node:fs` / `fs` / それぞれの `/promises`。 */
function isFsSpecifier(text: string): boolean {
  return /^(node:)?fs(\/promises)?$/.test(text);
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

/**
 * comment を落とす。
 *
 * 本文の comment に `mkdtemp` と書いただけで落とすと、 なぜ直接呼んではいけないかを
 * 説明する comment が書けなくなる (この file 自身がそう)。 文字列 literal は残す =
 * `require('node:fs')` の引数は literal なので、 落とすと検出できない。
 */
function violationOf(source: string): string | null {
  const sourceFile = ts.createSourceFile(
    'probe.ts',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );

  /** fs を名前空間 / 既定 import で束ねた識別子。 member call の receiver 判定に使う。 */
  const fsBindings = new Set<string>();
  let touchesFs = false;
  let usesMkdtempName = false;
  let namedImport = false;
  const memberCalls: ts.PropertyAccessExpression[] = [];

  const visit = (node: ts.Node): void => {
    // `import ... from 'node:fs'`
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (isFsSpecifier(node.moduleSpecifier.text)) {
        touchesFs = true;
        const bindings = node.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            // `import { mkdtemp as mk }` は `propertyName` 側が元の名前。
            const imported = element.propertyName?.text ?? element.name.text;
            if (MKDTEMP_NAMES.has(imported)) namedImport = true;
          }
        }
        if (bindings && ts.isNamespaceImport(bindings)) fsBindings.add(bindings.name.text);
        if (node.importClause?.name) fsBindings.add(node.importClause.name.text);
      }
    }

    // `require('node:fs')` / `await import('fs')`
    if (ts.isCallExpression(node)) {
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const arg = node.arguments[0];
      if ((isRequire || isDynamicImport) && arg && ts.isStringLiteral(arg) && isFsSpecifier(arg.text)) {
        touchesFs = true;
      }
    }

    // `const { mkdtemp } = require('fs')` / `const fs = require('fs')`
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const init = ts.isAwaitExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      const fromFs =
        ts.isCallExpression(init) &&
        init.arguments[0] !== undefined &&
        ts.isStringLiteral(init.arguments[0]) &&
        isFsSpecifier(init.arguments[0].text);
      if (fromFs) {
        if (ts.isIdentifier(node.name)) fsBindings.add(node.name.text);
        if (ts.isObjectBindingPattern(node.name)) {
          for (const element of node.name.elements) {
            const bound = element.propertyName ?? element.name;
            if (ts.isIdentifier(bound) && MKDTEMP_NAMES.has(bound.text)) usesMkdtempName = true;
          }
        }
      }
    }

    // `fs.mkdtempSync(...)` — receiver が fs の binding である時だけ違反にする。
    if (ts.isPropertyAccessExpression(node) && MKDTEMP_NAMES.has(node.name.text)) {
      memberCalls.push(node);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (namedImport) return 'named import';

  for (const access of memberCalls) {
    // `require('fs').mkdtempSync(...)` のように receiver が式そのものの形も受ける。
    const receiver = access.expression;
    const receiverIsFsBinding = ts.isIdentifier(receiver) && fsBindings.has(receiver.text);
    const receiverIsFsCall =
      ts.isCallExpression(receiver) &&
      receiver.arguments[0] !== undefined &&
      ts.isStringLiteral(receiver.arguments[0]) &&
      isFsSpecifier(receiver.arguments[0].text);
    if (receiverIsFsBinding || receiverIsFsCall) return 'member call';
  }

  if (usesMkdtempName && touchesFs) return 'require';

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
    // 正規表現 literal に検出規則を書いただけ (#1927 Round 3)。
    expect(violationOf('const re = /import { mkdtempSync } from "node:fs"/;')).toBeNull();
    // 文字列の中の `//` が後続の行を食わない (#1927 Round 3)。
    expect(violationOf("const url = 'https://example.com';\nconst x = 1;")).toBeNull();
  });

  it('正規表現と除算の区別が文脈で決まる', () => {
    // 手書きの走査は直前 1 文字で判定していたため、この 2 形を取り違えた (#1927 Round 4)。
    expect(violationOf('function f() { return /import { mkdtempSync } from "node:fs"/; }')).toBeNull();
    expect(
      violationOf("let x = 1, y = 2; x++ / y; import { mkdtempSync } from 'node:fs';"),
    ).toBe('named import');
  });

  it('template の入れ子と展開式内の文字列で判定が崩れない', () => {
    // `${}` を波括弧の数だけで切ると、文字列内の `}` で式が終わった扱いになる (#1927 Round 4)。
    expect(
      violationOf('import * as fs from "node:fs";\nconst p = `${"}"; fs.mkdtempSync(x)}`;'),
    ).toBe('member call');
    // 入れ子 template の literal 部分は実行されない。
    expect(violationOf('const s = `${`fs.mkdtempSync(x)`}`;')).toBeNull();
  });

  it('文字列を消しても template の展開式は残す', () => {
    // `${...}` の中は実行される。 literal ごと落とすと直接呼出を見逃す (#1927 Round 3)。
    expect(
      violationOf("import * as fs from 'node:fs';\nconst p = `${fs.mkdtempSync(x)}`;"),
    ).toBe('member call');
  });

  it('文字列の中の // が後続の import を隠さない', () => {
    // comment 除去を先に走らせると、 文字列内の `//` が行末まで食い、
    // その後ろにある本物の import が消えていた (#1927 Round 3)。
    expect(
      violationOf("const url = 'https://example.com'; import { mkdtempSync } from 'node:fs';"),
    ).toBe('named import');
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
