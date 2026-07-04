// Behavior test for v1.20-6 publish PR (Issue #832). Asserts that the publish
// artefacts land in the exact shape the previous v1.16 / v1.17 / v1.18 / v1.19
// publish PRs established, so accidental drift (wrong plugin.json version,
// missing announcement file, forgotten Roadmap ✅ row, wrong package.json
// version) fails the release gate loudly.
//
// The 6 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
// v1.20 differs from v1.19 in that the primary publish surface is a single
// npm package (`@kiwa-test/streaming` v0.1.0 → npm) rather than 3 packages,
// so the last axis reads one package.json + tests directory instead of three.
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

describe('v1.20-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.20.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.20.0');
    // The description v-marker was `v1.19` before this PR; the publish PR must
    // update it to `v1.20` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.20)')).toBe(true);
  });

  it('plugin.json keywords include the v1.20 Streaming 深化 markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The new streaming package needs discoverable keywords so plugin search
    // (e.g. `claude plugins search kafka`) surfaces kiwa. `streaming-testing`
    // is the catch-all + provider-specific + semantics-specific keywords.
    for (const kw of [
      'streaming',
      'kafka',
      'kafkajs',
      'redpanda',
      'nats',
      'jetstream',
      'producer',
      'consumer',
      'consumer-group',
      'partition',
      'offset',
      'exactly-once',
      'idempotent',
      'transactional',
      'dlq',
      'dead-letter-queue',
      'retry',
      'schema-registry',
      'avro',
      'protobuf',
      'json-schema',
      'streaming-testing',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.20 row referencing the 6 sub-Issues #827-#832', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.20** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.20\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [827, 828, 829, 830, 831, 832]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.20/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 publish PRs
    // all landed the same 4-file set (gh-discussions + x-thread-en + x-thread-ja
    // + zenn-article). Missing any of these means the release lost its
    // distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.20/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.20 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.19 forgot to rename.
      expect(readText(rel)).toContain('v1.20');
    }
  });

  it('VitePress config.mts wires the Streaming 深化 sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Streaming 深化 (v1.20)');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/31-kafka-event-pipeline',
      '/tutorials/32-redpanda-schema-registry',
      '/tutorials/33-nats-jetstream',
      '/concepts/streaming-testing',
      '/migrations/v1.19-to-v1.20',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('streaming package.json bumped to v0.1.0 with matching name + testable src surface', () => {
    // The v1.20 primary publish surface is a single npm package (not 3 packages
    // like v1.19). `pnpm changeset publish` reads this file as the SSOT; version
    // drift here = wrong npm version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/streaming/package.json');
    expect(pkg.name).toBe('@kiwa-test/streaming');
    expect(pkg.version).toBe('0.1.0');
    // The package must ship a src/ + tests/ pair so the mock harness has a
    // compile-safe entry point (avoids empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/streaming/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/streaming/tests')), 'missing tests/').toBe(true);
  });
});
