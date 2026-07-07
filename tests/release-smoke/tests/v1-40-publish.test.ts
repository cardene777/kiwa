// Behavior test for v1.40-6 publish PR (Issue #1136). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 / v1.39 publish
// PRs established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row, wrong package.json version,
// dropped release script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the AI/LLM
// deepening III behaviour (Multi-agent orchestration + Agent swarm coordination
// + Code interpreter + Fine-tuning pipeline + LLM ops + Prompt engineering
// advanced + RAG III + Cost optimization) is covered by `@kiwa-test/ai-llm`
// v0.5 own suite (advanced III 8 axis semantics already landed in v1.40-1).
// v1.40 keeps the v1.13+ "single primary publish surface" shape — it lands a
// single publish surface (`@kiwa-test/ai-llm` v0.5.0, minor bump) because
// the AI/LLM deepening III spans a single adapter package. The axes verify
// ai-llm holds the expected version + remains in the release script filter
// halves (v1.14 payment-omission-avoidance pattern SSOT applied per-package,
// 15th application).
// v1.40 sets a kiwa 史上初 pair 深度 4 段 record — AI/LLM 縦深化 pair went
// v1.12 (v0.1 base) → v1.15 (v0.2 multimodal) → v1.38 (v0.4 advanced) →
// v1.40 (v0.5 advanced III), surpassing the previous max pair depth of 3.
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

describe('v1.40-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.40.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.40.0');
    // The description v-marker was `v1.39` before this PR; the publish PR must
    // update it to `v1.40` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.40)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.40 AI/LLM deepening III markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.40 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search multi-agent-swarm` /
    // `claude plugins search code-interpreter` /
    // `claude plugins search llm-ops` /
    // `claude plugins search ai-llm-advanced-iii`) surfaces kiwa.
    for (const kw of [
      'ai-llm-deepening-iii',
      'ai-llm-v0-5',
      'vertical-pair-tenth',
      'four-stage-extension-ai-llm',
      'pair-depth-four-record',
      'pair-depth-4-record',
      'kiwa-history-first-pair-depth-4',
      'multi-agent-orchestration-advanced',
      'agent-swarm-coordination',
      'crewai',
      'autogen',
      'langgraph',
      'supervisor-pattern',
      'hierarchical-agents',
      'swarm-coordination',
      'role-based-agents',
      'task-allocation',
      'byzantine-fault-tolerance',
      'byzantine-tolerance',
      'pbft-lite',
      'majority-vote',
      'consensus',
      'consensus-mechanism',
      'state-graph-transition',
      'delegation-round-robin',
      'code-interpreter',
      'sandboxed-code-execution',
      'python-repl',
      'tool-use',
      'rollback',
      'memory-snapshot',
      'sandbox-lifecycle',
      'e2b',
      'modal-sandbox',
      'deno-sandbox',
      'execution-history',
      'tool-call-ledger',
      'llm-ops',
      'model-registry',
      'rollout-percentage',
      'ab-testing',
      'canary-promotion',
      'shadow-mode',
      'shadow-comparison',
      'error-rate-gate',
      'launchdarkly',
      'statsig',
      'github-deployments',
      'multi-agent-swarm',
      'code-interpreter-fine-tuning',
      'llm-ops-rag-iii-cost',
      'ai-llm-advanced-iii',
      'ai-llm-advanced-iii-testing',
      'ai-llm-advanced-iii-testing-ssot',
      'ai-llm-64-combination-coverage',
      'dogfood-llm-multi-agent-swarm-app',
      'dogfood-llm-code-interpreter-app',
      'dogfood-llm-ops-registry-app',
      'snippet-validation-18-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.40 row referencing the 6 sub-Issues #1130/#1132/#1133/#1134/#1135/#1136', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.40** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.40\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1130, 1132, 1133, 1134, 1135, 1136]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.40/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 /
    // v1.39 publish PRs all landed the same 4-file set (gh-discussions +
    // x-thread-en + x-thread-ja + zenn-article). Missing any of these means
    // the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.40/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.40 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.39 forgot to rename.
      expect(readText(rel)).toContain('v1.40');
    }
  });

  it('VitePress config.mts wires the AI/LLM deepening III (v1.40) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.40');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/85-multi-agent-swarm',
      '/tutorials/86-code-interpreter-fine-tuning',
      '/tutorials/87-llm-ops-rag-iii-cost',
      '/concepts/ai-llm-advanced-III-testing',
      '/migrations/v1.39-to-v1.40',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/ai-llm package.json is v0.5.0 (v1.40 single publish surface, minor bump)', () => {
    // The v1.40 primary publish surface is a single package minor bump —
    // `@kiwa-test/ai-llm` v0.4.0 → v0.5.0. `pnpm changeset publish` reads
    // this file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const aiLlm = readJson<{ name: string; version: string }>(
      'packages/ai-llm/package.json',
    );
    expect(aiLlm.name).toBe('@kiwa-test/ai-llm');
    expect(aiLlm.version).toBe('0.5.0');
    // The ai-llm package must ship a src/ + tests/ pair so the v1.40 8
    // axis advanced III harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/ai-llm/src')), 'missing ai-llm src/').toBe(
      true,
    );
    expect(existsSync(resolve(REPO_ROOT, 'packages/ai-llm/tests')), 'missing ai-llm tests/').toBe(
      true,
    );
  });

  it('release script filter contains @kiwa-test/ai-llm in both -F build and --filter publish halves (v1.14 payment omission avoidance, 15th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
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
    // `@kiwa-test/security` package. v1.40 is another minor bump of the
    // existing `@kiwa-test/ai-llm` package — both halves must remain. This
    // is the 15th application of the systematic root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/ai-llm` (build step) and the
    // `--filter @kiwa-test/ai-llm` (publish step) must be present.
    expect(release, 'release script missing build filter for @kiwa-test/ai-llm').toContain(
      '-F @kiwa-test/ai-llm',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/ai-llm').toContain(
      '--filter @kiwa-test/ai-llm',
    );
  });
});
