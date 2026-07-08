# kiwa v1.35 released — Observability 深化 II (@kiwa/observability v2.1.0 + 8 axis advanced observability + 縦深化 pair 第 7 pair 連続化 + 3-stage 拡張 pattern 2 例目)

## TL;DR

- **kiwa v1.35 released** — Observability 深化 II milestone (advanced observability semantics 8 axis + real driver + 縦深化 pair 第 7 pair 連続化 + 3-stage 拡張 pattern 2 例目)
- **`@kiwa/observability` v2.0.0 → v2.1.0 minor bump** — 8 axis advanced observability semantics + real driver env-gate + 4 provider × 8 axis neutral state machine 追加
- **8 axis semantics** = slo-burn-rate + red-use-golden-signals + exemplar-tracing + otel-advanced + log-correlation-advanced + alert-routing-advanced + continuous-profiling + cardinality-control
- **3 dogfood app v2 / 新規** — observability-slo-app v2 + otel-exemplar-app v2 + profiling-app 新規、 全 7 軸 release gate PASS + real driver env-gate
- **縦深化 pair pattern 第 7 pair 連続化** — Auth pair (v1.21→v1.22) + Realtime pair (v1.13→v1.28) + Streaming pair (v1.20→v1.31) + Database pair (v1.14→v1.32) + Payment pair (v1.14→v1.23→v1.33) + Frontend pair (v1.16→v1.34) + **Observability pair (v1.14→v1.17→v1.35)**、 3-stage 拡張 pattern は Payment + Observability の 2 例、 縦深化戦略 SSOT を observability production layer に拡張
- **13 milestone 連続 snippet validation streak** (v1.23-v1.35)
- **kiwa runtime fixture 35 packages 維持** (observability 既存 package の minor 拡張)
- v1.11 以降 25 milestone 連続完遂

## v1.35 が解決したい問題 — Observability production semantics の testing gap

v1.14 で `@kiwa/observability` v1.0 (OpenTelemetry / Datadog / Sentry の 3 provider を統一 mock として提供する telemetry collector envelope) を land、 v1.17 で v2.0 に major bump (Grafana-style DashboardMock + Prometheus AlertManager-style AlertRouter + trace flame graph + LogCorrelationIndex の 4 module 追加、 v1 telemetry mock 基盤上に v2 dashboard/alert/flame graph/log correlation の 6 base semantics layer を確立) した時点で、 kiwa は telemetry provider mock + observability dashboard/alerting のうち base semantics までは cover していた。 broker binary + Grafana Enterprise + Prometheus + Loki 不要で mock only mode で走る、 実 test 環境の inner-loop 速度を確保する目的の layer。

しかし v1.17 v2.0 land 後の実行観測で判明したのは、 real production observability setup (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector + pyroscope + eBPF profiler) で頻繁に遭遇する **8 axis の advanced observability semantics** — SLO burn rate の multi-window multi-burn-rate alert (5m/1h/6h/3d) 設計 error / RED/USE/four golden signals の service dependency graph 統一 / exemplar tracing の trace-to-metric / metric-to-trace 双方向 navigation / OTel batch processor + resource detection + baggage 3 axis の統一 / structured log の trace_id/span_id auto-injection + LogQL/PromQL join / alert routing の silence + inhibit + escalation ladder 3 axis / continuous profiling の pyroscope/parca/eBPF 3 provider 統一 + on-CPU/off-CPU/memory profile 3 axis / cardinality control の high-cardinality detection + label reduction + DDSketch/t-digest 統一 — が v1.17 v2.0 の 6 base semantics だけでは cover できないこと。

v1.35 はこの gap を埋める深化 milestone。 8 axis advanced observability semantics + real driver env-gate + 3 dogfood observability app v2 / 新規 で **production observability testing SSOT** を確立、 kiwa の縦深化 pair pattern を 7 pair 目として observability production layer に拡張、 かつ Payment (v1.14 → v1.23 → v1.33) と同構造の **3-stage 拡張 pattern の 2 例目** として (v1.14 → v1.17 → v1.35)。

## v1.35 で追加した 8 axis advanced observability semantics

### 1. SLO burn rate (`slo-burn-rate.ts`)

SLO/SLI definition + error budget calculation + multi-window multi-burn-rate alert (5m / 1h / 6h / 3d の 4 window × short-window & long-window pair で fast burn / slow burn を分別) + budget consumption tracking (99.9% availability SLO で 30 day 期間中の budget 消費速度追跡) の 4 axis を pure state machine として実装。 `defineSlo` → `computeErrorBudget` → `evaluateBurnRateAlert` → `trackBudgetConsumption` の 4 event envelope。 real driver env-gate で Prometheus alertmanager 実 rules に routing。

### 2. RED / USE / four golden signals (`red-use-golden-signals.ts`)

RED (Rate / Errors / Duration) + USE (Utilization / Saturation / Errors) + four golden signals (latency / traffic / errors / saturation) + service dependency graph の 4 axis 統一実装。 `emitRedMetric` → `emitUseMetric` → `emitGoldenSignal` → `buildServiceDependencyGraph` の 4-event envelope。

### 3. Exemplar tracing (`exemplar-tracing.ts`)

trace-to-metric exemplar attachment (histogram bucket に対応する trace の attach) + metric-to-trace navigation (metric alert → 該当 trace への drill-down) + histogram bucket exemplar (per-bucket 代表 trace) + Prometheus native histogram exemplar (v2.40+ native histogram の exemplar 対応) の 4 axis 統一実装。

### 4. OpenTelemetry advanced (`otel-advanced.ts`)

OpenTelemetry batch processor (SDK 側 batching + backpressure) + resource detection (host / process / k8s / cloud attribute の自動検出) + W3C context propagation (traceparent + tracestate header の parse / build) + baggage propagation (cross-service context 伝播 baggage: key=value) + semantic conventions v1.27 準拠 の 4 axis 統一実装。

### 5. Log correlation advanced (`log-correlation-advanced.ts`)

structured log (JSON structured logging + severity + trace_id/span_id field) + trace_id/span_id auto-injection (log SDK integration) + LogQL (Loki query) + PromQL join (metric ↔ log ↔ trace の 3 correlation key join) + span event correlation (log line ↔ span event) の 4 axis 統一実装。

### 6. Alert routing advanced (`alert-routing-advanced.ts`)

silence (時間窓 + label matcher で alert 抑止) + inhibit (higher severity alert 発火時に lower severity 抑止) + escalation ladder (未 ack alert の段階 escalation) + oncall rotation (PagerDuty schedule + primary / secondary rotation) + PagerDuty / Slack / OpsGenie routing の 4 axis 統一実装。

### 7. Continuous profiling (`continuous-profiling.ts`)

pyroscope / parca profile ingestion (pprof format + parca-style profile schema) + eBPF profiler (Linux kernel eBPF program で system-wide profile 収集) + on-CPU / off-CPU / memory profile (3 profile type 分別) + flame graph render (SVG + interactive drill-down) + depth-first flatten (flame graph の stack trace flatten + hot path 抽出) の 4 axis 統一実装。

### 8. Cardinality control (`cardinality-control.ts`)

high-cardinality detection (label 組合せ爆発の検出 + threshold 超過 alert) + label reduction (drop_label / relabel_config で cardinality 削減) + histogram / summary / sketch (DDSketch + t-digest の approximate quantile) + cardinality budget enforcement (per-metric cardinality budget + drop policy) の 4 axis 統一実装。

## 3 dogfood observability app v2 / 新規

### `dogfood-observability-slo-app` v2 (v1.35-2, Issue #1063)

- SLO burn rate + error budget + multi-window multi-burn-rate alert 5m/1h/6h/3d + Prometheus alertmanager mock + Grafana OSS testcontainers real driver
- testcontainers-shaped env-gate、 mock only + `KIWA_MODE=real PROMETHEUS_URL=... GRAFANA_URL=...` opt-in の 2 layer 走査
- SLO SSOT walkthrough (99.9% availability SLO の budget 消費 + burn rate alert design)

### `dogfood-otel-exemplar-app` v2 (v1.35-3, Issue #1064)

- OpenTelemetry Collector + exemplar tracing + trace-to-metric + baggage propagation + W3C context propagation traceparent/tracestate
- testcontainers-shaped env-gate、 OTel Collector real driver 経路 (`OTEL_COLLECTOR_URL=...`)
- exemplar attachment + metric-to-trace navigation + baggage cross-service 伝播 の walkthrough

### `dogfood-profiling-app` (新規, v1.35-4, Issue #1065)

- Continuous profiling + pyroscope + eBPF + on-CPU/off-CPU/memory profile + flame graph render
- testcontainers-shaped env-gate、 pyroscope testcontainers real driver 経路
- pyroscope / parca / eBPF の 3 provider 統一 + flame graph SVG render + depth-first flatten walkthrough

## 縦深化 pair pattern 第 7 pair 連続化 + 3-stage 拡張 pattern 2 例目

v1.35 で kiwa の縦深化 pair pattern (basic mock milestone → 深化 II milestone で real driver + advanced semantics) が **7 pair 連続完成**。 特に Payment (v1.14 → v1.23 → v1.33) と Observability (v1.14 → v1.17 → v1.35) は **3-stage 拡張 pattern** で、 base mock → mid depth → advanced real driver の 3 段拡張パターン (2 例):

1. **Auth pair** (v1.21 → v1.22)
   - v1.21 = `@kiwa/auth` v0.4 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC) mock only
   - v1.22 = Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver) + a11y axe-core gate
2. **Realtime pair** (v1.13 → v1.28)
   - v1.13 = `@kiwa/realtime` v0.1 4 provider (Supabase / Ably / Pusher / Socket.io) × 5 base semantics mock only
   - v1.28 = WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
3. **Streaming pair** (v1.20 → v1.31)
   - v1.20 = `@kiwa/streaming` v0.1 3 provider (Kafka / Redpanda / NATS) × 5 semantics mock only
   - v1.31 = Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)
4. **Database pair** (v1.14 → v1.32)
   - v1.14-v1.26 = `@kiwa/orm` v0.1-v0.9 3 ORM × 3 backend + 8 base semantics mock only
   - v1.32 = Postgres logical replication + MySQL cluster + SQLite WAL/FTS5 + 8 axis advanced (real driver env-gate + testcontainers)
5. **Payment pair** (v1.14 → v1.23 → v1.33) 【3-stage 拡張 pattern 1 例目】
   - v1.14 = `@kiwa/payment` v0.1 3 provider webhook mock (Stripe / Paddle / Lemon Squeezy)
   - v1.23 = `@kiwa/payment` v0.3 9 base billing semantics (subscription lifecycle + invoice + 3DS v2 + SCA + PSD2 + VAT/GST + dispute + refund + coupon)
   - v1.33 = `@kiwa/payment` v0.4 8 advanced billing II semantics + real driver env-gate + Stripe Connect + Paddle Billing v2 + Lemon Squeezy license
6. **Frontend pair** (v1.16 → v1.34)
   - v1.16 = `@kiwa/component` v0.1-v0.2 3 target (Storybook 8 / Playwright CT / Chromatic) 6 base semantics mock only
   - v1.34 = `@kiwa/component` v0.3 + `@kiwa/nextjs` v1.2 8 axis advanced frontend semantics + real driver env-gate + Next.js 15 App Router + Storybook 8 MDX + Playwright CT + Chromatic
7. **Observability pair** (v1.14 → v1.17 → v1.35、 this) 【3-stage 拡張 pattern 2 例目】
   - v1.14 = `@kiwa/observability` v1.0 3 provider mock (OpenTelemetry / Datadog / Sentry) + span + metric + log + exception + transaction 統一 collector
   - v1.17 = `@kiwa/observability` v2.0 Grafana-style DashboardMock + Prometheus AlertManager-style AlertRouter + trace flame graph + LogCorrelationIndex の 4 module 追加 (v1 telemetry mock 基盤上に v2 dashboard / alert / flame graph / log correlation の 6 base semantics layer)
   - v1.35 = `@kiwa/observability` v2.1 8 advanced observability semantics + real driver env-gate + Grafana OSS + Prometheus + Loki + OTel Collector

basic mock → (mid depth →) advanced real driver の 2 phase (+ 3-stage 拡張 2 例) pair を追加領域に横展開する pattern が SSOT 化された。 v1.25 perf + v1.27 mutation + v1.30 a11y の横串 triple pair と合わせて **kiwa quality gate 縦横 grid maximum extension**、 7 領域 (auth / realtime / streaming / database / payment / frontend / observability) 完全 cover。

## v1.11 以降 25 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → v1.31 (Streaming 深化 II) → v1.32 (Database 深化 II) → v1.33 (Payment 深化 II) → v1.34 (Frontend 深化) → **v1.35 (Observability 深化 II)**。

## 13 milestone 連続 snippet validation streak

v1.23 (payment 深化) から v1.35 (observability 深化 II) まで **13 milestone 連続で snippet validation pattern** を land 済:

payment-v1.23 / edge-v1.24 / perf-harness-v1.25 / orm-v1.26 / quality-metrics-v1.27 / realtime-v1.28 / release-invariants-v1.29 / a11y-v1.30 / streaming-v1.31 / orm-v1.32 / payment-v1.33 / frontend-v1.34 / **observability-v1.35**。

各 milestone の tutorial code snippet はすべて `docs-tutorial-v1.XX.test.ts` で自動検証されている (`packages/observability/tests/docs-tutorial-v1.35.test.ts` は 13 milestone 目の追加)。

## Try it

```bash
pnpm add -D @kiwa/observability
```

Migration guide (additive-only、 breaking change なし):

- [v1.34 → v1.35 migration guide](https://cardene777.github.io/kiwa/migrations/v1.34-to-v1.35)
- [Observability real-driver testing SSOT concept doc](https://cardene777.github.io/kiwa/concepts/observability-real-driver-testing)

## v2.0 で解決したい問題

- Multi-version Vitest matrix — Vitest 1.x vs 2.x vs 3.x parity check
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- Coverage 100 % milestone
- Cache depth II — Dragonfly + KeyDB failover + Redis cluster resharding + eviction ML
- Queue depth II — BullMQ Pro + Inngest Fn v2 + AWS SQS FIFO + RabbitMQ federation
- AI-LLM depth II — Anthropic Messages Batch API + OpenAI Realtime API + Vercel AI SDK v4 + LangGraph fan-out
- Search depth II — Meilisearch cluster + Algolia rules + Typesense sharding + vector hybrid re-ranking
- L2 depth — Base / Arbitrum / Optimism / Scroll block-space fidelity
- ZK depth — Noir / Circom / RISC Zero test harness
- IoT depth — MQTT / CoAP / LWM2M
- DB depth III — SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB
- Streaming depth III — Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity
- Auth depth III — WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials
- Perf-harness sweep II — real-machine baseline、 macOS ARM64 + Linux x86_64 + Windows x86_64

これらのうちどれを v2.0 に land すべきかの feedback を GitHub Discussions で募集中。

## Thanks

v1.35 sub-Issue を review していただいた方、 `@kiwa/observability` v2.1 pre-release を試していただいた方、 縦深化 pair pattern SSOT を 7-pair grid (3-stage 拡張 2 例) に整理する議論に付き合っていただいた方、 ありがとうございます。 v2.0 へ。
