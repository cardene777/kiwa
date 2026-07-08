# dogfood-alert-orchestrator

Dogfood app (v1.17-3) — a Node.js style **Prometheus AlertManager** orchestrator driven behind a provider-neutral surface. 10 alert rules (threshold / rate / anomaly) evaluate against a metric window; fires walk a 3-level routing tree (severity → team → channel); silences (literal + regex) suppress by label match; an escalation ladder (L1 30s → L2 5min → L3 30min) walks the state machine so tests can assert receiver X saw alert Y at tier N. The fidelity harness diffs mock vs a live AlertManager HTTP API and feeds `@kiwa/quality-metrics` release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa/observability` `AlertRouter` + `TelemetryCollector`, deterministic lifecycle transitions).
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that talks to a Prometheus AlertManager HTTP API when `ALERTMANAGER_URL` is set. When the variable is missing the adapter reports each method as `ALERTMANAGER_ENV_MISSING` so the fidelity harness records the gap without failing the test suite. When the URL is set but `globalThis.fetch` is unavailable the adapter downgrades to `ALERTMANAGER_FETCH_MISSING`.

Real-mode envs.

- `ALERTMANAGER_URL` — required to enable real mode (e.g. `http://localhost:9093`)
- `ALERTMANAGER_TIMEOUT_MS` — optional, defaults to 5000

## Layout

```
src/
  adapters/
    interface.ts        -- provider-neutral orchestrator contract
                           (emitMetric / evaluateRules / routeAlert /
                            advanceEscalation / getActive)
    mock.ts             -- kiwa AlertRouter backend, seeded collector +
                           rate + anomaly compilation
    real.ts             -- Prometheus AlertManager v2 HTTP API adapter with
                           graceful skip when env absent
  rules/
    index.ts            -- 10 canonical rules
                           (4 threshold + 3 rate + 3 anomaly)
  routing/
    index.ts            -- 3-level routing tree
                           (severity → team → channel), walkRoute helper
  silence/
    index.ts            -- SilenceStore + literal + regex label match
  escalation/
    index.ts            -- 3-step escalation ladder (L1 / L2 / L3)
  flows/
    orchestrator-flows.ts -- ingest / evaluate / route / escalate + OPS_UNDER_TEST
    fidelity.ts           -- trace-diffing harness → @kiwa/quality-metrics
  app/
    orchestrator-service.ts -- Node.js style orchestrator service
                               (createOrchestratorService().ingest() / .cycle())
tests/
  e2e-mock-mode.test.ts        -- 23 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
  perf/
    alert-orchestrator.perf.ts       -- 3-layer perf (mock)
    alert-orchestrator.live.perf.ts  -- 3-layer perf (live AlertManager, env-skip)
```

## 4 axes AC

Issue #780 scopes the AC as "10 rule × 3 routing × silence × escalation". The dogfood exercises them all:

- 10 rules: 4 threshold + 3 rate + 3 anomaly (`src/rules/index.ts`)
- 3 routing levels: severity → team → channel (`src/routing/index.ts`)
- Silence: literal (team) + regex (route prefix) (`src/silence/index.ts`)
- Escalation: L1 30s → L2 5min → L3 30min (`src/escalation/index.ts`)

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

Live real-mode:

```bash
export ALERTMANAGER_URL=http://localhost:9093
pnpm test
```

## Perf

```bash
pnpm test:perf
cat ../../docs/quality-reports/perf/dogfood-alert-orchestrator.md
cat ../../docs/quality-reports/perf/dogfood-alert-orchestrator.live.md
```
