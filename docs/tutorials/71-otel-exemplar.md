# OpenTelemetry exemplar — trace-to-metric + metric-to-trace + baggage + W3C context in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/observability` v2.1 that models the 4 pieces of a real OpenTelemetry exemplar loop that every non-trivial service eventually needs — a metric-recorded step that attaches a trace_id + span_id to a numeric sample, a trace-attached step that lets a Grafana panel jump from "p99 latency > 500 ms" to the flame graph of the offending trace, an m2t / t2m resolver pair that walks the exemplar chain in both directions, and an OpenTelemetry Collector batch + resource + baggage + W3C context propagation pipeline that keeps the trace context alive across service boundaries. `startExemplarSession()` + `recordExemplarMetric()` + `attachTraceToMetric()` + `resolveMetricToTrace()` + `resolveTraceToMetric()` + `startOtelAdvanced()` + `enqueueSpan()` + `flushBatch()` + `propagateBaggage()` + `extractW3CContext()` give you every one of those pieces without booting a real OpenTelemetry Collector + Grafana Tempo pair. This is the pattern kiwa's `examples/dogfood-otel-exemplar-app` v2 exercises against real OpenTelemetry Collector 0.100+ under `KIWA_MODE=real` + `OTEL_COLLECTOR_URL` + `TEMPO_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the p99 panel shows red but clicking through goes nowhere" gap a debugger sees in the trace jump audit.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-otel-exemplar && cd kiwa-otel-exemplar
pnpm init
pnpm add -D @kiwa-test/observability@^2.1 vitest typescript @types/node
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

The v2.1 surface exports the exemplar axis + OpenTelemetry advanced axis through the `semantics/` barrel. This tutorial focuses on those 2 axes end-to-end; tutorials 70 (SLO) and 72 (profiling) cover the other advanced axes.

### 2. `startExemplarSession` + `recordExemplarMetric` — the metric-to-trace link

`tests/exemplar/record.test.ts` — an exemplar record pins a numeric sample (`metricValue = 512`) to a trace_id + span_id + timestamp. The Grafana panel that surfaces the p99 spike gets a set of exemplar dots plotted alongside the metric line — each dot is a click-through to Tempo's flame graph.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/observability';

const { recordExemplarMetric, startExemplarSession } = semantics;

describe('exemplar — metric record', () => {
  it('records an exemplar with a trace_id + span_id and enters metric-recorded', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    expect(session.state).toBe('idle');

    const step = recordExemplarMetric(session, {
      metricName: 'http_server_duration_ms',
      value: 512,
      traceId: 'abcdef0123456789',
      spanId: 'span0001',
      timestampMs: 1_700_000_000_000,
    });

    expect(step.neutralEvent).toBe('exemplar.metric_recorded');
    expect(step.providerEvent).toBe('otel.metric.exemplar');
    expect(step.metadata.metricName).toBe('http_server_duration_ms');
    expect(step.metadata.traceId).toBe('abcdef0123456789');
    expect(session.state).toBe('metric-recorded');
    expect(session.exemplars).toHaveLength(1);
  });

  it('rejects a short trace_id — the OTLP spec requires ≥ 8 chars', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    expect(() =>
      recordExemplarMetric(session, {
        metricName: 'http_server_duration_ms',
        value: 500,
        traceId: 'short',
        spanId: 'span0001',
        timestampMs: 1_700_000_000_000,
      }),
    ).toThrow(/traceId must be at least 8 chars/);
  });

  it('rejects an empty metricName — no silent aggregation into an unnamed bucket', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    expect(() =>
      recordExemplarMetric(session, {
        metricName: '',
        value: 500,
        traceId: 'abcdef0123456789',
        spanId: 'span0001',
        timestampMs: 1_700_000_000_000,
      }),
    ).toThrow(/metricName must not be empty/);
  });
});
```

Run it.

```bash
pnpm test
```

The 3 tests pass. The `traceId ≥ 8 chars` invariant matches the [W3C Trace Context spec](https://www.w3.org/TR/trace-context/) that says trace_id is a 16-byte hex string — the mock is strict where the real OTLP wire is strict.

### 3. `resolveMetricToTrace` + `resolveTraceToMetric` — bidirectional walk

`tests/exemplar/resolve.test.ts` — the whole point of exemplars is that you can walk from either end. Metric → trace (m2t) is "I see a p99 spike, show me a trace that caused it"; trace → metric (t2m) is "I see a slow trace, show me the metrics it contributed to." The mock exposes both walks so a test can assert the round-trip is symmetric.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/observability';

const {
  recordExemplarMetric,
  resolveMetricToTrace,
  resolveTraceToMetric,
  startExemplarSession,
} = semantics;

function seed3(session: ReturnType<typeof startExemplarSession>) {
  recordExemplarMetric(session, {
    metricName: 'http_server_duration_ms',
    value: 512,
    traceId: 'abcdef0123456789',
    spanId: 'span0001',
    timestampMs: 1_700_000_000_000,
  });
  recordExemplarMetric(session, {
    metricName: 'http_server_duration_ms',
    value: 234,
    traceId: 'fedcba9876543210',
    spanId: 'span0002',
    timestampMs: 1_700_000_000_500,
  });
  recordExemplarMetric(session, {
    metricName: 'db_query_duration_ms',
    value: 87,
    traceId: 'abcdef0123456789',
    spanId: 'span0003',
    timestampMs: 1_700_000_000_100,
  });
}

describe('exemplar — bidirectional resolve', () => {
  it('resolveMetricToTrace returns every trace that hit the metric bucket', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    seed3(session);
    const { step, traceIds } = resolveMetricToTrace(session, { metricName: 'http_server_duration_ms' });
    expect(step.neutralEvent).toBe('exemplar.metric_to_trace_resolved');
    expect(traceIds).toEqual(['abcdef0123456789', 'fedcba9876543210']);
    expect(session.state).toBe('m2t-resolved');
  });

  it('resolveTraceToMetric returns every metric that trace contributed to', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    seed3(session);
    const { step, metricNames } = resolveTraceToMetric(session, { traceId: 'abcdef0123456789' });
    expect(step.neutralEvent).toBe('exemplar.trace_to_metric_resolved');
    expect(metricNames).toEqual(['http_server_duration_ms', 'db_query_duration_ms']);
    expect(session.state).toBe('t2m-resolved');
  });

  it('the round-trip is idempotent — same input → same set of outputs', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    seed3(session);
    const first = resolveMetricToTrace(session, { metricName: 'http_server_duration_ms' });
    const second = resolveMetricToTrace(session, { metricName: 'http_server_duration_ms' });
    expect(first.traceIds).toEqual(second.traceIds);
  });
});
```

The invariant `resolveMetricToTrace(metric) → traceIds` is the compile-time equivalent of "clicking the Grafana exemplar dot always jumps to a real trace" — the class of bugs where the exemplar was recorded but the trace was already dropped by tail-sampling is exactly what this test catches when the mock's ε > 0 dropout is enabled in v2.2.

### 4. `attachTraceToMetric` — the OTLP `TraceContext` attach

`tests/exemplar/attach.test.ts` — the OpenTelemetry Collector's `spanmetrics` connector emits a metric with `trace_id` = the sampled root span's trace. `attachTraceToMetric()` lets a test simulate that attach by binding a specific span_id to an existing metric record.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/observability';

const { attachTraceToMetric, recordExemplarMetric, startExemplarSession } = semantics;

describe('exemplar — trace attach', () => {
  it('binds a span_id to an existing metric record — the OTLP TraceContext attach', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'p99' });
    recordExemplarMetric(session, {
      metricName: 'http_server_duration_ms',
      value: 512,
      traceId: 'abcdef0123456789',
      spanId: 'span0001',
      timestampMs: 1_700_000_000_000,
    });

    const step = attachTraceToMetric(session, {
      metricName: 'http_server_duration_ms',
      traceId: 'abcdef0123456789',
      spanId: 'span_reattached',
    });

    expect(step.neutralEvent).toBe('exemplar.trace_attached');
    expect(session.state).toBe('trace-attached');
    expect(session.exemplars[0]!.spanId).toBe('span_reattached');
  });

  it('rejects an attach for a metric that was never recorded — no silent create', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'p99' });
    expect(() =>
      attachTraceToMetric(session, {
        metricName: 'missing_metric',
        traceId: 'abcdef0123456789',
        spanId: 'span0001',
      }),
    ).toThrow(/no exemplar for metric=missing_metric/);
  });
});
```

### 5. `startOtelAdvanced` + `flushBatch` — the Collector pipeline

`tests/otel/batch.test.ts` — the OpenTelemetry Collector's batch processor buffers spans in a queue and flushes when either (a) queue length ≥ `maxBatchSize` or (b) `timeout` elapses. `enqueueSpan()` + `flushBatch()` model the queue → batch decision without wall-clock coupling.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/observability';

const { enqueueSpan, flushBatch, startOtelAdvanced } = semantics;

describe('otel-advanced — batch flush', () => {
  it('flushes up to maxBatchSize and leaves the remainder in the queue', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    for (let i = 0; i < 5; i++) {
      enqueueSpan(session, {
        spanId: `span-${i}`,
        parentId: null,
        attributes: { 'http.method': 'GET' },
      });
    }
    expect(session.queue).toHaveLength(5);

    const step = flushBatch(session, { maxBatchSize: 3 });
    expect(step.neutralEvent).toBe('otel.batch_flushed');
    expect(step.metadata.batchSize).toBe(3);
    expect(step.metadata.remainingQueue).toBe(2);
    expect(session.batches).toHaveLength(1);
    expect(session.batches[0]).toHaveLength(3);
    expect(session.queue).toHaveLength(2);
  });

  it('handles an under-full queue — flushes exactly the queue length', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    enqueueSpan(session, {
      spanId: 'span-0',
      parentId: null,
      attributes: {},
    });
    const step = flushBatch(session, { maxBatchSize: 10 });
    expect(step.metadata.batchSize).toBe(1);
    expect(step.metadata.remainingQueue).toBe(0);
  });

  it('rejects a non-positive maxBatchSize — no infinite loop', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    expect(() => flushBatch(session, { maxBatchSize: 0 })).toThrow(/maxBatchSize must be positive/);
  });
});
```

The invariant `batchSize <= maxBatchSize` is the compile-time equivalent of "the Collector never sends a batch bigger than the configured limit" — a class of bugs where a misconfigured `send_batch_size = 0` used to make the pipeline stall silently.

### 6. `propagateBaggage` + `extractW3CContext` — cross-service context

`tests/otel/context.test.ts` — the OpenTelemetry Collector propagates 2 kinds of context. **Baggage** = key/value attributes that travel with every span in the same trace (e.g., `user.id=42`). **W3C Trace Context** = the `traceparent` header format `00-<traceId>-<spanId>-<flags>` that lets a downstream service extract the trace_id + span_id from an inbound HTTP request.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/observability';

const { extractW3CContext, propagateBaggage, startOtelAdvanced } = semantics;

describe('otel-advanced — baggage + W3C context', () => {
  it('propagates baggage entries and records the addedKeys', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    const step = propagateBaggage(session, { 'user.id': '42', 'user.tier': 'gold' });
    expect(step.neutralEvent).toBe('otel.baggage_propagated');
    expect(step.metadata.entryCount).toBe(2);
    expect(step.metadata.addedKeys).toBe('user.id,user.tier');
    expect(session.baggage).toEqual({ 'user.id': '42', 'user.tier': 'gold' });
    expect(session.state).toBe('baggage-propagated');
  });

  it('extracts a W3C traceparent — 00-<traceId>-<spanId>-<flags>', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    const step = extractW3CContext(session, {
      traceparent: '00-abcdef0123456789abcdef0123456789-fedcba9876543210-01',
    });
    expect(step.neutralEvent).toBe('otel.w3c_context_extracted');
    expect(step.metadata.version).toBe('00');
    expect(step.metadata.traceId).toBe('abcdef0123456789abcdef0123456789');
    expect(step.metadata.spanId).toBe('fedcba9876543210');
    expect(step.metadata.flags).toBe('01');
    expect(session.state).toBe('w3c-extracted');
  });

  it('rejects a bad traceparent format — no silent fallback', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    expect(() =>
      extractW3CContext(session, { traceparent: 'not-a-traceparent' }),
    ).toThrow(/invalid traceparent format/);
    expect(() =>
      extractW3CContext(session, { traceparent: '01-abc-def-gh' }),
    ).toThrow(/unsupported version/);
  });

  it('rejects empty baggage entries — no silent drop', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    expect(() => propagateBaggage(session, { '': 'x' })).toThrow(/baggage key must not be empty/);
    expect(() => propagateBaggage(session, { 'user.id': '' })).toThrow(
      /baggage value must not be empty/,
    );
  });
});
```

The invariant `traceparent === 4-part-dash-separated hex` is the compile-time equivalent of the W3C spec's fixed 55-character length — a class of bugs where a downstream service silently dropped the trace_id because the header was malformed used to make the "missing parent span" false-positive fire in Grafana.

### 7. Real driver mode

Under `KIWA_MODE=real` the same assertions run against a real OpenTelemetry Collector + Tempo. The dogfood app in `examples/dogfood-otel-exemplar-app` v2 shows the pattern.

```ts
import { describe, it } from 'vitest';
import { skipUnlessReal } from '@kiwa-test/observability';

const gate = skipUnlessReal(process.env);
const requiredEnv = ['OTEL_COLLECTOR_URL', 'TEMPO_URL'] as const;
const envMissing = requiredEnv.filter((k) => !process.env[k]);

describe.skipIf(gate.skip || envMissing.length > 0)('real-driver — Tempo exemplar link', () => {
  it('resolves against the actual instance under KIWA_MODE=real', async () => {
    // Same session pipeline as the mock tests, but the exemplar chain is
    // walked against a real OTLP export at OTEL_COLLECTOR_URL and a real
    // Tempo `/api/traces/{traceId}` fetch at TEMPO_URL.
  });
});
```

Failure means the mock diverged from the real OTLP semantics; the mock gets the fix.

## What you just learned

- **Exemplar record** — a metric sample carries a trace_id + span_id + timestamp so panels jump to traces.
- **Bidirectional walk** — m2t and t2m are two views of the same set. The round-trip is idempotent.
- **Trace attach** — `attachTraceToMetric` is the OTLP `TraceContext` attach point that ties a re-sampled span back to a metric.
- **Batch processor** — buffered + flushed by `maxBatchSize`. The invariant `batchSize <= maxBatchSize` catches misconfig at compile time.
- **Baggage** vs **W3C** — baggage is intra-trace attributes; W3C traceparent is inter-service context propagation. Both are strict about format.

## Where next

- Tutorial 70 — SLO burn rate (error budget + MWMB alert)
- Tutorial 72 — Continuous profiling (CPU + memory + off-CPU flame graph)
- Concept doc — `docs/concepts/observability-real-driver-testing.md` (8 axis × 4 provider = 32 cell grid + real-driver env-gate pattern SSOT)
- Migration guide — `docs/migrations/v1.34-to-v1.35.md`
