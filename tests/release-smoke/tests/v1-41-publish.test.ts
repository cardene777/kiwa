// Behavior test for v1.41-6 publish PR (Issue #1149). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 / v1.39 / v1.40
// publish PRs established, so accidental drift (wrong plugin.json version,
// missing announcement file, forgotten Roadmap ✅ row, wrong package.json
// version, dropped release script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the Payment
// deepening III behaviour (Embedded finance + BNPL + Crypto payment + FX
// cross-border + Recurring revenue advanced + Payment orchestration II + Fraud
// detection advanced + Regulatory reporting) is covered by `@kiwa-test/payment`
// v0.5 own suite (advanced III 8 axis semantics already landed in v1.41-1).
// v1.41 keeps the v1.13+ "single primary publish surface" shape — it lands a
// single publish surface (`@kiwa-test/payment` v0.5.0, minor bump) because
// the Payment deepening III spans a single adapter package. The axes verify
// payment holds the expected version + remains in the release script filter
// halves (v1.14 payment-omission-avoidance pattern SSOT applied per-package,
// 16th application).
// v1.41 sets a kiwa 史上 2 例目 pair 深度 4 段 record — Payment 縦深化 pair went
// v1.14 (v0.1 base) → v1.19 (v0.2 advanced) → v1.33 (v0.4 advanced II) →
// v1.41 (v0.5 advanced III), matching v1.40 AI/LLM depth-4 record and proving
// pair depth 4 is a repeatable kiwa vertical deepening SSOT (not a one-off).
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

describe('v1.41-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.41.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.41.0');
    // The description v-marker was `v1.40` before this PR; the publish PR must
    // update it to `v1.41` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.41)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.41 Payment deepening III markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.41 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search embedded-finance` /
    // `claude plugins search bnpl-installment` /
    // `claude plugins search crypto-payment` /
    // `claude plugins search payment-advanced-iii`) surfaces kiwa.
    for (const kw of [
      'payment-deepening-iii',
      'payment-v0-5',
      'vertical-pair-fifth',
      'vertical-pair-eleventh',
      'four-stage-extension-payment',
      'pair-depth-four-payment',
      'pair-depth-4-second-example',
      'kiwa-history-second-pair-depth-4',
      'pair-depth-4-repeatable',
      'embedded-finance',
      'baas-testing',
      'banking-as-a-service',
      'stripe-treasury',
      'unit-baas',
      'column-baas',
      'card-issuance',
      'kyc-verification',
      'kyb-verification',
      'bnpl-installment',
      'buy-now-pay-later',
      'klarna',
      'affirm',
      'afterpay',
      'installment-schedule',
      'risk-scoring',
      'credit-check',
      'late-fee-collection',
      'crypto-payment',
      'stablecoin-invoicing',
      'on-chain-settlement',
      'gas-abstraction',
      'coinbase-commerce',
      'bitpay',
      'wallet-linking',
      'fx-cross-border',
      'multi-currency-rate-lock',
      'swift-settlement',
      'sepa-settlement',
      'wise-fx',
      'airwallex-fx',
      'treasury-management',
      'recurring-revenue-advanced',
      'mrr-arr-tracking',
      'churn-analysis',
      'expansion-revenue',
      'contraction-revenue',
      'nrr-rollup',
      'net-revenue-retention',
      'cohort-analysis',
      'payment-orchestration-ii',
      'smart-routing',
      'ml-payment-routing',
      'fallback-ladder',
      'cascade-exhaustion',
      'ml-score-gate',
      'fraud-detection-advanced',
      'device-fingerprint',
      'behavioral-biometrics',
      'velocity-check',
      'ml-fusion-fraud',
      'graph-fraud',
      'regulatory-reporting',
      'pci-dss',
      'psd2-sca',
      'psd3-compliance',
      'dora-ict',
      'sar-filing',
      'aml-kyc-reporting',
      'audit-lock',
      'embedded-finance-bnpl',
      'crypto-payment-fx',
      'recurring-orchestration-fraud-regulatory',
      'payment-advanced-iii',
      'payment-advanced-iii-testing',
      'payment-advanced-iii-testing-ssot',
      'payment-75-cell-combination-coverage',
      'payment-25-axis-fidelity-harness',
      'dogfood-payment-embedded-finance-app',
      'dogfood-payment-bnpl-installment-app',
      'dogfood-payment-crypto-fx-app',
      'snippet-validation-19-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.41 row referencing the 6 sub-Issues #1143/#1145/#1146/#1147/#1148/#1149', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.41** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.41\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1143, 1145, 1146, 1147, 1148, 1149]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.41/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 /
    // v1.39 / v1.40 publish PRs all landed the same 4-file set (gh-discussions
    // + x-thread-en + x-thread-ja + zenn-article). Missing any of these means
    // the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.41/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.41 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.40 forgot to rename.
      expect(readText(rel)).toContain('v1.41');
    }
  });

  it('VitePress config.mts wires the Payment deepening III (v1.41) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.41');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/88-embedded-finance-bnpl',
      '/tutorials/89-crypto-payment-fx',
      '/tutorials/90-recurring-orchestration-fraud-regulatory',
      '/concepts/payment-advanced-III-testing',
      '/migrations/v1.40-to-v1.41',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/payment package.json is v0.5.0 (v1.41 single publish surface, minor bump)', () => {
    // The v1.41 primary publish surface is a single package minor bump —
    // `@kiwa-test/payment` v0.4.0 → v0.5.0. `pnpm changeset publish` reads
    // this file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const payment = readJson<{ name: string; version: string }>(
      'packages/payment/package.json',
    );
    expect(payment.name).toBe('@kiwa-test/payment');
    expect(payment.version).toBe('0.5.0');
    // The payment package must ship a src/ + tests/ pair so the v1.41 8
    // axis advanced III harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/src')), 'missing payment src/').toBe(
      true,
    );
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/tests')), 'missing payment tests/').toBe(
      true,
    );
  });

  it('release script filter contains @kiwa-test/payment in both -F build and --filter publish halves (v1.14 payment omission avoidance, 16th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 landed the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package (Issue #988).
    // v1.30-v1.36 verified existing packages remain in both halves. v1.37
    // was the second brand-new package addition since v1.29 —
    // `@kiwa-test/security` v0.1.0. v1.38 was a minor bump of the existing
    // `@kiwa-test/ai-llm` package. v1.39 was a minor bump of the existing
    // `@kiwa-test/security` package. v1.40 was another minor bump of the
    // existing `@kiwa-test/ai-llm` package. v1.41 is a minor bump of the
    // existing `@kiwa-test/payment` package — both halves must remain. This
    // is the 16th application of the systematic root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/payment` (build step) and the
    // `--filter @kiwa-test/payment` (publish step) must be present.
    expect(release, 'release script missing build filter for @kiwa-test/payment').toContain(
      '-F @kiwa-test/payment',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/payment').toContain(
      '--filter @kiwa-test/payment',
    );
  });
});
