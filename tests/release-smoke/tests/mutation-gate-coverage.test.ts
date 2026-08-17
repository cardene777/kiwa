// A package that runs mutation testing must also be scored (Issue #1951).
//
// `packages/security` carried a Stryker config, a threshold in its header
// comment, and 9 files in `mutate` — and nothing read the result. It was absent
// from `PACKAGE_TIER` (so the gate had no threshold for it), absent from
// `PKG_DIRS` (so the gate could not find its report), and absent from root
// `test:mutation` (so the run never happened). The config read like coverage
// and delivered none.
//
// The neighbouring a11y gate has had this check since #1785
// (`scripts/check-a11y-gates.test.mjs`), comparing its tier map against the root
// filter list. The mutation gate never got one, and it needs one more axis than
// a11y does: the a11y check would still have passed here, because it only
// compares two hand-maintained lists to each other. `security` was missing from
// both, and the thing that gave it away was the config on disk.
//
// So the config is what this axis treats as the fact. When it fails, the fix is
// one of:
//   1. add the package to `PACKAGE_TIER` / `PKG_DIRS` / root `test:mutation`
//   2. delete `packages/<name>/stryker.config.mjs` if it should not run
//   3. add it to `UNSCORED_ALLOWLIST` below with the reason
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const GATE = resolve(REPO_ROOT, 'scripts/check-mutation-gates.mjs');

// Packages that carry a Stryker config on purpose without being scored. Each
// entry needs a reason: an unexplained exemption is the state this axis exists
// to detect.
const UNSCORED_ALLOWLIST: readonly string[] = [
  // (empty — every package with a Stryker config is scored by the gate)
];

const TIERS = ['core', 'framework', 'saas', 'test-type'];

interface TierEntry {
  tier: string;
  override?: number;
  reason?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadGate = (): Promise<any> => import(pathToFileURL(GATE).href);

function packagesWithStrykerConfig(): string[] {
  const packagesDir = resolve(REPO_ROOT, 'packages');
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(resolve(packagesDir, name, 'stryker.config.mjs')))
    .sort();
}

function rootMutationFilters(): string[] {
  const root = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf-8')) as {
    scripts: Record<string, string>;
  };
  const script = root.scripts['test:mutation'] ?? '';
  return [...script.matchAll(/-F (@kiwa-lab\/[a-z0-9-]+)/g)].map((match) => match[1] as string);
}

describe('every package that runs mutation testing is scored', () => {
  it('gives each Stryker config a tier, a directory, and a place in the run', async () => {
    const { PACKAGE_TIER, PKG_DIRS } = await loadGate();
    const filters = new Set(rootMutationFilters());
    const expected = packagesWithStrykerConfig().filter(
      (name) => !UNSCORED_ALLOWLIST.includes(name),
    );

    expect(expected.length).toBeGreaterThan(0);
    for (const name of expected) {
      const scoped = `@kiwa-lab/${name}`;
      expect(PACKAGE_TIER[scoped], `${scoped}: no PACKAGE_TIER entry`).toBeDefined();
      expect(PKG_DIRS[scoped], `${scoped}: no PKG_DIRS entry`).toBe(`packages/${name}`);
      expect(filters.has(scoped), `${scoped}: absent from root test:mutation`).toBe(true);
    }
  });

  it('does not score a package that has no Stryker config to score', async () => {
    const { PACKAGE_TIER } = await loadGate();
    // The reverse direction. A tier entry without a config means the gate looks
    // for a report that nothing produces, which reads as a failure of the
    // package rather than of the wiring.
    for (const scoped of Object.keys(PACKAGE_TIER)) {
      const dir = scoped.replace('@kiwa-lab/', '');
      expect(
        existsSync(resolve(REPO_ROOT, 'packages', dir, 'stryker.config.mjs')),
        `${scoped}: PACKAGE_TIER entry with no packages/${dir}/stryker.config.mjs`,
      ).toBe(true);
    }
  });

  it('runs exactly the packages it scores', async () => {
    const { PACKAGE_TIER } = await loadGate();
    expect([...new Set(rootMutationFilters())].sort()).toEqual(Object.keys(PACKAGE_TIER).sort());
  });

  it('gives every entry a tier the threshold table knows', async () => {
    const { PACKAGE_TIER, TIER_THRESHOLD, thresholdFor } = await loadGate();
    for (const [scoped, entry] of Object.entries(PACKAGE_TIER as Record<string, TierEntry>)) {
      expect(TIERS, `${scoped}: unknown tier ${entry.tier}`).toContain(entry.tier);
      expect(typeof thresholdFor(scoped), `${scoped}: no effective threshold`).toBe('number');
      if (entry.override !== undefined) {
        // A looser override is a temporary exception and the reason is what makes
        // it reviewable later (docs/quality/mutation-thresholds.md § Overrides).
        const tierDefault = TIER_THRESHOLD[entry.tier] as number;
        if (entry.override < tierDefault) {
          expect(entry.reason, `${scoped}: looser override without a reason`).toBeTruthy();
        }
      }
    }
  });

  it('never lets a config sit below the break bar its tier sets', async () => {
    const { PACKAGE_TIER, TIER_THRESHOLD } = await loadGate();
    // Not an equality check. `docs/quality/mutation-thresholds.md § Overrides`
    // says the two may differ and the gate is authoritative — `auth` declares
    // the Framework default 70 while the gate holds a temporary override at 65,
    // and `a11y` declares 90 against a tier default of 60. Both are intended.
    //
    // What must hold is the floor: a config whose own `break` sits under the
    // tier's fails the local run later than the gate does, so a red package
    // reads green until someone runs the gate.
    const TIER_BREAK: Record<string, number> = {
      core: 50,
      framework: 50,
      saas: 50,
      'test-type': 40,
    };
    for (const name of packagesWithStrykerConfig()) {
      const scoped = `@kiwa-lab/${name}`;
      const entry = (PACKAGE_TIER as Record<string, TierEntry>)[scoped];
      if (!entry) continue;
      const config = readFileSync(
        resolve(REPO_ROOT, 'packages', name, 'stryker.config.mjs'),
        'utf-8',
      );
      const declared = /thresholds:\s*\{[^}]*break:\s*(\d+)/.exec(config);
      expect(declared, `${scoped}: no thresholds.break in stryker.config.mjs`).not.toBeNull();
      expect(
        Number((declared as RegExpExecArray)[1]),
        `${scoped}: config break below the ${entry.tier} tier bar`,
      ).toBeGreaterThanOrEqual(TIER_BREAK[entry.tier] as number);
      // TIER_THRESHOLD is the `high` column; the break column lives in the doc.
      expect(TIER_THRESHOLD[entry.tier], `${scoped}: tier absent from TIER_THRESHOLD`).toBeTypeOf(
        'number',
      );
    }
  });
});
