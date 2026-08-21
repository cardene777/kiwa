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
 *
 * Nothing here regenerates that report, so a package whose `src/` moved on
 * after the last `test:cov` would be scored on code that is no longer there.
 * #2124 measured that gap on the neighbouring mutation gate: the stored value
 * said 83.33 while a re-run said 81.37, and the gate passed on the older one.
 * Each package's report is checked against when its implementation last
 * changed, and a report that predates it fails with the command to re-run.
 * `scripts/lib/artifact-freshness.mjs` carries why that comparison is not a
 * plain mtime check.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkArtifactFreshness, staleMessage } from './lib/artifact-freshness.mjs';

// Default to the repo containing this script, but allow CWD override for tests / CI.
// `fileURLToPath`, not `.pathname`: a `file:` URL keeps percent-encoding, so a
// checkout under a directory with a space resolves to `…/kiwa%20probe/…`, a path
// that does not exist. `scripts/lib/is-main-module.mjs` records the same trap.
const SCRIPT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
  ? process.cwd()
  : SCRIPT_ROOT;

const PACKAGES = [
  '@kiwa-lab/core',
  '@kiwa-lab/api',
  '@kiwa-lab/ui',
  '@kiwa-lab/data',
  '@kiwa-lab/cli-test',
  '@kiwa-lab/observability',
  '@kiwa-lab/e2e',
  '@kiwa-lab/cli',
  '@kiwa-lab/dapp',
  '@kiwa-lab/a11y',
  '@kiwa-lab/nextjs',
  '@kiwa-lab/edge',
  '@kiwa-lab/hono',
  '@kiwa-lab/auth',
  '@kiwa-lab/search',
  '@kiwa-lab/security',
  '@kiwa-lab/realtime',
  '@kiwa-lab/cache',
  '@kiwa-lab/ai-llm',
  '@kiwa-lab/component',
  '@kiwa-lab/perf-harness',
  '@kiwa-lab/quality-metrics',
  '@kiwa-lab/lean',
  '@kiwa-lab/queue',
  '@kiwa-lab/orm',
  '@kiwa-lab/skill-test',
];

const PKG_DIRS = {
  '@kiwa-lab/core': 'packages/core',
  '@kiwa-lab/api': 'packages/api',
  '@kiwa-lab/ui': 'packages/ui',
  '@kiwa-lab/data': 'packages/data',
  '@kiwa-lab/cli-test': 'packages/cli-test',
  '@kiwa-lab/observability': 'packages/observability',
  '@kiwa-lab/e2e': 'packages/e2e',
  '@kiwa-lab/cli': 'packages/cli',
  '@kiwa-lab/dapp': 'packages/dapp',
  '@kiwa-lab/a11y': 'packages/a11y',
  '@kiwa-lab/nextjs': 'packages/nextjs',
  '@kiwa-lab/edge': 'packages/edge',
  '@kiwa-lab/hono': 'packages/hono',
  '@kiwa-lab/auth': 'packages/auth',
  '@kiwa-lab/search': 'packages/search',
  '@kiwa-lab/security': 'packages/security',
  '@kiwa-lab/realtime': 'packages/realtime',
  '@kiwa-lab/cache': 'packages/cache',
  '@kiwa-lab/ai-llm': 'packages/ai-llm',
  '@kiwa-lab/component': 'packages/component',
  '@kiwa-lab/perf-harness': 'packages/perf-harness',
  '@kiwa-lab/quality-metrics': 'packages/quality-metrics',
  '@kiwa-lab/lean': 'packages/lean',
  '@kiwa-lab/queue': 'packages/queue',
  '@kiwa-lab/orm': 'packages/orm',
  '@kiwa-lab/skill-test': 'packages/skill-test',
};

// Lines / functions / statements stay at 90. Branches stay at 80 because the
// dynamic-import error paths in optional-peer-dep wrappers (msw / pixelmatch
// / pngjs / @testing-library/* / @vue/test-utils / @solidjs/testing-library
// / lit / @noma.to/qwik-testing-library / @testing-library/angular) cannot
// be exercised inside the package-local tests when the peer is installed.
// The mutation gate (check-mutation-gates.mjs) catches regressions on the
// non-branch logic that coverage cannot.
//
// That hand-off does NOT hold everywhere, so do not reach for
// `--coverage.exclude` as a way to "let mutation testing cover it" (Issue
// #1939). The mutation configs of `orm` and `queue` list a single file each
// (`expectations.ts` / `sandbox-queue.ts`), i.e. 3.1% and 8.2% of those
// packages. Excluding a path from coverage there removes it from every gate at
// once rather than moving it to another one.
//
// The peer-dependency wrappers those packages own are reachable without a real
// backend: `cache/src/testcontainers-cache.ts` has the same shape (dynamic
// `await import` behind a duck-typed module interface) and sits at 98.91% via
// in-process fakes in `cache/tests/semantics/coverage-fill.test.ts`. The queue
// side follows that shape in
// `queue/tests/semantics/testcontainers-queue-coverage.test.ts`.
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

const SUMMARY_REL = 'coverage/coverage-summary.json';

/**
 * Whether this package's report still describes its `src/`.
 *
 * `missing` is left to `loadSummary`, which names the path it looked for; a
 * freshness failure would replace that with a vaguer message. Anything the
 * check cannot work out fails here — a gate that does not know whether its
 * input is current must not report a pass.
 */
function freshnessProblem(pkg, pkgDir) {
  const artifactRel = `${pkgDir}/${SUMMARY_REL}`;
  const result = checkArtifactFreshness({
    repoRoot: REPO_ROOT,
    srcRel: `${pkgDir}/src`,
    artifactRel,
    inputRels: [`${pkgDir}/src`, `${pkgDir}/tests`],
  });
  if (result.state === 'fresh' || result.state === 'missing') return null;
  return staleMessage({
    pkg,
    artifactRel,
    regenerateCommand: `pnpm -F ${pkg} test:cov`,
    result,
  });
}

const failures = [];
const rows = [];
for (const pkg of PACKAGES) {
  const dir = PKG_DIRS[pkg];
  const stale = freshnessProblem(pkg, dir);
  if (stale) {
    failures.push({ pkg, reason: stale });
    rows.push(`| ${pkg} | n/a | n/a | n/a | n/a | ❌ stale report |`);
    continue;
  }
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
