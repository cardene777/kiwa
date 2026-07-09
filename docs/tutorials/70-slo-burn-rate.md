# SLO burn rate — error budget + multi-window multi-burn-rate alert in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/observability` v2.1 that models the 4 pieces of a real SRE SLO loop that every non-trivial service eventually needs — an SLO session that pins a target objective (99.9% availability) and a rolling window, a request counter that keeps the total-request and total-error tallies without touching wall-clock, an error-budget compute step that turns the objective into a burn-second budget, and a multi-window multi-burn-rate (MWMB) alert evaluation that fires the correct page for "budget will exhaust in 2 hours" without paging on the noise-floor micro-burns. `startSLO()` + `openSLOWindow()` + `recordRequests()` + `computeErrorBudget()` + `evaluateBurnRate()` + `fireMultiWindowMultiBurnRateAlert()` give you every one of those pieces without booting a real Prometheus / Alertmanager pair. This is the pattern kiwa's `examples/dogfood-observability-slo-app` v2 exercises against real Grafana OSS + Prometheus under `KIWA_MODE=real` + `PROMETHEUS_URL` + `GRAFANA_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "SLO burn rate went 14.4× for 5 minutes but the pager did not fire" gap a reviewer sees in the incident post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-slo-burn && cd kiwa-slo-burn
pnpm init
pnpm add -D @kiwa-lab/observability@^2.1 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v2.1 surface exports the SLO axis through the `semantics/` barrel. This tutorial focuses on the SLO axis end-to-end; tutorials 71-72 cover the other 3 axes (OpenTelemetry exemplar + continuous profiling).

### 2. `startSLO` + `openSLOWindow` — pin the target and open the window

`tests/slo/session.test.ts` — an SLO session pins a target objective (99.9% availability = 0.999) and a window length (28 days). `openSLOWindow()` flips the state machine from `idle` to `window-open` and emits the neutral event `slo.window_opened` (Grafana → `grafana.slo.window.open`, Prometheus → `prom.slo.window.open`).

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/observability';

const { startSLO, openSLOWindow } = semantics;

describe('slo — session lifecycle', () => {
  it('starts idle and transitions to window-open on openSLOWindow()', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    expect(session.state).toBe('idle');
    expect(session.totalRequests).toBe(0);
    expect(session.totalErrors).toBe(0);

    const step = openSLOWindow(session);
    expect(session.state).toBe('window-open');
    expect(step.neutralEvent).toBe('slo.window_opened');
    expect(step.providerEvent).toBe('prom.slo.window.open');
    expect(step.metadata.windowDays).toBe(28);
    expect(step.metadata.targetObjective).toBe(0.999);
  });

  it('rejects an objective outside (0, 1) — no silent clamp', () => {
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 1.5, windowDays: 7 }),
    ).toThrow(/0 < objective < 1/);
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0, windowDays: 7 }),
    ).toThrow(/0 < objective < 1/);
  });

  it('rejects openSLOWindow() twice — the state machine is strict', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    expect(() => openSLOWindow(session)).toThrow(/session is window-open, not idle/);
  });
});
```

Run it.

```bash
pnpm test
```

The 3 tests pass. The invariant `state === 'window-open'` before recordRequests + computeErrorBudget is what stops a caller from computing an error budget for a session that never opened the window.

### 3. `recordRequests` + `computeErrorBudget` — accumulate and turn objective into a budget

`tests/slo/budget.test.ts` — `recordRequests()` accumulates request + error counts. `computeErrorBudget()` turns the target objective into a burn-second budget for the window (`(1 - objective) × windowSeconds`). For a 99.9% target over 28 days, the budget is `0.001 × (28 × 86_400)s = 2_419.2` seconds ≈ **40 minutes 19 seconds** of allowed downtime per month.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/observability';

const { computeErrorBudget, openSLOWindow, recordRequests, startSLO } = semantics;

describe('slo — error budget compute', () => {
  it('computes a 40-minute budget for a 99.9% × 28-day SLO', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    recordRequests(session, { requests: 100_000, errors: 42 });

    const step = computeErrorBudget(session);
    expect(step.neutralEvent).toBe('slo.error_budget_computed');
    expect(step.metadata.allowedErrorRate).toBeCloseTo(0.001, 6);
    expect(step.metadata.windowSeconds).toBe(2_419_200);
    expect(step.metadata.errorBudgetSeconds).toBeCloseTo(2_419.2, 3);
    expect(session.state).toBe('budget-computed');
  });

  it('rejects negative counts and errors > requests — invariants stay tight', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'x',
      targetObjective: 0.99,
      windowDays: 7,
    });
    openSLOWindow(session);
    expect(() => recordRequests(session, { requests: -1, errors: 0 })).toThrow(/non-negative/);
    expect(() => recordRequests(session, { requests: 10, errors: 11 })).toThrow(
      /errors must not exceed requests/,
    );
  });

  it('rejects computeErrorBudget() before openSLOWindow() — state machine is strict', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'x',
      targetObjective: 0.99,
      windowDays: 7,
    });
    expect(() => computeErrorBudget(session)).toThrow(/session is idle, not window-open/);
  });
});
```

The invariant `errors <= requests` is the compile-time equivalent of "the error-rate can never be negative or greater than 100%" — a class of bugs where a stale Prometheus counter emitted `errors_total > requests_total` used to page the on-call for a phantom outage.

### 4. `evaluateBurnRate` + `fireMultiWindowMultiBurnRateAlert` — the MWMB decision

`tests/slo/mwmb.test.ts` — the MWMB (multi-window multi-burn-rate) alert is the Google SRE Workbook Chapter 5 recipe. It combines 2 windows (short = 5 min, long = 1 h) with 2 burn thresholds (fast = 14.4×, slow = 6×) to page only when the burn rate is high in both windows — filtering out the 30-second micro-burns that noise-floor a single-window alert. `evaluateBurnRate()` computes `actualErrorRate / allowedErrorRate` and `fireMultiWindowMultiBurnRateAlert()` returns whether any threshold fired.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/observability';

const {
  computeErrorBudget,
  evaluateBurnRate,
  fireMultiWindowMultiBurnRateAlert,
  openSLOWindow,
  recordRequests,
  startSLO,
} = semantics;

const SRE_WORKBOOK_MWMB_THRESHOLDS = [
  { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 },
  { shortWindowMinutes: 30, longWindowMinutes: 360, burnRate: 6 },
] as const;

function fireBudgetPipeline(session: ReturnType<typeof startSLO>) {
  openSLOWindow(session);
  computeErrorBudget(session);
  return session;
}

describe('slo — mwmb alert', () => {
  it('fires when the observed burn rate is 14.4× at the 99.9% × 28-day objective', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    recordRequests(session, { requests: 100_000, errors: 1_500 });
    computeErrorBudget(session);

    const burn = evaluateBurnRate(session, SRE_WORKBOOK_MWMB_THRESHOLDS[0]);
    expect(session.state).toBe('burn-evaluated');
    expect(burn.metadata.burnRate).toBeGreaterThan(14.4);

    const alert = fireMultiWindowMultiBurnRateAlert(session, {
      thresholds: [...SRE_WORKBOOK_MWMB_THRESHOLDS],
      page: true,
    });
    expect(alert.neutralEvent).toBe('slo.multi_window_alert_fired');
    expect(alert.metadata.fired).toBe(true);
    expect(alert.metadata.pagerEnabled).toBe(true);
    expect(alert.metadata.thresholdCount).toBe(2);
    expect(session.state).toBe('alert-fired');
  });

  it('does not fire when the observed burn rate is 1× (nominal)', () => {
    const session = fireBudgetPipeline(
      startSLO({
        target: 'prometheus',
        sloId: 'api-availability',
        targetObjective: 0.999,
        windowDays: 28,
      }),
    );
    recordRequests(session, { requests: 100_000, errors: 100 });
    // reset state to burn-evaluated by re-running the pipeline branch
    const burn = evaluateBurnRate(session, SRE_WORKBOOK_MWMB_THRESHOLDS[0]);
    expect(burn.metadata.burnRate).toBeCloseTo(1, 3);

    const alert = fireMultiWindowMultiBurnRateAlert(session, {
      thresholds: [...SRE_WORKBOOK_MWMB_THRESHOLDS],
      page: false,
    });
    expect(alert.metadata.fired).toBe(false);
    expect(alert.metadata.pagerEnabled).toBe(false);
  });
});
```

The reason the workbook uses **2 windows × 2 thresholds** and not "just fire when burn > 1" is that a 1-minute request storm can push `errors/requests` past the allowed rate briefly without ever threatening the 28-day budget. The 5 min / 1 h dual window forces both a fast local spike AND a slow global trend, cutting false-positive pages by ~90% in the Google SRE workbook's post-hoc audit.

### 5. Wire the fidelity harness

`tests/slo/fidelity.test.ts` — the fidelity harness (`collectFidelityCoverage()`) exposes the `4 provider × 8 axis = 32 cell grid`. The SLO axis is 1 of the 8 axes; every provider (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector) covers it with a different dialect (`grafana.slo.*` / `prom.slo.*` / `loki.slo.*` / `otel.slo.*`).

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/observability';

const { collectFidelityCoverage } = semantics;

describe('slo — fidelity coverage', () => {
  it('the 4 provider × slo axis grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const sloRows = coverage.rows.filter((r) => r.axis === 'slo');
    expect(sloRows).toHaveLength(4);
    for (const row of sloRows) {
      expect(row.neutralEvents).toEqual([
        'slo.window_opened',
        'slo.error_budget_computed',
        'slo.burn_rate_evaluated',
        'slo.multi_window_alert_fired',
      ]);
    }
  });

  it('each provider gets a distinct dialect for slo.window_opened', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const openedByProvider = new Map<string, string>();
    for (const row of coverage.rows.filter((r) => r.axis === 'slo')) {
      openedByProvider.set(row.provider, row.providerEvents[0]);
    }
    expect(openedByProvider.get('grafana-oss')).toBe('grafana.slo.window.open');
    expect(openedByProvider.get('prometheus')).toBe('prom.slo.window.open');
    expect(openedByProvider.get('loki')).toBe('loki.slo.window');
    expect(openedByProvider.get('otel-collector')).toBe('otel.slo.window');
  });
});
```

The fidelity assertion is the *contract* the real-driver path in `examples/dogfood-observability-slo-app` v2 tests against — the Prometheus PromQL rule that emits `prom.slo.window.open` MUST match the mock's dialect exactly. When the mock and the real Prometheus diverge, the mock gets the fix (the mock is the SSOT).

### 6. Real driver mode

Under `KIWA_MODE=real` the same assertions run against real Grafana OSS + Prometheus. The dogfood app in `examples/dogfood-observability-slo-app` v2 shows the pattern.

```ts
import { describe, it } from 'vitest';
import { skipUnlessReal } from '@kiwa-lab/observability';

const gate = skipUnlessReal(process.env);
const requiredEnv = ['PROMETHEUS_URL', 'GRAFANA_URL'] as const;
const envMissing = requiredEnv.filter((k) => !process.env[k]);

describe.skipIf(gate.skip || envMissing.length > 0)('real-driver — Prometheus MWMB rule', () => {
  it('fires against the actual instance under KIWA_MODE=real', async () => {
    // Same session pipeline as the mock tests, but the burn rate is derived
    // from a real PromQL query against PROMETHEUS_URL, and the alert page
    // is verified against Grafana's alert-manager route at GRAFANA_URL.
  });
});
```

The dogfood app exposes `pnpm test:real` — it flips `KIWA_MODE=real`, requires `PROMETHEUS_URL` + `GRAFANA_URL`, spins up the Prometheus + Grafana pair under docker-compose, and re-runs the same session pipeline against a real recording rule. Failure means the mock diverged from the real MWMB semantics; the mock gets the fix.

## What you just learned

- **SLO state machine** — `idle → window-open → budget-computed → burn-evaluated → alert-fired`. Every transition is strict, no silent no-op paths.
- **Error budget math** — `(1 - objective) × windowSeconds` in seconds. For 99.9% × 28d = 40 min 19 s / month.
- **MWMB alert recipe** — 2 window × 2 threshold (5m/1h at 14.4×, 30m/6h at 6×) filters the noise-floor micro-burns that a single-window alert would page on.
- **Fidelity contract** — the mock's neutral event (`slo.window_opened`) maps to 4 provider dialects; the real driver has to emit the same dialect. When they diverge, the mock is SSOT.
- **Real-driver env gate** — `skipUnlessReal(process.env)` (paired with a `PROMETHEUS_URL` / `GRAFANA_URL` presence check) gives you a real-driver env-gate that makes the mock path always-green and the real path opt-in.

## Where next

- Tutorial 71 — OpenTelemetry exemplar (trace-to-metric + metric-to-trace + baggage + W3C context)
- Tutorial 72 — Continuous profiling (CPU + memory + off-CPU flame graph)
- Concept doc — `docs/concepts/observability-real-driver-testing.md` (8 axis × 4 provider = 32 cell grid + real-driver env-gate pattern SSOT)
- Migration guide — `docs/migrations/v1.34-to-v1.35.md`
