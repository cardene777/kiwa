/**
 * Log correlation mock — v2.0 addition (v1.17-1).
 *
 * Joins the TelemetryCollector.logs sink with the .spans sink via
 * traceId / spanId attribute keys, then exposes bidirectional query
 * helpers: logs-for-span (span → logs), spans-for-log (log → spans),
 * and a flat index for kiwa test assertions.
 *
 * The mock stays SUT-agnostic — kiwa tests can assert "3 warning
 * logs joined to span X", "log line Y correlates to trace Z".
 */
import type { LogRecord, SpanRecord } from './telemetry.js';

/**
 * Attribute keys used to look up trace / span ids on both sides.
 * Callers can override for SDKs that use different key conventions
 * (OpenTelemetry canonical is `trace_id` / `span_id`, Datadog is
 * `dd.trace_id`, Sentry is `sentry-trace`).
 */
export interface CorrelationKeys {
  traceIdKey?: string;
  spanIdKey?: string;
  /**
   * Fallback trace key checked when `traceIdKey` is not present.
   * Useful when the SUT mixes conventions during a migration.
   */
  altTraceIdKeys?: string[];
}

export interface LogSpanLink {
  log: LogRecord;
  span: SpanRecord | null;
  traceId: string | null;
  spanId: string | null;
}

/**
 * Bidirectional index over the collector's logs / spans sinks. The
 * index is built once from the current collector state; callers who
 * mutate the collector after building must rebuild.
 */
export class LogCorrelationIndex {
  private readonly logs: LogRecord[];
  private readonly spans: SpanRecord[];
  private readonly keys: Required<CorrelationKeys>;
  private readonly logsBySpanId = new Map<string, LogRecord[]>();
  private readonly logsByTraceId = new Map<string, LogRecord[]>();
  private readonly spansById = new Map<string, SpanRecord>();
  private readonly spansByTraceId = new Map<string, SpanRecord[]>();

  constructor(
    input: { logs: LogRecord[]; spans: SpanRecord[] },
    keys?: CorrelationKeys,
  ) {
    this.logs = input.logs;
    this.spans = input.spans;
    this.keys = {
      traceIdKey: keys?.traceIdKey ?? 'trace_id',
      spanIdKey: keys?.spanIdKey ?? 'span_id',
      altTraceIdKeys: keys?.altTraceIdKeys ?? [],
    };
    this.buildIndex();
  }

  private buildIndex(): void {
    for (const log of this.logs) {
      const spanId = readAttr(log.attributes, this.keys.spanIdKey);
      const traceId = this.readTraceId(log.attributes);
      if (spanId) {
        appendToBucket(this.logsBySpanId, spanId, log);
      }
      if (traceId) {
        appendToBucket(this.logsByTraceId, traceId, log);
      }
    }
    for (const span of this.spans) {
      const spanId = readAttr(span.attributes, this.keys.spanIdKey);
      const traceId = this.readTraceId(span.attributes);
      if (spanId) this.spansById.set(spanId, span);
      if (traceId) appendToBucket(this.spansByTraceId, traceId, span);
    }
  }

  private readTraceId(attributes: Record<string, unknown>): string | null {
    const primary = readAttr(attributes, this.keys.traceIdKey);
    if (primary) return primary;
    for (const alt of this.keys.altTraceIdKeys) {
      const v = readAttr(attributes, alt);
      if (v) return v;
    }
    return null;
  }

  /**
   * Logs whose spanId attribute equals the given span id.
   */
  logsForSpan(spanId: string): LogRecord[] {
    return this.logsBySpanId.get(spanId) ?? [];
  }

  /**
   * Logs whose traceId attribute equals the given trace id (across
   * every span in the trace).
   */
  logsForTrace(traceId: string): LogRecord[] {
    return this.logsByTraceId.get(traceId) ?? [];
  }

  /**
   * Spans in the given trace, insertion order.
   */
  spansForTrace(traceId: string): SpanRecord[] {
    return this.spansByTraceId.get(traceId) ?? [];
  }

  /**
   * Convenience — return every log with the span it joins to, or
   * null when the log carries no correlatable id.
   */
  linkAll(): LogSpanLink[] {
    return this.logs.map((log) => {
      const spanId = readAttr(log.attributes, this.keys.spanIdKey);
      const traceId = this.readTraceId(log.attributes);
      const span = spanId ? (this.spansById.get(spanId) ?? null) : null;
      return { log, span, traceId, spanId };
    });
  }

  /**
   * Count logs that carry at least one correlatable id. Useful for
   * kiwa tests that measure the SUT's instrumentation coverage of
   * its own log surface.
   */
  correlatedCount(): number {
    let n = 0;
    for (const log of this.logs) {
      const spanId = readAttr(log.attributes, this.keys.spanIdKey);
      const traceId = this.readTraceId(log.attributes);
      if (spanId || traceId) n += 1;
    }
    return n;
  }
}

function readAttr(attributes: Record<string, unknown>, key: string): string | null {
  const v = attributes[key];
  if (typeof v === 'string' && v.length > 0) return v;
  if (typeof v === 'number') return String(v);
  return null;
}

function appendToBucket<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}

/**
 * Sugar for the common case: build an index over the entire
 * collector state.
 */
export function correlateLogsAndSpans(
  input: { logs: LogRecord[]; spans: SpanRecord[] },
  keys?: CorrelationKeys,
): LogCorrelationIndex {
  return new LogCorrelationIndex(input, keys);
}
