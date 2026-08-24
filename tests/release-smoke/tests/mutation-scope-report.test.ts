// Checks for `scripts/mutation-scope-report.mjs` (Issue #1948).
//
// The report decides which files count as implementation, and every per-package
// widening Issue reads its output. A misclassification here does not announce
// itself — the file simply stops appearing, which is the exact failure #1936
// cost 611 unseen mutants.
//
// So the shapes are pinned in both directions. Four of them (`export { run }`
// split from its declaration, `export default <expr>`, `export namespace`,
// `export declare function`) are the forms #1944's enumeration approach missed
// in four consecutive review rounds; the first three dropped implementation out
// of scope and the fourth pulled a type declaration in.
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it, beforeAll } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/mutation-scope-report.mjs');
const SCRIPT_URL = pathToFileURL(SCRIPT).href;
const DOC = resolve(REPO_ROOT, 'docs/quality/mutation-thresholds.md');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadScript = (): Promise<any> => import(SCRIPT_URL);

const fixtures: string[] = [];

/**
 * A repository tree holding one package, enough for the report to run on.
 *
 * Each call gets its own directory: the report reads `stryker.config.mjs`
 * through `import()`, which caches by URL, so reusing a path would serve the
 * previous test's config.
 */
function fixtureRepo(pkg: string, sources: Record<string, string>, mutate: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-scope-report-'));
  fixtures.push(root);
  const pkgDir = join(root, 'packages', pkg);
  for (const [rel, body] of Object.entries(sources)) {
    const full = join(pkgDir, 'src', rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  writeFileSync(
    join(pkgDir, 'stryker.config.mjs'),
    `export default { mutate: ${JSON.stringify(mutate)} };\n`,
  );
  return root;
}

function runScript(args: string[], root?: string) {
  return execFileAsync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    env: root ? { ...process.env, KIWA_GATE_ROOT: root } : process.env,
  });
}

/**
 * 引数なしの起動を **1 回だけ** 行い、結果を共有する。
 *
 * 実測で引数なし起動は 5s 前後かかり、それを 2 件の検査が独立に呼んでいた。
 * 出力は同じなので 1 回で足りる (Issue #2193)。
 *
 * `runScript` をそのまま残すのは、fixture root を渡す検査が結果を共有できないため。
 */
let bareRunPromise: ReturnType<typeof runScript> | undefined;
function bareRun() {
  bareRunPromise ??= runScript([]);
  return bareRunPromise;
}

afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

describe('classify — the shape is whatever survives type erasure', () => {
  const implementation: Array<[string, string]> = [
    ['a plain exported function', 'export function run() { return 1; }\n'],
    ['an exported const', 'export const a = 1;\n'],
    ['two consts in one statement', 'export const a = 1, b = 2;\n'],
    ['a declaration published separately', 'const run = () => 1;\nexport { run };\n'],
    ['a default export of an expression', 'export default makeEnv();\n'],
    ['a runtime namespace', 'export namespace Runtime { export const a = 1; }\n'],
    ['an exported enum', 'export enum Level { low, high }\n'],
    ['a file that both forwards and implements', "export * from './a.js';\nexport const x = 1;\n"],
  ];

  it.each(implementation)('reads %s as implementation', async (_label, source) => {
    const { classify } = await loadScript();
    expect(classify(source).kind).toBe('implementation');
  });

  const barrel: Array<[string, string]> = [
    ['a star re-export', "export * from './a.js';\n"],
    ['a named re-export', "export { a } from './a.js';\n"],
    ['a namespace re-export', "export * as ns from './a.js';\n"],
  ];

  it.each(barrel)('reads %s as barrel', async (_label, source) => {
    const { classify } = await loadScript();
    expect(classify(source).kind).toBe('barrel');
  });

  const typeOnly: Array<[string, string]> = [
    ['an interface', 'export interface A { a: string }\n'],
    ['a type alias', 'export type B = string;\n'],
    ['an ambient function declaration', 'export declare function f(): void;\n'],
    ['an ambient namespace', 'export declare namespace N { const a: number; }\n'],
    ['a type-only re-export', "export type { A } from './a.js';\n"],
    ['a type-only named export', 'type A = string;\nexport type { A };\n'],
    ['an empty file', ''],
  ];

  it.each(typeOnly)('reads %s as type-only', async (_label, source) => {
    const { classify } = await loadScript();
    expect(classify(source).kind).toBe('type-only');
  });

  it('marks a file that both implements and forwards, and counts its re-export lines', async () => {
    const { classify } = await loadScript();
    const shape = classify("export * from './a.js';\nexport const x = 1;\nexport { b } from './b.js';\n");
    expect(shape).toMatchObject({ kind: 'implementation', mixed: true, forwardLines: 2 });
  });

  it('does not count type-only re-export lines as forwarding', async () => {
    const { classify } = await loadScript();
    const shape = classify("export type { A } from './a.js';\nexport const x = 1;\n");
    expect(shape).toMatchObject({ mixed: false, forwardLines: 0 });
  });

  it('leaves a type-only re-export out of the line count of a file that also forwards', async () => {
    const { classify } = await loadScript();
    // Both forms sit in the same file, so the type-only one is only excluded if
    // the count looks at each statement rather than at whether any exist.
    const shape = classify(
      "export type { A } from './a.js';\nexport { b } from './b.js';\nexport const x = 1;\n",
    );
    expect(shape).toMatchObject({ mixed: true, forwardLines: 1 });
  });

  it('names a file that publishes nothing but still runs at load time', async () => {
    const { classify } = await loadScript();
    const shape = classify("import './register.js';\nrun();\n");
    // The documented disagreement: the rule puts it in `mutate`, the test cannot
    // see it. It stays type-only and gets named instead of vanishing.
    expect(shape).toMatchObject({ kind: 'type-only', runsWithoutExporting: true });
  });

  it('names a barrel that also runs something at load time', async () => {
    const { classify } = await loadScript();
    // Same disagreement, different bucket. Keying the check on "type-only" would
    // let this one through unnamed, because forwarding puts it in `barrel`.
    const shape = classify("import './register.js';\nexport * from './a.js';\n");
    expect(shape).toMatchObject({ kind: 'barrel', runsWithoutExporting: true });
  });

  it('does not read a plain barrel as running at load time', async () => {
    const { classify } = await loadScript();
    // Forwarding is what a barrel is made of. Counting it as a side effect would
    // name all 38 barrels in the repo and make the note useless.
    const shape = classify("export * from './a.js';\nexport { b } from './b.js';\n");
    expect(shape).toMatchObject({ kind: 'barrel', runsWithoutExporting: false });
  });

  it('does not flag a file that only declares types as running at load time', async () => {
    const { classify } = await loadScript();
    expect(classify('export interface A { a: string }\n').runsWithoutExporting).toBe(false);
  });

  it('does not count the empty module marker as running at load time', async () => {
    const { classify } = await loadScript();
    // `export declare function` erases to a bare `export {}`, which does nothing.
    expect(classify('export declare function f(): void;\n').runsWithoutExporting).toBe(false);
  });

  it('names a file whose only exports re-publish imported bindings', async () => {
    const { classify } = await loadScript();
    const shape = classify("import { value } from './a.js';\nexport { value };\n");
    // Read as implementation on purpose — erring toward `mutate` is the safe
    // direction — but named, because it forwards in substance.
    expect(shape).toMatchObject({ kind: 'implementation', publishesImportsOnly: true });
  });

  it('does not flag a file that publishes its own declarations', async () => {
    const { classify } = await loadScript();
    const source = "import { value } from './a.js';\nexport const doubled = value * 2;\n";
    expect(classify(source).publishesImportsOnly).toBe(false);
  });

  it('sees an export written before the import it re-publishes', async () => {
    const { classify } = await loadScript();
    const shape = classify("export { value };\nimport { value } from './a.js';\n");
    expect(shape.publishesImportsOnly).toBe(true);
  });
});

describe('countLines — a trailing newline ends a line, it does not start one', () => {
  const cases: Array<[string, string, number]> = [
    ['newline-terminated', 'a\nb\n', 2],
    ['not newline-terminated', 'a\nb', 2],
    ['empty', '', 0],
    ['one blank line', '\n', 1],
    ['a blank line before the end', 'a\n\n', 2],
    ['CRLF', 'a\r\nb\r\n', 2],
  ];

  it.each(cases)('counts %s', async (_label, body, expected) => {
    const { countLines } = await loadScript();
    expect(countLines(body)).toBe(expected);
  });

  it('agrees with `wc -l` on a real newline-terminated source file', async () => {
    const { countLines } = await loadScript();
    const file = resolve(REPO_ROOT, 'packages/a11y/src/layer-harness.ts');
    const { stdout } = await execFileAsync('wc', ['-l', file]);
    const fromWc = Number(stdout.trim().split(/\s+/)[0]);
    expect(countLines(readFileSync(file, 'utf8'))).toBe(fromWc);
  });
});

describe('a file the compiler rejects stops the run', () => {
  it('throws instead of classifying, naming the file', async () => {
    const { classify, SourceParseError } = await loadScript();
    expect(() => classify('const x = (;', 'broken.ts')).toThrow(SourceParseError);
    expect(() => classify('const x = (;', 'broken.ts')).toThrow(/broken\.ts/);
  });

  it('stops on `export =` rather than reading it as type-only', async () => {
    const { classify, CommonJsExportError } = await loadScript();
    // An ESM emit drops the form silently, so the file would otherwise be
    // counted as declaring nothing but types.
    expect(() => classify('const x = 1;\nexport = x;\n', 'cjs.ts')).toThrow(CommonJsExportError);
  });

  it('does not mistake the words `export =` inside a comment for the real form', async () => {
    const { classify } = await loadScript();
    expect(classify('// export = x\nexport const a = 1;\n').kind).toBe('implementation');
  });

  it('stops the whole report rather than reporting a partial total', async () => {
    const root = fixtureRepo('core', { 'broken.ts': 'export function a() { return 1;\n' }, []);
    const { reportForPackage } = await loadScript();
    await expect(reportForPackage('core', { root })).rejects.toThrow(/broken\.ts/);
  });

  it('exits non-zero and prints no report', async () => {
    const root = fixtureRepo('core', { 'broken.ts': 'const x = (;\n' }, []);
    const failure = await runScript([], root).catch((error: Error & { stdout: string; code: number }) => error);
    expect(failure).toBeInstanceOf(Error);
    const { code, stdout } = failure as Error & { stdout: string; code: number };
    expect(code).toBe(1);
    expect(stdout).toBe('');
  });
});

describe('reportForPackage — the separate reports', () => {
  it('lists implementation files outside `mutate` with their line counts', async () => {
    const root = fixtureRepo(
      'core',
      {
        'listed.ts': 'export const a = 1;\n',
        'missed.ts': 'export function b() {\n  return 2;\n}\n',
      },
      ['.vitest-dist/src/listed.js'],
    );
    const { reportForPackage } = await loadScript();
    const report = await reportForPackage('core', { root });
    expect(report.covered).toEqual([{ file: 'listed.ts', lines: 1 }]);
    expect(report.uncovered).toEqual([{ file: 'missed.ts', lines: 3 }]);
    expect(report.coveredLines).toBe(1);
    expect(report.uncoveredLines).toBe(3);
  });

  it('reports a `mutate` entry that names a file holding no runtime value', async () => {
    const root = fixtureRepo(
      'core',
      { 'index.ts': "export * from './a.js';\n", 'a.ts': 'export const a = 1;\n' },
      ['.vitest-dist/src/index.js'],
    );
    const { reportForPackage } = await loadScript();
    const report = await reportForPackage('core', { root });
    expect(report.listedWithoutValue).toEqual([{ file: 'index.ts', lines: 1, kind: 'barrel' }]);
    // It is not counted as covered — Stryker finds nothing to mutate there.
    expect(report.coveredLines).toBe(0);
  });

  it('reports a `mutate` entry whose source file is gone', async () => {
    const root = fixtureRepo('core', { 'runCli.ts': 'export const a = 1;\n' }, [
      '.vitest-dist/src/runCli.js',
      '.vitest-dist/src/index.js',
    ]);
    const { reportForPackage } = await loadScript();
    const report = await reportForPackage('core', { root });
    expect(report.listedButMissing).toEqual(['.vitest-dist/src/index.js']);
  });

  it('reports a file that implements and forwards, with its re-export lines', async () => {
    const root = fixtureRepo(
      'core',
      { 'both.ts': "export * from './a.js';\nexport const x = 1;\n", 'a.ts': 'export const a = 1;\n' },
      [],
    );
    const { reportForPackage } = await loadScript();
    const report = await reportForPackage('core', { root });
    expect(report.mixed).toEqual([{ file: 'both.ts', lines: 2, forwardLines: 1 }]);
  });

  it('resolves a nested `mutate` entry and a .tsx source', async () => {
    const root = fixtureRepo(
      'core',
      { 'commands/init.ts': 'export const a = 1;\n', 'view.tsx': 'export const V = () => null;\n' },
      ['.vitest-dist/src/commands/init.js', '.vitest-dist/src/view.js'],
    );
    const { reportForPackage } = await loadScript();
    const report = await reportForPackage('core', { root });
    expect(report.uncovered).toEqual([]);
    expect(report.covered.map((row: { file: string }) => row.file).sort()).toEqual([
      'commands/init.ts',
      'view.tsx',
    ]);
  });

  it('skips ambient declaration files', async () => {
    const root = fixtureRepo(
      'core',
      { 'a.ts': 'export const a = 1;\n', 'globals.d.ts': 'declare const x: number;\n' },
      [],
    );
    const { reportForPackage } = await loadScript();
    const report = await reportForPackage('core', { root });
    expect(report.uncovered).toEqual([{ file: 'a.ts', lines: 1 }]);
    expect(report.typeOnlyLines).toBe(0);
  });

  it('stops on a wildcard `mutate` entry rather than guessing its line count', async () => {
    const root = fixtureRepo('core', { 'a.ts': 'export const a = 1;\n' }, [
      '.vitest-dist/src/**/*.js',
    ]);
    const { reportForPackage } = await loadScript();
    await expect(reportForPackage('core', { root })).rejects.toThrow(/wildcard/);
  });

  it('throws for a package the gate does not read', async () => {
    const { reportForPackage, UnknownPackageError } = await loadScript();
    await expect(reportForPackage('nope')).rejects.toThrow(UnknownPackageError);
  });

  it('accepts the scoped package name as well as the short one', async () => {
    const root = fixtureRepo('core', { 'a.ts': 'export const a = 1;\n' }, []);
    const { reportForPackage } = await loadScript();
    const scoped = await reportForPackage('@kiwa-lab/core', { root });
    expect(scoped.pkg).toBe('core');
  });

  it('names a package carrying a Stryker config the gate never reads', async () => {
    const { reportAll, PACKAGES } = await loadScript();
    // The name has to be one the gate does not read. `security` was the real
    // instance until #1951 scored it, so the fixture picks a name no package
    // uses and asserts it is outside the gate rather than hard-coding one.
    const unscored = 'example-not-scored';
    expect(PACKAGES).not.toContain(unscored);
    const root = fixtureRepo('core', { 'a.ts': 'export const a = 1;\n' }, []);
    mkdirSync(join(root, 'packages', unscored, 'src'), { recursive: true });
    writeFileSync(join(root, 'packages', unscored, 'stryker.config.mjs'), 'export default {};\n');
    expect((await reportAll({ root })).outsideTheGate).toEqual([unscored]);
  });
});

describe('the real repository', () => {
  // **`reportAll()` を 1 回だけ走らせて共有する** (Issue #2193 の duration gap report が
  // 本 file を `subprocess` lever の上位として挙げた)。
  //
  // 実測で本 file は 30.28s / 65 件、うち 8 件が 26.4s (87%) を占めていた。
  // 4 件が同じ `reportAll()` を独立に呼び、repo 全体を 4 回走査していた。
  //
  // 共有しても検査の独立性は落ちない = `reportAll()` は読み取りだけで、
  // どの検査も返り値を書き換えない。 書き換える検査を足す時はここを見直す。
  let shared: Awaited<ReturnType<Awaited<ReturnType<typeof loadScript>>['reportAll']>>;
  let helpers: Awaited<ReturnType<typeof loadScript>>;

  // **hook に明示の timeout を置く**。 `reportAll()` は repo 全体を走査するので、単体では
  // 3.6 秒でも sweep の並列下では 10 秒の既定を超える (実測でここが `Hook timed out in
  // 10000ms` で落ちた)。 `--testTimeout` は hook を覆わない
  // (`docs/quality/test-parallelism.md` § Timeouts sized for a loaded machine の群 6)。
  beforeAll(async () => {
    helpers = await loadScript();
    shared = await helpers.reportAll();
  }, 120_000);

  it('classifies every source line into exactly one bucket', () => {
    const { walkSources, countLines } = helpers;
    const report = shared;
    expect(report.packages.length).toBeGreaterThan(0);

    for (const pkg of report.packages) {
      const onDisk = walkSources(resolve(REPO_ROOT, 'packages', pkg.pkg, 'src'))
        .map((file: string) => countLines(readFileSync(file, 'utf8')))
        .reduce((sum: number, lines: number) => sum + lines, 0);
      const classified =
        pkg.coveredLines + pkg.uncoveredLines + pkg.barrelLines + pkg.typeOnlyLines;
      expect(classified, pkg.pkg).toBe(onDisk);
    }
  });

  it('totals what the per-package rows hold', () => {
    const report = shared;
    const sum = (field: string) =>
      report.packages.reduce(
        (total: number, pkg: Record<string, number>) => total + (pkg[field] ?? 0),
        0,
      );
    expect(report.implementationLines).toBe(report.coveredLines + report.uncoveredLines);
    expect(report.coveredLines).toBe(sum('coveredLines'));
    expect(report.uncoveredLines).toBe(sum('uncoveredLines'));
    expect(report.barrelLines).toBe(sum('barrelLines'));
    expect(report.typeOnlyLines).toBe(sum('typeOnlyLines'));
  });

  it('keeps the CLI entrypoint visible instead of dropping it', () => {
    // `cli/src/bin.ts` imports and calls, exporting nothing. It is the file the
    // export-counting test cannot see, and the doc names it for that reason.
    const named = shared.runsWithoutExporting.map(
      (row: { pkg: string; file: string }) => `${row.pkg}/${row.file}`,
    );
    expect(named).toContain('cli/bin.ts');
  });

  it('finds no config naming something with nothing to mutate', () => {
    const named = shared.listedWithoutValue.map(
      (row: { pkg: string; file: string }) => `${row.pkg}/${row.file}`,
    );
    // `api` / `ui` / `a11y` each listed their `index.js` barrel until #1963
    // widened them and dropped it. Empty is the state to hold: a config naming a
    // barrel makes its scope read wider than it is. The detection itself is
    // covered by the fixture case above, so this staying empty is not a check
    // that passes because nothing looked.
    expect(named).toEqual([]);
  });
});

// The snapshot in the doc goes stale as the source grows, which is why it is
// labelled as a snapshot rather than pinned here. What must always hold is that
// its numbers agree with each other — #1950 had to fix a sentence that took
// barrel plus type-only as part of the implementation total, and that class of
// error is what makes a reader distrust the whole table.
describe('the doc snapshot is internally consistent', () => {
  const doc = () => readFileSync(DOC, 'utf8');

  /** Capture groups as numbers, thousands separators dropped. */
  function numbersFrom(pattern: RegExp, label: string): number[] {
    const found = pattern.exec(doc());
    if (!found) throw new Error(`${label}: no line in ${DOC} matches ${pattern}`);
    return found.slice(1).map((group) => Number(String(group).replace(/,/g, '')));
  }

  const bucket = (label: string): number =>
    numbersFrom(new RegExp(`\\|\\s*${label}\\s*\\|\\s*([\\d,]+)\\s*\\|`), `bucket ${label}`)[0] ?? 0;

  it('adds the buckets up to the implementation total it states', () => {
    const [stated] = numbersFrom(/([\d,]+) implementation lines/, 'implementation total');
    expect(bucket('implementation, in `mutate`') + bucket('implementation, not in `mutate`')).toBe(
      stated,
    );
  });

  it('states a covered percentage that matches its own buckets', () => {
    const [percent = 0, inMutate = 0, total = 1] = numbersFrom(
      /So ([\d.]+)% of implementation lines were covered \(([\d,]+) of ([\d,]+)\)/,
      'covered percentage',
    );
    expect(inMutate).toBe(bucket('implementation, in `mutate`'));
    expect(((inMutate / total) * 100).toFixed(1)).toBe(percent.toFixed(1));
  });

  it('keeps barrel plus type-only outside the implementation total', () => {
    const [everything = 0, nonImplementation = 0] = numbersFrom(
      /Everything outside `mutate` totals ([\d,]+) lines, and barrel plus type-only accounts for ([\d,]+)/,
      'outside total',
    );
    const barrel = bucket('barrel');
    const typeOnly = bucket('type-only');
    expect(everything).toBe(bucket('implementation, not in `mutate`') + barrel + typeOnly);
    expect(nonImplementation).toBe(barrel + typeOnly);
  });
});

describe('the command line', () => {
  it('prints a per-package table, a total row, and every note', async () => {
    const { stdout } = await bareRun();
    expect(stdout).toMatch(/^package\s+impl\s+in mutate\s+uncovered\s+barrel\s+type-only$/m);
    expect(stdout).toMatch(/^total\s+[\d,]+\s+[\d,]+\s+[\d,]+\s+[\d,]+\s+[\d,]+$/m);
    const { NOTE_LABELS } = await loadScript();
    for (const label of Object.values(NOTE_LABELS) as string[]) expect(stdout).toContain(label);
  });

  it('classifies every package the gate reads', async () => {
    const { stdout } = await bareRun();
    const counted = /(\d+) of (\d+) gate packages classified/.exec(stdout);
    expect(counted, 'gate package count line').not.toBeNull();
    const [, classified, known] = counted ?? [];
    expect(classified).toBe(known);
  });

  it('lists one package with a line count per file', async () => {
    // A package with nothing left outside `mutate` cannot show the row shape, so
    // this needs one that still has files. It used to name a real package —
    // `observability` until #1980 widened it, then `orm` and `dapp`. #1985 and
    // #1987 widened those too, and with the repository at 100% there is no
    // package left that can produce the row.
    //
    // A fixture is what the assertion was always about: that `--list` prints a
    // file and its line count in the documented shape. Reaching for whichever
    // package happens to be behind made the check expire every time one caught
    // up, and it expired silently — the run failed on the last widening, not on
    // the change that made the name wrong.
    const root = fixtureRepo(
      'core',
      { 'listed.ts': 'export const a = 1;\nexport const b = 2;\n' },
      [],
    );
    const { stdout } = await runScript(['--list', 'core'], root);
    expect(stdout).toContain('core — implementation files not in `mutate`');
    expect(stdout).toMatch(/^ {2}listed\.ts\s+2$/m);
  });

  it('says so when a package has nothing left outside `mutate`', async () => {
    const { stdout } = await runScript(['--list', 'a11y']);
    expect(stdout).toContain('(none — every implementation file is listed)');
  });

  it('exits 2 for a package the gate does not read', async () => {
    const failure = await runScript(['--list', 'nope']).catch(
      (error: Error & { code: number; stderr: string }) => error,
    );
    const { code, stderr } = failure as Error & { code: number; stderr: string };
    expect(code).toBe(2);
    expect(stderr).toContain('unknown package: nope');
  });

  it('exits 2 when --list has no package name', async () => {
    const failure = await runScript(['--list']).catch((error: Error & { code: number }) => error);
    expect((failure as Error & { code: number }).code).toBe(2);
  });

  it('does nothing when the module is only imported', async () => {
    // The classifier is imported by these checks, so importing must not run the
    // aggregation — a report printed on import would also make every consumer
    // pay for a full repository walk.
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ['--input-type=module', '-e', `await import(${JSON.stringify(SCRIPT_URL)});`],
      { cwd: REPO_ROOT },
    );
    expect(stdout).toBe('');
    expect(stderr).toBe('');
  });
});
