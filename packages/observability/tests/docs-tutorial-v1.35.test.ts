/**
 * v1.35-5 docs 補強 (Issue #1066 / CAR-802) — tutorial 70-72 code snippet validation
 * for `@kiwa-lab/observability` v2.1 advanced 8 axis.
 *
 * `docs/tutorials/70-slo-burn-rate.md` / `docs/tutorials/71-otel-exemplar.md` /
 * `docs/tutorials/72-continuous-profiling.md` に載っている advanced-semantics
 * snippet が実際に動作することを担保する。
 *
 * v1.23 → v1.35 で 13 milestone 連続 snippet validation streak を延伸。
 */
import { describe, expect, it } from 'vitest';
import { semantics } from '../src/index.js';

const {
  attachTraceToMetric,
  buildFlameGraph,
  collectFidelityCoverage,
  computeErrorBudget,
  enqueueSpan,
  evaluateBurnRate,
  extractW3CContext,
  fireMultiWindowMultiBurnRateAlert,
  flattenFlameGraph,
  flushBatch,
  openSLOWindow,
  propagateBaggage,
  recordExemplarMetric,
  recordRequests,
  resolveMetricToTrace,
  resolveTraceToMetric,
  sampleCpu,
  sampleMemory,
  sampleOffCpu,
  startExemplarSession,
  startOtelAdvanced,
  startProfiling,
  startSLO,
} = semantics;

// ---------------------------------------------------------------------------
// Tutorial 70 — SLO burn rate (error budget + MWMB alert)
// ---------------------------------------------------------------------------

describe('tutorial 70 — startSLO + openSLOWindow', () => {
  it('starts idle and transitions to window-open on openSLOWindow() (tutorial: session snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    expect(session.state).toBe('idle');
    expect(session.totalRequests).toBe(0);
    expect(session.totalErrors).toBe(0);

    const step = openSLOWindow(session);
    expect(session.state).toBe('window-open');
    expect(step.neutralEvent).toBe('slo.window_opened');
    expect(step.providerEvent).toBe('prom.slo.window.open');
    expect(step.metadata.windowDays).toBe(28);
    expect(step.metadata.targetObjective).toBe(0.999);
  });

  it('rejects an objective outside (0, 1) — no silent clamp (tutorial: objective guard snippet)', () => {
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 1.5, windowDays: 7 }),
    ).toThrow(/0 < objective < 1/);
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0, windowDays: 7 }),
    ).toThrow(/0 < objective < 1/);
  });

  it('rejects openSLOWindow() twice — the state machine is strict (tutorial: double-open guard snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    expect(() => openSLOWindow(session)).toThrow(/session is window-open, not idle/);
  });
});

describe('tutorial 70 — recordRequests + computeErrorBudget', () => {
  it('computes a 40-minute budget for a 99.9% × 28-day SLO (tutorial: budget snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    recordRequests(session, { requests: 100_000, errors: 42 });

    const step = computeErrorBudget(session);
    expect(step.neutralEvent).toBe('slo.error_budget_computed');
    expect(step.metadata.allowedErrorRate).toBeCloseTo(0.001, 6);
    expect(step.metadata.windowSeconds).toBe(2_419_200);
    expect(step.metadata.errorBudgetSeconds).toBeCloseTo(2_419.2, 3);
    expect(session.state).toBe('budget-computed');
  });

  it('rejects negative counts and errors > requests (tutorial: counter invariant snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'x',
      targetObjective: 0.99,
      windowDays: 7,
    });
    openSLOWindow(session);
    expect(() => recordRequests(session, { requests: -1, errors: 0 })).toThrow(/non-negative/);
    expect(() => recordRequests(session, { requests: 10, errors: 11 })).toThrow(
      /errors must not exceed requests/,
    );
  });

  it('rejects computeErrorBudget() before openSLOWindow() (tutorial: idle guard snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'x',
      targetObjective: 0.99,
      windowDays: 7,
    });
    expect(() => computeErrorBudget(session)).toThrow(/session is idle, not window-open/);
  });
});

describe('tutorial 70 — MWMB alert', () => {
  it('fires when the observed burn rate is 14.4× at the 99.9% × 28-day objective (tutorial: MWMB fire snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    recordRequests(session, { requests: 100_000, errors: 1_500 });
    computeErrorBudget(session);

    const burn = evaluateBurnRate(session, {
      shortWindowMinutes: 5,
      longWindowMinutes: 60,
      burnRate: 14.4,
    });
    expect(session.state).toBe('burn-evaluated');
    expect(burn.metadata.burnRate).toBeGreaterThan(14.4);

    const alert = fireMultiWindowMultiBurnRateAlert(session, {
      thresholds: [
        { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 },
        { shortWindowMinutes: 30, longWindowMinutes: 360, burnRate: 6 },
      ],
      page: true,
    });
    expect(alert.neutralEvent).toBe('slo.multi_window_alert_fired');
    expect(alert.metadata.fired).toBe(true);
    expect(alert.metadata.pagerEnabled).toBe(true);
    expect(alert.metadata.thresholdCount).toBe(2);
    expect(session.state).toBe('alert-fired');
  });

  it('does not fire when the observed burn rate is 1× (nominal) (tutorial: MWMB nominal snippet)', () => {
    const session = startSLO({
      target: 'prometheus',
      sloId: 'api-availability',
      targetObjective: 0.999,
      windowDays: 28,
    });
    openSLOWindow(session);
    recordRequests(session, { requests: 100_000, errors: 100 });
    computeErrorBudget(session);
    const burn = evaluateBurnRate(session, {
      shortWindowMinutes: 5,
      longWindowMinutes: 60,
      burnRate: 14.4,
    });
    expect(burn.metadata.burnRate).toBeCloseTo(1, 3);

    const alert = fireMultiWindowMultiBurnRateAlert(session, {
      thresholds: [{ shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 }],
      page: false,
    });
    expect(alert.metadata.fired).toBe(false);
    expect(alert.metadata.pagerEnabled).toBe(false);
  });
});

describe('tutorial 70 — fidelity coverage', () => {
  it('the 4 provider × slo axis grid emits 4 rows (tutorial: fidelity snippet)', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const sloRows = coverage.rows.filter((r) => r.axis === 'slo');
    expect(sloRows).toHaveLength(4);
    for (const row of sloRows) {
      expect(row.neutralEvents).toEqual([
        'slo.window_opened',
        'slo.error_budget_computed',
        'slo.burn_rate_evaluated',
        'slo.multi_window_alert_fired',
      ]);
    }
  });

  it('each provider gets a distinct dialect for slo.window_opened (tutorial: dialect snippet)', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const openedByProvider = new Map<string, string>();
    for (const row of coverage.rows.filter((r) => r.axis === 'slo')) {
      openedByProvider.set(row.provider, row.providerEvents[0]!);
    }
    expect(openedByProvider.get('grafana-oss')).toBe('grafana.slo.window.open');
    expect(openedByProvider.get('prometheus')).toBe('prom.slo.window.open');
    expect(openedByProvider.get('loki')).toBe('loki.slo.window');
    expect(openedByProvider.get('otel-collector')).toBe('otel.slo.window');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 71 — OpenTelemetry exemplar (record + attach + m2t / t2m + batch + baggage + W3C)
// ---------------------------------------------------------------------------

describe('tutorial 71 — startExemplarSession + recordExemplarMetric', () => {
  it('records an exemplar with a trace_id + span_id and enters metric-recorded (tutorial: record snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    expect(session.state).toBe('idle');

    const step = recordExemplarMetric(session, {
      metricName: 'http_server_duration_ms',
      value: 512,
      traceId: 'abcdef0123456789',
      spanId: 'span0001',
      timestampMs: 1_700_000_000_000,
    });

    expect(step.neutralEvent).toBe('exemplar.metric_recorded');
    expect(step.providerEvent).toBe('otel.metric.exemplar');
    expect(step.metadata.metricName).toBe('http_server_duration_ms');
    expect(step.metadata.traceId).toBe('abcdef0123456789');
    expect(session.state).toBe('metric-recorded');
    expect(session.exemplars).toHaveLength(1);
  });

  it('rejects a short trace_id — the OTLP spec requires ≥ 8 chars (tutorial: trace_id guard snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    expect(() =>
      recordExemplarMetric(session, {
        metricName: 'http_server_duration_ms',
        value: 500,
        traceId: 'short',
        spanId: 'span0001',
        timestampMs: 1_700_000_000_000,
      }),
    ).toThrow(/traceId must be at least 8 chars/);
  });

  it('rejects an empty metricName (tutorial: metric name guard snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    expect(() =>
      recordExemplarMetric(session, {
        metricName: '',
        value: 500,
        traceId: 'abcdef0123456789',
        spanId: 'span0001',
        timestampMs: 1_700_000_000_000,
      }),
    ).toThrow(/metricName must not be empty/);
  });
});

describe('tutorial 71 — bidirectional resolve (m2t / t2m)', () => {
  function seed3(session: ReturnType<typeof startExemplarSession>) {
    recordExemplarMetric(session, {
      metricName: 'http_server_duration_ms',
      value: 512,
      traceId: 'abcdef0123456789',
      spanId: 'span0001',
      timestampMs: 1_700_000_000_000,
    });
    recordExemplarMetric(session, {
      metricName: 'http_server_duration_ms',
      value: 234,
      traceId: 'fedcba9876543210',
      spanId: 'span0002',
      timestampMs: 1_700_000_000_500,
    });
    recordExemplarMetric(session, {
      metricName: 'db_query_duration_ms',
      value: 87,
      traceId: 'abcdef0123456789',
      spanId: 'span0003',
      timestampMs: 1_700_000_000_100,
    });
  }

  it('resolveMetricToTrace returns every trace that hit the metric bucket (tutorial: m2t snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    seed3(session);
    const { step, traceIds } = resolveMetricToTrace(session, { metricName: 'http_server_duration_ms' });
    expect(step.neutralEvent).toBe('exemplar.metric_to_trace_resolved');
    expect(traceIds).toEqual(['abcdef0123456789', 'fedcba9876543210']);
    expect(session.state).toBe('m2t-resolved');
  });

  it('resolveTraceToMetric returns every metric that trace contributed to (tutorial: t2m snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'http_latency_ms' });
    seed3(session);
    const { step, metricNames } = resolveTraceToMetric(session, { traceId: 'abcdef0123456789' });
    expect(step.neutralEvent).toBe('exemplar.trace_to_metric_resolved');
    expect(metricNames).toEqual(['http_server_duration_ms', 'db_query_duration_ms']);
    expect(session.state).toBe('t2m-resolved');
  });
});

describe('tutorial 71 — attachTraceToMetric', () => {
  it('binds a span_id to an existing metric record (tutorial: attach snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'p99' });
    recordExemplarMetric(session, {
      metricName: 'http_server_duration_ms',
      value: 512,
      traceId: 'abcdef0123456789',
      spanId: 'span0001',
      timestampMs: 1_700_000_000_000,
    });

    const step = attachTraceToMetric(session, {
      metricName: 'http_server_duration_ms',
      traceId: 'abcdef0123456789',
      spanId: 'span_reattached',
    });
    expect(step.neutralEvent).toBe('exemplar.trace_attached');
    expect(session.state).toBe('trace-attached');
    expect(session.exemplars[0]!.spanId).toBe('span_reattached');
  });

  it('rejects an attach for a metric that was never recorded (tutorial: attach guard snippet)', () => {
    const session = startExemplarSession({ target: 'otel-collector', bucket: 'p99' });
    expect(() =>
      attachTraceToMetric(session, {
        metricName: 'missing_metric',
        traceId: 'abcdef0123456789',
        spanId: 'span0001',
      }),
    ).toThrow(/no exemplar for metric=missing_metric/);
  });
});

describe('tutorial 71 — batch flush', () => {
  it('flushes up to maxBatchSize and leaves the remainder in the queue (tutorial: batch snippet)', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    for (let i = 0; i < 5; i++) {
      enqueueSpan(session, {
        spanId: `span-${i}`,
        parentId: null,
        attributes: { 'http.method': 'GET' },
      });
    }
    expect(session.queue).toHaveLength(5);

    const step = flushBatch(session, { maxBatchSize: 3 });
    expect(step.neutralEvent).toBe('otel.batch_flushed');
    expect(step.metadata.batchSize).toBe(3);
    expect(step.metadata.remainingQueue).toBe(2);
  });

  it('rejects a non-positive maxBatchSize (tutorial: batch guard snippet)', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    expect(() => flushBatch(session, { maxBatchSize: 0 })).toThrow(/maxBatchSize must be positive/);
  });
});

describe('tutorial 71 — baggage + W3C context', () => {
  it('propagates baggage entries and records the addedKeys (tutorial: baggage snippet)', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    const step = propagateBaggage(session, { 'user.id': '42', 'user.tier': 'gold' });
    expect(step.neutralEvent).toBe('otel.baggage_propagated');
    expect(step.metadata.entryCount).toBe(2);
    expect(step.metadata.addedKeys).toBe('user.id,user.tier');
    expect(session.baggage).toEqual({ 'user.id': '42', 'user.tier': 'gold' });
  });

  it('extracts a W3C traceparent (tutorial: W3C snippet)', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    const step = extractW3CContext(session, {
      traceparent: '00-abcdef0123456789abcdef0123456789-fedcba9876543210-01',
    });
    expect(step.neutralEvent).toBe('otel.w3c_context_extracted');
    expect(step.metadata.version).toBe('00');
    expect(step.metadata.traceId).toBe('abcdef0123456789abcdef0123456789');
    expect(step.metadata.spanId).toBe('fedcba9876543210');
    expect(step.metadata.flags).toBe('01');
  });

  it('rejects a bad traceparent format (tutorial: W3C format guard snippet)', () => {
    const session = startOtelAdvanced({ target: 'otel-collector', serviceName: 'checkout' });
    expect(() =>
      extractW3CContext(session, { traceparent: 'not-a-traceparent' }),
    ).toThrow(/invalid traceparent format/);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 72 — Continuous profiling (cpu / memory / off-cpu / flame / flatten)
// ---------------------------------------------------------------------------

describe('tutorial 72 — startProfiling + sampleCpu', () => {
  it('records a cpu sample and advances idle → cpu-sampled (tutorial: cpu sample snippet)', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    expect(session.state).toBe('idle');

    const step = sampleCpu(session, {
      stack: ['main', 'handleRequest', 'renderTemplate'],
      valueBytes: 1_200_000,
      timestampMs: 1_700_000_000_000,
    });

    expect(step.neutralEvent).toBe('profile.cpu_sampled');
    expect(step.providerEvent).toBe('grafana.pyroscope.cpu');
    expect(step.metadata.kind).toBe('cpu');
    expect(step.metadata.stackDepth).toBe(3);
    expect(step.metadata.valueBytes).toBe(1_200_000);
    expect(session.state).toBe('cpu-sampled');
    expect(session.samples).toHaveLength(1);
  });

  it('rejects an empty serviceName (tutorial: serviceName guard snippet)', () => {
    expect(() => startProfiling({ target: 'grafana-oss', serviceName: '' })).toThrow(
      /serviceName must not be empty/,
    );
  });

  it('rejects an empty stack (tutorial: empty stack guard snippet)', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    expect(() =>
      sampleCpu(session, { stack: [], valueBytes: 1_000, timestampMs: 1_700_000_000_000 }),
    ).toThrow(/stack must not be empty/);
  });

  it('rejects a negative valueBytes (tutorial: valueBytes guard snippet)', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    expect(() =>
      sampleCpu(session, {
        stack: ['main'],
        valueBytes: -1,
        timestampMs: 1_700_000_000_000,
      }),
    ).toThrow(/valueBytes must be non-negative/);
  });
});

describe('tutorial 72 — sampleMemory + sampleOffCpu', () => {
  it('records a memory sample after a cpu sample (tutorial: memory snippet)', () => {
    const session = startProfiling({ target: 'prometheus', serviceName: 'checkout-api' });
    sampleCpu(session, {
      stack: ['main', 'handleRequest'],
      valueBytes: 900_000,
      timestampMs: 1_700_000_000_000,
    });
    const step = sampleMemory(session, {
      stack: ['main', 'handleRequest', 'allocateBuffer'],
      valueBytes: 4_096_000,
      timestampMs: 1_700_000_000_500,
    });
    expect(step.neutralEvent).toBe('profile.memory_sampled');
    expect(step.providerEvent).toBe('prom.parca.memory');
    expect(step.metadata.kind).toBe('memory');
    expect(session.state).toBe('memory-sampled');
    expect(session.samples).toHaveLength(2);
  });

  it('records an off-cpu sample (tutorial: off-cpu snippet)', () => {
    const session = startProfiling({ target: 'otel-collector', serviceName: 'checkout-api' });
    sampleCpu(session, {
      stack: ['main'],
      valueBytes: 500_000,
      timestampMs: 1_700_000_000_000,
    });
    sampleMemory(session, {
      stack: ['main', 'allocateBuffer'],
      valueBytes: 1_024_000,
      timestampMs: 1_700_000_000_500,
    });
    const step = sampleOffCpu(session, {
      stack: ['main', 'waitOnLock'],
      valueBytes: 250_000,
      timestampMs: 1_700_000_001_000,
    });
    expect(step.neutralEvent).toBe('profile.off_cpu_sampled');
    expect(step.providerEvent).toBe('otel.profile.off_cpu');
    expect(step.metadata.kind).toBe('off-cpu');
    expect(step.metadata.sampleCount).toBe(3);
    expect(session.state).toBe('off-cpu-sampled');
  });
});

describe('tutorial 72 — buildFlameGraph', () => {
  function seedThreeStacks(session: ReturnType<typeof startProfiling>) {
    sampleCpu(session, {
      stack: ['main', 'handleRequest', 'renderTemplate'],
      valueBytes: 1_000_000,
      timestampMs: 1_700_000_000_000,
    });
    sampleCpu(session, {
      stack: ['main', 'handleRequest', 'queryDatabase'],
      valueBytes: 2_500_000,
      timestampMs: 1_700_000_000_500,
    });
    sampleCpu(session, {
      stack: ['main', 'handleAdmin', 'renderReport'],
      valueBytes: 500_000,
      timestampMs: 1_700_000_001_000,
    });
  }

  it('builds a tree where the root totalValue equals the sum of every sample (tutorial: flame snippet)', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    seedThreeStacks(session);

    const step = buildFlameGraph(session, { kind: 'cpu' });
    expect(step.neutralEvent).toBe('profile.flame_graph_built');
    expect(step.providerEvent).toBe('grafana.pyroscope.flame');
    expect(step.metadata.kind).toBe('cpu');
    expect(step.metadata.rootValue).toBe(1_000_000 + 2_500_000 + 500_000);
    expect(step.metadata.sampleCount).toBe(3);
    expect(step.metadata.branchCount).toBe(1);
    expect(session.state).toBe('flame-built');
    expect(session.flameGraph).not.toBeNull();
    expect(session.flameGraph!.frame).toBe('<root>');
    expect(session.flameGraph!.totalValue).toBe(4_000_000);
  });

  it('rejects buildFlameGraph when no sample of that kind was recorded (tutorial: flame guard snippet)', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    seedThreeStacks(session);
    expect(() => buildFlameGraph(session, { kind: 'memory' })).toThrow(
      /no samples for kind=memory/,
    );
  });
});

describe('tutorial 72 — flattenFlameGraph', () => {
  it('walks depth-first — root, then main, then children (tutorial: flatten snippet)', () => {
    const session = startProfiling({ target: 'grafana-oss', serviceName: 'checkout-api' });
    sampleCpu(session, {
      stack: ['main', 'handleRequest', 'renderTemplate'],
      valueBytes: 1_000_000,
      timestampMs: 1_700_000_000_000,
    });
    sampleCpu(session, {
      stack: ['main', 'handleRequest', 'queryDatabase'],
      valueBytes: 2_500_000,
      timestampMs: 1_700_000_000_500,
    });
    buildFlameGraph(session, { kind: 'cpu' });

    const flat = flattenFlameGraph(session.flameGraph);
    expect(flat.map((r) => `${r.depth}:${r.frame}`)).toEqual([
      '0:<root>',
      '1:main',
      '2:handleRequest',
      '3:renderTemplate',
      '3:queryDatabase',
    ]);
    expect(flat[0]!.totalValue).toBe(3_500_000);
    expect(flat[1]!.totalValue).toBe(3_500_000);
    expect(flat[2]!.totalValue).toBe(3_500_000);
  });

  it('returns an empty array when the flame graph is null (tutorial: flatten null snippet)', () => {
    expect(flattenFlameGraph(null)).toEqual([]);
  });
});

describe('tutorial 72 — fidelity coverage (profiling)', () => {
  it('the 4 provider × profiling axis grid emits 4 rows (tutorial: profiling fidelity snippet)', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const profilingRows = coverage.rows.filter((r) => r.axis === 'profiling');
    expect(profilingRows).toHaveLength(4);
    for (const row of profilingRows) {
      expect(row.neutralEvents).toEqual([
        'profile.cpu_sampled',
        'profile.memory_sampled',
        'profile.off_cpu_sampled',
        'profile.flame_graph_built',
      ]);
    }
  });

  it('each provider gets a distinct dialect for profile.cpu_sampled (tutorial: profiling dialect snippet)', () => {
    const coverage = collectFidelityCoverage(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    const cpuByProvider = new Map<string, string>();
    for (const row of coverage.rows.filter((r) => r.axis === 'profiling')) {
      cpuByProvider.set(row.provider, row.providerEvents[0]!);
    }
    expect(cpuByProvider.get('grafana-oss')).toBe('grafana.pyroscope.cpu');
    expect(cpuByProvider.get('prometheus')).toBe('prom.parca.cpu');
    expect(cpuByProvider.get('loki')).toBe('loki.profile.cpu');
    expect(cpuByProvider.get('otel-collector')).toBe('otel.profile.cpu');
  });
});
