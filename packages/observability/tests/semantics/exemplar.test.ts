import { describe, expect, it } from 'vitest';
import {
  attachTraceToMetric,
  recordExemplarMetric,
  resolveMetricToTrace,
  resolveTraceToMetric,
  startExemplarSession,
} from '../../src/semantics/index.js';

const validTrace = '0123456789abcdef0123456789abcdef';
const validSpan = '0123456789abcdef';

describe('exemplar axis — happy path', () => {
  it('records exemplar metric with trace context', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'p99-latency' });
    const step = recordExemplarMetric(s, {
      metricName: 'http.latency.ms',
      value: 250,
      traceId: validTrace,
      spanId: validSpan,
      timestampMs: 1000,
    });
    expect(step.state).toBe('metric-recorded');
    expect(step.metadata.traceId).toBe(validTrace);
  });

  it('attaches trace to existing exemplar', () => {
    const s = startExemplarSession({ target: 'grafana-oss', bucket: 'p99-latency' });
    recordExemplarMetric(s, {
      metricName: 'http.latency.ms',
      value: 250,
      traceId: validTrace,
      spanId: validSpan,
      timestampMs: 1,
    });
    const step = attachTraceToMetric(s, {
      metricName: 'http.latency.ms',
      traceId: validTrace,
      spanId: 'fedcba9876543210',
    });
    expect(step.state).toBe('trace-attached');
    expect(s.exemplars[0]?.spanId).toBe('fedcba9876543210');
  });

  it('resolves metric-to-trace lookup', () => {
    const s = startExemplarSession({ target: 'loki', bucket: 'errors' });
    recordExemplarMetric(s, {
      metricName: 'http.errors',
      value: 1,
      traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      spanId: '1111111111111111',
      timestampMs: 1,
    });
    recordExemplarMetric(s, {
      metricName: 'http.errors',
      value: 1,
      traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      spanId: '2222222222222222',
      timestampMs: 2,
    });
    const { step, traceIds } = resolveMetricToTrace(s, { metricName: 'http.errors' });
    expect(traceIds).toEqual([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ]);
    expect(step.metadata.traceCount).toBe(2);
  });

  it('resolves trace-to-metric lookup deduped', () => {
    const s = startExemplarSession({ target: 'otel-collector', bucket: 'errors' });
    const trace = 'cccccccccccccccccccccccccccccccc';
    recordExemplarMetric(s, {
      metricName: 'http.errors',
      value: 1,
      traceId: trace,
      spanId: 'aaaa000000000000',
      timestampMs: 1,
    });
    recordExemplarMetric(s, {
      metricName: 'http.errors',
      value: 2,
      traceId: trace,
      spanId: 'bbbb000000000000',
      timestampMs: 2,
    });
    recordExemplarMetric(s, {
      metricName: 'http.latency.ms',
      value: 100,
      traceId: trace,
      spanId: 'cccc000000000000',
      timestampMs: 3,
    });
    const { step, metricNames } = resolveTraceToMetric(s, { traceId: trace });
    expect(metricNames.sort()).toEqual(['http.errors', 'http.latency.ms']);
    expect(step.metadata.metricCount).toBe(2);
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startExemplarSession({ target, bucket: 'b' });
      const step = recordExemplarMetric(s, {
        metricName: 'm',
        value: 1,
        traceId: validTrace,
        spanId: validSpan,
        timestampMs: 1,
      });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('exemplar axis — invariant guards', () => {
  it('rejects empty bucket', () => {
    expect(() => startExemplarSession({ target: 'prometheus', bucket: '' })).toThrow(/bucket/);
  });

  it('rejects empty metric name', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    expect(() =>
      recordExemplarMetric(s, {
        metricName: '',
        value: 1,
        traceId: validTrace,
        spanId: validSpan,
        timestampMs: 1,
      }),
    ).toThrow(/metricName/);
  });

  it('rejects short traceId', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    expect(() =>
      recordExemplarMetric(s, {
        metricName: 'm',
        value: 1,
        traceId: 'short',
        spanId: validSpan,
        timestampMs: 1,
      }),
    ).toThrow(/traceId must be at least/);
  });

  it('rejects short spanId', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    expect(() =>
      recordExemplarMetric(s, {
        metricName: 'm',
        value: 1,
        traceId: validTrace,
        spanId: 'nn',
        timestampMs: 1,
      }),
    ).toThrow(/spanId must be at least/);
  });

  it('attach fails when no matching exemplar exists', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    expect(() =>
      attachTraceToMetric(s, {
        metricName: 'm',
        traceId: validTrace,
        spanId: validSpan,
      }),
    ).toThrow(/no exemplar/);
  });

  it('rejects empty metric name in resolve', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    expect(() => resolveMetricToTrace(s, { metricName: '' })).toThrow(/metricName/);
  });

  it('rejects empty traceId in resolve', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    expect(() => resolveTraceToMetric(s, { traceId: '' })).toThrow(/traceId/);
  });

  it('returns empty array for unknown metric', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    const { traceIds } = resolveMetricToTrace(s, { metricName: 'missing' });
    expect(traceIds).toEqual([]);
  });

  it('returns empty array for unknown trace', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    const { metricNames } = resolveTraceToMetric(s, { traceId: 'ffffffffffffffff' });
    expect(metricNames).toEqual([]);
  });
});
