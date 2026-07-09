# kiwa v1.35 released — Observability 深化 II (@kiwa-lab/observability v2.1.0 + 8 axis advanced observability + 3 dogfood app + 縦深化 pair 第 7 pair 連続化 + 13 milestone snippet streak)

v1.35 is out. v1.14 (observability v1 3 provider mock: OpenTelemetry / Datadog / Sentry) → v1.17 (observability v2 Grafana-style DashboardMock + AlertManager routing + trace flame graph + LogCorrelationIndex) → **v1.35 (observability v2.1 advanced 8 axis + 4 provider × 8 axis fidelity harness + real driver env-gate)** の **3 段深化拡張 pattern** (v1.14→v1.23→v1.33 Payment 3 段拡張 pattern を Observability に転写して 2 例目、 縦深化 pair pattern 第 7 pair 連続化)。 v1.30 quality gate maximum grid (13 axis) を observability real driver に適用、 kiwa の縦深化戦略 SSOT を observability production layer に拡張した milestone。

## What shipped

- **`@kiwa-lab/observability` v2.0.0 → v2.1.0 minor bump**。 v2.0 API は完全維持 (additive-only 契約)。 v1.13+ 単一 publish surface pattern に沿う single-surface bump (v1.34 pair minor bump から通常運用に復帰)。
- **v1.35-1 observability v2.1 8 axis advanced semantics** (Issue #1061)。 `packages/observability/src/semantics/*` に 1 axis = 1 file の pure state machine helper を実装。 slo-burn-rate (SLO/SLI + error budget + multi-window multi-burn-rate 5m/1h/6h/3d alert + budget consumption) / red-use-golden-signals (RED Rate/Errors/Duration + USE Utilization/Saturation/Errors + four golden signals + service dependency graph) / exemplar-tracing (trace-to-metric exemplar + metric-to-trace navigation + histogram bucket exemplar + Prometheus native histogram) / otel-advanced (OpenTelemetry batch processor + resource detection + W3C context propagation traceparent/tracestate + baggage + semantic conventions v1.27) / log-correlation-advanced (structured log + trace_id/span_id auto-injection + LogQL + PromQL join + span event correlation) / alert-routing-advanced (silence + inhibit + escalation ladder + oncall rotation + PagerDuty/Slack/OpsGenie routing) / continuous-profiling (pyroscope/parca profile + eBPF profiler + on-CPU/off-CPU/memory profile + flame graph + depth-first flatten) / cardinality-control (high-cardinality detection + label reduction + histogram/summary/sketch DDSketch/t-digest + cardinality budget enforcement) の 8 axis を統一実装、 4 provider (Grafana OSS / Prometheus / Loki / OpenTelemetry Collector) × 8 axis = 32 cell fidelity grid (v1.17 v2.0 6 axis base + v1.35 v2.1 8 axis advanced の縦横 SSOT 拡張) を確立、 250+ semantics behavior test 追加。
- **v1.35-2 dogfood-observability-slo-app v2** (Issue #1063)。 SLO burn rate + error budget + multi-window multi-burn-rate alert 5m/1h/6h/3d + Prometheus alertmanager mock + real driver env-gate。 SLO SSOT walkthrough app。
- **v1.35-3 dogfood-otel-exemplar-app v2** (Issue #1064)。 OpenTelemetry Collector + exemplar tracing + trace-to-metric + baggage propagation + W3C context propagation traceparent/tracestate。 OTel Collector real driver env-gate 経路。
- **v1.35-4 dogfood-profiling-app 新規** (Issue #1065)。 Continuous profiling + pyroscope + eBPF + on-CPU/off-CPU/memory profile + flame graph render。 pyroscope testcontainers real driver 経路。
- **v1.35-5 docs 補強** (Issue #1066)。 `docs/tutorials/70-slo-burn-rate.md` (SLO/SLI + error budget + multi-window multi-burn-rate alert walkthrough) + `docs/tutorials/71-otel-exemplar.md` (OpenTelemetry exemplar + baggage + W3C context walkthrough) + `docs/tutorials/72-continuous-profiling.md` (Continuous profiling + pyroscope + eBPF + on-CPU/off-CPU/memory profile walkthrough) + `docs/migrations/v1.34-to-v1.35.md` (additive-only、 breaking change 0) + `docs/concepts/observability-real-driver-testing.md` (8 axis SSOT + 4 provider × 8 axis = 32 cell grid + provider `_URL` env-gate pattern + KIWA_MODE=real env-gate) + `packages/observability/tests/docs-tutorial-v1.35.test.ts` snippet validation で **13 milestone 連続 snippet validation pattern** (v1.23-v1.35) 達成。
- **v1.35-6 publish** (Issue #1067, this PR)。 `.claude-plugin/plugin.json` 1.34.0 → 1.35.0 + description v1.35 marker + observability keywords + Roadmap ✅ v1.35 row + announcement 4 file + release-smoke `v1-35-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_35_PAGES` (5 page render check) + `pnpm run release` 経由 npm publish (`@kiwa-lab/observability` v2.1.0) + `/docs-publish-kiwa` 経由 gh-pages 反映。

## Numbers

- **6 sub-Issues resolved** (#1061 / #1063 / #1064 / #1065 / #1066 / #1067)
- **6 PRs merged** (v1.35-1 through v1.35-6)
- **1 npm minor bump** (`@kiwa-lab/observability` v2.0.0 → v2.1.0) — kiwa runtime fixture **35 packages** 維持 (observability 既存 package の minor 拡張)
- **8 axis advanced observability semantics** (slo-burn-rate + red-use-golden-signals + exemplar-tracing + otel-advanced + log-correlation-advanced + alert-routing-advanced + continuous-profiling + cardinality-control)
- **32 cell fidelity grid** (4 provider × 8 axis = 32 cell、 v1.17 v2.0 6 axis grid と縦横 SSOT 拡張で共存)
- **3 dogfood observability app** (observability-slo-app v2 + otel-exemplar-app v2 + profiling-app 新規)
- **13 milestone 連続 snippet validation streak** (v1.23-v1.35) — payment-v1.23 / edge / perf-harness / orm-v1.26 / quality-metrics / realtime / release-invariants / a11y / streaming / orm-v1.32 / payment-v1.33 / frontend-v1.34 / observability-v1.35

## Why 縦深化 pair pattern 第 7 pair 連続化

kiwa milestone は縦深化 pair pattern (基礎 mock milestone → 深化 II milestone で real driver + advanced semantics) を **7 pair 連続確立**。 特に Observability は **3 段深化拡張** (v1.14 → v1.17 → v1.35) を採用、 Payment (v1.14 → v1.23 → v1.33) と同じ 3 段拡張 pattern を Observability に転写した 2 例目。

- **Auth pair (v1.21 → v1.22)** ... `@kiwa-lab/auth` v0.4 4 protocol adapter (mock only) → Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver + a11y axe-core gate)
- **Realtime pair (v1.13 → v1.28)** ... `@kiwa-lab/realtime` v0.1 4 provider 5 base semantics (mock only) → WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
- **Streaming pair (v1.20 → v1.31)** ... `@kiwa-lab/streaming` v0.1 3 provider 5 semantics (mock only) → Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)
- **Database pair (v1.14 → v1.32)** ... `@kiwa-lab/orm` v0.1-v0.9 3 provider × 3 backend + 8 base semantics (v1.26) → v0.10 8 advanced semantics + real driver env-gate + Postgres logical replication + MySQL cluster + SQLite WAL/FTS5
- **Payment pair (v1.14 → v1.23 → v1.33)** ... `@kiwa-lab/payment` v0.1-v0.2 3 provider webhook (v1.14) → v0.3 9 base billing semantics (v1.23) → v0.4 8 advanced billing II semantics + real driver env-gate + Stripe Connect + Paddle Billing v2 + Lemon Squeezy license (3 段拡張 pattern 1 例目)
- **Frontend pair (v1.16 → v1.34)** ... `@kiwa-lab/component` v0.1-v0.2 3 target 6 base semantics → v0.3 + `@kiwa-lab/nextjs` v1.2 8 advanced frontend semantics + real driver env-gate + Next.js 15 App Router + Storybook 8 MDX + Playwright CT + Chromatic
- **Observability pair (v1.14 → v1.17 → v1.35、 this)** ... `@kiwa-lab/observability` v1.0 3 provider mock (v1.14 OpenTelemetry/Datadog/Sentry) → v2.0 Grafana-style DashboardMock + AlertManager routing + trace flame graph + LogCorrelationIndex (v1.17) → v2.1 8 advanced observability semantics + real driver env-gate + Grafana OSS + Prometheus + Loki + OTel Collector (3 段拡張 pattern 2 例目)

7 pair 連続化 (うち 3 段拡張 pattern は 2 例) で kiwa の縦深化戦略 SSOT が observability production layer まで拡張された。 basic mock → advanced real driver の 2 phase pair を **7 領域** (auth / realtime / streaming / database / payment / frontend / observability) に横展開する pattern が確立、 次 pair 候補 (Cache v1.14 → depth II or Queue v1.14 → depth II or AI-LLM v1.15 → depth II or Search v1.15 → depth II) に応用できる basis を提供。

## 24 → 25 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (Release invariants SSOT) → v1.30 (A11y sweep) → v1.31 (Streaming 深化 II) → v1.32 (Database 深化 II) → v1.33 (Payment 深化 II) → v1.34 (Frontend 深化) → **v1.35 (Observability 深化 II)**。 v1.11 以降 25 milestone 連続完遂、 全 sub-Issue land 維持。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache depth II (Dragonfly + KeyDB failover + Redis cluster resharding + eviction ML)
- Queue depth II (BullMQ Pro + Inngest Fn v2 + AWS SQS FIFO + RabbitMQ federation)
- AI-LLM depth II (Anthropic Messages Batch API + OpenAI Realtime API + Vercel AI SDK v4 + LangGraph fan-out)
- Search depth II (Meilisearch cluster + Algolia rules + Typesense sharding + vector hybrid re-ranking)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth III (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Streaming depth III (Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity)
- Auth depth III (WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials)
- Perf-harness sweep II (real-machine baseline、 macOS ARM64 + Linux x86_64 + Windows x86_64)

Feedback welcome on which of these should land next.

## Try it

```bash
pnpm add -D @kiwa-lab/observability
```

See the [migration guide](https://cardene777.github.io/kiwa/migrations/v1.34-to-v1.35) for upgrade notes. Zero breaking changes.

## Thanks

Thanks to everyone who reviewed the v1.35 sub-Issues, tested `@kiwa-lab/observability` v2.1 pre-release, and helped shape the 縦深化 pair pattern SSOT into a 7-pair grid (with 2 examples of the 3-stage 拡張 pattern). On to v2.0.
