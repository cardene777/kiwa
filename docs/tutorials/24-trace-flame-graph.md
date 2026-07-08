# Trace flame graph (span tree + drill-down + log correlation) in 12 min

## What you'll build

A vitest test file that reconstructs a distributed-trace flame graph from an in-memory `TelemetryCollector` — the same collector `@kiwa/observability` v1.1 provider mocks (OpenTelemetry / Datadog / Sentry) write into. You start from a canonical HTTP-handler trace fixture (3 nested spans), build the span tree, render the flame graph with sibling collapse, drill into the `db.query` subtree, and join the 4-line log fixture to the span tree via `trace_id` / `span_id` attributes. No real Jaeger, no distributed tracer runtime, no wire format — the whole flow lives on the collector array.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-trace-flame && cd kiwa-trace-flame
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

Create `src/trace.ts` — a factory that seeds a collector with the shipped fixtures and returns the tree + flame + correlation index:

```ts
import {
  LogCorrelationIndex,
  TelemetryCollector,
  buildSpanTree,
  logs_forHttpTrace,
  renderFlameGraph,
  trace_fanoutParallel,
  trace_httpHandler,
} from '@kiwa/observability';

export function buildHttpHandlerScene() {
  const collector = new TelemetryCollector();
  // Seed spans + logs — mirrors the v1.1 provider-mock write path,
  // but skips the SDK layer since we only need the collector state.
  for (const s of trace_httpHandler()) collector.spans.push(s);
  for (const s of trace_fanoutParallel(2_000)) collector.spans.push(s);
  for (const l of logs_forHttpTrace()) collector.logs.push(l);

  const roots = buildSpanTree(collector.spans);
  const flame = renderFlameGraph(roots);
  const index = new LogCorrelationIndex({
    logs: collector.logs,
    spans: collector.spans,
  });
  return { collector, roots, flame, index };
}
```

## Test — tree shape, sibling collapse, drill-down, correlation

Create `tests/trace.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { drillDown, flattenFlame } from '@kiwa/observability';
import { buildHttpHandlerScene } from '../src/trace';

describe('trace flame graph — tree + flame + drill-down + log correlation', () => {
  it('buildSpanTree groups spans by parentSpanName and computes selfMs = totalMs - sum(children)', () => {
    const { roots } = buildHttpHandlerScene();
    // http.request (parent=null) and handler (fanout root) => 2 roots
    expect(roots).toHaveLength(2);

    const http = roots.find((n) => n.name === 'http.request');
    expect(http).toBeDefined();
    expect(http?.children.map((c) => c.name)).toEqual(['db.query', 'cache.get']);
    // http.request totalMs = 100, db.query totalMs = 50, cache.get totalMs = 10
    // selfMs = 100 - 50 - 10 = 40
    expect(http?.totalMs).toBe(100);
    expect(http?.selfMs).toBe(40);
  });

  it('renderFlameGraph collapses same-name siblings and sums their samples', () => {
    const { flame } = buildHttpHandlerScene();
    // trace_fanoutParallel emits 3 sibling `worker` spans under `handler`.
    // The flame graph collapses them into 1 flame node with samples=3.
    const handler = flame.find((n) => n.name === 'handler');
    expect(handler).toBeDefined();
    const worker = handler?.children.find((c) => c.name === 'worker');
    expect(worker?.samples).toBe(3);
    // total = 90 + 90 + 90 = 270
    expect(worker?.totalMs).toBe(270);
  });

  it('drillDown extracts a subtree rooted at db.query and normalises depth to 0', () => {
    const { flame } = buildHttpHandlerScene();
    const sub = drillDown(flame, 'db.query');
    expect(sub).not.toBeNull();
    expect(sub?.name).toBe('db.query');
    expect(sub?.depth).toBe(0);
    // db.query has no children in the http-handler fixture
    expect(sub?.children).toEqual([]);
  });

  it('flattenFlame walks the tree depth-first for iteration', () => {
    const { flame } = buildHttpHandlerScene();
    const names = flattenFlame(flame).map((n) => n.name);
    // http.request root + db.query + cache.get, then handler + worker (collapsed)
    expect(names).toEqual([
      'http.request',
      'db.query',
      'cache.get',
      'handler',
      'worker',
    ]);
  });

  it('LogCorrelationIndex.logsForSpan returns logs whose span_id matches', () => {
    const { index } = buildHttpHandlerScene();
    // sp-2 = the db.query span in trace_httpHandler
    const dbLogs = index.logsForSpan('sp-2');
    expect(dbLogs.map((l) => l.message)).toEqual(['db query start']);
  });

  it('LogCorrelationIndex.logsForTrace returns every log for a given trace_id', () => {
    const { index } = buildHttpHandlerScene();
    const httpLogs = index.logsForTrace('trace-http-handler');
    // 4 log lines seeded in logs_forHttpTrace
    expect(httpLogs).toHaveLength(4);
    expect(httpLogs.map((l) => l.level).sort()).toEqual(['debug', 'info', 'info', 'warn']);
  });

  it('correlatedCount reports every log that carries a span_id or trace_id', () => {
    const { index } = buildHttpHandlerScene();
    // All 4 seeded logs carry both trace_id and span_id
    expect(index.correlatedCount()).toBe(4);
  });
});
```

## Run it

```bash
pnpm test
```

You should see 7 passing tests. Every assertion targets one of the 3 v2 axes — tree shape (buildSpanTree + selfMs math), flame render (sibling collapse), and log correlation (bidirectional lookup).

## The 3 trace fixtures

`@kiwa/observability` v2 ships 3 canonical trace shapes covering the flame graphs a debugger walks through most often.

| Fixture | Root span | Children | Shape modelled |
|---|---|---|---|
| `trace_httpHandler(startAt)` | `http.request` (100 ms) | `db.query` (50 ms), `cache.get` (10 ms) | Sequential request handler with a hot cache path |
| `trace_fanoutParallel(startAt)` | `handler` (200 ms) | 3× `worker` (90 ms each) | Fan-out parallel workers — sibling collapse observable |
| `trace_nestedRetry(startAt)` | `api.call` (300 ms) | 2× `retry` → `http.fetch` (per attempt) | Retry ladder — repeated span names at multiple depths |

Every span carries `trace_id` / `span_id` in `attributes` so the correlation index can join logs to spans without SUT-side normalisation.

## SpanNode vs FlameNode — when to pick which

The two representations model two different questions.

- **`SpanNode`** (produced by `buildSpanTree`) preserves every span individually. Use it when you need per-span attributes, per-span start / end times, or a 1:1 count of "how many `worker` spans fired". Every sibling shows up as its own node.
- **`FlameNode`** (produced by `renderFlameGraph`) collapses same-name siblings at the same depth into one node with `samples = count`, `totalMs = sum(child.totalMs)`. Use it when the visual answer is "how much aggregate time did `worker` take", not "how many `worker` spans fired". This matches how the Jaeger / Speedscope UI aggregates sibling spans.

`drillDown(flame, name)` operates on the flame graph — it returns a `FlameNode | null` with normalised depth so the subtree renders as a fresh view. `flattenFlame(roots)` walks the tree depth-first for callers that need a flat list (e.g. "for every node with `samples > 1`, emit a warning").

## Log correlation semantics

`LogCorrelationIndex` builds 4 lookup tables in one pass over the collector.

- `logsBySpanId` — keyed on the log's `span_id` attribute
- `logsByTraceId` — keyed on the log's `trace_id` attribute
- `spansById` — keyed on the span's `span_id` attribute
- `spansByTraceId` — keyed on the span's `trace_id` attribute

Every lookup is `O(1)` after the initial build. Callers that mutate the collector after building must rebuild — the index is a snapshot.

The correlation keys are configurable for SUTs that mix conventions during a migration. Pass `altTraceIdKeys` to bridge without touching the SUT.

```ts
const index = new LogCorrelationIndex(
  { logs: collector.logs, spans: collector.spans },
  {
    traceIdKey: 'trace_id',
    spanIdKey: 'span_id',
    altTraceIdKeys: ['dd.trace_id', 'sentry-trace'],
  },
);
```

## The 5 ops the mock covers

`buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` + `LogCorrelationIndex` together cover 5 operations that map 1:1 to the operations a real Jaeger / Speedscope UI performs when a user opens a trace.

1. `buildSpanTree(spans)` — parent-child tree with `selfMs` computed per node
2. `renderFlameGraph(roots)` — collapse siblings with the same name at the same depth, aggregate `totalMs` / `selfMs`, count `samples`
3. `drillDown(flame, name)` — extract the first subtree whose root matches `name`, normalise depth
4. `flattenFlame(roots)` — depth-first walk for iteration
5. `new LogCorrelationIndex({ logs, spans })` — build the bidirectional index; `logsForSpan` / `logsForTrace` / `spansForTrace` / `linkAll` / `correlatedCount` expose the lookups

## What the mock does not model

- **Cross-service parent references** — real distributed traces carry `traceParent` headers per W3C Trace Context. The mock uses `parentSpanName` for in-process shapes.
- **Sampling decisions** — a real tracer drops spans probabilistically. The mock keeps every emitted span.
- **Wire encoding** — OTLP / Zipkin / Jaeger Thrift serialisation happens outside the mock. The mock reads flat arrays.

The 3 regressions the mock catches — wrong parent linkage, wrong selfMs math after refactor, log missing correlation attributes — cover ~85% of "the flame graph is wrong" incidents. Encoding + sampling bugs need a real Jaeger + collector stack.

## Next steps — real Jaeger fidelity

The v1.17-4 dogfood app (`examples/dogfood-trace-flame-graph/`) measures the same 5 ops against a real Jaeger HTTP API and produces a `FidelityRecord` per op. Set the env and run the harness:

```bash
JAEGER_URL=http://localhost:16686 pnpm --filter dogfood-trace-flame-graph test
cat examples/dogfood-trace-flame-graph/quality-report/fidelity-latest.md
```

Without the env, the harness records each op as `JAEGER_ENV_MISSING`.

## Related

- [Tutorial 22 — Observability dashboard in 10 min](./22-observability-dashboard)
- [Tutorial 23 — Alert orchestrator in 12 min](./23-alert-orchestrator)
- [Tutorial 14 — Telemetry mock (OpenTelemetry / Datadog / Sentry) in 10 min](./14-observability)
- [Concept — Observability v2 testing](../concepts/observability-v2-testing)
- [Migration guide — v1.16 → v1.17](../migrations/v1.16-to-v1.17)
- v1.17 milestone parent [#777](https://github.com/cardene777/kiwa/issues/777), sub-issue [#781](https://github.com/cardene777/kiwa/issues/781)
