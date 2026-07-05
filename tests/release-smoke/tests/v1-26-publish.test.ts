// Behavior test for v1.26-6 publish PR (Issue #945). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 publish PRs established, so accidental
// drift (wrong plugin.json version, missing announcement file, forgotten
// Roadmap ✅ row, wrong package.json version, dropped release script filter
// entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the mock harness
// behaviour + per-package advanced db semantics behaviour is covered by each
// package's own suite. v1.26 mirrors the v1.21 / v1.22 / v1.23 / v1.24 / v1.25
// shape (single primary publish surface — this time `@kiwa-test/orm` v0.9.0
// minor bump), so the axes read the existing `packages/orm/package.json`
// invariants plus the v1.14 payment-omission-avoidance release script filter
// invariant. The v1.14 lesson: an npm package must appear in **both** the
// `pnpm -F {name} build` step **and** the `pnpm publish --filter {name}` step
// of `scripts.release`, or one half silently skips it. `@kiwa-test/orm` has
// been in the filter since v1.14 (it was v0.8 back then); v1.26 asserts the
// filter still holds for the v0.9 bump.
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

describe('v1.26-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.26.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.26.0');
    // The description v-marker was `v1.25` before this PR; the publish PR must
    // update it to `v1.26` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.26)')).toBe(true);
  });

  it('plugin.json keywords include the v1.26 database depth markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.26 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search pgvector` / `claude plugins search rls`)
    // surfaces kiwa. Catch-all + axis + concept + technology-specific keywords.
    for (const kw of [
      'db-advanced-testing',
      'advanced-db-semantics',
      '8-axis-db',
      'replication',
      'streaming-replication',
      'read-replica',
      'failover',
      'cdc',
      'logical-decoding',
      'wal2json',
      'debezium',
      'outbox-pattern',
      'logical-replication',
      'publication-subscription',
      'conflict-resolution',
      'mvcc',
      'snapshot-isolation',
      'serializable',
      'phantom-read',
      'deadlock',
      'row-level-security',
      'rls',
      'tenant-isolation',
      'bypass-rls',
      'audit-log',
      'connection-pool',
      'idle-timeout',
      'statement-timeout',
      'partitioning',
      'partition-pruning',
      'partition-wise-join',
      'vector-store',
      'pgvector',
      'ivfflat',
      'hnsw',
      'hybrid-search',
      'bm25',
      'embedding-cache',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.26 row referencing the 6 sub-Issues #940-#945', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.26** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.26\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [940, 941, 942, 943, 944, 945]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.26/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 / v1.21 /
    // v1.22 / v1.23 / v1.24 / v1.25 publish PRs all landed the same 4-file set
    // (gh-discussions + x-thread-en + x-thread-ja + zenn-article). Missing any
    // of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.26/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.26 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.25 forgot to rename.
      expect(readText(rel)).toContain('v1.26');
    }
  });

  it('VitePress config.mts wires the Database 深化 (v1.26) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Database 深化 (v1.26)');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/47-postgres-cdc-outbox',
      '/tutorials/48-mysql-rls-tenant',
      '/tutorials/49-vector-search-pgvector',
      '/concepts/db-advanced-testing',
      '/migrations/v1.25-to-v1.26',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('orm package.json minor-bumped to v0.9.0 with matching name + 8-axis semantics src surface', () => {
    // The v1.26 primary publish surface is a single npm minor bump (same as
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 — an existing package extension,
    // not a brand-new package like v1.20). `pnpm changeset publish` reads this
    // file as the SSOT; version drift here = wrong npm version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/orm/package.json');
    expect(pkg.name).toBe('@kiwa-test/orm');
    expect(pkg.version).toBe('0.9.0');
    // The package must ship a src/ + tests/ pair so the v1.26 8-axis rollout
    // has a compile-safe entry point (avoids empty-scaffold publish
    // accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/orm/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/orm/tests')), 'missing tests/').toBe(true);
    // The 8 axis semantics files must exist. Each file is a primary API path
    // that all 3 dogfood apps (postgres-cdc-outbox / mysql-rls-tenant /
    // vector-search) depend on — if any is missing, the entire dogfood suite
    // breaks.
    for (const axis of [
      'replication',
      'cdc',
      'logical-replication',
      'mvcc',
      'rls',
      'connection-pool',
      'partitioning',
      'vector-store',
    ]) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/orm/src/semantics/${axis}.ts`)),
        `missing v1.26 primary API path: packages/orm/src/semantics/${axis}.ts`,
      ).toBe(true);
    }
  });

  it('release script filter still includes @kiwa-test/orm (v1.14 payment omission avoidance)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. `@kiwa-test/orm` has been in the filter since v1.14 land
    // — v1.26 asserts the filter still holds so a mid-milestone editing
    // accident cannot silently drop the v0.9 npm bump.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/orm` (build step) and the
    // `--filter @kiwa-test/orm` (publish step) must be present; either
    // half alone is a partial fix that surfaces as a missing npm publish.
    expect(release, 'release script missing build filter for @kiwa-test/orm').toContain(
      '-F @kiwa-test/orm',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/orm').toContain(
      '--filter @kiwa-test/orm',
    );
  });
});
