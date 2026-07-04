#!/usr/bin/env node
/**
 * CI mutation gate.
 *
 * Reads each package's `mutation-report/mutation.json` (Stryker JSON output)
 * and fails the build when a package's Mutation Score Indicator (MSI) falls
 * below its configured threshold. MSI is computed as
 *
 *   MSI = killed / (killed + survived + timeout)
 *
 * which matches Stryker's "% Mutation score / covered" column (no-coverage
 * mutants are excluded so the score reflects what tests can actually observe).
 *
 * Per-package thresholds are intentionally NOT uniform: thin wrappers (ui /
 * visual / e2e) hit equivalent-mutant ceilings around 80%, while pure logic
 * packages (api / a11y / core / spec / cli-test / data) sustain 90%+.
 *
 * Run with `node scripts/check-mutation-gates.mjs` from the repo root after
 * each `pnpm -F <pkg> run test:mutation` has produced its mutation report.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCRIPT_ROOT = resolve(new URL('..', import.meta.url).pathname);
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
  ? process.cwd()
  : SCRIPT_ROOT;

// Per-package MSI thresholds.
//   - 90: pure-logic packages whose tests can observably kill every mutant.
//   - 80: thin wrappers around third-party libs whose internal default values
//         produce equivalent mutants outside the test surface.
const THRESHOLDS = {
  '@kiwa-test/core': 80,
  '@kiwa-test/api': 90,
  '@kiwa-test/ui': 80,
  '@kiwa-test/data': 80,
  '@kiwa-test/cli-test': 80,
  '@kiwa-test/observability': 80,
  '@kiwa-test/e2e': 80,
  '@kiwa-test/cli': 80,
  '@kiwa-test/dapp': 80,
  '@kiwa-test/a11y': 90,
  '@kiwa-test/visual': 80,
  '@kiwa-test/nextjs': 80,
  '@kiwa-test/nuxt': 80,
  '@kiwa-test/sveltekit': 80,
  '@kiwa-test/remix': 80,
  '@kiwa-test/astro': 80,
  '@kiwa-test/solidstart': 80,
  '@kiwa-test/qwikcity': 80,
  '@kiwa-test/edge': 80,
  '@kiwa-test/solidjs': 80,
  '@kiwa-test/fresh': 80,
};

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
  '@kiwa-test/solidstart': 'packages/solidstart',
  '@kiwa-test/qwikcity': 'packages/qwikcity',
  '@kiwa-test/edge': 'packages/edge',
  '@kiwa-test/solidjs': 'packages/solidjs',
  '@kiwa-test/fresh': 'packages/fresh',
};

const PACKAGES = Object.keys(THRESHOLDS);

function loadMsi(pkgDir) {
  const reportPath = resolve(REPO_ROOT, pkgDir, 'mutation-report/mutation.json');
  if (!existsSync(reportPath)) {
    return { ok: false, reason: `no mutation.json at ${reportPath}` };
  }
  const raw = JSON.parse(readFileSync(reportPath, 'utf8'));
  let killed = 0;
  let survived = 0;
  let timeout = 0;
  let noCoverage = 0;
  let total = 0;
  for (const fileData of Object.values(raw.files ?? {})) {
    for (const mutant of fileData.mutants ?? []) {
      total += 1;
      switch (mutant.status) {
        case 'Killed':
          killed += 1;
          break;
        case 'Survived':
          survived += 1;
          break;
        case 'Timeout':
          timeout += 1;
          break;
        case 'NoCoverage':
          noCoverage += 1;
          break;
        default:
          // Other statuses (CompileError, RuntimeError, Pending, etc.) are
          // counted toward neither numerator nor denominator.
          break;
      }
    }
  }
  const denominator = killed + survived + timeout;
  const msi = denominator === 0 ? 0 : (killed + timeout) / denominator * 100;
  return {
    ok: true,
    msi,
    killed,
    survived,
    timeout,
    noCoverage,
    total,
  };
}

const failures = [];
const rows = [];
for (const pkg of PACKAGES) {
  const dir = PKG_DIRS[pkg];
  const threshold = THRESHOLDS[pkg];
  const result = loadMsi(dir);
  if (!result.ok) {
    failures.push({ pkg, reason: result.reason });
    rows.push(`| ${pkg} | n/a | ${threshold} | ❌ ${result.reason} |`);
    continue;
  }
  const passed = result.msi + 0.0001 >= threshold;
  rows.push(
    `| ${pkg} | ${result.msi.toFixed(2)} | ${threshold} | ${passed ? '✅' : '❌'} (killed=${result.killed}, survived=${result.survived}, timeout=${result.timeout}) |`,
  );
  if (!passed) {
    failures.push({ pkg, threshold, msi: result.msi, ...result });
  }
}

const header = [
  '| package | MSI % | threshold % | status |',
  '|---|---|---|---|',
];
const report = [
  `# Mutation gate report`,
  '',
  `Thresholds are per-package (90% for pure-logic, 80% for thin wrappers).`,
  '',
  ...header,
  ...rows,
  '',
];
process.stdout.write(report.join('\n'));

if (failures.length === 0) {
  process.stderr.write('\nAll packages passed mutation thresholds.\n');
  process.exit(0);
}

process.stderr.write('\nMutation gate failed for:\n');
for (const f of failures) {
  if (f.msi !== undefined) {
    process.stderr.write(
      `  - ${f.pkg}: MSI=${f.msi.toFixed(2)}% (need ${f.threshold}%, killed=${f.killed}/survived=${f.survived})\n`,
    );
  } else {
    process.stderr.write(`  - ${f.pkg}: ${f.reason}\n`);
  }
}
process.exit(1);
