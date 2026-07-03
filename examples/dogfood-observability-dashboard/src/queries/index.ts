import type { DashboardQuery } from '../adapters/interface.js';

/**
 * PromQL-style query builders — shared between the mock adapter (which
 * evaluates them against the DashboardMock's TelemetryCollector) and the
 * real adapter (which compiles them to instant PromQL and calls
 * Prometheus HTTP API). Keeping the builders in one module means the
 * fidelity harness diffs like-for-like on both paths.
 *
 * The 4 builders cover the 4 seeded metric names in mock.ts::seedMetrics.
 */

export function errorRateQuery(): DashboardQuery {
  return {
    metricName: 'http.errors',
    aggregation: 'sum',
    labels: { status: '500' },
  };
}

export function p99LatencyQuery(): DashboardQuery {
  return {
    metricName: 'http.p99.latency.ms',
    aggregation: 'max',
    labels: { region: 'us-east' },
  };
}

export function queueDepthQuery(): DashboardQuery {
  return {
    metricName: 'queue.depth',
    aggregation: 'last',
    labels: { queue: 'jobs' },
  };
}

export function requestRateQuery(): DashboardQuery {
  return {
    metricName: 'http.requests',
    aggregation: 'sum',
  };
}

export function requestCountQuery(): DashboardQuery {
  return {
    metricName: 'http.requests',
    aggregation: 'count',
  };
}
