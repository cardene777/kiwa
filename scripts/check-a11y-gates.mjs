#!/usr/bin/env node
/**
 * CI a11y gate (v1.30-4).
 *
 * Reads each package's `.a11y-baseline/{basename}.json` and fails the build
 * when the recorded violation totals breach the tier ceiling from
 * `docs/quality/a11y-thresholds.md`. This is the 13th axis of the release
 * gate — parallels `check-mutation-gates.mjs` (12th axis) and
 * `check-coverage-gates.mjs` (lines / branches / functions / statements).
 *
 * The tier + override SSOT lives in this file. Baseline JSON shape follows
 * `scripts/run-axe-baseline.mjs` output:
 *
 *   {
 *     "package": "@kiwa-lab/<name>",
 *     "generatedAt": "...",
 *     "layers": { jsdom, playwright, ssrHydration },
 *     "totals": { critical, serious, moderate, minor },
 *     "ok": true | false,
 *     "providers": [ ... ]   // SaaS-tier optional
 *   }
 *
 * The gate does **not** re-run axe-core — that is `test:a11y`'s job. This
 * script is a post-processor that reads what already landed and compares
 * every impact count against the tier ceiling.
 *
 * Threshold table SSOT + tier assignment mirror
 * `docs/quality/a11y-thresholds.md § Tier table`. Any stricter override
 * (raising the floor) needs no reason; a looser override cites the
 * follow-up work that brings it back to the tier default in the PR body.
 *
 * Run with `node scripts/check-a11y-gates.mjs` from the repo root after
 * each `pnpm -F <pkg> run test:a11y` has produced its baseline JSON.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

// `fileURLToPath`, not `.pathname`: a `file:` URL keeps percent-encoding, so a
// checkout under a directory with a space resolves to `…/kiwa%20probe/…`, a path
// that does not exist. `scripts/lib/is-main-module.mjs` records the same trap.
const SCRIPT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
  ? process.cwd()
  : SCRIPT_ROOT;

/**
 * 4-tier default a11y threshold SSOT — mirrors
 * `docs/quality/a11y-thresholds.md § Tier table` and
 * `packages/quality-metrics/src/gate.ts § DEFAULT_A11Y_TIER_THRESHOLDS`.
 * `critical` is always 0 (SSOT invariant, never overridable).
 */
export const A11Y_TIER_THRESHOLD = Object.freeze({
  core: { critical: 0, serious: 0, moderate: 3 },
  framework: { critical: 0, serious: 3, moderate: 10 },
  saas: { critical: 0, serious: 0, moderate: 0 },
  'test-type': { critical: 0, serious: 3, moderate: 10 },
});

/**
 * Per-package tier + optional override. `override` documents both the value
 * and the reason. A stricter override (raising the floor) needs no reason;
 * a looser override cites the follow-up work that brings it back to tier
 * default. `override` shape mirrors the SSOT tier threshold shape
 * ({ critical, serious, moderate }) — critical MUST stay at 0.
 *
 * NOTE: keep this table sorted by tier so review can spot a mis-tiered
 * addition at a glance. The package list must stay in sync with the matrix in
 * `docs/quality/a11y-thresholds.md § Tier assignment` and the root
 * `package.json` `test:a11y` pnpm filter list. The count is not written here:
 * it moved at #1785, #1803 and #1865, and a stale literal reads as the table
 * having drifted when it has not.
 */
export const A11Y_PACKAGE_TIER = Object.freeze({
  // Core tier (pure logic, no DOM).
  '@kiwa-lab/core': { tier: 'core' },
  '@kiwa-lab/api': { tier: 'core' },
  '@kiwa-lab/data': { tier: 'core' },
  '@kiwa-lab/cli-test': { tier: 'core' },
  '@kiwa-lab/cli': { tier: 'core' },
  '@kiwa-lab/observability': { tier: 'core' },
  '@kiwa-lab/perf-harness': { tier: 'core' },
  '@kiwa-lab/quality-metrics': { tier: 'core' },
  // Framework tier (SSR / hydration / adapter wrapper).
  '@kiwa-lab/nextjs': { tier: 'framework' },
  '@kiwa-lab/edge': { tier: 'framework' },
  '@kiwa-lab/hono': { tier: 'framework' },
  '@kiwa-lab/auth': { tier: 'framework' },
  // SaaS tier (provider-specific adapter, no DOM — strict 0/0/0).
  '@kiwa-lab/ai-llm': { tier: 'saas' },
  '@kiwa-lab/queue': { tier: 'saas' },
  '@kiwa-lab/cache': { tier: 'saas' },
  '@kiwa-lab/realtime': { tier: 'saas' },
  '@kiwa-lab/search': { tier: 'saas' },
  '@kiwa-lab/orm': { tier: 'saas' },
  '@kiwa-lab/dapp': { tier: 'saas' },
  // Test-type tier (DOM measurement noise, browser dependence).
  '@kiwa-lab/ui': { tier: 'test-type' },
  '@kiwa-lab/a11y': { tier: 'test-type' },
  '@kiwa-lab/component': { tier: 'test-type' },
  '@kiwa-lab/e2e': { tier: 'test-type' },
});

/** Effective threshold = override ?? tier default. */
export function thresholdFor(pkg) {
  const entry = A11Y_PACKAGE_TIER[pkg];
  if (!entry) return undefined;
  return entry.override ?? A11Y_TIER_THRESHOLD[entry.tier];
}

const THRESHOLDS = Object.fromEntries(
  Object.keys(A11Y_PACKAGE_TIER).map((pkg) => [pkg, thresholdFor(pkg)]),
);

const PKG_DIRS = Object.freeze({
  '@kiwa-lab/core': 'packages/core',
  '@kiwa-lab/api': 'packages/api',
  '@kiwa-lab/data': 'packages/data',
  '@kiwa-lab/cli-test': 'packages/cli-test',
  '@kiwa-lab/cli': 'packages/cli',
  '@kiwa-lab/observability': 'packages/observability',
  '@kiwa-lab/perf-harness': 'packages/perf-harness',
  '@kiwa-lab/quality-metrics': 'packages/quality-metrics',
  '@kiwa-lab/nextjs': 'packages/nextjs',
  '@kiwa-lab/edge': 'packages/edge',
  '@kiwa-lab/hono': 'packages/hono',
  '@kiwa-lab/auth': 'packages/auth',
  '@kiwa-lab/ai-llm': 'packages/ai-llm',
  '@kiwa-lab/queue': 'packages/queue',
  '@kiwa-lab/cache': 'packages/cache',
  '@kiwa-lab/realtime': 'packages/realtime',
  '@kiwa-lab/search': 'packages/search',
  '@kiwa-lab/orm': 'packages/orm',
  '@kiwa-lab/dapp': 'packages/dapp',
  '@kiwa-lab/ui': 'packages/ui',
  '@kiwa-lab/a11y': 'packages/a11y',
  '@kiwa-lab/component': 'packages/component',
  '@kiwa-lab/e2e': 'packages/e2e',
});

// Packages whose baseline is deferred to a later milestone. The gate lists
// them as deferred (not a failure) so the report stays honest — silent skip
// is worse than a marker — but they do not block release.
// Remove entries here as each milestone lands the baseline.
const DEFERRED = new Set();

const PACKAGES = Object.keys(THRESHOLDS);

/** Extract the baseline JSON basename from the package name (`@kiwa-lab/x` → `x`). */
function baselineBasename(pkg) {
  const [, name] = pkg.split('/');
  return name;
}

/**
 * Load a baseline JSON and pull the totals block out.
 *
 * SSOT: baseline path is `<pkgDir>/.a11y-baseline/{basename}.json` (mirrors
 * `packages/quality-metrics/.a11y-baseline/quality-metrics.json` example
 * from v1.30-2). Some early-adopter packages persist the file under the
 * package basename (before v1.30-3 provider-aware runner rename), so this
 * helper tries both paths in order.
 */
function loadTotals(pkg) {
  const dir = PKG_DIRS[pkg];
  const basename = baselineBasename(pkg);
  const candidates = [
    resolve(REPO_ROOT, dir, '.a11y-baseline', `${basename}.json`),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    return { ok: false, reason: `no baseline at ${candidates[0]}` };
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(found, 'utf8'));
  } catch (err) {
    return { ok: false, reason: `baseline JSON parse error: ${err instanceof Error ? err.message : String(err)}` };
  }
  const totals = raw.totals;
  if (!totals || typeof totals !== 'object') {
    return { ok: false, reason: 'baseline JSON missing "totals" object' };
  }
  const pick = (field) => {
    const v = totals[field];
    if (v === undefined) return 0;
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || !Number.isFinite(v)) {
      return NaN;
    }
    return v;
  };
  const critical = pick('critical');
  const serious = pick('serious');
  const moderate = pick('moderate');
  const minor = pick('minor');
  if ([critical, serious, moderate, minor].some((n) => Number.isNaN(n))) {
    return { ok: false, reason: 'baseline JSON totals has non-negative-number values' };
  }
  return { ok: true, critical, serious, moderate, minor, generatedAt: raw.generatedAt };
}

/**
 * Compare a totals block against the threshold ceilings — pure function so
 * unit tests can drive it without hitting the FS.
 *
 * Returns an ordered list of impact breaches; empty array = pass. `critical`
 * is always evaluated first because the SSOT bar is 0 in every tier.
 */
export function computeBreaches(totals, threshold) {
  const breaches = [];
  if (totals.critical > threshold.critical) {
    breaches.push(`critical ${totals.critical} > ${threshold.critical}`);
  }
  if (totals.serious > threshold.serious) {
    breaches.push(`serious ${totals.serious} > ${threshold.serious}`);
  }
  if (totals.moderate > threshold.moderate) {
    breaches.push(`moderate ${totals.moderate} > ${threshold.moderate}`);
  }
  return breaches;
}

/** Render a threshold triple like `0/3/10` — same order as SSOT tier table. */
function formatThreshold(t) {
  return `${t.critical}/${t.serious}/${t.moderate}`;
}

// Skip the CLI when imported (e.g. from unit tests). The module-level exports
// stay reachable so consumers can cross-check the tier table SSOT.
if (isMainModule(process.argv[1], import.meta.url)) {
  const failures = [];
  const rows = [];
  for (const pkg of PACKAGES) {
    const threshold = THRESHOLDS[pkg];
    const tierInfo = A11Y_PACKAGE_TIER[pkg];
    const tierLabel = tierInfo.tier + (tierInfo.override !== undefined ? ' (override)' : '');
    const result = loadTotals(pkg);
    if (!result.ok) {
      if (DEFERRED.has(pkg)) {
        rows.push(`| ${pkg} | ${tierLabel} | deferred | ${formatThreshold(threshold)} | baseline deferred to a later milestone |`);
        continue;
      }
      failures.push({ pkg, reason: result.reason });
      rows.push(`| ${pkg} | ${tierLabel} | n/a | ${formatThreshold(threshold)} | FAIL ${result.reason} |`);
      continue;
    }
    const breaches = computeBreaches(result, threshold);
    const totalsStr = `${result.critical}/${result.serious}/${result.moderate} (minor ${result.minor})`;
    if (breaches.length === 0) {
      rows.push(`| ${pkg} | ${tierLabel} | ${totalsStr} | ${formatThreshold(threshold)} | PASS |`);
    } else {
      rows.push(`| ${pkg} | ${tierLabel} | ${totalsStr} | ${formatThreshold(threshold)} | FAIL ${breaches.join(', ')} |`);
      failures.push({ pkg, threshold, totals: result, breaches });
    }
  }

  const header = [
    '| package | tier | critical/serious/moderate | threshold | status |',
    '|---|---|---|---|---|',
  ];
  const report = [
    `# A11y gate report`,
    '',
    `13-axis release gate — a11y.tier axis, threshold table SSOT: docs/quality/a11y-thresholds.md.`,
    '',
    ...header,
    ...rows,
    '',
  ];
  process.stdout.write(report.join('\n'));

  if (failures.length === 0) {
    process.stderr.write('\nAll packages passed a11y thresholds.\n');
    process.exit(0);
  }

  process.stderr.write('\nA11y gate failed for:\n');
  for (const f of failures) {
    if (f.breaches) {
      process.stderr.write(
        `  - ${f.pkg}: ${f.breaches.join(', ')} (tier ceiling ${formatThreshold(f.threshold)})\n`,
      );
    } else {
      process.stderr.write(`  - ${f.pkg}: ${f.reason}\n`);
    }
  }
  process.exit(1);
}
