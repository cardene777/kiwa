// Behavior test for v1.33-6 publish PR (Issue #1041). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 publish PRs established, so accidental drift (wrong plugin.json
// version, missing announcement file, forgotten Roadmap ✅ row, wrong
// package.json version, dropped release script filter entry) fails the
// release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the payment
// deepening II behaviour (orchestration + revenue recovery + refund advanced
// + dispute + webhook idempotency advanced + tax localization + subscription
// state machine + payment method vault + real driver) is covered by
// `@kiwa-test/payment` v0.4's own suite. v1.33 follows the v1.13+ shape
// (single primary publish surface = existing package minor bump) — v1.33
// lands `@kiwa-test/payment` v0.3.0 → v0.4.0 as the primary publish surface
// with 8 axis advanced billing II semantics + real driver env-gate.
// The axes read the fresh `packages/payment/package.json` invariant plus the
// v1.14 payment-omission-avoidance release script filter invariant (which is
// already asserted per-package by `release-script-filter.test.ts` since
// v1.29-1, but v1.33-6 still verifies the primary publish package is present
// in both halves as a per-milestone shape guard).
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

describe('v1.33-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.33.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.33.0');
    // The description v-marker was `v1.32` before this PR; the publish PR must
    // update it to `v1.33` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.33)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.33 payment deepening II markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.33 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search payment-real-driver` /
    // `claude plugins search stripe-marketplace-v2`) surfaces kiwa.
    for (const kw of [
      'payment-deepening-ii',
      'payment-real-driver',
      'vertical-pair-fifth',
      'payment-orchestration',
      'multi-provider-routing',
      'failover-cascade',
      'circuit-breaker-payment',
      'revenue-recovery',
      'dunning-cascade',
      'card-updater',
      'network-tokenization',
      'refund-advanced',
      'dispute-lifecycle',
      'chargeback-representment',
      'webhook-idempotency-advanced',
      'tax-localization-dac7',
      'subscription-state-machine',
      'coupon-stacking',
      'grace-period',
      'payment-method-vault',
      'cross-provider-vault',
      'payment-v0-4',
      'payment-8-axis-advanced',
      'payment-24-cell-fidelity-grid',
      'payment-real-driver-testing-ssot',
      'stripe-marketplace-v2',
      'paddle-billing-v2',
      'lemonsqueezy-license-app',
      'snippet-validation-11-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.33 row referencing the 6 sub-Issues #1035/#1037-#1041', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.33** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.33\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1035, 1037, 1038, 1039, 1040, 1041]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.33/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 publish PRs all landed the same 4-file set
    // (gh-discussions + x-thread-en + x-thread-ja + zenn-article). Missing
    // any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.33/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.33 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.32 forgot to rename.
      expect(readText(rel)).toContain('v1.33');
    }
  });

  it('VitePress config.mts wires the payment deepening II (v1.33) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.33');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/64-payment-orchestration',
      '/tutorials/65-stripe-connect-marketplace',
      '/tutorials/66-paddle-billing-v2',
      '/concepts/payment-real-driver-testing',
      '/migrations/v1.32-to-v1.33',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/payment package.json is v0.4.0 with matching name (v1.33 primary publish surface, existing package minor bump)', () => {
    // The v1.33 primary publish surface is the existing `@kiwa-test/payment`
    // package bumped v0.3.0 → v0.4.0. `pnpm changeset publish` reads this
    // file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const pkg = readJson<{ name: string; version: string }>('packages/payment/package.json');
    expect(pkg.name).toBe('@kiwa-test/payment');
    expect(pkg.version).toBe('0.4.0');
    // The package must ship a src/ + tests/ pair so the v1.33 8 axis advanced
    // billing II harness has a compile-safe entry point (avoids empty-scaffold
    // publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/tests')), 'missing tests/').toBe(true);
  });

  it('release script filter contains @kiwa-test/payment in both -F build and --filter publish halves (v1.14 payment omission avoidance, 8th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
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
    // package remains in both halves. v1.33 verifies the existing
    // `@kiwa-test/payment` package remains in both halves — the pattern SSOT
    // is now fully backed by v1.29-1's fail-fast release-script-filter.test.ts
    // axis, but v1.33-6 still verifies the primary publish surface is present
    // in both halves as a per-milestone shape guard. This is the 8th
    // application of the systematic root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/payment` (build step) and the
    // `--filter @kiwa-test/payment` (publish step) must be present; either
    // half alone is a partial fix that surfaces as a missing npm publish.
    expect(
      release,
      'release script missing build filter for @kiwa-test/payment',
    ).toContain('-F @kiwa-test/payment');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/payment',
    ).toContain('--filter @kiwa-test/payment');
  });
});
