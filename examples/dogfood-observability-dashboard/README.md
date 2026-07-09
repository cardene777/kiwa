# dogfood-observability-dashboard

Dogfood app (v1.17-2) — a Next.js App Router style **Grafana dashboard** driven behind a provider-neutral surface. 5 panels (line / bar / gauge / stat / table) execute PromQL-style queries against the `@kiwa-lab/observability` `DashboardMock` (v1.17-1) so behavioural fidelity between the mock and a real Prometheus HTTP API can be measured side-by-side. The resulting fidelity report feeds `@kiwa-lab/quality-metrics` release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-lab/observability` `DashboardMock` + `TelemetryCollector`, deterministic metric aggregation + refresh cadence + badge)
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that talks to a Prometheus HTTP API when `PROMETHEUS_URL` is set. When the variable is missing the adapter reports each method as `PROMETHEUS_ENV_MISSING` so the fidelity harness records the gap without failing the test suite. When the URL is set but `globalThis.fetch` is unavailable (rare on modern Node), the adapter downgrades to `PROMETHEUS_FETCH_MISSING` — the same harness path, one level closer to real IO.

Real-mode envs.

- `PROMETHEUS_URL` — required to enable real mode (e.g. `http://localhost:9090`)
- `PROMETHEUS_TIMEOUT_MS` — optional, defaults to 5000

## Layout

```
src/
  adapters/
    interface.ts        -- provider-neutral dashboard contract
                           (runQuery / refreshDashboard / getRefreshCount / getPanel)
    mock.ts             -- kiwa mock adapter (DashboardMock backend, seeded collector)
    real.ts             -- Prometheus HTTP API adapter with graceful skip when env absent
  panels/
    index.ts            -- 5 canonical panels, 1 per chart type
  queries/
    index.ts            -- shared PromQL-style query builders
  flows/
    dashboard-flows.ts  -- initial load / refresh cycle / query matrix / alert badge
    fidelity.ts         -- trace-diffing harness that feeds @kiwa-lab/quality-metrics
  app/
    dashboard-page.ts   -- Next.js App Router style controller
                           (createDashboardPageController.load() / .refresh())
tests/
  e2e-mock-mode.test.ts        -- 18 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
  perf/
    observability-dashboard.perf.ts       -- 3-layer perf (mock)
    observability-dashboard.live.perf.ts  -- 3-layer perf (live Prometheus, env-skip)
```

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/observability/dashboard.md` when they become canonical for a release.

## Release gate (7 axes)

Because the provider string is `@kiwa-lab/observability/dashboard`, `evaluateReleaseGate` runs the common 7-axis branch. The AI-LLM 4 axes (cost per request / p95 latency / total tokens / accuracy) do not apply — Prometheus is a metrics primitive, not a token-priced generative call. HTTP query latency still feeds `perf.p95Ms` so the dashboard performance axis stays visible in the report.

- `coverage.line` ≥ 85%
- `coverage.branch` ≥ 80%
- `coverage.function` ≥ 90%
- `fidelity.ratio` ≥ 70%
- `perf.p95Ms` ≤ 100 ms (mock refresh + query round-trip)
- `mutation.killRate` ≥ 60%
- `testCount.behavior` ≥ 10

## Ops under measurement

Two provider-neutral ops on `DashboardAdapter` cover the Grafana dashboard difficulty surface end-to-end.

- `runQuery(query)` — execute a single PromQL-style query (metric name + aggregation + optional label filter) and return the aggregated numeric value + matched sample count
- `refreshDashboard()` — re-evaluate every panel on the dashboard once, producing an ordered `PanelRenderResult[]` with value + chart_type + badge

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

`line` and `bar` both map to the observability package's `timeseries` PanelKind — the app-level chart_type is preserved as metadata on the render result so a Next.js App Router page can pick the correct chart component.

## Related

- v1.14-4 `@kiwa-lab/observability` v1.1 (`packages/observability/`) — telemetry provider mocks (OpenTelemetry / Datadog / Sentry)
- v1.17-1 `@kiwa-lab/observability` v2.0 (`packages/observability/`) — DashboardMock + AlertRouter + trace flame graph + log correlation
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`) — 7-axis release gate
- v1.17 milestone parent [#777](https://github.com/cardene777/kiwa/issues/777), this sub [#779](https://github.com/cardene777/kiwa/issues/779)
