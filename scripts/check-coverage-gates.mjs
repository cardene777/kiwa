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
  '@kiwa-test/core',
  '@kiwa-test/api',
  '@kiwa-test/ui',
  '@kiwa-test/data',
  '@kiwa-test/cli-test',
  '@kiwa-test/observability',
  '@kiwa-test/e2e',
  '@kiwa-test/cli',
  '@kiwa-test/dapp',
  '@kiwa-test/a11y',
  '@kiwa-test/visual',
  '@kiwa-test/nextjs',
  '@kiwa-test/nuxt',
  '@kiwa-test/sveltekit',
  '@kiwa-test/remix',
  '@kiwa-test/astro',
];

const PKG_DIRS = {
  '@kiwa-test/core': 'packages/core',
  '@kiwa-test/api': 'packages/api',
  '@kiwa-test/ui': 'packages/ui',
  '@kiwa-test/data': 'packages/data',
  '@kiwa-test/cli-test': 'packages/cli-test',
  '@kiwa-test/observability': 'packages/observability',
  '@kiwa-test/e2e': 'packages/e2e',
  '@kiwa-test/cli': 'packages/cli',
  '@kiwa-test/dapp': 'packages/dapp',
  '@kiwa-test/a11y': 'packages/a11y',
  '@kiwa-test/visual': 'packages/visual',
  '@kiwa-test/nextjs': 'packages/nextjs',
  '@kiwa-test/nuxt': 'packages/nuxt',
  '@kiwa-test/sveltekit': 'packages/sveltekit',
  '@kiwa-test/remix': 'packages/remix',
  '@kiwa-test/astro': 'packages/astro',
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
