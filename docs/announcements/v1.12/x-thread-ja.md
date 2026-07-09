1/ 🌱 kiwa v1.12 リリース — AI-LLM 縦軸。 6/6 sub-issues 全 resolved。

v1.11 の「release 品質を数値で判断」 縦軸を、 v1.12 は AI-LLM provider に適用する縦軸に伸ばす思想シフト。

v1.11 release gate は mock が deterministic な前提。 Claude / GPT / Gemini はその前提を壊す。 v1.12 は cost / latency / token / accuracy を release-gate の第一級 axis に格上げして吸収する。

2/ @kiwa-lab/quality-metrics v0.2 — 11 軸に拡張。

v1.11 の 5 軸 (coverage / test count / fidelity / perf p95 / mutation kill) はそのまま。

AI-LLM provider (name が @kiwa-lab/ai- で始まる) は追加 4 軸 — cost.perRequestUsd ≤ $0.10 / latency.p95Ms ≤ 3000 / token.totalTokens ≤ 4000 / accuracy.score ≥ 0.80。

3/ @kiwa-lab/ai-llm v0.1 — 4 SDK 統一 mock。

createAnthropicMock — Messages API + streaming + tool_use + system prompt。
createOpenAIMock — Chat Completions + stream + function calling + parallel tool calls。
createVercelAiMock — generateText / streamText / generateObject。
createLangchainMock — ChatModel + retriever + embedding。

1 engine 4 adapter。 real の drift 実測できるように mock は意図的に deterministic。

4/ Dogfood 3 app — real vs mock を 3 主要 use case で並べる。

examples/dogfood-anthropic-chatbot/ (streaming + tool_use)。
examples/dogfood-openai-tool-agent/ (function calling + parallel tool calls)。
examples/dogfood-vercel-ai-rag/ (SDK + LangChain retriever + embedding + RAG)。

v1.11 と同じ「provider-neutral interface + KIWA_MODE=real|mock」 template を再利用。

5/ 実運用検証 — ANTHROPIC_API_KEY なしで Anthropic dogfood を走らせると accuracy.score = 0.39 (0.80 gate 未達) で FAIL。 real adapter が ANTHROPIC_ENV_MISSING を返すため、 mock に不当な parity credit を与えない。 local dev でも gate が honest に働く。

6/ non-determinism を第一級 concept として言語化。

docs/concepts/ai-llm-testing.md で明文化。 v1.11 型の `.toEqual('Tokyo currently has clear skies.')` が weak すぎるか flaky すぎるかの 2 択に陥る理由と、 model が deterministic な振りをせず「mock を deterministic に固定 + golden set 相対で drift 計測」 の解に至る道筋。

7/ Docs 3 pillars 更新 — 新 tutorial 3 本 (Anthropic streaming / OpenAI tool agent / Vercel AI RAG)、 migration v1.11→v1.12 (additive-only)、 non-determinism concept doc。

VitePress skeleton は v1.11-6 のを再利用、 sidebar 追記のみ。 /docs-publish-kiwa (CI 使わず gh-pages branch push) で https://cardene777.github.io/kiwa/ を更新。

8/ Roadmap — https://github.com/cardene777/kiwa/issues/694

v1.13+ 候補 — Storybook、 Dragonfly、 Reth、 Go Iris + Chi、 Realtime 単独、 Payment (Stripe / Paddle)、 Search (Meilisearch / Algolia)、 Observability 深堀り (OTel / Datadog / Sentry)。

release cadence 追いたい人は @cardene777 まで。
