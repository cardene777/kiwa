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
 * 束縛の種類。 `createRequire` だけは「`node:module` から来た」 ことまで覚える。
 */
type BindingKind = 'value' | 'createRequire';

/**
 * 新しい scope を開く node か。
 *
 * **file 全体で宣言を畳んではいけない** (#1929 review)。 畳むと、無関係な引数や
 * `for (const module of ...)` が 1 つあるだけで、その file 全体で ambient loader の検出が
 * 無効化される。 見逃す方向とはいえ、直接呼出が通る迂回になる。
 */
function isScopeNode(node: ts.Node): boolean {
  return (
    ts.isSourceFile(node) ||
    ts.isBlock(node) ||
    ts.isModuleBlock(node) ||
    ts.isCaseBlock(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isCatchClause(node) ||
    ts.isClassDeclaration(node) ||
    ts.isClassExpression(node) ||
    // class の static block は独立した scope で、`var` もここに閉じる。
    ts.isClassStaticBlockDeclaration(node)
  );
}

/**
 * `var` を受け止める scope か (関数と file)。
 *
 * `var` は block ではなく関数へ巻き上がる。 block scope として扱うと、
 * `function f() { { var require = custom; } require('fs') }` の shadow を見落として
 * ambient loader と誤判定する (#1929 Round 2)。
 */
function isFunctionScopeNode(node: ts.Node): boolean {
  return (
    ts.isSourceFile(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isModuleBlock(node) ||
    ts.isClassStaticBlockDeclaration(node)
  );
}

/** その変数宣言が `var` か (`let` / `const` は block scoped)。 */
function isVarDeclaration(node: ts.VariableDeclaration): boolean {
  const list = node.parent;
  if (list === undefined || !ts.isVariableDeclarationList(list)) return false;
  return (list.flags & ts.NodeFlags.BlockScoped) === 0;
}

/** binding pattern を含めて、宣言された名前を集める。 */
function collectBindingName(name: ts.BindingName, out: Map<string, BindingKind>): void {
  if (ts.isIdentifier(name)) {
    out.set(name.text, 'value');
    return;
  }
  for (const element of name.elements) {
    if (ts.isBindingElement(element)) collectBindingName(element.name, out);
  }
}

/**
 * その scope が **直接** 持つ value 束縛を集める。 入れ子の scope には降りない。
 *
 * **型だけの宣言は入れない** (#1929 review)。 型 namespace と value namespace は別なので、
 * `import type { X as require }` があっても ambient な `require` は生きている。 入れると
 * 直接呼出を通す迂回になる。
 */
function collectScopeBindings(scope: ts.Node): Map<string, BindingKind> {
  const out = new Map<string, BindingKind>();

  const declare = (node: ts.Node): void => {
    if (ts.isParameter(node)) collectBindingName(node.name, out);
    if (ts.isBindingElement(node)) collectBindingName(node.name, out);

    // value を作る宣言形。 `interface` / `type` は value を作らないので入れない。
    //
    // **関数式 / class 式は入れない** (#1929 Round 2)。 名前が束縛されるのは式自身の内側
    // だけで、親 scope からは見えない。 親に登録すると `const f = function require() {}` が
    // 外側の ambient `require` を隠し、検出が無効化される。
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name)
    ) {
      out.set(node.name.text, 'value');
    }
    if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) out.set(node.name.text, 'value');

    if (ts.isImportEqualsDeclaration(node) && !node.isTypeOnly) out.set(node.name.text, 'value');

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      if (clause && !clause.isTypeOnly) {
        const fromModule = /^(node:)?module$/.test(node.moduleSpecifier.text);
        if (clause.name) out.set(clause.name.text, 'value');
        const bindings = clause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) out.set(bindings.name.text, 'value');
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            if (element.isTypeOnly) continue;
            const imported = element.propertyName?.text ?? element.name.text;
            const kind: BindingKind =
              fromModule && imported === 'createRequire' ? 'createRequire' : 'value';
            out.set(element.name.text, kind);
          }
        }
      }
    }
  };

  // 名前付き関数式 / class 式は、自身の名前を **自分の scope に** 持つ。
  if ((ts.isFunctionExpression(scope) || ts.isClassExpression(scope)) && scope.name) {
    out.set(scope.name.text, 'value');
  }

  // scope 自身が持つ宣言 (引数 / catch の変数 / for の初期化子) を先に拾う。
  if (ts.isCatchClause(scope) && scope.variableDeclaration) declare(scope.variableDeclaration);
  const withParams = scope as ts.SignatureDeclarationBase;
  if (Array.isArray(withParams.parameters)) for (const p of withParams.parameters) declare(p);
  if (
    (ts.isForStatement(scope) || ts.isForOfStatement(scope) || ts.isForInStatement(scope)) &&
    scope.initializer &&
    ts.isVariableDeclarationList(scope.initializer)
  ) {
    for (const d of scope.initializer.declarations) declare(d);
  }

  // 直下の statement が作る宣言を拾う。 入れ子の scope には降りない。
  //
  // `var` はここでは拾わない = block ではなく関数へ巻き上がるため、下の関数 scope 側で拾う。
  const walkShallow = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && !isVarDeclaration(node)) collectBindingName(node.name, out);
    declare(node);
    if (node !== scope && isScopeNode(node)) return;
    ts.forEachChild(node, walkShallow);
  };
  ts.forEachChild(scope, walkShallow);

  // 関数 scope は、入れ子 block を越えて `var` を拾う。 停止するのは入れ子の関数だけ。
  if (isFunctionScopeNode(scope)) {
    const walkVars = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && isVarDeclaration(node)) collectBindingName(node.name, out);
      if (node !== scope && isFunctionScopeNode(node)) return;
      ts.forEachChild(node, walkVars);
    };
    ts.forEachChild(scope, walkVars);
  }

  return out;
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

  // scope stack。 innermost が末尾。
  //
  // **宣言の収集は遅延させる**。 走査対象の大半は loader 呼出を持たず、その file では
  // scope の中身を 1 度も参照しない。 先に集めると走査時間が倍になる (実測)。
  const scopes: Array<{ node: ts.Node; bindings?: Map<string, BindingKind> }> = [];

  const bindingsOf = (scope: { node: ts.Node; bindings?: Map<string, BindingKind> }) => {
    scope.bindings ??= collectScopeBindings(scope.node);
    return scope.bindings;
  };

  /** その名前が、どこかの scope で宣言されているか。 されていれば ambient ではない。 */
  const lookup = (name: string): BindingKind | undefined => {
    for (let i = scopes.length - 1; i >= 0; i -= 1) {
      const scope = scopes[i];
      if (scope === undefined) continue;
      const found = bindingsOf(scope).get(name);
      if (found !== undefined) return found;
    }
    return undefined;
  };

  /** ambient な global (`require` / `module` / `process`) として使える名前か。 */
  const isAmbient = (name: string): boolean => lookup(name) === undefined;

  /** `node:module` の `createRequire` を指す名前か。 内側 scope の shadow を尊重する。 */
  const isCreateRequire = (name: string): boolean => lookup(name) === 'createRequire';

  let touchesFs = false;
  let referencesMkdtemp = false;

  /** `module.require` / `module['require']` の形か。 */
  const isModuleRequire = (callee: ts.Expression): boolean => {
    const onModule = (expr: ts.Expression): boolean =>
      ts.isIdentifier(expr) && expr.text === 'module' && isAmbient('module');
    if (ts.isPropertyAccessExpression(callee)) {
      return onModule(callee.expression) && callee.name.text === 'require';
    }
    if (ts.isElementAccessExpression(callee)) {
      const key = callee.argumentExpression;
      return onModule(callee.expression) && ts.isStringLiteral(key) && key.text === 'require';
    }
    return false;
  };

  /**
   * module を取り出す呼出の callee か。
   *
   * 受けるのは取得側の構文が一意に決まり、**かつその名前が呼出位置で期待どおりの束縛を
   * 持つ** 形だけ。 `createRequire(...)` を変数へ詰め替えてから呼ぶ形は到達可能性の解析が
   * 要るため対象外。
   */
  const isModuleLoaderCallee = (callee: ts.Expression): boolean => {
    if (ts.isIdentifier(callee) && callee.text === 'require') return isAmbient('require');
    if (callee.kind === ts.SyntaxKind.ImportKeyword) return true;
    if (isModuleRequire(callee)) return true;
    if (ts.isCallExpression(callee) && ts.isIdentifier(callee.expression)) {
      if (isCreateRequire(callee.expression.text)) return true;
    }
    if (
      ts.isPropertyAccessExpression(callee) &&
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === 'process' &&
      isAmbient('process') &&
      callee.name.text === 'getBuiltinModule'
    ) {
      return true;
    }
    return false;
  };

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

    // module を取り出す呼出。
    //
    // **callee を確かめる** = 第 1 引数が `'fs'` の任意の呼出を fs access とみなすと
    // `makeClient('fs')` が引っかかる (#1927 Round 5)。 逆に `require` を property 名だけで
    // 見ると `schema.require('fs')` まで拾う (#1927 Round 7)。 受けるのは、取得側の構文が
    // 一意に決まる形だけに限る。
    if (ts.isCallExpression(node)) {
      const arg = node.arguments[0];
      const looksLikeFsArg = arg !== undefined && ts.isStringLiteral(arg) && isFsSpecifier(arg.text);
      if (looksLikeFsArg && isModuleLoaderCallee(node.expression)) touchesFs = true;
    }

    // 名前としての参照。 comment と文字列は Identifier にならないため自然に外れる。
    if (ts.isIdentifier(node) && MKDTEMP_NAMES.has(node.text)) referencesMkdtemp = true;

    // scope を作る node を stack に積んでから中へ入る。 宣言の中身は参照された時に集める。
    // scope 単位でまとめて集めるので、宣言より前で使う形 (巻き上げ) も取りこぼさない。
    const opensScope = isScopeNode(node);
    if (opensScope) scopes.push({ node });
    ts.forEachChild(node, visit);
    if (opensScope) scopes.pop();
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
    // module を取り出す他の形も、取得側の構文が一意なら受ける (#1927 Round 7)。
    expect(violationOf("module['require']('fs').mkdtempSync(x);")).toBe('direct mkdtemp');
    expect(
      violationOf(
        "import { createRequire } from 'node:module';\n" +
          "createRequire(import.meta.url)('fs').mkdtempSync(x);",
      ),
    ).toBe('direct mkdtemp');
    expect(violationOf("process.getBuiltinModule('fs').mkdtempSync(x);")).toBe('direct mkdtemp');
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
    // property 名が `require` なだけの呼出も同様 (#1927 Round 7)。
    expect(violationOf("schema.require('fs'); client.mkdtempSync(x);")).toBeNull();
  });

  it('名前が一致するだけの loader を fs 取得とみなさない (#1928)', () => {
    // `createRequire` は `node:module` から来た名前だけを受ける。
    expect(
      violationOf(
        "function createRequire(u) { return () => client; }\n" +
          "createRequire(import.meta.url)('fs').mkdtempSync(x);",
      ),
    ).toBeNull();
    // `module` を宣言し直している file では、それが Node の module とは限らない。
    expect(violationOf("const module = shim;\nmodule.require('fs').mkdtempSync(x);")).toBeNull();
    // `process` も同様。
    expect(
      violationOf("const process = fake;\nprocess.getBuiltinModule('fs').mkdtempSync(x);"),
    ).toBeNull();
    // `require` を宣言し直している形。
    expect(violationOf("const require = load;\nrequire('fs').mkdtempSync(x);")).toBeNull();
    // 分割代入や引数で宣言した場合も拾う。
    expect(
      violationOf("function f({ module }) { module.require('fs').mkdtempSync(x); }"),
    ).toBeNull();
  });

  it('別 scope の宣言が ambient loader の検出を無効化しない (#1929 review)', () => {
    // file 全体で宣言を畳むと、無関係な引数が 1 つあるだけで検出が止まる。
    expect(
      violationOf(
        "function unrelated(require) { return require; }\n" +
          "const fs = require('node:fs');\nfs.mkdtempSync(x);",
      ),
    ).toBe('direct mkdtemp');
    expect(
      violationOf(
        "for (const module of list) { use(module); }\n" +
          "module.require('fs').mkdtempSync(x);",
      ),
    ).toBe('direct mkdtemp');
    expect(
      violationOf(
        "try { a(); } catch (process) { log(process); }\n" +
          "process.getBuiltinModule('fs').mkdtempSync(x);",
      ),
    ).toBe('direct mkdtemp');
  });

  it('型だけの import は value の shadow にならない (#1929 review)', () => {
    // 型 namespace と value namespace は別なので、ambient な loader は生きている。
    expect(
      violationOf("import type { Require as require } from './t.js';\nrequire('fs').mkdtempSync(x);"),
    ).toBe('direct mkdtemp');
    expect(
      violationOf("import { type Require as require } from './t.js';\nrequire('fs').mkdtempSync(x);"),
    ).toBe('direct mkdtemp');
  });

  it('内側 scope の shadow を尊重する (#1929 review)', () => {
    // import した `createRequire` を内側で shadow したら、それは Node の loader ではない。
    expect(
      violationOf(
        "import { createRequire } from 'node:module';\n" +
          "function f(createRequire) { return createRequire(url)('fs').mkdtempSync(x); }",
      ),
    ).toBeNull();
    // 逆に、内側で shadow していない呼出は検出する。
    expect(
      violationOf(
        "import { createRequire } from 'node:module';\n" +
          "function f() { return createRequire(url)('fs').mkdtempSync(x); }",
      ),
    ).toBe('direct mkdtemp');
  });

  it('value を作る宣言形を shadow として扱う (#1929 review)', () => {
    // `namespace` / `enum` / named class は value を作る。
    expect(violationOf("namespace module { export const x = 1; }\nmodule.require('fs').mkdtempSync(y);")).toBeNull();
    expect(violationOf("enum process { a }\nprocess.getBuiltinModule('fs').mkdtempSync(y);")).toBeNull();
    // `interface` / `type` は value を作らないので shadow にならない。
    expect(violationOf("interface module { x: 1 }\nmodule.require('fs').mkdtempSync(y);")).toBe(
      'direct mkdtemp',
    );
  });

  it('var の巻き上げを関数 scope として扱う (#1929 Round 2)', () => {
    // `var` は block ではなく関数へ巻き上がる。 block scope 扱いだと shadow を見落とす。
    expect(
      violationOf("function f() { { var require = custom; } return require('fs').mkdtempSync(x); }"),
    ).toBeNull();
    expect(
      violationOf("function f() { for (;;) { var module = shim; } module.require('fs').mkdtempSync(x); }"),
    ).toBeNull();
    // 別の関数の `var` は巻き上がってこない。
    expect(
      violationOf("function g() { var require = custom; }\nrequire('fs').mkdtempSync(x);"),
    ).toBe('direct mkdtemp');
  });

  it('名前付き関数式 / class 式の名前が親 scope に漏れない (#1929 Round 2)', () => {
    // 名前が束縛されるのは式自身の内側だけ。 親に漏らすと検出が無効化される。
    expect(violationOf("const f = function require() {};\nrequire('fs').mkdtempSync(x);")).toBe(
      'direct mkdtemp',
    );
    expect(
      violationOf("const C = class process {};\nprocess.getBuiltinModule('fs').mkdtempSync(x);"),
    ).toBe('direct mkdtemp');
    // 式の内側では shadow として効く。
    expect(
      violationOf("const f = function require() { return require('fs').mkdtempSync(x); };"),
    ).toBeNull();
  });

  it('class の static block が var を外へ漏らさない (#1929 Round 3)', () => {
    // static block は独立した scope。 外へ漏らすと、外側の ambient loader が隠れる。
    expect(
      violationOf("class C { static { var require = custom; } }\nrequire('fs').mkdtempSync(x);"),
    ).toBe('direct mkdtemp');
    // static block の内側では shadow として効く。
    expect(
      violationOf("class C { static { var require = custom; require('fs').mkdtempSync(x); } }"),
    ).toBeNull();
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
