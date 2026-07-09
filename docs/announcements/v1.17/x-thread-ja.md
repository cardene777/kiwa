1/ kiwa v1.17 released。 Observability v2 milestone です。 v1.16 (component test 縦軸、 Storybook 8 + Playwright CT + Chromatic) の後、 v1.17 は 2026 SaaS production team のほぼ全てが導入済の observability stack (Grafana dashboard + Prometheus AlertManager + trace flame graph + log correlation) を 1 統一 mock harness に land しました。

2/ `@kiwa-lab/observability` v2.0 (major bump) — v1.14-4 で land した v1.1 telemetry mock 3 provider (OpenTelemetry / Datadog / Sentry) を基盤に、 4 追加軸を land。 v1.0 (`renderDashboard` / `detectFlaky` / `analyzeSpecCoverage` / `checkThresholds`) + v1.1 (`TelemetryCollector` + 3 provider mock) surface は 100% backward compatible。 11 新 export + 13 fixture builder。

3/ `DashboardMock` — `TelemetryCollector` に bind して N panel query を 6 種 aggregate (`sum` / `avg` / `max` / `min` / `count` / `last`) で評価、 optional tag filter + time window + `PanelThreshold[]` で ok / warn / critical badge 選定。 `refresh()` は `PanelResult[]` 返却 + `refreshCount` tick。

4/ `AlertRouter` — `AlertRule[]` を collector に登録、 `pending → firing` を `forSamples` gate 経由で駆動、 `resolved` は metric 下降時に自動遷移。 `setRoute` は nested `RouteEntry` tree を deepest match で解決、 `addSilence` は literal + regex label match 対応、 `tickEscalation()` state machine で「t=15min で tier 2 到達」 を wall clock なしで assert 可能。

5/ `buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` — `SpanRecord[]` (v1.1 shape 無変更) の pure transform、 span parent chain 復元 + `totalMs` / `selfMs` 算出 + 同名 sibling を `FlameNode` に集約 (samples 数計上) + 部分木を depth 0 normalize で drill-down 抽出。 orphan span (parent 未検出) は root 昇格。

6/ `LogCorrelationIndex` + `correlateLogsAndSpans` — `LogRecord[]` + `SpanRecord[]` から双方向 index 構築、 `logsForSpan` / `logsForTrace` / `spansForTrace` / `linkAll` を提供。 configurable `CorrelationKeys` で OpenTelemetry (`trace_id` / `span_id`) + Datadog (`dd.trace_id`) + Sentry (`sentry-trace`) の 3 convention を統一 API で扱う。 40+ 新 behavior test / 145 total pass。

7/ dogfood app 3 種 — dashboard (Next.js App Router + Grafana 型 5 panel × 22 test)、 alert-orchestrator (Node.js + AlertManager 型 10 rule + 3 level route + escalation × 27 test)、 trace-flame-graph (React SPA + Jaeger 型 10 fixture (100 span + 34 log) × 29 test)。 全 3 app が mock vs real fidelity harness 経由で 7 軸 release gate PASS。

8/ docs — tutorial 3 本 (22 dashboard / 23 alert / 24 flame graph) + additive migration v1.16 → v1.17 + concept doc `observability-v2-testing.md` (4 追加軸 × 6 semantic axis SSOT)。 VitePress sidebar + gh-pages 反映済。 Roadmap: https://github.com/cardene777/kiwa/issues/777 — v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17 の 7 milestone 連続完遂。
