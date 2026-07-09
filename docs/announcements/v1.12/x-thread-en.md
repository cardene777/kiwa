1/ 🌱 kiwa v1.12 shipped — AI-LLM 縦軸. 6/6 sub-issues resolved.

Focus shift from "measure release quality" (v1.11) to "measure release quality of AI-LLM providers" (v1.12).

The v1.11 release gate assumed deterministic mocks. Claude / GPT / Gemini break that assumption. v1.12 absorbs the break — cost / latency / token / accuracy as first-class release-gate axes.

2/ @kiwa-lab/quality-metrics v0.2 — 11 axes now.

v1.11 axes stay untouched (coverage / test count / fidelity / perf p95 / mutation kill).

AI-LLM providers (name starts with @kiwa-lab/ai-) additionally emit — cost.perRequestUsd ≤ $0.10 / latency.p95Ms ≤ 3000 / token.totalTokens ≤ 4000 / accuracy.score ≥ 0.80.

3/ @kiwa-lab/ai-llm v0.1 — 4 SDK unified mock.

createAnthropicMock — Messages API + streaming + tool_use + system prompt.
createOpenAIMock — Chat Completions + stream + function calling + parallel tool calls.
createVercelAiMock — generateText / streamText / generateObject.
createLangchainMock — ChatModel + retriever + embedding.

One mock engine, 4 adapter shapes. Deterministic on purpose so real drift is measurable.

4/ Dogfood 3 apps — real vs mock across 3 canonical use cases.

examples/dogfood-anthropic-chatbot/ (streaming + tool_use).
examples/dogfood-openai-tool-agent/ (function calling + parallel tool calls).
examples/dogfood-vercel-ai-rag/ (SDK + LangChain retriever + embedding + RAG).

Same provider-neutral interface + KIWA_MODE=real|mock template from v1.11.

5/ Real-world discovery — running the Anthropic dogfood without ANTHROPIC_API_KEY emits accuracy.score = 0.39 (below the 0.80 gate) because the real adapter reports ANTHROPIC_ENV_MISSING. The gate stays honest even in local dev — no fake parity.

6/ Non-determinism as a first-class concept.

docs/concepts/ai-llm-testing.md names it. Why v1.11 assertions like .toEqual('Tokyo currently has clear skies.') either become too weak or flake constantly. Why the answer is to make the mock deterministic + measure drift against a golden set, not to pretend the model is deterministic.

7/ Docs 3 pillars refreshed — 3 new tutorials (Anthropic streaming / OpenAI tool agent / Vercel AI RAG), migration v1.11→v1.12 (additive-only), concept doc for non-determinism.

VitePress site skeleton reused unchanged. Sidebar update only. https://cardene777.github.io/kiwa/ refreshed via /docs-publish-kiwa (no CI, gh-pages branch push).

8/ Full changelog — https://github.com/cardene777/kiwa/issues/694

v1.13+ candidates — Storybook, Dragonfly, Reth, Go Iris + Chi, Realtime layer alone, Payment (Stripe / Paddle), Search (Meilisearch / Algolia), Observability deep dive (OTel / Datadog / Sentry).

Follow @cardene777 for release cadence.
