#!/usr/bin/env node
/**
 * A11y baseline runner (v1.30-1 infra stub).
 *
 * Reads each package's `.axe-config.mjs`, validates the shape against the
 * 4-tier SSOT in `docs/quality/a11y-thresholds.md`, and — if no baseline
 * file exists yet — writes an empty baseline stub at the configured
 * `baselinePath`. This lets the 37-package `test:a11y` script land as a
 * no-op that will not fail CI once the real axe-core runners plug in.
 *
 * v1.30-1 scope: infra only (config validation + baseline stub creation).
 * v1.30-2 scope: real axe-core execution + jsdom / Playwright / SSR harness.
 *
 * Usage (from a package directory, wired via `test:a11y` in package.json):
 *   node ../../scripts/run-axe-baseline.mjs
 *
 * Exit codes:
 *   0 — config OK, baseline present or newly stubbed
 *   1 — .axe-config.mjs missing or invalid
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Validate an `.axe-config.mjs` default export against the 4-tier SSOT.
 * Pure function so behaviour tests can call it without hitting the FS.
 *
 * @param {unknown} config — the default export from `.axe-config.mjs`
 * @returns {{ok: true, thresholds: object, baselinePath: string} | {ok: false, error: string}}
 */
export function validateAxeConfig(config) {
  if (!config || typeof config !== 'object') {
    return { ok: false, error: '.axe-config.mjs must export a default object.' };
  }
  const { thresholds, baselinePath } = /** @type {any} */ (config);
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
  return { ok: true, thresholds, baselinePath };
}

/**
 * Build the baseline stub payload for a package.
 * Pure function apart from `generatedAt` — pass `now` to make tests deterministic.
 *
 * @param {string} pkgName
 * @param {Date} [now]
 */
export function buildBaselineStub(pkgName, now = new Date()) {
  return {
    package: pkgName,
    generatedAt: now.toISOString(),
    infraStub: true,
    note: 'v1.30-1 infra stub. Real axe-core execution lands in v1.30-2.',
    violations: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    surviving: [],
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

  const { thresholds, baselinePath } = result;
  const pkgName = readPkgName(cwd);
  const absBaseline = resolve(cwd, baselinePath);

  if (!existsSync(absBaseline)) {
    mkdirSync(dirname(absBaseline), { recursive: true });
    writeFileSync(absBaseline, JSON.stringify(buildBaselineStub(pkgName), null, 2) + '\n');
    console.log(`[a11y] ${pkgName}: baseline stub written to ${baselinePath}`);
  } else {
    console.log(`[a11y] ${pkgName}: baseline present at ${baselinePath}`);
  }

  console.log(
    `[a11y] ${pkgName}: config OK (critical ${thresholds.critical}, serious ${formatThreshold(thresholds.serious)}, moderate ${formatThreshold(thresholds.moderate)}).`,
  );
}

// Only run as CLI when invoked directly (not when imported by tests).
const isEntry = pathToFileURL(process.argv[1] ?? '').href === import.meta.url;
if (isEntry) {
  main().catch((err) => {
    console.error(`[a11y] ${err.stack ?? err.message ?? err}`);
    process.exit(1);
  });
}
