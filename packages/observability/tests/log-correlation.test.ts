import { describe, expect, it } from 'vitest';
import {
  correlateLogsAndSpans,
  logs_forHttpTrace,
  LogCorrelationIndex,
  trace_httpHandler,
  type LogRecord,
  type SpanRecord,
} from '../src/index.js';

describe('LogCorrelationIndex — join by span_id', () => {
  it('logsForSpan returns every log matching span_id', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });
    // 2 logs carry sp-1 (request received + request completed).
    expect(index.logsForSpan('sp-1')).toHaveLength(2);
  });

  it('unknown span_id returns empty array', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });
    expect(index.logsForSpan('sp-missing')).toEqual([]);
  });

  it('log without span_id attribute is not indexed by span_id', () => {
    const logs: LogRecord[] = [
      { level: 'info', message: 'no ids', attributes: {}, timestamp: 100 },
    ];
    const index = correlateLogsAndSpans({ logs, spans: [] });
    expect(index.logsForSpan('anything')).toEqual([]);
  });
});

describe('LogCorrelationIndex — join by trace_id', () => {
  it('logsForTrace returns every log with matching trace_id', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });
    expect(index.logsForTrace('trace-http-handler')).toHaveLength(4);
  });

  it('spansForTrace returns every span with matching trace_id', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });
    expect(index.spansForTrace('trace-http-handler')).toHaveLength(3);
  });

  it('unknown trace_id returns empty span array', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });
    expect(index.spansForTrace('missing')).toEqual([]);
  });
});

describe('LogCorrelationIndex — linkAll bidirectional map', () => {
  it('links each log to its parent span when span_id matches', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });
    const links = index.linkAll();
    expect(links).toHaveLength(4);
    for (const l of links) {
      expect(l.span?.attributes.span_id).toBe(l.spanId);
      expect(l.traceId).toBe('trace-http-handler');
    }
  });

  it('span field is null when log carries no span_id', () => {
    const logs: LogRecord[] = [
      {
        level: 'info',
        message: 'orphan',
        attributes: { trace_id: 't1' },
        timestamp: 100,
      },
    ];
    const index = correlateLogsAndSpans({ logs, spans: [] });
    const links = index.linkAll();
    expect(links[0]!.span).toBeNull();
    expect(links[0]!.spanId).toBeNull();
    expect(links[0]!.traceId).toBe('t1');
  });
});

describe('LogCorrelationIndex — correlatedCount instrumentation coverage', () => {
  it('counts logs carrying at least one correlatable id', () => {
    const logs: LogRecord[] = [
      { level: 'info', message: 'a', attributes: { trace_id: 't1' }, timestamp: 100 },
      { level: 'info', message: 'b', attributes: { span_id: 's1' }, timestamp: 101 },
      { level: 'info', message: 'c', attributes: {}, timestamp: 102 },
    ];
    const index = correlateLogsAndSpans({ logs, spans: [] });
    expect(index.correlatedCount()).toBe(2);
  });

  it('returns 0 when no log carries ids', () => {
    const logs: LogRecord[] = [
      { level: 'info', message: 'a', attributes: {}, timestamp: 100 },
    ];
    const index = correlateLogsAndSpans({ logs, spans: [] });
    expect(index.correlatedCount()).toBe(0);
  });
});

describe('LogCorrelationIndex — configurable keys', () => {
  it('respects custom traceIdKey / spanIdKey', () => {
    const logs: LogRecord[] = [
      {
        level: 'info',
        message: 'dd style',
        attributes: { 'dd.trace_id': 'dd-trace-1', 'dd.span_id': 'dd-span-1' },
        timestamp: 100,
      },
    ];
    const spans: SpanRecord[] = [
      {
        name: 'x',
        attributes: { 'dd.trace_id': 'dd-trace-1', 'dd.span_id': 'dd-span-1' },
        startedAt: 100,
        endedAt: 110,
        parentSpanName: null,
        events: [],
      },
    ];
    const index = new LogCorrelationIndex(
      { logs, spans },
      { traceIdKey: 'dd.trace_id', spanIdKey: 'dd.span_id' },
    );
    expect(index.logsForSpan('dd-span-1')).toHaveLength(1);
    expect(index.spansForTrace('dd-trace-1')).toHaveLength(1);
  });

  it('falls back to altTraceIdKeys when primary key absent', () => {
    const logs: LogRecord[] = [
      {
        level: 'info',
        message: 'legacy',
        attributes: { legacy_trace_id: 't-legacy' },
        timestamp: 100,
      },
    ];
    const index = new LogCorrelationIndex(
      { logs, spans: [] },
      { altTraceIdKeys: ['legacy_trace_id'] },
    );
    expect(index.logsForTrace('t-legacy')).toHaveLength(1);
  });

  it('numeric id attribute is coerced to string', () => {
    const logs: LogRecord[] = [
      {
        level: 'info',
        message: 'num id',
        attributes: { trace_id: 42 },
        timestamp: 100,
      },
    ];
    const index = correlateLogsAndSpans({ logs, spans: [] });
    expect(index.logsForTrace('42')).toHaveLength(1);
  });
});
