# Chaos engineering + Data pipeline + AIOps — fault injection + blast radius + auto-rollback + game day + lineage capture + freshness + schema drift + data quality + anomaly + auto-remediation + RCA + alert correlation in 15 min

## What you'll build

A vitest suite wired to `@kiwa/observability` v2.2 that models the 3 pieces of a real advanced III reliability posture that every non-trivial production platform eventually needs — a chaos `injectFault` step that pins a per-experiment fault (`network-latency` / `network-partition` / `pod-kill` / `cpu-stress` / `disk-fill`) so a Chaos Mesh-style experiment can be re-run against the same target without a per-fault YAML fork, a `computeBlastRadius` step that pins `blastRadiusRatio = affectedInstances / totalInstances` so a "how bad did it get?" question resolves to one number without walking the raw impact log, a `triggerRollback` step that flips `session.rollbackTriggered` when `errorRate >= threshold` (mirroring Argo Rollouts `analysis.progressive` gate) so a runaway experiment auto-unwinds instead of waiting for a human operator, a `recordGameDay` step that pins participants + issuesFound + durationMinutes so a post-mortem doc can graph "did the game day surface more or fewer issues than last quarter?" from one telemetry export, a data-pipeline `captureLineage` step that pins per-edge from → to relationships (mirroring OpenLineage 1.x namespace + name conventions) so a "which downstream tables depend on this source?" question lands on one directed graph, an `evaluateFreshness` step that computes `ageMinutes = (nowMs - lastEventAtMs) / 60000` against the operator-supplied `slaMinutes` so a "is this pipeline stale?" question resolves to one boolean, a `detectSchemaDrift` step that compares an expected column set against the actual column set (mirroring Great Expectations / dbt schema tests) so a silent column rename does not corrupt a downstream ML feature store, a `scoreDataQuality` step that computes `score = passedRuleCount / totalRuleCount` so a DQ dashboard can pin one summary number per pipeline, an AIOps `detectAnomaly` step that filters z-scores against a threshold (mirroring Prometheus `prophet` / Datadog `anomaly()` semantics) so a "which metric spiked?" question lands on a bounded list, an `executeRemediation` step that pins per-action runbook results with `succeeded` / `failed` / `allSucceeded` flags so the auto-remediation pipeline emits its own SLI, an `analyzeRootCause` step that walks a dependency graph to find the topological root of a failure set (mirroring Datadog Watchdog RCA / OpsRamp AI/RCA) so a cascade is diagnosed from one edge query instead of a manual trace tree, and a `correlateAlerts` step that groups alerts firing within a window (mirroring Grafana Incident correlation) so a paging storm collapses into one group instead of 50 pages. `startChaosSession()` + `injectFault()` + `computeBlastRadius()` + `triggerRollback()` + `recordGameDay()` + `startPipelineSession()` + `captureLineage()` + `evaluateFreshness()` + `detectSchemaDrift()` + `scoreDataQuality()` + `startAiopsSession()` + `detectAnomaly()` + `executeRemediation()` + `analyzeRootCause()` + `correlateAlerts()` give you every one of those pieces without booting a real Chaos Mesh + Litmus + Airflow + Dagster + Datadog Watchdog + Grafana Incident stack. This is the pattern kiwa's `examples/dogfood-observability-chaos-aiops-app` exercises against real Chaos Mesh 2.7+ + Litmus 3.9+ + Airflow 2.10+ + Dagster 1.9+ + Datadog Watchdog + Grafana Incident + PagerDuty backends under `KIWA_MODE=real` + the relevant `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the rollback never fired because `triggerRollback` compared `errorRate > threshold` instead of `>=`, the freshness eval passed on a 60-minute stale pipeline because `evaluateFreshness` used `<` instead of `<=`, the anomaly detector missed a negative-z-score outlier because `detectAnomaly` did not take absolute value, and the RCA returned the wrong root because `analyzeRootCause` walked outgoing edges instead of incoming edges" gap a reviewer sees in a chaos + data-pipeline + AIOps post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-chaos-datapipeline-aiops && cd kiwa-chaos-datapipeline-aiops
pnpm init
pnpm add -D @kiwa/observability@^2.2 vitest typescript @types/node
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

The v2.2 surface exports the chaos axis (`startChaosSession` / `injectFault` / `computeBlastRadius` / `triggerRollback` / `recordGameDay`), the data-pipeline axis (`startPipelineSession` / `captureLineage` / `evaluateFreshness` / `detectSchemaDrift` / `scoreDataQuality`), and the AIOps axis (`startAiopsSession` / `detectAnomaly` / `executeRemediation` / `analyzeRootCause` / `correlateAlerts`) directly from the package root. Every v2.2 semantics function takes an `ObservabilityTarget` (`grafana-oss` / `prometheus` / `loki` / `otel-collector`) as first argument — the target selects the neutral event dialect via `providerEventName(target, neutralEvent)`. This tutorial focuses on the chaos + data-pipeline + AIOps end-to-end chain; tutorial 91 covers the IaC + service-mesh + eBPF-III axes, tutorial 92 covers the LLM observability + FinOps chain.

### 2. `injectFault` — chaos fault injection

`tests/chaos/fault.test.ts` — a `ChaosSession` pins an `experimentId` + a `state` that starts at `'idle'` and moves to `'fault-injected'` on `injectFault`. The fault kind is one of the 5 canonical shapes (`network-latency` / `network-partition` / `pod-kill` / `cpu-stress` / `disk-fill`) — enough to model every Chaos Mesh / Litmus experiment without a per-workload YAML fork.

```ts
import { describe, expect, it } from 'vitest';
import { injectFault, startChaosSession } from '@kiwa/observability';

describe('chaos — fault injection', () => {
  it('injects a pod-kill fault and moves state', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'exp-1' });
    const step = injectFault(s, { kind: 'pod-kill', target: 'api', durationSec: 30 });
    expect(step.neutralEvent).toBe('chaos.fault_injected');
    expect(step.metadata.kind).toBe('pod-kill');
    expect(s.fault).toEqual({ kind: 'pod-kill', target: 'api', durationSec: 30 });
    expect(s.state).toBe('fault-injected');
  });

  it('rejects a zero-duration fault', () => {
    const s = startChaosSession({ target: 'grafana-oss', experimentId: 'e' });
    expect(() =>
      injectFault(s, { kind: 'cpu-stress', target: 't', durationSec: 0 }),
    ).toThrow();
  });
});
```

### 3. `computeBlastRadius` — impact ratio

`tests/chaos/blast.test.ts` — `computeBlastRadius()` pins `blastRadiusRatio = affectedInstances / totalInstances` (clamped to 0 when `affectedInstances: 0`). A "how bad did the experiment get?" question resolves to one number without walking the raw impact log.

```ts
import { describe, expect, it } from 'vitest';
import {
  computeBlastRadius,
  injectFault,
  startChaosSession,
} from '@kiwa/observability';

describe('chaos — blast radius', () => {
  it('computes affected ratio', () => {
    const s = startChaosSession({ target: 'otel-collector', experimentId: 'e' });
    injectFault(s, { kind: 'network-latency', target: 'svc-a', durationSec: 60 });
    const step = computeBlastRadius(s, { affectedInstances: 25, totalInstances: 100 });
    expect(step.metadata.blastRadiusRatio).toBe(0.25);
    expect(s.blastRadiusRatio).toBe(0.25);
  });

  it('returns 0 when no instance is affected', () => {
    const s = startChaosSession({ target: 'loki', experimentId: 'e' });
    injectFault(s, { kind: 'disk-fill', target: 'x', durationSec: 10 });
    const step = computeBlastRadius(s, { affectedInstances: 0, totalInstances: 50 });
    expect(step.metadata.blastRadiusRatio).toBe(0);
  });
});
```

### 4. `triggerRollback` — auto-rollback on SLO breach

`tests/chaos/rollback.test.ts` — `triggerRollback()` flips `session.rollbackTriggered` when `errorRate >= threshold`. This is the invariant that lets a Chaos Mesh experiment auto-unwind instead of waiting for a human operator to notice a runaway error rate.

```ts
import { describe, expect, it } from 'vitest';
import {
  computeBlastRadius,
  injectFault,
  startChaosSession,
  triggerRollback,
} from '@kiwa/observability';

describe('chaos — auto-rollback', () => {
  it('triggers rollback when errorRate >= threshold', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'network-partition', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 5, totalInstances: 10 });
    const step = triggerRollback(s, { errorRate: 0.15, threshold: 0.1 });
    expect(step.metadata.triggered).toBe(true);
    expect(s.rollbackTriggered).toBe(true);
  });

  it('leaves rollback un-triggered when errorRate < threshold', () => {
    const s = startChaosSession({ target: 'otel-collector', experimentId: 'e' });
    injectFault(s, { kind: 'cpu-stress', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    const step = triggerRollback(s, { errorRate: 0.05, threshold: 0.1 });
    expect(step.metadata.triggered).toBe(false);
    expect(s.rollbackTriggered).toBe(false);
  });
});
```

### 5. `recordGameDay` — game day log

`tests/chaos/gameday.test.ts` — `recordGameDay()` pins the post-mortem primitives (participants + issuesFound + durationMinutes) so a post-mortem doc can graph "did the game day surface more or fewer issues than last quarter?" from one telemetry export. The 4-step lifecycle terminates at `'game-day-recorded'`.

```ts
import { describe, expect, it } from 'vitest';
import {
  computeBlastRadius,
  injectFault,
  recordGameDay,
  startChaosSession,
  triggerRollback,
} from '@kiwa/observability';

describe('chaos — game day recording', () => {
  it('records participants + issues + duration', () => {
    const s = startChaosSession({ target: 'grafana-oss', experimentId: 'gd-2026-Q3' });
    injectFault(s, { kind: 'pod-kill', target: 'api', durationSec: 60 });
    computeBlastRadius(s, { affectedInstances: 3, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.2, threshold: 0.1 });
    const step = recordGameDay(s, { participants: 5, issuesFound: 3, durationMinutes: 90 });
    expect(step.metadata.participants).toBe(5);
    expect(step.metadata.issuesFound).toBe(3);
    expect(step.metadata.durationMinutes).toBe(90);
    expect(s.state).toBe('game-day-recorded');
  });
});
```

### 6. `captureLineage` — OpenLineage graph capture

`tests/pipeline/lineage.test.ts` — a `PipelineSession` pins a `namespace` + `jobName` + a `state` that starts at `'idle'` and moves to `'lineage-captured'` on `captureLineage`. The edges (from → to) are copied into `session.edges` and the emitted step's metadata carries `nodeCount` (union of unique node names) + `edgeCount` so a lineage dashboard can graph the pipeline's topological breadth in one panel.

```ts
import { describe, expect, it } from 'vitest';
import { captureLineage, startPipelineSession } from '@kiwa/observability';

describe('pipeline — lineage capture', () => {
  it('counts nodes and edges', () => {
    const s = startPipelineSession({
      target: 'otel-collector',
      namespace: 'analytics',
      jobName: 'daily-etl',
    });
    const step = captureLineage(s, {
      edges: [
        { from: 'raw.events', to: 'stg.events' },
        { from: 'stg.events', to: 'mart.daily_active_users' },
      ],
    });
    expect(step.neutralEvent).toBe('pipeline.lineage_captured');
    expect(step.metadata.edgeCount).toBe(2);
    expect(step.metadata.nodeCount).toBe(3); // raw.events + stg.events + mart.daily_active_users
    expect(s.state).toBe('lineage-captured');
  });
});
```

### 7. `evaluateFreshness` — SLA-gated freshness check

`tests/pipeline/freshness.test.ts` — `evaluateFreshness()` computes `ageMinutes = (nowMs - lastEventAtMs) / 60000` and compares against the operator-supplied `slaMinutes`. The emitted `withinSla` boolean answers "is this pipeline stale?" in one field so a DQ dashboard can pin the panel without a re-computation.

```ts
import { describe, expect, it } from 'vitest';
import {
  captureLineage,
  evaluateFreshness,
  startPipelineSession,
} from '@kiwa/observability';

describe('pipeline — freshness evaluation', () => {
  it('passes when the pipeline is within SLA', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    const step = evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 30 * 60_000, // 30 minutes ago
      slaMinutes: 60,
    });
    expect(step.metadata.withinSla).toBe(true);
    expect(step.metadata.ageMinutes).toBe(30);
    expect(s.state).toBe('freshness-evaluated');
  });

  it('fails when the pipeline exceeds SLA', () => {
    const s = startPipelineSession({ target: 'loki', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    const step = evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 90 * 60_000, // 90 minutes ago
      slaMinutes: 60,
    });
    expect(step.metadata.withinSla).toBe(false);
    expect(step.metadata.ageMinutes).toBe(90);
  });
});
```

### 8. `detectSchemaDrift` — expected vs. actual column set

`tests/pipeline/schema.test.ts` — `detectSchemaDrift()` compares an expected column set against the actual column set. Every column that only appears on one side lands in `session.driftedColumns`. A silent column rename or type change is caught before it corrupts a downstream ML feature store.

```ts
import { describe, expect, it } from 'vitest';
import {
  captureLineage,
  detectSchemaDrift,
  evaluateFreshness,
  startPipelineSession,
} from '@kiwa/observability';

describe('pipeline — schema drift', () => {
  it('detects a renamed column as drift', () => {
    const s = startPipelineSession({ target: 'grafana-oss', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1, slaMinutes: 60 });
    const step = detectSchemaDrift(s, {
      expected: [
        { name: 'id', type: 'int' },
        { name: 'created_at', type: 'timestamp' },
      ],
      actual: [
        { name: 'id', type: 'int' },
        { name: 'createdAt', type: 'timestamp' }, // renamed
      ],
    });
    expect(step.metadata.driftCount).toBeGreaterThan(0);
    expect(s.state).toBe('schema-drift-detected');
  });
});
```

### 9. `scoreDataQuality` — pass-ratio DQ score

`tests/pipeline/dq.test.ts` — `scoreDataQuality()` computes `score = passedRuleCount / totalRuleCount`. A DQ dashboard can pin one summary number per pipeline without walking the raw check list.

```ts
import { describe, expect, it } from 'vitest';
import {
  captureLineage,
  detectSchemaDrift,
  evaluateFreshness,
  scoreDataQuality,
  startPipelineSession,
} from '@kiwa/observability';

describe('pipeline — data quality score', () => {
  it('computes pass ratio across checks', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1, slaMinutes: 60 });
    detectSchemaDrift(s, {
      expected: [{ name: 'id', type: 'int' }],
      actual: [{ name: 'id', type: 'int' }],
    });
    const step = scoreDataQuality(s, {
      checks: [
        { ruleId: 'not-null', passed: true },
        { ruleId: 'unique-id', passed: true },
        { ruleId: 'range-check', passed: false },
      ],
    });
    expect(step.metadata.score).toBeCloseTo(2 / 3);
    expect(step.metadata.passedCount).toBe(2);
    expect(step.metadata.failedCount).toBe(1);
    expect(s.state).toBe('data-quality-scored');
  });
});
```

### 10. `detectAnomaly` + `executeRemediation` — AIOps anomaly + auto-remediation

`tests/aiops/anomaly.test.ts` — an `AiopsSession` pins a `clusterId` + a `state` that starts at `'idle'` and moves to `'anomaly-detected'` on `detectAnomaly`. The filter uses `|zScore| >= zScoreThreshold` so a negative-z-score outlier is caught alongside a positive one. `executeRemediation()` records per-action success + emits `succeeded` / `failed` / `allSucceeded` flags so the auto-remediation pipeline emits its own SLI.

```ts
import { describe, expect, it } from 'vitest';
import {
  detectAnomaly,
  executeRemediation,
  startAiopsSession,
} from '@kiwa/observability';

describe('aiops — anomaly + remediation', () => {
  it('filters anomalies by absolute z-score', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'prod-us-east' });
    const step = detectAnomaly(s, {
      points: [
        { metric: 'cpu', value: 90, zScore: 3.2 }, // flagged
        { metric: 'mem', value: 40, zScore: -3.5 }, // flagged (negative)
        { metric: 'io', value: 10, zScore: 1.0 }, // not flagged
      ],
      zScoreThreshold: 3.0,
    });
    expect(step.metadata.anomalyCount).toBe(2);
    expect(step.metadata.hasAnomaly).toBe(true);
    expect(s.anomalies).toHaveLength(2);
  });

  it('records succeeded / failed counts for remediation actions', () => {
    const s = startAiopsSession({ target: 'otel-collector', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    const step = executeRemediation(s, {
      actions: [
        { actionId: 'a1', runbookId: 'r1', success: true },
        { actionId: 'a2', runbookId: 'r2', success: false },
      ],
    });
    expect(step.metadata.succeeded).toBe(1);
    expect(step.metadata.failed).toBe(1);
    expect(step.metadata.allSucceeded).toBe(false);
  });
});
```

### 11. `analyzeRootCause` + `correlateAlerts` — RCA + alert correlation

`tests/aiops/rca-correlate.test.ts` — `analyzeRootCause()` walks a dependency graph to find the topological root of the failure set — a service whose downstream targets are also all in the failure set (so the fault must have originated upstream). The `failedServices` list should be **upstream-first** so the first-match wins finds the topological root. `correlateAlerts()` groups alerts firing within an operator-supplied `windowMs` so a paging storm collapses into one correlation group.

```ts
import { describe, expect, it } from 'vitest';
import {
  analyzeRootCause,
  correlateAlerts,
  detectAnomaly,
  executeRemediation,
  startAiopsSession,
} from '@kiwa/observability';

describe('aiops — RCA + correlation', () => {
  it('identifies the topological root of a failure set', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4.0 }], zScoreThreshold: 3.0 });
    executeRemediation(s, { actions: [{ actionId: 'a1', runbookId: 'r1', success: true }] });
    const step = analyzeRootCause(s, {
      // db -> api -> web ; failed: db + api + web (upstream first)
      edges: [
        { from: 'db', to: 'api' },
        { from: 'api', to: 'web' },
      ],
      failedServices: ['db', 'api', 'web'],
    });
    expect(step.metadata.rootCause).toBe('db');
    expect(s.rootCauseService).toBe('db');
  });

  it('groups alerts within a correlation window', () => {
    const s = startAiopsSession({ target: 'grafana-oss', clusterId: 'c' });
    detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4.0 }], zScoreThreshold: 3.0 });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['db'] });
    const step = correlateAlerts(s, {
      alerts: [
        { alertId: 'a1', service: 'x', firedAtMs: 1000 },
        { alertId: 'a2', service: 'y', firedAtMs: 1200 }, // within 500 ms window
        { alertId: 'a3', service: 'z', firedAtMs: 5000 }, // separate group
      ],
      windowMs: 500,
    });
    expect(step.metadata.groupCount).toBeGreaterThanOrEqual(2);
    expect(s.state).toBe('alerts-correlated');
  });
});
```

## Run the suite

```bash
pnpm test
```

The suite completes in under two seconds without a real Chaos Mesh + Airflow + Datadog Watchdog + PagerDuty stack. The chaos, data-pipeline, and AIOps axes stay independent — a failure in a lineage-capture assertion does not mask an RCA regression.

## What's next

Tutorial 91 (`docs/tutorials/91-iac-servicemesh-ebpf.md`) walks the IaC + service-mesh + eBPF-III axes. Tutorial 92 (`docs/tutorials/92-llm-observability-finops.md`) walks the LLM observability + FinOps chain. Concept doc `docs/concepts/observability-advanced-III-testing.md` documents the v2.2 8 axis SSOT and the 4 provider × 8 axis = 32 cell fidelity harness (grafana-oss / prometheus / loki / otel-collector) across all 3 v1.42 dogfood observability apps (`dogfood-observability-iac-drift-app` + `dogfood-observability-llm-ops-app` + `dogfood-observability-chaos-aiops-app`). Migration guide `docs/migrations/v1.41-to-v1.42.md` documents the additive-only upgrade path with pair 深度 4 段拡張 3 例目 record (v1.14 → v1.17 → v1.35 → v1.42).
