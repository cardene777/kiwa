# Observability v2 testing — dashboard, alert, trace flame graph, log correlation

`@kiwa/observability` v1.1 (v1.14-4) shipped provider-flavoured mocks for OpenTelemetry / Datadog / Sentry. Every mock wrote into the same `TelemetryCollector` so the assertion code was provider-neutral at the **emit boundary**. That covers instrumentation coverage. It does not cover the **operational surface** that lives on top of that emitted data — the Grafana dashboard that renders the metrics, the AlertManager that pages the on-call, the Jaeger flame graph that a debugger drills into after an incident, or the log line a support engineer joins to a trace ID.

v1.17 adds 4 new axes on top of that v1.1 base so the whole SaaS observability wall is testable in-process, deterministically, without a real Prometheus / AlertManager / Jaeger.

## Why v1.1 collectors alone are not enough

The v1.1 collector answers "was this span emitted?", "did the counter increment?", "was this exception captured?". Those are unit-scoped questions about instrumentation. The real production observability wall raises 4 questions the collector cannot answer.

| Production question | Collector-only answer | What v2 adds |
|---|---|---|
| "The Grafana p99 latency panel went red — did the threshold badge fire correctly?" | not modelled — badges live in Grafana, not in the SDK | `DashboardMock` — panel + threshold + refresh cadence + badge assertions |
| "AlertManager paged the platform team at 03:00 — did the routing tree match the label set?" | not modelled — routing lives in AlertManager, not in the SDK | `AlertRouter` — rule + route + silence + escalation state machine |
| "Debugger drilled into the flame graph for span `db.query` — did the self-time look right?" | not modelled — flame graphs aggregate spans across shape, not per-span | `buildSpanTree` + `renderFlameGraph` + `drillDown` — tree + collapse + subtree |
| "Support engineer joined logs to trace `abc123` — did both sides carry the correlation attributes?" | not modelled — trace / log join is a query-time operation | `LogCorrelationIndex` — bidirectional lookup keyed on `trace_id` / `span_id` |

All 4 v2 axes read from the same `TelemetryCollector` sinks the v1.1 mocks populate. There is no v2-only writer — every v2 abstraction consumes the collector state that v1.1 already produces. That keeps the boundary consistent — instrumentation code stays untouched, only the assertion surface expands.

## The 4 v2 axes on one collector

The whole v2 API surface is a set of pure readers over the `TelemetryCollector`. Nothing writes to the collector except v1.1 provider mocks (OpenTelemetry / Datadog / Sentry). A test that already uses v1.1 gets v2 assertions for free — the same collector instance passes through.

```ts
import {
  AlertRouter,
  DashboardMock,
  LogCorrelationIndex,
  TelemetryCollector,
  buildSpanTree,
  createOtelMock,
  renderFlameGraph,
} from '@kiwa/observability';

const collector = new TelemetryCollector();
const otel = createOtelMock({ collector });
// ... SUT emits spans / metrics / logs into `collector` ...

// v2 axis 1 — dashboard
const dashboard = new DashboardMock({ id: 'sre', title: 'SRE', panels: [/* ... */] }, collector);
dashboard.refresh();

// v2 axis 2 — alert
const router = new AlertRouter(collector);
router.registerRule({ /* ... */ });
router.evaluate();

// v2 axis 3 — trace flame graph
const roots = buildSpanTree(collector.spans);
const flame = renderFlameGraph(roots);

// v2 axis 4 — log correlation
const index = new LogCorrelationIndex({ logs: collector.logs, spans: collector.spans });
```

## Axis 1 — dashboard render lifecycle

`DashboardMock` models the render lifecycle of a Grafana-style panel wall.

- A dashboard hosts N panels, each panel bound to one `MetricQuery` (`metricName` + `aggregation` + optional `tagFilter` + optional time window).
- `refresh()` re-evaluates every panel against the current collector state and returns a `PanelResult[]` with `value` / `matchedRecords` / `badge` / `refreshedAt`.
- `getRefreshCount()` exposes the refresh cadence so tests assert "3 refresh cycles happened" without wall-clock coupling.
- `panel(id)` looks up the most-recent result by id, so assertions read like `dashboard.panel('p99').badge === 'critical'`.

Threshold badges attach to numeric results deterministically — the first matching threshold in the panel's ordered `thresholds` array wins. That mirrors Grafana's "first match wins" semantics and makes the badge assertion stable across mock refreshes.

The mock does **not** model. rendering pixels (a UI concern that lives in the Grafana react tree, not the mock), the panel-plugin extension surface (a Grafana-plugin-manifest concern), templated variables in PromQL queries (a scripting concern that requires a real PromQL parser). The mock's SUT-agnostic contract stays on the query + aggregate + badge triangle — enough to catch the 3 most-common regressions ("threshold changed and no test caught it", "aggregation changed from `avg` to `p99` and no test caught it", "panel bound to the wrong metric and no test caught it") without pulling in a full Grafana embedded runtime.

## Axis 2 — alert lifecycle state machine

`AlertRouter` models the AlertManager 4-state lifecycle end-to-end.

- **pending** — a rule's predicate held on the last evaluation, but `forSamples` requires N holds in a row before firing. `AlertRouter` keeps a per-rule `pendingCount` that increments on hold and resets on flip.
- **firing** — `pendingCount >= forSamples` triggers a `firing` state and the fire is routed through the tree. The deepest matching route wins (matches the AlertManager `routes[].match` semantics).
- **escalated** — an escalation ladder attached to the rule (`setEscalation`) walks the receiver chain at each `advanceEscalation()` call, emitting one `AlertReceiverEvent` per step whose `afterMs` has elapsed.
- **resolved** — the predicate flips back to `false`. `pendingCount` resets and the active fire transitions to `resolved`; no receiver events fire from `resolved` transitions.

Silences suppress by label match with an `expiresAt` window. A pending fire whose labels match any active silence never advances to `firing`. Callers can add / remove silences at any time; the router re-checks the silence store on every `evaluate()`.

The mock reproduces the 3 AlertManager decision points that surface in real incidents. routing hierarchy (severity → team → channel), silence-vs-fire race (silence added between two evaluations), and escalation walk (L1 → L2 → L3 with configurable `afterMs`). It intentionally does **not** model. the AlertManager gossip protocol (a cluster concern), the notification adapter integrations (Slack / PagerDuty / OpsGenie payload shapes are integration concerns), or the notification retry / dedup window (a delivery concern that requires wall-clock coupling).

## Axis 3 — trace aggregation and drill-down

`buildSpanTree` + `renderFlameGraph` + `drillDown` model the 3 flame graph operations a real debugger walks through during an incident.

- `buildSpanTree(collector.spans)` — build a tree of `SpanNode`s from the flat span array. Parent lookups happen by `parentSpanName`; when the parent is null the span becomes a root. Children preserve insertion order (which matches call order in the SUT, so a `worker` span emitted 3 times shows up as 3 siblings under the parent).
- `renderFlameGraph(roots)` — collapse siblings with the same name at the same depth into one `FlameNode` whose `samples` counts contributions. That matches how real flame graphs summarise fan-out (100 parallel `worker` spans render as 1 wide flame node with `samples = 100`).
- `drillDown(flame, 'db.query')` — extract the subtree rooted at the first node whose name matches. Depths are normalised so the drilled-in root sits at depth 0. Returns `null` when no matching node exists.

`selfMs` = `totalMs - sum(child.totalMs)`, which mirrors the Jaeger UI "self time" column. Open spans (`endedAt = null`) count towards `samples` but contribute `0` to numeric aggregates. That keeps the aggregate stable even when a test asserts on a snapshot mid-run.

The mock does **not** model. cross-service parent references (real distributed traces use `spanContext` with `traceParent` headers; the mock uses `parentSpanName` for in-process shapes), sampling / probability decisions (a real-tracer runtime concern), or wire encoding (OTLP / Zipkin / Jaeger Thrift are exporter concerns).

## Axis 4 — bidirectional log ↔ span correlation

`LogCorrelationIndex` builds one index over the collector's `.logs` and `.spans` sinks and answers 4 questions.

- `logsForSpan(spanId)` — logs whose `span_id` attribute equals the given id.
- `logsForTrace(traceId)` — logs whose `trace_id` attribute equals the given id.
- `spanById(spanId)` / `spansForTrace(traceId)` — the reverse direction.

The correlation keys are configurable — real SUTs mix conventions during migrations (OpenTelemetry canonical is `trace_id` / `span_id`, Datadog is `dd.trace_id`, Sentry uses `sentry-trace`). Pass `altTraceIdKeys` to bridge the gap without asking the SUT to normalise:

```ts
const index = new LogCorrelationIndex(
  { logs: collector.logs, spans: collector.spans },
  { traceIdKey: 'trace_id', altTraceIdKeys: ['dd.trace_id', 'sentry-trace'] },
);
```

The index is built once from the current collector state; callers that mutate the collector after building must rebuild. That is a deliberate design choice — it keeps every lookup `O(1)` and matches the "build the join index at query time" pattern real observability backends use for the same query surface.

The mock does **not** model. the retention policy (real backends drop old data), the fuzzy-time join for logs that lack correlation attributes (a heuristic that varies per backend), or the multi-line log parsing that turns stack traces into single events (a log-processor concern). It stays on the attribute-key join because that is the join real dashboards run 95% of the time.

## Fixtures — one-call scenario bootstrapping

`fixtures.ts` ships 3 panel builders, 3 alert rules, 3 trace shapes, and 1 log-set matched to the http-handler trace, plus a default route + escalation + silence. A test that wants a realistic SaaS observability wall in one call writes.

```ts
import {
  defaultRoute,
  panel_httpErrorRate,
  panel_p99Latency,
  panel_queueDepth,
  rule_errorRateCritical,
  rule_latencyDegraded,
  rule_queueBackpressure,
  trace_httpHandler,
  logs_forHttpTrace,
} from '@kiwa/observability';

const dashboard = new DashboardMock(
  { id: 'sre', title: 'SRE', panels: [panel_httpErrorRate(), panel_p99Latency(), panel_queueDepth()] },
  collector,
);

router.registerRule(rule_errorRateCritical());
router.registerRule(rule_latencyDegraded());
router.registerRule(rule_queueBackpressure());
router.setRoute(defaultRoute());
```

Every builder is pure — no side effects, no collector coupling. The test controls when the collector receives data (via v1.1 provider mocks) and when the v2 readers evaluate.

## Fidelity harness — mock vs real, per axis

Each v1.17 dogfood app (`examples/dogfood-observability-dashboard/`, `examples/dogfood-alert-orchestrator/`, `examples/dogfood-trace-flame-graph/`) ships a `flows/fidelity.ts` module that.

1. Runs the same 4-op / 5-op / 5-op surface through `makeMockAdapter()` — always available, driven by the v2 mock.
2. Runs the same surface through `makeRealAdapter()` — env-gated on `PROMETHEUS_URL` / `ALERTMANAGER_URL` / `JAEGER_URL`; falls back to `*_ENV_MISSING` traces when the connection env is absent.
3. Emits a `FidelityReport` with per-op traces, latency samples, and per-axis coverage summary that feeds `@kiwa/quality-metrics` release gate.
4. Writes the report as `quality-report/fidelity-latest.md` (git-ignored — CI reads this) and `quality-report/fidelity-latest.json` (machine-readable).

The report is hand-promoted to `docs/quality-reports/observability/<name>.md` when a release cuts. `evaluateReleaseGate` consumes the JSON directly and gates the release on the 7-axis pass (`@kiwa/observability/*` prefix stays on the common 7-axis branch — no token pricing to measure).

## What v2 does not model — SSOT

- **UI pixels** — dashboard panels have `value` + `badge` metadata; there is no `<canvas>` rendering. Real Grafana pixel differences (font, chart plugin, plot style) belong to a component-test harness (`@kiwa/component`), not observability.
- **Delivery mechanics** — `AlertReceiverEvent` records "receiver X saw fire Y at time Z". It does not simulate a Slack API round-trip, PagerDuty ack window, or OpsGenie retry ladder.
- **Wire encoding** — v2 reads from `TelemetryCollector`. The v1.1 provider mocks own the SUT emit boundary; OTLP / Zipkin / Jaeger Thrift serialisation happens outside the mock surface.
- **Distributed span context** — parent references use `parentSpanName` for in-process traces. A production trace across services carries a `traceParent` header per W3C Trace Context; that is an integration concern the mock does not simulate.
- **Retention** — logs / spans stay in the collector until the SUT clears it. Real observability backends drop data by TTL; the mock has no TTL.

The trade-off is explicit — v2 covers 4 axes that live above the SDK boundary at high fidelity, and stops at the network boundary. Wire, delivery, and pixel concerns route through other kiwa surfaces (integration tests, component tests, e2e tests) that own the right level of abstraction for each.

## Related reading

- [Tutorial 22 — Observability dashboard (panel + refresh + badge)](../tutorials/22-observability-dashboard)
- [Tutorial 23 — Alert orchestrator (rule + route + silence + escalation)](../tutorials/23-alert-orchestrator)
- [Tutorial 24 — Trace flame graph (span tree + drill-down + log correlation)](../tutorials/24-trace-flame-graph)
- [Migration guide — v1.16 → v1.17](../migrations/v1.16-to-v1.17)
- [Concept — Telemetry testing (span + metric + log aggregation SSOT)](./telemetry-testing)
- v1.17 milestone parent [#777](https://github.com/cardene777/kiwa/issues/777)
