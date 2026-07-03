---
'dogfood-trace-flame-graph': patch
---

feat: v1.17-4 — new trace flame graph explorer dogfood app driven behind a provider-neutral `FlameExplorerAdapter`. Exercises the v1.17-1 `@kiwa-test/observability` `buildSpanTree` + `renderFlameGraph` + `LogCorrelationIndex` end-to-end against a live Jaeger HTTP API path.

- 10 canonical trace fixtures — 100 spans + 34 logs across the set covering flat HTTP handler / fanout-parallel workers / 3-level nested retry / 6-level React SSR / batched database write / chunked upload stream / API gateway fan-out / async event bus / cache miss + fill cycle / long-running background job with heartbeats + checkpoints. Every fixture is designed to stress the sibling-collapse rule (worker.process samples=2, http.retry nested x3, db.batch samples=4, chunk.upload samples=3, bus.subscribe samples=4, heartbeat samples=5, component.datapoint samples=4).
- 5 React-style components modelled in pure TS for headless test — `FlameGraph.ts` (layoutFlameGraph + summariseFlameGraph, stacked-bar layout + per-name aggregate), `SpanTree.ts` (buildSpanTreeRows + collapseSubtree, indented DFS tree + disclosure), `LogPanel.ts` (buildLogPanelRows + filterByLevel + filterBySpan, level-threshold + span-scope filter), `Drilldown.ts` (buildDrilldownView, breadcrumb + summary + header stats). The same pure functions can be imported straight into a browser SPA render path without any DOM dependency.
- `makeMockAdapter` — drives the v1.17-1 span tree + flame graph + log correlation helpers with a memoised per-traceId cache so second-call latency measures Map lookup rather than tree rebuild. Emits `TraceEvent[]` for every op so the fidelity harness can diff mock vs real op-by-op.
- `makeRealAdapter` — GETs Jaeger `/api/traces/{id}` when `JAEGER_URL` is set; normalises the Jaeger v3 payload (spanID + operationName + tags + logs, µs → ms) into the same `LoadedTrace` shape the mock returns. Downgrades to `JAEGER_ENV_MISSING` traces when absent or `JAEGER_FETCH_MISSING` when the runtime cannot fetch; `JAEGER_TRACE_NOT_FOUND` on HTTP 404.
- `createFlameService` — browser SPA style service (`focus()` / `drill()` / `filter()`) that a React `App.tsx` context provider would call into. `KIWA_MODE=mock` (default) / `KIWA_MODE=real` picks the adapter.
- `TraceLogIndex` — thin wrapper around v1.17-1 `LogCorrelationIndex` that adapts the observability SpanRecord shape onto the dogfood's own span shape. Overridable correlation keys default to `trace_id` / `span_id` (OpenTelemetry canonical); callers can point at Jaeger (`trace.id` / `span.id`), Datadog (`dd.trace_id`), or Sentry (`sentry-trace`).
- Fidelity harness — trace-diffing across mock vs real for all 5 ops under measurement (`loadTrace` / `renderFlame` / `drillDown` / `joinLogs` / `filterByName`). Feeds `@kiwa-test/quality-metrics` common 7-axis release gate (`@kiwa-test/observability/` prefix triggers the non-AI-LLM branch).
- 29 vitest tests (25 e2e mock + 3 fidelity + 1 emit) + 2 perf specs (mock 3-layer + live Jaeger 3-layer env-skip).
- Emits `quality-report/fidelity-latest.{json,md}`; canonical snapshot promoted to `docs/quality-reports/observability/trace-flame-graph.md`.

Refs #777 (v1.17 milestone), #781 (v1.17-4 sub-Issue).
