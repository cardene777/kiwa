// Behavior test for v1.25-6 publish PR (Issue #932). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 publish PRs established, so accidental drift
// (wrong plugin.json version, missing announcement file, forgotten Roadmap ✅
// row, wrong package.json version, missed release script filter entry) fails
// the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the mock harness
// behaviour + per-package perf sweep behaviour is covered by each package's
// own suite. v1.25 mirrors the v1.21 / v1.22 / v1.23 / v1.24 shape (single
// primary publish surface — this time `@kiwa-test/perf-harness` v0.2.0 minor
// bump), so the axes read the existing `packages/perf-harness/package.json`
// invariants plus the v1.14 payment-omission-avoidance release script filter
// invariant.
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

describe('v1.25-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.25.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.25.0');
    // The description v-marker was `v1.24` before this PR; the publish PR must
    // update it to `v1.25` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.25)')).toBe(true);
  });

  it('plugin.json keywords include the v1.25 perf-harness markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.25 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search perf-harness`) surfaces kiwa. Catch-all +
    // metric + methodology + coverage-specific keywords.
    for (const kw of [
      'perf',
      'perf-harness',
      'perf-testing',
      'performance-testing',
      'benchmark',
      'benchmarking',
      'p50',
      'p95',
      'p99',
      'latency',
      'latency-percentile',
      'regression-detection',
      'welch-t-test',
      'baseline-persistence',
      'baseline-json',
      'perf-baseline',
      'perf-regression',
      '3-layer-harness',
      'serial-perf',
      'concurrent-perf',
      'memory-perf',
      'heap-sampling',
      '33-package-coverage',
      'perf-sweep',
      'release-gate-perf',
      'p95-baseline',
      'iteration-warmup',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.25 row referencing the 6 sub-Issues #927-#932', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.25** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.25\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [927, 928, 929, 930, 931, 932]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.25/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 / v1.21 /
    // v1.22 / v1.23 / v1.24 publish PRs all landed the same 4-file set
    // (gh-discussions + x-thread-en + x-thread-ja + zenn-article). Missing any
    // of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.25/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.25 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.24 forgot to rename.
      expect(readText(rel)).toContain('v1.25');
    }
  });

  it('VitePress config.mts wires the Perf-harness sweep (v1.25) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Perf-harness sweep (v1.25)');
    // The 2 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/45-perf-harness-baseline',
      '/tutorials/46-perf-baseline-migration',
      '/concepts/perf-testing-ssot',
      '/migrations/v1.24-to-v1.25',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('perf-harness package.json minor-bumped to v0.2.0 with matching name + testable src surface', () => {
    // The v1.25 primary publish surface is a single npm minor bump (same as
    // v1.21 / v1.22 / v1.23 / v1.24 — an existing package extension, not a
    // brand-new package like v1.20). `pnpm changeset publish` reads this file
    // as the SSOT; version drift here = wrong npm version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/perf-harness/package.json');
    expect(pkg.name).toBe('@kiwa-test/perf-harness');
    expect(pkg.version).toBe('0.2.0');
    // The package must ship a src/ + tests/ pair so the v1.25 33 package
    // rollout has a compile-safe entry point (avoids empty-scaffold publish
    // accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/perf-harness/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/perf-harness/tests')), 'missing tests/').toBe(true);
    // The 3-layer perf harness core files must exist. Each file is a primary
    // API path that all 33 downstream package suites depend on — if any is
    // missing, the entire 33 package sweep breaks.
    for (const filename of [
      'measure',
      'baseline',
      'regression',
      'gate',
      'report',
      'three-layer',
      'concurrent',
      'memory',
    ]) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/perf-harness/src/${filename}.ts`)),
        `missing v1.25 primary API path: packages/perf-harness/src/${filename}.ts`,
      ).toBe(true);
    }
  });

  it('release script filter includes @kiwa-test/perf-harness (v1.14 payment omission avoidance)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 must land the perf-harness entry in the same PR that
    // publishes v0.2.0 to avoid the same re-discovery cost cycle.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/perf-harness` (build step) and the
    // `--filter @kiwa-test/perf-harness` (publish step) must be present; either
    // half alone is a partial fix that surfaces as a missing npm publish.
    expect(release, 'release script missing build filter for @kiwa-test/perf-harness').toContain(
      '-F @kiwa-test/perf-harness',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/perf-harness').toContain(
      '--filter @kiwa-test/perf-harness',
    );
  });
});
