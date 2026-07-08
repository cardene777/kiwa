# @kiwa-test/quality-metrics

## 0.6.0

### Minor Changes

- v1.66-1 (Issue TBD、 v1.66 milestone quality-metrics 深化 III) — evaluateReleaseGate に drift check opt-in 統合。 v0.5 で pure library として提供した historical trend tracking + drift detection を release gate の judgment path に格上げ。

  ## `@kiwa-test/quality-metrics` v0.6.0

  ### What's added

  - **3 新 context field** ... `ReleaseGateContext.driftBaseline` (`MetricSnapshot`) / `driftThresholdPct` (default 5.0) / `driftEnabled` (default undefined = off)。
  - **drift 統合 axis 群** ... `driftEnabled === true` かつ `driftBaseline` 存在時のみ発火、 `evaluateReleaseGate` 内部で `captureSnapshot` + `compareToBaseline` + `detectDrift` chain 実行、 regression 検知 axis を `drift.{axis名}` の `ReleaseGateBlocker` に 1:1 格上げ。
  - **axesEvaluated 加算 rule** ... drift lane は tier axis と同じ +1 の 単一 lane 加算 (blocker 数と 独立)。 base 7 + drift 1 = 8、 base 11 + drift 1 = 12 等。
  - **9 behavior test 追加** (T-QM-GT-013 〜 T-QM-GT-021) ... 発火条件 / skip 経路 / regression 1:1 blocker 化 / improvement pass / stable pass / default threshold / 複数 regression / 既存 axis 並存 の 全経路 cover。

  ### Backward compat 絶対維持 (v0.1-v0.5 API 変更 0)

  - `driftEnabled` 省略 or `driftBaseline` 省略で v0.5 まで の 7 / 11 / 13 axis 動作を 厳密に 維持。
  - v0.5 の `captureSnapshot` / `compareToBaseline` / `detectDrift` / `generateTrendReport` の 4 export は 一切 変更なし、 pure library 経路 も そのまま。
  - shape 契約 preserving = `QualityReport` 構造 変更 0、 additive のみ、 既存 dogfood / consumer 全て そのまま 動作。

  ### Depth-5 pattern 3 例目確定 の 実運用 継続

  - v0.5 の depth-5 pattern (Mobile v1.54-v1.55 + Desktop v1.60-v1.61 + quality-metrics v1.65) 3 例目確定 = 「絶対的 rule」 昇格 signal 到達済、 v0.6 は その 実運用 継続 として drift 統合 を 展開。
  - systematic pattern 41 度目 = shape 契約 preserving + additive-only + backward compat 絶対維持 の 3 原則 を v0.6 も 継承。

## 0.5.0

### Minor Changes

- v1.65-1 (Issue #1291、 v1.65 milestone quality-metrics 深化 II) — MetricSnapshot + BaselineComparison + DriftDetection + TrendReport SSOT 追加 + captureSnapshot / compareToBaseline / detectDrift / generateTrendReport の 4 export。 shape 契約 preserving = 既存 QualityReport 構造無変更、 additive のみ、 pure library として提供 + release-gate 統合は v0.6 で 予定。

## 0.2.0

### Minor Changes

- 797e5ea: v1.12-1 (Issue #695、 v1.12 milestone 親 #694) — release gate SSOT を 5 軸 → 11 軸に拡張 + AI-LLM 統一 mock harness v0.1 新設。

  ## `@kiwa-test/quality-metrics` v0.2.0

  ### What's added

  - **4 新軸** (`CostMetric` / `LatencyMetric` / `TokenMetric` / `AccuracyMetric`) を `types.ts` に追加、 既存 7 軸と合わせ 11 軸。
  - **AI-LLM 分岐** ... `evaluateReleaseGate` 内で `isAiLlmProvider(report.provider)` 判定、 `@kiwa-test/ai-*` provider のみ 4 軸を追加検査、 それ以外は既存 7 軸のまま (breaking change なし)。
  - **default 閾値** (`DEFAULT_RELEASE_GATE_THRESHOLDS`) に 4 field 追加 ... `costPerRequestUsd: 0.1` / `latencyP95Ms: 3000` / `totalTokens: 4000` / `accuracyScore: 0.8`。
  - **collect helpers** 4 追加 ... `costFromSamples` / `latencyFromSamples` / `tokenFromSamples` / `accuracyFromSamples`。
  - **emit / diff** 4 軸拡張 ... `emitMarkdown` は AI-LLM provider で `11-axis summary` 表 + 4 行を追加出力、 `diffReports` は両 report が該当 field を持つときのみ diff。
  - **helper export** ... `isAiLlmProvider(provider): boolean` を追加 export、 downstream consumer が同一判定 SSOT を使える。

  ### Threshold rationale (docs/quality/release-gate.md)

  - cost ≤ $0.10 / request ... Anthropic Claude Haiku / OpenAI gpt-4o-mini 実勢価格帯の bar
  - latency p95 ≤ 3000ms ... streaming LLM の user-facing 「体感許容 3 秒」 bar
  - token ≤ 4000 / request ... 4k context model 前提の context bloat 検出
  - accuracy ≥ 0.80 ... embedding cosine similarity 0.80 = 意味的に近いと判定される bar

  ### Breaking

  - 非 AI-LLM provider (既存 7 軸のみ) は挙動不変、 breaking change なし。
  - `axesEvaluated` は non AI-LLM で `7`、 AI-LLM で `11` を返す。

  ## `@kiwa-test/ai-llm` v0.1.0 (新設)

  ### What's added

  - **4 SDK 統一 mock** ... Anthropic Messages API / OpenAI Chat Completions / Vercel AI SDK (`streamText` / `generateText`) / LangChain (`ChatModel` / `Runnable`) の同一 interface。
  - **streaming + tool-use + system prompt** の 3 use case を 4 SDK 全てで cover。
  - **fidelity harness** (`fidelity.ts`) ... real API vs mock の 4 metric (cost / latency / token / accuracy) diff を返す。 v1.12-2/-3/-4 dogfood app が直接使用する。
  - **report adapter** (`report.ts`) ... 4 SDK 実測値から `@kiwa-test/quality-metrics` 用 `QualityReport` を組み立てる。

  ### API surface

  - `createAnthropicMock(config)` — Anthropic Messages API mock (`messages.create` + `messages.stream`)
  - `createOpenAIMock(config)` — OpenAI Chat Completions mock (`chat.completions.create` + tool_calls loop)
  - `createVercelAiMock(config)` — Vercel AI SDK `streamText` / `generateText` mock
  - `createLangchainMock(config)` — LangChain BaseChatModel-compatible mock
  - `runFidelityCheck({ real, mock, prompts })` — real vs mock 4 metric diff (SSE token 列 / cost / token / accuracy cosine)
  - `buildAiLlmReport({ metrics, provider, version })` — 4 metric を `QualityReport` に集約

  Refs #695、 #694。
