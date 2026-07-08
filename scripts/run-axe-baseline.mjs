#!/usr/bin/env node
/**
 * A11y baseline runner (3-layer harness driver).
 *
 * Reads each package's `.axe-config.mjs`, validates the shape against the
 * 4-tier SSOT in `docs/quality/a11y-thresholds.md`, executes the 3-layer
 * harness (jsdom / Playwright / SSR-hydration) against the fixtures declared
 * in the config, and rewrites `.a11y-baseline/{pkg}.json` with the aggregated
 * result.
 *
 * A package that participates in no layer (its `.axe-config.mjs` omits the
 * whole `fixtures` field, or declares every layer absent) produces a
 * `layers-absent` baseline — every layer records `applicable: false` with an
 * explicit reason. This is the expected state for every current kiwa
 * `@kiwa/*` package because they are test-adapter infrastructure that
 * emit no runtime DOM.
 *
 * Fixture-wired path — packages that supply a jsdom or SSR-hydration fixture
 * need a jsdom global before importing the harness because `runLayerHarness`
 * expects `document` to be defined. This driver boots a jsdom global from
 * the `jsdom` peerDep when a fixture requires it; if `jsdom` is not
 * installed the driver exits with a clear message rather than a
 * `document is not defined` reference error.
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
 * The optional `providers` field enumerates provider adapters the package
 * sweeps under one baseline (auth 6 + 4 protocol / queue 5 / cache 3 /
 * payment 3 × 9 / streaming 3 × 5 / orm 3 × 3 × 8 — the SaaS-tier packages
 * added in v1.30-3). Each provider is an object with `name` required plus
 * any subset of `protocol` / `semantics` / `backend` / `axis` optional
 * strings. The runner passes the list through to the baseline so downstream
 * gates can prove the sweep considered every provider.
 *
 * @param {unknown} config — the default export from `.axe-config.mjs`
 * @returns {{ok: true, thresholds: object, baselinePath: string, fixtures?: object, layers?: object, providers?: Array<object>} | {ok: false, error: string}}
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
  const providers = cfg.providers;
  if (providers !== undefined) {
    if (!Array.isArray(providers)) {
      return { ok: false, error: '.axe-config.mjs "providers" must be an array when set.' };
    }
    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];
      if (!p || typeof p !== 'object' || typeof p.name !== 'string' || p.name.length === 0) {
        return {
          ok: false,
          error: `.axe-config.mjs "providers[${i}]" must be an object with a non-empty "name" string.`,
        };
      }
    }
  }
  return {
    ok: true,
    thresholds,
    baselinePath,
    fixtures: cfg.fixtures,
    layers: cfg.layers,
    providers,
  };
}

/**
 * Normalise a providers list into a stable, JSON-safe array. Each entry
 * keeps `name` (required) plus any of the optional provenance strings the
 * SaaS-tier configs use (`protocol` / `semantics` / `backend` / `axis`).
 * Unknown fields are dropped so the baseline shape is bounded.
 *
 * @param {Array<object> | undefined} providers
 * @returns {Array<{name: string, protocol?: string, semantics?: string, backend?: string, axis?: string}>}
 */
export function normalizeProviders(providers) {
  if (!Array.isArray(providers)) return [];
  return providers.map((p) => {
    const out = { name: p.name };
    if (typeof p.protocol === 'string') out.protocol = p.protocol;
    if (typeof p.semantics === 'string') out.semantics = p.semantics;
    if (typeof p.backend === 'string') out.backend = p.backend;
    if (typeof p.axis === 'string') out.axis = p.axis;
    return out;
  });
}

/** Empty impact bucket shared with the harness. */
const ZERO_IMPACTS = Object.freeze({ critical: 0, serious: 0, moderate: 0, minor: 0 });

/** SSOT reason strings — matches the harness `ABSENT_REASONS` map. */
const ABSENT_REASONS = Object.freeze({
  jsdom: 'no jsdom fixture — package produces no static DOM output.',
  playwright: 'no playwright fixture — package has no browser-runtime surface.',
  ssrHydration: 'no ssrHydration fixture — package emits no SSR string.',
});

/**
 * Build the layers-absent baseline payload for a package — used when the
 * package has no fixtures wired. Every layer records `applicable: false`
 * so downstream readers know the harness ran but had nothing to scan.
 *
 * When `providers` is passed the resulting baseline records the normalised
 * list so downstream gates can prove the sweep considered every provider
 * (SaaS-tier packages in v1.30-3 declare 6 to 72 providers each).
 *
 * Pure function apart from `generatedAt` — pass `now` to make tests
 * deterministic.
 *
 * @param {string} pkgName
 * @param {Date} [now]
 * @param {Array<object>} [providers]
 */
export function buildLayersAbsentBaseline(pkgName, now = new Date(), providers) {
  const absent = (layer) => ({
    layer,
    applicable: false,
    reason: ABSENT_REASONS[layer],
    violations: { ...ZERO_IMPACTS },
    surviving: [],
  });
  const baseline = {
    package: pkgName,
    generatedAt: now.toISOString(),
    layers: {
      jsdom: absent('jsdom'),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    },
    totals: { ...ZERO_IMPACTS },
    ok: true,
  };
  const normalized = normalizeProviders(providers);
  if (normalized.length > 0) {
    baseline.providers = normalized;
  }
  return baseline;
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

/**
 * Decide whether the fixtures declared in `.axe-config.mjs` require a jsdom
 * global. Playwright-only fixtures do not (they already carry axe results),
 * jsdom + SSR-hydration fixtures do (the harness scans a DOM).
 *
 * @param {object | undefined} fixtures
 */
export function needsJsdom(fixtures) {
  if (!fixtures || typeof fixtures !== 'object') return false;
  return Boolean(fixtures.jsdom) || Boolean(fixtures.ssrHydration);
}

/**
 * True when any fixture field is populated.
 *
 * @param {object | undefined} fixtures
 */
export function hasAnyFixture(fixtures) {
  if (!fixtures || typeof fixtures !== 'object') return false;
  return Boolean(fixtures.jsdom || fixtures.playwright || fixtures.ssrHydration);
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

/**
 * Read the existing baseline `generatedAt` so we can preserve it when the
 * new report is otherwise identical. This avoids a spurious git diff every
 * time the runner is executed.
 *
 * @param {string} absBaseline
 * @returns {string | null}
 */
function readPreviousGeneratedAt(absBaseline) {
  if (!existsSync(absBaseline)) return null;
  try {
    const prev = JSON.parse(readFileSync(absBaseline, 'utf8'));
    return typeof prev?.generatedAt === 'string' ? prev.generatedAt : null;
  } catch {
    return null;
  }
}

/**
 * Persist a baseline payload, preserving the previous `generatedAt` when
 * every other field is unchanged so identical runs do not churn the git
 * diff.
 *
 * @param {string} absBaseline
 * @param {{generatedAt: string} & object} next
 */
function persistBaseline(absBaseline, next) {
  const previousGeneratedAt = readPreviousGeneratedAt(absBaseline);
  let payload = next;
  if (previousGeneratedAt !== null) {
    const candidate = { ...next, generatedAt: previousGeneratedAt };
    const existingRaw = existsSync(absBaseline)
      ? readFileSync(absBaseline, 'utf8')
      : '';
    const candidateSerialized = JSON.stringify(candidate, null, 2) + '\n';
    if (existingRaw === candidateSerialized) {
      payload = candidate;
    }
  }
  writeFileSync(absBaseline, JSON.stringify(payload, null, 2) + '\n');
}

/**
 * Boot a jsdom global (`document` / `window`) when the current runtime does
 * not have one. The harness expects `document` on `globalThis` for jsdom
 * and SSR-hydration layers; raw Node lacks it. Callers only reach this
 * branch when fixtures require it, so an unresolved `jsdom` peerDep is
 * surfaced as an actionable install hint rather than a downstream stack
 * trace.
 */
/**
 * Import `.axe-config.mjs` with a lazy jsdom-boot fallback. Most configs
 * import cleanly on raw Node (they only build fixtures inside async
 * factories or from strings); a config that captures a live jsdom Element
 * at module top level throws `ReferenceError: document is not defined`
 * before we can inspect the fixtures field. On that specific error we
 * boot jsdom and retry once — every other error is rethrown so real
 * config bugs still surface (N4 regression fix).
 *
 * @param {string} configPath
 */
async function loadAxeConfigWithJsdomFallback(configPath) {
  const url = pathToFileURL(configPath).href;
  try {
    return await import(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const referenceMiss =
      err instanceof ReferenceError &&
      /(document|window|Element|HTMLElement|Node) is not defined/.test(message);
    if (!referenceMiss) throw err;
    await ensureJsdomGlobal();
    // The failing import populates Node's ESM cache with a rejected
    // record — the retry must bypass the cache with a query string so the
    // config re-evaluates against the freshly-booted jsdom globals.
    return await import(`${url}?jsdom-retry=${Date.now()}`);
  }
}

async function ensureJsdomGlobal() {
  if (typeof globalThis.document !== 'undefined') return;
  let JSDOM;
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch (err) {
    throw new Error(
      'run-axe-baseline: fixture-wired baseline requires the `jsdom` peerDep. ' +
        'Install it with `pnpm add -D jsdom` in the package under test. ' +
        (err instanceof Error ? err.message : String(err)),
    );
  }
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
}

async function main() {
  const cwd = process.cwd();
  const configPath = resolve(cwd, '.axe-config.mjs');

  if (!existsSync(configPath)) {
    console.error(`[a11y] .axe-config.mjs not found at ${configPath}`);
    console.error('[a11y] SSOT: docs/quality/a11y-thresholds.md');
    process.exit(1);
  }

  // Import `.axe-config.mjs`. If it captures a jsdom-owned Element at
  // module top level (e.g. `const host = document.createElement('div')`),
  // the raw import throws `document is not defined` before we know the
  // package needs jsdom. Catch that specific ReferenceError, boot a jsdom
  // global (which pulls the `jsdom` peerDep — packages that don't ship
  // jsdom cannot reach this branch because their config imports cleanly),
  // and retry the import (N4 regression fix).
  const mod = await loadAxeConfigWithJsdomFallback(configPath);
  const config = mod.default ?? mod;
  const result = validateAxeConfig(config);
  if (!result.ok) {
    console.error(`[a11y] ${result.error}`);
    process.exit(1);
  }

  const { thresholds, baselinePath, fixtures, providers } = result;
  const pkgName = readPkgName(cwd);
  const absBaseline = resolve(cwd, baselinePath);
  mkdirSync(dirname(absBaseline), { recursive: true });

  // Default path — no fixtures wired → land a layers-absent baseline.
  // Fixture-wired packages replace this with a real harness run.
  if (!hasAnyFixture(fixtures)) {
    const baseline = buildLayersAbsentBaseline(pkgName, new Date(), providers);
    persistBaseline(absBaseline, baseline);
    const normalized = normalizeProviders(providers);
    const providerSuffix =
      normalized.length > 0 ? ` [providers: ${normalized.length}]` : '';
    console.log(
      `[a11y] ${pkgName}: layers-absent baseline written to ${baselinePath} (no fixtures declared — Core / Framework tier no-DOM package)${providerSuffix}.`,
    );
    console.log(
      `[a11y] ${pkgName}: config OK (critical ${thresholds.critical}, serious ${formatThreshold(thresholds.serious)}, moderate ${formatThreshold(thresholds.moderate)}).`,
    );
    process.exit(0);
  }

  // Fixture-wired path: import the a11y harness from the workspace and run
  // it against the declared fixtures. `ensureJsdomGlobal` is idempotent, so
  // this call is a no-op when the config-load fallback already booted jsdom
  // above (N4 regression) and a fresh boot for configs that declare
  // jsdom / SSR fixtures but never touch `document` at module top level.
  // The harness itself is unit-tested exhaustively in
  // `packages/a11y/tests/layer-harness.test.ts`, so this driver is
  // deliberately thin.
  if (needsJsdom(fixtures)) {
    await ensureJsdomGlobal();
  }
  let runLayerHarness;
  try {
    ({ runLayerHarness } = await import('@kiwa/a11y'));
  } catch (err) {
    console.error(
      `[a11y] ${pkgName}: could not import @kiwa/a11y (needed for fixture-wired baseline). ${err instanceof Error ? err.message : err}`,
    );
    process.exit(1);
  }
  const report = await runLayerHarness(pkgName, fixtures);
  const normalizedProviders = normalizeProviders(providers);
  if (normalizedProviders.length > 0) {
    report.providers = normalizedProviders;
  }
  persistBaseline(absBaseline, report);

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
