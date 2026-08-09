// Fail-fast detection for the release-script-filter systematic-root-cause pattern
// (Issue #986, v1.29-1). The 4 milestone chain — v1.14 payment / v1.25 perf-harness /
// v1.27 quality-metrics / v1.28 realtime — was the same lesson applied 4 times
// after the fact: every publishable `@kiwa-lab/*` package must appear in
// **both** the `pnpm -F {name} build` step **and** the `pnpm publish --filter {name}`
// step of root `package.json > scripts.release`, or one half silently skips it
// on the next `pnpm run release` invocation.
//
// This axis discovers `@kiwa-lab/*` packages dynamically from `packages/*/package.json`
// so the assertion stays honest as new packages land — no per-milestone SSOT edit
// required. Packages whose `package.json` explicitly opts out (`private: true`) are
// treated as non-publishable and skipped. A short manual allowlist (`NON_PUBLISHED_ALLOWLIST`)
// is reserved for deliberate exclusions where the `private` flag alone cannot
// capture the intent (e.g., a package published under a different pipeline);
// it starts empty because the current 31-package set is all first-party
// `@kiwa-lab/*` scope.
//
// When this test fails, the fix is exactly one of:
//   1. Add the missing `-F @kiwa-lab/{name}` + `--filter @kiwa-lab/{name}` pair to
//      `scripts.release` (the 4th application of the systematic-root-cause pattern
//      SSOT — v1.14 / v1.25 / v1.27 / v1.28 shape).
//   2. Mark the package `"private": true` if it must not publish.
//   3. Add the package name to `NON_PUBLISHED_ALLOWLIST` with a code comment
//      explaining why the standard release filter cannot cover it.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = repoRoot(HERE);
// Packages that are intentionally excluded from the standard release filter.
// Keep empty unless there is a hard reason a `@kiwa-lab/*` name cannot appear
// in the pnpm build+publish pair. Each entry needs a one-line comment justifying
// the exception so the next reviewer can decide whether to keep it.
const NON_PUBLISHED_ALLOWLIST: readonly string[] = [
  // (empty — all @kiwa-lab/* packages currently publish through the standard filter)
];

interface PackageJson {
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8')) as T;
}

function discoverPublishablePackages(): string[] {
  const packagesDir = resolve(REPO_ROOT, 'packages');
  const dirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const publishable: string[] = [];
  for (const dir of dirs) {
    let pkg: PackageJson;
    try {
      pkg = readJson<PackageJson>(`packages/${dir}/package.json`);
    } catch {
      // Non-package directory (no package.json) — skip silently.
      continue;
    }
    if (!pkg.name || !pkg.name.startsWith('@kiwa-lab/')) continue;
    if (pkg.private === true) continue;
    publishable.push(pkg.name);
  }
  return publishable.sort();
}

function extractFilters(release: string, pattern: RegExp): Set<string> {
  const names: string[] = [];
  for (const match of release.matchAll(pattern)) {
    if (match[1]) names.push(match[1]);
  }
  return new Set(names);
}

const rootPkg = readJson<PackageJson>('package.json');
const release = rootPkg.scripts?.release ?? '';
const buildFilters = extractFilters(release, /-F\s+(@kiwa-lab\/[a-z0-9-]+)/g);
const publishFilters = extractFilters(release, /--filter\s+(@kiwa-lab\/[a-z0-9-]+)/g);
const publishable = discoverPublishablePackages();
const assertable = publishable.filter((name) => !NON_PUBLISHED_ALLOWLIST.includes(name));

describe('release script filter — systematic root cause pattern SSOT (Issue #986)', () => {
  it('root package.json has a scripts.release entry', () => {
    // The whole axis presumes a single-source release script; if this is ever
    // split into multiple scripts, the axis needs a redesign, so guard here.
    expect(rootPkg.scripts, 'root package.json missing scripts').toBeDefined();
    expect(release, 'scripts.release missing or empty').toBeTruthy();
  });

  it('discovers publishable @kiwa-lab/* packages from packages/*/package.json', () => {
    // The full package set has to be visible — otherwise the per-package
    // assertion below silently drops packages and stops catching drift.
    // The lower bound is deliberately conservative so a new package landing
    // does not fail this line; the per-package assertion is where the real
    // fail-fast happens.
    //
    // 26 since #1865 dropped `fresh` and `solidjs`, on top of #1803 dropping
    // `visual` and `solidstart` and moving `kaname` to `archive/`. The floor
    // tracks the real count, or shrinking the set on purpose reads as the guard
    // breaking.
    expect(publishable.length).toBeGreaterThanOrEqual(26);
  });

  it.each(assertable.map((name) => ({ name })))(
    '$name appears in both the build filter (`-F`) and the publish filter (`--filter`)',
    ({ name }) => {
      // Both halves must appear — the v1.14 payment miss + v1.25 perf-harness fix
      // + v1.27 quality-metrics fix + v1.28 realtime fix showed that missing
      // *either* half breaks the release rollout silently.
      expect(
        buildFilters.has(name),
        `release script missing build filter for ${name} (expected \`-F ${name}\` in scripts.release)`,
      ).toBe(true);
      expect(
        publishFilters.has(name),
        `release script missing publish filter for ${name} (expected \`--filter ${name}\` in scripts.release)`,
      ).toBe(true);
    },
  );

  it('every allowlisted name is a real @kiwa-lab/* package (guard against stale entries)', () => {
    // If NON_PUBLISHED_ALLOWLIST drifts (typo, renamed package), the per-package
    // assertion silently skips it — surface that here so the allowlist cannot rot.
    const allNames = new Set(publishable);
    for (const name of NON_PUBLISHED_ALLOWLIST) {
      expect(
        allNames.has(name),
        `NON_PUBLISHED_ALLOWLIST entry ${name} does not match any packages/*/package.json (rename or remove)`,
      ).toBe(true);
    }
  });

  it('build filter and publish filter cover the same set (no half-only entries)', () => {
    // Any package that appears in only one half is a partial fix — surface it
    // before it hits npm. This catches the case where a follow-up PR adds `-F`
    // but forgets `--filter` (or vice versa).
    const onlyBuild = [...buildFilters].filter((n) => !publishFilters.has(n));
    const onlyPublish = [...publishFilters].filter((n) => !buildFilters.has(n));
    expect(
      onlyBuild,
      `packages in build filter but missing from publish filter: ${onlyBuild.join(', ')}`,
    ).toEqual([]);
    expect(
      onlyPublish,
      `packages in publish filter but missing from build filter: ${onlyPublish.join(', ')}`,
    ).toEqual([]);
  });
});
