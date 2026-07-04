// Behavior test for v1.19-6 publish PR (Issue #812). Asserts that the publish
// artefacts land in the exact shape the previous v1.16 / v1.17 / v1.18 publish
// PRs established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row, wrong package.json version)
// fails the release gate loudly.
//
// The 6 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
// v1.19 differs from v1.18 in that the primary publish surface is 3 npm
// packages (`@kiwa-test/solidjs` + `@kiwa-test/fresh` + `@kiwa-test/hono`
// v0.1.0 → npm) rather than a Rust crate, so the last axis reads each
// package.json + tests directory instead of a Cargo.toml file.
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

describe('v1.19-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.19.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.19.0');
    // The description v-marker was `v1.18` before this PR; the publish PR must
    // update it to `v1.19` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.19)')).toBe(true);
  });

  it('plugin.json keywords include the v1.19 Framework 深化 markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The 3 new packages each need discoverable keywords so plugin search
    // (e.g. `claude plugins search solidjs`) surfaces kiwa. `framework-testing`
    // is the catch-all + framework-specific keywords per new package.
    for (const kw of [
      'solidjs',
      'signal-reactivity',
      'createsignal',
      'createeffect',
      'createresource',
      'suspense-boundary',
      'fresh',
      'deno-fresh',
      'islands-architecture',
      'partial-hydration',
      'hono',
      'honojs',
      'cloudflare-workers',
      'workers',
      'rpc-type-safe',
      'hc-client',
      'middleware-chain',
      'edge-runtime',
      'framework-testing',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.19 row referencing the 6 sub-Issues #807-#812', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.19** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.19\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [807, 808, 809, 810, 811, 812]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.19/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 publish PRs all landed
    // the same 4-file set (gh-discussions + x-thread-en + x-thread-ja + zenn-article).
    // Missing any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.19/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.19 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.18 forgot to rename.
      expect(readText(rel)).toContain('v1.19');
    }
  });

  it('VitePress config.mts wires the Framework 深化 sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Framework 深化 (v1.19)');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/28-solidjs-signal-app',
      '/tutorials/29-fresh-islands',
      '/tutorials/30-hono-workers-rpc',
      '/concepts/modern-web-framework-testing',
      '/migrations/v1.18-to-v1.19',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('3 new package.json files bumped to v0.1.0 with matching name + testable src surface', () => {
    // The v1.19 primary publish surface is 3 npm packages (not a Rust crate
    // like v1.18). Each package.json is the SSOT for `pnpm changeset publish`;
    // version drift here = wrong npm version on the registry.
    const pkgs = [
      { name: '@kiwa-test/solidjs', dir: 'packages/solidjs' },
      { name: '@kiwa-test/fresh', dir: 'packages/fresh' },
      { name: '@kiwa-test/hono', dir: 'packages/hono' },
    ];
    for (const { name, dir } of pkgs) {
      const pkg = readJson<{ name: string; version: string }>(`${dir}/package.json`);
      expect(pkg.name, `wrong package name for ${dir}`).toBe(name);
      expect(pkg.version, `wrong version for ${name}`).toBe('0.1.0');
      // Each package must ship a src/ + tests/ pair so the mock harness has
      // a compile-safe entry point (avoids empty-scaffold publish accidents).
      expect(existsSync(resolve(REPO_ROOT, `${dir}/src`)), `missing src for ${name}`).toBe(true);
      expect(existsSync(resolve(REPO_ROOT, `${dir}/tests`)), `missing tests for ${name}`).toBe(true);
    }
  });
});
