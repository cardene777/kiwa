import { describe, expect, it } from 'vitest';
import {
  computeErrorBudget,
  computeFourGoldenSignals,
  evaluateBurnRate,
  fireMultiWindowMultiBurnRateAlert,
  openSLOWindow,
  recordDuration,
  recordErrors,
  recordExemplarMetric,
  recordRequestRate,
  recordRequests,
  resolveMetricToTrace,
  resolveTraceToMetric,
  startExemplarSession,
  startRedUse,
  startSLO,
} from '../../src/semantics/index.js';

describe('v2.1 observability edge cases', () => {
  it('SLO with zero requests treats burn rate as zero', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    computeErrorBudget(s);
    evaluateBurnRate(s, { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 });
    expect(s.burnRate).toBe(0);
  });

  it('SLO with 100% errors gives burn rate = 1/(allowed rate)', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 100, errors: 100 });
    computeErrorBudget(s);
    evaluateBurnRate(s, { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 });
    expect(s.burnRate).toBeCloseTo(100, 6);
  });

  it('SLO 99.999% objective produces tiny allowed error rate', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99999, windowDays: 30 });
    openSLOWindow(s);
    const step = computeErrorBudget(s);
    expect(step.metadata.allowedErrorRate).toBeCloseTo(1e-5, 10);
  });

  it('multi-threshold alert fires when ANY threshold crossed', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 100, errors: 5 });
    computeErrorBudget(s);
    evaluateBurnRate(s, { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 });
    const step = fireMultiWindowMultiBurnRateAlert(s, {
      thresholds: [
        { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 100 }, // above
        { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 2 }, // below
      ],
      page: false,
    });
    expect(step.metadata.fired).toBe(true);
    expect(step.metadata.thresholdCount).toBe(2);
  });

  it('red/use p99 is highest sample when < 100 samples', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 5, windowSeconds: 1 });
    recordDuration(s, { durationMs: 10 });
    recordDuration(s, { durationMs: 20 });
    recordDuration(s, { durationMs: 30 });
    const golden = computeFourGoldenSignals(s);
    expect(golden.latencyP99Ms).toBe(30);
  });

  it('red/use zero errors gives zero error rate', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 100, windowSeconds: 1 });
    recordErrors(s, { errors: 0 });
    recordDuration(s, { durationMs: 10 });
    const golden = computeFourGoldenSignals(s);
    expect(golden.errorRate).toBe(0);
  });

  it('exemplar resolveTraceToMetric returns unique metric names (deduped)', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    const trace = 'ffffffffffffffffffffffffffffffff';
    recordExemplarMetric(s, {
      metricName: 'm1',
      value: 1,
      traceId: trace,
      spanId: '1111111111111111',
      timestampMs: 1,
    });
    recordExemplarMetric(s, {
      metricName: 'm1',
      value: 2,
      traceId: trace,
      spanId: '2222222222222222',
      timestampMs: 2,
    });
    recordExemplarMetric(s, {
      metricName: 'm2',
      value: 3,
      traceId: trace,
      spanId: '3333333333333333',
      timestampMs: 3,
    });
    const { metricNames } = resolveTraceToMetric(s, { traceId: trace });
    expect(metricNames.sort()).toEqual(['m1', 'm2']);
  });

  it('exemplar resolveMetricToTrace preserves insertion order', () => {
    const s = startExemplarSession({ target: 'prometheus', bucket: 'x' });
    const traceA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const traceB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    recordExemplarMetric(s, {
      metricName: 'm',
      value: 1,
      traceId: traceB,
      spanId: '1111111111111111',
      timestampMs: 1,
    });
    recordExemplarMetric(s, {
      metricName: 'm',
      value: 1,
      traceId: traceA,
      spanId: '2222222222222222',
      timestampMs: 2,
    });
    const { traceIds } = resolveMetricToTrace(s, { metricName: 'm' });
    expect(traceIds).toEqual([traceB, traceA]);
  });

  it('SLO burn rate handles allowed error rate 0 (100% objective would throw)', () => {
    // targetObjective = 0.9999999 to make allowedErrorRate = 1e-7 (very small but nonzero)
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.9999999, windowDays: 1 });
    openSLOWindow(s);
    recordRequests(s, { requests: 1_000_000, errors: 0 });
    computeErrorBudget(s);
    evaluateBurnRate(s, { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 1 });
    expect(s.burnRate).toBe(0);
  });
});
