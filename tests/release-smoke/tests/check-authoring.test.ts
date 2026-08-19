import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, read } from './skill-md.js';

/**
 * 0 件で通る検査を作らせない (#2011)。
 *
 * `it.each(list)` は `list` が空だと **test を 1 件も生成せずに緑になる**。 検査が何も見て
 * いない状態と、 見た上で問題が無い状態が同じ結果になる。
 *
 * 本 session の 5 PR で「検査が減っただけで緑」 が 6 回出ており、 うち 3 件がこの形だった。
 * いずれも変異試験で初めて判明し、 通常の実行では 1 度も落ちていない。
 *
 * **literal の一覧は対象外**。 書いた時点で件数が決まっており、 空になりようがない
 * (実測で 13 箇所中 7 箇所が literal)。 対象を広げると、 空になり得ない一覧にまで保証を
 * 書かせることになり、 検査が形骸化する。
 *
 * 手順の全文は `docs/quality/check-authoring.md`。
 */

const TEST_DIR = 'tests/release-smoke/tests';

/** 本 dir の検査 file (自分自身も含む)。 */
function testFiles(): string[] {
  return readdirSync(resolve(REPO_ROOT, TEST_DIR))
    .filter((name) => name.endsWith('.test.ts'))
    .sort();
}

/**
 * 判定は TypeScript parser が作る AST で行う。
 *
 * 正規表現だと comment / 文字列の例示、 `.not`、 matcher の引数、 callback の実行条件を
 * 区別できない。 いずれも「非空を確かめていないのに保証あり」と読む向きの誤判定になる。
 */
const parsed = new Map<string, ts.SourceFile>();

function parse(src: string): ts.SourceFile {
  const cached = parsed.get(src);
  if (cached) return cached;
  const sourceFile = ts.createSourceFile('check-authoring-input.ts', src, ts.ScriptTarget.Latest, true);
  parsed.set(src, sourceFile);
  return sourceFile;
}

function unwrap(expr: ts.Expression): ts.Expression {
  let current = expr;
  for (;;) {
    if (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isSatisfiesExpression(current)
    ) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

/** 一覧そのものを名指す式が参照する識別子。 */
function directSourceReference(expr: ts.Expression, ident?: string): ts.Identifier | null {
  const target = unwrap(expr);
  if (ts.isIdentifier(target)) return ident === undefined || target.text === ident ? target : null;
  if (!ts.isCallExpression(target)) return null;
  const callee = unwrap(target.expression);
  if (ts.isIdentifier(callee)) return ident === undefined || callee.text === ident ? callee : null;
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== 'keys') return null;
  const receiver = unwrap(callee.expression);
  const argument = target.arguments[0];
  if (
    !ts.isIdentifier(receiver) ||
    receiver.text !== 'Object' ||
    argument === undefined ||
    !ts.isIdentifier(unwrap(argument))
  ) {
    return null;
  }
  const reference = unwrap(argument) as ts.Identifier;
  return ident === undefined || reference.text === ident ? reference : null;
}

type EachSourceReference = {
  node: ts.Identifier;
  preservesNonEmpty: boolean;
};

const NON_EMPTY_PRESERVING_METHODS = new Set(['map', 'reverse', 'sort', 'toReversed', 'toSorted']);

/** `it.each` の引数を辿った先で名指しされる一覧と、 途中の変換が非空を保つか。 */
function eachSourceReference(expr: ts.Expression): EachSourceReference | null {
  const target = unwrap(expr);
  if (ts.isIdentifier(target)) return { node: target, preservesNonEmpty: true };
  if (ts.isCallExpression(target)) {
    const callee = unwrap(target.expression);
    if (ts.isIdentifier(callee)) return { node: callee, preservesNonEmpty: true };
    if (
      ts.isPropertyAccessExpression(callee) &&
      callee.name.text === 'keys' &&
      ts.isIdentifier(unwrap(callee.expression)) &&
      (unwrap(callee.expression) as ts.Identifier).text === 'Object'
    ) {
      const argument = target.arguments[0];
      return argument && ts.isIdentifier(unwrap(argument))
        ? { node: unwrap(argument) as ts.Identifier, preservesNonEmpty: true }
        : null;
    }
    if (ts.isPropertyAccessExpression(callee)) {
      const source = eachSourceReference(callee.expression);
      if (!source) return null;
      return {
        node: source.node,
        preservesNonEmpty:
          source.preservesNonEmpty && NON_EMPTY_PRESERVING_METHODS.has(callee.name.text),
      };
    }
    return null;
  }
  if (ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)) {
    const source = eachSourceReference(target.expression);
    return source && { node: source.node, preservesNonEmpty: false };
  }
  return null;
}

function isEachCall(node: ts.CallExpression): boolean {
  const callee = unwrap(node.expression);
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== 'each') return false;
  const receiver = unwrap(callee.expression);
  return ts.isIdentifier(receiver) && (receiver.text === 'it' || receiver.text === 'test');
}

/** `it.each(<ident>)` / `it.each(Object.keys(<ident>))` が名指しする識別子。 */
function eachSources(raw: string): string[] {
  const found = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isEachCall(node)) {
      const argument = node.arguments[0];
      if (argument) {
        const reference = eachSourceReference(argument);
        if (reference) found.add(reference.node.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(raw));
  return [...found].sort();
}

function isGuaranteedNonEmptyArray(expr: ts.Expression): boolean {
  const target = unwrap(expr);
  return (
    ts.isArrayLiteralExpression(target) &&
    target.elements.some((element) => !ts.isSpreadElement(element))
  );
}

type SourceDefinition = {
  node: ts.FunctionDeclaration | ts.VariableDeclaration;
  kind: 'literal' | 'derived';
  scope: ts.Node;
};

function isScope(node: ts.Node): boolean {
  return (
    ts.isSourceFile(node) ||
    ts.isBlock(node) ||
    ts.isCaseBlock(node) ||
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isCatchClause(node)
  );
}

function enclosingScope(node: ts.Node): ts.Node {
  let current = node.parent;
  while (current && !isScope(current)) current = current.parent;
  return current ?? node.getSourceFile();
}

function declarationScope(node: ts.FunctionDeclaration | ts.VariableDeclaration): ts.Node {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isVariableDeclarationList(node.parent) &&
    (node.parent.flags & ts.NodeFlags.BlockScoped) === 0
  ) {
    let current: ts.Node | undefined = node.parent;
    while (current) {
      if (ts.isSourceFile(current)) return current;
      if (ts.isFunctionLike(current)) {
        const body = (current as ts.FunctionLikeDeclarationBase & { body?: ts.ConciseBody }).body;
        if (body && ts.isBlock(body)) return body;
      }
      current = current.parent;
    }
  }
  return enclosingScope(node);
}

function allDefinitions(sourceFile: ts.SourceFile, ident: string): SourceDefinition[] {
  const found: SourceDefinition[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === ident) {
      found.push({ node, kind: 'derived', scope: declarationScope(node) });
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === ident) {
      found.push({
        node,
        kind: node.initializer && isGuaranteedNonEmptyArray(node.initializer) ? 'literal' : 'derived',
        scope: declarationScope(node),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function scopeChain(node: ts.Node): ts.Node[] {
  const scopes: ts.Node[] = [];
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (isScope(current)) scopes.push(current);
    current = current.parent;
  }
  return scopes;
}

/** 参照位置から見える同名宣言のうち、 最も内側の scope にあるもの。 */
function resolveDefinitions(reference: ts.Identifier): SourceDefinition[] {
  const sourceFile = reference.getSourceFile();
  const scopes = scopeChain(reference);
  const candidates = allDefinitions(sourceFile, reference.text)
    .map((definition) => ({ definition, depth: scopes.indexOf(definition.scope) }))
    .filter(({ depth }) => depth >= 0);
  if (candidates.length === 0) return [];
  const nearest = Math.min(...candidates.map(({ depth }) => depth));
  return candidates
    .filter(({ depth }) => depth === nearest)
    .map(({ definition }) => definition);
}

function eachReferences(src: string, ident: string): EachSourceReference[] {
  const found: EachSourceReference[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isEachCall(node)) {
      const argument = node.arguments[0];
      const reference = argument ? eachSourceReference(argument) : null;
      if (reference?.node.text === ident) found.push(reference);
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(src));
  return found;
}

function definitions(src: string, ident: string): SourceDefinition[] {
  const unique = new Map<ts.Node, SourceDefinition>();
  for (const reference of eachReferences(src, ident)) {
    for (const definition of resolveDefinitions(reference.node)) {
      unique.set(definition.node, definition);
    }
  }
  return [...unique.values()];
}

/** 静的に 1 要素以上を持つ配列 literal だけを literal とみなす。 */
function definitionKind(src: string, ident: string): 'literal' | 'derived' | 'unknown' {
  const kinds = definitions(src, ident);
  if (kinds.length === 0) return 'unknown';
  return kinds.every(({ kind }) => kind === 'literal') ? 'literal' : 'derived';
}

function lengthSourceReference(expr: ts.Expression, ident: string): ts.Identifier | null {
  const target = unwrap(expr);
  if (!ts.isPropertyAccessExpression(target) || target.name.text !== 'length') return null;
  return directSourceReference(target.expression, ident);
}

function numericValue(expr: ts.Expression): number | null {
  const target = unwrap(expr);
  if (ts.isNumericLiteral(target)) return Number(target.text);
  if (
    ts.isPrefixUnaryExpression(target) &&
    (target.operator === ts.SyntaxKind.PlusToken || target.operator === ts.SyntaxKind.MinusToken) &&
    ts.isNumericLiteral(target.operand)
  ) {
    const value = Number(target.operand.text);
    return target.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }
  return null;
}

function isOrdinaryTestCallback(node: ts.ArrowFunction | ts.FunctionExpression): boolean {
  const parent = node.parent;
  if (!ts.isCallExpression(parent) || !parent.arguments.includes(node)) return false;
  const callee = unwrap(parent.expression);
  return ts.isIdentifier(callee) && (callee.text === 'it' || callee.text === 'test');
}

/** 先行 statement に、 test callback を assertion より前に抜ける `return` があるか。 */
function canReturnBefore(statements: readonly ts.Statement[]): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    // 入れ子の関数の return は、 外側の test callback を抜けない。
    if (ts.isFunctionLike(node)) return;
    if (ts.isReturnStatement(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  for (const statement of statements) visit(statement);
  return found;
}

/** assertion が top-level または通常の `it` / `test` callback で必ず実行されるか。 */
function runsIndependently(node: ts.Node): boolean {
  let statement: ts.Statement | null = null;
  for (let current: ts.Node | undefined = node; current; current = current.parent) {
    if (statement === null && ts.isStatement(current)) statement = current;
    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      if (!isOrdinaryTestCallback(current)) return false;
      if (!ts.isBlock(current.body)) return statement === null && unwrap(current.body) === node;
      if (
        !statement ||
        !ts.isExpressionStatement(statement) ||
        unwrap(statement.expression) !== node ||
        statement.parent !== current.body
      ) {
        return false;
      }
      const index = current.body.statements.indexOf(statement);
      return index >= 0 && !canReturnBefore(current.body.statements.slice(0, index));
    }
    if (ts.isFunctionDeclaration(current)) return false;
    if (ts.isSourceFile(current)) {
      return (
        statement !== null &&
        ts.isExpressionStatement(statement) &&
        unwrap(statement.expression) === node &&
        statement.parent === current
      );
    }
  }
  return false;
}

/** その識別子の非空を独立に主張している assertion があるか。 */
function hasNonEmptyGuard(src: string, ident: string): boolean {
  // `.map` 等と違い、 `.filter` / `.slice` は元が非空でも結果が空になれる。 最終結果を
  // 変数へ束縛して名指しで保証させ、 元配列の assertion で通さない。
  if (eachReferences(src, ident).some(({ preservesNonEmpty }) => !preservesNonEmpty)) return false;
  const expectedDefinitions = new Set(definitions(src, ident).map(({ node }) => node));
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(unwrap(node.expression))) {
      const matcherAccess = unwrap(node.expression) as ts.PropertyAccessExpression;
      const matcher = matcherAccess.name.text;
      let chain = unwrap(matcherAccess.expression);
      let negated = false;
      if (ts.isPropertyAccessExpression(chain) && chain.name.text === 'not') {
        negated = true;
        chain = unwrap(chain.expression);
      }
      if (
        ts.isCallExpression(chain) &&
        ts.isIdentifier(unwrap(chain.expression)) &&
        (unwrap(chain.expression) as ts.Identifier).text === 'expect' &&
        chain.arguments.length >= 1 &&
        runsIndependently(node)
      ) {
        const subject = chain.arguments[0];
        const argument = node.arguments[0];
        if (subject && argument) {
          const value = numericValue(argument);
          const direct = directSourceReference(subject, ident);
          const length = lengthSourceReference(subject, ident);
          const reference = direct ?? length;
          const sameBinding =
            reference !== null &&
            (expectedDefinitions.size === 0 ||
              resolveDefinitions(reference).some(({ node: definition }) =>
                expectedDefinitions.has(definition),
              ));
          found =
            sameBinding &&
            ((!negated && matcher === 'toContain' && direct !== null) ||
              (!negated &&
                matcher === 'toHaveLength' &&
                direct !== null &&
                value !== null &&
                value > 0) ||
              (!negated &&
                matcher === 'toBeGreaterThan' &&
                length !== null &&
                value !== null &&
                value >= 0) ||
              (!negated &&
                matcher === 'toBeGreaterThanOrEqual' &&
                length !== null &&
                value !== null &&
                value > 0) ||
              (negated && matcher === 'toHaveLength' && direct !== null && value === 0) ||
              (negated &&
                matcher === 'toEqual' &&
                direct !== null &&
                ts.isArrayLiteralExpression(unwrap(argument)) &&
                (unwrap(argument) as ts.ArrayLiteralExpression).elements.length === 0));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(src));
  return found;
}

/**
 * `it.each` の対象として使われる識別子のうち、 同 file 内で 2 度以上定義されているもの。
 *
 * 名前が重なると **1 つの保証で両方が通る**。 file 単位で名前を見る以上これは避けられないので、
 * 名前を分けさせる (実測で `test-taxonomy-existence.test.ts` が `target` を 2 つ持っていた)。
 */
function shadowedSources(raw: string): string[] {
  return eachSources(raw).filter((ident) => {
    // literal は書いた時点で件数が決まっており、 名前が重なっても 0 件にならない。
    if (definitionKind(raw, ident) === 'literal') return false;
    return definitions(raw, ident).length > 1;
  });
}

describe('it.each に渡す一覧が空にならないことを確かめている', () => {
  const files = testFiles();

  it('検査 file を読めている', () => {
    // 0 件でも `it.each` は 1 件も走らずに緑になる。 本 file 自身が同じ穴を持たないようにする。
    // `files` と `testFiles()` の両方を名指しで保証する = 下の it.each は両方を対象にする。
    expect(files.length).toBeGreaterThan(0);
    expect(testFiles().length).toBeGreaterThan(0);
    expect(files).toContain('check-authoring.test.ts');
  });

  it.each(files)('%s の実行時導出の一覧に非空の保証がある', (name) => {
    const src = read(`${TEST_DIR}/${name}`);
    const missing = eachSources(src)
      .filter((ident) => definitionKind(src, ident) !== 'literal')
      .filter((ident) => !hasNonEmptyGuard(src, ident));
    expect(
      missing,
      `${name}: it.each の対象が空でも緑になる。 ` +
        `expect(<ident>.length).toBeGreaterThan(0) 等で名指しの保証を書く ` +
        `(docs/quality/check-authoring.md § 形 1)`,
    ).toEqual([]);
  });

  /** fixture は data file に置く = 検査 file 自身の source を走査するため、 fixture を
   * source 内に書くと自分の文字列を拾って落ちる (実装中に実際に踏んだ)。 */
  function unguardedIn(fixture: string): string[] {
    const src = read(`tests/release-smoke/fixtures/check-authoring/${fixture}`);
    return eachSources(src)
      .filter((ident) => definitionKind(src, ident) !== 'literal')
      .filter((ident) => !hasNonEmptyGuard(src, ident));
  }

  it('literal の一覧を対象にしない', () => {
    // 直接要素を持つ literal は静的に非空。 空になり得ない一覧への保証は形骸化する。
    expect(unguardedIn('literal-list.txt')).toEqual([]);
  });

  it('空の literal を非空として扱わない', () => {
    expect(unguardedIn('empty-literal.txt')).toEqual(['CASES']);
  });

  it('spread だけの literal を非空として扱わない', () => {
    expect(unguardedIn('spread-only-literal.txt')).toEqual(['CASES']);
  });

  it('件数を減らし得る変換の前にある一覧の保証は受けない', () => {
    expect(unguardedIn('filtered-source-guard.txt')).toEqual(['targets']);
  });

  it('名指しの保証がある実行時導出を通す', () => {
    expect(unguardedIn('derived-guarded.txt')).toEqual([]);
  });

  it('保証の無い実行時導出を見逃さない', () => {
    // 検査そのものの識別力。 保証を外した形を通し、 検出できることを見る。
    expect(unguardedIn('derived-unguarded.txt')).toEqual(['targets']);
  });

  it('等値の主張は保証として受けない', () => {
    // `expect(x).toEqual([])` は x が空でも成立する。 これを保証として受けると、
    // 「空でないこと」 を 1 度も確かめないまま緑になる。
    expect(unguardedIn('toequal-guard.txt')).toEqual(['targets']);
  });

  it('0 件を許す境界値は保証として受けない', () => {
    expect(unguardedIn('zero-bound-guard.txt')).toEqual(['targets']);
  });

  it('否定された非空 assertion は保証として受けない', () => {
    expect(unguardedIn('negated-guard.txt')).toEqual(['targets']);
  });

  it('0 件を主張する toHaveLength は保証として受けない', () => {
    // `toHaveLength(0)` は「空である」 の主張。 非空の保証として数えると意味が反転する。
    expect(unguardedIn('zero-length-guard.txt')).toEqual(['targets']);
  });

  it('否定された toContain は保証として受けない', () => {
    // `not.toContain(x)` は一覧が空でも成立する。 「含まない」 は「空でない」 を含意しない。
    expect(unguardedIn('negated-contain-guard.txt')).toEqual(['targets']);
  });

  it('hook 内の assertion は保証として受けない', () => {
    // 一覧が空だと test が 1 件も生成されず、 その suite の `beforeAll` も走らない。
    // callback の呼び先を問わないと、 走らない hook の assertion を数えることになる。
    expect(unguardedIn('hook-scoped-guard.txt')).toEqual(['targets']);
  });

  it('呼ばれるとは限らない関数内の assertion は保証として受けない', () => {
    // 宣言しただけの関数は実行されるとは限らない。 実行位置まで見ないと、 書いてあるだけの
    // assertion を保証として数えることになる。
    expect(unguardedIn('function-scoped-guard.txt')).toEqual(['targets']);
  });

  it('it.each 自身の callback 内だけにある assertion は保証として受けない', () => {
    // 一覧が空なら callback 自体が 1 度も走らないため、 独立した保証にならない。
    expect(unguardedIn('self-guarded.txt')).toEqual(['targets']);
  });

  it('条件分岐の内側にある assertion は保証として受けない', () => {
    expect(unguardedIn('conditional-guard.txt')).toEqual(['targets']);
  });

  it('early return の後にある assertion は保証として受けない', () => {
    expect(unguardedIn('early-return-guard.txt')).toEqual(['targets']);
  });

  it('short-circuit 式の内側にある assertion は保証として受けない', () => {
    expect(unguardedIn('short-circuit-guard.txt')).toEqual(['targets']);
  });

  it('文字列内の assertion 例を保証として受けない', () => {
    expect(unguardedIn('string-guard.txt')).toEqual(['targets']);
  });

  it('comment 内の言及を対象にしない', () => {
    // 説明文が `it.each(...)` の形を含むことがある。 拾うと保証の書きようが無い対象を要求する。
    expect(unguardedIn('line-comment.txt')).toEqual([]);
  });

  it.each(testFiles())('%s が it.each の対象名を使い回していない', (name) => {
    // 同名だと 1 つの保証で両方が通る。 名前を分ければ保証も 1 対 1 になる。
    expect(
      shadowedSources(read(`${TEST_DIR}/${name}`)),
      `${name}: it.each の対象名が重複している。 名前を分ける ` +
        `(docs/quality/check-authoring.md § 形 1)`,
    ).toEqual([]);
  });

  it('使い回した対象名を見逃さない', () => {
    const src = read('tests/release-smoke/fixtures/check-authoring/duplicate-name.txt');
    expect(shadowedSources(src)).toEqual(['target']);
  });

  it('手順の doc が実在し 3 形を持つ', () => {
    // 失敗 message が doc を指すため、 消えると案内先が消える。
    const doc = read('docs/quality/check-authoring.md');
    expect(doc).toContain('## 3 つの形');
    expect(doc).toContain('本 file は 13 回の実測から書いた');
    expect(doc).toContain('### 形 1 — 0 件でも通る');
    expect(doc).toContain('### 形 2 — 集合を畳むと片側の欠落が消える');
    // 形 2 を機械化しない根拠は実測 (#2013)。 数字が消えると、 次に同じ問いが出た時に
    // 検討をやり直すことになる。
    expect(doc).toContain('#### 畳んでよい場合');
    expect(doc).toContain('### 形 2 を機械化しない根拠');
    expect(doc).toContain('| 集約 (`join` / `flat` / `Set`) が `expect` の 5 行以内 | 105 | 0');
    expect(doc).toContain('| 集約が `expect(...)` の引数内 | 53 | 0 |');
    expect(doc).toContain('| 集約が `expect` の **値の位置** (第 1 引数) | 11 | 0 |');
    // 形 3 (代理指標だけを守る) も同じ扱い。 見出しだけでなく測定値まで守る = この検査自身が
    // 5 件目の実例なので、 同じ形に戻らないよう値を照合する (#2015)。
    expect(doc).toContain('### 形 3 — 代理指標だけを守る');
    expect(doc).toContain('### 形 3 を機械化しない根拠');
    expect(doc).toContain('| `toContain(<literal>)` の総数 | 225 |');
    expect(doc).toContain('| 短く構造の無い literal | 124 |');
    // 判断そのものの行も守る。 見出しと測定値だけを見て「する / しない」 を見ないのは、
    // まさに形 3 (実装中に踏んだ 6 件目)。
    expect(doc).toContain('| `it.each` に渡す一覧が空 | **する**');
    expect(doc).toContain('| 集合を畳む | しない |');
    expect(doc).toContain('| 代理指標だけを守る | しない |');
    // 契約が複数の要素を要求する時に 1 要素で代表させない形 (#2019)。 見出しと規範の一文を
    // 別々に守る = 見出しだけを見るのは形 3 そのものになる。
    expect(doc).toContain('#### 複数の要素を要求する契約では「全要素」 が最小の形');
    expect(doc).toContain('契約の要素を数えてから、 要素ごとに 1 つ照合を書く');
    // 実例は 3 flag を要求する契約なので、 3 つとも照合する。 1 つで代表させると、 この
    // 検査自身が本節の反例になる。
    expect(doc).toContain("expect(flag, '抽出が -n を付けていない').toContain('n');");
    expect(doc).toContain("expect(flag, '抽出が -H を付けていない').toContain('H');");
    expect(doc).toContain("expect(flag, '抽出が -E を付けていない').toContain('E');");
    // 棚卸しの測定値 (#2021)。 3 段の数字が消えると、 次に同じ問いが出た時に数え直しになる。
    // 形 2 / 形 3 の根拠表と同じ扱いで、 見出しではなく値そのものを照合する。
    expect(doc).toContain('#### 既存の検査を棚卸しした結果');
    expect(doc).toContain('| fence に現れる flag | 133 |');
    expect(doc).toContain('| assertion literal に現れる | 108 |');
    expect(doc).toContain('| 現れない | 25 |');
    // 分類の結論。 25 件のうち本節の形は 1 件だけで、 残りは別種の gap になる。
    // 件数だけを守ると「1 件だけ」 の判断が消えるため、 判断の行も照合する。
    expect(doc).toContain('**本節の形に当たるのは最後の 1 件だけ**');
  });

  it('別名に代入した保証は受けない', () => {
    // `const s = f(); expect(s.length)...` は名指しでないため見えない。 見えない保証を
    // 受けると、 対象を差し替えた時に保証だけ古いまま残る。
    expect(unguardedIn('aliased-guard.txt')).toEqual(['layerSkills']);
  });
});
