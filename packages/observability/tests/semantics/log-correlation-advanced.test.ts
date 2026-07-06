import { describe, expect, it } from 'vitest';
import {
  buildCorrelationIndex,
  emitStructuredLog,
  joinLogQLAndPromQL,
  joinTraceIds,
  startLogCorrelationAdvanced,
} from '../../src/semantics/index.js';

const trace1 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const trace2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('log-correlation-advanced axis — happy path', () => {
  it('emits structured log with trace context', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    const step = emitStructuredLog(s, {
      level: 'info',
      message: 'checkout complete',
      traceId: trace1,
      spanId: 'span-1',
      labels: { userId: 'u1', action: 'purchase' },
      timestampMs: 1000,
    });
    expect(step.metadata.hasTraceId).toBe(true);
    expect(step.metadata.labelCount).toBe(2);
    expect(s.logs).toHaveLength(1);
  });

  it('joins logs by trace id', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    emitStructuredLog(s, {
      level: 'info',
      message: 'start',
      traceId: trace1,
      spanId: 's1',
      labels: {},
      timestampMs: 1,
    });
    emitStructuredLog(s, {
      level: 'error',
      message: 'fail',
      traceId: trace1,
      spanId: 's2',
      labels: {},
      timestampMs: 2,
    });
    emitStructuredLog(s, {
      level: 'info',
      message: 'other',
      traceId: trace2,
      spanId: 's3',
      labels: {},
      timestampMs: 3,
    });
    const { step, matchedLogs } = joinTraceIds(s, { traceId: trace1 });
    expect(matchedLogs).toHaveLength(2);
    expect(step.metadata.matchedCount).toBe(2);
  });

  it('joins LogQL and PromQL selectors on shared labels', () => {
    const s = startLogCorrelationAdvanced({ target: 'grafana-oss', namespace: 'app' });
    emitStructuredLog(s, {
      level: 'info',
      message: 'x',
      traceId: null,
      spanId: null,
      labels: { service: 'checkout', region: 'us-east-1' },
      timestampMs: 1,
    });
    emitStructuredLog(s, {
      level: 'info',
      message: 'y',
      traceId: null,
      spanId: null,
      labels: { service: 'checkout' },
      timestampMs: 2,
    });
    const step = joinLogQLAndPromQL(s, {
      logQlSelector: '{service="checkout"}',
      promQlSelector: 'up{service="checkout"}',
      labels: ['service', 'region'],
    });
    expect(step.metadata.matchedLogs).toBe(1);
    expect(step.metadata.labelCount).toBe(2);
  });

  it('builds correlation index from all logs with trace id', () => {
    const s = startLogCorrelationAdvanced({ target: 'otel-collector', namespace: 'app' });
    emitStructuredLog(s, {
      level: 'info',
      message: 'x',
      traceId: trace1,
      spanId: 's1',
      labels: {},
      timestampMs: 1,
    });
    emitStructuredLog(s, {
      level: 'info',
      message: 'y',
      traceId: trace1,
      spanId: 's2',
      labels: {},
      timestampMs: 2,
    });
    emitStructuredLog(s, {
      level: 'info',
      message: 'z',
      traceId: null,
      spanId: null,
      labels: {},
      timestampMs: 3,
    });
    const step = buildCorrelationIndex(s);
    expect(step.metadata.traceCount).toBe(1);
    expect(step.metadata.logCount).toBe(3);
    expect(s.correlationIndex.get(trace1)?.length).toBe(2);
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startLogCorrelationAdvanced({ target, namespace: 'app' });
      const step = emitStructuredLog(s, {
        level: 'info',
        message: 'x',
        traceId: null,
        spanId: null,
        labels: {},
        timestampMs: 1,
      });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('log-correlation-advanced axis — invariant guards', () => {
  it('rejects empty namespace', () => {
    expect(() => startLogCorrelationAdvanced({ target: 'loki', namespace: '' })).toThrow(
      /namespace/,
    );
  });

  it('rejects empty log message', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    expect(() =>
      emitStructuredLog(s, {
        level: 'info',
        message: '',
        traceId: null,
        spanId: null,
        labels: {},
        timestampMs: 1,
      }),
    ).toThrow(/message/);
  });

  it('rejects empty traceId in join', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    expect(() => joinTraceIds(s, { traceId: '' })).toThrow(/traceId/);
  });

  it('returns empty match array for unknown trace', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    emitStructuredLog(s, {
      level: 'info',
      message: 'x',
      traceId: trace1,
      spanId: 's',
      labels: {},
      timestampMs: 1,
    });
    const { matchedLogs } = joinTraceIds(s, { traceId: trace2 });
    expect(matchedLogs).toEqual([]);
  });

  it('rejects empty logQlSelector', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    expect(() =>
      joinLogQLAndPromQL(s, {
        logQlSelector: '',
        promQlSelector: 'up',
        labels: ['x'],
      }),
    ).toThrow(/logQlSelector/);
  });

  it('rejects empty promQlSelector', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    expect(() =>
      joinLogQLAndPromQL(s, {
        logQlSelector: '{a="1"}',
        promQlSelector: '',
        labels: ['a'],
      }),
    ).toThrow(/promQlSelector/);
  });

  it('rejects zero-length label list in join', () => {
    const s = startLogCorrelationAdvanced({ target: 'loki', namespace: 'app' });
    expect(() =>
      joinLogQLAndPromQL(s, {
        logQlSelector: '{a="1"}',
        promQlSelector: 'up',
        labels: [],
      }),
    ).toThrow(/at least one join label/);
  });
});
