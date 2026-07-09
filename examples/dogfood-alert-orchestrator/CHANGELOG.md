# dogfood-alert-orchestrator

## 0.0.2

### Patch Changes

- bd368a2: feat: v1.17-3 — new Node.js style Prometheus AlertManager alert orchestrator dogfood app driven behind a provider-neutral `AlertOrchestratorAdapter`. Exercises the v1.17-1 `@kiwa-lab/observability` `AlertRouter` end-to-end against a live AlertManager HTTP API path.

  - 10 canonical alert rules — 4 threshold (HTTP 5xx / p99 latency / queue depth / disk usage) + 3 rate (5xx rate, request rate, error rate per route) + 3 anomaly (memory rss, cpu usage, gc pause). Rate + anomaly kinds compile down to threshold checks in the mock adapter (rate divides cumulative counters by elapsed window; anomaly compares latest sample to trailing mean + `stddevMult × stddev`).
  - 3-level routing tree (`severity → team → channel`) with 6 leaves so every seeded rule has a distinct receiver (`pagerduty-platform` / `pagerduty-infra` / `slack-platform` / `slack-data` / `slack-infra` / `slack-info`) and a fallback `pagerduty` root for unknown teams. `walkRoute` mirrors `AlertRouter.walkRoute` semantics (deepest match wins).
  - Silence store with literal + regex label matching; regex compilation is cached per silence so malformed patterns cannot brick the orchestrator.
  - Escalation ladder L1 30s → L2 5min → L3 30min mirrors PagerDuty's 3-tier policy so the mock exercises the full state machine.
  - `makeMockAdapter` — drives `@kiwa-lab/observability` `AlertRouter` + `TelemetryCollector`; deterministic lifecycle transitions (fire → route → silence → escalate → resolve) so fidelity tests assert on receiver identity + silence suppression + escalation timing without wall-clock coupling.
  - `makeRealAdapter` — POSTs fires to AlertManager `/api/v2/alerts` and GETs the alert group via `/api/v2/alerts` when `ALERTMANAGER_URL` is set; downgrades to `ALERTMANAGER_ENV_MISSING` traces when absent or `ALERTMANAGER_FETCH_MISSING` when the runtime cannot fetch. `emitMetric` is a Prometheus scrape-owned noop on the real path so trace parity is honest.
  - `createOrchestratorService` — Node.js style orchestrator service (`ingest()` / `cycle()`) that a real HTTP sidecar would call into. `KIWA_MODE=mock` (default) / `KIWA_MODE=real` picks the adapter.
  - Fidelity harness — trace-diffing across mock vs real for `evaluateRules` + `routeAlert` + `advanceEscalation` (3 ops under measurement; `emitMetric` excluded since real is noop). Feeds `@kiwa-lab/quality-metrics` common 7-axis release gate (`@kiwa-lab/observability/` prefix triggers the non-AI-LLM branch).
  - 27 vitest tests (23 e2e mock + 3 fidelity + 1 emit) + 2 perf specs (mock 3-layer + live AlertManager 3-layer env-skip).
  - Emits `quality-report/fidelity-latest.{json,md}`; canonical snapshot promoted to `docs/quality-reports/observability/alert-orchestrator.md`.

  Refs #777 (v1.17 milestone), #780 (v1.17-3 sub-Issue).

- Updated dependencies [bd156ba]
  - @kiwa-lab/observability@2.0.0
