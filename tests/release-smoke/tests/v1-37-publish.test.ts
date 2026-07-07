// Behavior test for v1.37-6 publish PR (Issue #1093). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 publish PRs established, so accidental drift
// (wrong plugin.json version, missing announcement file, forgotten Roadmap ✅
// row, wrong package.json version, dropped release script filter entry) fails
// the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the security
// deepening behaviour (CSP + Rate limit + Authorization + WAF + Threat model +
// Secrets scanning + SBOM + Security headers advanced) is covered by
// `@kiwa-test/security` v0.1 own suite (advanced 8 axis semantics already
// landed in v1.37-1).
// v1.37 keeps the v1.13+ "single primary publish surface" shape — it lands a
// single publish surface (`@kiwa-test/security` v0.1.0, new package) because
// the security deepening spans a single adapter package. The axes verify
// security holds the expected version + remains in the release script filter
// halves (v1.14 payment-omission-avoidance pattern SSOT applied per-package,
// 12th application).
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

describe('v1.37-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.37.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.37.0');
    // The description v-marker was `v1.36` before this PR; the publish PR must
    // update it to `v1.37` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.37)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.37 security deepening markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.37 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search security-real-driver` /
    // `claude plugins search csp-strict-dynamic` /
    // `claude plugins search rbac-abac` /
    // `claude plugins search sbom-scanning`) surfaces kiwa.
    for (const kw of [
      'security-deepening',
      'security-real-driver',
      'security-v0-1',
      'vertical-pair-ninth',
      'csp-strict-dynamic',
      'csp-nonce',
      'csp-hash',
      'csp-trusted-types',
      'csp-report-only',
      'content-security-policy',
      'rate-limit',
      'token-bucket',
      'leaky-bucket',
      'sliding-window',
      'fixed-window',
      'authorization',
      'rbac',
      'abac',
      'casbin',
      'role-hierarchy',
      'policy-engine',
      'combining-algorithm',
      'waf',
      'coraza',
      'owasp-crs',
      'threat-model',
      'stride',
      'pasta',
      'dread',
      'attack-tree',
      'secrets-scanning',
      'trufflehog',
      'gitleaks',
      'entropy-gate',
      'sbom',
      'cyclonedx',
      'spdx',
      'osv',
      'nvd',
      'license-policy',
      'security-headers',
      'hsts',
      'permissions-policy',
      'helmet',
      'security-8-axis-advanced',
      'security-32-cell-fidelity-grid',
      'security-real-driver-testing-ssot',
      'dogfood-security-csp-headers-app',
      'dogfood-security-rbac-abac-app',
      'dogfood-security-sbom-scanning-app',
      'snippet-validation-15-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.37 row referencing the 6 sub-Issues #1087/#1089/#1090/#1091/#1092/#1093', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.37** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.37\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1087, 1089, 1090, 1091, 1092, 1093]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.37/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 publish PRs all
    // landed the same 4-file set (gh-discussions + x-thread-en + x-thread-ja +
    // zenn-article). Missing any of these means the release lost its
    // distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.37/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.37 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.36 forgot to rename.
      expect(readText(rel)).toContain('v1.37');
    }
  });

  it('VitePress config.mts wires the security deepening (v1.37) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.37');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/76-csp-strict-dynamic',
      '/tutorials/77-rbac-abac-policy',
      '/tutorials/78-sbom-license-scanning',
      '/concepts/security-real-driver-testing',
      '/migrations/v1.36-to-v1.37',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/security package.json is v0.1.0 (v1.37 single publish surface, new package)', () => {
    // The v1.37 primary publish surface is a single new package —
    // `@kiwa-test/security` v0.1.0. `pnpm changeset publish` reads this
    // file as the SSOT; version drift here = wrong npm version on the registry.
    const security = readJson<{ name: string; version: string }>(
      'packages/security/package.json',
    );
    expect(security.name).toBe('@kiwa-test/security');
    expect(security.version).toBe('0.1.0');
    // The security package must ship a src/ + tests/ pair so the v1.37 8
    // axis harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/security/src')), 'missing security src/').toBe(
      true,
    );
    expect(existsSync(resolve(REPO_ROOT, 'packages/security/tests')), 'missing security tests/').toBe(
      true,
    );
  });

  it('release script filter contains @kiwa-test/security in both -F build and --filter publish halves (v1.14 payment omission avoidance, 12th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 landed the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package (Issue #988).
    // v1.30-v1.36 verified existing packages remain in both halves. v1.37
    // is the second brand-new package addition since v1.29 — `@kiwa-test/security`
    // v0.1.0 must be in both halves. This is the 12th application of the systematic
    // root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/security` (build step) and the
    // `--filter @kiwa-test/security` (publish step) must be present.
    expect(release, 'release script missing build filter for @kiwa-test/security').toContain(
      '-F @kiwa-test/security',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/security').toContain(
      '--filter @kiwa-test/security',
    );
  });
});
