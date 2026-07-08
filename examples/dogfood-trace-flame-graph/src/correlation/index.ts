import { LogCorrelationIndex, type CorrelationKeys } from '@kiwa/observability';
import type {
  AdapterLog,
  AdapterSpan,
  LogJoinEntry,
} from '../adapters/interface.js';

/**
 * Bidirectional traceID index over an {@link AdapterSpan} + {@link AdapterLog}
 * pair. Thin wrapper around `@kiwa/observability` {@link LogCorrelationIndex}
 * that adapts the observability SpanRecord shape onto the dogfood's own
 * span shape. The mock adapter builds one of these per loadTrace so the
 * LogPanel + Drilldown UI can join logs / spans in constant time.
 *
 * The wrapper preserves the source SpanRecord attributes so the
 * downstream index (spansById + spansByTraceId + logsBySpanId +
 * logsByTraceId) works exactly as the observability package tests
 * document.
 */
export class TraceLogIndex {
  private readonly index: LogCorrelationIndex;
  private readonly spanIdToName = new Map<string, string>();

  constructor(input: { spans: AdapterSpan[]; logs: AdapterLog[] }, keys?: CorrelationKeys) {
    for (const s of input.spans) this.spanIdToName.set(s.spanId, s.name);
    this.index = new LogCorrelationIndex(
      {
        spans: input.spans.map((s) => ({
          name: s.name,
          attributes: s.attributes,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          parentSpanName: null,
          events: [],
        })),
        logs: input.logs.map((l) => ({
          level: l.level,
          message: l.message,
          attributes: l.attributes,
          timestamp: l.timestamp,
        })),
      },
      keys,
    );
  }

  /** logs → spans (via spanId + traceId). Each entry carries the joined span name for the LogPanel row label. */
  linkAll(): LogJoinEntry[] {
    const out: LogJoinEntry[] = [];
    for (const link of this.index.linkAll()) {
      const spanId = link.spanId;
      const spanName = spanId ? (this.spanIdToName.get(spanId) ?? null) : null;
      out.push({
        log: {
          level: link.log.level,
          message: link.log.message,
          timestamp: link.log.timestamp,
          traceId: link.traceId,
          spanId: link.spanId,
          attributes: link.log.attributes,
        },
        spanName,
        spanId,
        traceId: link.traceId,
      });
    }
    return out;
  }

  /** Logs whose spanId equals the given span id. */
  logsForSpan(spanId: string): AdapterLog[] {
    return this.index.logsForSpan(spanId).map((l) => ({
      level: l.level,
      message: l.message,
      timestamp: l.timestamp,
      traceId: readAttr(l.attributes, 'trace_id'),
      spanId: readAttr(l.attributes, 'span_id'),
      attributes: l.attributes,
    }));
  }

  /** Logs whose traceId equals the given trace id. */
  logsForTrace(traceId: string): AdapterLog[] {
    return this.index.logsForTrace(traceId).map((l) => ({
      level: l.level,
      message: l.message,
      timestamp: l.timestamp,
      traceId: readAttr(l.attributes, 'trace_id'),
      spanId: readAttr(l.attributes, 'span_id'),
      attributes: l.attributes,
    }));
  }

  /** Count of logs joined to at least one correlatable id. */
  correlatedCount(): number {
    return this.index.correlatedCount();
  }
}

function readAttr(attributes: Record<string, unknown>, key: string): string | null {
  const v = attributes[key];
  if (typeof v === 'string' && v.length > 0) return v;
  if (typeof v === 'number') return String(v);
  return null;
}
