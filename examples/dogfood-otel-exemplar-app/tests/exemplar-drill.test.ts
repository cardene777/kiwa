/**
 * Exemplar drill tests — cover the trace-to-metric / metric-to-trace
 * resolver paths that Grafana / Jaeger use to jump between the metric
 * spike view and the trace waterfall view. Focus on edge cases the
 * observability v2.1 semantics/exemplar state machine enforces
 * (empty metric name, empty trace id, missing exemplar for attach).
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { OtelExemplarAdapter } from '../src/adapters/interface.js';
import { PIPELINE_METRICS } from '../src/policies/pipelines.js';

const TRACE_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TRACE_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const SPAN_X = '00f067aa0ba902b7';

function newMock(): OtelExemplarAdapter {
  return makeMockAdapter();
}

async function seedMetrics(mock: OtelExemplarAdapter): Promise<void> {
  await mock.startPipeline(PIPELINE_METRICS);
}

describe('dogfood-otel-exemplar-app — exemplar drill', () => {
  it('T-DFOTEL-EX-001 recordExemplar rejects empty metricName', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await expect(
      mock.recordExemplar({
        bucket: 'metrics',
        metricName: '',
        value: 1,
        traceId: TRACE_A,
        spanId: SPAN_X,
        timestampMs: 1_700_000_000_000,
      }),
    ).rejects.toThrow(/metricName/);
  });

  it('T-DFOTEL-EX-002 recordExemplar rejects short traceId (<8 chars)', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await expect(
      mock.recordExemplar({
        bucket: 'metrics',
        metricName: 'x',
        value: 1,
        traceId: 'short',
        spanId: SPAN_X,
        timestampMs: 1_700_000_000_000,
      }),
    ).rejects.toThrow(/traceId/);
  });

  it('T-DFOTEL-EX-003 recordExemplar rejects short spanId (<4 chars)', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await expect(
      mock.recordExemplar({
        bucket: 'metrics',
        metricName: 'x',
        value: 1,
        traceId: TRACE_A,
        spanId: '01',
        timestampMs: 1_700_000_000_000,
      }),
    ).rejects.toThrow(/spanId/);
  });

  it('T-DFOTEL-EX-004 attachTraceToMetric rejects unknown metric+trace pair', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    // No recordExemplar happened yet — attach should fail.
    await expect(
      mock.attachTraceToMetric({
        bucket: 'metrics',
        metricName: 'x',
        traceId: TRACE_A,
        spanId: SPAN_X,
      }),
    ).rejects.toThrow(/no exemplar/);
  });

  it('T-DFOTEL-EX-005 resolveMetricToTrace of unknown metric returns empty list', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    const result = await mock.resolveMetricToTrace({
      bucket: 'metrics',
      metricName: 'nonexistent',
    });
    expect(result.matchedCount).toBe(0);
    expect(result.traceIds).toHaveLength(0);
  });

  it('T-DFOTEL-EX-006 resolveMetricToTrace rejects empty metricName', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await expect(
      mock.resolveMetricToTrace({ bucket: 'metrics', metricName: '' }),
    ).rejects.toThrow(/metricName/);
  });

  it('T-DFOTEL-EX-007 resolveTraceToMetric rejects empty traceId', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await expect(
      mock.resolveTraceToMetric({ bucket: 'metrics', traceId: '' }),
    ).rejects.toThrow(/traceId/);
  });

  it('T-DFOTEL-EX-008 resolveTraceToMetric of unknown trace returns empty list', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    const result = await mock.resolveTraceToMetric({
      bucket: 'metrics',
      traceId: 'ffffffffffffffffffffffffffffffff',
    });
    expect(result.matchedCount).toBe(0);
  });

  it('T-DFOTEL-EX-009 metric-to-trace correlates two traces recorded for the same metric', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'shared',
      value: 1,
      traceId: TRACE_A,
      spanId: SPAN_X,
      timestampMs: 1_700_000_000_000,
    });
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'shared',
      value: 1,
      traceId: TRACE_B,
      spanId: SPAN_X,
      timestampMs: 1_700_000_000_001,
    });
    const result = await mock.resolveMetricToTrace({
      bucket: 'metrics',
      metricName: 'shared',
    });
    expect(result.matchedCount).toBe(2);
    expect(new Set(result.traceIds)).toEqual(new Set([TRACE_A, TRACE_B]));
  });

  it('T-DFOTEL-EX-010 attachTraceToMetric updates the recorded spanId', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'x',
      value: 1,
      traceId: TRACE_A,
      spanId: 'original-span',
      timestampMs: 1_700_000_000_000,
    });
    const result = await mock.attachTraceToMetric({
      bucket: 'metrics',
      metricName: 'x',
      traceId: TRACE_A,
      spanId: 'updated-span',
    });
    expect(result.spanId).toBe('updated-span');
  });

  it('T-DFOTEL-EX-011 exemplar events emit onto the trace with target=otel-collector', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'x',
      value: 1,
      traceId: TRACE_A,
      spanId: SPAN_X,
      timestampMs: 1_700_000_000_000,
    });
    const trace = mock.trace();
    const record = trace.find((t) => t.op === 'recordExemplar');
    expect(record?.target).toBe('otel-collector');
    expect(record?.providerEvent).toBe('otel-collector.exemplar.metric_recorded');
  });

  it('T-DFOTEL-EX-012 queryPromExemplars only returns traces for the requested metric', async () => {
    const mock = newMock();
    await seedMetrics(mock);
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'metric_a',
      value: 1,
      traceId: TRACE_A,
      spanId: SPAN_X,
      timestampMs: 1_700_000_000_000,
    });
    await mock.recordExemplar({
      bucket: 'metrics',
      metricName: 'metric_b',
      value: 1,
      traceId: TRACE_B,
      spanId: SPAN_X,
      timestampMs: 1_700_000_000_001,
    });
    const a = await mock.queryPromExemplars({
      bucket: 'metrics',
      metricName: 'metric_a',
    });
    expect(a.exemplarCount).toBe(1);
    expect(a.traceIds).toEqual([TRACE_A]);
    const b = await mock.queryPromExemplars({
      bucket: 'metrics',
      metricName: 'metric_b',
    });
    expect(b.traceIds).toEqual([TRACE_B]);
  });
});
