// Guards for the two ways a perf suite can measure without judging (Issue #1708).
//
// A perf suite that runs to completion proves nothing on its own. Two failure
// modes hide inside a green run and neither is visible from its output:
//
//   1. The suite discards `runPerf3Layer`'s return value, so a cap breach never
//      reaches an assertion. `dogfood-nats-jetstream` sat 2x over its memory cap
//      for as long as the report existed, and the suite passed every time.
//   2. The suite runs without `--expose-gc`, so `measureMemory` cannot call
//      `global.gc()` and the delta includes allocations that were about to be
//      released. The same `dogfood-nats-jetstream` op reported 215,800 B under
//      that regime and 20,555 B once GC was available — a breach that was an
//      artefact of the measurement, not of the library.
//
// Both are one-line omissions in files that otherwise look complete, which is
// exactly the shape a test catches and a reader does not.
//
// The checks parse the source rather than searching it for substrings. A
// substring check passes on `// allPassed` in a comment, on an unrelated
// variable spelled `pool`, and on a `--expose-gc` mentioned in prose — i.e. it
// accepts exactly the files it exists to reject. The fixtures at the bottom
// pin that distinction.
//
// ## What this test is for, and where it stops
//
// It catches omissions. That is the failure mode that actually happened: twelve
// suites that simply never assigned the return value, and 117 configs that
// simply never set the flag. Nobody was working around anything — the lines were
// missing and the files still looked complete.
//
// It does not resist deliberate evasion, and it is not built to. Four rounds of
// adversarial review each surfaced a new way to write the same call so the
// parser would not recognise it: an element access, then a scope-shadowed
// binding, then a template-literal key, then an import from elsewhere. Each was
// real and each is now closed, but the sequence did not converge — a source-level
// parser is chasing an open set of ways to spell the same program, and closing it
// would take full type-checker symbol resolution, which still leaves `eval`.
//
// So the boundary is drawn here deliberately. Every form that could plausibly be
// written *by accident* fails the check: destructuring, reassignment, a bare
// `return`, a `.then`, a missing `await`, a negated matcher, a helper that
// shadows the binding, a config wrapper imported from another module. Anything
// the parser cannot follow is treated as a failure, not waved through — so the
// way to break this test is to write something unusual on purpose, and at that
// point the person doing it is disabling their own safety net, which no check
// downstream of them can prevent.
//
// If a real omission ever slips past, the fix is a fixture below plus whatever
// the parser needs to see it — not a broader rewrite.
import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root
const REPO_ROOT = repoRoot(HERE);
const ROOTS = ['packages', 'examples'];

function walk(dir: string, match: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    let stat;
    try {
      // symlink は辿らない。 追跡すると循環 symlink 1 つで再帰が止まらなくなる。
      // perf の設定と測定は実 file として置かれているので、辿る必要もない。
      stat = lstatSync(full);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) out.push(...walk(full, match));
    else if (match(entry)) out.push(full);
  }
  return out;
}

function perfTestFiles(): string[] {
  return ROOTS.flatMap((root) =>
    walk(join(REPO_ROOT, root), (name) => name.endsWith('.perf.ts') || name.endsWith('.perf.tsx')),
  );
}

function perfConfigFiles(): string[] {
  return ROOTS.flatMap((root) =>
    walk(join(REPO_ROOT, root), (name) => name === 'vitest.perf.config.ts'),
  );
}

function parse(source: string, fileName: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function eachNode(node: ts.Node, visit: (n: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => eachNode(child, visit));
}

/** 括弧と型表明を剥がす。 `(f)()` や `(f as X)()` で検査を抜けられないようにする。 */
function unwrap(node: ts.Expression): ts.Expression {
  let current = node;
  for (;;) {
    if (ts.isParenthesizedExpression(current)) current = current.expression;
    else if (ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) current = current.expression;
    else if (ts.isNonNullExpression(current)) current = current.expression;
    else return current;
  }
}

/**
 * `a.b.c` / `a['b']` 形式の access を文字列にする。 それ以外は null。
 *
 * element access も辿る。 `perf['runPerf3Layer']` は `perf.runPerf3Layer` と
 * 同じ呼出で、書き分けで検査を抜けられては意味がない。
 */
function accessPath(node: ts.Expression): string | null {
  const parts: string[] = [];
  let current: ts.Expression = unwrap(node);
  for (;;) {
    if (ts.isPropertyAccessExpression(current)) {
      parts.unshift(current.name.text);
      current = unwrap(current.expression);
      continue;
    }
    if (ts.isElementAccessExpression(current)) {
      const arg = unwrap(current.argumentExpression);
      // 静的に決まらない添字は追えないので、呼出全体を不明として扱う。
      // template literal も静的なら同じ (`perf[`runPerf3Layer`]` で抜けさせない)。
      if (!ts.isStringLiteralLike(arg)) return null;
      parts.unshift(arg.text);
      current = unwrap(current.expression);
      continue;
    }
    break;
  }
  if (!ts.isIdentifier(current)) return null;
  parts.unshift(current.text);
  return parts.join('.');
}

/**
 * その識別子が指す変数宣言を、字句 scope を上に辿って探す。
 *
 * 名前の一致だけで対応付けると、別々の `it()` で同じ `r` を使っている時に、
 * 片方の検証がもう片方を通してしまう。 宣言 node 自体を鍵にする。
 *
 * 変数宣言以外の binding (引数 / catch / 関数宣言) も名前として数える。 内側で
 * 同名の引数に影を作られると、外側の未検証の変数が検証済みに見えるため。
 * 最も近い binding が変数宣言でなければ null を返す (fail-close)。
 */
function resolveDeclaration(from: ts.Node, name: string): ts.VariableDeclaration | null {
  for (let scope: ts.Node | undefined = from; scope; scope = scope.parent) {
    let hit: ts.Node | null = null;
    const scan = (node: ts.Node): void => {
      if (hit) return;
      // 別 scope に降りない。 そこの binding はここからは見えない。
      if (node !== scope && (ts.isFunctionLike(node) || ts.isBlock(node))) return;
      if (bindsName(node, name)) {
        hit = node;
        return;
      }
      node.forEachChild(scan);
    };
    // 関数 scope では引数も同じ scope の binding として見る。
    if (ts.isFunctionLike(scope)) {
      for (const param of scope.parameters) {
        if (bindsName(param, name)) {
          hit = param;
          break;
        }
      }
    }
    if (!hit) scan(scope);
    if (hit) return ts.isVariableDeclaration(hit) ? hit : null;
  }
  return null;
}

/** その node が `name` を束縛するかを返す。 分割代入の要素まで見る。 */
function bindsName(node: ts.Node, name: string): boolean {
  if (
    ts.isVariableDeclaration(node) ||
    ts.isParameter(node) ||
    ts.isBindingElement(node)
  ) {
    return declaresName(node.name, name);
  }
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
    return node.name?.text === name;
  }
  if (ts.isCatchClause(node) && node.variableDeclaration) {
    return declaresName(node.variableDeclaration.name, name);
  }
  return false;
}

function declaresName(binding: ts.BindingName, name: string): boolean {
  if (ts.isIdentifier(binding)) return binding.text === name;
  // 分割代入は「束縛はしているが変数宣言として辿れない」 ので、名前が一致すれば
  // hit させて fail-close に落とす。
  return binding.elements.some(
    (el) => ts.isBindingElement(el) && declaresName(el.name, name),
  );
}

/** 測定関数の名前。 これを import しているか否かが検査の入口になる。 */
/**
 * mock 経路の測定関数。 `allPassed` の検証を要求する対象。
 *
 * live (`runPerf3LayerLive`) は含めない。 live は env が無ければ全 op が skip され、
 * その状態を `anySkipped` で確かめるのが正しい形なので、`allPassed` を無条件に
 * 要求すると env のある環境でしか通らない test になる。 GC の要求だけは
 * 経路によらず要るので、そちらは `MEASURE_FNS_ALL` を見る。
 */
const MEASURE_FNS = new Set(['runPerf3Layer', 'runPerf3LayerStrict']);

/** GC 要求の検査対象。 mock / live どちらも memory を測るため両方を含む。 */
const MEASURE_FNS_ALL = new Set([...MEASURE_FNS, 'runPerf3LayerLive']);

/**
 * source 内で測定関数を指す識別子を集める。
 *
 * `import { runPerf3Layer as run }` の `run` や `import * as perf` の `perf.runPerf3Layer`
 * も対象にする。 別名にすれば検査を通せる、では guard にならない。
 */
function measureAliases(
  sf: ts.SourceFile,
  names: Set<string> = MEASURE_FNS,
): { direct: Set<string>; namespaces: Set<string> } {
  const direct = new Set<string>();
  const namespaces = new Set<string>();
  eachNode(sf, (node) => {
    if (!ts.isImportDeclaration(node)) return;
    const clause = node.importClause;
    if (!clause?.namedBindings) return;
    if (ts.isNamespaceImport(clause.namedBindings)) {
      namespaces.add(clause.namedBindings.name.text);
      return;
    }
    for (const el of clause.namedBindings.elements) {
      const original = (el.propertyName ?? el.name).text;
      if (names.has(original)) direct.add(el.name.text);
    }
  });
  // namespace object から取り出した alias を追う。 `const { runPerf3Layer } = perf` や
  // `const run = perf.runPerf3Layer` は普通の refactor で書かれる形で、追えないと
  // その先の呼出が検査対象から外れる。
  let grew = true;
  while (grew) {
    grew = false;
    eachNode(sf, (node) => {
      if (!ts.isVariableDeclaration(node) || !node.initializer) return;
      const init = unwrap(node.initializer);

      // `const run = perf.runPerf3Layer` / `const run = runPerf3Layer`
      if (ts.isIdentifier(node.name)) {
        if (direct.has(node.name.text)) return;
        const path = accessPath(init);
        if (path === null) return;
        const parts = path.split('.');
        const resolved =
          (parts.length === 1 && direct.has(parts[0]!)) ||
          (parts.length === 2 && namespaces.has(parts[0]!) && names.has(parts[1]!));
        if (resolved) {
          direct.add(node.name.text);
          grew = true;
        }
        return;
      }

      // `const { runPerf3Layer } = perf` / `const { runPerf3Layer: run } = perf`
      if (!ts.isObjectBindingPattern(node.name)) return;
      if (!ts.isIdentifier(init) || !namespaces.has(init.text)) return;
      for (const el of node.name.elements) {
        const original = el.propertyName ?? el.name;
        if (!ts.isIdentifier(original) || !names.has(original.text)) continue;
        if (!ts.isIdentifier(el.name) || direct.has(el.name.text)) continue;
        direct.add(el.name.text);
        grew = true;
      }
    });
  }

  return { direct, namespaces };
}

/** その呼出が測定関数の呼出かを返す。 */
function isMeasureCall(
  node: ts.CallExpression,
  aliases: { direct: Set<string>; namespaces: Set<string> },
  names: Set<string> = MEASURE_FNS,
): boolean {
  const path = accessPath(node.expression);
  if (path === null) return false;
  const parts = path.split('.');
  if (parts.length === 1) return aliases.direct.has(parts[0]!);
  if (parts.length === 2) return aliases.namespaces.has(parts[0]!) && names.has(parts[1]!);
  return false;
}

/**
 * `expect(<x>.allPassed).toBe(true)` の形で肯定的に検証されている変数宣言を集める。
 *
 * matcher まで見る。 `toBe(false)` や `.not.toBe(true)` は「判定した」 ことに
 * ならない。 対象は名前ではなく宣言 node で持つ (同名の別変数を巻き込まない)。
 */
function assertedDeclarations(sf: ts.SourceFile): Map<ts.VariableDeclaration, ts.Node> {
  const asserted = new Map<ts.VariableDeclaration, ts.Node>();
  eachNode(sf, (node) => {
    if (!ts.isCallExpression(node)) return;
    const callee = unwrap(node.expression);
    if (!ts.isIdentifier(callee) || callee.text !== 'expect') return;
    const [rawArg] = node.arguments;
    if (!rawArg) return;
    const arg = unwrap(rawArg);
    if (!ts.isPropertyAccessExpression(arg) || arg.name.text !== 'allPassed') return;
    const target = unwrap(arg.expression);
    if (!ts.isIdentifier(target)) return;

    // `expect(x.allPassed)` の外側に付く matcher chain を辿る。
    let cursor: ts.Node = node;
    let negated = false;
    let positive = false;
    while (ts.isPropertyAccessExpression(cursor.parent)) {
      const access = cursor.parent;
      const member = access.name.text;
      if (member === 'not') negated = true;
      const call = access.parent;
      if (ts.isCallExpression(call) && call.expression === access) {
        if (member === 'toBe' || member === 'toStrictEqual' || member === 'toEqual') {
          const [expected] = call.arguments;
          positive = expected !== undefined && expected.kind === ts.SyntaxKind.TrueKeyword;
        } else if (member === 'toBeTruthy') {
          positive = true;
        }
        cursor = call;
      } else {
        cursor = access;
      }
    }
    if (!positive || negated) return;
    const decl = resolveDeclaration(target, target.text);
    if (decl && !asserted.has(decl)) asserted.set(decl, node);
  });
  return asserted;
}

/**
 * 宣言のあと assertion に必ず到達するかを返す。
 *
 * 「書いてある」 と「実行される」 は別。 `if (false)` の中、呼ばれない closure、
 * 途中の `return` より後ろにある assertion は判定しない。 到達可能性そのものは
 * 静的には決まらないので、通す形を絞る = 同じ statement list に並んでいて、
 * かつ その間に制御を逸らす statement が無いことを求める。
 */
function alwaysReaches(decl: ts.VariableDeclaration, assertion: ts.Node): boolean {
  const declStatement = enclosingStatement(decl);
  const assertStatement = enclosingStatement(assertion);
  if (!declStatement || !assertStatement) return false;

  const parent = declStatement.parent;
  if (assertStatement.parent !== parent) return false;
  if (!ts.isBlock(parent) && !ts.isSourceFile(parent) && !ts.isCaseClause(parent)) return false;

  const statements: ts.NodeArray<ts.Statement> = parent.statements;
  const declIndex = statements.indexOf(declStatement);
  const assertIndex = statements.indexOf(assertStatement);
  // 宣言より前の assertion は別の値を見ている。
  if (declIndex < 0 || assertIndex <= declIndex) return false;

  // 間に制御を逸らす statement があれば、assertion に届かない実行経路がある。
  // `if (skip) return;` は同じ block に並ぶが、skip が真なら assertion は実行されない。
  for (let index = declIndex + 1; index < assertIndex; index += 1) {
    if (divertsControl(statements[index]!)) return false;
  }
  return true;
}

/** その statement が実行を先へ進めない可能性を持つか (return / throw / break / continue)。 */
function divertsControl(statement: ts.Statement): boolean {
  let diverts = false;
  const scan = (node: ts.Node): void => {
    if (diverts) return;
    // 入れ子の関数の中の return は、この statement list の制御を逸らさない。
    if (node !== statement && ts.isFunctionLike(node)) return;
    if (
      ts.isReturnStatement(node) ||
      ts.isThrowStatement(node) ||
      ts.isBreakStatement(node) ||
      ts.isContinueStatement(node)
    ) {
      diverts = true;
      return;
    }
    node.forEachChild(scan);
  };
  scan(statement);
  return diverts;
}

/** その node を含む最も内側の statement を返す。 */
function enclosingStatement(node: ts.Node): ts.Statement | null {
  for (let current: ts.Node | undefined = node; current; current = current.parent) {
    if (ts.isStatement(current)) return current;
  }
  return null;
}

/**
 * perf test source が「判定を捨てている」 かを返す。 捨てていなければ null。
 *
 * 呼出ごとに独立して見る。 file 内に 1 件でも正しい呼出があれば残りを通す、では
 * 「判定を捨てる呼出を後から足す」 経路が開いたままになる。 受け取り方を静的に
 * 追えない形 (分割代入 / 再代入 / return 直結 / `.then` 経由) はすべて不合格にする。
 * 通す形を絞るほうが、通してしまう形を数え上げるより安全に閉じられる。
 */
export function findDiscardedVerdict(source: string, fileName = 'x.perf.ts'): string | null {
  const sf = parse(source, fileName);
  const aliases = measureAliases(sf);
  const asserted = assertedDeclarations(sf);
  const problems: string[] = [];

  eachNode(sf, (node) => {
    if (!ts.isCallExpression(node) || !isMeasureCall(node, aliases)) return;

    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    // `await` を挟む形だけを許す。 測定は非同期なので、await しない受け取りは
    // Promise を検証していることになり判定が成立しない。
    let cursor: ts.Node = node;
    while (ts.isParenthesizedExpression(cursor.parent)) cursor = cursor.parent;
    if (!ts.isAwaitExpression(cursor.parent)) {
      problems.push(`L${line}: await していない`);
      return;
    }
    cursor = cursor.parent;
    while (ts.isParenthesizedExpression(cursor.parent)) cursor = cursor.parent;
    const parent = cursor.parent;
    if (!ts.isVariableDeclaration(parent) || !ts.isIdentifier(parent.name)) {
      problems.push(`L${line}: 戻り値を変数に束縛していない`);
      return;
    }
    const verdict = asserted.get(parent);
    if (!verdict) {
      problems.push(`L${line}: ${parent.name.text}.allPassed を検証していない`);
      return;
    }
    // 書いてあることと実行されることは別。 `if (false)` の中や、呼ばれない closure、
    // early return の後に置いた assertion は、あっても判定しない。 宣言と同じ
    // statement list に並んでいることを求める (条件分岐を挟んだ形は落とす)。
    if (!alwaysReaches(parent, verdict)) {
      problems.push(`L${line}: ${parent.name.text}.allPassed の検証が同じ実行経路にない`);
    }
  });

  return problems.length > 0 ? problems.join(' / ') : null;
}

/**
 * import 由来の `defineConfig` を指す名前を集める。
 *
 * 名前が `defineConfig` であることだけを見ると、同名の局所 wrapper が起点になり、
 * その中身は追えないまま合格する。 import しているものだけを認める。
 * 別名 import (`defineConfig as define`) は名前を変えただけなので認める。
 */
const CONFIG_MODULES = new Set(['vitest/config', 'vite', 'vitest/node']);

function defineConfigAliases(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  eachNode(sf, (node) => {
    if (!ts.isImportDeclaration(node)) return;
    // import 元まで見る。 名前が `defineConfig` の何かを別 module から持ってきて
    // 設定を書き換える wrapper は、中身を追えないまま合格してしまう。
    const from = node.moduleSpecifier;
    if (!ts.isStringLiteral(from) || !CONFIG_MODULES.has(from.text)) return;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) return;
    for (const el of bindings.elements) {
      const original = (el.propertyName ?? el.name).text;
      if (original === 'defineConfig') names.add(el.name.text);
    }
  });
  return names;
}

/**
 * `export default` が指す vitest config の `test` object を返す。
 *
 * file 内の任意の `defineConfig` を拾うと、使われていない decoy の設定や、
 * 2 つの config から property を寄せ集めた形が合格する。 実際に export される
 * 1 つだけを起点にする。 静的に辿れない形 (変数経由 / wrapper 関数 / spread) は
 * null を返して不合格にする。
 */
function exportedTestObject(sf: ts.SourceFile): ts.ObjectLiteralExpression | null {
  let exported: ts.Expression | null = null;
  eachNode(sf, (node) => {
    if (ts.isExportAssignment(node) && !node.isExportEquals) exported = node.expression;
  });
  if (exported === null) return null;

  const expr = unwrap(exported);
  if (!ts.isCallExpression(expr)) return null;
  const callee = unwrap(expr.expression);
  // 名前が `defineConfig` なだけの局所関数を起点にしない。 import したものである
  // ことまで確かめる (局所定義の wrapper は中身を追えない)。
  if (!ts.isIdentifier(callee) || !defineConfigAliases(sf).has(callee.text)) return null;

  const [arg] = expr.arguments;
  if (!arg || !ts.isObjectLiteralExpression(arg)) return null;
  return readObjectProperty(arg, 'test');
}

/**
 * object literal から property を読む。 spread を含む object は null を返す。
 *
 * spread は後続で上書きし得るので、直接書かれた property だけを見ると
 * 実際の値と食い違う。 同名 property の重複も同じ理由で不合格にする。
 */
function readObjectProperty(obj: ts.ObjectLiteralExpression, key: string): ts.ObjectLiteralExpression | null {
  const value = readProperty(obj, key);
  if (value === null || !ts.isObjectLiteralExpression(value)) return null;
  return value;
}

function readProperty(obj: ts.ObjectLiteralExpression, key: string): ts.Expression | null {
  const isOpaque = (p: ts.ObjectLiteralElementLike): boolean =>
    ts.isSpreadAssignment(p) ||
    ts.isGetAccessorDeclaration(p) ||
    ts.isSetAccessorDeclaration(p) ||
    ts.isMethodDeclaration(p) ||
    (p.name !== undefined && ts.isComputedPropertyName(p.name));

  const isTarget = (p: ts.ObjectLiteralElementLike): p is ts.PropertyAssignment =>
    ts.isPropertyAssignment(p) &&
    (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
    p.name.text === key;

  const matches = obj.properties.filter(isTarget);
  if (matches.length !== 1) return null;

  // object literal は後ろが勝つ。 対象より後ろに spread や computed key があると
  // 実際の値が変わり得るので読まない。 前にあるぶんには上書きされるだけなので通す
  // (`{ ...defaults, requireGc: true }` は妥当な書き方)。
  const at = obj.properties.indexOf(matches[0]!);
  for (let index = at + 1; index < obj.properties.length; index += 1) {
    if (isOpaque(obj.properties[index]!)) return null;
  }
  return matches[0]!.initializer;
}

/**
 * 測定呼出が GC を要求しているかを返す。 要求していなければ理由を返す。
 *
 * config に `--expose-gc` があっても、呼出が `requireGc: true` を渡していなければ
 * GC を呼べない実行が「memory 上限内」 として通る。 config を差し替えた実行や、
 * 別経路から起動した実行で、測れていないことが検知されない。
 */
export function findMissingRequireGc(source: string, fileName = 'x.perf.ts'): string | null {
  const sf = parse(source, fileName);
  const aliases = measureAliases(sf, MEASURE_FNS_ALL);
  const problems: string[] = [];

  eachNode(sf, (node) => {
    if (!ts.isCallExpression(node) || !isMeasureCall(node, aliases, MEASURE_FNS_ALL)) return;
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    const [rawArg] = node.arguments;
    if (!rawArg) {
      problems.push(`L${line}: 引数がない`);
      return;
    }
    const arg = unwrap(rawArg);
    if (!ts.isObjectLiteralExpression(arg)) {
      problems.push(`L${line}: 引数が object literal でない`);
      return;
    }
    const value = readProperty(arg, 'requireGc');
    if (value === null || value.kind !== ts.SyntaxKind.TrueKeyword) {
      problems.push(`L${line}: requireGc: true がない`);
    }
  });

  return problems.length > 0 ? problems.join(' / ') : null;
}

/** config が GC を呼べる形かを返す。 問題なければ null。 */
export function findMissingGcSetup(
  source: string,
  fileName = 'vitest.perf.config.ts',
): string | null {
  const sf = parse(source, fileName);
  const test = exportedTestObject(sf);
  if (test === null) {
    return 'export default の defineConfig({ test: {...} }) を静的に辿れない';
  }

  const pool = readProperty(test, 'pool');
  const isForks = pool !== null && ts.isStringLiteral(pool) && pool.text === 'forks';
  // worker_threads は execArgv を無視するため、pool を固定しないと GC 無しに戻る。
  if (!isForks) return "test.pool が 'forks' でない (execArgv が無視される)";

  const poolOptions = readObjectProperty(test, 'poolOptions');
  const forks = poolOptions === null ? null : readObjectProperty(poolOptions, 'forks');
  const execArgv = forks === null ? null : readProperty(forks, 'execArgv');
  const hasExposeGc =
    execArgv !== null &&
    ts.isArrayLiteralExpression(execArgv) &&
    execArgv.elements.some((el) => ts.isStringLiteral(el) && el.text === '--expose-gc');
  if (!hasExposeGc) return 'test.poolOptions.forks.execArgv に --expose-gc がない';
  return null;
}

const rel = (file: string) => file.slice(REPO_ROOT.length + 1);

describe('perf gate coverage (#1708)', () => {
  it('runPerf3Layer を呼ぶ suite は判定結果を assert する', () => {
    const offenders = perfTestFiles()
      .map((file) => ({ file, reason: findDiscardedVerdict(readFileSync(file, 'utf8'), file) }))
      .filter((r) => r.reason !== null)
      .map((r) => `${rel(r.file)} (${r.reason})`);

    expect(
      offenders,
      '戻り値を捨てると上限超過が assertion に届かない。`expect(result.allPassed).toBe(true)` を足す',
    ).toEqual([]);
  });

  it('測定呼出は GC を要求する', () => {
    const offenders = perfTestFiles()
      .map((file) => ({ file, reason: findMissingRequireGc(readFileSync(file, 'utf8'), file) }))
      .filter((r) => r.reason !== null)
      .map((r) => `${rel(r.file)} (${r.reason})`);

    expect(
      offenders,
      'config に --expose-gc があっても、呼出が要求していないと GC 無しの実行が ' +
        '「上限内」 として通る。`requireGc: true` を渡す',
    ).toEqual([]);
  });

  it('perf 実行は GC を呼べる形で走る', () => {
    const offenders = perfConfigFiles()
      .map((file) => ({ file, reason: findMissingGcSetup(readFileSync(file, 'utf8'), file) }))
      .filter((r) => r.reason !== null)
      .map((r) => `${rel(r.file)} (${r.reason})`);

    expect(
      offenders,
      'GC を呼べない測定は解放される一時使用まで拾い、memory 上限との比較が成立しない。' +
        "`pool: 'forks'` + `poolOptions: { forks: { execArgv: ['--expose-gc'] } }` を足す",
    ).toEqual([]);
  });
});

describe('perf gate coverage の検査自体 (#1708)', () => {
  // 文字列検索で書くと以下がすべて「合格」 になる。 呼出単位で見ないと、
  // 正しい呼出を 1 件置いて隣に判定を捨てる呼出を足す経路も開く。
  // 検査が意味を持つのはこれらを落とせる時だけなので fixture で固定する。
  const IMPORT = `import { runPerf3Layer, runPerf3LayerStrict } from '@kiwa-lab/perf-harness';\n`;

  it('判定を捨てている形を検出する', () => {
    const cases: Array<[string, string]> = [
      ['戻り値を束縛しない', `await runPerf3Layer({});`],
      ['コメントに allPassed と書いただけ', `const r = await runPerf3Layer({}); // r.allPassed`],
      ['文字列に allPassed を含むだけ', `const r = await runPerf3Layer({}); console.log('allPassed?');`],
      ['allPassed 以外を見ている', `const r = await runPerf3Layer({}); expect(r.outcomes.length).toBeGreaterThan(0);`],
      [
        '正常な呼出の隣に捨てる呼出がある',
        `const a = await runPerf3Layer({});
         expect(a.allPassed).toBe(true);
         await runPerf3Layer({});`,
      ],
      [
        '正常な呼出の隣に未検証の binding がある',
        `const a = await runPerf3Layer({});
         expect(a.allPassed).toBe(true);
         const b = await runPerf3LayerStrict({});`,
      ],
      ['分割代入で受ける', `const { outcomes } = await runPerf3Layer({}); expect(outcomes).toBeDefined();`],
      [
        '再代入で受ける',
        `let r; r = await runPerf3Layer({}); expect(r.allPassed).toBe(true);`,
      ],
      ['return に直結', `return await runPerf3Layer({});`],
      ['.then で受ける', `runPerf3Layer({}).then((r) => expect(r.allPassed).toBe(true));`],
      ['await していない', `const r = runPerf3Layer({}); expect(r.allPassed).toBe(true);`],
      ['matcher が false', `const r = await runPerf3Layer({}); expect(r.allPassed).toBe(false);`],
      ['matcher が not 経由', `const r = await runPerf3Layer({}); expect(r.allPassed).not.toBe(true);`],
      ['matcher がない', `const r = await runPerf3Layer({}); expect(r.allPassed);`],
      [
        'alias 経由で呼ぶ',
        `import { runPerf3Layer as run } from '@kiwa-lab/perf-harness';
         await run({});`,
      ],
      [
        'namespace 経由で呼ぶ',
        `import * as perf from '@kiwa-lab/perf-harness';
         await perf.runPerf3Layer({});`,
      ],
      [
        '別 scope の同名変数で通す',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         it('a', async () => {
           const r = await runPerf3Layer({});
           expect(r.allPassed).toBe(true);
         });
         it('b', async () => {
           const r = await runPerf3Layer({});
         });`,
      ],
      [
        '括弧で包んで呼ぶ',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         await (runPerf3Layer)({});`,
      ],
      [
        'namespace を element access で呼ぶ',
        `import * as perf from '@kiwa-lab/perf-harness';
         await perf['runPerf3Layer']({});`,
      ],
      [
        'namespace を template literal で呼ぶ',
        'import * as perf from \'@kiwa-lab/perf-harness\';\n' +
          'await perf[`runPerf3Layer`]({});',
      ],
      [
        '内側の引数で同名の影を作る',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         helper((r) => { expect(r.allPassed).toBe(true); });`,
      ],
      [
        '内側の分割代入で同名の影を作る',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         it('x', () => { const { r } = other; expect(r.allPassed).toBe(true); });`,
      ],
      [
        '到達しない分岐に置く',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         if (process.env.STRICT) { expect(r.allPassed).toBe(true); }`,
      ],
      [
        '呼ばれない closure に置く',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         const check = () => { expect(r.allPassed).toBe(true); };`,
      ],
      [
        'early return の後に置く',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         if (skip) return;
         if (other) { expect(r.allPassed).toBe(true); }`,
      ],
      [
        '宣言より前に置く',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         expect(r.allPassed).toBe(true);
         const r = await runPerf3Layer({});`,
      ],
      [
        '同じ block だが間に early return がある',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         if (skip) return;
         expect(r.allPassed).toBe(true);`,
      ],
      [
        '間に throw がある',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({});
         if (bad) throw new Error('x');
         expect(r.allPassed).toBe(true);`,
      ],
      [
        'namespace から分割代入で取り出す',
        `import * as perf from '@kiwa-lab/perf-harness';
         const { runPerf3Layer } = perf;
         await runPerf3Layer({});`,
      ],
      [
        'namespace から変数に代入する',
        `import * as perf from '@kiwa-lab/perf-harness';
         const run = perf.runPerf3Layer;
         await run({});`,
      ],
      [
        '分割代入で別名にする',
        `import * as perf from '@kiwa-lab/perf-harness';
         const { runPerf3Layer: run } = perf;
         await run({});`,
      ],
      [
        'loop の中で continue を挟む',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         for (const c of cases) {
           const r = await runPerf3Layer({});
           if (c.skip) continue;
           expect(r.allPassed).toBe(true);
         }`,
      ],
    ];
    for (const [label, source] of cases) {
      const body = source.includes('import ') ? source : IMPORT + source;
      expect(findDiscardedVerdict(body), label).not.toBeNull();
    }
  });

  it('判定している形は通す', () => {
    const cases: Array<[string, string]> = [
      ['素直な形', IMPORT + `const r = await runPerf3Layer({}); expect(r.allPassed).toBe(true);`],
      [
        '複数呼出を各々検証',
        IMPORT +
          `const a = await runPerf3Layer({});
           expect(a.allPassed).toBe(true);
           const b = await runPerf3LayerStrict({});
           expect(b.allPassed).toBe(true);`,
      ],
      [
        'alias 経由でも検証していれば通す',
        `import { runPerf3Layer as run } from '@kiwa-lab/perf-harness';
         const r = await run({});
         expect(r.allPassed).toBe(true);`,
      ],
      [
        'namespace 経由でも検証していれば通す',
        `import * as perf from '@kiwa-lab/perf-harness';
         const r = await perf.runPerf3Layer({});
         expect(r.allPassed).toBe(true);`,
      ],
      ['toBeTruthy でも通す', IMPORT + `const r = await runPerf3Layer({}); expect(r.allPassed).toBeTruthy();`],
      ['そもそも呼んでいない', `expect(1).toBe(1);`],
    ];
    for (const [label, source] of cases) {
      expect(findDiscardedVerdict(source), label).toBeNull();
    }
  });

  it('GC を呼べない config を検出する', () => {
    const IMP = `import { defineConfig } from 'vitest/config';\n`;
    const cases: Array<[string, string]> = [
      ['何も設定していない', IMP + `export default defineConfig({ test: { include: ['x'] } });`],
      [
        'コメントに書いただけ',
        IMP + `export default defineConfig({ test: { /* --expose-gc */ include: ['x'] } });`,
      ],
      [
        'execArgv はあるが pool が threads',
        IMP + `export default defineConfig({ test: {
           pool: 'threads',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        'execArgv はあるが pool 未指定',
        IMP + `export default defineConfig({ test: {
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        'execArgv に別 flag だけ',
        IMP + `export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--max-old-space-size=4096'] } },
         } });`,
      ],
      [
        'threads 側に置いている',
        IMP + `export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { threads: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        'export していない decoy から寄せ集める',
        IMP + `const decoy = defineConfig({ test: { pool: 'forks' } });
         export default defineConfig({ test: {
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        '2 つの config に property を分散させる',
        IMP + `export const other = defineConfig({ test: {
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });
         export default defineConfig({ test: { pool: 'forks' } });`,
      ],
      [
        'spread で上書きされ得る',
        IMP + `export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
           ...overrides,
         } });`,
      ],
      [
        '同名 property が重複する',
        IMP + `export default defineConfig({ test: {
           pool: 'forks',
           pool: 'threads',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        '変数経由で静的に辿れない',
        IMP + `const config = { pool: 'forks', poolOptions: { forks: { execArgv: ['--expose-gc'] } } };
         export default defineConfig({ test: config });`,
      ],
      [
        'wrapper 関数の返り値',
        IMP + `export default withDefaults(defineConfig({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } }));`,
      ],
      [
        'ローカル関数を defineConfig と命名する',
        `const defineConfig = (c) => withDefaults(c);
         export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        'computed property で pool を上書きする',
        IMP + `export default defineConfig({ test: {
           pool: 'forks',
           ['pool']: 'threads',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        '別 module から同名を import する',
        `import { defineConfig } from './opaque-wrapper';
         export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
    ];
    for (const [label, source] of cases) {
      expect(findMissingGcSetup(source), label).not.toBeNull();
    }
  });

  it('requireGc を渡していない呼出を検出する', () => {
    const IMP = `import { runPerf3Layer } from '@kiwa-lab/perf-harness';\n`;
    const cases: Array<[string, string]> = [
      ['指定なし', IMP + `const r = await runPerf3Layer({ moduleName: 'm' }); expect(r.allPassed).toBe(true);`],
      ['false を渡す', IMP + `const r = await runPerf3Layer({ requireGc: false }); expect(r.allPassed).toBe(true);`],
      ['変数経由で渡す', IMP + `const r = await runPerf3Layer({ requireGc: flag }); expect(r.allPassed).toBe(true);`],
      ['引数が object でない', IMP + `const r = await runPerf3Layer(opts); expect(r.allPassed).toBe(true);`],
      [
        '後ろの spread で上書きされ得る',
        IMP + `const r = await runPerf3Layer({ requireGc: true, ...overrides }); expect(r.allPassed).toBe(true);`,
      ],
      [
        'namespace alias 経由で requireGc なし',
        `import * as perf from '@kiwa-lab/perf-harness';
         const { runPerf3Layer } = perf;
         const r = await runPerf3Layer({ moduleName: 'm' });
         expect(r.allPassed).toBe(true);`,
      ],
      [
        'live 呼出で指定なし',
        `import { runPerf3LayerLive } from '@kiwa-lab/perf-harness';
         const r = await runPerf3LayerLive({ moduleName: 'm' });`,
      ],
    ];
    for (const [label, source] of cases) {
      expect(findMissingRequireGc(source), label).not.toBeNull();
    }
  });

  it('requireGc を渡している呼出は通す', () => {
    const cases: Array<[string, string]> = [
      [
        '素直な形',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({ moduleName: 'm', requireGc: true });
         expect(r.allPassed).toBe(true);`,
      ],
      [
        '前の spread は後ろの明示が勝つので通す',
        `import { runPerf3Layer } from '@kiwa-lab/perf-harness';
         const r = await runPerf3Layer({ ...defaults, requireGc: true });
         expect(r.allPassed).toBe(true);`,
      ],
      [
        'live 呼出でも指定していれば通す',
        `import { runPerf3LayerLive } from '@kiwa-lab/perf-harness';
         const r = await runPerf3LayerLive({ moduleName: 'm', requireGc: true });`,
      ],
    ];
    for (const [label, source] of cases) {
      expect(findMissingRequireGc(source), label).toBeNull();
    }
  });

  it('live 呼出は allPassed の検証を要求しない', () => {
    // live は env が無ければ全 op が skip される。 その状態を anySkipped で
    // 確かめるのが正しい形で、allPassed を無条件に要求すると env のある環境で
    // しか通らない test になる。
    const source = `import { runPerf3LayerLive } from '@kiwa-lab/perf-harness';
      const result = await runPerf3LayerLive({ moduleName: 'm', requireGc: true });
      if (result.outcomes.filter((o) => !o.skipped).length > 0) {
        expect(result.allPassed).toBe(true);
      } else {
        expect(result.anySkipped).toBe(true);
      }`;
    expect(findDiscardedVerdict(source)).toBeNull();
  });

  it('GC を呼べる config は通す', () => {
    const CONFIG_IMPORT = `import { defineConfig } from 'vitest/config';\n`;
    const cases: Array<[string, string]> = [
      [
        '素直な形',
        CONFIG_IMPORT +
          `export default defineConfig({ test: {
             pool: 'forks',
             poolOptions: { forks: { execArgv: ['--expose-gc'] } },
           } });`,
      ],
      [
        'satisfies 付き',
        CONFIG_IMPORT +
          `export default defineConfig({ test: {
             pool: 'forks',
             poolOptions: { forks: { execArgv: ['--expose-gc'] } },
           } }) satisfies UserConfig;`,
      ],
      [
        '別名 import',
        `import { defineConfig as define } from 'vitest/config';
         export default define({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
    ];
    for (const [label, source] of cases) {
      expect(findMissingGcSetup(source), label).toBeNull();
    }
  });
});

/**
 * Packages that measure nothing, and why.
 *
 * The checks above ask whether a perf suite judges what it measured. They say
 * nothing about a package with no perf suite at all, so "deliberately has none"
 * and "nobody wrote one" read identically — which is the shape #1982 and #1986
 * both turned out to be. `dapp` was held out because its code "can only be
 * verified through e2e" and `ui` because of "jsdom and the adapters"; neither
 * reason was written down anywhere a reader could check, and neither survived
 * being measured.
 *
 * Each entry states something about what the package is. "Not written yet" is
 * not a reason — a package in that state belongs in an Issue, not here.
 */
const PERF_EXEMPT: Readonly<Record<string, string>> = {
  'packages/perf-harness':
    'Provides the measurement, regression detection, and baseline persistence used by every other perf suite; measuring it with itself is circular.',
  'packages/lean':
    'Generates Lean proof obligations whose relevant result is acceptance by the real Lean toolchain, not runtime latency.',
  'packages/skill-test':
    'Exposes assertions over ToolCallRecord values collected by a tool spy and performs no independent work to measure.',
};

describe('perf suite absence is recorded (#1993)', () => {
  it('lists every package without a perf suite, with a reason', () => {
    // A source file alone does not make a suite runnable: the root perf command
    // uses `--if-present`, so removing a package's `test:perf` script silently
    // skips it. Require both the source and the package-level execution wiring.
    const withPerf = new Set(
      perfTestFiles().map((file) => {
        const rel = file.slice(REPO_ROOT.length + 1);
        const [root, pkg] = rel.split('/');
        return `${root}/${pkg}`;
      }),
    );

    const packages = readdirSync(join(REPO_ROOT, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `packages/${entry.name}`)
      .filter((dir) => existsSync(join(REPO_ROOT, dir, 'package.json')))
      .sort();

    const withoutRunnablePerf = packages.filter((dir) => {
      const manifest = JSON.parse(readFileSync(join(REPO_ROOT, dir, 'package.json'), 'utf8')) as {
        scripts?: Record<string, unknown>;
      };
      const script = manifest.scripts?.['test:perf'];
      return !withPerf.has(dir) || typeof script !== 'string' || script.trim().length === 0;
    });

    expect(
      Object.values(PERF_EXEMPT).every((reason) => reason.trim().length > 0),
      'Every PERF_EXEMPT entry must carry a non-empty reason.',
    ).toBe(true);

    expect(
      withoutRunnablePerf,
      'A package with no perf suite has to say why in PERF_EXEMPT. Leaving it off makes ' +
        '"deliberately unmeasured" and "nobody wrote one" the same state, which is how ' +
        '#1982 and #1986 kept their exclusions for as long as they did. Add the package ' +
        'with a reason about what it is, or give it a perf suite.',
    ).toEqual(Object.keys(PERF_EXEMPT).sort());
  });
});
