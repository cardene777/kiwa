# kiwa v1.17 released — Observability v2 (dashboard + alert + trace flame graph + log correlation)

v1.17 is out. After v1.16's component test vertical (`@kiwa-lab/component` v0.1 unifying Storybook 8 + Playwright CT + Chromatic), v1.17 turns to the **SaaS observability stack** every production team already ships: Grafana-style dashboards, Prometheus AlertManager-style routing, trace flame graphs, and log ↔ span correlation — four additional axes on top of the v1.14 telemetry mock foundation.

## What shipped

- **`@kiwa-lab/observability` v2.0** (major bump) — 4 additional axes over the v1.1 telemetry mock (v1.14-4 land). Zero breaking changes to v1.0 (`renderDashboard` / `detectFlaky` / `analyzeSpecCoverage` / `checkThresholds`) or v1.1 (`TelemetryCollector` + `createOtelMock` / `createDatadogMock` / `createSentryMock`) surfaces; the major bump signals the "Observability v2" milestone with 11 new public exports + 13 fixture builders.
  - `DashboardMock` + `buildDashboardMock` — bind a dashboard to a `TelemetryCollector`, evaluate N panel queries (`sum` / `avg` / `max` / `min` / `count` / `last`) with optional tag filter + time window, attach `PanelThreshold[]` for `ok` / `warn` / `critical` badge selection. `refresh()` returns `PanelResult[]` and increments `refreshCount`; `panel(id)` looks up by id from the most recent results.
  - `AlertRouter` — register `AlertRule[]` against a `TelemetryCollector`; `evaluate()` transitions `pending → firing` under a `forSamples` gate and resolves back when the metric drops. `setRoute` walks a nested `RouteEntry` tree (deepest match wins). `addSilence` suppresses fires while the label match holds and `expiresAt` is in the future. `setEscalation` + `tickEscalation()` walks a state machine so kiwa tests can assert "reached tier 2 at t=15min" without any wall clock.
  - `buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` — pure transforms over `SpanRecord[]` (v1.1 shape unchanged) that reconstruct the span parent chain, compute `totalMs` / `selfMs`, collapse siblings by name into `FlameNode` (samples counted), and extract a subtree with depth normalized to 0. Orphan spans (parent not found) become roots.
  - `LogCorrelationIndex` + `correlateLogsAndSpans` — build a bidirectional index from `LogRecord[]` and `SpanRecord[]`; look up `logsForSpan` / `logsForTrace` / `spansForTrace` / `linkAll`. Configurable `CorrelationKeys` (`traceIdKey` / `spanIdKey` / `altTraceIdKeys`) covers OpenTelemetry (`trace_id` / `span_id`) + Datadog (`dd.trace_id` / `dd.span_id`) + Sentry (`sentry-trace`) conventions.
  - Fixture builders — `panel_httpErrorRate` / `panel_p99Latency` / `panel_queueDepth`, `rule_errorRateCritical` / `rule_latencyDegraded` / `rule_queueBackpressure`, `defaultRoute` / `escalation_pagerDutyTwoStep` / `silence_maintenanceWindow`, `trace_httpHandler` / `trace_fanoutParallel` / `trace_nestedRetry`, `logs_forHttpTrace`. 40+ new behavior tests (67 added, 145 total pass).
- **`examples/dogfood-observability-dashboard`** — Next.js App Router style Grafana dashboard driven behind a provider-neutral `DashboardAdapter`. 5 canonical panels (line / bar / gauge / stat / table) — 1 per `chart_type`, backed by a shared PromQL-style query builder module; `line` and `bar` both map to the observability package's `timeseries` PanelKind, and the app-level `chart_type` is preserved on `PanelRenderResult.chartType` so a real `app/dashboard/page.tsx` server component can pick the correct chart component. `makeMockAdapter` seeds a `TelemetryCollector` with 4 metric names (`http.errors` / `http.p99.latency.ms` / `queue.depth` / `http.requests`) and drives a `DashboardMock`; `makeRealAdapter` talks to a Prometheus instant-query endpoint (`GET /api/v1/query`) when `PROMETHEUS_URL` is set. 22 vitest tests (18 e2e mock + 3 fidelity + 1 emit) + 2 perf specs. 7-axis release gate verdict PASS.
- **`examples/dogfood-alert-orchestrator`** — Node.js style Prometheus AlertManager orchestrator behind a provider-neutral `AlertOrchestratorAdapter`. 10 canonical alert rules (4 threshold + 3 rate + 3 anomaly). Rate + anomaly kinds compile down to threshold checks in the mock adapter (rate divides cumulative counters by elapsed window; anomaly compares latest sample to trailing mean + `stddevMult × stddev`). 3-level routing tree (`severity → team → channel`) with 6 leaves so every seeded rule has a distinct receiver. Silence store with literal + regex label matching (regex compilation cached per silence). Escalation ladder L1 30s → L2 5min → L3 30min mirrors PagerDuty's 3-tier policy. `makeRealAdapter` POSTs fires to AlertManager `/api/v2/alerts` when `ALERTMANAGER_URL` is set. 27 vitest tests + 2 perf specs. 7-axis release gate verdict PASS.
- **`examples/dogfood-trace-flame-graph`** — React-style trace flame graph explorer behind a provider-neutral `FlameExplorerAdapter`. 10 canonical trace fixtures (100 spans + 34 logs) across flat HTTP handler / fanout-parallel workers / 3-level nested retry / 6-level React SSR / batched DB write / chunked upload stream / API gateway fan-out / async event bus / cache miss + fill cycle / long-running background job with heartbeats + checkpoints. 5 pure-TS components (`FlameGraph` / `SpanTree` / `LogPanel` / `Drilldown` / `TraceLogIndex`) usable directly from a browser SPA render path without DOM dependency. `makeMockAdapter` uses a memoised per-`traceId` cache so second-call latency measures Map lookup rather than tree rebuild. `makeRealAdapter` GETs Jaeger `/api/traces/{id}` when `JAEGER_URL` is set. 29 vitest tests + 2 perf specs. 7-axis release gate verdict PASS.
- **docs** — 3 new tutorials (22 Observability dashboard / 23 Alert orchestrator / 24 Trace flame graph) + additive migration guide v1.16 → v1.17 + concept doc `observability-v2-testing.md` documenting the **4 additional axes × 6 semantic axes** (panel query resolution / threshold badge / routing tree / silence + escalation / span aggregate / log ↔ span correlation) as the SSOT. VitePress sidebar refreshed; gh-pages published via `/docs-publish-kiwa`.

## Numbers

- **6 sub-Issues resolved** (#778-#783)
- **6 PRs merged** (#784-#788 + this publish PR)
- **1 major version bump** (`@kiwa-lab/observability` v1.2 → v2.0.0)
- **3 new dogfood apps** with fidelity reports feeding the 7-axis release gate
- **40+ new behavior tests** in the harness + **78 dogfood tests** (22 + 27 + 29) all pass

## 7-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → **v1.17 (Observability v2)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Framework depth (SolidJS / Fresh / HonoJS)
- Coverage 100% milestone
- Blockchain depth (Reth Rust Ethereum execution client + Foundry-rs 深化 + dApp e2e 拡張)
- Cache / Data depth (Dragonfly / Materialize / Neon)

Feedback welcome on which of these should land next.
