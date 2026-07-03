/**
 * Dashboard mock — v2.0 addition (v1.17-1).
 *
 * Grafana-style dashboard mock. A dashboard hosts N panels. Each panel
 * has a metric query executed against the TelemetryCollector metrics
 * sink populated by v1.1 telemetry provider mocks (OpenTelemetry /
 * Datadog / Sentry). Refresh drives re-query; threshold badges attach
 * to numeric panels for alert-badge assertions in kiwa tests.
 *
 * The mock stays SUT-agnostic — kiwa tests can build a dashboard,
 * point it at a collector, then assert "panel X returned 3", "panel Y
 * badge is 'critical'", "refresh count is 2".
 */
import { TelemetryCollector, type MetricRecord } from './telemetry.js';

export type PanelKind = 'stat' | 'timeseries' | 'gauge' | 'table';

export type MetricAggregation = 'sum' | 'avg' | 'max' | 'min' | 'count' | 'last';

export interface MetricQuery {
  metricName: string;
  aggregation: MetricAggregation;
  /**
   * Optional tag filter. All tag key/value pairs must match on a
   * MetricRecord for it to enter the aggregation.
   */
  tagFilter?: Record<string, string>;
  /**
   * Optional time window. `sinceMs` and `untilMs` bound the
   * MetricRecord.timestamp against the collector clock.
   */
  sinceMs?: number;
  untilMs?: number;
}

export interface PanelThreshold {
  /** Comparison operator against the aggregated numeric result. */
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  /** Threshold value; result compared with `operator` decides badge. */
  value: number;
  /** Badge label emitted when the comparison is true. */
  label: 'ok' | 'warn' | 'critical';
}

export interface PanelConfig {
  id: string;
  title: string;
  kind: PanelKind;
  query: MetricQuery;
  thresholds?: PanelThreshold[];
}

export interface PanelResult {
  panelId: string;
  title: string;
  kind: PanelKind;
  value: number;
  matchedRecords: number;
  badge: PanelThreshold['label'] | null;
  refreshedAt: number;
}

export interface DashboardConfig {
  id: string;
  title: string;
  panels: PanelConfig[];
}

/**
 * Grafana-style dashboard mock. A single dashboard binds to a single
 * TelemetryCollector and re-queries metrics on each `refresh()` call.
 */
export class DashboardMock {
  readonly id: string;
  readonly title: string;
  private readonly panels: PanelConfig[];
  private readonly collector: TelemetryCollector;
  private readonly now: () => number;
  private refreshCount = 0;
  private lastResults: PanelResult[] = [];

  constructor(
    config: DashboardConfig,
    collector: TelemetryCollector,
    options?: { now?: () => number },
  ) {
    this.id = config.id;
    this.title = config.title;
    this.panels = [...config.panels];
    this.collector = collector;
    this.now = options?.now ?? Date.now;
  }

  /**
   * Re-execute every panel query against the current collector state.
   * Returns the new panel results and increments refreshCount.
   */
  refresh(): PanelResult[] {
    const at = this.now();
    this.refreshCount += 1;
    this.lastResults = this.panels.map((p) => this.evaluatePanel(p, at));
    return this.lastResults;
  }

  /**
   * Number of times refresh() has been called since construction.
   */
  getRefreshCount(): number {
    return this.refreshCount;
  }

  /**
   * The most recent set of panel results (empty array before first
   * refresh call).
   */
  getLastResults(): PanelResult[] {
    return this.lastResults;
  }

  /**
   * Convenience accessor by panel id from the most recent results.
   */
  panel(panelId: string): PanelResult | undefined {
    return this.lastResults.find((p) => p.panelId === panelId);
  }

  private evaluatePanel(panel: PanelConfig, at: number): PanelResult {
    const matches = this.collector.metrics.filter((m) => this.matchesQuery(m, panel.query));
    const value = aggregate(matches, panel.query.aggregation);
    const badge = pickBadge(value, panel.thresholds);
    return {
      panelId: panel.id,
      title: panel.title,
      kind: panel.kind,
      value,
      matchedRecords: matches.length,
      badge,
      refreshedAt: at,
    };
  }

  private matchesQuery(m: MetricRecord, q: MetricQuery): boolean {
    if (m.name !== q.metricName) return false;
    if (q.sinceMs !== undefined && m.timestamp < q.sinceMs) return false;
    if (q.untilMs !== undefined && m.timestamp > q.untilMs) return false;
    if (q.tagFilter) {
      for (const [k, v] of Object.entries(q.tagFilter)) {
        if (m.tags[k] !== v) return false;
      }
    }
    return true;
  }
}

function aggregate(records: MetricRecord[], agg: MetricAggregation): number {
  if (records.length === 0) return 0;
  const values = records.map((r) => r.value);
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
      return records.length;
    case 'last':
      return values[values.length - 1] ?? 0;
    default: {
      const _exhaustive: never = agg;
      return _exhaustive;
    }
  }
}

function pickBadge(
  value: number,
  thresholds: PanelThreshold[] | undefined,
): PanelThreshold['label'] | null {
  if (!thresholds || thresholds.length === 0) return null;
  // Ordered by severity (critical > warn > ok) so the first matching
  // threshold in the given array wins deterministically.
  for (const t of thresholds) {
    if (compare(value, t.operator, t.value)) return t.label;
  }
  return null;
}

function compare(a: number, op: PanelThreshold['operator'], b: number): boolean {
  switch (op) {
    case 'gt':
      return a > b;
    case 'gte':
      return a >= b;
    case 'lt':
      return a < b;
    case 'lte':
      return a <= b;
    case 'eq':
      return a === b;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

/**
 * Builder helper — construct a DashboardMock from an already-populated
 * collector plus a panel list. Sugar for the common test setup.
 */
export function buildDashboardMock(
  input: {
    id: string;
    title: string;
    panels: PanelConfig[];
    collector: TelemetryCollector;
    now?: () => number;
  },
): DashboardMock {
  return new DashboardMock(
    { id: input.id, title: input.title, panels: input.panels },
    input.collector,
    input.now ? { now: input.now } : undefined,
  );
}
