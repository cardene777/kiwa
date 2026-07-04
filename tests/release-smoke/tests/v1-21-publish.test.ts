// Behavior test for v1.21-6 publish PR (Issue #847). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20
// publish PRs established, so accidental drift (wrong plugin.json version,
// missing announcement file, forgotten Roadmap ✅ row, wrong package.json
// version) fails the release gate loudly.
//
// The 6 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
// v1.21 mirrors the v1.20 shape (single primary publish surface — this time
// `@kiwa-test/auth` v0.4.0 minor bump instead of a new package), so the last
// axis reads the existing `packages/auth/package.json` + tests directory
// invariants rather than a brand-new-package shape.
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

describe('v1.21-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.21.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.21.0');
    // The description v-marker was `v1.20` before this PR; the publish PR must
    // update it to `v1.21` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.21)')).toBe(true);
  });

  it('plugin.json keywords include the v1.21 Auth 深化 markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The 4 protocol adapters need discoverable keywords so plugin search
    // (e.g. `claude plugins search webauthn`) surfaces kiwa. `auth-protocol-testing`
    // is the catch-all + protocol-specific + testing-hard-part-specific keywords.
    for (const kw of [
      'webauthn',
      'webauthn-l3',
      'virtual-authenticator',
      'credential-creation',
      'credential-assertion',
      'attestation',
      'user-verification',
      'resident-key',
      'authenticator-attachment',
      'passkey',
      'platform-authenticator',
      'roaming-authenticator',
      'sync-fabric',
      'oauth21',
      'oauth-2.1',
      'rfc-9700',
      'pkce',
      'pkce-s256',
      'code-verifier',
      'code-challenge',
      'dpop',
      'rfc-9449',
      'sender-constrained',
      'refresh-rotation',
      'reuse-detection',
      'revocation',
      'rfc-7009',
      'oidc',
      'openid-connect',
      'discovery',
      'well-known',
      'jwks',
      'jwks-rotation',
      'dynamic-client-registration',
      'rfc-7591',
      'id-token',
      'at-hash',
      'c-hash',
      'openid-federation',
      'trust-chain',
      'software-statement',
      'auth-protocol-testing',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.21 row referencing the 6 sub-Issues #842-#847', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.21** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.21\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [842, 843, 844, 845, 846, 847]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.21/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 publish
    // PRs all landed the same 4-file set (gh-discussions + x-thread-en + x-thread-ja
    // + zenn-article). Missing any of these means the release lost its
    // distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.21/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.21 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.20 forgot to rename.
      expect(readText(rel)).toContain('v1.21');
    }
  });

  it('VitePress config.mts wires the Auth 深化 sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Auth 深化 (v1.21)');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/34-webauthn-passkey',
      '/tutorials/35-oauth21-provider',
      '/tutorials/36-oidc-federation',
      '/concepts/auth-protocol-testing',
      '/migrations/v1.20-to-v1.21',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('auth package.json minor-bumped to v0.4.0 with matching name + testable src surface', () => {
    // The v1.21 primary publish surface is a single npm minor bump (not a
    // brand-new package like v1.20). `pnpm changeset publish` reads this file
    // as the SSOT; version drift here = wrong npm version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/auth/package.json');
    expect(pkg.name).toBe('@kiwa-test/auth');
    expect(pkg.version).toBe('0.4.0');
    // The package must ship a src/ + tests/ pair so the 4 new protocol adapters
    // have a compile-safe entry point (avoids empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/tests')), 'missing tests/').toBe(true);
    // The 4 new v1.21 protocol adapter subdirs must exist so the minor bump
    // matches the docs claim (`v1.21-1` sub-issues added `webauthn/`, `passkey/`,
    // `oauth21/`, `oidc/`).
    for (const dir of ['webauthn', 'passkey', 'oauth21', 'oidc']) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/auth/src/${dir}`)),
        `missing v1.21 protocol adapter: packages/auth/src/${dir}`,
      ).toBe(true);
    }
  });
});
