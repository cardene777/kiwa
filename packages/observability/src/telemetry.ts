/**
 * Telemetry provider mock — v0.2 addition (v1.14-4).
 *
 * Adds unified in-memory collectors for the 3 major APM / error providers:
 * - OpenTelemetry (span / metric / log)
 * - Datadog (StatsD gauge/increment/histogram + tracer.startSpan)
 * - Sentry (captureException / addBreadcrumb / startTransaction)
 *
 * The v1.0 observability API (flaky + spec coverage) targets test-run
 * analysis. This module targets application telemetry emitted during
 * test execution so kiwa tests can assert "the SUT emitted span X",
 * "the metric counter incremented", or "the exception was captured
 * with fingerprint Y".
 */

export type TelemetryProvider = 'otel' | 'datadog' | 'sentry';

export interface SpanRecord {
  name: string;
  attributes: Record<string, unknown>;
  startedAt: number;
  endedAt: number | null;
  parentSpanName: string | null;
  events: Array<{ name: string; attributes: Record<string, unknown>; timestamp: number }>;
}

export interface MetricRecord {
  name: string;
  kind: 'counter' | 'gauge' | 'histogram';
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

export interface LogRecord {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  attributes: Record<string, unknown>;
  timestamp: number;
}

export interface ExceptionRecord {
  message: string;
  fingerprint: string;
  stack: string | null;
  breadcrumbs: Array<{ category: string; message: string; level: string; timestamp: number }>;
  tags: Record<string, string>;
  timestamp: number;
}

export interface TransactionRecord {
  name: string;
  operation: string;
  startedAt: number;
  endedAt: number | null;
  tags: Record<string, string>;
}

/**
 * Shared collector — every provider mock writes into the same shape
 * so kiwa tests can assert once regardless of provider chosen.
 */
export class TelemetryCollector {
  readonly spans: SpanRecord[] = [];
  readonly metrics: MetricRecord[] = [];
  readonly logs: LogRecord[] = [];
  readonly exceptions: ExceptionRecord[] = [];
  readonly transactions: TransactionRecord[] = [];

  clear(): void {
    this.spans.length = 0;
    this.metrics.length = 0;
    this.logs.length = 0;
    this.exceptions.length = 0;
    this.transactions.length = 0;
  }

  spanByName(name: string): SpanRecord | undefined {
    return this.spans.find((s) => s.name === name);
  }

  metricSum(name: string): number {
    return this.metrics
      .filter((m) => m.name === name)
      .reduce((sum, m) => sum + m.value, 0);
  }

  hasException(fingerprint: string): boolean {
    return this.exceptions.some((e) => e.fingerprint === fingerprint);
  }
}

export interface OtelMock {
  readonly provider: 'otel';
  readonly collector: TelemetryCollector;
  tracer: {
    startSpan(name: string, options?: { attributes?: Record<string, unknown>; parent?: string }): {
      addEvent(name: string, attributes?: Record<string, unknown>): void;
      setAttribute(key: string, value: unknown): void;
      end(): void;
    };
  };
  meter: {
    createCounter(name: string): { add(value: number, tags?: Record<string, string>): void };
    createGauge(name: string): { record(value: number, tags?: Record<string, string>): void };
    createHistogram(name: string): { record(value: number, tags?: Record<string, string>): void };
  };
  logger: {
    emit(record: Omit<LogRecord, 'timestamp'>): void;
  };
}

export function createOtelMock(config?: { now?: () => number }): OtelMock {
  const now = config?.now ?? Date.now;
  const collector = new TelemetryCollector();
  return {
    provider: 'otel',
    collector,
    tracer: {
      startSpan(name, options) {
        const span: SpanRecord = {
          name,
          attributes: { ...(options?.attributes ?? {}) },
          startedAt: now(),
          endedAt: null,
          parentSpanName: options?.parent ?? null,
          events: [],
        };
        collector.spans.push(span);
        return {
          addEvent(evName, attrs) {
            span.events.push({ name: evName, attributes: attrs ?? {}, timestamp: now() });
          },
          setAttribute(key, value) {
            span.attributes[key] = value;
          },
          end() {
            span.endedAt = now();
          },
        };
      },
    },
    meter: {
      createCounter(name) {
        return {
          add(value, tags) {
            collector.metrics.push({ name, kind: 'counter', value, tags: tags ?? {}, timestamp: now() });
          },
        };
      },
      createGauge(name) {
        return {
          record(value, tags) {
            collector.metrics.push({ name, kind: 'gauge', value, tags: tags ?? {}, timestamp: now() });
          },
        };
      },
      createHistogram(name) {
        return {
          record(value, tags) {
            collector.metrics.push({ name, kind: 'histogram', value, tags: tags ?? {}, timestamp: now() });
          },
        };
      },
    },
    logger: {
      emit(record) {
        collector.logs.push({ ...record, timestamp: now() });
      },
    },
  };
}

export interface DatadogMock {
  readonly provider: 'datadog';
  readonly collector: TelemetryCollector;
  statsd: {
    increment(name: string, value?: number, tags?: Record<string, string>): void;
    gauge(name: string, value: number, tags?: Record<string, string>): void;
    histogram(name: string, value: number, tags?: Record<string, string>): void;
  };
  tracer: {
    startSpan(name: string, options?: { tags?: Record<string, string>; childOf?: string }): {
      addTags(tags: Record<string, string>): void;
      log(fields: Record<string, unknown>): void;
      finish(): void;
    };
  };
}

export function createDatadogMock(config?: { now?: () => number }): DatadogMock {
  const now = config?.now ?? Date.now;
  const collector = new TelemetryCollector();
  return {
    provider: 'datadog',
    collector,
    statsd: {
      increment(name, value = 1, tags) {
        collector.metrics.push({ name, kind: 'counter', value, tags: tags ?? {}, timestamp: now() });
      },
      gauge(name, value, tags) {
        collector.metrics.push({ name, kind: 'gauge', value, tags: tags ?? {}, timestamp: now() });
      },
      histogram(name, value, tags) {
        collector.metrics.push({ name, kind: 'histogram', value, tags: tags ?? {}, timestamp: now() });
      },
    },
    tracer: {
      startSpan(name, options) {
        const span: SpanRecord = {
          name,
          attributes: { ...(options?.tags ?? {}) },
          startedAt: now(),
          endedAt: null,
          parentSpanName: options?.childOf ?? null,
          events: [],
        };
        collector.spans.push(span);
        return {
          addTags(tags) {
            Object.assign(span.attributes, tags);
          },
          log(fields) {
            span.events.push({ name: 'log', attributes: fields, timestamp: now() });
          },
          finish() {
            span.endedAt = now();
          },
        };
      },
    },
  };
}

export interface SentryMock {
  readonly provider: 'sentry';
  readonly collector: TelemetryCollector;
  captureException(err: Error | { message: string; stack?: string }, options?: { tags?: Record<string, string> }): string;
  addBreadcrumb(input: { category: string; message: string; level?: string }): void;
  startTransaction(input: { name: string; op: string; tags?: Record<string, string> }): {
    finish(): void;
  };
}

export function createSentryMock(config?: { now?: () => number }): SentryMock {
  const now = config?.now ?? Date.now;
  const collector = new TelemetryCollector();
  const pendingBreadcrumbs: ExceptionRecord['breadcrumbs'] = [];
  return {
    provider: 'sentry',
    collector,
    captureException(err, options) {
      const message = err instanceof Error ? err.message : err.message;
      const stack = err instanceof Error ? err.stack ?? null : err.stack ?? null;
      const fingerprint = fingerprintFor(message);
      const record: ExceptionRecord = {
        message,
        fingerprint,
        stack,
        breadcrumbs: [...pendingBreadcrumbs],
        tags: options?.tags ?? {},
        timestamp: now(),
      };
      collector.exceptions.push(record);
      pendingBreadcrumbs.length = 0;
      return fingerprint;
    },
    addBreadcrumb(input) {
      pendingBreadcrumbs.push({
        category: input.category,
        message: input.message,
        level: input.level ?? 'info',
        timestamp: now(),
      });
    },
    startTransaction(input) {
      const t: TransactionRecord = {
        name: input.name,
        operation: input.op,
        startedAt: now(),
        endedAt: null,
        tags: input.tags ?? {},
      };
      collector.transactions.push(t);
      return {
        finish() {
          t.endedAt = now();
        },
      };
    },
  };
}

function fingerprintFor(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i += 1) {
    hash = (hash * 31 + message.charCodeAt(i)) | 0;
  }
  return `fp_${(hash >>> 0).toString(16)}`;
}
