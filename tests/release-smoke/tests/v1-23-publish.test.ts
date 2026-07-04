// Behavior test for v1.23-6 publish PR (Issue #905). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 publish PRs established, so accidental drift (wrong plugin.json
// version, missing announcement file, forgotten Roadmap ✅ row, wrong package.json
// version) fails the release gate loudly.
//
// The 6 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
// v1.23 mirrors the v1.21 / v1.22 shape (single primary publish surface — this
// time `@kiwa-test/payment` v0.3.0 minor bump), so the last axis reads the
// existing `packages/payment/package.json` + tests directory invariants rather
// than a brand-new-package shape.
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

describe('v1.23-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.23.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.23.0');
    // The description v-marker was `v1.22` before this PR; the publish PR must
    // update it to `v1.23` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.23)')).toBe(true);
  });

  it('plugin.json keywords include the v1.23 payment + billing semantics markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.23 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search paddle`) surfaces kiwa. The catch-all +
    // provider-specific + axis-specific + merchant-of-record keywords.
    for (const kw of [
      'payment',
      'payment-testing',
      'billing',
      'billing-semantics',
      'advanced-billing',
      'stripe',
      'stripe-billing',
      'smart-retries',
      'paddle',
      'paddle-billing',
      'paddle-billing-v2',
      'inline-checkout',
      'merchant-of-record',
      'mor',
      'lemon-squeezy',
      'lemonsqueezy',
      'hosted-checkout',
      'license-key',
      'dunning',
      'webhook-retry',
      '3ds',
      '3ds-v2',
      'emvco-3ds-2.2',
      'sca',
      'psd2',
      'sepa-direct-debit',
      'bacs',
      'ach',
      'mandate',
      'subscription-lifecycle',
      'subscription-tier',
      'proration',
      'invoice-lifecycle',
      'credit-note',
      'vat',
      'gst',
      'sales-tax',
      'reverse-charge',
      'chargeback',
      'chargeback-dispute',
      'dispute-lifecycle',
      '9-axis-billing',
      'provider-neutral',
      'state-machine',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.23 row referencing the 6 sub-Issues #900-#905', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.23** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.23\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [900, 901, 902, 903, 904, 905]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.23/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 / v1.21 /
    // v1.22 publish PRs all landed the same 4-file set (gh-discussions +
    // x-thread-en + x-thread-ja + zenn-article). Missing any of these means the
    // release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.23/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.23 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.22 forgot to rename.
      expect(readText(rel)).toContain('v1.23');
    }
  });

  it('VitePress config.mts wires the Payment 深化 (v1.23) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Payment 深化 (v1.23)');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/39-stripe-billing',
      '/tutorials/40-paddle-merchant',
      '/tutorials/41-lemon-squeezy-license',
      '/concepts/billing-semantics',
      '/migrations/v1.22-to-v1.23',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('payment package.json minor-bumped to v0.3.0 with matching name + testable src surface', () => {
    // The v1.23 primary publish surface is a single npm minor bump (same as
    // v1.21 / v1.22 — an existing package extension, not a brand-new package
    // like v1.20). `pnpm changeset publish` reads this file as the SSOT;
    // version drift here = wrong npm version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/payment/package.json');
    expect(pkg.name).toBe('@kiwa-test/payment');
    expect(pkg.version).toBe('0.3.0');
    // The package must ship a src/ + tests/ pair so the v1.23 semantics
    // additions have a compile-safe entry point (avoids empty-scaffold
    // publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/tests')), 'missing tests/').toBe(true);
    // The v1.23-1 9 axis semantics subdir must exist with 1 file per axis so the
    // minor bump does not ship an empty semantics surface. Each axis is a pure
    // state-machine helper the tutorials + dogfood apps import.
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/payment/src/semantics')),
      'missing semantics/ dir',
    ).toBe(true);
    for (const axis of [
      'dunning',
      'retry',
      'three-ds',
      'sca',
      'psd2',
      'subscription-lifecycle',
      'invoice',
      'tax',
      'chargeback',
    ]) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/payment/src/semantics/${axis}.ts`)),
        `missing v1.23-1 semantics axis: packages/payment/src/semantics/${axis}.ts`,
      ).toBe(true);
    }
  });

  it('3 v1.23 dogfood merchant apps exist under examples/', () => {
    // The 3 dogfood apps land in v1.23-2 / v1.23-3 / v1.23-4 as the primary
    // consumer surface for the semantics axes. Missing a dogfood app means
    // the release lost its executable proof that the mock adapter drives a
    // real framework end-to-end.
    for (const app of [
      'dogfood-stripe-billing-app',
      'dogfood-paddle-merchant-app',
      'dogfood-lemon-squeezy-app',
    ]) {
      expect(
        existsSync(resolve(REPO_ROOT, `examples/${app}`)),
        `missing v1.23 dogfood app: examples/${app}`,
      ).toBe(true);
      // Each dogfood app must ship a package.json + src/ + tests/ triplet so
      // the app is buildable + testable rather than an empty scaffold.
      expect(
        existsSync(resolve(REPO_ROOT, `examples/${app}/package.json`)),
        `missing package.json in v1.23 dogfood app: examples/${app}`,
      ).toBe(true);
      expect(
        existsSync(resolve(REPO_ROOT, `examples/${app}/src`)),
        `missing src/ in v1.23 dogfood app: examples/${app}`,
      ).toBe(true);
      expect(
        existsSync(resolve(REPO_ROOT, `examples/${app}/tests`)),
        `missing tests/ in v1.23 dogfood app: examples/${app}`,
      ).toBe(true);
    }
  });
});
