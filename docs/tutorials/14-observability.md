# Telemetry mock (OpenTelemetry / Datadog / Sentry)

## What you'll build

A vitest test file that asserts on **span / metric / log / exception** telemetry emitted by the SUT, without depending on a real OTel collector, StatsD daemon, or Sentry ingest. `@kiwa/observability` v1.1 exposes a shared `TelemetryCollector` shape so the assertion code is identical regardless of which provider the SUT is instrumented against.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-telemetry && cd kiwa-telemetry
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa/observability
```

`package.json` + `tsconfig.json` — same shape as tutorial 12.

## Test 1 — OpenTelemetry spans + metrics + logs

```ts
import { describe, expect, it } from 'vitest';
import { createOtelMock } from '@kiwa/observability';

describe('otel', () => {
  it('startSpan + addEvent + end', () => {
    let clock = 100;
    const otel = createOtelMock({ now: () => clock });
    const span = otel.tracer.startSpan('handle-request', { attributes: { route: '/api' } });
    clock = 105;
    span.addEvent('cache-miss', { key: 'user:1' });
    clock = 110;
    span.end();

    const rec = otel.collector.spanByName('handle-request');
    expect(rec?.attributes.route).toBe('/api');
    expect(rec?.events[0]?.name).toBe('cache-miss');
    expect(rec?.endedAt).toBe(110);
  });

  it('counter + gauge + histogram all land in the collector', () => {
    const otel = createOtelMock();
    otel.meter.createCounter('req.total').add(3, { route: '/a' });
    otel.meter.createGauge('mem.used').record(512);
    otel.meter.createHistogram('lat.ms').record(42);
    expect(otel.collector.metricSum('req.total')).toBe(3);
  });
});
```

## Test 2 — Datadog StatsD + tracer

```ts
import { describe, expect, it } from 'vitest';
import { createDatadogMock } from '@kiwa/observability';

describe('datadog', () => {
  it('statsd.increment default value = 1', () => {
    const dd = createDatadogMock();
    dd.statsd.increment('api.hit');
    dd.statsd.increment('api.hit', 5);
    expect(dd.collector.metricSum('api.hit')).toBe(6);
  });

  it('tracer.startSpan carries tags into span record', () => {
    const dd = createDatadogMock();
    const span = dd.tracer.startSpan('db.query', { tags: { engine: 'pg' } });
    span.addTags({ table: 'users' });
    span.finish();
    expect(dd.collector.spanByName('db.query')?.attributes.engine).toBe('pg');
    expect(dd.collector.spanByName('db.query')?.attributes.table).toBe('users');
  });
});
```

## Test 3 — Sentry captureException + breadcrumbs + fingerprint

```ts
import { describe, expect, it } from 'vitest';
import { createSentryMock } from '@kiwa/observability';

describe('sentry', () => {
  it('captureException records fingerprint + tags', () => {
    const sentry = createSentryMock();
    const fp = sentry.captureException(new Error('db down'), { tags: { region: 'us' } });
    expect(sentry.collector.hasException(fp)).toBe(true);
  });

  it('breadcrumbs attach to next captureException, then clear', () => {
    const sentry = createSentryMock();
    sentry.addBreadcrumb({ category: 'ui', message: 'clicked-button' });
    sentry.addBreadcrumb({ category: 'net', message: 'fetch /api' });
    sentry.captureException(new Error('boom'));
    sentry.captureException(new Error('boom2'));
    expect(sentry.collector.exceptions[0]?.breadcrumbs).toHaveLength(2);
    expect(sentry.collector.exceptions[1]?.breadcrumbs).toHaveLength(0);
  });

  it('same message = same fingerprint (dedupe)', () => {
    const sentry = createSentryMock();
    expect(sentry.captureException(new Error('X'))).toBe(sentry.captureException(new Error('X')));
  });
});
```

Run all three:

```bash
pnpm test
```

You should see 8 passing tests.

## Provider-neutral collector shape

All three mocks write into `TelemetryCollector` with the same 5 sinks:

- `spans: SpanRecord[]`
- `metrics: MetricRecord[]`
- `logs: LogRecord[]`
- `exceptions: ExceptionRecord[]`
- `transactions: TransactionRecord[]`

So a SUT instrumented against OTel today and Datadog tomorrow can reuse the same assertion code.

## Related

- [`@kiwa/observability` on npm](https://www.npmjs.com/package/@kiwa/observability)
- [Concept — telemetry testing SSOT](../concepts/telemetry-testing)
