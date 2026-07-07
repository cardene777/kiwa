// Behavior test for v1.35-6 publish PR (Issue #1067). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 publish PRs established, so accidental drift
// (wrong plugin.json version, missing announcement file, forgotten Roadmap ✅
// row, wrong package.json version, dropped release script filter entry) fails
// the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the observability
// deepening II behaviour (SLO burn rate + RED/USE/four golden signals +
// exemplar tracing + OTel advanced + log correlation advanced + alert routing
// advanced + continuous profiling + cardinality control) is covered by
// `@kiwa-test/observability` v2.1 own suite (250+ semantics tests already
// landed in v1.35-1). v1.35 returns to the v1.13+ "single primary publish
// surface" shape after v1.34's pair minor bump — it lands a single publish
// surface (`@kiwa-test/observability` v2.0.0 → v2.1.0) because the
// observability deepening spans a single adapter package (v2.0 dashboard/
// alert/flame graph/log correlation SSOT already established in v1.17).
// The axes verify observability holds the expected version bump + remains in
// the release script filter halves (v1.14 payment-omission-avoidance pattern
// SSOT applied per-package, 10th application).
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

describe('v1.35-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.35.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.35.0');
    // The description v-marker was `v1.34` before this PR; the publish PR must
    // update it to `v1.35` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.35)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.35 observability deepening II markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.35 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search observability-real-driver` /
    // `claude plugins search slo-burn-rate` /
    // `claude plugins search exemplar-tracing`) surfaces kiwa.
    for (const kw of [
      'observability-deepening-ii',
      'observability-real-driver',
      'observability-v2-1',
      'vertical-pair-seventh',
      'three-stage-deepening',
      'slo',
      'sli',
      'error-budget',
      'burn-rate',
      'multi-window-multi-burn-rate',
      'red-golden-signals',
      'use-method',
      'four-golden-signals',
      'exemplar',
      'exemplar-tracing',
      'trace-to-metric',
      'metric-to-trace',
      'otel-advanced',
      'w3c-context-propagation',
      'baggage',
      'log-correlation-advanced',
      'logql',
      'promql',
      'alert-routing-advanced',
      'silence',
      'inhibit',
      'escalation-ladder',
      'continuous-profiling',
      'pyroscope',
      'parca',
      'ebpf',
      'on-cpu-profile',
      'off-cpu-profile',
      'memory-profile',
      'cardinality-control',
      'high-cardinality-detection',
      'label-reduction',
      'ddsketch',
      't-digest',
      'observability-8-axis-advanced',
      'observability-32-cell-fidelity-grid',
      'observability-real-driver-testing-ssot',
      'grafana-oss',
      'prometheus',
      'loki',
      'otel-collector',
      'observability-slo-app',
      'otel-exemplar-app',
      'profiling-app',
      'snippet-validation-13-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.35 row referencing the 6 sub-Issues #1061/#1063/#1064/#1065/#1066/#1067', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.35** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.35\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1061, 1063, 1064, 1065, 1066, 1067]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.35/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 publish PRs all landed the same
    // 4-file set (gh-discussions + x-thread-en + x-thread-ja + zenn-article).
    // Missing any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.35/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.35 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.34 forgot to rename.
      expect(readText(rel)).toContain('v1.35');
    }
  });

  it('VitePress config.mts wires the observability deepening II (v1.35) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.35');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/70-slo-burn-rate',
      '/tutorials/71-otel-exemplar',
      '/tutorials/72-continuous-profiling',
      '/concepts/observability-real-driver-testing',
      '/migrations/v1.34-to-v1.35',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/observability package.json is v2.1.0 (v1.35 single publish surface, existing package minor bump)', () => {
    // The v1.35 primary publish surface is a single package —
    // `@kiwa-test/observability` v2.0.0 → v2.1.0. This returns to the v1.13+
    // single-surface shape after v1.34's pair minor bump because the
    // observability deepening spans a single adapter package (v2.0
    // dashboard/alert/flame graph/log correlation SSOT already established in
    // v1.17). `pnpm changeset publish` reads this file as the SSOT; version
    // drift here = wrong npm version on the registry.
    const observability = readJson<{ name: string; version: string }>(
      'packages/observability/package.json',
    );
    expect(observability.name).toBe('@kiwa-test/observability');
    expect(observability.version).toBe('2.1.0');
    // The observability package must ship a src/ + tests/ pair so the v1.35
    // 8 advanced axis harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/observability/src')),
      'missing observability src/',
    ).toBe(true);
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/observability/tests')),
      'missing observability tests/',
    ).toBe(true);
  });

  it('release script filter contains @kiwa-test/observability in both -F build and --filter publish halves (v1.14 payment omission avoidance, 10th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
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
    // package remains in both halves. v1.33 verified the existing
    // `@kiwa-test/payment` package remains in both halves. v1.34 verified
    // both `@kiwa-test/component` + `@kiwa-test/nextjs` remain in both
    // halves. v1.35 verifies the existing `@kiwa-test/observability`
    // package remains in both halves — observability has been in the filter
    // since v1.14 (part of the first-line adapter set), the per-milestone
    // shape guard just re-asserts. The pattern SSOT is fully backed by
    // v1.29-1's fail-fast release-script-filter.test.ts axis, but v1.35-6
    // still verifies the primary publish surface is present in both halves
    // as a per-milestone shape guard. This is the 10th application of the
    // systematic root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/observability` (build step) and the
    // `--filter @kiwa-test/observability` (publish step) must be present.
    expect(
      release,
      'release script missing build filter for @kiwa-test/observability',
    ).toContain('-F @kiwa-test/observability');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/observability',
    ).toContain('--filter @kiwa-test/observability');
  });
});
