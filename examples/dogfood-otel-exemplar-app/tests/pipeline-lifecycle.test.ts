/**
 * Pipeline lifecycle tests — walk one full OTel Collector lifecycle
 * end-to-end and assert every op appears exactly once on the neutral
 * trace and returns the expected result shape. These tests cover the
 * mock adapter path (state-machine walk) so the observability v2.1
 * exemplar + otel-advanced axes semantics remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { OtelExemplarAdapter } from '../src/adapters/interface.js';
import { runFullPipelineLifecycle } from '../src/flows/pipeline-flows.js';
import {
  PIPELINE_LOGS,
  PIPELINE_METRICS,
  PIPELINE_TRACES,
} from '../src/policies/pipelines.js';
import { BAGGAGE_SESSION, BAGGAGE_USER } from '../src/policies/baggage-sets.js';
import {
  W3C_SAMPLED_TRACEPARENT,
  W3C_TRACEPARENT_WITH_STATE,
} from '../src/policies/w3c-headers.js';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba902b7';

function newMock(): OtelExemplarAdapter {
  return makeMockAdapter();
}

describe('dogfood-otel-exemplar-app — pipeline lifecycle', () => {
  it('T-DFOTEL-LC-001 startPipeline returns the requested profile config', async () => {
    const mock = newMock();
    const result = await mock.startPipeline(PIPELINE_TRACES);
    expect(result.profile).toBe('traces');
    expect(result.receiver).toBe('otlp');
    expect(result.exporter).toBe('otlp/jaeger');
    expect(result.processors).toEqual(['batch', 'resourcedetection', 'attributes']);
  });

  it('T-DFOTEL-LC-002 startPipeline emits otel.pipeline_started onto the trace', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startPipeline');
    expect(trace[0]?.neutralEvent).toBe('otel.pipeline_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFOTEL-LC-003 detectResource accumulates attributes onto the session', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const r1 = await mock.detectResource({
      bucket: 'traces',
      attributes: { 'service.name': 'dogfood', 'host.name': 'ci' },
    });
    expect(r1.attributeCount).toBe(2);
    const r2 = await mock.detectResource({
      bucket: 'traces',
      attributes: { 'service.version': '0.0.1' },
    });
    expect(r2.attributeCount).toBe(3);
  });

  it('T-DFOTEL-LC-004 enqueueSpan raises the queueDepth by 1 each call', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const r1 = await mock.enqueueSpan({
      bucket: 'traces',
      spanId: 'a',
      parentId: null,
      attributes: {},
    });
    expect(r1.queueDepth).toBe(1);
    const r2 = await mock.enqueueSpan({
      bucket: 'traces',
      spanId: 'b',
      parentId: 'a',
      attributes: {},
    });
    expect(r2.queueDepth).toBe(2);
  });

  it('T-DFOTEL-LC-005 flushBatch drains the queue up to maxBatchSize', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    for (let i = 0; i < 5; i++) {
      await mock.enqueueSpan({
        bucket: 'traces',
        spanId: `s${i}`,
        parentId: null,
        attributes: {},
      });
    }
    const result = await mock.flushBatch({ bucket: 'traces', maxBatchSize: 3 });
    expect(result.batchSize).toBe(3);
    expect(result.remainingQueue).toBe(2);
    expect(result.maxBatchSize).toBe(3);
  });

  it('T-DFOTEL-LC-006 flushBatch of empty queue returns zero batchSize', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.flushBatch({ bucket: 'traces', maxBatchSize: 10 });
    expect(result.batchSize).toBe(0);
    expect(result.remainingQueue).toBe(0);
  });

  it('T-DFOTEL-LC-007 recordExemplar increments exemplarCount monotonically', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_METRICS);
    const r1 = await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 1,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_000,
    });
    expect(r1.exemplarCount).toBe(1);
    const r2 = await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 2,
      traceId: '4bf92f3577b34da6a3ce929d0e0e4737',
      spanId: '00f067aa0ba902b8',
      timestampMs: 1_700_000_000_001,
    });
    expect(r2.exemplarCount).toBe(2);
  });

  it('T-DFOTEL-LC-008 attachTraceToMetric echoes the metric+trace+span it was given', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_METRICS);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 1,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_000,
    });
    const result = await mock.attachTraceToMetric({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      traceId: TRACE_ID,
      spanId: 'updated-span-id',
    });
    expect(result.metricName).toBe('http_requests_total');
    expect(result.traceId).toBe(TRACE_ID);
    expect(result.spanId).toBe('updated-span-id');
  });

  it('T-DFOTEL-LC-009 resolveMetricToTrace returns every attached traceId for the metric', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_METRICS);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'errors_total',
      value: 1,
      traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_000,
    });
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'errors_total',
      value: 2,
      traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_001,
    });
    const result = await mock.resolveMetricToTrace({
      bucket: 'metrics',
      metricName: 'errors_total',
    });
    expect(result.matchedCount).toBe(2);
    expect(result.traceIds).toContain('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(result.traceIds).toContain('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('T-DFOTEL-LC-010 resolveTraceToMetric returns every metric attached to the trace, deduped', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_METRICS);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 1,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_000,
    });
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'errors_total',
      value: 1,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_001,
    });
    // Second recording of the same metricName on the same trace should
    // NOT double-count in the resolver output.
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 2,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_002,
    });
    const result = await mock.resolveTraceToMetric({
      bucket: 'metrics',
      traceId: TRACE_ID,
    });
    expect(result.matchedCount).toBe(2);
    expect(result.metricNames).toContain('http_requests_total');
    expect(result.metricNames).toContain('errors_total');
  });

  it('T-DFOTEL-LC-011 propagateBaggage merges entries across calls', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const r1 = await mock.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_SESSION,
    });
    expect(r1.entryCount).toBe(1);
    const r2 = await mock.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_USER,
    });
    expect(r2.entryCount).toBe(3); // session (1) + user (2) = 3
  });

  it('T-DFOTEL-LC-012 extractW3CContext parses a sampled traceparent (flags=01)', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.version).toBe('00');
    expect(result.traceId).toBe(TRACE_ID);
    expect(result.spanId).toBe(SPAN_ID);
    expect(result.flags).toBe('01');
    expect(result.hasTracestate).toBe(false);
  });

  it('T-DFOTEL-LC-013 extractW3CContext parses tracestate when provided', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: W3C_TRACEPARENT_WITH_STATE,
    });
    expect(result.hasTracestate).toBe(true);
    expect(result.flags).toBe('01');
  });

  it('T-DFOTEL-LC-014 extractW3CContext throws on invalid traceparent (wrong parts)', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await expect(
      mock.extractW3CContext({
        bucket: 'traces',
        headers: { traceparent: '00-abc' },
      }),
    ).rejects.toThrow(/invalid traceparent format/);
  });

  it('T-DFOTEL-LC-015 extractW3CContext throws on unsupported version', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await expect(
      mock.extractW3CContext({
        bucket: 'traces',
        headers: {
          traceparent: '99-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        },
      }),
    ).rejects.toThrow(/unsupported traceparent version/);
  });

  it('T-DFOTEL-LC-016 exportOtlp emits provider-neutral event + protobuf content-type', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.exportOtlp({
      bucket: 'traces',
      profile: 'traces',
      itemCount: 5,
    });
    expect(result.profile).toBe('traces');
    expect(result.endpointUrl).toContain('v1/traces');
    expect(result.contentType).toBe('application/x-protobuf');
    expect(result.itemCount).toBe(5);
  });

  it('T-DFOTEL-LC-017 exportOtlp url differs for traces / metrics / logs', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await mock.startPipeline(PIPELINE_METRICS);
    await mock.startPipeline(PIPELINE_LOGS);
    const traces = await mock.exportOtlp({
      bucket: 'traces',
      profile: 'traces',
      itemCount: 1,
    });
    const metrics = await mock.exportOtlp({
      bucket: 'metrics',
      profile: 'metrics',
      itemCount: 1,
    });
    const logs = await mock.exportOtlp({
      bucket: 'logs',
      profile: 'logs',
      itemCount: 1,
    });
    expect(traces.endpointUrl).toContain('v1/traces');
    expect(metrics.endpointUrl).toContain('v1/metrics');
    expect(logs.endpointUrl).toContain('v1/logs');
    expect(traces.endpointUrl).not.toBe(metrics.endpointUrl);
  });

  it('T-DFOTEL-LC-018 queryJaegerTrace echoes serviceName from the pipeline session', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.queryJaegerTrace({
      bucket: 'traces',
      traceId: TRACE_ID,
    });
    expect(result.serviceName).toBe('dogfood-traces');
    expect(result.traceId).toBe(TRACE_ID);
  });

  it('T-DFOTEL-LC-019 queryPromExemplars returns matched exemplarCount for the metric', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_METRICS);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 1,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_000,
    });
    const result = await mock.queryPromExemplars({
      bucket: 'metrics',
      metricName: 'http_requests_total',
    });
    expect(result.exemplarCount).toBe(1);
    expect(result.traceIds).toContain(TRACE_ID);
  });

  it('T-DFOTEL-LC-020 emitCorrelatedLog appends log with trace id + level', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_LOGS);
    const result = await mock.emitCorrelatedLog({
      bucket: 'logs',
      traceId: TRACE_ID,
      message: 'request completed',
      level: 'info',
    });
    expect(result.traceId).toBe(TRACE_ID);
    expect(result.level).toBe('info');
    expect(result.message).toBe('request completed');
  });

  it('T-DFOTEL-LC-021 runFullPipelineLifecycle emits >=14 trace entries in a single pass', async () => {
    const mock = newMock();
    await runFullPipelineLifecycle(mock, {
      pipeline: PIPELINE_TRACES,
      baggage: BAGGAGE_SESSION,
      w3c: { traceparent: W3C_SAMPLED_TRACEPARENT },
      resourceAttributes: {
        'service.name': 'dogfood-traces',
        'deployment.environment': 'ci',
      },
      spans: [
        { spanId: 'root', parentId: null, attributes: {} },
        { spanId: 'child', parentId: 'root', attributes: {} },
      ],
      maxBatchSize: 10,
      exemplars: [
        {
          metricName: 'http_requests_total',
          value: 1,
          traceId: TRACE_ID,
          spanId: SPAN_ID,
          timestampMs: 1_700_000_000_000,
        },
      ],
      logs: [{ traceId: TRACE_ID, message: 'lifecycle log', level: 'info' }],
    });
    const trace = mock.trace();
    expect(trace.length).toBeGreaterThanOrEqual(14);
    const ops = new Set(trace.map((t) => t.op));
    expect(ops.has('startPipeline')).toBe(true);
    expect(ops.has('detectResource')).toBe(true);
    expect(ops.has('enqueueSpan')).toBe(true);
    expect(ops.has('flushBatch')).toBe(true);
    expect(ops.has('recordExemplar')).toBe(true);
    expect(ops.has('attachTraceToMetric')).toBe(true);
    expect(ops.has('resolveMetricToTrace')).toBe(true);
    expect(ops.has('resolveTraceToMetric')).toBe(true);
    expect(ops.has('propagateBaggage')).toBe(true);
    expect(ops.has('extractW3CContext')).toBe(true);
    expect(ops.has('exportOtlp')).toBe(true);
    expect(ops.has('queryJaegerTrace')).toBe(true);
    expect(ops.has('queryPromExemplars')).toBe(true);
    expect(ops.has('emitCorrelatedLog')).toBe(true);
  });

  it('T-DFOTEL-LC-022 reset drops all sessions and clears the trace', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await mock.reset();
    expect(mock.trace()).toHaveLength(0);
    await expect(
      mock.detectResource({ bucket: 'traces', attributes: { a: 'b' } }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFOTEL-LC-023 requireBucket throws when detectResource hits an unstarted bucket', async () => {
    const mock = newMock();
    await expect(
      mock.enqueueSpan({
        bucket: 'unknown',
        spanId: 's',
        parentId: null,
        attributes: {},
      }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFOTEL-LC-024 buckets are isolated — traces + metrics run without state leakage', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await mock.startPipeline(PIPELINE_METRICS);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'http_requests_total',
      value: 1,
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      timestampMs: 1_700_000_000_000,
    });
    // The metric goes to `metrics` bucket only — resolveMetricToTrace
    // on `traces` should return 0 matches.
    const tracesLookup = await mock.resolveMetricToTrace({
      bucket: 'traces',
      metricName: 'http_requests_total',
    });
    expect(tracesLookup.matchedCount).toBe(0);
    const metricsLookup = await mock.resolveMetricToTrace({
      bucket: 'metrics',
      metricName: 'http_requests_total',
    });
    expect(metricsLookup.matchedCount).toBe(1);
  });
});
