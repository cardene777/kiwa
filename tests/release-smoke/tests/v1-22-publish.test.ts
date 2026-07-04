// Behavior test for v1.22-6 publish PR (Issue #892). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 publish PRs established, so accidental drift (wrong plugin.json version,
// missing announcement file, forgotten Roadmap ✅ row, wrong package.json
// version) fails the release gate loudly.
//
// The 6 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
// v1.22 mirrors the v1.21 shape (single primary publish surface — this time
// `@kiwa-test/auth` v0.5.0 minor bump), so the last axis reads the existing
// `packages/auth/package.json` + tests directory invariants rather than a
// brand-new-package shape.
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

describe('v1.22-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.22.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.22.0');
    // The description v-marker was `v1.21` before this PR; the publish PR must
    // update it to `v1.22` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.22)')).toBe(true);
  });

  it('plugin.json keywords include the v1.22 real driver + caBLE + a11y markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.22 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search keycloak`) surfaces kiwa. The catch-all +
    // driver-specific + caBLE-specific + a11y-specific keywords.
    for (const kw of [
      'real-driver',
      'testcontainers',
      'keycloak',
      'oauth2-mock-server',
      'cable',
      'hybrid-transport',
      'ctap2-hybrid',
      'qr-handshake',
      'ble-advertisement',
      'websocket-tunnel',
      'credential-migration',
      'signature-roundtrip',
      'a11y-gate',
      'axe-core',
      'wcag-2.1-aa',
      'wai-aria',
      'nuxt3-rp',
      'federation-jwks-rotation-e2e',
      '3-execution-modes',
      'mock-only',
      'real-optional',
      'real-required',
      'fidelity-report',
      'real-driver-testing',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.22 row referencing the 6 sub-Issues #891-#896', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.22** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.22\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [891, 892, 893, 894, 895, 896]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.22/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 / v1.21
    // publish PRs all landed the same 4-file set (gh-discussions + x-thread-en +
    // x-thread-ja + zenn-article). Missing any of these means the release lost
    // its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.22/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.22 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.21 forgot to rename.
      expect(readText(rel)).toContain('v1.22');
    }
  });

  it('VitePress config.mts wires the Real driver (v1.22) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Real driver (v1.22)');
    // The 2 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/37-real-driver-testing',
      '/tutorials/38-passkey-cable-flow',
      '/concepts/real-driver-testing',
      '/migrations/v1.21-to-v1.22',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('auth package.json minor-bumped to v0.5.0 with matching name + testable src surface', () => {
    // The v1.22 primary publish surface is a single npm minor bump (same as
    // v1.21 — an existing package extension, not a brand-new package like
    // v1.20). `pnpm changeset publish` reads this file as the SSOT; version
    // drift here = wrong npm version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/auth/package.json');
    expect(pkg.name).toBe('@kiwa-test/auth');
    expect(pkg.version).toBe('0.5.0');
    // The package must ship a src/ + tests/ pair so the v1.22 real driver +
    // caBLE additions have a compile-safe entry point (avoids empty-scaffold
    // publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/tests')), 'missing tests/').toBe(true);
    // The v1.21 4 protocol adapter subdirs must still exist so the minor bump
    // does not break the earlier surface (`v1.21-1` sub-issues added
    // `webauthn/`, `passkey/`, `oauth21/`, `oidc/`; v1.22 only adds real driver
    // adapters + caBLE methods on top).
    for (const dir of ['webauthn', 'passkey', 'oauth21', 'oidc']) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/auth/src/${dir}`)),
        `missing v1.21 protocol adapter: packages/auth/src/${dir}`,
      ).toBe(true);
    }
  });
});
