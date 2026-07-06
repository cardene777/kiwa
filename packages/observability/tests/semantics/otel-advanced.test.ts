import { describe, expect, it } from 'vitest';
import {
  detectResource,
  enqueueSpan,
  extractW3CContext,
  flushBatch,
  propagateBaggage,
  startOtelAdvanced,
} from '../../src/semantics/index.js';

const validTraceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';

describe('otel-advanced axis — happy path', () => {
  it('batch processor flushes queue in chunks', () => {
    const s = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    for (let i = 0; i < 10; i++) {
      enqueueSpan(s, { spanId: `span-${i}`, parentId: null, attributes: {} });
    }
    const step = flushBatch(s, { maxBatchSize: 4 });
    expect(step.metadata.batchSize).toBe(4);
    expect(step.metadata.remainingQueue).toBe(6);
    expect(s.batches).toHaveLength(1);
  });

  it('flush empties queue when maxBatchSize exceeds pending', () => {
    const s = startOtelAdvanced({ target: 'grafana-oss', serviceName: 'x' });
    enqueueSpan(s, { spanId: 'a', parentId: null, attributes: {} });
    const step = flushBatch(s, { maxBatchSize: 100 });
    expect(step.metadata.batchSize).toBe(1);
    expect(step.metadata.remainingQueue).toBe(0);
  });

  it('detects resource attributes merging additively', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'checkout' });
    detectResource(s, { 'service.name': 'checkout', 'service.version': '1.0.0' });
    const step = detectResource(s, { 'deployment.env': 'prod' });
    expect(step.metadata.attributeCount).toBe(3);
    expect(s.resource).toEqual({
      'service.name': 'checkout',
      'service.version': '1.0.0',
      'deployment.env': 'prod',
    });
  });

  it('propagates baggage additively', () => {
    const s = startOtelAdvanced({ target: 'loki', serviceName: 'x' });
    propagateBaggage(s, { userId: 'u1', tenantId: 't42' });
    const step = propagateBaggage(s, { requestId: 'r99' });
    expect(step.metadata.entryCount).toBe(3);
    expect(s.baggage.userId).toBe('u1');
    expect(s.baggage.requestId).toBe('r99');
  });

  it('extracts W3C trace context correctly', () => {
    const s = startOtelAdvanced({ target: 'otel-collector', serviceName: 'x' });
    const step = extractW3CContext(s, {
      traceparent: validTraceparent,
      tracestate: 'congo=lZWRzIHRoNhcm5hbCB0aGVvcmV0',
    });
    expect(step.metadata.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(step.metadata.spanId).toBe('b7ad6b7169203331');
    expect(step.metadata.flags).toBe('01');
    expect(step.metadata.hasTracestate).toBe(true);
    expect(s.w3cTracestate).not.toBeNull();
  });

  it('handles missing tracestate as optional', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    const step = extractW3CContext(s, { traceparent: validTraceparent });
    expect(step.metadata.hasTracestate).toBe(false);
    expect(s.w3cTracestate).toBeNull();
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startOtelAdvanced({ target, serviceName: 'x' });
      const step = flushBatch(s, { maxBatchSize: 10 });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('otel-advanced axis — invariant guards', () => {
  it('rejects empty serviceName', () => {
    expect(() => startOtelAdvanced({ target: 'prometheus', serviceName: '' })).toThrow(/serviceName/);
  });

  it('rejects empty spanId in enqueue', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => enqueueSpan(s, { spanId: '', parentId: null, attributes: {} })).toThrow(/spanId/);
  });

  it('rejects non-positive maxBatchSize', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => flushBatch(s, { maxBatchSize: 0 })).toThrow(/positive/);
  });

  it('rejects empty resource attribute set', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => detectResource(s, {})).toThrow(/must not be empty/);
  });

  it('rejects empty baggage key', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => propagateBaggage(s, { '': 'value' })).toThrow(/key/);
  });

  it('rejects empty baggage value', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => propagateBaggage(s, { key: '' })).toThrow(/value/);
  });

  it('rejects W3C context with wrong part count', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => extractW3CContext(s, { traceparent: '00-abc-def' })).toThrow(/4 parts/);
  });

  it('rejects unsupported traceparent version', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      extractW3CContext(s, {
        traceparent: '01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      }),
    ).toThrow(/version/);
  });

  it('rejects short traceId in W3C', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() => extractW3CContext(s, { traceparent: '00-short-b7ad6b7169203331-01' })).toThrow(/32 hex/);
  });

  it('rejects short spanId in W3C', () => {
    const s = startOtelAdvanced({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      extractW3CContext(s, {
        traceparent: '00-0af7651916cd43dd8448eb211c80319c-short-01',
      }),
    ).toThrow(/16 hex/);
  });
});
