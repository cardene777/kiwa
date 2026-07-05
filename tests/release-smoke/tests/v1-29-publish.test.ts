// Behavior test for v1.29-3 publish PR (Issue #988). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 publish PRs
// established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row, wrong package.json version,
// dropped release script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the mock harness
// behaviour + per-package release invariant behaviour is covered by
// `@kiwa-test/release-invariants` v0.1's own suite (8 test). v1.29 diverges
// from the v1.13+ shape (single primary publish surface = existing package
// minor bump) — v1.29 lands a brand-new package `@kiwa-test/release-invariants`
// v0.1.0 as the primary publish surface. The axes read the fresh
// `packages/release-invariants/package.json` invariants plus the v1.14
// payment-omission-avoidance release script filter invariant. The v1.14
// lesson: an npm package must appear in **both** the `pnpm -F {name} build`
// step **and** the `pnpm publish --filter {name}` step of `scripts.release`,
// or one half silently skips it. v1.29 continues the pattern — the exact miss
// v1.14 payment / v1.25 perf-harness / v1.27 quality-metrics / v1.28 realtime
// each hit is now caught structurally by `tests/release-smoke/tests/release-script-filter.test.ts`
// (v1.29-1 fail-fast axis), but v1.29-3 still verifies the new
// `@kiwa-test/release-invariants` package is present in both halves (5th
// application of the same systematic root cause pattern SSOT).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function readText(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

describe('v1.29-3 publish artefacts', () => {
  it('plugin.json version bumped to 1.29.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.29.0');
    // The description v-marker was `v1.28` before this PR; the publish PR must
    // update it to `v1.29` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.29)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.29 release-invariants markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.29 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search release-invariants` /
    // `claude plugins search release-script-filter`) surfaces kiwa.
    for (const kw of [
      'release-invariants',
      'release-script-filter',
      'release-script-filter-symmetry',
      'provenance-flag-absence',
      'gate-script-package-coverage',
      'systematic-root-cause-pattern',
      'publish-filter',
      'build-filter',
      'release-invariants-ssot',
      'release-gate-invariants',
      '3-invariant-summary',
      'snippet-validation-7-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.29 row referencing the 3 sub-Issues #986/#987/#988', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.29** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.29\*\*\s*\|/);
    // Every one of the 3 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [986, 987, 988]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 3/3 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**3/3 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.29/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 publish
    // PRs all landed the same 4-file set (gh-discussions + x-thread-en +
    // x-thread-ja + zenn-article). Missing any of these means the release
    // lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.29/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.29 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.28 forgot to rename.
      expect(readText(rel)).toContain('v1.29');
    }
  });

  it('VitePress config.mts wires the release-invariants (v1.29) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.29');
    // The 1 tutorial link + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/55-release-script-filter-ssot',
      '/concepts/release-invariants',
      '/migrations/v1.28-to-v1.29',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('release-invariants package.json is v0.1.0 with matching name + 3 invariant + 1 aggregator exports on the src surface', () => {
    // The v1.29 primary publish surface is a **brand-new package** —
    // `@kiwa-test/release-invariants` v0.1.0. `pnpm changeset publish` reads
    // this file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const pkg = readJson<{ name: string; version: string }>(
      'packages/release-invariants/package.json',
    );
    expect(pkg.name).toBe('@kiwa-test/release-invariants');
    expect(pkg.version).toBe('0.1.0');
    // The package must ship a src/ + tests/ pair so the v1.29 3-invariant SSOT
    // has a compile-safe entry point (avoids empty-scaffold publish
    // accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/release-invariants/src')), 'missing src/').toBe(
      true,
    );
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/release-invariants/tests')),
      'missing tests/',
    ).toBe(true);
    // The 3 invariant checkers + 1 aggregator must be exported from
    // `src/index.ts`. Any missing export breaks the downstream release-smoke
    // suites that depend on them.
    const index = readText('packages/release-invariants/src/index.ts');
    for (const primitive of [
      'checkReleaseScriptFilter',
      'checkProvenanceFlagAbsence',
      'checkGateScriptPackageCoverage',
      'buildReleaseInvariantsSummary',
    ]) {
      expect(index, `missing v0.1 primitive in index.ts: ${primitive}`).toContain(primitive);
    }
  });

  it('release script filter now includes @kiwa-test/release-invariants (v1.14 payment + v1.25 perf-harness + v1.27 quality-metrics + v1.28 realtime omission avoidance, 5th application, systematic root cause pattern SSOT now backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 lands the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package — a 5th
    // application of the same systematic root cause pattern. v1.29-1's
    // `tests/release-smoke/tests/release-script-filter.test.ts` now catches
    // this fail-fast for future milestones, but v1.29-3 still verifies the
    // new package is present in both halves as a per-milestone shape guard.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/release-invariants` (build step) and the
    // `--filter @kiwa-test/release-invariants` (publish step) must be
    // present; either half alone is a partial fix that surfaces as a missing
    // npm publish.
    expect(
      release,
      'release script missing build filter for @kiwa-test/release-invariants',
    ).toContain('-F @kiwa-test/release-invariants');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/release-invariants',
    ).toContain('--filter @kiwa-test/release-invariants');
  });
});
