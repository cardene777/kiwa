# dogfood-trace-flame-graph

Dogfood app (v1.17-4) — a trace flame graph explorer (React-style component tree modelled in pure TS for headless test) driven behind a provider-neutral surface. 10 canonical traces (nested span shapes; 100+ spans across the set) build into span trees + collapsed flame graphs; drill-down extracts a subtree; log correlation joins logs to spans and back via traceId + spanId; a summary + LogPanel + Drilldown UI is exercised for regression coverage without ever mounting a DOM. The fidelity harness diffs mock vs a live Jaeger HTTP API and feeds `@kiwa/quality-metrics` release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa/observability` `buildSpanTree` + `renderFlameGraph` + `LogCorrelationIndex`, deterministic exploration).
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that talks to a Jaeger HTTP API when `JAEGER_URL` is set. When the variable is missing the adapter reports each method as `JAEGER_ENV_MISSING` so the fidelity harness records the gap without failing the test suite. When the URL is set but `globalThis.fetch` is unavailable the adapter downgrades to `JAEGER_FETCH_MISSING`.

Real-mode envs.

- `JAEGER_URL` — required to enable real mode (e.g. `http://localhost:16686`)
- `JAEGER_TIMEOUT_MS` — optional, defaults to 5000

## Layout

```
src/
  adapters/
    interface.ts        -- provider-neutral flame explorer contract
                           (loadTrace / renderFlame / drillDown /
                            joinLogs / filterByName)
    mock.ts             -- kiwa buildSpanTree + renderFlameGraph +
                           LogCorrelationIndex backend, seeded traces
    real.ts             -- Jaeger v3 HTTP API adapter with graceful
                           skip when env absent
  traces/
    index.ts            -- 10 canonical fixtures
                           (http-handler / fanout-parallel / nested-retry /
                            ssr-tree / batch-write / chunked-upload /
                            api-gateway / event-bus / cache-cycle / bg-job)
                           — 100 spans + 34 logs total
  correlation/
    index.ts            -- TraceLogIndex wraps LogCorrelationIndex
                           (log → span via spanId, trace → logs via traceId)
  components/
    FlameGraph.ts       -- layoutFlameGraph + summariseFlameGraph
                           (component-tree pure logic; no DOM)
    SpanTree.ts         -- buildSpanTreeRows + collapseSubtree
    LogPanel.ts         -- buildLogPanelRows + filterByLevel + filterBySpan
    Drilldown.ts        -- buildDrilldownView (breadcrumb + summary + stats)
  flows/
    flame-flows.ts      -- load / render / drilldown / logJoin / filter +
                           OPS_UNDER_TEST
    fidelity.ts         -- trace-diffing harness → @kiwa/quality-metrics
  app/
    flame-service.ts    -- browser SPA style explorer service
                           (createFlameService().focus() / .drill() / .filter())
tests/
  e2e-mock-mode.test.ts        -- 25 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
  perf/
    trace-flame-graph.perf.ts       -- 3-layer perf (mock)
    trace-flame-graph.live.perf.ts  -- 3-layer perf (live Jaeger, env-skip)
```

## 4 axes AC

Issue #781 scopes the AC as "10 trace × flame graph render × drill-down + log join". The dogfood exercises them all.

- 10 traces: nested span shapes covering http / fanout / retry / ssr / batch / upload / gateway / event bus / cache / background job (`src/traces/index.ts`)
- Flame graph render: `buildSpanTree` + `renderFlameGraph` sibling collapse (`src/adapters/mock.ts`)
- Drill-down: subtree extraction rooted at a named node with depth normalisation (`src/adapters/mock.ts`, `src/components/Drilldown.ts`)
- Log correlation: bidirectional index (log → span via spanId, trace → logs via traceId), overridable key convention (`src/correlation/index.ts`)

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

Live real-mode:

```bash
export JAEGER_URL=http://localhost:16686
pnpm test
```

## Perf

```bash
pnpm test:perf
cat ../../docs/quality-reports/perf/dogfood-trace-flame-graph.md
cat ../../docs/quality-reports/perf/dogfood-trace-flame-graph.live.md
```
