#!/usr/bin/env node
/**
 * A11y baseline runner (v1.30-2 3-layer harness).
 *
 * Reads each package's `.axe-config.mjs`, validates the shape against the
 * 4-tier SSOT in `docs/quality/a11y-thresholds.md`, executes the 3-layer
 * harness (jsdom / Playwright / SSR-hydration) against the fixtures declared
 * in the config, and rewrites `.a11y-baseline/{pkg}.json` with the aggregated
 * result.
 *
 * v1.30-1 scope: infra only (config validation + baseline stub creation).
 * v1.30-2 scope: real harness execution + per-layer baselines.
 *
 * A package that participates in no layer (its `.axe-config.mjs` omits the
 * whole `fixtures` field, or declares every layer absent) produces a
 * `layers-absent` baseline — every layer records `applicable: false` with an
 * explicit reason. This is the expected state for every current kiwa
 * `@kiwa-test/*` package because they are test-adapter infrastructure that
 * emit no runtime DOM.
 *
 * Usage (from a package directory, wired via `test:a11y` in package.json):
 *   node ../../scripts/run-axe-baseline.mjs
 *
 * Exit codes:
 *   0 — config OK, baseline persisted, tier thresholds respected.
 *   1 — `.axe-config.mjs` missing or invalid, or a tier threshold was
 *       breached (critical > 0 in any tier, serious > tier max, etc.).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Validate an `.axe-config.mjs` default export against the 4-tier SSOT.
 * Pure function so behaviour tests can call it without hitting the FS.
 *
 * @param {unknown} config — the default export from `.axe-config.mjs`
 * @returns {{ok: true, thresholds: object, baselinePath: string, fixtures?: object, layers?: object} | {ok: false, error: string}}
 */
export function validateAxeConfig(config) {
  if (!config || typeof config !== 'object') {
    return { ok: false, error: '.axe-config.mjs must export a default object.' };
  }
  const cfg = /** @type {any} */ (config);
  const { thresholds, baselinePath } = cfg;
  if (!thresholds || typeof thresholds !== 'object') {
    return { ok: false, error: '.axe-config.mjs is missing "thresholds".' };
  }
  if (thresholds.critical !== 0) {
    return {
      ok: false,
      error: `"critical" threshold must be 0 (SSOT: docs/quality/a11y-thresholds.md). Got ${JSON.stringify(thresholds.critical)}.`,
    };
  }
  if (typeof baselinePath !== 'string' || baselinePath.length === 0) {
    return { ok: false, error: '.axe-config.mjs is missing "baselinePath".' };
  }
  return {
    ok: true,
    thresholds,
    baselinePath,
    fixtures: cfg.fixtures,
    layers: cfg.layers,
  };
}

/**
 * Build the layers-absent baseline payload for a package — used when the
 * package has no fixtures wired. Every layer records `applicable: false`
 * so downstream readers know the harness ran but had nothing to scan.
 *
 * Pure function apart from `generatedAt` — pass `now` to make tests
 * deterministic.
 *
 * @param {string} pkgName
 * @param {Date} [now]
 */
export function buildLayersAbsentBaseline(pkgName, now = new Date()) {
  const zeroImpacts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const absent = (layer, reason) => ({
    layer,
    applicable: false,
    reason,
    violations: { ...zeroImpacts },
    surviving: [],
  });
  return {
    package: pkgName,
    generatedAt: now.toISOString(),
    layers: {
      jsdom: absent('jsdom', 'no jsdom fixture — package produces no static DOM output.'),
      playwright: absent('playwright', 'no playwright fixture — package has no browser-runtime surface.'),
      ssrHydration: absent('ssrHydration', 'no ssrHydration fixture — package emits no SSR string.'),
    },
    totals: { ...zeroImpacts },
    ok: true,
  };
}

/**
 * Format a threshold value for stdout.
 * Accepts a raw number or `{ max: N }`.
 *
 * @param {number | {max: number}} v
 */
export function formatThreshold(v) {
  if (typeof v === 'number') return String(v);
  if (v && typeof v === 'object' && 'max' in v) return `<= ${v.max}`;
  return JSON.stringify(v);
}

/**
 * Resolve the numeric ceiling of a threshold field. `undefined` means no
 * ceiling was set for this impact and every count is accepted (used by
 * Core-tier `minor`, which is never enforced).
 *
 * @param {number | {max: number} | undefined} v
 * @returns {number | undefined}
 */
export function ceilingOf(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'max' in v) return v.max;
  return undefined;
}

/**
 * Compare a HarnessReport's totals against the tier thresholds, returning
 * a list of ceiling breaches. `critical` is always checked (SSOT invariant),
 * even if the config author accidentally deleted the field.
 *
 * @param {{critical: number, serious?: number, moderate?: number, minor?: number}} totals
 * @param {object} thresholds
 * @returns {string[]}
 */
export function tierBreaches(totals, thresholds) {
  const breaches = [];
  const criticalCeiling = ceilingOf(thresholds.critical) ?? 0;
  if (totals.critical > criticalCeiling) {
    breaches.push(`critical ${totals.critical} > ${criticalCeiling}`);
  }
  const seriousCeiling = ceilingOf(thresholds.serious);
  if (seriousCeiling !== undefined && totals.serious > seriousCeiling) {
    breaches.push(`serious ${totals.serious} > ${seriousCeiling}`);
  }
  const moderateCeiling = ceilingOf(thresholds.moderate);
  if (moderateCeiling !== undefined && totals.moderate > moderateCeiling) {
    breaches.push(`moderate ${totals.moderate} > ${moderateCeiling}`);
  }
  return breaches;
}

function readPkgName(dir) {
  const pkgPath = resolve(dir, 'package.json');
  if (!existsSync(pkgPath)) return dir;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.name ?? dir;
  } catch {
    return dir;
  }
}

async function main() {
  const cwd = process.cwd();
  const configPath = resolve(cwd, '.axe-config.mjs');

  if (!existsSync(configPath)) {
    console.error(`[a11y] .axe-config.mjs not found at ${configPath}`);
    console.error('[a11y] SSOT: docs/quality/a11y-thresholds.md');
    process.exit(1);
  }

  const mod = await import(pathToFileURL(configPath).href);
  const config = mod.default ?? mod;
  const result = validateAxeConfig(config);
  if (!result.ok) {
    console.error(`[a11y] ${result.error}`);
    process.exit(1);
  }

  const { thresholds, baselinePath, fixtures } = result;
  const pkgName = readPkgName(cwd);
  const absBaseline = resolve(cwd, baselinePath);
  mkdirSync(dirname(absBaseline), { recursive: true });

  // v1.30-2 default path: no fixtures wired → land a layers-absent baseline.
  // Fixture-wired packages will replace this with a real harness run once
  // v1.30-3 (test-type + SaaS sweep) lands them.
  const hasFixtures =
    fixtures &&
    typeof fixtures === 'object' &&
    (fixtures.jsdom || fixtures.playwright || fixtures.ssrHydration);

  if (!hasFixtures) {
    const baseline = buildLayersAbsentBaseline(pkgName);
    writeFileSync(absBaseline, JSON.stringify(baseline, null, 2) + '\n');
    console.log(
      `[a11y] ${pkgName}: layers-absent baseline written to ${baselinePath} (no fixtures declared — Core / Framework tier no-DOM package).`,
    );
    console.log(
      `[a11y] ${pkgName}: config OK (critical ${thresholds.critical}, serious ${formatThreshold(thresholds.serious)}, moderate ${formatThreshold(thresholds.moderate)}).`,
    );
    process.exit(0);
  }

  // Fixture-wired path: import the a11y harness from the workspace and run
  // it against the declared fixtures. This branch is exercised once
  // packages start supplying real fixtures; the harness itself is unit-tested
  // exhaustively in `packages/a11y/tests/layer-harness.test.ts`, so this
  // driver is deliberately thin.
  let runLayerHarness;
  try {
    ({ runLayerHarness } = await import('@kiwa-test/a11y'));
  } catch (err) {
    console.error(
      `[a11y] ${pkgName}: could not import @kiwa-test/a11y (needed for fixture-wired baseline). ${err instanceof Error ? err.message : err}`,
    );
    process.exit(1);
  }
  const report = await runLayerHarness(pkgName, fixtures);
  writeFileSync(absBaseline, JSON.stringify(report, null, 2) + '\n');

  const breaches = tierBreaches(report.totals, thresholds);
  if (breaches.length > 0) {
    console.error(
      `[a11y] ${pkgName}: tier threshold breach — ${breaches.join(', ')}.`,
    );
    process.exit(1);
  }
  console.log(
    `[a11y] ${pkgName}: 3-layer harness OK (critical ${report.totals.critical}, serious ${report.totals.serious}, moderate ${report.totals.moderate}).`,
  );
  process.exit(0);
}

// Only run as CLI when invoked directly (not when imported by tests).
const isEntry = pathToFileURL(process.argv[1] ?? '').href === import.meta.url;
if (isEntry) {
  main().catch((err) => {
    console.error(`[a11y] ${err.stack ?? err.message ?? err}`);
    process.exit(1);
  });
}
