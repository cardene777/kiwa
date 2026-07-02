# 🌱 kiwa v1.12 — AI-LLM 縦軸 (quality-metrics 11 軸 + `@kiwa-test/ai-llm` v0.1 + dogfood 3 app + docs 3 pillars + gh-pages 更新、 6 sub 全 resolved)

The v1.12 milestone (**6/6 GitHub Issues resolved**) just landed. v1.11 introduced the 5-axis unified release gate. v1.12 extends the same gate to **AI-LLM providers** — 4 new axes (cost / latency / token / accuracy) that measure what real vs mock actually cost and how close they land, a unified mock across 4 SDKs (Anthropic + OpenAI + Vercel AI SDK + LangChain), 3 dogfood apps that run streaming / tool-use / RAG against both real APIs and the kiwa mock, and a concept doc that names non-determinism as a first-class constraint.

## 1. `@kiwa-test/quality-metrics` v0.2 — 11-axis release gate SSOT

Every provider still emits the same 5 axes (coverage / test count / fidelity / perf p95 / mutation kill). Providers whose name starts with `@kiwa-test/ai-` enter the AI-LLM branch and additionally emit 4 axes.

```ts
import { assembleReport, evaluateReleaseGate, emitMarkdown } from '@kiwa-test/quality-metrics';

const report = assembleReport({
  provider: '@kiwa-test/ai-llm/anthropic-chatbot',
  version: '0.1.0',
  coverage,
  testCount,
  fidelity,
  perf,
  mutation,
  cost:     { perRequestUsd: 0.0003 },        //   ≤ $0.10 default
  latency:  { p95Ms: 16 },                     //   ≤ 3000 ms default
  token:    { totalTokens: 52 },               //   ≤ 4000 default
  accuracy: { score: 0.87, sampleSize: 20 },  //   ≥ 0.80 default
});

const verdict = evaluateReleaseGate(report);
console.log(emitMarkdown({ report, verdict }));
```

- **11 default thresholds** — same v1.11 7 axes + cost ≤ $0.10 / p95 latency ≤ 3000 ms / token ≤ 4000 / accuracy ≥ 0.80
- **SSOT** at [`docs/quality/release-gate.md`](https://github.com/cardene777/kiwa/blob/main/docs/quality/release-gate.md)
- **`isAiLlmProvider` branch** — non-AI providers keep the v1.11 semantics unchanged

## 2. `@kiwa-test/ai-llm` v0.1 — 4 SDK 統一 mock

One mock engine, 4 SDK adapters. Streaming / tool-use / system prompt / cost tracking all covered.

- **`createAnthropicMock`** — Messages API (`messages.create` + `messages.stream`) + `tool_use` blocks + `stop_reason` progression
- **`createOpenAIMock`** — Chat Completions (`chat.completions.create`) + `stream: true` + function calling + parallel tool calls
- **`createVercelAiMock`** — `generateText` / `streamText` / `generateObject` (Vercel AI SDK v4)
- **`createLangchainMock`** — `ChatModel` + retriever interface + embedding for RAG pipelines

Deterministic on purpose — the mock returns the same output for the same input so it can serve as an anchor when measuring real-API drift.

## 3. Dogfood app 3 種 — real vs mock, streaming / tool-use / RAG

Every AI-LLM use case pattern gets an example app that runs against **both the real provider and the kiwa mock**. Trace differences feed the fidelity + accuracy axes of the 11-axis gate.

- **`examples/dogfood-anthropic-chatbot/`** (v1.12-2) — Anthropic Messages API + system prompt + streaming + `tool_use` (weather + calculator) + cost tracking
- **`examples/dogfood-openai-tool-agent/`** (v1.12-3) — OpenAI function calling + tool-use loop + parallel tool calls (search + calculator + weather orchestration)
- **`examples/dogfood-vercel-ai-rag/`** (v1.12-4) — Vercel AI SDK + LangChain retriever + embedding + RAG pipeline (docs indexing + retrieval-augmented generation)

All three follow the same **provider-neutral adapter interface + `KIWA_MODE=real|mock` split + trace-diffing fidelity harness** template that v1.11 established.

Real-world release-gate discovery — running the Anthropic dogfood without `ANTHROPIC_API_KEY` correctly emits `accuracy.score = 0.39` (below the 0.80 threshold) because the real adapter falls back with `ANTHROPIC_ENV_MISSING` for every op. The gate stays honest even in local dev — the mock is not credited with parity it cannot demonstrate.

## 4. Docs 補強 — tutorials + migration + concept doc

- **[`docs/tutorials/06-anthropic-chatbot-streaming.md`](https://github.com/cardene777/kiwa/blob/main/docs/tutorials/06-anthropic-chatbot-streaming.md)** — 10 min hands-on, non-streaming reply + streaming deltas + 2-tool `tool_use` loop
- **[`docs/tutorials/07-openai-tool-agent.md`](https://github.com/cardene777/kiwa/blob/main/docs/tutorials/07-openai-tool-agent.md)** — OpenAI function calling + parallel tool orchestration
- **[`docs/tutorials/08-vercel-ai-rag.md`](https://github.com/cardene777/kiwa/blob/main/docs/tutorials/08-vercel-ai-rag.md)** — Vercel AI SDK + LangChain retriever + embedding + RAG
- **[`docs/migrations/v1.11-to-v1.12.md`](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.11-to-v1.12.md)** — additive-only migration, existing tests unchanged
- **[`docs/concepts/ai-llm-testing.md`](https://github.com/cardene777/kiwa/blob/main/docs/concepts/ai-llm-testing.md)** — non-determinism SSOT (why the v1.11 paradigm fails, what changed, how the 4 new axes ground the release decision)

## 5. VitePress + GitHub Pages — sidebar update, no skeleton change

The v1.11-6 VitePress skeleton is reused unchanged. `docs/.vitepress/config.mts` gains sidebar entries for the 3 new tutorials, the concept doc, and the v1.11→v1.12 migration. `/docs-publish-kiwa` runs `pnpm docs:build` → `git worktree add ../kiwa-gh-pages gh-pages` → dist copy → push, refreshing `https://cardene777.github.io/kiwa/` without touching CI. Playwright docs E2E gains 5 new specs (tutorial 06/07/08 + concept + migration v1.11→v1.12) alongside the existing v1.11 canonical spec.

## Migration

v1.11 users can adopt v1.12 without touching existing tests. Add the new packages:

```bash
pnpm add -D @kiwa-test/ai-llm @kiwa-test/quality-metrics
```

The `@kiwa-test/quality-metrics` v0.2 upgrade is 100% additive — the 4 new axes only apply to `@kiwa-test/ai-*` providers, and existing 5-axis reports keep passing on the v1.11 semantics.

Full migration guide: [v1.11 → v1.12](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.11-to-v1.12.md).

Sub-Issue AC verification: [#694](https://github.com/cardene777/kiwa/issues/694) (parent) → [#695](https://github.com/cardene777/kiwa/issues/695) [#696](https://github.com/cardene777/kiwa/issues/696) [#697](https://github.com/cardene777/kiwa/issues/697) [#698](https://github.com/cardene777/kiwa/issues/698) [#699](https://github.com/cardene777/kiwa/issues/699) [#700](https://github.com/cardene777/kiwa/issues/700).

Happy testing! 🌱
