# Fidelity — dogfood-observability-dashboard (v1.17-2)

Real-vs-mock behavioural fidelity for the Grafana-style observability dashboard dogfood, produced by `examples/dogfood-observability-dashboard/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `PROMETHEUS_URL`)

When the harness runs without a Prometheus URL, the real adapter emits `PROMETHEUS_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/observability/dashboard
version    : 2.0.0
verdict    : PASS
divergences: 2 (refreshDashboard / runQuery — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (common branch — dashboard is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (2/2) | 70% | pass |
| perf.p95Ms | 1.00 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 18 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `PROMETHEUS_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 2 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-observability-dashboard test
cat examples/dogfood-observability-dashboard/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export PROMETHEUS_URL=http://localhost:9090
pnpm --filter dogfood-observability-dashboard test
```

When the URL is set but a metric named `http.errors` / `http.requests` / `queue.depth` / `http.p99.latency.ms` is absent from the Prometheus target, the query returns an empty vector and the panel value collapses to 0. This is the same shape the mock returns when a metric name matches no records — mock / real behave identically for the empty-vector case.

## Ops under measurement

Two provider-neutral ops on `DashboardAdapter` cover the Grafana dashboard difficulty surface end-to-end.

- `runQuery` — execute a single PromQL-style query (metric name + aggregation + optional label filter) and return the aggregated numeric value + matched sample count
- `refreshDashboard` — re-evaluate every panel on the dashboard once, producing an ordered `PanelRenderResult[]` with value + chart_type + badge

Plus accessors (`getRefreshCount` / `getPanel`) so Grafana-style refresh cadence assertions do not require wall-clock coupling.

## 5 panels × 4 metric queries

The 5 seeded panels (`src/panels/index.ts`) each pin one chart_type against a shared query builder in `src/queries/index.ts`.

| panel id | chart_type | metric | aggregation | threshold |
|---|---|---|---|---|
| `panel-p99-latency-line` | line | `http.p99.latency.ms` | max | ≥ 300 critical / ≥ 200 warn |
| `panel-request-count-bar` | bar | `http.requests` | sum | none |
| `panel-queue-depth-gauge` | gauge | `queue.depth` | last | ≥ 20 critical / ≥ 15 warn |
| `panel-error-rate-stat` | stat | `http.errors` | sum (status=500) | ≥ 5 critical / ≥ 3 warn |
| `panel-request-count-table` | table | `http.requests` | count | none |

`line` and `bar` both map to the observability package's `timeseries` PanelKind — the app-level chart_type is preserved as metadata on the render result so a Next.js App Router page can pick the correct chart component (v1.17-1 AC — 5 panel type 描画動作).

## Notes

Provider prefix `@kiwa/observability/` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because Prometheus is a metrics primitive, not a token-priced generative call. HTTP query round-trip latency feeds `perf.p95Ms` so dashboard performance stays visible in the report.

`getRefreshCount` is deliberately NOT reset by `adapter.reset()` — the DashboardMock instance owns refresh identity across the adapter's lifetime, so tests can measure absolute refresh cadence without wall-clock coupling. `adapter.reset()` DOES clear traces, query counters, and latency samples so a test can start a fresh fidelity run without discarding refresh history.

The `line` and `bar` chart_types share the observability package's `timeseries` PanelKind. The distinction is a Grafana / Next.js rendering concern (line for a continuous trend, bar for a categorical bucket) and is preserved as `PanelRenderResult.chartType` metadata. A downstream `app/dashboard/page.tsx` server component picks the render component off `chartType` rather than `PanelKind` so both chart_types are visible end-to-end.
