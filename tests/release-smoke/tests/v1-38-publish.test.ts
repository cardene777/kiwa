// Behavior test for v1.38-6 publish PR (Issue #1107). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 publish PRs established, so accidental drift
// (wrong plugin.json version, missing announcement file, forgotten Roadmap ✅
// row, wrong package.json version, dropped release script filter entry) fails
// the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the AI/LLM
// deepening II behaviour (Prompt injection defense + Hallucination detection +
// LLM eval + Guardrails + RAG advanced + Agent orchestration + Fine-tuning
// eval + Cost/latency SLA) is covered by `@kiwa-test/ai-llm` v0.4 own suite
// (advanced 8 axis semantics already landed in v1.38-1).
// v1.38 keeps the v1.13+ "single primary publish surface" shape — it lands a
// single publish surface (`@kiwa-test/ai-llm` v0.4.0, minor bump) because
// the AI/LLM deepening II spans a single adapter package. The axes verify
// ai-llm holds the expected version + remains in the release script filter
// halves (v1.14 payment-omission-avoidance pattern SSOT applied per-package,
// 13th application).
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

describe('v1.38-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.38.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.38.0');
    // The description v-marker was `v1.37` before this PR; the publish PR must
    // update it to `v1.38` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.38)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.38 AI/LLM deepening II markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.38 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search prompt-injection-defense` /
    // `claude plugins search hallucination-detection` /
    // `claude plugins search llm-as-judge` /
    // `claude plugins search agent-orchestration`) surfaces kiwa.
    for (const kw of [
      'ai-llm-deepening-ii',
      'ai-llm-v0-4',
      'vertical-pair-tenth',
      'three-stage-extension-third',
      'prompt-injection',
      'prompt-injection-defense',
      'direct-injection',
      'indirect-injection',
      'jailbreak',
      'jailbreak-defense',
      'role-hijacking',
      'xml-injection',
      'hallucination',
      'hallucination-detection',
      'self-consistency',
      'factuality-check',
      'citation-grounding',
      'confidence-scoring',
      'hedging-detection',
      'llm-eval',
      'llm-as-judge',
      'rubric-based-eval',
      'preference-eval',
      'elo-ranking',
      'human-in-the-loop',
      'guardrails',
      'guardrails-json-schema',
      'guardrails-regex',
      'toxicity-detection',
      'pii-redaction',
      'constitutional-ai',
      'rag-advanced',
      'rag-chunking',
      'rag-hybrid-retrieval',
      'rag-reranking',
      'rag-citation',
      'context-compression',
      'agent-orchestration',
      'react-agent',
      'tree-of-thoughts',
      'reflection-agent',
      'self-correction',
      'planning-agent',
      'tool-selection',
      'fine-tuning-eval',
      'sft-dpo',
      'catastrophic-forgetting',
      'benchmark-drift',
      'cost-latency-sla',
      'budget-tracking',
      'p50-p99-latency',
      'model-routing',
      'fallback-ladder',
      'ai-llm-8-axis-advanced',
      'ai-llm-32-cell-fidelity-grid',
      'ai-llm-real-driver-testing-ssot',
      'anthropic-provider',
      'openai-provider',
      'vercel-ai-sdk-provider',
      'langchain-provider',
      'dogfood-llm-prompt-injection-defense-app',
      'dogfood-llm-hallucination-eval-app',
      'dogfood-llm-agent-orchestration-app',
      'snippet-validation-16-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.38 row referencing the 6 sub-Issues #1102/#1103/#1104/#1105/#1106/#1107', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.38** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.38\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1102, 1103, 1104, 1105, 1106, 1107]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.38/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 publish PRs all
    // landed the same 4-file set (gh-discussions + x-thread-en + x-thread-ja +
    // zenn-article). Missing any of these means the release lost its
    // distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.38/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.38 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.37 forgot to rename.
      expect(readText(rel)).toContain('v1.38');
    }
  });

  it('VitePress config.mts wires the AI/LLM deepening II (v1.38) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.38');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/79-prompt-injection-defense',
      '/tutorials/80-llm-eval-hallucination',
      '/tutorials/81-agent-orchestration',
      '/concepts/ai-llm-real-driver-testing',
      '/migrations/v1.37-to-v1.38',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/ai-llm package.json is v0.4.0 (v1.38 single publish surface, minor bump)', () => {
    // The v1.38 primary publish surface is a single package minor bump —
    // `@kiwa-test/ai-llm` v0.3.0 → v0.4.0. `pnpm changeset publish` reads
    // this file as the SSOT; version drift here = wrong npm version on the
    // registry.
    const aiLlm = readJson<{ name: string; version: string }>(
      'packages/ai-llm/package.json',
    );
    expect(aiLlm.name).toBe('@kiwa-test/ai-llm');
    expect(aiLlm.version).toBe('0.4.0');
    // The ai-llm package must ship a src/ + tests/ pair so the v1.38 8
    // axis harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/ai-llm/src')), 'missing ai-llm src/').toBe(
      true,
    );
    expect(existsSync(resolve(REPO_ROOT, 'packages/ai-llm/tests')), 'missing ai-llm tests/').toBe(
      true,
    );
  });

  it('release script filter contains @kiwa-test/ai-llm in both -F build and --filter publish halves (v1.14 payment omission avoidance, 13th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 landed the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package (Issue #988).
    // v1.30-v1.36 verified existing packages remain in both halves. v1.37
    // was the second brand-new package addition since v1.29 — `@kiwa-test/security`
    // v0.1.0. v1.38 is a minor bump of the existing `@kiwa-test/ai-llm` package —
    // both halves must remain. This is the 13th application of the systematic
    // root cause pattern.
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
