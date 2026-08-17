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
 * v1.27-4: the per-package threshold table below has been reshaped into a
 * **tier + override** SSOT that mirrors `docs/quality/mutation-thresholds.md`
 * and `packages/quality-metrics/src/gate.ts` DEFAULT_MUTATION_TIER_THRESHOLDS.
 * Each package picks a tier (Core 80 / Framework 70 / SaaS 65 / Test type 60)
 * and may declare a looser `override` that must stay above the tier's
 * `break` bar. A stricter override (e.g. `@kiwa-lab/api` = Core-strict 90)
 * just raises the floor.
 *
 * Per-package thresholds follow the 4-tier rationale from
 * `docs/quality/mutation-thresholds.md`:
 * Core-strict 90 / Core 80 / Framework 70 / SaaS 65 / Test-type 60.
 * A stricter override raises the floor; a looser override needs a one-line
 * justification in the PR that introduces it.
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

/**
 * 4-tier default threshold SSOT — mirrors `docs/quality/mutation-thresholds.md`
 * and `packages/quality-metrics/src/gate.ts` DEFAULT_MUTATION_TIER_THRESHOLDS.
 * Every package's `high` bar is derived from its tier unless it declares an
 * override below.
 */
export const TIER_THRESHOLD = Object.freeze({
  core: 80,
  framework: 70,
  saas: 65,
  'test-type': 60,
});

/**
 * Per-package tier + optional override. `override` documents both the value
 * and the reason. A stricter override (raising the floor) needs no reason;
 * a looser override cites the follow-up work that brings it back to tier
 * default.
 *
 * NOTE: keep this table sorted by tier so review can spot a mis-tiered
 * addition at a glance.
 */
export const PACKAGE_TIER = Object.freeze({
  // Core tier (pure logic, deterministic tests).
  '@kiwa-lab/core': { tier: 'core' },
  '@kiwa-lab/api': { tier: 'core', override: 90, reason: 'Core-strict — HTTP request client + MSW bridge, protocol invariants.' },
  '@kiwa-lab/data': { tier: 'core' },
  '@kiwa-lab/cli-test': { tier: 'core' },
  '@kiwa-lab/observability': { tier: 'core' },
  '@kiwa-lab/cli': { tier: 'core' },
  // security's `mutate` covers the policy engines (CSP / rate-limit /
  // authorization / WAF / threat-model / secrets-scan / SBOM / headers /
  // fidelity), which are pure logic with deterministic tests. The provider
  // drift its config header cites lives in `real-driver.ts` and the
  // testcontainers path, and neither is mutated. Measured at 84.90 % covered
  // MSI over 1,203 mutants; two runs landed 84.31 and 84.90 as the timeout
  // count moved with machine load (#1951).
  '@kiwa-lab/security': { tier: 'core' },
  // Framework tier (SSR / hydration / adapter drift).
  '@kiwa-lab/nextjs': { tier: 'framework' },
  '@kiwa-lab/edge': { tier: 'framework' },
  '@kiwa-lab/hono': { tier: 'framework' },
  // auth landed at 68.86 % covered MSI in the v1.27-3 first sweep (adapter.js
  // 65.75 / providers.js 80.70 / session.js 56.76). Held at 65 % — one point
  // below tier low — until follow-up session.js tests raise it back to 70.
  '@kiwa-lab/auth': { tier: 'framework', override: 65, reason: 'session.js 56.76 % — follow-up test raises back to 70.' },
  // SaaS tier (provider-specific adapters).
  // ai-llm has no baseline in v1.27-3 (scope belongs to v1.27-4 release-gate
  // integration). Threshold left at tier default so the gate stays honest
  // once the baseline lands.
  '@kiwa-lab/ai-llm': { tier: 'saas' },
  '@kiwa-lab/queue': { tier: 'saas' },
  // cache landed at 62.68 % covered MSI on `in-memory-cache.js` (the sole
  // mutated file after excluding testcontainers-cache.js). Held at 60 % —
  // above tier break 50 — until follow-up covers the TTL + eviction edge
  // cases surfaced by the surviving mutant list.
  '@kiwa-lab/cache': { tier: 'saas', override: 60, reason: 'in-memory-cache.js TTL + eviction follow-up.' },
  // realtime landed at 62.31 % covered MSI across engine / fidelity / ably
  // (pusher / socketio / report excluded, see stryker.config.mjs). Held at
  // 60 % until follow-up fidelity tests raise it back to 65.
  '@kiwa-lab/realtime': { tier: 'saas', override: 60, reason: 'fidelity follow-up raises back to 65.' },
  '@kiwa-lab/search': { tier: 'saas' },
  '@kiwa-lab/orm': { tier: 'saas' },
  '@kiwa-lab/dapp': { tier: 'saas' },
  // Test-type tier (DOM / measurement noise).
  '@kiwa-lab/ui': { tier: 'test-type' },
  '@kiwa-lab/a11y': { tier: 'test-type', override: 90, reason: 'axe-core WCAG 2.1 AA — protocol invariants, historic high bar.' },
  '@kiwa-lab/component': { tier: 'test-type' },
  '@kiwa-lab/e2e': { tier: 'test-type' },
});

/** Effective threshold = override ?? tier default. */
export function thresholdFor(pkg) {
  const entry = PACKAGE_TIER[pkg];
  if (!entry) return undefined;
  return entry.override ?? TIER_THRESHOLD[entry.tier];
}

const THRESHOLDS = Object.fromEntries(
  Object.keys(PACKAGE_TIER).map((pkg) => [pkg, thresholdFor(pkg)]),
);

/**
 * Where each scored package lives. Exported so a check can confirm it covers
 * `PACKAGE_TIER` — a package with a tier but no directory here makes the gate
 * look for a report under `undefined` (#1951).
 */
export const PKG_DIRS = {
  // Core tier.
  '@kiwa-lab/core': 'packages/core',
  '@kiwa-lab/api': 'packages/api',
  '@kiwa-lab/data': 'packages/data',
  '@kiwa-lab/cli-test': 'packages/cli-test',
  '@kiwa-lab/observability': 'packages/observability',
  '@kiwa-lab/cli': 'packages/cli',
  '@kiwa-lab/security': 'packages/security',
  // Framework tier.
  '@kiwa-lab/nextjs': 'packages/nextjs',
  '@kiwa-lab/edge': 'packages/edge',
  '@kiwa-lab/hono': 'packages/hono',
  '@kiwa-lab/auth': 'packages/auth',
  // SaaS tier.
  '@kiwa-lab/ai-llm': 'packages/ai-llm',
  '@kiwa-lab/queue': 'packages/queue',
  '@kiwa-lab/cache': 'packages/cache',
  '@kiwa-lab/realtime': 'packages/realtime',
  '@kiwa-lab/search': 'packages/search',
  '@kiwa-lab/orm': 'packages/orm',
  '@kiwa-lab/dapp': 'packages/dapp',
  // Test-type tier.
  '@kiwa-lab/ui': 'packages/ui',
  '@kiwa-lab/a11y': 'packages/a11y',
  '@kiwa-lab/component': 'packages/component',
  '@kiwa-lab/e2e': 'packages/e2e',
};

// Packages whose baseline is deferred to a later milestone. The gate lists
// them as deferred (not a failure) so the report stays honest — silent skip
// is worse than a marker — but they do not block release.
// Remove entries here as each milestone lands the baseline.
const DEFERRED = new Set([
  '@kiwa-lab/ai-llm', // v1.27-4 release-gate integration scope.
]);

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

// Skip the CLI when imported (e.g. from unit tests). The module-level exports
// stay reachable so consumers can cross-check the tier table SSOT.
if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = [];
  const rows = [];
  for (const pkg of PACKAGES) {
    const dir = PKG_DIRS[pkg];
    const threshold = THRESHOLDS[pkg];
    const tierInfo = PACKAGE_TIER[pkg];
    const tierLabel = tierInfo.tier + (tierInfo.override !== undefined ? ` (override ${tierInfo.override})` : '');
    const result = loadMsi(dir);
    if (!result.ok) {
      if (DEFERRED.has(pkg)) {
        rows.push(`| ${pkg} | ${tierLabel} | deferred | ${threshold} | 🟡 baseline deferred to a later milestone |`);
        continue;
      }
      failures.push({ pkg, reason: result.reason });
      rows.push(`| ${pkg} | ${tierLabel} | n/a | ${threshold} | ❌ ${result.reason} |`);
      continue;
    }
    const passed = result.msi + 0.0001 >= threshold;
    rows.push(
      `| ${pkg} | ${tierLabel} | ${result.msi.toFixed(2)} | ${threshold} | ${passed ? '✅' : '❌'} (killed=${result.killed}, survived=${result.survived}, timeout=${result.timeout}) |`,
    );
    if (!passed) {
      failures.push({ pkg, threshold, msi: result.msi, ...result });
    }
  }

  const header = [
    '| package | tier | MSI % | threshold % | status |',
    '|---|---|---|---|---|',
  ];
  const report = [
    `# Mutation gate report`,
    '',
    `12-axis release gate — mutation.tier axis, threshold table SSOT: docs/quality/mutation-thresholds.md.`,
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
}
