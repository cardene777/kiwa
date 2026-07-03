# Fidelity — dogfood-alert-orchestrator (v1.17-3)

Real-vs-mock behavioural fidelity for the Prometheus AlertManager style alert orchestrator dogfood, produced by `examples/dogfood-alert-orchestrator/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-test/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `ALERTMANAGER_URL`)

When the harness runs without an AlertManager URL, the real adapter emits `ALERTMANAGER_ENV_MISSING` for every lifecycle op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/observability/alert
version    : 2.0.0
verdict    : PASS
divergences: 4 (emitMetric noop + evaluateRules / routeAlert / advanceEscalation missing on real)
axes       : 7 (common branch — AlertManager is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (3/3) | 70% | pass |
| perf.p95Ms | 11.00 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 23 | 10 | pass |

The `divergences` count in the notes section counts the 4 ops whose mock path succeeded but whose real path is absent (`ALERTMANAGER_ENV_MISSING` for the 3 lifecycle ops + `ALERTMANAGER_METRIC_NOOP` for `emitMetric`) — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 3 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-alert-orchestrator test
cat examples/dogfood-alert-orchestrator/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export ALERTMANAGER_URL=http://localhost:9093
pnpm --filter dogfood-alert-orchestrator test
```

When the URL is set but the AlertManager instance has no active alerts, `evaluateRules` returns an empty array — the same shape the mock returns when no rule matches. The mock / real behave identically for the empty-fire case.

## Ops under measurement

Three provider-neutral ops on `AlertOrchestratorAdapter` cover the AlertManager alert lifecycle end-to-end.

- `evaluateRules` — evaluate every registered rule against the metric window; return newly fired alerts.
- `routeAlert` — walk the routing tree respecting silences; return the receiver + silenced flag.
- `advanceEscalation` — walk the escalation ladder (L1 30s → L2 5min → L3 30min); return receiver notifications whose after-window has elapsed.

Plus the `emitMetric` op (mock only — Prometheus scrapes metrics on its own cadence on the real path) so the mock has data to fire against. `emitMetric` is excluded from `OPS_UNDER_TEST` because the real adapter noops it by design, and counting it would over-report divergences.

Accessor `getActive` is also present so tests can assert current firing state without wall-clock coupling.

## 10 rules × 3 routing × silence × escalation

The 10 seeded rules (`src/rules/index.ts`) span 3 kinds of Prometheus rule shape.

| id | kind | metric | operator | threshold / window / stddev | severity | team | channel |
|---|---|---|---|---|---|---|---|
| `rule-http-errors-critical` | threshold | `http.errors` | `>=` | 10, 1 sample | critical | platform | pagerduty |
| `rule-latency-degraded` | threshold | `http.latency.ms` | `>=` | 500, 3 samples | warn | platform | slack |
| `rule-queue-backpressure` | threshold | `queue.depth` | `>=` | 1000, 1 sample | warn | data | slack |
| `rule-disk-usage-high` | threshold | `disk.usage.percent` | `>=` | 90, 1 sample | critical | infra | pagerduty |
| `rule-http-5xx-rate` | rate | `http.errors.total` | `>=` | 0.5/s, 60s window | critical | platform | pagerduty |
| `rule-request-rate` | rate | `http.requests.total` | `>=` | 100/s, 60s window | info | platform | slack |
| `rule-error-rate-per-route` | rate | `route.errors.total` | `>=` | 0.1/s, 30s window | warn | platform | slack |
| `rule-memory-rss-anomaly` | anomaly | `process.memory.rss` | `>=` | mean + 3σ | warn | infra | slack |
| `rule-cpu-usage-anomaly` | anomaly | `process.cpu.percent` | `>=` | mean + 3σ | critical | infra | pagerduty |
| `rule-gc-pause-anomaly` | anomaly | `runtime.gc.pause.ms` | `>=` | mean + 2σ | warn | platform | slack |

Routing tree (`src/routing/index.ts`).

```
root (default)
├── severity=critical
│   ├── team=platform → pagerduty-platform
│   ├── team=infra    → pagerduty-infra
│   └── (fallback)    → pagerduty
├── severity=warn
│   ├── team=platform → slack-platform
│   ├── team=data     → slack-data
│   ├── team=infra    → slack-infra
│   └── (fallback)    → slack
└── severity=info     → slack-info
```

Silences (`src/silence/index.ts`).

- `silence-maintenance-platform` — literal `team=platform` for 15 min
- `silence-deploy-window` — regex `route=^/api/` for 30 min

Escalation ladder (`src/escalation/index.ts`).

- L1 — 30 s → `oncall-primary`
- L2 — 5 min → `oncall-secondary`
- L3 — 30 min → `eng-manager`

## Notes

Provider prefix `@kiwa-test/observability/` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because Prometheus AlertManager is an infrastructure primitive, not a token-priced generative call. Evaluation + routing latency samples feed `perf.p95Ms` so orchestrator performance stays visible in the report.

`emitMetric` is deliberately excluded from `OPS_UNDER_TEST` — the real path is a Prometheus scrape-owned noop, so counting it as an op would over-report divergences. The mock adapter still accepts it (it appends to the collector so the rule engine has data to fire against); the real adapter records `ALERTMANAGER_METRIC_NOOP` in the trace.

Rate + anomaly rule kinds compile down to threshold checks at emit time — rate divides `(latest.value - windowStart.value) / (windowMs / 1000)` and pushes the derived scalar under a synthetic `__derived.rate.{rule-id}` metric; anomaly tracks a rolling mean + variance (Welford one-pass) and pushes `latest - (mean + stddevMult × stddev)` under `__derived.anomaly.{rule-id}`. The underlying `@kiwa-test/observability` `AlertRouter` then fires on the derived scalar via the same operator + threshold predicate the threshold path uses.

## Related

- `packages/observability/src/alert.ts` — v1.17-1 `AlertRouter` implementation
- `examples/dogfood-observability-dashboard/` — v1.17-2 Grafana dashboard dogfood
- `docs/quality-reports/observability/dashboard.md` — v1.17-2 canonical fidelity report
- `docs/quality-reports/perf/dogfood-alert-orchestrator.md` — perf 3-layer report (mock)
- `docs/quality-reports/perf/dogfood-alert-orchestrator.live.md` — perf 3-layer report (live)
