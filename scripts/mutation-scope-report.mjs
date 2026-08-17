#!/usr/bin/env node
/**
 * Mutation scope report.
 *
 * Answers two questions with one classification pass over every package's src:
 *
 *   1. which implementation files of a package are not named in its Stryker
 *      `mutate` list (the input every per-package widening Issue needs), and
 *   2. what the repo-wide split between implementation, barrel, and type-only
 *      lines is (the measurement `docs/quality/mutation-thresholds.md`
 *      § The measurement that produced this rule records).
 *
 * The classification follows § Telling the shapes apart: strip the types and
 * read what the emitted JavaScript exports.
 *
 *   own values present -> implementation
 *   only forwards      -> barrel
 *   neither            -> type-only
 *
 * Enumerating the declaration forms that produce runtime values is the approach
 * this one replaces. #1944 wrote that check and had to extend it in four
 * consecutive review rounds (`export { run }` split from its declaration,
 * `export default <expr>`, `export namespace`, `export declare function`), and
 * such a list has no point at which it is provably complete.
 *
 * Where the test and the rule come apart, the file is named rather than
 * silently bucketed — see § Notes below and the same section in the doc.
 *
 * Usage:
 *   node scripts/mutation-scope-report.mjs             # per-package + totals
 *   node scripts/mutation-scope-report.mjs --list cli  # files outside `mutate`
 *
 * Exit codes: 0 report written, 1 a source file could not be classified,
 * 2 unknown package name.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

import { PACKAGE_TIER } from './check-mutation-gates.mjs';

const SCRIPT_ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Same root resolution as the neighbouring gate scripts, so a test can point
 * the whole report at a fixture tree with one environment variable.
 */
export function repoRootFor(cwd = process.cwd(), env = process.env) {
  if (env.KIWA_GATE_ROOT) return resolve(env.KIWA_GATE_ROOT);
  if (cwd !== '/' && existsSync(resolve(cwd, 'packages'))) return cwd;
  return SCRIPT_ROOT;
}

/** Gate packages, short name (`cli`) keyed to the scoped name the gate uses. */
export const PACKAGES = Object.freeze(
  Object.keys(PACKAGE_TIER).map((scoped) => scoped.replace(/^@kiwa-lab\//, '')),
);

/** Thrown instead of guessing when a package name is not one the gate reads. */
export class UnknownPackageError extends Error {
  constructor(pkg) {
    super(`unknown package: ${pkg}\nknown: ${PACKAGES.join(', ')}`);
    this.name = 'UnknownPackageError';
    this.pkg = pkg;
  }
}

/**
 * Thrown when the compiler reports an error for a source file.
 *
 * A file it cannot parse emits nothing, which is indistinguishable from a file
 * that holds nothing but types. Classifying it would file real implementation
 * under type-only and drop it from every total, so the run stops instead.
 */
export class SourceParseError extends Error {
  constructor(file, diagnostics) {
    const detail = diagnostics
      .map((d) => `  TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`)
      .join('\n');
    super(`cannot classify ${file} — the compiler rejected it:\n${detail}`);
    this.name = 'SourceParseError';
    this.file = file;
    this.diagnostics = diagnostics;
  }
}

/**
 * Thrown for `export = value`, which this report cannot read.
 *
 * The classification transpiles as ESM, and an ESM emit drops `export =`
 * without a word — the emitted module is an empty `export {}` marker, which
 * reads as type-only. Every package here is ESM, so the form cannot compile in
 * this repo at all; the check exists so that if one appears the run stops
 * rather than filing a module with runtime values under "declares only types".
 */
export class CommonJsExportError extends Error {
  constructor(file) {
    super(
      `cannot classify ${file} — it uses \`export =\`.\n` +
        'This report transpiles as ESM, where that form emits nothing and would read as type-only.',
    );
    this.name = 'CommonJsExportError';
    this.file = file;
  }
}

/** Thrown for a `mutate` entry this report cannot resolve to one source file. */
export class UnresolvableTargetError extends Error {
  constructor(pkg, entry) {
    super(
      `${pkg}: cannot map the \`mutate\` entry ${JSON.stringify(entry)} to a single source file.\n` +
        'This report resolves literal paths only. A wildcard entry would make every line count ' +
        'for this package a guess, so it stops rather than reporting one.',
    );
    this.name = 'UnresolvableTargetError';
    this.pkg = pkg;
    this.entry = entry;
  }
}

/**
 * Lines of content: a trailing newline terminates the last line, it does not
 * start another one. `split('\n').length` reads one line too many for every
 * newline-terminated file, which is every file in this repo — #1944 measured
 * `a11y/src/layer-harness.ts` as 467 lines where `wc -l` says 466, and carried
 * that +1 per file into its published totals.
 */
export function countLines(body) {
  if (body === '') return 0;
  const withoutTerminator = body.endsWith('\n') ? body.slice(0, -1) : body;
  return withoutTerminator.split('\n').length;
}

function scriptKindFor(fileName) {
  return fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function localBindingsOf(statements) {
  const locals = new Set();
  for (const node of statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause) continue;
    const clause = node.importClause;
    if (clause.name) locals.add(clause.name.text);
    const bindings = clause.namedBindings;
    if (!bindings) continue;
    if (ts.isNamespaceImport(bindings)) locals.add(bindings.name.text);
    else for (const element of bindings.elements) locals.add(element.name.text);
  }
  return locals;
}

/**
 * Classify one source file and report what the decision rested on.
 *
 * @returns {{
 *   kind: 'implementation' | 'barrel' | 'type-only',
 *   ownValues: number,
 *   forwards: number,
 *   mixed: boolean,
 *   runsWithoutExporting: boolean,
 *   publishesImportsOnly: boolean,
 *   forwardLines: number,
 * }}
 */
export function classify(source, fileName = 'input.ts') {
  if (usesExportEquals(source, fileName)) throw new CommonJsExportError(fileName);

  const transpiled = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      // Keeps the `export {}` marker on a file whose exports were all types, so
      // "declared only types" stays distinguishable from "declared nothing".
      isolatedModules: true,
      // `.tsx` sources emit `React.createElement` calls, which the emitted-code
      // parser below can read. Preserved JSX would not parse as JavaScript.
      jsx: ts.JsxEmit.React,
    },
  });

  const errors = (transpiled.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) throw new SourceParseError(fileName, errors);

  const emitted = ts.createSourceFile(
    `${fileName}.emitted.js`,
    transpiled.outputText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );

  const imported = localBindingsOf(emitted.statements);
  let ownValues = 0;
  let forwards = 0;
  let ownValuesFromImports = 0;
  // Work the emitted module still does at load time, counting neither the
  // forwarding statements nor the empty `export {}` marker. Forwarding is what a
  // barrel is made of, so counting it here would call every barrel a side
  // effect; the marker does nothing at all.
  let sideEffectStatements = 0;

  for (const node of emitted.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        forwards += 1;
        continue;
      }
      const clause = node.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          ownValues += 1;
          if (imported.has((element.propertyName ?? element.name).text)) ownValuesFromImports += 1;
        }
      }
      continue;
    }

    if (ts.isExportAssignment(node)) {
      ownValues += 1;
      if (ts.isIdentifier(node.expression) && imported.has(node.expression.text)) {
        ownValuesFromImports += 1;
      }
      continue;
    }

    sideEffectStatements += 1;
    const exported =
      ts.canHaveModifiers(node) &&
      (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    ownValues += ts.isVariableStatement(node) ? node.declarationList.declarations.length : 1;
  }

  const kind = ownValues > 0 ? 'implementation' : forwards > 0 ? 'barrel' : 'type-only';
  return {
    kind,
    ownValues,
    forwards,
    mixed: ownValues > 0 && forwards > 0,
    // Runs, publishes nothing of its own. The rule puts such a file in `mutate`;
    // this test cannot see it, so it is named instead of sitting in a bucket
    // that reads "forwards only" or "declares only types".
    //
    // Keyed on the absence of own values rather than on the bucket: a barrel
    // that also calls something lands in `barrel`, and gating on type-only
    // would let that one through unnamed.
    runsWithoutExporting: ownValues === 0 && sideEffectStatements > 0,
    // Every own value it publishes came from an import, so it forwards in a
    // shape the syntactic test reads as implementation.
    publishesImportsOnly: ownValues > 0 && ownValues === ownValuesFromImports,
    forwardLines: forwards > 0 ? reExportLines(source, fileName) : 0,
  };
}

/**
 * Whether the file really contains `export = value`.
 *
 * The text test alone would fire on the form written inside a comment or a
 * string, so a hit is confirmed against the parsed source. The text test keeps
 * that parse off the path every other file takes.
 */
function usesExportEquals(source, fileName) {
  if (!/export\s*=/.test(source)) return false;
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  );
  return sf.statements.some((node) => ts.isExportAssignment(node) && node.isExportEquals === true);
}

/**
 * Lines occupied by re-export statements in the original source.
 *
 * A file that both implements and forwards counts entirely as implementation,
 * so its re-export lines sit inside the implementation total. This is the
 * number to subtract when that matters — the file's own line count is not, and
 * #1944 published the two mixed files' full 442 lines as if it were.
 */
function reExportLines(source, fileName) {
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  );
  let lines = 0;
  for (const node of sf.statements) {
    if (!ts.isExportDeclaration(node) || !node.moduleSpecifier || node.isTypeOnly) continue;
    const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line;
    lines += end - start + 1;
  }
  return lines;
}

const SKIP_DIRS = new Set(['node_modules', 'dist', '.vitest-dist', 'coverage', '__snapshots__']);

/** Every TypeScript source under `dir`, sorted, ambient declarations excluded. */
export function walkSources(dir) {
  const found = [];
  const visit = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(entry)) visit(full);
        continue;
      }
      if (entry.endsWith('.d.ts')) continue;
      if (entry.endsWith('.ts') || entry.endsWith('.tsx')) found.push(full);
    }
  };
  visit(dir);
  return found;
}

/**
 * Resolve a Stryker `mutate` entry to its source file, relative to `src/`.
 *
 * Configs point at the compiled artefacts under `.vitest-dist/src`, so the
 * mapping is by path, not by reading the build.
 */
export function targetToSource(entry, pkg, srcDir) {
  if (entry.includes('*') || entry.includes('?')) throw new UnresolvableTargetError(pkg, entry);
  const withoutBuildDir = entry.replace(/^\.?\/?\.vitest-dist\//, '').replace(/^src\//, '');
  const stem = withoutBuildDir.replace(/\.[cm]?js$/, '');
  for (const extension of ['.ts', '.tsx']) {
    if (existsSync(join(srcDir, `${stem}${extension}`))) return `${stem}${extension}`;
  }
  return null;
}

async function readMutateEntries(configPath) {
  const config = await import(pathToFileURL(configPath).href);
  return config.default?.mutate ?? [];
}

/**
 * Classify one package's sources against its `mutate` list.
 *
 * @returns null when the package has no `src/` or no Stryker config.
 */
export async function reportForPackage(pkg, options = {}) {
  const short = pkg.replace(/^@kiwa-lab\//, '');
  if (!PACKAGES.includes(short)) throw new UnknownPackageError(pkg);

  const root = options.root ? resolve(options.root) : repoRootFor();
  const pkgDir = join(root, 'packages', short);
  const srcDir = join(pkgDir, 'src');
  const configPath = join(pkgDir, 'stryker.config.mjs');
  if (!existsSync(srcDir) || !existsSync(configPath)) return null;

  const entries = await readMutateEntries(configPath);
  const targets = new Set();
  const listedButMissing = [];
  for (const entry of entries) {
    const resolved = targetToSource(entry, short, srcDir);
    if (resolved === null) listedButMissing.push(entry);
    else targets.add(resolved);
  }

  const covered = [];
  const uncovered = [];
  // Named in `mutate` but holding no runtime value. Harmless to Stryker, which
  // finds nothing to mutate there, but it makes the list read wider than it is.
  const listedWithoutValue = [];
  const mixed = [];
  const runsWithoutExporting = [];
  const publishesImportsOnly = [];
  let barrelLines = 0;
  let typeOnlyLines = 0;

  for (const file of walkSources(srcDir)) {
    const rel = relative(srcDir, file);
    const body = readFileSync(file, 'utf8');
    const lines = countLines(body);
    const shape = classify(body, file);

    if (shape.kind !== 'implementation') {
      if (shape.kind === 'barrel') barrelLines += lines;
      else typeOnlyLines += lines;
      if (targets.has(rel)) listedWithoutValue.push({ file: rel, lines, kind: shape.kind });
      if (shape.runsWithoutExporting) runsWithoutExporting.push({ file: rel, lines });
      continue;
    }

    if (targets.has(rel)) covered.push({ file: rel, lines });
    else uncovered.push({ file: rel, lines });
    if (shape.mixed) mixed.push({ file: rel, lines, forwardLines: shape.forwardLines });
    if (shape.publishesImportsOnly) publishesImportsOnly.push({ file: rel, lines });
  }

  const sum = (rows) => rows.reduce((total, row) => total + row.lines, 0);
  const byLinesDesc = (a, b) => b.lines - a.lines || a.file.localeCompare(b.file);
  covered.sort(byLinesDesc);
  uncovered.sort(byLinesDesc);

  return {
    pkg: short,
    covered,
    uncovered,
    listedWithoutValue,
    listedButMissing,
    mixed,
    runsWithoutExporting,
    publishesImportsOnly,
    coveredLines: sum(covered),
    uncoveredLines: sum(uncovered),
    barrelLines,
    typeOnlyLines,
  };
}

/** Every gate package, in the order the gate lists them. */
export async function reportAll(options = {}) {
  const packages = [];
  for (const pkg of PACKAGES) {
    const report = await reportForPackage(pkg, options);
    if (report) packages.push(report);
  }

  const total = (field) => packages.reduce((sum, p) => sum + p[field], 0);
  const collect = (field) =>
    packages.flatMap((p) => p[field].map((row) => ({ pkg: p.pkg, ...row })));

  return {
    packages,
    coveredLines: total('coveredLines'),
    uncoveredLines: total('uncoveredLines'),
    implementationLines: total('coveredLines') + total('uncoveredLines'),
    barrelLines: total('barrelLines'),
    typeOnlyLines: total('typeOnlyLines'),
    listedWithoutValue: collect('listedWithoutValue'),
    listedButMissing: packages.flatMap((p) =>
      p.listedButMissing.map((entry) => ({ pkg: p.pkg, entry })),
    ),
    mixed: collect('mixed'),
    runsWithoutExporting: collect('runsWithoutExporting'),
    publishesImportsOnly: collect('publishesImportsOnly'),
    outsideTheGate: packagesOutsideTheGate(options),
  };
}

/**
 * Packages that carry a Stryker config the gate never reads.
 *
 * They run mutation testing locally and no threshold checks the result, which
 * is the same shape of invisibility this report exists to surface.
 */
function packagesOutsideTheGate(options = {}) {
  const root = options.root ? resolve(options.root) : repoRootFor();
  const packagesDir = join(root, 'packages');
  if (!existsSync(packagesDir)) return [];
  return readdirSync(packagesDir)
    .sort()
    .filter(
      (name) =>
        !PACKAGES.includes(name) && existsSync(join(packagesDir, name, 'stryker.config.mjs')),
    );
}

const n = (value) => value.toLocaleString('en-US');
const pad = (value, width) => String(value).padEnd(width);
const padStart = (value, width) => String(value).padStart(width);

/**
 * The five shapes where the syntactic test and the rule can come apart, plus
 * the packages the gate does not read.
 *
 * All six are printed on every run, `—` included. A count only shown when it is
 * non-zero cannot tell "checked, none found" from "never checked", and the
 * whole point of this report is that nothing goes missing quietly.
 */
export const NOTE_LABELS = Object.freeze({
  listedWithoutValue: 'named in `mutate`, holds no runtime value',
  listedButMissing: 'named in `mutate`, source file is gone',
  mixed: 'implements and forwards',
  runsWithoutExporting: 'runs at load time, publishes nothing of its own',
  publishesImportsOnly: 'publishes imported bindings only',
  outsideTheGate: 'Stryker config the gate never reads',
});

function renderNotes(report) {
  const width = Math.max(...Object.values(NOTE_LABELS).map((label) => label.length));
  const mixedForwardLines = report.mixed.reduce((sum, row) => sum + row.forwardLines, 0);
  const mixedTotalLines = report.mixed.reduce((sum, row) => sum + row.lines, 0);

  const rows = [
    [NOTE_LABELS.listedWithoutValue, report.listedWithoutValue.map((r) => `${r.pkg}/${r.file}`)],
    [NOTE_LABELS.listedButMissing, report.listedButMissing.map((r) => `${r.pkg}: ${r.entry}`)],
    [
      NOTE_LABELS.mixed,
      report.mixed.map((r) => `${r.pkg}/${r.file}`),
      report.mixed.length === 0
        ? ''
        : ` (${n(mixedTotalLines)} lines, ${n(mixedForwardLines)} of them re-export)`,
    ],
    [NOTE_LABELS.runsWithoutExporting, report.runsWithoutExporting.map((r) => `${r.pkg}/${r.file}`)],
    [NOTE_LABELS.publishesImportsOnly, report.publishesImportsOnly.map((r) => `${r.pkg}/${r.file}`)],
    [NOTE_LABELS.outsideTheGate, report.outsideTheGate],
  ];

  return [
    '',
    'notes — checked on every run, `—` means none found',
    ...rows.map(
      ([label, names, suffix = '']) =>
        `  ${pad(label, width)}  ${padStart(names.length, 3)}  ${names.length === 0 ? '—' : names.join(', ')}${suffix}`,
    ),
  ];
}

export function renderSummary(report) {
  const width = Math.max(7, ...report.packages.map((p) => p.pkg.length));
  const lines = [
    `${pad('package', width)}  ${padStart('impl', 8)}  ${padStart('in mutate', 10)}  ${padStart('uncovered', 10)}  ${padStart('barrel', 7)}  ${padStart('type-only', 9)}`,
  ];

  for (const p of report.packages) {
    lines.push(
      `${pad(p.pkg, width)}  ${padStart(n(p.coveredLines + p.uncoveredLines), 8)}  ${padStart(n(p.coveredLines), 10)}  ${padStart(n(p.uncoveredLines), 10)}  ${padStart(n(p.barrelLines), 7)}  ${padStart(n(p.typeOnlyLines), 9)}`,
    );
  }

  const percent = report.implementationLines
    ? ((report.coveredLines / report.implementationLines) * 100).toFixed(1)
    : '0.0';
  lines.push(
    `${pad('total', width)}  ${padStart(n(report.implementationLines), 8)}  ${padStart(n(report.coveredLines), 10)}  ${padStart(n(report.uncoveredLines), 10)}  ${padStart(n(report.barrelLines), 7)}  ${padStart(n(report.typeOnlyLines), 9)}`,
    '',
    `${percent}% of implementation lines are in \`mutate\` (${n(report.coveredLines)} of ${n(report.implementationLines)}).`,
    `Lines outside \`mutate\` total ${n(report.uncoveredLines + report.barrelLines + report.typeOnlyLines)}, of which ${n(report.barrelLines + report.typeOnlyLines)} is barrel plus type-only.`,
    // A gate package without `src/` or without a Stryker config drops out of the
    // rows above. Printing both counts is how that shows up rather than being
    // read as a smaller repo.
    `${report.packages.length} of ${PACKAGES.length} gate packages classified (a package needs src/ and stryker.config.mjs to appear).`,
    ...renderNotes(report),
  );
  return lines.join('\n');
}

export function renderPackageList(report) {
  const lines = [`${report.pkg} — implementation files not in \`mutate\``];
  if (report.uncovered.length === 0) lines.push('  (none — every implementation file is listed)');
  const width = Math.max(0, ...report.uncovered.map((row) => row.file.length));
  for (const row of report.uncovered) {
    lines.push(`  ${pad(row.file, width)}  ${padStart(n(row.lines), 6)}`);
  }
  lines.push(
    '',
    `  ${n(report.uncoveredLines)} lines outside \`mutate\`, ${n(report.coveredLines)} inside.`,
  );

  const named = [
    [
      NOTE_LABELS.listedWithoutValue,
      report.listedWithoutValue.map((r) => `${r.file} (${r.kind}, ${n(r.lines)} lines)`),
    ],
    [NOTE_LABELS.listedButMissing, report.listedButMissing],
    [
      NOTE_LABELS.mixed,
      report.mixed.map((r) => `${r.file} (${n(r.lines)} lines, ${n(r.forwardLines)} of them re-export)`),
    ],
    [
      NOTE_LABELS.runsWithoutExporting,
      report.runsWithoutExporting.map((r) => `${r.file} (${n(r.lines)} lines)`),
    ],
    [NOTE_LABELS.publishesImportsOnly, report.publishesImportsOnly.map((r) => `${r.file} (${n(r.lines)} lines)`)],
  ].filter(([, rows]) => rows.length > 0);

  for (const [label, rows] of named) {
    lines.push('', `  ${label}:`);
    for (const row of rows) lines.push(`    ${row}`);
  }
  return lines.join('\n');
}

async function main(argv) {
  const listIndex = argv.indexOf('--list');
  if (listIndex !== -1) {
    const pkg = argv[listIndex + 1];
    if (!pkg) {
      process.stderr.write('--list needs a package name\n');
      return 2;
    }
    let report;
    try {
      report = await reportForPackage(pkg);
    } catch (error) {
      if (!(error instanceof UnknownPackageError)) throw error;
      process.stderr.write(`${error.message}\n`);
      return 2;
    }
    if (!report) {
      process.stderr.write(`${pkg}: no src/ or no stryker.config.mjs\n`);
      return 2;
    }
    process.stdout.write(`${renderPackageList(report)}\n`);
    return 0;
  }

  process.stdout.write(`${renderSummary(await reportAll())}\n`);
  return 0;
}

if (pathToFileURL(process.argv[1] ?? '').href === import.meta.url) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    });
}
