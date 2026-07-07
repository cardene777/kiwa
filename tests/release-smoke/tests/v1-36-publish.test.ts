// Behavior test for v1.36-6 publish PR (Issue #1080). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 / v1.35 publish PRs established, so accidental drift
// (wrong plugin.json version, missing announcement file, forgotten Roadmap ✅
// row, wrong package.json version, dropped release script filter entry) fails
// the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the search
// deepening II behaviour (Vector search + Semantic search + Faceted advanced +
// Geo search + Relevance tuning + Synonym/stemming advanced + Index management
// advanced + Query DSL/aggregation advanced) is covered by `@kiwa-test/search`
// v0.3 own suite (advanced 8 axis semantics already landed in v1.36-1).
// v1.36 keeps the v1.13+ "single primary publish surface" shape — it lands a
// single publish surface (`@kiwa-test/search` v0.2.0 → v0.3.0) because the
// search deepening spans a single adapter package. The axes verify search holds
// the expected version bump + remains in the release script filter halves
// (v1.14 payment-omission-avoidance pattern SSOT applied per-package, 11th
// application).
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

describe('v1.36-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.36.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.36.0');
    // The description v-marker was `v1.35` before this PR; the publish PR must
    // update it to `v1.36` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.36)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.36 search deepening II markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.36 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search search-real-driver` /
    // `claude plugins search vector-search` /
    // `claude plugins search opensearch-oss`) surfaces kiwa.
    for (const kw of [
      'search-deepening-ii',
      'search-real-driver',
      'search-v0-3',
      'vertical-pair-eighth',
      'three-stage-deepening-third',
      'vector-search',
      'vector-knn',
      'hnsw',
      'hybrid-fusion',
      'reciprocal-rank-fusion',
      'rrf',
      'weighted-fusion',
      'recall-at-k',
      'semantic-search',
      'cross-encoder',
      'query-understanding',
      'faceted-advanced',
      'nested-facet',
      'hierarchical-facet',
      'geo-search',
      'geo-bounding-box',
      'geo-radius',
      'geo-polygon',
      'geo-isochrone',
      'relevance-tuning',
      'bm25-relevance',
      'tf-idf',
      'custom-ranking',
      'synonym-advanced',
      'index-management-advanced',
      'query-dsl-advanced',
      'aggregation-advanced',
      'search-8-axis-advanced',
      'search-32-cell-fidelity-grid',
      'search-real-driver-testing-ssot',
      'meilisearch-v1',
      'typesense-v27',
      'algolia-instantsearch',
      'opensearch-oss',
      'dogfood-search-vector-app',
      'dogfood-search-faceted-geo-app',
      'dogfood-search-opensearch-app',
      'snippet-validation-14-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.36 row referencing the 6 sub-Issues #1075/#1081/#1082/#1083/#1084/#1080', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.36** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.36\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1075, 1081, 1082, 1083, 1084, 1080]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.36/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 publish PRs all landed
    // the same 4-file set (gh-discussions + x-thread-en + x-thread-ja +
    // zenn-article). Missing any of these means the release lost its
    // distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.36/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.36 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.35 forgot to rename.
      expect(readText(rel)).toContain('v1.36');
    }
  });

  it('VitePress config.mts wires the search deepening II (v1.36) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.36');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/73-vector-search-hybrid',
      '/tutorials/74-faceted-geo-search',
      '/tutorials/75-opensearch-relevance-tuning',
      '/concepts/search-real-driver-testing',
      '/migrations/v1.35-to-v1.36',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/search package.json is v0.3.0 (v1.36 single publish surface, existing package minor bump)', () => {
    // The v1.36 primary publish surface is a single package —
    // `@kiwa-test/search` v0.2.0 → v0.3.0. `pnpm changeset publish` reads this
    // file as the SSOT; version drift here = wrong npm version on the registry.
    const search = readJson<{ name: string; version: string }>('packages/search/package.json');
    expect(search.name).toBe('@kiwa-test/search');
    expect(search.version).toBe('0.3.0');
    // The search package must ship a src/ + tests/ pair so the v1.36 8
    // advanced axis harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/search/src')), 'missing search src/').toBe(
      true,
    );
    expect(existsSync(resolve(REPO_ROOT, 'packages/search/tests')), 'missing search tests/').toBe(
      true,
    );
  });

  it('release script filter contains @kiwa-test/search in both -F build and --filter publish halves (v1.14 payment omission avoidance, 11th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 landed the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package (Issue #988).
    // v1.30 verified the existing `@kiwa-test/a11y` package remains in both
    // halves. v1.31 verified the existing `@kiwa-test/streaming` package
    // remains in both halves. v1.32 verified the existing `@kiwa-test/orm`
    // package remains in both halves. v1.33 verified the existing
    // `@kiwa-test/payment` package remains in both halves. v1.34 verified
    // both `@kiwa-test/component` + `@kiwa-test/nextjs` remain in both
    // halves. v1.35 verified the existing `@kiwa-test/observability` package
    // remains in both halves. v1.36 verifies the existing `@kiwa-test/search`
    // package remains in both halves — search has been in the filter since
    // v1.14 (part of the first-line adapter set), the per-milestone shape guard
    // just re-asserts. This is the 11th application of the systematic root
    // cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/search` (build step) and the
    // `--filter @kiwa-test/search` (publish step) must be present.
    expect(release, 'release script missing build filter for @kiwa-test/search').toContain(
      '-F @kiwa-test/search',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/search').toContain(
      '--filter @kiwa-test/search',
    );
  });
});
