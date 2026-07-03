/**
 * Fixture builders — v2.0 addition (v1.17-1).
 *
 * Named fixtures for the 4 v2.0 axes so kiwa test authors can bootstrap
 * a realistic scenario in one call instead of hand-rolling panels /
 * rules / trace shapes / correlation attributes. Every builder is
 * pure (no side effects) and returns config objects for pass into the
 * DashboardMock / AlertRouter / buildSpanTree / LogCorrelationIndex.
 */
import type {
  PanelConfig,
  PanelThreshold,
} from './dashboard-mock.js';
import type {
  AlertRule,
  EscalationStep,
  RouteEntry,
  Silence,
} from './alert.js';
import type {
  LogRecord,
  SpanRecord,
} from './telemetry.js';

/**
 * Dashboard panel builders — 3 named scenarios covering the common
 * SaaS observability wall.
 */
export function panel_httpErrorRate(id = 'panel-http-error-rate'): PanelConfig {
  const thresholds: PanelThreshold[] = [
    { operator: 'gte', value: 0.1, label: 'critical' },
    { operator: 'gte', value: 0.01, label: 'warn' },
  ];
  return {
    id,
    title: 'HTTP error rate',
    kind: 'stat',
    query: {
      metricName: 'http.errors',
      aggregation: 'sum',
    },
    thresholds,
  };
}

export function panel_p99Latency(id = 'panel-p99-latency'): PanelConfig {
  const thresholds: PanelThreshold[] = [
    { operator: 'gte', value: 1000, label: 'critical' },
    { operator: 'gte', value: 500, label: 'warn' },
  ];
  return {
    id,
    title: 'p99 request latency (ms)',
    kind: 'timeseries',
    query: {
      metricName: 'http.latency.ms',
      aggregation: 'max',
    },
    thresholds,
  };
}

export function panel_queueDepth(id = 'panel-queue-depth', queue = 'default'): PanelConfig {
  return {
    id,
    title: `Queue depth — ${queue}`,
    kind: 'gauge',
    query: {
      metricName: 'queue.depth',
      aggregation: 'last',
      tagFilter: { queue },
    },
    thresholds: [{ operator: 'gte', value: 1000, label: 'warn' }],
  };
}

/**
 * Alert rule builders — 3 named scenarios matching the panel wall.
 */
export function rule_errorRateCritical(id = 'rule-error-rate-critical'): AlertRule {
  return {
    id,
    metricName: 'http.errors',
    operator: 'gte',
    threshold: 10,
    forSamples: 1,
    labels: { severity: 'critical', team: 'platform' },
    severity: 'critical',
  };
}

export function rule_latencyDegraded(id = 'rule-latency-degraded'): AlertRule {
  return {
    id,
    metricName: 'http.latency.ms',
    operator: 'gte',
    threshold: 500,
    forSamples: 3,
    labels: { severity: 'warn', team: 'platform' },
    severity: 'warn',
  };
}

export function rule_queueBackpressure(id = 'rule-queue-backpressure', queue = 'default'): AlertRule {
  return {
    id,
    metricName: 'queue.depth',
    operator: 'gte',
    threshold: 1000,
    forSamples: 1,
    labels: { severity: 'warn', team: 'data', queue },
    severity: 'warn',
  };
}

/**
 * Alert routing tree — deepest match wins.
 */
export function defaultRoute(): RouteEntry {
  return {
    match: {},
    receiver: 'default',
    routes: [
      {
        match: { severity: 'critical' },
        receiver: 'pagerduty',
        routes: [
          { match: { team: 'platform' }, receiver: 'pagerduty-platform' },
        ],
      },
      {
        match: { severity: 'warn' },
        receiver: 'slack',
        routes: [
          { match: { team: 'data' }, receiver: 'slack-data' },
        ],
      },
    ],
  };
}

export function escalation_pagerDutyTwoStep(): EscalationStep[] {
  return [
    { afterMs: 5 * 60 * 1000, receiver: 'pagerduty-secondary' },
    { afterMs: 15 * 60 * 1000, receiver: 'pagerduty-lead' },
  ];
}

export function silence_maintenanceWindow(id: string, minutesFromNow: number, now: number): Silence {
  return {
    id,
    match: { team: 'platform' },
    expiresAt: now + minutesFromNow * 60 * 1000,
  };
}

/**
 * Trace scenario builders — 3 named span shapes covering the common
 * SUT flame graph patterns.
 */
export function trace_httpHandler(startAt = 1_000): SpanRecord[] {
  const traceId = 'trace-http-handler';
  return [
    {
      name: 'http.request',
      attributes: { trace_id: traceId, span_id: 'sp-1' },
      startedAt: startAt,
      endedAt: startAt + 100,
      parentSpanName: null,
      events: [],
    },
    {
      name: 'db.query',
      attributes: { trace_id: traceId, span_id: 'sp-2' },
      startedAt: startAt + 10,
      endedAt: startAt + 60,
      parentSpanName: 'http.request',
      events: [],
    },
    {
      name: 'cache.get',
      attributes: { trace_id: traceId, span_id: 'sp-3' },
      startedAt: startAt + 65,
      endedAt: startAt + 75,
      parentSpanName: 'http.request',
      events: [],
    },
  ];
}

export function trace_fanoutParallel(startAt = 1_000): SpanRecord[] {
  const traceId = 'trace-fanout';
  return [
    {
      name: 'handler',
      attributes: { trace_id: traceId, span_id: 'sp-1' },
      startedAt: startAt,
      endedAt: startAt + 200,
      parentSpanName: null,
      events: [],
    },
    {
      name: 'worker',
      attributes: { trace_id: traceId, span_id: 'sp-2' },
      startedAt: startAt + 10,
      endedAt: startAt + 100,
      parentSpanName: 'handler',
      events: [],
    },
    {
      name: 'worker',
      attributes: { trace_id: traceId, span_id: 'sp-3' },
      startedAt: startAt + 20,
      endedAt: startAt + 110,
      parentSpanName: 'handler',
      events: [],
    },
    {
      name: 'worker',
      attributes: { trace_id: traceId, span_id: 'sp-4' },
      startedAt: startAt + 30,
      endedAt: startAt + 120,
      parentSpanName: 'handler',
      events: [],
    },
  ];
}

export function trace_nestedRetry(startAt = 1_000): SpanRecord[] {
  const traceId = 'trace-nested-retry';
  return [
    {
      name: 'api.call',
      attributes: { trace_id: traceId, span_id: 'sp-1' },
      startedAt: startAt,
      endedAt: startAt + 300,
      parentSpanName: null,
      events: [],
    },
    {
      name: 'retry',
      attributes: { trace_id: traceId, span_id: 'sp-2', attempt: 1 },
      startedAt: startAt + 10,
      endedAt: startAt + 110,
      parentSpanName: 'api.call',
      events: [],
    },
    {
      name: 'http.fetch',
      attributes: { trace_id: traceId, span_id: 'sp-3', attempt: 1 },
      startedAt: startAt + 20,
      endedAt: startAt + 105,
      parentSpanName: 'retry',
      events: [],
    },
    {
      name: 'retry',
      attributes: { trace_id: traceId, span_id: 'sp-4', attempt: 2 },
      startedAt: startAt + 120,
      endedAt: startAt + 250,
      parentSpanName: 'api.call',
      events: [],
    },
    {
      name: 'http.fetch',
      attributes: { trace_id: traceId, span_id: 'sp-5', attempt: 2 },
      startedAt: startAt + 130,
      endedAt: startAt + 245,
      parentSpanName: 'retry',
      events: [],
    },
  ];
}

/**
 * Log correlation fixture — matched log lines for the http handler
 * trace. Timestamps sit inside the parent span window so join by
 * timestamp bucket also works for callers that do not carry ids.
 */
export function logs_forHttpTrace(startAt = 1_000): LogRecord[] {
  const traceId = 'trace-http-handler';
  return [
    {
      level: 'info',
      message: 'request received',
      attributes: { trace_id: traceId, span_id: 'sp-1' },
      timestamp: startAt + 5,
    },
    {
      level: 'debug',
      message: 'db query start',
      attributes: { trace_id: traceId, span_id: 'sp-2' },
      timestamp: startAt + 15,
    },
    {
      level: 'warn',
      message: 'cache miss',
      attributes: { trace_id: traceId, span_id: 'sp-3' },
      timestamp: startAt + 70,
    },
    {
      level: 'info',
      message: 'request completed',
      attributes: { trace_id: traceId, span_id: 'sp-1' },
      timestamp: startAt + 95,
    },
  ];
}
