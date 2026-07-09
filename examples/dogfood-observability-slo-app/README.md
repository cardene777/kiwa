# dogfood-observability-slo-app v1.35-2

Dogfood application that exercises the `@kiwa-lab/observability` v2.1 SLO axis
end-to-end through a provider-neutral 14-op contract satisfied by both a
deterministic mock adapter and a `KIWA_MODE=real` testcontainers-driven
Grafana OSS + Prometheus + Alertmanager real adapter.

## Purpose

Prove the v2.1 SLO semantics track real Grafana + Prometheus + Alertmanager
behaviour closely enough that consumers can trust the mock in unit tests. The
fidelity harness diffs mock vs real traces across 3 SLO objectives (99.9 /
99.95 / 99.99) × 3 Google SRE canonical MWMBR window pairs (fast burn / slow
burn / ticket burn) and feeds the divergence count into the
`@kiwa-lab/quality-metrics` 13-axis release gate.

## Surface — 14 ops

The `SloAdapter` contract is exposed through `SLO_HARNESS_OPS`:

1. `startSlo` — start an SLO session for an objective (99.9 / 99.95 / 99.99).
2. `openWindow` — open the rolling error-budget window.
3. `queryRequestCounts` — issue a PromQL query for total requests + errors.
4. `recordRequests` — record raw request + error counts against the window.
5. `computeErrorBudget` — compute allowed error rate + budget seconds.
6. `evaluateBurnRateFast` — fast-burn threshold (5m / 1h @ 14.4).
7. `evaluateBurnRateSlow` — slow-burn threshold (30m / 6h @ 6).
8. `fireMwmbrAlert` — multi-window multi-burn-rate alert firing decision.
9. `evaluatePolicyShip` — ship branch when budget healthy.
10. `evaluatePolicyFreeze` — freeze deploys when budget drops below policy.
11. `evaluatePolicyPage` — page on-call when budget drops below policy.
12. `routeAlert` — Alertmanager routing (pager / chat / ticket).
13. `silenceAlert` — silence a route for a maintenance window.
14. `reset` — drop all state.

## Modes

- `KIWA_MODE=mock` (default) — the mock adapter drives the observability v2.1
  semantics/slo state machine deterministically without any backend.
- `KIWA_MODE=real` — the real adapter issues PromQL queries + Alertmanager
  route posts against `KIWA_PROMETHEUS_URL` / `KIWA_GRAFANA_URL` /
  `KIWA_ALERTMANAGER_URL` (testcontainers). When the env vars are missing
  every op reports the sentinel `KIWA_SLO_ENV_MISSING`.

## Running tests

```
pnpm --filter dogfood-observability-slo-app test
```

The test suite lands 45+ behavioural tests plus an emit-fidelity-report
snapshot that writes to `quality-report/` for release-gate inspection.
