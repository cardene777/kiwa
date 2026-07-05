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
 * Per-package thresholds follow the 4-tier rationale from
 * `docs/quality/mutation-thresholds.md`:
 * Core-strict 90 / Core 80 / Framework 70 / SaaS 65 / Test-type 60.
 * A stricter override (e.g. `@kiwa-test/a11y` at 90) raises the floor; a
 * looser override needs a one-line justification in the PR that introduces it.
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

// Per-package MSI thresholds. Values track the `high` column in
// docs/quality/mutation-thresholds.md so a single edit in the SSOT flows
// through here without a second bookkeeping table:
//   - 90: Core-strict (protocol / accessibility invariants).
//   - 80: Core tier — pure logic, deterministic tests.
//   - 70: Framework tier — SSR / hydration / adapter drift.
//   - 65: SaaS tier — provider-specific adapters.
//   - 60: Test-type tier — harness packages with DOM / browser noise.
const THRESHOLDS = {
  // Core tier (pure logic, deterministic tests).
  '@kiwa-test/core': 80,
  '@kiwa-test/api': 90,
  '@kiwa-test/data': 80,
  '@kiwa-test/cli-test': 80,
  '@kiwa-test/observability': 80,
  '@kiwa-test/cli': 80,
  // Framework tier (SSR / hydration / adapter drift).
  '@kiwa-test/nextjs': 70,
  '@kiwa-test/nuxt': 70,
  '@kiwa-test/sveltekit': 70,
  '@kiwa-test/remix': 70,
  '@kiwa-test/astro': 70,
  '@kiwa-test/solidstart': 70,
  '@kiwa-test/qwikcity': 70,
  '@kiwa-test/edge': 70,
  '@kiwa-test/solidjs': 70,
  '@kiwa-test/fresh': 70,
  '@kiwa-test/hono': 70,
  '@kiwa-test/auth': 70,
  // SaaS tier (provider-specific adapters).
  '@kiwa-test/ai-llm': 65,
  '@kiwa-test/payment': 65,
  '@kiwa-test/queue': 65,
  '@kiwa-test/cache': 65,
  '@kiwa-test/streaming': 65,
  '@kiwa-test/realtime': 65,
  '@kiwa-test/mcp': 65,
  '@kiwa-test/agent': 65,
  '@kiwa-test/search': 65,
  '@kiwa-test/orm': 65,
  '@kiwa-test/dapp': 65,
  // Test-type tier (DOM / measurement noise).
  '@kiwa-test/ui': 60,
  '@kiwa-test/a11y': 90,
  '@kiwa-test/visual': 60,
  '@kiwa-test/component': 60,
  '@kiwa-test/e2e': 60,
};

const PKG_DIRS = {
  // Core tier.
  '@kiwa-test/core': 'packages/core',
  '@kiwa-test/api': 'packages/api',
  '@kiwa-test/data': 'packages/data',
  '@kiwa-test/cli-test': 'packages/cli-test',
  '@kiwa-test/observability': 'packages/observability',
  '@kiwa-test/cli': 'packages/cli',
  // Framework tier.
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
  '@kiwa-test/auth': 'packages/auth',
  // SaaS tier.
  '@kiwa-test/ai-llm': 'packages/ai-llm',
  '@kiwa-test/payment': 'packages/payment',
  '@kiwa-test/queue': 'packages/queue',
  '@kiwa-test/cache': 'packages/cache',
  '@kiwa-test/streaming': 'packages/streaming',
  '@kiwa-test/realtime': 'packages/realtime',
  '@kiwa-test/mcp': 'packages/mcp',
  '@kiwa-test/agent': 'packages/agent',
  '@kiwa-test/search': 'packages/search',
  '@kiwa-test/orm': 'packages/orm',
  '@kiwa-test/dapp': 'packages/dapp',
  // Test-type tier.
  '@kiwa-test/ui': 'packages/ui',
  '@kiwa-test/a11y': 'packages/a11y',
  '@kiwa-test/visual': 'packages/visual',
  '@kiwa-test/component': 'packages/component',
  '@kiwa-test/e2e': 'packages/e2e',
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
  `Thresholds follow the 4-tier rationale in docs/quality/mutation-thresholds.md.`,
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
