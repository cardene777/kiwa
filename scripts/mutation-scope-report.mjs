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
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let runtimeExports = 0;
  let reExports = 0;

  for (const node of sf.statements) {
    const exported = ts.canHaveModifiers(node)
      ? (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      : false;

    if (ts.isExportDeclaration(node)) {
      // `export type { X } from` carries no runtime value.
      if (node.isTypeOnly) continue;

      // No module specifier means `export { run }` — it publishes declarations
      // from this same file, so it is not a re-export. Counting it as one files
      // the whole file under "barrel" and drops real implementation out of scope.
      // The declaration itself carries no `export` modifier in this form, so it
      // is not counted anywhere else either.
      if (!node.moduleSpecifier) {
        const clause = node.exportClause;
        if (clause && ts.isNamedExports(clause)) {
          runtimeExports += clause.elements.filter((el) => !el.isTypeOnly).length;
        }
        continue;
      }

      reExports += 1;
      continue;
    }
    // `export default <expr>` and `export = <expr>`. Both publish a runtime value
    // and match none of the declaration checks below.
    if (ts.isExportAssignment(node)) {
      runtimeExports += 1;
      continue;
    }
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) continue;
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isEnumDeclaration(node)
    ) {
      if (exported) runtimeExports += 1;
      continue;
    }
    if (ts.isVariableStatement(node)) {
      if (exported) runtimeExports += node.declarationList.declarations.length;
    }
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
  let barrelLines = 0;
  let typeOnlyLines = 0;

  for (const file of walk(srcDir)) {
    const rel = file.slice(`${srcDir}/`.length);
    const body = readFileSync(file, 'utf8');
    const lines = body.split('\n').length;
    const kind = classifySource(body, file);

    if (kind === 'barrel') barrelLines += lines;
    else if (kind === 'type-only') typeOnlyLines += lines;
    else if (targets.has(rel)) covered.push({ file: rel, lines });
    else uncovered.push({ file: rel, lines });
  }

  const sum = (xs) => xs.reduce((s, x) => s + x.lines, 0);
  uncovered.sort((a, b) => b.lines - a.lines);
  return {
    pkg,
    covered,
    uncovered,
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
}
