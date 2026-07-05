#!/usr/bin/env node
/**
 * Refresh `.mutation-baseline/<pkg>.json` snapshots from Stryker JSON reports.
 *
 * Reads each package's `mutation-report/mutation.json` (produced by
 * `pnpm -F @kiwa-test/<pkg> run test:mutation`) and rewrites the matching
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
 * v1.27-2 scope: 9 core-layer + 11 framework-layer packages.
 * Tier + threshold values are read from the pre-existing baseline stub
 * (`.mutation-baseline/<pkg>.json`) so this writer never diverges from
 * `docs/quality/mutation-thresholds.md`.
 */
const PACKAGES = {
  '@kiwa-test/core': 'packages/core',
  '@kiwa-test/dapp': 'packages/dapp',
  '@kiwa-test/api': 'packages/api',
  '@kiwa-test/ui': 'packages/ui',
  '@kiwa-test/data': 'packages/data',
  '@kiwa-test/cli-test': 'packages/cli-test',
  '@kiwa-test/observability': 'packages/observability',
  '@kiwa-test/e2e': 'packages/e2e',
  '@kiwa-test/cli': 'packages/cli',
  '@kiwa-test/nextjs': 'packages/nextjs',
  '@kiwa-test/nuxt': 'packages/nuxt',
  '@kiwa-test/sveltekit': 'packages/sveltekit',
  '@kiwa-test/remix': 'packages/remix',
  '@kiwa-test/astro': 'packages/astro',
  '@kiwa-test/solidstart': 'packages/solidstart',
  '@kiwa-test/qwikcity': 'packages/qwikcity',
  '@kiwa-test/edge': 'packages/edge',
  '@kiwa-test/solidjs': 'packages/solidjs',
  '@kiwa-test/fresh': 'packages/fresh',
  '@kiwa-test/hono': 'packages/hono',
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
    : argv.map((raw) => (raw.startsWith('@kiwa-test/') ? raw : `@kiwa-test/${raw}`));

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
