import {
  buildDashboardMock,
  TelemetryCollector,
  type MetricRecord,
  type PanelConfig,
  type PanelKind,
} from '@kiwa/observability';
import type {
  ChartType,
  DashboardAdapter,
  DashboardAdapterConfig,
  DashboardMetrics,
  DashboardQuery,
  PanelDef,
  PanelRenderResult,
  QueryResult,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives the `@kiwa/observability` DashboardMock so
 * the same app code exercises the Grafana-style surface without touching
 * a real Prometheus. The mock produces deterministic behaviour so fidelity
 * tests can assert on panel render values, badge assignment, refresh
 * cadence and query aggregation without wall-clock noise.
 *
 * The 5 dashboard chart types (line / bar / gauge / stat / table) map to
 * the 4 DashboardMock PanelKinds — line + bar both back onto
 * `timeseries`, and the app-level distinction is preserved as
 * PanelRenderResult.chartType so downstream Next.js App Router pages can
 * pick the correct chart component.
 */
export function makeMockAdapter(config: DashboardAdapterConfig): DashboardAdapter {
  const collector = new TelemetryCollector();
  const clock = config.now ?? (() => Date.now());
  // Seed the collector with the 4 metric names the seeded dashboard
  // panels query so refreshes have data to aggregate.
  seedMetrics(collector, clock);

  const dashboard = buildDashboardMock({
    id: config.dashboardId,
    title: config.title,
    panels: config.panels.map(toPanelConfig),
    collector,
    ...(config.now ? { now: config.now } : {}),
  });

  const chartTypeById = new Map<string, ChartType>(
    config.panels.map((p) => [p.id, p.chartType]),
  );

  const trace: TraceEvent[] = [];
  const queryLatencySamplesMs: number[] = [];
  const refreshLatencySamplesMs: number[] = [];
  let queryCount = 0;
  let requestCount = 0;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async runQuery(query: DashboardQuery): Promise<QueryResult> {
      const start = clock();
      // The DashboardMock evaluates panels — for `runQuery` we synthesize
      // an inline evaluation against the collector so the query surface
      // has matching semantics on both mock + real paths without allocating
      // a throwaway panel. One filter pass, both value + count derived.
      const matches = collector.metrics.filter((m) => queryMatches(m, query));
      const value = aggregateMatches(matches, query.aggregation);
      queryCount += 1;
      requestCount += 1;
      const latencyMs = Math.max(0, clock() - start);
      queryLatencySamplesMs.push(latencyMs);
      record('runQuery', true, { detail: query.metricName });
      return {
        metricName: query.metricName,
        value,
        matchedSamples: matches.length,
        latencyMs,
      };
    },

    async refreshDashboard(): Promise<PanelRenderResult[]> {
      const start = clock();
      const results = dashboard.refresh();
      requestCount += 1;
      const latencyMs = Math.max(0, clock() - start);
      refreshLatencySamplesMs.push(latencyMs);
      record('refreshDashboard', true, {
        detail: `panels=${results.length}`,
      });
      return results.map((r): PanelRenderResult => ({
        panelId: r.panelId,
        title: r.title,
        chartType: chartTypeById.get(r.panelId) ?? 'stat',
        value: r.value,
        matchedSamples: r.matchedRecords,
        badge: r.badge,
        refreshedAt: r.refreshedAt,
      }));
    },

    getRefreshCount(): number {
      return dashboard.getRefreshCount();
    },

    getPanel(panelId: string): PanelRenderResult | undefined {
      const r = dashboard.panel(panelId);
      if (!r) return undefined;
      return {
        panelId: r.panelId,
        title: r.title,
        chartType: chartTypeById.get(r.panelId) ?? 'stat',
        value: r.value,
        matchedSamples: r.matchedRecords,
        badge: r.badge,
        refreshedAt: r.refreshedAt,
      };
    },

    metrics(): DashboardMetrics {
      return {
        queryCount,
        refreshCount: dashboard.getRefreshCount(),
        queryLatencySamplesMs: [...queryLatencySamplesMs],
        refreshLatencySamplesMs: [...refreshLatencySamplesMs],
        requests: requestCount,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      queryLatencySamplesMs.length = 0;
      refreshLatencySamplesMs.length = 0;
      queryCount = 0;
      requestCount = 0;
    },
  };

  function toPanelConfig(panel: PanelDef): PanelConfig {
    const kind = chartTypeToPanelKind(panel.chartType);
    const cfg: PanelConfig = {
      id: panel.id,
      title: panel.title,
      kind,
      query: {
        metricName: panel.query.metricName,
        aggregation: panel.query.aggregation,
        ...(panel.query.labels ? { tagFilter: panel.query.labels } : {}),
        ...(panel.query.sinceMs !== undefined ? { sinceMs: panel.query.sinceMs } : {}),
        ...(panel.query.untilMs !== undefined ? { untilMs: panel.query.untilMs } : {}),
      },
    };
    if (panel.thresholds) cfg.thresholds = panel.thresholds;
    return cfg;
  }
}

/**
 * App chart type → observability package PanelKind mapping. `line` and
 * `bar` are Grafana-level chart pickers on top of the same
 * timeseries data source, so both map to `timeseries`.
 */
export function chartTypeToPanelKind(chartType: ChartType): PanelKind {
  switch (chartType) {
    case 'line':
    case 'bar':
      return 'timeseries';
    case 'gauge':
      return 'gauge';
    case 'stat':
      return 'stat';
    case 'table':
      return 'table';
    default: {
      const _exhaustive: never = chartType;
      return _exhaustive;
    }
  }
}

function seedMetrics(collector: TelemetryCollector, clock: () => number): void {
  // 4 metric names cover the 5 seeded panels — the table panel reuses
  // one of the counters via a different aggregation. Timestamps come
  // from the same clock the DashboardMock will use, so
  // sinceMs / untilMs windows apply consistently.
  const push = (rec: Omit<MetricRecord, 'timestamp'>): void => {
    collector.metrics.push({ ...rec, timestamp: clock() });
  };

  push({ name: 'http.errors', kind: 'counter', value: 3, tags: { route: '/api/users', status: '500' } });
  push({ name: 'http.errors', kind: 'counter', value: 2, tags: { route: '/api/orders', status: '500' } });
  push({ name: 'http.errors', kind: 'counter', value: 5, tags: { route: '/api/users', status: '500' } });

  push({ name: 'http.p99.latency.ms', kind: 'gauge', value: 120, tags: { region: 'us-east' } });
  push({ name: 'http.p99.latency.ms', kind: 'gauge', value: 280, tags: { region: 'us-east' } });
  push({ name: 'http.p99.latency.ms', kind: 'gauge', value: 340, tags: { region: 'us-east' } });

  push({ name: 'queue.depth', kind: 'gauge', value: 12, tags: { queue: 'jobs' } });
  push({ name: 'queue.depth', kind: 'gauge', value: 18, tags: { queue: 'jobs' } });
  push({ name: 'queue.depth', kind: 'gauge', value: 24, tags: { queue: 'jobs' } });

  push({ name: 'http.requests', kind: 'counter', value: 100, tags: { route: '/api/users' } });
  push({ name: 'http.requests', kind: 'counter', value: 150, tags: { route: '/api/orders' } });
  push({ name: 'http.requests', kind: 'counter', value: 120, tags: { route: '/api/users' } });
}

function aggregateMatches(
  matches: MetricRecord[],
  agg: DashboardQuery['aggregation'],
): number {
  if (matches.length === 0) return 0;
  const values = matches.map((m) => m.value);
  switch (agg) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'count':
      return matches.length;
    case 'last':
      return values[values.length - 1] ?? 0;
    default: {
      const _exhaustive: never = agg;
      return _exhaustive;
    }
  }
}

function queryMatches(m: MetricRecord, q: DashboardQuery): boolean {
  if (m.name !== q.metricName) return false;
  if (q.sinceMs !== undefined && m.timestamp < q.sinceMs) return false;
  if (q.untilMs !== undefined && m.timestamp > q.untilMs) return false;
  if (q.labels) {
    for (const [k, v] of Object.entries(q.labels)) {
      if (m.tags[k] !== v) return false;
    }
  }
  return true;
}
