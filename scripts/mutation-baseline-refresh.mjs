#!/usr/bin/env node
/**
 * Refresh `.mutation-baseline/<pkg>.json` snapshots from Stryker JSON reports.
 *
 * Reads each package's `mutation-report/mutation.json` (produced by
 * `pnpm -F @kiwa-lab/<pkg> run test:mutation`) and rewrites the matching
 * `.mutation-baseline/<pkg>.json` with the current kill-rate, mutant counts,
 * threshold snapshot, and the survivor mutant list.
 *
 * Usage:
 *   node scripts/mutation-baseline-refresh.mjs                  # refresh every package
 *   node scripts/mutation-baseline-refresh.mjs core api ui      # refresh selected packages
 *
 * The refresh never runs Stryker itself; the caller is responsible for
 * producing the `mutation-report/mutation.json` file first. This keeps the
 * shell driver (loop over `pnpm test:mutation`) and the baseline writer
 * decoupled so failed runs do not overwrite a green baseline.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SCRIPT_ROOT = resolve(new URL('..', import.meta.url).pathname);
const REPO_ROOT = process.env.KIWA_BASELINE_ROOT
  ? resolve(process.env.KIWA_BASELINE_ROOT)
  : SCRIPT_ROOT;

/**
 * v1.27-2 + v1.27-3 scope: four tiers across the published packages. The
 * count is not written here; it moved at #1785, #1803 and #1865, and the map
 * below is the one that has to stay right.
 *
 * v1.27-2 landed 9 core + 11 framework baselines. v1.27-3 extends to the
 * remaining 13 packages: 3 test-type packages (a11y / visual / component) +
 * 10 SaaS adapters (auth / queue / cache / orm / payment / streaming /
 * search / mcp / agent / realtime). The remaining `ai-llm` slot is deferred
 * to v1.27-4 where release gate integration lands.
 *
 * Tier + threshold values are read from the pre-existing baseline stub
 * (`.mutation-baseline/<pkg>.json`) so this writer never diverges from
 * `docs/quality/mutation-thresholds.md`.
 */
const PACKAGES = {
  // v1.27-2 scope (kept for `--all` refresh + backward compat).
  '@kiwa-lab/core': 'packages/core',
  '@kiwa-lab/dapp': 'packages/dapp',
  '@kiwa-lab/api': 'packages/api',
  '@kiwa-lab/ui': 'packages/ui',
  '@kiwa-lab/data': 'packages/data',
  '@kiwa-lab/cli-test': 'packages/cli-test',
  '@kiwa-lab/observability': 'packages/observability',
  '@kiwa-lab/e2e': 'packages/e2e',
  '@kiwa-lab/cli': 'packages/cli',
  '@kiwa-lab/nextjs': 'packages/nextjs',
  '@kiwa-lab/edge': 'packages/edge',
  '@kiwa-lab/hono': 'packages/hono',
  // v1.27-3 scope: test-type layer (3 packages).
  '@kiwa-lab/a11y': 'packages/a11y',
  '@kiwa-lab/component': 'packages/component',
  // v1.27-3 scope: SaaS layer (10 packages).
  '@kiwa-lab/auth': 'packages/auth',
  '@kiwa-lab/queue': 'packages/queue',
  '@kiwa-lab/cache': 'packages/cache',
  '@kiwa-lab/orm': 'packages/orm',
  '@kiwa-lab/search': 'packages/search',
  '@kiwa-lab/realtime': 'packages/realtime',
  // #1951: security ran mutation testing from v1.27 without a baseline,
  // because nothing scored it. Core tier, 84.90 % covered MSI.
  '@kiwa-lab/security': 'packages/security',
};

/**
 * Aggregate a Stryker mutation report into a baseline record.
 *
 * Two scores are returned so downstream consumers can pick the right one:
 *
 *   totalMsi   = killed / (killed + survived + timeout + error)
 *     -- SSOT from `docs/quality/mutation-thresholds.md` (line 18). Includes
 *        CompileError / RuntimeError / Ignored mutants in the denominator so
 *        the score does not silently improve when a mutant stops compiling.
 *        This is the value written to `killRate` in each baseline JSON.
 *
 *   coveredMsi = (killed + timeout) / (killed + survived + timeout)
 *     -- Stryker's "covered" column that `check-mutation-gates.mjs` uses. It
 *        excludes NoCoverage + error mutants so the gate reflects only what
 *        the test suite can actually observe, matching Stryker's HTML report.
 *
 * Persisting both fields lets the CI gate and the SSOT stay decoupled: raise
 * the gate against `coveredMsi`, communicate progress against `totalMsi`.
 */
export function summariseReport(raw) {
  let killed = 0;
  let survived = 0;
  let timeout = 0;
  let noCoverage = 0;
  let error = 0;
  const survivors = [];
  for (const [file, fileData] of Object.entries(raw.files ?? {})) {
    for (const mutant of fileData.mutants ?? []) {
      switch (mutant.status) {
        case 'Killed':
          killed += 1;
          break;
        case 'Survived':
          survived += 1;
          survivors.push({
            file,
            line: mutant.location?.start?.line ?? null,
            column: mutant.location?.start?.column ?? null,
            mutator: mutant.mutatorName,
            replacement: typeof mutant.replacement === 'string'
              ? mutant.replacement.slice(0, 120)
              : null,
          });
          break;
        case 'Timeout':
          timeout += 1;
          break;
        case 'NoCoverage':
          noCoverage += 1;
          break;
        case 'CompileError':
        case 'RuntimeError':
        case 'Ignored':
          error += 1;
          break;
        default:
          break;
      }
    }
  }
  const totalDenominator = killed + survived + timeout + error;
  const coveredDenominator = killed + survived + timeout;
  const totalMsi = totalDenominator === 0 ? 0 : (killed / totalDenominator) * 100;
  const coveredMsi = coveredDenominator === 0 ? 0 : ((killed + timeout) / coveredDenominator) * 100;
  // `killRate` is kept for backward compatibility with any downstream reader
  // that pre-dates the totalMsi / coveredMsi split; it now equals totalMsi so
  // the SSOT formula is the authoritative value at rest.
  const killRate = totalMsi;
  return { killRate, totalMsi, coveredMsi, killed, survived, timeout, noCoverage, error, survivors };
}

function summarise(reportPath) {
  return summariseReport(JSON.parse(readFileSync(reportPath, 'utf8')));
}

function refreshBaseline(pkg, pkgDir) {
  const reportPath = resolve(REPO_ROOT, pkgDir, 'mutation-report/mutation.json');
  const baselinePath = resolve(REPO_ROOT, '.mutation-baseline', `${pkg.split('/').pop()}.json`);

  if (!existsSync(reportPath)) {
    return {
      pkg,
      ok: false,
      skipped: true,
      reason: `no mutation-report at ${reportPath}`,
    };
  }
  if (!existsSync(baselinePath)) {
    return {
      pkg,
      ok: false,
      skipped: true,
      reason: `baseline stub missing at ${baselinePath}; v1.27-1 landed all 20 stubs, add one first`,
    };
  }

  // Tier + thresholds come from the v1.27-1 stub so a rename in
  // docs/quality/mutation-thresholds.md flows through the stub, not
  // through this writer.
  const prior = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const tier = prior.tier;
  const thresholds = prior.thresholds;

  const stats = summarise(reportPath);
  const record = {
    package: pkg,
    tier,
    thresholds,
    // killRate now equals totalMsi (SSOT formula, includes error mutants in
    // the denominator). Kept for backward compatibility with pre-v1.27-3
    // readers.
    killRate: Number(stats.totalMsi.toFixed(2)),
    totalMsi: Number(stats.totalMsi.toFixed(2)),
    coveredMsi: Number(stats.coveredMsi.toFixed(2)),
    killed: stats.killed,
    survived: stats.survived,
    timeout: stats.timeout,
    noCoverage: stats.noCoverage,
    error: stats.error,
    mutants: stats.survivors,
    capturedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    note: `Total MSI ${stats.totalMsi.toFixed(2)}% / Covered MSI ${stats.coveredMsi.toFixed(2)}% (threshold high=${thresholds.high} / low=${thresholds.low} / break=${thresholds.break}).`,
  };

  mkdirSync(dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify(record, null, 2)}\n`);
  return {
    pkg,
    ok: true,
    killRate: record.killRate,
    totalMsi: record.totalMsi,
    coveredMsi: record.coveredMsi,
    survived: record.survived,
    mutants: record.mutants.length,
  };
}

// Skip the CLI when imported (e.g. from tests) so summariseReport can be
// exercised without spawning the write path.
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const requestedPkgs = argv.length === 0
    ? Object.keys(PACKAGES)
    : argv.map((raw) => (raw.startsWith('@kiwa-lab/') ? raw : `@kiwa-lab/${raw}`));

  for (const requested of requestedPkgs) {
    if (!(requested in PACKAGES)) {
      console.error(`Unknown package: ${requested}`);
      process.exit(2);
    }
  }

  let hardFailure = false;
  const rows = [];
  for (const pkg of requestedPkgs) {
    const pkgDir = PACKAGES[pkg];
    const result = refreshBaseline(pkg, pkgDir);
    if (result.ok) {
      rows.push(
        `| ${pkg} | ${result.totalMsi.toFixed(2)}% | ${result.coveredMsi.toFixed(2)}% | survivors=${result.survived} |`,
      );
    } else if (result.skipped) {
      rows.push(`| ${pkg} | n/a | n/a | skipped: ${result.reason} |`);
    } else {
      hardFailure = true;
      rows.push(`| ${pkg} | n/a | n/a | FAILED: ${result.reason} |`);
    }
  }

  process.stdout.write(
    ['| package | total MSI | covered MSI | note |', '|---|---|---|---|', ...rows, ''].join('\n'),
  );

  process.exit(hardFailure ? 1 : 0);
}
