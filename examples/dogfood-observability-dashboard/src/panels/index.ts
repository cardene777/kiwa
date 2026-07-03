import type { PanelDef } from '../adapters/interface.js';
import { errorRateQuery, p99LatencyQuery, queueDepthQuery, requestRateQuery, requestCountQuery } from '../queries/index.js';

/**
 * 5 canonical dashboard panels — one per chart type the v1.17-2 issue
 * scopes as AC (line / bar / gauge / stat / table). Each panel binds to
 * a seeded metric from `mock.ts::seedMetrics` so refreshing the mock
 * dashboard produces deterministic values, and Prometheus mode aggregates
 * the same metric via the shared query builder.
 */

export const linePanel: PanelDef = {
  id: 'panel-p99-latency-line',
  title: 'p99 request latency (ms)',
  chartType: 'line',
  query: p99LatencyQuery(),
  thresholds: [
    { operator: 'gte', value: 300, label: 'critical' },
    { operator: 'gte', value: 200, label: 'warn' },
    { operator: 'gte', value: 0, label: 'ok' },
  ],
};

export const barPanel: PanelDef = {
  id: 'panel-request-count-bar',
  title: 'request count by route',
  chartType: 'bar',
  query: requestRateQuery(),
  // No thresholds — bar chart is informational.
};

export const gaugePanel: PanelDef = {
  id: 'panel-queue-depth-gauge',
  title: 'job queue depth',
  chartType: 'gauge',
  query: queueDepthQuery(),
  thresholds: [
    { operator: 'gte', value: 20, label: 'critical' },
    { operator: 'gte', value: 15, label: 'warn' },
    { operator: 'gte', value: 0, label: 'ok' },
  ],
};

export const statPanel: PanelDef = {
  id: 'panel-error-rate-stat',
  title: 'HTTP 5xx errors (sum)',
  chartType: 'stat',
  query: errorRateQuery(),
  thresholds: [
    { operator: 'gte', value: 5, label: 'critical' },
    { operator: 'gte', value: 3, label: 'warn' },
    { operator: 'gte', value: 0, label: 'ok' },
  ],
};

export const tablePanel: PanelDef = {
  id: 'panel-request-count-table',
  title: 'request count (count of samples)',
  chartType: 'table',
  // Same metric as the bar panel but a different aggregation so both
  // panels have to run distinct query paths against the collector.
  query: requestCountQuery(),
};

/** The 5 canonical panels as a single, ordered array. */
export const seededPanels: PanelDef[] = [
  linePanel,
  barPanel,
  gaugePanel,
  statPanel,
  tablePanel,
];

/**
 * Panel look-up by chartType — used by tests to assert every chartType
 * is exercised on refresh.
 */
export function panelByChartType(chartType: PanelDef['chartType']): PanelDef {
  const panel = seededPanels.find((p) => p.chartType === chartType);
  if (!panel) throw new Error(`no seeded panel for chartType=${chartType}`);
  return panel;
}
