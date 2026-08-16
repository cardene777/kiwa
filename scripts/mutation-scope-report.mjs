#!/usr/bin/env node
/**
 * Mutation scope report.
 *
 * Answers one question: which implementation files sit outside `mutate` today?
 *
 * `packages/*\/stryker.config.mjs` lists mutation targets by hand, so a file added
 * later stays outside the scope until someone edits that list. The gate cannot
 * see the difference — a package with two files listed and a package with all of
 * them listed both report "passed". This script makes the gap visible.
 *
 * Classification is syntactic, not by filename. A file is out of scope only when
 * it produces no runtime value:
 *
 *   type-only      — declares nothing but types and interfaces
 *   barrel         — re-exports other modules and defines nothing itself
 *   implementation — exports a function, class, enum, or variable
 *
 * Rule and rationale: docs/quality/mutation-thresholds.md § What goes in `mutate`.
 *
 * Usage:
 *   node scripts/mutation-scope-report.mjs              # per-package summary
 *   node scripts/mutation-scope-report.mjs --list auth  # the uncovered files of one package
 *   node scripts/mutation-scope-report.mjs --json       # machine-readable
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const SCRIPT_ROOT = resolve(new URL('..', import.meta.url).pathname);
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
  ? process.cwd()
  : SCRIPT_ROOT;

/**
 * Classify one file. Exported for the test — the buckets are the whole point of
 * this script, so they need to be checkable without spawning it.
 */
export function classifySource(source, fileName = 'x.ts') {
  // Ask the compiler, don't enumerate node kinds.
  //
  // The first version walked the TypeScript AST and listed the declarations that
  // produce runtime values. Every review round found another form it had missed:
  // `export { run }` split from its declaration, `export default <expr>`,
  // `export namespace`, then `export declare function`. The list has no natural
  // end, and each miss silently drops a real implementation file out of scope.
  //
  // Stripping the types first removes the question. Whatever survives to the
  // emitted JavaScript is, by definition, what exists at runtime — `declare`,
  // `interface`, `type`, and type-only exports are all gone, and nothing new can
  // appear that the emitter does not know about.
  const transpiled = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      // Keeps `export {}` markers intact so an empty module stays distinguishable
      // from one that exports nothing at all.
      isolatedModules: true,
      verbatimModuleSyntax: false,
    },
  });

  // A file that does not parse emits nothing, which would read as "no runtime
  // value" and quietly drop it from the report. Refuse instead — a broken file is
  // a fact worth surfacing, not a file with nothing in it.
  const syntaxErrors = (transpiled.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error,
  );
  if (syntaxErrors.length > 0) {
    const first = ts.flattenDiagnosticMessageText(syntaxErrors[0].messageText, ' ');
    throw new Error(`cannot parse ${fileName}: ${first}`);
  }

  const js = transpiled.outputText;

  const emitted = ts.createSourceFile(
    `${fileName}.emitted.js`,
    js,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );

  let runtimeExports = 0;
  let reExports = 0;

  for (const node of emitted.statements) {
    if (ts.isExportDeclaration(node)) {
      // With a module specifier it forwards another module; without one it
      // publishes something declared here.
      if (node.moduleSpecifier) reExports += 1;
      else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        runtimeExports += node.exportClause.elements.length;
      }
      continue;
    }
    if (ts.isExportAssignment(node)) {
      runtimeExports += 1;
      continue;
    }

    const exported =
      ts.canHaveModifiers(node) &&
      (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;

    runtimeExports += ts.isVariableStatement(node)
      ? node.declarationList.declarations.length
      : 1;
  }

  if (runtimeExports > 0) return 'implementation';
  if (reExports > 0) return 'barrel';
  return 'type-only';
}

/** Read the `mutate` array of a stryker config as `src`-relative `.ts` paths. */
export function parseMutateTargets(configSource) {
  const block = configSource.match(/mutate:\s*\[([^\]]*)\]/s);
  if (!block) return [];
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) =>
    m[1].replace('.vitest-dist/src/', '').replace(/\.js$/, '.ts'),
  );
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function gatedPackages() {
  const gate = readFileSync(resolve(REPO_ROOT, 'scripts/check-mutation-gates.mjs'), 'utf8');
  return [...gate.matchAll(/'@kiwa-lab\/([a-z0-9-]+)': \{ tier/g)].map((m) => m[1]);
}

export function reportForPackage(pkg) {
  const pkgDir = resolve(REPO_ROOT, 'packages', pkg);
  const srcDir = `${pkgDir}/src`;
  const cfgPath = `${pkgDir}/stryker.config.mjs`;
  if (!existsSync(srcDir) || !existsSync(cfgPath)) return null;

  const targets = new Set(parseMutateTargets(readFileSync(cfgPath, 'utf8')));
  const covered = [];
  const uncovered = [];
  // Files named in `mutate` that hold nothing to mutate. Harmless to Stryker, but
  // they make the list look wider than it is — `a11y` names two files and only one
  // of them can produce a mutant.
  const listedWithoutValue = [];
  let barrelLines = 0;
  let typeOnlyLines = 0;

  for (const file of walk(srcDir)) {
    const rel = file.slice(`${srcDir}/`.length);
    const body = readFileSync(file, 'utf8');
    const lines = body.split('\n').length;
    const kind = classifySource(body, file);

    if (kind !== 'implementation') {
      if (kind === 'barrel') barrelLines += lines;
      else typeOnlyLines += lines;
      if (targets.has(rel)) listedWithoutValue.push({ file: rel, lines, kind });
      continue;
    }

    if (targets.has(rel)) covered.push({ file: rel, lines });
    else uncovered.push({ file: rel, lines });
  }

  // Entries the config names that no longer exist. `walk` cannot see them, so
  // without this they vanish — the config looks like it covers a file it does not.
  const seen = new Set([
    ...covered.map((e) => e.file),
    ...listedWithoutValue.map((e) => e.file),
  ]);
  const listedButMissing = [...targets].filter((t) => !seen.has(t)).sort();

  const sum = (xs) => xs.reduce((s, x) => s + x.lines, 0);
  uncovered.sort((a, b) => b.lines - a.lines);
  return {
    pkg,
    covered,
    uncovered,
    listedWithoutValue,
    listedButMissing,
    coveredLines: sum(covered),
    uncoveredLines: sum(uncovered),
    barrelLines,
    typeOnlyLines,
  };
}

// Everything below runs only when this file is the entry point. The classifiers
// above are imported by the test, and importing must not print a report or exit.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runCli();
}

function runCli() {
  const args = process.argv.slice(2);
  const listIndex = args.indexOf('--list');
  const asJson = args.includes('--json');

const reports = gatedPackages()
  .map(reportForPackage)
  .filter((r) => r !== null);

if (listIndex >= 0) {
  const target = args[listIndex + 1];
  const report = reports.find((r) => r.pkg === target);
  if (!report) {
    process.stderr.write(`unknown package: ${target ?? '(missing argument)'}\n`);
    process.exit(2);
  }
  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`# ${target} — outside mutate (${report.uncovered.length} files, ${report.uncoveredLines} lines)\n\n`);
    for (const { file, lines } of report.uncovered) {
      process.stdout.write(`${String(lines).padStart(6)}  ${file}\n`);
    }
    // Whoever widens this package reads this view, so the dead entries in its
    // own config belong here too — the summary alone is easy to miss.
    if (report.listedWithoutValue.length > 0) {
      process.stdout.write(`\n# named in mutate but holds no runtime value\n\n`);
      for (const { file, lines, kind } of report.listedWithoutValue) {
        process.stdout.write(`${String(lines).padStart(6)}  ${file} (${kind})\n`);
      }
    }
  }
  process.exit(0);
}

if (asJson) {
  process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
process.stdout.write(
  `${pad('package', 16)}${pad('in mutate', 14)}${pad('outside', 14)}${pad('barrel', 10)}type-only\n`,
);
process.stdout.write(`${'-'.repeat(62)}\n`);

const totals = { covered: 0, uncovered: 0, barrel: 0, typeOnly: 0 };
for (const r of reports) {
  totals.covered += r.coveredLines;
  totals.uncovered += r.uncoveredLines;
  totals.barrel += r.barrelLines;
  totals.typeOnly += r.typeOnlyLines;
  process.stdout.write(
    `${pad(r.pkg, 16)}${pad(`${r.coveredLines} / ${r.covered.length}f`, 14)}${pad(
      `${r.uncoveredLines} / ${r.uncovered.length}f`,
      14,
    )}${pad(r.barrelLines, 10)}${r.typeOnlyLines}\n`,
  );
}
process.stdout.write(`${'-'.repeat(62)}\n`);

const implTotal = totals.covered + totals.uncovered;
process.stdout.write(
  `${pad('total', 16)}${pad(totals.covered, 14)}${pad(totals.uncovered, 14)}${pad(
    totals.barrel,
    10,
  )}${totals.typeOnly}\n\n`,
);
process.stdout.write(
  `implementation: ${implTotal} lines, ${totals.covered} in mutate (${(
    (totals.covered / implTotal) *
    100
  ).toFixed(1)}%)\n`,
);
process.stdout.write(
  `barrel + type-only: ${totals.barrel + totals.typeOnly} lines (no runtime value to mutate)\n`,
);

const listedEmpty = reports.flatMap((r) =>
  r.listedWithoutValue.map((e) => `${r.pkg}/${e.file} (${e.kind})`),
);
if (listedEmpty.length > 0) {
  process.stdout.write(
    `\nnamed in mutate but holds no runtime value: ${listedEmpty.join(', ')}\n`,
  );
}

const listedMissing = reports.flatMap((r) =>
  r.listedButMissing.map((f) => `${r.pkg}/${f}`),
);
if (listedMissing.length > 0) {
  process.stdout.write(`\nnamed in mutate but the file is gone: ${listedMissing.join(', ')}\n`);
}
}
