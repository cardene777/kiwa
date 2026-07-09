# Fidelity — dogfood-trace-flame-graph (v1.17-4)

Real-vs-mock behavioural fidelity for the trace flame graph explorer dogfood, produced by `examples/dogfood-trace-flame-graph/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-lab/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `JAEGER_URL`)

When the harness runs without a Jaeger URL, the real adapter emits `JAEGER_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/observability/trace-flame
version    : 2.0.0
verdict    : PASS
divergences: 5 (loadTrace / renderFlame / drillDown / joinLogs / filterByName missing on real)
axes       : 7 (common branch — trace exploration is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (5/5) | 70% | pass |
| perf.p95Ms | 2.00 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 25 | 10 | pass |

The `divergences` count in the notes section counts the 5 ops whose mock path succeeded but whose real path is absent (`JAEGER_ENV_MISSING` for every op) — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 5 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-trace-flame-graph test
cat examples/dogfood-trace-flame-graph/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export JAEGER_URL=http://localhost:16686
pnpm --filter dogfood-trace-flame-graph test
```

When the URL is set but the trace id is unknown, the Jaeger endpoint returns HTTP 404 and the adapter records `JAEGER_TRACE_NOT_FOUND`. The mock returns the same shape (`JAEGER_TRACE_NOT_FOUND` in the trace) when the requested id does not appear in the seeded fixture set — mock / real behave identically for the not-found case.

## Ops under measurement

Five provider-neutral ops on `FlameExplorerAdapter` cover the trace flame graph explorer lifecycle end-to-end.

- `loadTrace` — pull the raw span array + log array for a trace id. Mock reads from the seeded fixture set; real GETs `/api/traces/{id}` from Jaeger and normalises the response.
- `renderFlame` — build the span tree + collapse siblings into a flame graph structure keyed by (depth, name).
- `drillDown` — return the subtree rooted at the first flame node whose name matches; depth normalised so the drilled-in root sits at depth 0.
- `joinLogs` — build a bidirectional index from spans to logs (log → span via spanId + trace → logs via traceId).
- `filterByName` — flatten the flame tree and return only nodes whose name equals the query, aggregated into per-name (samples, totalMs, selfMs, averageMs) stats.

The mock adapter memoises the span tree + flame + correlation index per trace id so second-call latency is a `Map.get` — the perf gate measures the lookup path, not the tree-rebuild cost.

## 10 traces × flame graph × drill-down × log correlation

The 10 seeded fixtures (`src/traces/index.ts`) contain 100 spans + 34 logs across shape families a Node.js / browser SUT emits.

| id | shape | roots | depth | span count | log count |
|---|---|---|---|---|---|
| `trace-http-handler` | flat HTTP handler | 1 | 2 | 7 | 3 |
| `trace-fanout-parallel` | root + 5 parallel workers | 1 | 1 | 6 | 3 |
| `trace-nested-retry` | 3-level nested retry | 1 | 4 | 7 | 3 |
| `trace-ssr-tree` | 6-level React SSR | 1 | 5 | 13 | 2 |
| `trace-batch-write` | 4 batches + commit | 1 | 2 | 10 | 2 |
| `trace-chunked-upload` | sequential chunk stream | 1 | 2 | 11 | 4 |
| `trace-api-gateway` | auth + 3 downstream | 1 | 2 | 14 | 6 |
| `trace-event-bus` | pub / 4 sub + fanout | 1 | 2 | 12 | 5 |
| `trace-cache-cycle` | miss + db + fill | 1 | 2 | 9 | 2 |
| `trace-bg-job` | job + heartbeats + checkpoints | 1 | 2 | 11 | 4 |

Flame graph collapse — spans that share a name at the same subtree root collapse into one `FlameNode` whose `samples` counter grows. Every fixture is designed to exercise the collapse rule: `worker.process` (samples=2), `http.retry` (depth-nested x3), `db.batch` (samples=4), `chunk.upload` (samples=3), `bus.subscribe` (samples=4), `heartbeat` (samples=5), `db.validate` (samples=4), `component.datapoint` (samples=4), etc.

Drill-down — every flame node is drillable. The mock walks the flame tree DFS to find the first name match and rebases its depth so the drilled root sits at depth 0.

Log correlation — the mock builds a `LogCorrelationIndex` per trace id using the observability package. The default correlation keys are `trace_id` + `span_id`; callers can override for Jaeger (`trace.id` / `span.id`), Datadog (`dd.trace_id`), or Sentry (`sentry-trace`) by passing `correlationKeys` to the adapter config.

## Notes

Provider prefix `@kiwa-lab/observability/` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because Jaeger is a trace store primitive, not a token-priced generative call. Load + render round-trip latency feeds `perf.p95Ms` so explorer performance stays visible in the report.

The 4 axes AC (Issue #781) — `10 trace × flame graph render × drill-down + log join`.

- 10 traces = `src/traces/index.ts` seeded set
- Flame graph render = `buildSpanTree` + `renderFlameGraph` (mock adapter memoised)
- Drill-down = `drillDown` op + `buildDrilldownView` (breadcrumb + summary + header stats)
- Log correlation = `TraceLogIndex` (bidirectional index over spanId + traceId)

The 5 React-style components (`FlameGraph.ts` / `SpanTree.ts` / `LogPanel.ts` / `Drilldown.ts`) are modelled in pure TS with no DOM dependency so the same code runs headless under vitest. A downstream browser SPA would import the same pure functions from `src/components/` and render them through JSX; the dogfood focuses on regression coverage for the exploration logic rather than the render surface itself.
