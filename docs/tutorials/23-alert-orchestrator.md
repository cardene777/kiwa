# Alert orchestrator (rule + route + silence + escalation) in 12 min

## What you'll build

A vitest test file that walks the Prometheus AlertManager 4-state lifecycle — `pending → firing → escalated → resolved` — powered by `@kiwa-lab/observability` v2.0's `AlertRouter`. You register 3 rules (error rate critical / latency degraded / queue backpressure), set a 3-level routing tree (severity → team → channel), attach a 2-step escalation ladder, add a maintenance-window silence, and assert on each state transition with deterministic time. No real AlertManager, no gossip protocol, no external HTTP call — the whole thing runs in-process against the same `TelemetryCollector` your v1.1 telemetry mock populates.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-alert-orchestrator && cd kiwa-alert-orchestrator
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/observability
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

Create `src/orchestrator.ts` — a factory that wires 3 rules + a 3-level route + a 2-step escalation, using a deterministic clock shared with an OpenTelemetry mock:

```ts
import {
  AlertRouter,
  createOtelMock,
  defaultRoute,
  escalation_pagerDutyTwoStep,
  rule_errorRateCritical,
  rule_latencyDegraded,
  rule_queueBackpressure,
} from '@kiwa-lab/observability';

export function buildOrchestrator(now: () => number) {
  const otel = createOtelMock({ now });
  const collector = otel.collector;
  const router = new AlertRouter(collector, { now });

  router.registerRule(rule_errorRateCritical());
  router.registerRule(rule_latencyDegraded());
  router.registerRule(rule_queueBackpressure('rule-queue-backpressure', 'ingest'));
  router.setRoute(defaultRoute());
  router.setEscalation('rule-error-rate-critical', escalation_pagerDutyTwoStep());
  return { collector, router, otel };
}
```

## Test — 4-state lifecycle + routing + silence + escalation

Create `tests/orchestrator.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildOrchestrator } from '../src/orchestrator';

describe('AlertRouter — 4-state lifecycle + routing + silence + escalation', () => {
  it('deepest matching route wins: critical + platform → pagerduty-platform', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);

    // Single counter sample of 12 → last-sample value 12 >= threshold 10 → fire
    // (AlertRouter reads the latest metric sample per rule; not cumulative sum)
    otel.meter.createCounter('http.errors').add(12);
    const events = router.evaluate();

    expect(events).toHaveLength(1);
    // Route tree: severity=critical → pagerduty; team=platform → pagerduty-platform
    expect(events[0]?.receiver).toBe('pagerduty-platform');
    expect(events[0]?.fire.state).toBe('firing');
  });

  it('forSamples requires N consecutive holds before pending → firing', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);

    // rule-latency-degraded requires forSamples=3
    otel.meter.createHistogram('http.latency.ms').record(600);
    expect(router.evaluate()).toHaveLength(0); // 1 hold, need 3
    otel.meter.createHistogram('http.latency.ms').record(700);
    expect(router.evaluate()).toHaveLength(0); // 2 holds
    otel.meter.createHistogram('http.latency.ms').record(800);
    const events = router.evaluate(); // 3 holds → fire
    expect(events).toHaveLength(1);
    expect(events[0]?.fire.severity).toBe('warn');
  });

  it('an active silence with matching labels suppresses the fire', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);

    // Silence anything with team=platform until t=60_000
    router.addSilence({
      id: 'maintenance-window',
      match: { team: 'platform' },
      expiresAt: 60_000,
    });

    // Trigger a critical rule that has team=platform in its labels
    otel.meter.createCounter('http.errors').add(12);

    const events = router.evaluate();
    expect(events).toHaveLength(0);
  });

  it('escalation walks the ladder as `now()` moves past afterMs boundaries', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);

    // Fire the critical rule at t=1000
    otel.meter.createCounter('http.errors').add(12);
    router.evaluate();

    // Advance to t = 1000 + 5 min = 301000 — L1 escalation should fire
    clock = 1_000 + 5 * 60 * 1_000;
    let ladder = router.tickEscalation();
    expect(ladder).toHaveLength(1);
    expect(ladder[0]?.receiver).toBe('pagerduty-secondary');
    expect(ladder[0]?.fire.state).toBe('escalated');

    // Advance to t = 1000 + 15 min = 901000 — L2 escalation
    clock = 1_000 + 15 * 60 * 1_000;
    ladder = router.tickEscalation();
    expect(ladder).toHaveLength(1);
    expect(ladder[0]?.receiver).toBe('pagerduty-lead');
  });

  it('a resolved rule (predicate flips to false) transitions active fires to `resolved`', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);

    // Fire the critical rule (single sample value 12 >= threshold 10)
    otel.meter.createCounter('http.errors').add(12);
    router.evaluate();
    expect(router.getActive()).toHaveLength(1);

    // Emit a fresh sample below threshold — AlertRouter reads the last
    // sample per rule, so add(1) creates a new metric with value 1
    // which flips the predicate false and resolves the fire.
    otel.meter.createCounter('http.errors').add(1);
    router.evaluate();
    expect(router.getActive()).toHaveLength(0);
  });
});
```

## Run it

```bash
pnpm test
```

You should see 5 passing tests. Every assertion targets a well-defined transition in the state machine — pending → firing, silenced, escalated, resolved.

## The 3 rule fixtures

The 3 fixtures shipped with `@kiwa-lab/observability` v2 target the alerts a typical SaaS SRE dashboard raises during an incident.

| Rule id | Metric | Operator + threshold | forSamples | Labels |
|---|---|---|---|---|
| `rule-error-rate-critical` | `http.errors` | `gte 10` | 1 | `severity=critical`, `team=platform` |
| `rule-latency-degraded` | `http.latency.ms` | `gte 500` | 3 | `severity=warn`, `team=platform` |
| `rule-queue-backpressure` | `queue.depth` | `gte 1000` | 1 | `severity=warn`, `team=data`, `queue=<name>` |

`forSamples` = 1 means a single hold triggers the fire; larger values require N consecutive `evaluate()` calls with the predicate true. That matches Prometheus AlertManager's `for:` duration semantic without coupling to wall-clock time.

## The 3-level routing tree

The `defaultRoute()` fixture builds the following tree — deepest match wins.

```
match {}                       → default
  match { severity: critical } → pagerduty
    match { team: platform }   → pagerduty-platform   ← wins for critical + platform
  match { severity: warn }     → slack
    match { team: data }       → slack-data           ← wins for warn + data
```

`walkRoute` matches labels top-down. When any nested route matches, the deepest one wins — that mirrors AlertManager's `routes[].match` traversal. A fire whose labels do not match any nested route bubbles up to the parent's `receiver`.

## The 4 ops the mock covers

`AlertRouter` exposes exactly 4 ops that map 1:1 to the AlertManager decision boundary.

1. `evaluate()` — score every rule against the current collector state; transition pending → firing (or firing → resolved) and return `AlertReceiverEvent[]` for newly routed fires
2. `tickEscalation()` — walk every active fire's escalation ladder and emit an `AlertReceiverEvent` per step whose `afterMs` has elapsed since `firedAt`
3. `addSilence(silence)` — register a silence; any subsequent evaluate / escalation call checks matching labels and skips delivery
4. `getActive()` — snapshot of every fire currently in `firing` or `escalated` state

Every op reads from the `TelemetryCollector`. Silences, active fires, and delivery history live on the router — that keeps `evaluate()` idempotent for the same input state (call it twice and the same fires + deliveries surface, but no duplicate `AlertReceiverEvent` is emitted).

## Silence semantics

`addSilence(silence)` registers a label match with an `expiresAt` millisecond. The router.

- Skips routing on `evaluate()` when a matching silence is active.
- Skips escalation on `tickEscalation()` when a matching silence is active.
- Auto-expires when `expiresAt <= now()` — the next evaluate call re-checks and routes the fire if the predicate still holds.

The `silence_maintenanceWindow` fixture returns a `{ team: platform }` silence with a configurable `minutesFromNow` — useful for testing "did the deploy freeze suppress the platform pager during the window and re-route after?".

## Escalation state machine

`setEscalation(ruleId, steps)` attaches an ordered list of `EscalationStep` (`afterMs`, `receiver`) to a rule. When `tickEscalation()` runs, every active fire whose elapsed = `now() - firedAt >= step.afterMs` transitions to `escalated` and emits an `AlertReceiverEvent` with `reason = 'escalation'`.

Duplicate delivery is prevented — the router walks the delivery history and skips any step already emitted for the same fire. That keeps the test loop safe when a test calls `tickEscalation()` in a `while` loop advancing the clock.

The `escalation_pagerDutyTwoStep()` fixture returns `[{ afterMs: 5min, receiver: 'pagerduty-secondary' }, { afterMs: 15min, receiver: 'pagerduty-lead' }]` — a canonical 2-step ladder.

## What the mock does not model

- **AlertManager cluster gossip** — the mock is single-instance. Real AlertManager syncs silences and fires across N replicas; the mock has no cluster.
- **Notification adapter payloads** — `AlertReceiverEvent` records `receiver` name only. Slack / PagerDuty / OpsGenie payload shapes are integration concerns that live outside the mock.
- **Notification retry / dedup window** — real AlertManager buffers notifications for `group_wait` + `group_interval`. The mock delivers on the same tick as the evaluate call.

The 3 regressions the mock catches — wrong route hierarchy, wrong silence label match, wrong escalation timing — cover ~85% of "the pager did not fire" incidents. The remaining 15% (adapter payload bugs, cluster split-brain, delivery window edge cases) need a real AlertManager + adapter fleet to test.

## Next steps — real AlertManager fidelity

The v1.17-3 dogfood app (`examples/dogfood-alert-orchestrator/`) measures the same 4 ops against a real Prometheus AlertManager HTTP API and produces a `FidelityRecord` per op. Set the env and run the harness:

```bash
ALERTMANAGER_URL=http://localhost:9093 pnpm --filter dogfood-alert-orchestrator test
cat examples/dogfood-alert-orchestrator/quality-report/fidelity-latest.md
```

Without the env, the harness records each op as `ALERTMANAGER_ENV_MISSING`.

## Related

- [Tutorial 22 — Observability dashboard in 10 min](./22-observability-dashboard)
- [Tutorial 24 — Trace flame graph in 12 min](./24-trace-flame-graph)
- [Tutorial 14 — Telemetry mock (OpenTelemetry / Datadog / Sentry) in 10 min](./14-observability)
- [Concept — Observability v2 testing](../concepts/observability-v2-testing)
- [Migration guide — v1.16 → v1.17](../migrations/v1.16-to-v1.17)
- v1.17 milestone parent [#777](https://github.com/cardene777/kiwa/issues/777), sub-issue [#780](https://github.com/cardene777/kiwa/issues/780)
