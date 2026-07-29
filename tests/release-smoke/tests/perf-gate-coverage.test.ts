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
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
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
      if (!ts.isStringLiteral(arg)) return null;
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
 */
function resolveDeclaration(from: ts.Node, name: string): ts.VariableDeclaration | null {
  for (let scope: ts.Node | undefined = from; scope; scope = scope.parent) {
    let found: ts.VariableDeclaration | null = null;
    const scan = (node: ts.Node): void => {
      if (found) return;
      // 別 scope に降りない。 そこの宣言はここからは見えない。
      if (node !== scope && (ts.isFunctionLike(node) || ts.isBlock(node))) return;
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
        found = node;
        return;
      }
      node.forEachChild(scan);
    };
    scan(scope);
    if (found) return found;
  }
  return null;
}

/** 測定関数の名前。 これを import しているか否かが検査の入口になる。 */
const MEASURE_FNS = new Set(['runPerf3Layer', 'runPerf3LayerStrict']);

/**
 * source 内で測定関数を指す識別子を集める。
 *
 * `import { runPerf3Layer as run }` の `run` や `import * as perf` の `perf.runPerf3Layer`
 * も対象にする。 別名にすれば検査を通せる、では guard にならない。
 */
function measureAliases(sf: ts.SourceFile): { direct: Set<string>; namespaces: Set<string> } {
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
      if (MEASURE_FNS.has(original)) direct.add(el.name.text);
    }
  });
  return { direct, namespaces };
}

/** その呼出が測定関数の呼出かを返す。 */
function isMeasureCall(
  node: ts.CallExpression,
  aliases: { direct: Set<string>; namespaces: Set<string> },
): boolean {
  const path = accessPath(node.expression);
  if (path === null) return false;
  const parts = path.split('.');
  if (parts.length === 1) return aliases.direct.has(parts[0]!);
  if (parts.length === 2) return aliases.namespaces.has(parts[0]!) && MEASURE_FNS.has(parts[1]!);
  return false;
}

/**
 * `expect(<x>.allPassed).toBe(true)` の形で肯定的に検証されている変数宣言を集める。
 *
 * matcher まで見る。 `toBe(false)` や `.not.toBe(true)` は「判定した」 ことに
 * ならない。 対象は名前ではなく宣言 node で持つ (同名の別変数を巻き込まない)。
 */
function assertedDeclarations(sf: ts.SourceFile): Set<ts.VariableDeclaration> {
  const asserted = new Set<ts.VariableDeclaration>();
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
    if (decl) asserted.add(decl);
  });
  return asserted;
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
    if (!asserted.has(parent)) {
      problems.push(`L${line}: ${parent.name.text}.allPassed を検証していない`);
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
function defineConfigAliases(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  eachNode(sf, (node) => {
    if (!ts.isImportDeclaration(node)) return;
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
  // spread は後続で上書きし得る。 computed key と accessor / method は静的に
  // 決まらない。 どれも「書いてある property が実際の値」 の前提を壊すので、
  // 1 つでもあれば読まない。
  const opaque = obj.properties.some(
    (p) =>
      ts.isSpreadAssignment(p) ||
      ts.isGetAccessorDeclaration(p) ||
      ts.isSetAccessorDeclaration(p) ||
      ts.isMethodDeclaration(p) ||
      (p.name !== undefined && ts.isComputedPropertyName(p.name)),
  );
  if (opaque) return null;
  const matches = obj.properties.filter(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
      p.name.text === key,
  );
  if (matches.length !== 1) return null;
  return matches[0]!.initializer;
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
    ];
    for (const [label, source] of cases) {
      expect(findMissingGcSetup(source), label).not.toBeNull();
    }
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
