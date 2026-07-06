/**
 * Real-driver env-gate tests — cover the KIWA_MODE=real testcontainers
 * gate. When env vars are missing the real adapter emits a KIWA_OTEL_ENV_MISSING
 * sentinel on the trace instead of crashing; when env vars are wired
 * (or `forceEnvPresent` in test) it walks the same neutral event
 * ordering as the mock. This is the seam the fidelity harness uses to
 * measure behavioural drift between mock semantics and the real OTel
 * Collector + Jaeger + Prometheus + Loki stack.
 */

import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../src/adapters/real.js';
import { KIWA_OTEL_ENV_MISSING } from '../src/adapters/interface.js';
import {
  PIPELINE_LOGS,
  PIPELINE_METRICS,
  PIPELINE_TRACES,
} from '../src/policies/pipelines.js';
import { BAGGAGE_SESSION } from '../src/policies/baggage-sets.js';
import { W3C_SAMPLED_TRACEPARENT } from '../src/policies/w3c-headers.js';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba902b7';

describe('dogfood-otel-exemplar-app — real driver env-gate', () => {
  it('T-DFOTEL-EG-001 env missing → startPipeline emits KIWA_OTEL_ENV_MISSING', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startPipeline(PIPELINE_TRACES);
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_OTEL_ENV_MISSING);
  });

  it('T-DFOTEL-EG-002 env missing → all ops emit KIWA_OTEL_ENV_MISSING on the trace', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startPipeline(PIPELINE_TRACES);
    await real.detectResource({
      bucket: 'traces',
      attributes: { 'service.name': 'x' },
    });
    await real.enqueueSpan({
      bucket: 'traces',
      spanId: 's',
      parentId: null,
      attributes: {},
    });
    await real.flushBatch({ bucket: 'traces', maxBatchSize: 1 });
    const trace = real.trace();
    for (const entry of trace) {
      expect(entry.ok).toBe(false);
      expect(entry.errorKind).toBe(KIWA_OTEL_ENV_MISSING);
    }
  });

  it('T-DFOTEL-EG-003 forceEnvPresent → ops execute and emit ok=true', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startPipeline(PIPELINE_TRACES);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.errorKind).toBeUndefined();
  });

  it('T-DFOTEL-EG-004 forceEnvPresent → all 3 pipelines start without errors', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startPipeline(PIPELINE_TRACES);
    await real.startPipeline(PIPELINE_METRICS);
    await real.startPipeline(PIPELINE_LOGS);
    const trace = real.trace();
    const startOps = trace.filter((t) => t.op === 'startPipeline');
    expect(startOps).toHaveLength(3);
    for (const entry of startOps) {
      expect(entry.ok).toBe(true);
    }
  });

  it('T-DFOTEL-EG-005 KIWA_MODE=real requires all 3 endpoint vars', async () => {
    const partial = {
      KIWA_MODE: 'real',
      KIWA_OTEL_COLLECTOR_URL: 'http://localhost:4318',
      // Missing KIWA_JAEGER_URL + KIWA_PROMETHEUS_URL.
    };
    const real = makeRealAdapter({ env: partial });
    await real.startPipeline(PIPELINE_TRACES);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_OTEL_ENV_MISSING);
  });

  it('T-DFOTEL-EG-006 KIWA_MODE=real with all 3 endpoints wired flips envReady=true', async () => {
    const full = {
      KIWA_MODE: 'real',
      KIWA_OTEL_COLLECTOR_URL: 'http://localhost:4318',
      KIWA_JAEGER_URL: 'http://localhost:16686',
      KIWA_PROMETHEUS_URL: 'http://localhost:9090',
    };
    const real = makeRealAdapter({ env: full });
    await real.startPipeline(PIPELINE_TRACES);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.metadata.envReady).toBe(true);
  });

  it('T-DFOTEL-EG-007 exportOtlp uses the OTLP endpoint from env when ready', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_OTEL_COLLECTOR_URL: 'http://collector.example:4318',
      KIWA_JAEGER_URL: 'http://jaeger.example:16686',
      KIWA_PROMETHEUS_URL: 'http://prom.example:9090',
    };
    const real = makeRealAdapter({ env });
    await real.startPipeline(PIPELINE_TRACES);
    const result = await real.exportOtlp({
      bucket: 'traces',
      profile: 'traces',
      itemCount: 5,
    });
    expect(result.endpointUrl).toContain('collector.example:4318');
    expect(result.endpointUrl).toContain('v1/traces');
  });

  it('T-DFOTEL-EG-008 queryPromExemplars url points at PROMETHEUS endpoint', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_OTEL_COLLECTOR_URL: 'http://c:4318',
      KIWA_JAEGER_URL: 'http://j:16686',
      KIWA_PROMETHEUS_URL: 'http://prom.example:9090',
    };
    const real = makeRealAdapter({ env });
    await real.startPipeline(PIPELINE_METRICS);
    await real.queryPromExemplars({
      bucket: 'metrics',
      metricName: 'http_requests_total',
    });
    const trace = real.trace();
    const queryEntry = trace.find((t) => t.op === 'queryPromExemplars');
    expect(String(queryEntry?.metadata.url ?? '')).toContain('prom.example');
    expect(String(queryEntry?.metadata.url ?? '')).toContain(
      '/api/v1/query_exemplars',
    );
  });

  it('T-DFOTEL-EG-009 queryJaegerTrace url points at JAEGER endpoint', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_OTEL_COLLECTOR_URL: 'http://c:4318',
      KIWA_JAEGER_URL: 'http://jaeger.example:16686',
      KIWA_PROMETHEUS_URL: 'http://p:9090',
    };
    const real = makeRealAdapter({ env });
    await real.startPipeline(PIPELINE_TRACES);
    await real.queryJaegerTrace({ bucket: 'traces', traceId: TRACE_ID });
    const trace = real.trace();
    const jaegerEntry = trace.find((t) => t.op === 'queryJaegerTrace');
    expect(String(jaegerEntry?.metadata.url ?? '')).toContain(
      'jaeger.example:16686',
    );
    expect(String(jaegerEntry?.metadata.url ?? '')).toContain(
      `/api/traces/${TRACE_ID}`,
    );
  });

  it('T-DFOTEL-EG-010 baggage propagates without error under forceEnvPresent', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startPipeline(PIPELINE_TRACES);
    const result = await real.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_SESSION,
    });
    expect(result.entryCount).toBe(1);
  });

  it('T-DFOTEL-EG-011 W3C context extracts under forceEnvPresent', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startPipeline(PIPELINE_TRACES);
    const result = await real.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.traceId).toBe(TRACE_ID);
    expect(result.spanId).toBe(SPAN_ID);
  });

  it('T-DFOTEL-EG-012 W3C context under env-missing does NOT throw — returns empty extract', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startPipeline(PIPELINE_TRACES);
    const result = await real.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.traceId).toBe('');
    expect(result.spanId).toBe('');
    const trace = real.trace();
    const w3cEntry = trace.find((t) => t.op === 'extractW3CContext');
    expect(w3cEntry?.ok).toBe(false);
    expect(w3cEntry?.errorKind).toBe(KIWA_OTEL_ENV_MISSING);
  });

  it('T-DFOTEL-EG-013 reset clears env-missing trace as well', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startPipeline(PIPELINE_TRACES);
    await real.reset();
    expect(real.trace()).toHaveLength(0);
  });

  it('T-DFOTEL-EG-014 real adapter re-emits envReady=false in metadata for the trace consumer', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startPipeline(PIPELINE_TRACES);
    const trace = real.trace();
    // The sentinel entry surfaces envReady=false explicitly so consumers
    // don't need to guess whether the real path executed.
    expect(trace[0]?.metadata.envReady).toBe(false);
    expect(trace[0]?.metadata.sentinel).toBe(KIWA_OTEL_ENV_MISSING);
  });
});
