#!/usr/bin/env node
/**
 * CI coverage gate.
 *
 * Reads each package's `coverage/coverage-summary.json` (vitest v8 output) and
 * fails the build when a package's total Lines / Branches / Functions / Statements
 * falls below the configured thresholds.
 *
 * Run with `node scripts/check-coverage-gates.mjs` from the repo root after
 * each `pnpm -F <pkg> run test:cov` has produced its coverage report.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Default to the repo containing this script, but allow CWD override for tests / CI.
const SCRIPT_ROOT = resolve(new URL('..', import.meta.url).pathname);
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
  ? process.cwd()
  : SCRIPT_ROOT;

const PACKAGES = [
  '@kiwa/core',
  '@kiwa/api',
  '@kiwa/ui',
  '@kiwa/data',
  '@kiwa/cli-test',
  '@kiwa/observability',
  '@kiwa/e2e',
  '@kiwa/cli',
  '@kiwa/dapp',
  '@kiwa/a11y',
  '@kiwa/visual',
  '@kiwa/nextjs',
  '@kiwa/nuxt',
  '@kiwa/sveltekit',
  '@kiwa/remix',
  '@kiwa/astro',
  '@kiwa/solidstart',
  '@kiwa/qwikcity',
  '@kiwa/edge',
  '@kiwa/solidjs',
  '@kiwa/fresh',
  '@kiwa/hono',
  '@kiwa/streaming',
];

const PKG_DIRS = {
  '@kiwa/core': 'packages/core',
  '@kiwa/api': 'packages/api',
  '@kiwa/ui': 'packages/ui',
  '@kiwa/data': 'packages/data',
  '@kiwa/cli-test': 'packages/cli-test',
  '@kiwa/observability': 'packages/observability',
  '@kiwa/e2e': 'packages/e2e',
  '@kiwa/cli': 'packages/cli',
  '@kiwa/dapp': 'packages/dapp',
  '@kiwa/a11y': 'packages/a11y',
  '@kiwa/visual': 'packages/visual',
  '@kiwa/nextjs': 'packages/nextjs',
  '@kiwa/nuxt': 'packages/nuxt',
  '@kiwa/sveltekit': 'packages/sveltekit',
  '@kiwa/remix': 'packages/remix',
  '@kiwa/astro': 'packages/astro',
  '@kiwa/solidstart': 'packages/solidstart',
  '@kiwa/qwikcity': 'packages/qwikcity',
  '@kiwa/edge': 'packages/edge',
  '@kiwa/solidjs': 'packages/solidjs',
  '@kiwa/fresh': 'packages/fresh',
  '@kiwa/hono': 'packages/hono',
  '@kiwa/streaming': 'packages/streaming',
};

// Lines / functions / statements stay at 90. Branches stay at 80 because the
// dynamic-import error paths in optional-peer-dep wrappers (msw / pixelmatch
// / pngjs / @testing-library/* / @vue/test-utils / @solidjs/testing-library
// / lit / @noma.to/qwik-testing-library / @testing-library/angular) cannot
// be exercised inside the package-local tests when the peer is installed.
// The mutation gate (check-mutation-gates.mjs) catches regressions on the
// non-branch logic that coverage cannot.
const THRESHOLDS = {
  lines: 90,
  statements: 90,
  branches: 80,
  functions: 90,
};

function loadSummary(pkgDir) {
  const summaryPath = resolve(REPO_ROOT, pkgDir, 'coverage/coverage-summary.json');
  if (!existsSync(summaryPath)) {
    return { ok: false, reason: `no coverage-summary.json at ${summaryPath}` };
  }
  const raw = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = raw.total;
  if (!total) return { ok: false, reason: `coverage-summary.json missing "total"` };
  return { ok: true, total };
}

const failures = [];
const rows = [];
for (const pkg of PACKAGES) {
  const dir = PKG_DIRS[pkg];
  const result = loadSummary(dir);
  if (!result.ok) {
    failures.push({ pkg, reason: result.reason });
    rows.push(`| ${pkg} | n/a | n/a | n/a | n/a | ❌ ${result.reason} |`);
    continue;
  }
  const t = result.total;
  const metrics = ['lines', 'branches', 'functions', 'statements'];
  const failed = metrics.filter((m) => (t[m]?.pct ?? 0) + 0.0001 < THRESHOLDS[m]);
  rows.push(
    `| ${pkg} | ${t.lines.pct.toFixed(1)} | ${t.branches.pct.toFixed(1)} | ${t.functions.pct.toFixed(1)} | ${t.statements.pct.toFixed(1)} | ${failed.length === 0 ? '✅' : '❌ ' + failed.join(',')} |`,
  );
  if (failed.length > 0) {
    failures.push({ pkg, failed, totals: t });
  }
}

const header = [
  '| package | lines | branches | functions | statements | status |',
  '|---|---|---|---|---|---|',
];
const report = [
  `# Coverage gate report`,
  '',
  `Thresholds: lines >= ${THRESHOLDS.lines}%, branches >= ${THRESHOLDS.branches}%, functions >= ${THRESHOLDS.functions}%, statements >= ${THRESHOLDS.statements}%`,
  '',
  ...header,
  ...rows,
  '',
];
process.stdout.write(report.join('\n'));

if (failures.length === 0) {
  process.stderr.write('\nAll packages passed coverage thresholds.\n');
  process.exit(0);
}

process.stderr.write('\nCoverage gate failed for:\n');
for (const f of failures) {
  if (f.failed) {
    const detail = f.failed
      .map((m) => `${m}=${f.totals[m].pct.toFixed(2)}% (need ${THRESHOLDS[m]}%)`)
      .join(', ');
    process.stderr.write(`  - ${f.pkg}: ${detail}\n`);
  } else {
    process.stderr.write(`  - ${f.pkg}: ${f.reason}\n`);
  }
}
process.exit(1);
