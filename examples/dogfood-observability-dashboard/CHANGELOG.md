# dogfood-observability-dashboard

## 0.0.2

### Patch Changes

- 4ede2f8: feat: v1.17-2 — new Next.js App Router style Grafana dashboard dogfood app driven behind a provider-neutral `DashboardAdapter`. Exercises the v1.17-1 `@kiwa-lab/observability` `DashboardMock` end-to-end against a real Prometheus HTTP API path.

  - 5 canonical panels (line / bar / gauge / stat / table) — 1 per chart_type, backed by a shared PromQL-style query builder module. `line` and `bar` both map to the observability package's `timeseries` PanelKind; the app-level chart_type is preserved on `PanelRenderResult.chartType` so a real Next.js `app/dashboard/page.tsx` server component can pick the correct chart component.
  - `makeMockAdapter` — seeds a `TelemetryCollector` with 4 metric names (`http.errors` / `http.p99.latency.ms` / `queue.depth` / `http.requests`) and drives a `DashboardMock` so refresh + query + badge behaviour is deterministic across test runs.
  - `makeRealAdapter` — talks to a Prometheus instant-query endpoint (`GET /api/v1/query`) when `PROMETHEUS_URL` is set; downgrades to `PROMETHEUS_ENV_MISSING` traces when absent or `PROMETHEUS_FETCH_MISSING` when the runtime cannot fetch. Compiles `DashboardQuery` to PromQL via `queryToPromQL`.
  - `createDashboardPageController` — Next.js App Router style controller (`load()` / `refresh()`) that a real `app/dashboard/page.tsx` server component would use directly. `KIWA_MODE=mock` (default) / `KIWA_MODE=real` picks the adapter.
  - Fidelity harness — trace-diffing across mock vs real for `runQuery` + `refreshDashboard`. Feeds `@kiwa-lab/quality-metrics` common 7-axis release gate (`@kiwa-lab/observability/` prefix triggers the non-AI-LLM branch).
  - 22 vitest tests (18 e2e mock + 3 fidelity + 1 emit) + 2 perf specs (mock 3-layer + live Prometheus 3-layer env-skip).
  - Emits `quality-report/fidelity-latest.{json,md}`; canonical snapshot promoted to `docs/quality-reports/observability/dashboard.md`.

  Refs #777 (v1.17 milestone), #779 (v1.17-2 sub-Issue).

- Updated dependencies [bd156ba]
  - @kiwa-lab/observability@2.0.0
