# Observability dashboard (panel + refresh + badge) in 10 min

## What you'll build

A vitest test file that models a Grafana-style dashboard with 3 panels — an HTTP error rate stat, a p99 latency timeseries, and a queue depth gauge — powered by `@kiwa/observability` v2.0's `DashboardMock`. The mock reads from the same `TelemetryCollector` the v1.1 provider mocks populate, so the SUT emits metrics through OpenTelemetry / Datadog / Sentry and the dashboard reads them back deterministically. You end up with 5 assertions that cover the 3 most-common Grafana regressions — wrong metric binding, wrong aggregation, and mis-tuned threshold badges — without needing a real Prometheus + Grafana stack.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-observability-dashboard && cd kiwa-observability-dashboard
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa/observability
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/dashboard.ts` — a factory that builds a `TelemetryCollector` + an OpenTelemetry mock that writes into it + a `DashboardMock` bound to the 3 canonical panels shipped as fixtures:

```ts
import {
  DashboardMock,
  TelemetryCollector,
  createOtelMock,
  panel_httpErrorRate,
  panel_p99Latency,
  panel_queueDepth,
} from '@kiwa/observability';

export function buildSREDashboard(now: () => number = () => 1_000) {
  // v1.14-4 provider mock — pass the same clock so refreshedAt matches.
  const otel = createOtelMock({ now });
  const collector = otel.collector;
  const dashboard = new DashboardMock(
    {
      id: 'sre',
      title: 'SRE overview',
      panels: [
        panel_httpErrorRate(),
        panel_p99Latency(),
        panel_queueDepth('panel-queue-depth', 'jobs'),
      ],
    },
    collector,
    { now },
  );
  return { collector, dashboard, otel };
}
```

## Test — refresh, badge, and panel-level assertions

Create `tests/dashboard.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSREDashboard } from '../src/dashboard';

describe('SRE dashboard — 3 panels driven by the shared TelemetryCollector', () => {
  it('refresh() re-evaluates every panel and increments the refresh count', () => {
    const { dashboard, otel } = buildSREDashboard();

    // 4 errors + 1 recovery = 4 http.errors counter increments
    for (let i = 0; i < 4; i++) otel.meter.createCounter('http.errors').add(1);

    const results = dashboard.refresh();
    expect(results).toHaveLength(3);
    expect(dashboard.getRefreshCount()).toBe(1);

    const errorPanel = dashboard.panel('panel-http-error-rate');
    expect(errorPanel?.value).toBe(4);
    expect(errorPanel?.matchedRecords).toBe(4);
  });

  it('threshold badges: value >= 10 → critical, value >= 0.01 → warn, else null', () => {
    const { dashboard, otel } = buildSREDashboard();

    // 12 errors → gte 10 → critical (first threshold match wins)
    for (let i = 0; i < 12; i++) otel.meter.createCounter('http.errors').add(1);
    dashboard.refresh();
    expect(dashboard.panel('panel-http-error-rate')?.badge).toBe('critical');
  });

  it('p99 latency panel uses max aggregation across all http.latency.ms samples', () => {
    const { dashboard, otel } = buildSREDashboard();

    otel.meter.createHistogram('http.latency.ms').record(80);
    otel.meter.createHistogram('http.latency.ms').record(510); // > warn threshold
    otel.meter.createHistogram('http.latency.ms').record(1100); // > critical threshold
    otel.meter.createHistogram('http.latency.ms').record(200);

    dashboard.refresh();
    const latency = dashboard.panel('panel-p99-latency');
    expect(latency?.value).toBe(1100);
    expect(latency?.badge).toBe('critical');
  });

  it('queue depth panel filters by tag { queue: "jobs" } and uses last-sample aggregation', () => {
    const { dashboard, otel } = buildSREDashboard();

    // Two queues emit — only { queue: 'jobs' } contributes
    otel.meter.createGauge('queue.depth').record(500, { queue: 'ingest' });
    otel.meter.createGauge('queue.depth').record(120, { queue: 'jobs' });
    otel.meter.createGauge('queue.depth').record(1_500, { queue: 'jobs' }); // last-sample = 1500

    dashboard.refresh();
    const queue = dashboard.panel('panel-queue-depth');
    expect(queue?.value).toBe(1_500);
    expect(queue?.matchedRecords).toBe(2);
    expect(queue?.badge).toBe('warn');
  });

  it('a second refresh with no new samples returns the same values but a bumped refresh count', () => {
    const { dashboard, otel } = buildSREDashboard();
    otel.meter.createCounter('http.errors').add(3);

    dashboard.refresh();
    dashboard.refresh();
    expect(dashboard.getRefreshCount()).toBe(2);
    expect(dashboard.panel('panel-http-error-rate')?.value).toBe(3);
  });
});
```

## Run it

```bash
pnpm test
```

You should see 5 passing tests. Every panel query executes against the collector state at the moment `refresh()` runs, so the assertions read like "at refresh time T, the panel with id X returned value V and badge B".

## The 3-panel wall

The 3 fixtures shipped with `@kiwa/observability` v2 target the wall a typical SaaS SRE dashboard shows.

| Panel | Kind | Metric | Aggregation | Thresholds |
|---|---|---|---|---|
| `panel-http-error-rate` | stat | `http.errors` | sum | `gte 10 → critical`, `gte 0.01 → warn` |
| `panel-p99-latency` | timeseries | `http.latency.ms` | max | `gte 1000 → critical`, `gte 500 → warn` |
| `panel-queue-depth` | gauge | `queue.depth` (tag `queue`) | last | `gte 1000 → warn` |

The threshold array is walked in order — the first entry whose `operator` holds against the aggregated value wins. That matches Grafana's "first match wins" semantic and keeps the badge assertion stable when the thresholds are edited (adding a `critical` at the top does not silently downgrade an existing `warn`).

## The 4 ops the mock covers

`DashboardMock` exposes exactly 4 methods that map 1:1 to the operations a real Grafana panel wall performs on each refresh cycle.

1. `refresh()` — re-execute every panel query against the current collector state; increments `refreshCount` and returns the new `PanelResult[]`
2. `getRefreshCount()` — number of `refresh()` calls since construction (assert cadence without wall-clock coupling)
3. `getLastResults()` — the array returned by the most recent `refresh()` (empty before the first refresh)
4. `panel(panelId)` — fetch one `PanelResult` by id from the most recent refresh (returns `undefined` when the panel is unknown or the dashboard has not refreshed yet)

Every method reads from the `TelemetryCollector` passed at construction. There is no shared state between two dashboards bound to different collectors — the mock is deliberately narrow so a test can mount 3 dashboards in the same file (production / staging / canary) and assert on each independently.

## Why the mock does not open a real Grafana

Real Grafana runs a browser preview that reads panels via a plugin API. The v2 mock covers the **decision boundary** — which metric maps to which panel, which aggregation runs, which threshold band decides the badge. It does not model. panel plugin rendering (a react-tree concern), templated variable resolution (a scripting concern), or the panel edit UI (a web app concern).

The trade-off is deliberate. The 3 regressions the mock catches — wrong metric name, wrong aggregation, mis-tuned threshold — cover ~80% of "the dashboard is lying" incidents in real SaaS shops. The remaining 20% (plugin bugs, PromQL parser edge cases, rendered pixel differences) live in real Grafana and need a real Grafana + Prometheus stack to test. The v1.17-2 dogfood app (`examples/dogfood-observability-dashboard/`) ships a `makeRealAdapter()` that env-gates on `PROMETHEUS_URL` and produces a fidelity report showing which of those 20% cases surface as a divergence.

## Next steps — real Prometheus fidelity

The v1.17-2 dogfood app measures the same 4 ops against a real Prometheus HTTP API and produces a `FidelityRecord` per op. Set the env and run the fidelity harness:

```bash
PROMETHEUS_URL=http://localhost:9090 pnpm --filter dogfood-observability-dashboard test
cat examples/dogfood-observability-dashboard/quality-report/fidelity-latest.md
```

Without the env, the harness records each op as `PROMETHEUS_ENV_MISSING` so the mock-mode result is unaffected. That keeps the fidelity report shape stable across CI environments — the axis coverage number reflects how many ops observed real drift, not how many ops were skipped.

## Related

- [Tutorial 23 — Alert orchestrator in 12 min](./23-alert-orchestrator)
- [Tutorial 24 — Trace flame graph in 12 min](./24-trace-flame-graph)
- [Tutorial 14 — Telemetry mock (OpenTelemetry / Datadog / Sentry) in 10 min](./14-observability)
- [Concept — Observability v2 testing](../concepts/observability-v2-testing)
- [Migration guide — v1.16 → v1.17](../migrations/v1.16-to-v1.17)
- v1.17 milestone parent [#777](https://github.com/cardene777/kiwa/issues/777), sub-issue [#779](https://github.com/cardene777/kiwa/issues/779)
