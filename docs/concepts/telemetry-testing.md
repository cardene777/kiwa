# Telemetry testing — kiwa SSOT

## Why real telemetry backends make tests brittle

- **coupled** — OTel needs a collector; Datadog needs the agent + API key; Sentry needs an ingest DSN. Every one of those is a network dependency in CI.
- **eventually consistent** — real backends buffer + batch + flush. A test that asserts on a metric emitted a moment ago must poll or sleep.
- **provider lock-in** — a SUT instrumented against Datadog today might swap to OTel tomorrow. Assertion code shouldn't need to change.

`@kiwa-lab/observability` v1.1 solves all three by writing telemetry to an in-process `TelemetryCollector` with a shape shared by all 3 provider mocks.

## The shared `TelemetryCollector`

Every provider mock writes into the same 5 sinks. This is the SSOT — assertion code targets the sinks, not the provider API.

```ts
class TelemetryCollector {
  spans: SpanRecord[];         // { name, attributes, startedAt, endedAt, events }
  metrics: MetricRecord[];     // { name, kind, value, tags, timestamp }
  logs: LogRecord[];           // { level, message, attributes, timestamp }
  exceptions: ExceptionRecord[];  // { message, fingerprint, stack, breadcrumbs, tags }
  transactions: TransactionRecord[];  // { name, operation, startedAt, endedAt, tags }
  spanByName(name): SpanRecord | undefined;
  metricSum(name): number;
  hasException(fingerprint): boolean;
  clear(): void;
}
```

## Per-provider API surface

Each factory returns a provider-flavoured API but writes into the shared collector.

### OpenTelemetry — `createOtelMock`

- `tracer.startSpan(name, { attributes?, parent? })` → span handle with `addEvent` / `setAttribute` / `end`
- `meter.createCounter(name)` → `{ add(value, tags?) }`
- `meter.createGauge(name)` → `{ record(value, tags?) }`
- `meter.createHistogram(name)` → `{ record(value, tags?) }`
- `logger.emit({ level, message, attributes })`

Matches OTel JS SDK shape closely — `tracer` / `meter` / `logger` mirror the real providers.

### Datadog — `createDatadogMock`

- `statsd.increment(name, value?, tags?)` (default value = 1)
- `statsd.gauge(name, value, tags?)`
- `statsd.histogram(name, value, tags?)`
- `tracer.startSpan(name, { tags?, childOf? })` → span handle with `addTags` / `log` / `finish`

Matches `dd-trace-js` + `hot-shots` shapes.

### Sentry — `createSentryMock`

- `captureException(err, { tags? })` → returns `fingerprint`
- `addBreadcrumb({ category, message, level? })` — accumulated into a pending queue
- `startTransaction({ name, op, tags? })` → transaction handle with `finish`

Two Sentry semantics worth pinning down:

1. **fingerprint dedupe** — same message → same fingerprint. Real Sentry groups by fingerprint; the mock does the same so assertions on "one bug reported N times" match production.
2. **breadcrumb lifecycle** — `addBreadcrumb` calls queue up until the next `captureException`, then attach to that exception's `breadcrumbs` field and clear. Matches Sentry SDK default.

## What NOT to test with the mock

- OTel exporter formats (OTLP / Zipkin / Jaeger wire encoding) — the mock does not serialise. Use the real exporter against a Jaeger container.
- Datadog agent flush timing — the mock is synchronous. Real flush cadence tests need the real agent.
- Sentry DSN routing / rate limit — the mock does not simulate transport-layer behaviour.

## Related

- [Tutorial 14 — Telemetry mock](../tutorials/14-observability)
- [`@kiwa-lab/observability` on npm](https://www.npmjs.com/package/@kiwa-lab/observability)
