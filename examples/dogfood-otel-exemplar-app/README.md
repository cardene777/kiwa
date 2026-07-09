# dogfood-otel-exemplar-app v1.35-3

Dogfood application that exercises the `@kiwa-lab/observability` v2.1 exemplar
+ otel-advanced axes end-to-end through a provider-neutral 16-op contract
satisfied by both a deterministic mock adapter and a `KIWA_MODE=real`
testcontainers-driven OpenTelemetry Collector + Jaeger + Prometheus + Loki
real adapter.

## Purpose

Prove the v2.1 exemplar + otel-advanced semantics track real OpenTelemetry
Collector + Jaeger + Prometheus behaviour closely enough that consumers can
trust the mock in unit tests. The fidelity harness diffs mock vs real traces
across 3 pipeline profiles (traces / metrics / logs) × 4 canonical W3C
baggage entry sets (session / user / tenant / feature-flag) and feeds the
divergence count into the `@kiwa-lab/quality-metrics` 13-axis release gate.

## Surface — 16 ops

The `OtelExemplarAdapter` contract is exposed through `OTEL_EXEMPLAR_HARNESS_OPS`:

1. `startPipeline` — start an OTel Collector pipeline session for a profile.
2. `detectResource` — detect resource attributes (`service.name` / `host.name`).
3. `enqueueSpan` — enqueue a span into the OTel batch processor.
4. `flushBatch` — flush the batch processor up to `maxBatchSize`.
5. `recordExemplar` — record an exemplar-attached metric point.
6. `attachTraceToMetric` — attach a trace pointer to a recorded metric.
7. `resolveMetricToTrace` — Grafana metric drill-in (metric spike → trace).
8. `resolveTraceToMetric` — Jaeger trace drill-out (span → RED metric).
9. `propagateBaggage` — propagate W3C baggage entries through the pipeline.
10. `extractW3CContext` — extract W3C traceparent + optional tracestate.
11. `exportOtlp` — export the current batch through OTLP HTTP.
12. `queryJaegerTrace` — query the Jaeger backend for a given traceId.
13. `queryPromExemplars` — scan Prometheus exemplars for a given metric.
14. `emitCorrelatedLog` — emit a structured log correlated by trace_id.
15. `reset` — drop all state (resettable across tests).
16. `resetVerified` — synthetic step the fidelity harness emits at end of run.

## Pipeline profiles

- `traces` — OTLP receiver, batch + resource + attributes processors, `otlp/jaeger` exporter.
- `metrics` — OTLP receiver, batch + resource + metricstransform processors, `prometheusremotewrite` exporter with exemplars.
- `logs` — OTLP receiver, batch + resource + attributes processors, `loki` exporter.

## Baggage sets

- `BAGGAGE_SESSION` — request-scoped session id (`session.id`).
- `BAGGAGE_USER` — authenticated user id + role (`user.id` / `user.role`).
- `BAGGAGE_TENANT` — multi-tenant tenant id + tier (`tenant.id` / `tenant.tier`).
- `BAGGAGE_FEATURE_FLAG` — active feature-flag ids for A/B experiments.

## Real driver env-gate

The real adapter reads `KIWA_MODE`, `KIWA_OTEL_COLLECTOR_URL`, `KIWA_JAEGER_URL`
and `KIWA_PROMETHEUS_URL`. When all four are set (`KIWA_MODE=real` + the 3
endpoints) the adapter walks the real path; otherwise every op emits the
sentinel `KIWA_OTEL_ENV_MISSING` on the trace so callers can budget the
fallback. Tests can bypass the env check with `forceEnvPresent: true`.

## Testing

```bash
pnpm test
```

The suite runs 5 test files:

- `pipeline-lifecycle.test.ts` — 24 tests covering the 16-op lifecycle.
- `exemplar-drill.test.ts` — 12 tests covering exemplar record + drill.
- `baggage-w3c.test.ts` — 16 tests covering baggage + W3C context.
- `real-driver-env-gate.test.ts` — 14 tests covering the KIWA_MODE gate.
- `emit-fidelity-report.test.ts` — 8 tests emitting the fidelity report.

Total: 74 tests. All 3 pipeline profiles × 4 baggage sets = 12 lifecycles are
driven through both adapters to exercise every canonical production combo.
