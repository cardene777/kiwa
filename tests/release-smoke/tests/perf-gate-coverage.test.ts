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

/** `a.b.c` 形式の property access を文字列にする。 それ以外は null。 */
function accessPath(node: ts.Expression): string | null {
  const parts: string[] = [];
  let current: ts.Expression = node;
  while (ts.isPropertyAccessExpression(current)) {
    parts.unshift(current.name.text);
    current = current.expression;
  }
  if (!ts.isIdentifier(current)) return null;
  parts.unshift(current.text);
  return parts.join('.');
}

/**
 * `runPerf3Layer` の戻り値を受けた binding 名を集める。
 *
 * `const result = await runPerf3Layer({...})` の `result` が対象。 戻り値を
 * 束縛していない呼出 (= 判定を捨てている) は空集合として返り、検査で落ちる。
 */
function measuredBindings(sf: ts.SourceFile): { calls: number; bindings: Set<string> } {
  const bindings = new Set<string>();
  let calls = 0;
  eachNode(sf, (node) => {
    if (!ts.isCallExpression(node)) return;
    const callee = accessPath(node.expression);
    if (callee !== 'runPerf3Layer' && callee !== 'runPerf3LayerStrict') return;
    calls += 1;

    // `await` を挟んで代入されるので 2 段まで親を辿る。
    let target: ts.Node = node;
    if (ts.isAwaitExpression(target.parent)) target = target.parent;
    const parent = target.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      bindings.add(parent.name.text);
    }
  });
  return { calls, bindings };
}

/** `expect(<binding>.allPassed)` の形で検証されている binding 名を集める。 */
function assertedBindings(sf: ts.SourceFile): Set<string> {
  const asserted = new Set<string>();
  eachNode(sf, (node) => {
    if (!ts.isCallExpression(node)) return;
    if (!ts.isIdentifier(node.expression) || node.expression.text !== 'expect') return;
    const [arg] = node.arguments;
    if (!arg || !ts.isPropertyAccessExpression(arg)) return;
    if (arg.name.text !== 'allPassed') return;
    if (!ts.isIdentifier(arg.expression)) return;
    asserted.add(arg.expression.text);
  });
  return asserted;
}

/** perf test source が「判定を捨てている」 かを返す。 捨てていなければ null。 */
export function findDiscardedVerdict(source: string, fileName = 'x.perf.ts'): string | null {
  const sf = parse(source, fileName);
  const { calls, bindings } = measuredBindings(sf);
  if (calls === 0) return null;
  if (bindings.size === 0) return '戻り値を束縛していない';
  const asserted = assertedBindings(sf);
  const unchecked = [...bindings].filter((name) => !asserted.has(name));
  if (unchecked.length > 0) return `allPassed を検証していない binding: ${unchecked.join(', ')}`;
  return null;
}

/**
 * vitest config の `test` object から、指定した property path の値を探す。
 *
 * `defineConfig({ test: { pool: 'forks' } })` の `test.pool` を引く。 object
 * literal だけを辿るので、コメントや無関係な同名 identifier は拾わない。
 */
function readConfigValue(sf: ts.SourceFile, path: string[]): ts.Expression | null {
  let found: ts.Expression | null = null;
  eachNode(sf, (node) => {
    if (found) return;
    if (!ts.isCallExpression(node)) return;
    if (!ts.isIdentifier(node.expression) || node.expression.text !== 'defineConfig') return;
    const [arg] = node.arguments;
    if (!arg || !ts.isObjectLiteralExpression(arg)) return;

    let cursor: ts.ObjectLiteralExpression | null = arg;
    for (let index = 0; index < path.length; index += 1) {
      if (!cursor) return;
      const key: string = path[index]!;
      const props: ts.NodeArray<ts.ObjectLiteralElementLike> = cursor.properties;
      const prop: ts.PropertyAssignment | undefined = props.find(
        (p): p is ts.PropertyAssignment =>
          ts.isPropertyAssignment(p) &&
          (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
          p.name.text === key,
      );
      if (!prop) return;
      if (index === path.length - 1) {
        found = prop.initializer;
        return;
      }
      cursor = ts.isObjectLiteralExpression(prop.initializer) ? prop.initializer : null;
    }
  });
  return found;
}

/** config が GC を呼べる形かを返す。 問題なければ null。 */
export function findMissingGcSetup(
  source: string,
  fileName = 'vitest.perf.config.ts',
): string | null {
  const sf = parse(source, fileName);
  const execArgv = readConfigValue(sf, ['test', 'poolOptions', 'forks', 'execArgv']);
  const hasExposeGc =
    execArgv !== null &&
    ts.isArrayLiteralExpression(execArgv) &&
    execArgv.elements.some((el) => ts.isStringLiteral(el) && el.text === '--expose-gc');
  if (!hasExposeGc) return 'test.poolOptions.forks.execArgv に --expose-gc がない';

  const pool = readConfigValue(sf, ['test', 'pool']);
  const isForks = pool !== null && ts.isStringLiteral(pool) && pool.text === 'forks';
  // worker_threads は execArgv を無視するため、pool を固定しないと GC 無しに戻る。
  if (!isForks) return "test.pool が 'forks' でない (execArgv が無視される)";
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
  // 文字列検索で書くと、以下の 5 例が全て「合格」 になる。 検査が意味を持つのは
  // これらを落とせる時だけなので、fixture で固定する。
  it('判定を捨てている形を検出する', () => {
    const cases: Array<[string, string]> = [
      [
        '戻り値を束縛しない',
        `await runPerf3Layer({ moduleName: 'm', ops: [], reportPath: 'r' });`,
      ],
      [
        'コメントに allPassed と書いただけ',
        `const r = await runPerf3Layer({}); // r.allPassed は後で見る`,
      ],
      [
        '別 binding だけ検証している',
        `const a = await runPerf3Layer({});
         const b = await runPerf3Layer({});
         expect(a.allPassed).toBe(true);`,
      ],
      [
        'allPassed 以外を見ている',
        `const r = await runPerf3Layer({}); expect(r.outcomes.length).toBeGreaterThan(0);`,
      ],
      [
        '文字列に allPassed を含むだけ',
        `const r = await runPerf3Layer({}); console.log('allPassed?');`,
      ],
    ];
    for (const [label, source] of cases) {
      expect(findDiscardedVerdict(source), label).not.toBeNull();
    }
  });

  it('判定している形は通す', () => {
    const cases: Array<[string, string]> = [
      ['素直な形', `const r = await runPerf3Layer({}); expect(r.allPassed).toBe(true);`],
      [
        '複数呼出を各々検証',
        `const a = await runPerf3Layer({});
         expect(a.allPassed).toBe(true);
         const b = await runPerf3LayerStrict({});
         expect(b.allPassed).toBe(true);`,
      ],
      ['そもそも呼んでいない', `expect(1).toBe(1);`],
    ];
    for (const [label, source] of cases) {
      expect(findDiscardedVerdict(source), label).toBeNull();
    }
  });

  it('GC を呼べない config を検出する', () => {
    const cases: Array<[string, string]> = [
      ['何も設定していない', `export default defineConfig({ test: { include: ['x'] } });`],
      [
        'コメントに書いただけ',
        `export default defineConfig({ test: { /* --expose-gc を渡す */ include: ['x'] } });`,
      ],
      [
        'execArgv はあるが pool が threads',
        `export default defineConfig({ test: {
           pool: 'threads',
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        'execArgv はあるが pool 未指定',
        `export default defineConfig({ test: {
           poolOptions: { forks: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
      [
        'execArgv に別 flag だけ',
        `export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { forks: { execArgv: ['--max-old-space-size=4096'] } },
         } });`,
      ],
      [
        'threads 側に置いている',
        `export default defineConfig({ test: {
           pool: 'forks',
           poolOptions: { threads: { execArgv: ['--expose-gc'] } },
         } });`,
      ],
    ];
    for (const [label, source] of cases) {
      expect(findMissingGcSetup(source), label).not.toBeNull();
    }
  });

  it('GC を呼べる config は通す', () => {
    const source = `export default defineConfig({ test: {
      pool: 'forks',
      poolOptions: { forks: { execArgv: ['--expose-gc'] } },
    } });`;
    expect(findMissingGcSetup(source)).toBeNull();
  });
});
