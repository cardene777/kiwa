// Behavior test for v1.27-6 publish PR (Issue #961). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 publish PRs established, so
// accidental drift (wrong plugin.json version, missing announcement file,
// forgotten Roadmap ✅ row, wrong package.json version, dropped release script
// filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the mock harness
// behaviour + per-package mutation testing tier-aware gate behaviour is covered
// by each package's own suite. v1.27 mirrors the v1.21 / v1.22 / v1.23 / v1.24
// / v1.25 / v1.26 shape (single primary publish surface — this time
// `@kiwa-test/quality-metrics` v0.3.0 minor bump), so the axes read the
// existing `packages/quality-metrics/package.json` invariants plus the v1.14
// payment-omission-avoidance release script filter invariant. The v1.14
// lesson: an npm package must appear in **both** the `pnpm -F {name} build`
// step **and** the `pnpm publish --filter {name}` step of `scripts.release`,
// or one half silently skips it. v1.27 fixes the exact miss the Issue #961
// body called out — `@kiwa-test/quality-metrics` was **not** in the filter
// before this PR (v1.14 payment miss + v1.25 perf-harness fix pattern, 3rd
// application of the same lesson).
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

describe('v1.27-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.27.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.27.0');
    // The description v-marker was `v1.26` before this PR; the publish PR must
    // update it to `v1.27` so `claude plugins list` surfaces the right milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.27)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.27 mutation testing sweep markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.27 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search stryker` / `claude plugins search mutation-tier`)
    // surfaces kiwa. Catch-all + axis + concept + technology-specific keywords.
    for (const kw of [
      'mutation-testing-sweep',
      'mutation-tier',
      'mutation-kill-rate',
      'kill-rate',
      'stryker',
      'stryker-mutator',
      'stryker-vitest',
      'mutation-baseline',
      'mutation-baseline-persistence',
      '12-axis-release-gate',
      'release-gate-mutation',
      'tier-aware',
      'tier-threshold',
      'core-tier',
      'framework-tier',
      'saas-tier',
      'test-type-tier',
      'kill-rate-baseline',
      'mutation-regression-detection',
      'mutation-testing-ssot',
      'mutation-thresholds',
      'resolveMutationTier',
      'assertMutationTier',
      'DEFAULT_MUTATION_TIER_THRESHOLDS',
      '33-package-mutation-coverage',
      '22-to-33-package-sweep',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.27 row referencing the 6 sub-Issues #957/#959/#961/#963/#966/#968', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.27** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.27\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [957, 959, 961, 963, 966, 968]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.27/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 / v1.21 /
    // v1.22 / v1.23 / v1.24 / v1.25 / v1.26 publish PRs all landed the same
    // 4-file set (gh-discussions + x-thread-en + x-thread-ja + zenn-article).
    // Missing any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.27/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.27 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.26 forgot to rename.
      expect(readText(rel)).toContain('v1.27');
    }
  });

  it('VitePress config.mts wires the Mutation testing sweep (v1.27) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Mutation testing sweep (v1.27)');
    // The 2 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/50-mutation-testing-baseline',
      '/tutorials/51-mutation-baseline-migration',
      '/concepts/mutation-testing-ssot',
      '/migrations/v1.26-to-v1.27',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('quality-metrics package.json minor-bumped to v0.3.0 with matching name + 5 new v0.3 primitives on the src surface', () => {
    // The v1.27 primary publish surface is a single npm minor bump (same as
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 — an existing package
    // extension, not a brand-new package like v1.20). `pnpm changeset publish`
    // reads this file as the SSOT; version drift here = wrong npm version on
    // the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/quality-metrics/package.json');
    expect(pkg.name).toBe('@kiwa-test/quality-metrics');
    expect(pkg.version).toBe('0.3.0');
    // The package must ship a src/ + tests/ pair so the v1.27 tier-aware
    // rollout has a compile-safe entry point (avoids empty-scaffold publish
    // accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/quality-metrics/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/quality-metrics/tests')), 'missing tests/').toBe(true);
    // The 5 new v0.3 primitives (DEFAULT_MUTATION_TIER_THRESHOLDS,
    // resolveMutationTier, assertMutationTier, MutationTier type,
    // ReleaseGateContext type) must be exported from `src/gate.ts` +
    // `src/index.ts`. Any missing export breaks the 33-package tier-aware
    // rollout that depends on them.
    const gate = readText('packages/quality-metrics/src/gate.ts');
    for (const primitive of [
      'DEFAULT_MUTATION_TIER_THRESHOLDS',
      'resolveMutationTier',
      'assertMutationTier',
    ]) {
      expect(gate, `missing v0.3 primitive in gate.ts: ${primitive}`).toContain(primitive);
    }
    const index = readText('packages/quality-metrics/src/index.ts');
    for (const primitive of [
      'DEFAULT_MUTATION_TIER_THRESHOLDS',
      'resolveMutationTier',
      'assertMutationTier',
      'MutationTier',
    ]) {
      expect(index, `missing v0.3 primitive in index.ts: ${primitive}`).toContain(primitive);
    }
  });

  it('release script filter now includes @kiwa-test/quality-metrics (v1.14 payment + v1.25 perf-harness omission avoidance, 3rd application)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixes the exact miss the Issue #961
    // body called out — `@kiwa-test/quality-metrics` was **not** in the filter
    // before this PR (a 3rd application of the same lesson: any npm package
    // reachable from the `test:mutation` rollout must appear in **both** the
    // build filter and the publish filter).
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/quality-metrics` (build step) and the
    // `--filter @kiwa-test/quality-metrics` (publish step) must be present;
    // either half alone is a partial fix that surfaces as a missing npm
    // publish.
    expect(
      release,
      'release script missing build filter for @kiwa-test/quality-metrics',
    ).toContain('-F @kiwa-test/quality-metrics');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/quality-metrics',
    ).toContain('--filter @kiwa-test/quality-metrics');
  });
});
