// Behavior test for v1.17-6 publish PR (Issue #783). Asserts that the publish
// artefacts land in the exact shape the previous v1.16 / v1.15 publish PRs
// established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row) fails the release gate loudly.
//
// The 4 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
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

describe('v1.17-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.17.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.17.0');
    // The description v-marker was `v1.16` before this PR; the publish PR must
    // update it to `v1.17` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.17)')).toBe(true);
  });

  it('plugin.json keywords include the v1.17 Observability v2 markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The 4 additional axes each need a discoverable keyword so plugin search
    // (e.g. `claude plugins search grafana`) surfaces kiwa.
    for (const kw of ['observability-v2', 'grafana', 'prometheus', 'alertmanager', 'flame-graph', 'jaeger', 'log-correlation']) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.17 row referencing the 6 sub-Issues #778-#783', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.17** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.17\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [778, 779, 780, 781, 782, 783]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.17/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 publish PRs all landed the same 4-file
    // set (gh-discussions + x-thread-en + x-thread-ja + zenn-article).
    // Missing any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.17/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.17 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.16 forgot to rename.
      expect(readText(rel)).toContain('v1.17');
    }
  });

  it('VitePress config.mts wires the Observability v2 sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Observability v2 (v1.17)');
    // The 3 tutorial links must be wired into the sidebar. Broken sidebar =
    // reader cannot navigate to the tutorials even if the pages exist.
    for (const link of [
      '/tutorials/22-observability-dashboard',
      '/tutorials/23-alert-orchestrator',
      '/tutorials/24-trace-flame-graph',
      '/concepts/observability-v2-testing',
      '/migrations/v1.16-to-v1.17',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/observability package staged for v2.0.0 major bump via changeset', () => {
    // The changeset holds the pending version bump instructions consumed by
    // `changeset version` at release time. Any drift here means npm publish
    // ships the wrong semver.
    const changeset = readText('.changeset/kiwa-observability-v2-0.md');
    expect(changeset).toContain("'@kiwa-test/observability': major");
    expect(changeset).toContain('v2.0');
    // Must cite the parent Issue for release-note traceability.
    expect(changeset).toContain('#777');
  });
});
