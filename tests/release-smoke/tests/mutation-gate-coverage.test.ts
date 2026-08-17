// A package that runs mutation testing must also be scored (Issue #1951).
//
// `packages/security` carried a Stryker config, a threshold in its header
// comment, and 9 files in `mutate` — and nothing read the result. It was absent
// from `PACKAGE_TIER` (so the gate had no threshold for it), absent from
// `PKG_DIRS` (so the gate could not find its report), and absent from root
// `test:mutation` (so the run never happened). The config read like coverage
// and delivered none.
//
// The neighbouring a11y gate has had a check since #1785
// (`scripts/check-a11y-gates.test.mjs`), comparing its tier map against the root
// filter list. That shape would still have passed here, because it only compares
// two hand-maintained lists to each other and `security` was missing from both.
// What gave it away was the package itself, so this axis starts from the package
// and asks whether the wiring exists.
//
// When it fails, the fix is one of:
//   1. add the package to `PACKAGE_TIER` / `PKG_DIRS` / root `test:mutation`
//   2. remove its `test:mutation` script and Stryker config if it should not run
//   3. add it to `UNSCORED_ALLOWLIST` below with the reason
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const GATE = resolve(REPO_ROOT, 'scripts/check-mutation-gates.mjs');
const DOC = resolve(REPO_ROOT, 'docs/quality/mutation-thresholds.md');

// Packages that run mutation testing on purpose without being scored. Each entry
// needs a reason: an unexplained exemption is the state this axis exists to
// detect. `withoutExemptions` below is what applies it, and it is tested.
const UNSCORED_ALLOWLIST: readonly string[] = [
  // (empty — every package that runs mutation testing is scored by the gate)
];

/**
 * A Stryker config, by shape rather than by name.
 *
 * Keying on `stryker.config.mjs` alone would let a package rename its config to
 * another supported name and drop out of this axis while still running — the
 * same invisibility the axis exists to catch. Listing the supported names
 * instead just moves the problem: Stryker resolves four extensions across two
 * stems today, `.cjs` was missing from the first version of this list, and a
 * list of forms has no point at which it is provably complete (the lesson
 * `docs/quality/mutation-thresholds.md § Telling the shapes apart` records).
 *
 * So both stems with any extension count. A stray `stryker.conf.md` would make
 * this axis demand wiring for a package that does not run — the safe direction,
 * since the failure it prevents is a package that runs unscored.
 */
const STRYKER_CONFIG_PATTERN = /^\.?stryker\.(config|conf)\.[a-z0-9]+$/i;

interface TierEntry {
  tier: string;
  override?: number;
  reason?: string;
}

interface Runner {
  dir: string;
  scoped: string;
  configs: string[];
  hasScript: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadGate = (): Promise<any> => import(pathToFileURL(GATE).href);

export function withoutExemptions(names: string[], allowlist: readonly string[]): string[] {
  return names.filter((name) => !allowlist.includes(name));
}

/**
 * Packages that run mutation testing, by either signal.
 *
 * A config with no script never runs, and a script with no config runs with
 * whatever the command line says. Both shapes are wiring that should be scored,
 * so the union is the fact rather than one file name.
 */
function mutationRunners(): Runner[] {
  const packagesDir = resolve(REPO_ROOT, 'packages');
  const runners: Runner[] = [];
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = entry.name;
    const configs = readdirSync(resolve(packagesDir, dir), { withFileTypes: true })
      .filter((child) => !child.isDirectory() && STRYKER_CONFIG_PATTERN.test(child.name))
      .map((child) => child.name)
      .sort();
    const manifestPath = resolve(packagesDir, dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    const hasScript = Boolean(manifest.scripts?.['test:mutation']);
    if (configs.length === 0 && !hasScript) continue;
    runners.push({ dir, scoped: manifest.name ?? `@kiwa-lab/${dir}`, configs, hasScript });
  }
  return runners.sort((a, b) => a.dir.localeCompare(b.dir));
}

function rootMutationFilters(): string[] {
  const root = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf-8')) as {
    scripts: Record<string, string>;
  };
  const script = root.scripts['test:mutation'] ?? '';
  return [...script.matchAll(/-F (@kiwa-lab\/[a-z0-9-]+)/g)].map((match) => match[1] as string);
}

/**
 * The tier table from the doc, which owns these numbers.
 *
 * Copying the break column into this file would let the doc move without the
 * check noticing, which is the drift `§ Overrides` already warns about between
 * the doc and the gate.
 */
function docTierTable(): Record<string, { high: number; low: number; break: number }> {
  const text = readFileSync(DOC, 'utf-8');
  const rows = [...text.matchAll(/^\| (Core|Framework|SaaS|Test type) \| (\d+) % \| (\d+) % \| (\d+) % \|/gm)];
  const table: Record<string, { high: number; low: number; break: number }> = {};
  for (const [, label, high, low, brk] of rows) {
    const key = String(label).toLowerCase().replace(' ', '-');
    table[key] = { high: Number(high), low: Number(low), break: Number(brk) };
  }
  return table;
}

describe('every package that runs mutation testing is scored', () => {
  it('gives each runner a tier, a directory, and a place in the run', async () => {
    const { PACKAGE_TIER, PKG_DIRS } = await loadGate();
    const filters = new Set(rootMutationFilters());
    const runners = mutationRunners();
    const expected = withoutExemptions(
      runners.map((runner) => runner.dir),
      UNSCORED_ALLOWLIST,
    );

    expect(expected.length).toBeGreaterThan(0);
    for (const runner of runners.filter((r) => expected.includes(r.dir))) {
      const { scoped, dir } = runner;
      expect(PACKAGE_TIER[scoped], `${scoped}: no PACKAGE_TIER entry`).toBeDefined();
      expect(PKG_DIRS[scoped], `${scoped}: no PKG_DIRS entry`).toBe(`packages/${dir}`);
      expect(filters.has(scoped), `${scoped}: absent from root test:mutation`).toBe(true);
      // The root filter names the package; the package has to own the script it
      // names. Without this, dropping `test:mutation` from a package leaves the
      // config, the tier, and the filter in place while pnpm skips it — the
      // report the gate then reads is whatever the last run left behind.
      expect(runner.hasScript, `${scoped}: no test:mutation script to run`).toBe(true);
    }
  });

  it('drops a package named in the allowlist and keeps the rest', () => {
    // The escape hatch is empty today, so the branch that applies it would never
    // run against the real tree. Exercising it here keeps it from rotting into a
    // hole nobody notices (the same gap #1948 found in its own missing-target
    // report).
    expect(withoutExemptions(['core', 'security'], ['security'])).toEqual(['core']);
    expect(withoutExemptions(['core', 'security'], [])).toEqual(['core', 'security']);
  });

  it('does not score a package that runs nothing to score', async () => {
    const { PACKAGE_TIER } = await loadGate();
    // The reverse direction. A tier entry with no runner means the gate waits for
    // a report nothing produces, which reads as a failure of the package rather
    // than of the wiring.
    const runners = new Set(mutationRunners().map((runner) => runner.scoped));
    for (const scoped of Object.keys(PACKAGE_TIER)) {
      expect(runners.has(scoped), `${scoped}: PACKAGE_TIER entry runs no mutation testing`).toBe(
        true,
      );
    }
  });

  it('runs exactly the packages it scores', async () => {
    const { PACKAGE_TIER } = await loadGate();
    expect([...new Set(rootMutationFilters())].sort()).toEqual(Object.keys(PACKAGE_TIER).sort());
  });

  it('gives every entry a tier the threshold table knows', async () => {
    const { PACKAGE_TIER, TIER_THRESHOLD, thresholdFor } = await loadGate();
    const tiers = Object.keys(docTierTable());
    expect(tiers.length, 'doc tier table did not parse').toBe(4);
    for (const [scoped, entry] of Object.entries(PACKAGE_TIER as Record<string, TierEntry>)) {
      expect(tiers, `${scoped}: unknown tier ${entry.tier}`).toContain(entry.tier);
      expect(typeof thresholdFor(scoped), `${scoped}: no effective threshold`).toBe('number');
      if (entry.override !== undefined && entry.override < (TIER_THRESHOLD[entry.tier] as number)) {
        // A looser override is a temporary exception and the reason is what makes
        // it reviewable later (docs/quality/mutation-thresholds.md § Overrides).
        expect(entry.reason, `${scoped}: looser override without a reason`).toBeTruthy();
      }
    }
  });

  it('reads the same tier defaults the doc publishes', async () => {
    const { TIER_THRESHOLD } = await loadGate();
    const table = docTierTable();
    for (const [tier, row] of Object.entries(table)) {
      expect(TIER_THRESHOLD[tier], `${tier}: gate default vs doc high column`).toBe(row.high);
    }
  });

  it('never lets a config sit below the break bar its tier sets', async () => {
    const { PACKAGE_TIER } = await loadGate();
    const table = docTierTable();
    // Not an equality check against the gate. `§ Overrides` says a config's
    // `high` and the gate's threshold may differ and the gate is authoritative —
    // `auth` declares the Framework default 70 while the gate holds a temporary
    // override at 65, and `a11y` declares 90 against a tier default of 60. Both
    // are intended.
    //
    // What must hold is the floor: a config whose own `break` sits under the
    // tier's fails the local run later than the gate does, so a red package
    // reads green until someone runs the gate.
    for (const runner of mutationRunners()) {
      const entry = (PACKAGE_TIER as Record<string, TierEntry>)[runner.scoped];
      if (!entry) continue;
      const floor = table[entry.tier]?.break;
      expect(floor, `${runner.scoped}: tier ${entry.tier} absent from the doc table`).toBeTypeOf(
        'number',
      );
      for (const configName of runner.configs) {
        const config = readFileSync(resolve(REPO_ROOT, 'packages', runner.dir, configName), 'utf-8');
        const declared = /thresholds:\s*\{[^}]*\bbreak:\s*(\d+)/.exec(config);
        expect(declared, `${runner.scoped}: no thresholds.break in ${configName}`).not.toBeNull();
        expect(
          Number((declared as RegExpExecArray)[1]),
          `${runner.scoped}: ${configName} break below the ${entry.tier} tier bar`,
        ).toBeGreaterThanOrEqual(floor as number);
      }
    }
  });
});
