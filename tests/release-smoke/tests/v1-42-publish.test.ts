// Behavior test for v1.42-6 publish PR (Issue #1162). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 / v1.39 / v1.40 /
// v1.41 publish PRs established, so accidental drift (wrong plugin.json version,
// missing announcement file, forgotten Roadmap ✅ row, wrong package.json
// version, dropped release script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the Observability
// deepening III behaviour (IaC + Service mesh + eBPF profiling III + LLM
// observability + FinOps observability + Chaos engineering + Data pipeline +
// AIOps) is covered by `@kiwa-test/observability` v2.2 own suite (advanced III
// 8 axis semantics already landed in v1.42-1).
// v1.42 keeps the v1.13+ "single primary publish surface" shape — it lands a
// single publish surface (`@kiwa-test/observability` v2.2.0, minor bump) because
// the Observability deepening III spans a single adapter package. The axes
// verify observability holds the expected version + remains in the release
// script filter halves (v1.14 payment-omission-avoidance pattern SSOT applied
// per-package, 17th application).
// v1.42 sets a kiwa 史上 3 例目 pair 深度 4 段 record — Observability 縦深化 pair
// went v1.14 (v0.1 base) → v1.17 (v2.0 dashboard) → v1.35 (v2.1 advanced) →
// v1.42 (v2.2 advanced III), matching v1.40 AI/LLM depth-4 record + v1.41
// Payment depth-4 record and stabilizing pair depth 4 as a repeatable kiwa
// vertical deepening SSOT across 3 examples (record 3 例安定化).
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

describe('v1.42-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.42.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.42.0');
    // The description v-marker was `v1.41` before this PR; the publish PR must
    // update it to `v1.42` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.42)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.42 Observability deepening III markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.42 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search iac-observability` /
    // `claude plugins search service-mesh-observability` /
    // `claude plugins search ebpf-iii` /
    // `claude plugins search observability-advanced-iii`) surfaces kiwa.
    for (const kw of [
      'observability-deepening-iii',
      'observability-v2-2',
      'vertical-pair-seventh',
      'vertical-pair-twelfth',
      'four-stage-extension-observability',
      'pair-depth-four-observability',
      'pair-depth-4-third-example',
      'kiwa-history-third-pair-depth-4',
      'pair-depth-4-stabilized',
      'pair-depth-4-record-3-examples',
      'iac-observability',
      'terraform-plan',
      'terraform-drift',
      'opa-policy',
      'cost-attribution',
      'service-mesh-observability',
      'istio-observability',
      'linkerd-observability',
      'mtls-handshake',
      'sidecar-inject',
      'circuit-breaker',
      'traffic-split',
      'ebpf-iii',
      'ebpf-profiling-iii',
      'ebpf-user-space',
      'ebpf-kernel-lsm',
      'ebpf-syscall-tracing',
      'ebpf-network-flow',
      'llm-observability',
      'llm-token-count',
      'llm-prompt-log',
      'llm-hallucination',
      'llm-budget-attribution',
      'llm-tool-call-tracing',
      'finops-observability',
      'cost-per-request',
      'team-attribution',
      'rightsizing',
      'spot-instance-policy',
      'chaos-engineering',
      'fault-injection',
      'blast-radius',
      'auto-rollback',
      'game-day',
      'data-pipeline-observability',
      'openlineage',
      'airflow-observability',
      'dagster-observability',
      'freshness-sla',
      'schema-drift',
      'data-quality-score',
      'aiops',
      'aiops-anomaly-detection',
      'auto-remediation',
      'rca-root-cause-analysis',
      'alert-correlation',
      'change-impact-analysis',
      'iac-servicemesh-ebpf',
      'llm-observability-finops',
      'chaos-datapipeline-aiops',
      'observability-advanced-iii',
      'observability-advanced-iii-testing',
      'observability-advanced-iii-testing-ssot',
      'observability-64-cell-combination-coverage',
      'observability-16-axis-fidelity-harness',
      'dogfood-observability-iac-drift-app',
      'dogfood-observability-llm-ops-app',
      'dogfood-observability-chaos-aiops-app',
      'snippet-validation-20-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.42 row referencing the 6 sub-Issues #1156/#1158/#1159/#1160/#1161/#1162', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.42** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.42\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1156, 1158, 1159, 1160, 1161, 1162]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.42/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 /
    // v1.39 / v1.40 / v1.41 publish PRs all landed the same 4-file set
    // (gh-discussions + x-thread-en + x-thread-ja + zenn-article). Missing any
    // of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.42/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.42 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.41 forgot to rename.
      expect(readText(rel)).toContain('v1.42');
    }
  });

  it('VitePress config.mts wires the Observability deepening III (v1.42) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.42');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/91-iac-servicemesh-ebpf',
      '/tutorials/92-llm-observability-finops',
      '/tutorials/93-chaos-datapipeline-aiops',
      '/concepts/observability-advanced-III-testing',
      '/migrations/v1.41-to-v1.42',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/observability package.json is v2.2.0 (v1.42 single publish surface, minor bump)', () => {
    // The v1.42 primary publish surface is a single package minor bump —
    // `@kiwa-test/observability` v2.1.0 → v2.2.0. `pnpm changeset publish` reads
    // this file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const observability = readJson<{ name: string; version: string }>(
      'packages/observability/package.json',
    );
    expect(observability.name).toBe('@kiwa-test/observability');
    expect(observability.version).toBe('2.2.0');
    // The observability package must ship a src/ + tests/ pair so the v1.42 8
    // axis advanced III harness has a compile-safe entry point (avoids
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

  it('release script filter contains @kiwa-test/observability in both -F build and --filter publish halves (v1.14 payment omission avoidance, 17th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
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
    // existing `@kiwa-test/ai-llm` package. v1.41 was a minor bump of the
    // existing `@kiwa-test/payment` package. v1.42 is a minor bump of the
    // existing `@kiwa-test/observability` package — both halves must remain.
    // This is the 17th application of the systematic root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/observability` (build step) and the
    // `--filter @kiwa-test/observability` (publish step) must be present.
    expect(release, 'release script missing build filter for @kiwa-test/observability').toContain(
      '-F @kiwa-test/observability',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/observability').toContain(
      '--filter @kiwa-test/observability',
    );
  });
});
