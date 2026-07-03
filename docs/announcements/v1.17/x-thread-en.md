1/ kiwa v1.17 is out — Observability v2 milestone. After v1.16's component test vertical (Storybook 8 + Playwright CT + Chromatic), v1.17 lands the SaaS observability stack every production team already ships: Grafana dashboards + Prometheus AlertManager routing + trace flame graphs + log ↔ span correlation.

2/ `@kiwa-test/observability` v2.0 (major bump) — 4 additional axes on top of the v1.1 telemetry mock foundation (v1.14-4 OpenTelemetry / Datadog / Sentry). Zero breaking changes to v1.0 or v1.1 surfaces; 11 new public exports + 13 fixture builders under the "Observability v2" module signal.

3/ `DashboardMock` — bind a dashboard to a `TelemetryCollector`, evaluate N panel queries (`sum` / `avg` / `max` / `min` / `count` / `last`) with optional tag filter + time window, attach `PanelThreshold[]` for `ok` / `warn` / `critical` badge. `refresh()` returns `PanelResult[]` + increments `refreshCount`.

4/ `AlertRouter` — `pending → firing` transitions under a `forSamples` gate, `setRoute` walks a nested `RouteEntry` tree (deepest match wins), `addSilence` with literal + regex label match, `tickEscalation()` state machine so kiwa tests assert "reached tier 2 at t=15min" without any wall clock.

5/ `buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` — pure transforms over `SpanRecord[]` compute `totalMs` / `selfMs`, collapse siblings by name into `FlameNode` (samples counted), extract subtree with depth normalized to 0. Orphan spans become roots.

6/ `LogCorrelationIndex` + `correlateLogsAndSpans` — bidirectional index over `LogRecord[]` + `SpanRecord[]`. Configurable `CorrelationKeys` cover OpenTelemetry (`trace_id` / `span_id`) + Datadog (`dd.trace_id`) + Sentry (`sentry-trace`) in one API. 40+ new behavior tests, 145 total pass.

7/ dogfood apps — dashboard (Next.js App Router + Grafana 5 panel × 22 test) / alert-orchestrator (Node.js + AlertManager 10 rule + 3 level route + escalation × 27 test) / trace-flame-graph (React SPA + Jaeger 10 fixture (100 spans + 34 logs) × 29 test). All 3 hit release gate PASS with mock vs real fidelity harness.

8/ docs — 3 tutorials (22 dashboard / 23 alert / 24 flame graph) + additive migration v1.16 → v1.17 + concept doc `observability-v2-testing.md` (4 additional axes × 6 semantic axis SSOT). VitePress + gh-pages published. Roadmap: https://github.com/cardene777/kiwa/issues/777 — v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17: 7 milestones in a row.
