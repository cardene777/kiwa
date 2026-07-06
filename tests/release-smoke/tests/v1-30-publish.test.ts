// Behavior test for v1.30-6 publish PR (Issue #997). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 publish
// PRs established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row, wrong package.json version,
// dropped release script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the a11y sweep
// behaviour (axe-core + 3-layer harness + 4-tier threshold + 13th axis
// integration) is covered by `@kiwa-test/a11y` v1.1's own suite and
// `@kiwa-test/quality-metrics` v0.4's own suite. v1.30 follows the v1.13+
// shape (single primary publish surface = existing package minor bump) —
// v1.30 lands `@kiwa-test/a11y` v1.0.1 → v1.1.0 as the primary publish surface
// alongside a `@kiwa-test/quality-metrics` v0.4 tier-aware 13-axis gate.
// The axes read the fresh `packages/a11y/package.json` invariant plus the
// v1.14 payment-omission-avoidance release script filter invariant (which is
// already asserted per-package by `release-script-filter.test.ts` since
// v1.29-1, but v1.30-6 still verifies the primary publish package is present
// in both halves as a per-milestone shape guard).
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

describe('v1.30-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.30.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.30.0');
    // The description v-marker was `v1.29` before this PR; the publish PR must
    // update it to `v1.30` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.30)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.30 a11y sweep markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.30 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search a11y-sweep` /
    // `claude plugins search wcag-2.1-aa-gate`) surfaces kiwa.
    for (const kw of [
      'a11y-sweep',
      'a11y-violation-axis',
      'a11y-baseline',
      'a11y-baseline-persistence',
      'wcag-2.1-aa-gate',
      'wcag-2.1-aa-ssot',
      '3-layer-a11y-harness',
      'jsdom-a11y',
      'playwright-a11y',
      'ssr-hydration-a11y',
      '4-tier-a11y-threshold',
      '34-package-a11y-coverage',
      '13-axis-release-gate',
      'a11y-testing-ssot',
      'quality-gate-maximum-grid',
      'horizontal-sweep-triple-pair',
      'perf-mutation-a11y-triple-pair',
      'snippet-validation-8-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.30 row referencing the 6 sub-Issues #992-#997', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.30** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.30\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [992, 993, 994, 995, 996, 997]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.30/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29
    // publish PRs all landed the same 4-file set (gh-discussions + x-thread-en
    // + x-thread-ja + zenn-article). Missing any of these means the release
    // lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.30/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.30 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.29 forgot to rename.
      expect(readText(rel)).toContain('v1.30');
    }
  });

  it('VitePress config.mts wires the a11y sweep (v1.30) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.30');
    // The 2 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/56-a11y-baseline',
      '/tutorials/57-a11y-baseline-migration',
      '/concepts/a11y-testing-ssot',
      '/migrations/v1.29-to-v1.30',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/a11y package.json is v1.1.0 with matching name (v1.30 primary publish surface, existing package minor bump)', () => {
    // The v1.30 primary publish surface is the existing `@kiwa-test/a11y`
    // package bumped v1.0.1 → v1.1.0. `pnpm changeset publish` reads this
    // file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const pkg = readJson<{ name: string; version: string }>('packages/a11y/package.json');
    expect(pkg.name).toBe('@kiwa-test/a11y');
    expect(pkg.version).toBe('1.1.0');
    // The package must ship a src/ + tests/ pair so the v1.30 3-layer harness
    // has a compile-safe entry point (avoids empty-scaffold publish
    // accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/a11y/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/a11y/tests')), 'missing tests/').toBe(true);
  });

  it('release script filter contains @kiwa-test/a11y in both -F build and --filter publish halves (v1.14 payment omission avoidance, 5th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 landed the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package (Issue #988).
    // v1.30 verifies the existing `@kiwa-test/a11y` package remains in both
    // halves — the pattern SSOT is now fully backed by v1.29-1's fail-fast
    // release-script-filter.test.ts axis, but v1.30-6 still verifies the
    // primary publish surface is present in both halves as a per-milestone
    // shape guard.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/a11y` (build step) and the
    // `--filter @kiwa-test/a11y` (publish step) must be present; either half
    // alone is a partial fix that surfaces as a missing npm publish.
    expect(
      release,
      'release script missing build filter for @kiwa-test/a11y',
    ).toContain('-F @kiwa-test/a11y');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/a11y',
    ).toContain('--filter @kiwa-test/a11y');
  });
});
