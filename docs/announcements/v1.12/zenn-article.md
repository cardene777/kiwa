---
title: "kiwa v1.12 リリース — AI-LLM 縦軸 (11 軸 release gate + @kiwa-lab/ai-llm 4 SDK 統一 mock + dogfood 3 app + non-determinism SSOT)"
emoji: "🌱"
type: "tech"
topics: ["oss", "testing", "anthropic", "openai", "llm"]
published: false
---

## TL;DR

kiwa v1.12 milestone (**6/6 GitHub Issues resolved**) を land した。 v1.11 で「release 品質を数値で判断可能にする」 縦軸 (5 軸統一 harness + release gate SSOT + dogfood 3 app + docs 3 pillars) を確立した。 v1.12 は同じ縦軸を AI-LLM provider に伸ばす。

cost / latency / token / accuracy の 4 axis を release gate に追加、 `@kiwa-lab/ai-llm` v0.1 で Anthropic + OpenAI + Vercel AI SDK + LangChain の 4 SDK を 1 mock engine で統一、 dogfood 3 app で streaming / tool-use / RAG の 3 主要 use case を real vs mock 実測、 `docs/concepts/ai-llm-testing.md` で non-determinism を第一級 concept として言語化。

- 親 Issue ... [#694](https://github.com/cardene777/kiwa/issues/694)
- 6 sub-Issue ... [#695](https://github.com/cardene777/kiwa/issues/695) - [#700](https://github.com/cardene777/kiwa/issues/700)

## 1. `@kiwa-lab/quality-metrics` v0.2 — 11 軸 release gate SSOT (v1.12-1)

v1.11 の 5 軸 (coverage / test count / fidelity / perf p95 / mutation kill) は unchanged。 name が `@kiwa-lab/ai-` で始まる provider だけ AI-LLM 分岐に入り、 追加 4 軸を強制。

### 追加 4 軸

- `cost.perRequestUsd` — LLM request 1 件あたりの USD 平均、 default 上限 $0.10
- `latency.p95Ms` — end-to-end (embed + retrieve + generate) の p95 latency、 default 上限 3000 ms
- `token.totalTokens` — prompt + completion token の request 平均、 default 上限 4000
- `accuracy.score` — mock 出力と real 出力の golden set 相対類似度、 default 下限 0.80

### 分岐 logic

```ts
import { isAiLlmProvider, DEFAULT_AI_LLM_RELEASE_GATE_THRESHOLDS } from '@kiwa-lab/quality-metrics';

// name が "@kiwa-lab/ai-" で始まる時のみ AI-LLM 分岐に入る
if (isAiLlmProvider(report.provider)) {
  // 11 軸で評価
}
```

`isAiLlmProvider` は `packages/quality-metrics/src/types.ts` に SSOT、 provider prefix 一致だけの単純判定。 v1.11 の 5 軸評価は破壊しない、 完全 additive。

## 2. `@kiwa-lab/ai-llm` v0.1 — 4 SDK 統一 mock (v1.12-1)

1 mock engine、 4 SDK 別 adapter shape。 streaming / tool-use / system prompt / cost tracking を全 SDK で cover。

### 4 SDK adapter

- `createAnthropicMock` — Anthropic Messages API (`messages.create` + `messages.stream`)、 `tool_use` block、 `stop_reason` 遷移
- `createOpenAIMock` — OpenAI Chat Completions (`chat.completions.create`)、 `stream: true`、 function calling、 parallel tool calls
- `createVercelAiMock` — Vercel AI SDK v4 (`generateText` / `streamText` / `generateObject`)
- `createLangchainMock` — LangChain `ChatModel` + retriever interface + embedding (RAG pipeline 用)

### なぜ「意図的に deterministic」 か

Claude / GPT / Gemini は temperature > 0 で毎回異なる出力を返す (詳細 §5 参照)。 v1.11 型の `.toEqual('Tokyo currently has clear skies.')` は weak すぎ (`.toContain('Tokyo')`) か flaky すぎるかの 2 択に陥る。 v1.12 の解は「mock を deterministic に固定 + real の drift を golden set 相対で計測」 に転換すること。 だから mock は「決まった input には決まった output」 を返す。 real 側の drift は accuracy 軸に落ちる。

## 3. Dogfood 3 app (v1.12-2 / -3 / -4)

streaming / tool-use / RAG の 3 主要 use case を、 real vs mock の 2 mode で走らせて trace 差分から fidelity + accuracy を実測。

### 3 app の役割分担

```
examples/
├── dogfood-anthropic-chatbot/     # streaming + tool_use + system prompt + cost tracking
├── dogfood-openai-tool-agent/     # function calling + parallel tool calls + tool-use loop
└── dogfood-vercel-ai-rag/         # SDK + LangChain retriever + embedding + RAG pipeline
```

v1.11 dogfood template (`examples/dogfood-*-app/`) と同じ 3 layer 構造。

```
src/
├── adapters/
│   ├── interface.ts   (provider-neutral trace-recording shape)
│   ├── mock.ts        (kiwa mock adapter)
│   └── real.ts        (real provider + graceful skip)
└── flows/
    ├── <domain>-flows.ts
    └── fidelity.ts     (trace diff + quality-metrics 呼出)
```

### 実運用検証

`ANTHROPIC_API_KEY` なしで Anthropic dogfood を走らせると、 real adapter が `ANTHROPIC_ENV_MISSING` を返して op ごとに divergence を記録、 accuracy 0.39 が計上されて 11 軸 gate は FAIL 判定を出す。 local dev で本番 API key を積まないままの走行でも mock が不当な parity credit を得ない。 SSOT 閾値が実運用意味を持つことを実測データで実証。

## 4. Docs 補強 (v1.12-5)

### tutorial 3 本 (5 セクション統一テンプレ、 v1.11 と同構造)

- 06: Anthropic chatbot streaming + tool_use in 10 min
- 07: OpenAI tool agent (function calling + parallel tool calls)
- 08: Vercel AI SDK + LangChain RAG

### migration guide 1 本

- v1.11 → v1.12 (additive-only、 diff 形式、 verification コマンド付、 `@kiwa-lab/ai-llm` add 1 行 + AI-LLM provider は自動で 11 軸 gate に乗る)

### concept doc 1 本

- `docs/concepts/ai-llm-testing.md` — non-determinism SSOT

`docs/concepts/ai-llm-testing.md` は v1.12 の思想の芯を言語化する doc。 「chat LLM が next-token predictor である以上 temperature > 0 では確率分布 sampling」 「temperature = 0 でも model version bump / server-side batching / tokenizer drift / tool-call ordering の 4 経路で drift が残る」 「v1.11 型 `.toEqual(expected)` が破綻する 2 通り (weak か flaky か)」 「解は mock を deterministic に固定 + real drift を golden set 相対で accuracy 軸に落とす」 「11 軸 branch (`isAiLlmProvider`) で non-AI provider の 5 軸判定を壊さない」 の 5 段構造。

## 5. VitePress publish (v1.12-6)

v1.11-6 で land した VitePress skeleton (`docs/.vitepress/config.mts`) は unchanged。 sidebar に新 tutorial 3 本 + concept doc 1 本 + migration v1.11→v1.12 を追記するのみ。

```bash
# generate → build → publish の 3 step (v1.11 と同じ)
claude /docs-generate       # typedoc + cargo doc + forge doc
pnpm docs:build             # VitePress build → docs/.vitepress/dist/
claude /docs-publish-kiwa   # gh-pages branch push
```

Playwright docs E2E (`tests/docs-site-e2e/`) は既存 canonical spec に加えて tutorial 06/07/08 + concept + migration の 5 spec を追加。 build 後の verification に組み込み。 CI 全面禁止規約 (`rules/git-workflow.md`) 下で GitHub Actions 一切使わず、 `gh-pages` branch push だけで `https://cardene777.github.io/kiwa/` を更新。

## Migration

v1.11 user は zero-migration。 既存 test file はそのまま動く。 v1.12 追加は全て opt-in、 `@kiwa-lab/ai-*` provider を使わない限り 11 軸 branch には入らない。

```bash
pnpm add -D @kiwa-lab/ai-llm @kiwa-lab/quality-metrics
```

詳細 ... [v1.11 → v1.12 migration guide](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.11-to-v1.12.md)。

## v1.13+ 候補

v1.11 milestone parent (#680) で列挙した 8 候補のうち v1.12 で採用しなかったもの + v1.12 milestone parent (#694) で列挙した追加候補。

- Storybook integration (component test 隙間、 v2.0 pull-forward 候補)
- Dragonfly (2025 新興 Redis 互換 cache、 eco system 熟成待ち)
- Reth (Rust Ethereum execution client、 dApp test 需要が育つ)
- Go Iris + Chi (framework 縦深化続き)
- Realtime layer 単独 (Supabase Realtime / Ably / Pusher / Socket.io / SSE の統一 API、 v1.12 AI-LLM chat streaming で部分吸収)
- Payment 系 (Stripe / Paddle / Lemon Squeezy webhook mock)
- Search 系 (Meilisearch / Algolia / Typesense)
- Observability 深堀り (OpenTelemetry / Datadog / Sentry mock、 v1.12 cost / latency / token 軸で部分吸収)

## 参考

- v1.12 親 Issue ... https://github.com/cardene777/kiwa/issues/694
- v1.11 milestone 完遂 (5 軸 → 11 軸拡張の source of truth)
- @kiwa-lab/quality-metrics ... `packages/quality-metrics/`
- @kiwa-lab/ai-llm ... `packages/ai-llm/`
- dogfood 3 app ... `examples/dogfood-{anthropic-chatbot,openai-tool-agent,vercel-ai-rag}/`
- 4 SDK 選定理由 ... Anthropic + OpenAI = 直呼び 2 大 provider、 Vercel AI SDK + LangChain = orchestration layer 2 大 framework、 4 SDK で AI-LLM SaaS 実装の大半を cover
- non-determinism SSOT ... `docs/concepts/ai-llm-testing.md`
