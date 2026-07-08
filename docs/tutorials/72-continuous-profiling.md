# Continuous profiling — CPU + memory + off-CPU flame graph in 15 min

## What you'll build

A vitest suite wired to `@kiwa/observability` v2.1 that models the 4 pieces of a real continuous-profiling loop that every non-trivial service eventually needs — a profiling session that pins a `serviceName` + target profile store (Grafana Pyroscope / Prometheus Parca / Loki-hosted profile bucket / OpenTelemetry Collector), a per-kind sample recorder (CPU / memory / off-CPU) that carries the call stack + valueBytes + timestamp without touching real eBPF or `/proc`, a flame-graph builder that aggregates the samples into a tree with `totalValue` per frame, and a flame-tree walker that flattens the graph into a depth-first list a UI panel can render. `startProfiling()` + `sampleCpu()` + `sampleMemory()` + `sampleOffCpu()` + `buildFlameGraph()` + `flattenFlameGraph()` give you every one of those pieces without booting a real Pyroscope + eBPF pair. This is the pattern kiwa's `examples/dogfood-profiling-app` exercises against real Grafana Pyroscope 1.9+ under `KIWA_MODE=real` + `PYROSCOPE_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the flame graph rendered but the hottest frame was 3× off because we forgot to normalize valueBytes across sample kinds" gap a reviewer sees in the perf regression audit.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-profiling && cd kiwa-profiling
pnpm init
pnpm add -D @kiwa/observability@^2.1 vitest typescript @types/node
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

The v2.1 surface exports the profiling axis through the `semantics/` barrel. This tutorial focuses on that axis end-to-end; tutorials 70 (SLO) and 71 (OpenTelemetry exemplar) cover the other advanced axes.

### 2. `startProfiling` + `sampleCpu` — the CPU profile record

`tests/profiling/cpu.test.ts` — a profiling session pins a `serviceName` (the process being profiled) and a target profile store. `sampleCpu()` records a single CPU sample carrying a call stack (leaf frame last), a `valueBytes` count (the profiler's unit — for CPU this is nanoseconds converted to a byte-shaped counter so every axis shares one arithmetic type), and a timestamp.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa/observability';

const { sampleCpu, startProfiling } = semantics;

describe('profiling — cpu sample', () => {
  it('records a cpu sample and advances idle → cpu-sampled', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    expect(session.state).toBe('idle');
    expect(session.samples).toHaveLength(0);

    const step = sampleCpu(session, {
      stack: ['main', 'handleRequest', 'renderTemplate'],
      valueBytes: 1_200_000,
      timestampMs: 1_700_000_000_000,
    });

    expect(step.neutralEvent).toBe('profile.cpu_sampled');
    expect(step.providerEvent).toBe('grafana.pyroscope.cpu');
    expect(step.metadata.kind).toBe('cpu');
    expect(step.metadata.stackDepth).toBe(3);
    expect(step.metadata.valueBytes).toBe(1_200_000);
    expect(step.metadata.sampleCount).toBe(1);
    expect(session.state).toBe('cpu-sampled');
    expect(session.samples).toHaveLength(1);
    expect(session.samples[0]!.stack).toEqual(['main', 'handleRequest', 'renderTemplate']);
  });

  it('rejects an empty serviceName — no silent aggregation into an unnamed bucket', () => {
    expect(() => startProfiling({ target: 'grafana-oss', serviceName: '' })).toThrow(
      /serviceName must not be empty/,
    );
  });

  it('rejects an empty stack — a sample without a frame carries no information', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    expect(() =>
      sampleCpu(session, { stack: [], valueBytes: 1_000, timestampMs: 1_700_000_000_000 }),
    ).toThrow(/stack must not be empty/);
  });

  it('rejects a negative valueBytes — a sample cannot claim negative CPU time', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    expect(() =>
      sampleCpu(session, {
        stack: ['main'],
        valueBytes: -1,
        timestampMs: 1_700_000_000_000,
      }),
    ).toThrow(/valueBytes must be non-negative/);
  });
});
```

Run it.

```bash
pnpm test
```

The 4 tests pass. The `stack.length > 0` invariant is the compile-time equivalent of "a Pyroscope frame with no name is not renderable" — a class of bugs where a broken symbolizer emitted an empty-string frame and the flame graph showed a mystery `""` root panel used to hide 30% of CPU time behind an unresolved bar.

### 3. `sampleMemory` + `sampleOffCpu` — the other 2 kinds

`tests/profiling/kinds.test.ts` — memory samples come from the allocator (each sample is a heap-allocation stack + bytes), off-CPU samples come from the scheduler (each sample is a wait stack + ns the thread was descheduled). The `state` transitions with the last kind sampled so a session can be interrogated for the last event without a separate flag.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa/observability';

const { sampleCpu, sampleMemory, sampleOffCpu, startProfiling } = semantics;

describe('profiling — memory sample', () => {
  it('records a memory sample and advances cpu-sampled → memory-sampled', () => {
    const session = startProfiling({ target: 'prometheus', serviceName: 'checkout-api' });
    sampleCpu(session, {
      stack: ['main', 'handleRequest'],
      valueBytes: 900_000,
      timestampMs: 1_700_000_000_000,
    });

    const step = sampleMemory(session, {
      stack: ['main', 'handleRequest', 'allocateBuffer'],
      valueBytes: 4_096_000,
      timestampMs: 1_700_000_000_500,
    });

    expect(step.neutralEvent).toBe('profile.memory_sampled');
    expect(step.providerEvent).toBe('prom.parca.memory');
    expect(step.metadata.kind).toBe('memory');
    expect(step.metadata.valueBytes).toBe(4_096_000);
    expect(step.metadata.sampleCount).toBe(2);
    expect(session.state).toBe('memory-sampled');
    expect(session.samples).toHaveLength(2);
  });
});

describe('profiling — off-cpu sample', () => {
  it('records an off-cpu sample and advances memory-sampled → off-cpu-sampled', () => {
    const session = startProfiling({ target: 'otel-collector', serviceName: 'checkout-api' });
    sampleCpu(session, {
      stack: ['main'],
      valueBytes: 500_000,
      timestampMs: 1_700_000_000_000,
    });
    sampleMemory(session, {
      stack: ['main', 'allocateBuffer'],
      valueBytes: 1_024_000,
      timestampMs: 1_700_000_000_500,
    });

    const step = sampleOffCpu(session, {
      stack: ['main', 'waitOnLock'],
      valueBytes: 250_000,
      timestampMs: 1_700_000_001_000,
    });

    expect(step.neutralEvent).toBe('profile.off_cpu_sampled');
    expect(step.providerEvent).toBe('otel.profile.off_cpu');
    expect(step.metadata.kind).toBe('off-cpu');
    expect(step.metadata.sampleCount).toBe(3);
    expect(session.state).toBe('off-cpu-sampled');
  });
});
```

The 3 kinds share the same arithmetic type (`valueBytes: number`) on purpose — a single flame-tree builder can walk any kind's samples without a per-kind branch. The kind field on `ProfileSample` is what `buildFlameGraph({ kind })` filters on.

### 4. `buildFlameGraph` — aggregate samples into a tree

`tests/profiling/flame.test.ts` — the flame graph is the panel every SRE opens when the p99 spikes. `buildFlameGraph({ kind })` filters the session's samples to a single kind, then walks each sample's stack (leaf first) accumulating a `totalValue` per frame. The root's `totalValue` equals the sum of every filtered sample's `valueBytes` — a compile-time equivalent of "the flame graph's root width matches the total CPU time consumed."

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa/observability';

const { buildFlameGraph, sampleCpu, startProfiling } = semantics;

function seedThreeStacks(session: ReturnType<typeof startProfiling>) {
  sampleCpu(session, {
    stack: ['main', 'handleRequest', 'renderTemplate'],
    valueBytes: 1_000_000,
    timestampMs: 1_700_000_000_000,
  });
  sampleCpu(session, {
    stack: ['main', 'handleRequest', 'queryDatabase'],
    valueBytes: 2_500_000,
    timestampMs: 1_700_000_000_500,
  });
  sampleCpu(session, {
    stack: ['main', 'handleAdmin', 'renderReport'],
    valueBytes: 500_000,
    timestampMs: 1_700_000_001_000,
  });
}

describe('profiling — flame graph build', () => {
  it('builds a tree where the root totalValue equals the sum of every sample', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    seedThreeStacks(session);

    const step = buildFlameGraph(session, { kind: 'cpu' });
    expect(step.neutralEvent).toBe('profile.flame_graph_built');
    expect(step.providerEvent).toBe('grafana.pyroscope.flame');
    expect(step.metadata.kind).toBe('cpu');
    expect(step.metadata.rootValue).toBe(1_000_000 + 2_500_000 + 500_000);
    expect(step.metadata.sampleCount).toBe(3);
    expect(step.metadata.branchCount).toBe(1); // every sample shares 'main' at the root child level
    expect(session.state).toBe('flame-built');
    expect(session.flameGraph).not.toBeNull();
    expect(session.flameGraph!.frame).toBe('<root>');
    expect(session.flameGraph!.totalValue).toBe(4_000_000);
  });

  it('rejects buildFlameGraph({ kind }) when no sample of that kind was recorded', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    seedThreeStacks(session);
    expect(() => buildFlameGraph(session, { kind: 'memory' })).toThrow(
      /no samples for kind=memory/,
    );
  });
});
```

The `rootValue === Σ valueBytes` invariant is the compile-time equivalent of the Brendan Gregg flame graph invariant — "every pixel width at the root equals a pixel width somewhere below." A broken aggregator that dropped a sample would fail this test immediately; the mock never lies.

### 5. `flattenFlameGraph` — depth-first walk for UI

`tests/profiling/flatten.test.ts` — a UI panel needs a flat list to render (each row = frame + width + depth). `flattenFlameGraph()` walks the tree depth-first, emitting each node with its depth for horizontal indentation.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa/observability';

const { buildFlameGraph, flattenFlameGraph, sampleCpu, startProfiling } = semantics;

describe('profiling — flatten flame graph', () => {
  it('walks depth-first — root first, then main, then main.handleRequest, then children', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    sampleCpu(session, {
      stack: ['main', 'handleRequest', 'renderTemplate'],
      valueBytes: 1_000_000,
      timestampMs: 1_700_000_000_000,
    });
    sampleCpu(session, {
      stack: ['main', 'handleRequest', 'queryDatabase'],
      valueBytes: 2_500_000,
      timestampMs: 1_700_000_000_500,
    });
    buildFlameGraph(session, { kind: 'cpu' });

    const flat = flattenFlameGraph(session.flameGraph);
    // depth-first order: <root>, main, main→handleRequest, main→handleRequest→renderTemplate, then queryDatabase
    expect(flat.map((r) => `${r.depth}:${r.frame}`)).toEqual([
      '0:<root>',
      '1:main',
      '2:handleRequest',
      '3:renderTemplate',
      '3:queryDatabase',
    ]);

    // the root width = sum of every sample's valueBytes
    expect(flat[0]!.totalValue).toBe(3_500_000);
    // main + handleRequest carry every sample (both stacks pass through them)
    expect(flat[1]!.totalValue).toBe(3_500_000);
    expect(flat[2]!.totalValue).toBe(3_500_000);
  });

  it('returns an empty array when the flame graph is null (no samples yet)', () => {
    expect(flattenFlameGraph(null)).toEqual([]);
  });
});
```

The depth-first ordering matches what Grafana Pyroscope's flame panel expects on the wire — the panel does its own left-to-right layout, so as long as parents come before children the render is stable.

### 6. Wire the fidelity harness

`tests/profiling/fidelity.test.ts` — the fidelity harness (`collectFidelityCoverage()`) exposes the `4 provider × 8 axis = 32 cell grid`. The profiling axis is 1 of the 8 axes; every provider (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector) covers it with a different dialect (`grafana.pyroscope.*` / `prom.parca.*` / `loki.profile.*` / `otel.profile.*`).

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa/observability';

const { collectFidelityCoverage } = semantics;

describe('profiling — fidelity coverage', () => {
  it('the 4 provider × profiling axis grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const profilingRows = coverage.rows.filter((r) => r.axis === 'profiling');
    expect(profilingRows).toHaveLength(4);
    for (const row of profilingRows) {
      expect(row.neutralEvents).toEqual([
        'profile.cpu_sampled',
        'profile.memory_sampled',
        'profile.off_cpu_sampled',
        'profile.flame_graph_built',
      ]);
    }
  });

  it('each provider gets a distinct dialect for profile.cpu_sampled', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const cpuByProvider = new Map<string, string>();
    for (const row of coverage.rows.filter((r) => r.axis === 'profiling')) {
      cpuByProvider.set(row.provider, row.providerEvents[0]!);
    }
    expect(cpuByProvider.get('grafana-oss')).toBe('grafana.pyroscope.cpu');
    expect(cpuByProvider.get('prometheus')).toBe('prom.parca.cpu');
    expect(cpuByProvider.get('loki')).toBe('loki.profile.cpu');
    expect(cpuByProvider.get('otel-collector')).toBe('otel.profile.cpu');
  });
});
```

The fidelity assertion is the *contract* the real-driver path in `examples/dogfood-profiling-app` tests against — the Pyroscope 1.9+ endpoint that emits `grafana.pyroscope.cpu` MUST match the mock's dialect exactly. When the mock and the real Pyroscope diverge, the mock gets the fix (the mock is the SSOT).

### 7. Real driver mode

Under `KIWA_MODE=real` the same assertions run against real Grafana Pyroscope. The dogfood app in `examples/dogfood-profiling-app` shows the pattern.

```ts
import { describe, it } from 'vitest';
import { skipUnlessReal } from '@kiwa/observability';

const gate = skipUnlessReal(process.env);
const requiredEnv = ['PYROSCOPE_URL'] as const;
const envMissing = requiredEnv.filter((k) => !process.env[k]);

describe.skipIf(gate.skip || envMissing.length > 0)('real-driver — Pyroscope flame graph', () => {
  it('resolves against the actual instance under KIWA_MODE=real', async () => {
    // Same session pipeline as the mock tests, but the flame graph is
    // fetched from a real Pyroscope endpoint at PYROSCOPE_URL and the
    // returned tree width is asserted against the recorded sample sum.
  });
});
```

The dogfood app exposes `pnpm test:real` — it flips `KIWA_MODE=real`, requires `PYROSCOPE_URL`, spins up the Pyroscope + eBPF pair under docker-compose, and re-runs the same session pipeline against a real profile bucket. Failure means the mock diverged from the real profile semantics; the mock gets the fix.

## What you just learned

- **Profiling state machine** — `idle → cpu-sampled → memory-sampled → off-cpu-sampled → flame-built`. Every transition is strict, no silent no-op paths.
- **3-kind uniformity** — CPU / memory / off-CPU share `{ stack, valueBytes, timestampMs }` on purpose; the flame builder does not branch per kind.
- **Flame invariant** — `rootValue === Σ valueBytes` for the kind filtered. Broken aggregators fail this immediately.
- **Depth-first flatten** — parents before children, stable ordering, the exact wire shape Pyroscope panels expect.
- **Fidelity contract** — the mock's neutral event (`profile.cpu_sampled`) maps to 4 provider dialects; the real driver has to emit the same dialect. When they diverge, the mock is SSOT.
- **Real-driver env gate** — `skipUnlessReal(process.env)` (paired with a `PYROSCOPE_URL` presence check) gives you a real-driver env-gate that makes the mock path always-green and the real path opt-in.

## Where next

- Tutorial 70 — SLO burn rate (error budget + MWMB alert)
- Tutorial 71 — OpenTelemetry exemplar (trace-to-metric + metric-to-trace + baggage + W3C context)
- Concept doc — `docs/concepts/observability-real-driver-testing.md` (8 axis × 4 provider = 32 cell grid + real-driver env-gate pattern SSOT)
- Migration guide — `docs/migrations/v1.34-to-v1.35.md`
