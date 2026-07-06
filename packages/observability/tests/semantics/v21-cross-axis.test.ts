import { describe, expect, it } from 'vitest';
import {
  applySilence,
  attachTraceToMetric,
  buildCorrelationIndex,
  buildFlameGraph,
  computeErrorBudget,
  computeFourGoldenSignals,
  detectHighCardinality,
  emitStructuredLog,
  evaluateBurnRate,
  extractW3CContext,
  fireMultiWindowMultiBurnRateAlert,
  isSilenced,
  openSLOWindow,
  pageOncall,
  propagateBaggage,
  recordDuration,
  recordErrors,
  recordExemplarMetric,
  recordRequestRate,
  recordRequests,
  recordSaturation,
  resolveMetricToTrace,
  sampleCpu,
  scanSeries,
  startAlertRoutingAdvanced,
  startCardinalitySession,
  startExemplarSession,
  startLogCorrelationAdvanced,
  startOtelAdvanced,
  startProfiling,
  startRedUse,
  startSLO,
} from '../../src/semantics/index.js';

const trace = '0af7651916cd43dd8448eb211c80319c';
const span = 'b7ad6b7169203331';

describe('v2.1 cross-axis integration', () => {
  it('SLO burn rate feeds alert routing paging', () => {
    const slo = startSLO({ target: 'prometheus', sloId: 'api', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(slo);
    recordRequests(slo, { requests: 1000, errors: 200 });
    computeErrorBudget(slo);
    evaluateBurnRate(slo, { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 });
    const step = fireMultiWindowMultiBurnRateAlert(slo, {
      thresholds: [{ shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 5 }],
      page: true,
    });

    const router = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'api-router' });
    if (step.metadata.fired === true) {
      pageOncall(router, { target: 'primary-oncall' });
    }
    expect(router.pagedTargets).toEqual(['primary-oncall']);
  });

  it('exemplar record + trace attach + m2t resolve chain', () => {
    const ex = startExemplarSession({ target: 'grafana-oss', bucket: 'latency' });
    recordExemplarMetric(ex, {
      metricName: 'http.p99',
      value: 500,
      traceId: trace,
      spanId: span,
      timestampMs: 1,
    });
    attachTraceToMetric(ex, { metricName: 'http.p99', traceId: trace, spanId: 'newnewnewnewnewn' });
    const { traceIds } = resolveMetricToTrace(ex, { metricName: 'http.p99' });
    expect(traceIds).toEqual([trace]);
  });

  it('OTel W3C context + log correlation cross-axis flow', () => {
    const otel = startOtelAdvanced({ target: 'otel-collector', serviceName: 'x' });
    extractW3CContext(otel, {
      traceparent: `00-${trace}-${span}-01`,
      tracestate: 'vendor=abc',
    });
    propagateBaggage(otel, { requestId: 'r-99' });
    const log = startLogCorrelationAdvanced({ target: 'otel-collector', namespace: 'x' });
    emitStructuredLog(log, {
      level: 'info',
      message: 'processed',
      traceId: trace,
      spanId: span,
      labels: { service: 'x' },
      timestampMs: 1,
    });
    buildCorrelationIndex(log);
    expect(log.correlationIndex.has(trace)).toBe(true);
  });

  it('alert silence blocks paging within window', () => {
    const router = startAlertRoutingAdvanced({ target: 'grafana-oss', routerId: 'router-a' });
    applySilence(router, {
      matcher: { severity: 'warning' },
      startMs: 1000,
      endMs: 2000,
      reason: 'planned',
    });
    expect(isSilenced(router, { severity: 'warning' }, 1500)).toBe(true);
    expect(isSilenced(router, { severity: 'critical' }, 1500)).toBe(false);
  });

  it('red/use four golden signals + high cardinality both flow through same target', () => {
    const redUse = startRedUse({ target: 'prometheus', serviceName: 'api' });
    recordRequestRate(redUse, { requests: 100, windowSeconds: 1 });
    recordErrors(redUse, { errors: 1 });
    recordDuration(redUse, { durationMs: 10 });
    recordSaturation(redUse, { saturation: 0.5 });
    const golden = computeFourGoldenSignals(redUse);
    expect(golden.trafficRps).toBe(100);

    const card = startCardinalitySession({ target: 'prometheus', scopeId: 'default' });
    const series = Array.from({ length: 30 }, (_, i) => ({
      metricName: 'http.p99',
      labels: { userId: `u${i}` },
    }));
    scanSeries(card, series);
    const { findings } = detectHighCardinality(card, { threshold: 20 });
    expect(findings).toHaveLength(1);
  });

  it('profiling flame graph + log correlation share trace context', () => {
    const prof = startProfiling({ target: 'prometheus', serviceName: 'x' });
    sampleCpu(prof, { stack: ['main', 'a'], valueBytes: 10, timestampMs: 1 });
    sampleCpu(prof, { stack: ['main', 'b'], valueBytes: 20, timestampMs: 2 });
    const step = buildFlameGraph(prof, { kind: 'cpu' });
    expect(step.metadata.rootValue).toBe(30);

    const log = startLogCorrelationAdvanced({ target: 'prometheus', namespace: 'x' });
    emitStructuredLog(log, {
      level: 'info',
      message: 'span opened',
      traceId: trace,
      spanId: span,
      labels: { profile_kind: 'cpu' },
      timestampMs: 1,
    });
    expect(log.logs).toHaveLength(1);
  });
});
