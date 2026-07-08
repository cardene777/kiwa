/**
 * Provider-neutral Grafana-style dashboard surface for the dogfood app.
 *
 * The app talks to its metric source (Prometheus in real mode, the kiwa
 * `@kiwa/observability` {@link DashboardMock} in mock mode) only
 * through this interface. Two implementations exist —
 * {@link makeRealAdapter} (calls the Prometheus HTTP API when
 * `PROMETHEUS_URL` is set, otherwise reports each op as
 * `PROMETHEUS_ENV_MISSING`) and {@link makeMockAdapter} (backed by the
 * `@kiwa/observability` DashboardMock + TelemetryCollector). Both
 * satisfy the same contract so behavioural fidelity between real vs mock
 * can be measured side-by-side and fed to `@kiwa/quality-metrics`
 * release gate.
 *
 * The 4 ops below cover the Grafana dashboard difficulty surface end-to-end.
 *
 * - `runQuery` — execute a single PromQL-style query and return the
 *   aggregated numeric value + matched sample count, so panels can render
 *   without knowing whether the source was Prometheus or the mock.
 * - `refreshDashboard` — re-evaluate every panel on the configured
 *   dashboard once, producing a {@link PanelRenderResult} array that
 *   captures both the numeric value and the derived alert badge / chart
 *   shape metadata a Grafana-style UI would need.
 * - `getRefreshCount` — return the number of dashboard refresh cycles
 *   observed since construction, so tests can assert refresh cadence
 *   without wall-clock coupling.
 * - `getPanel` — look up the most-recent panel result by id, so tests can
 *   assert on individual panel state (value, badge, chart_type) without
 *   scanning the full refresh array.
 */

/**
 * The 5 dashboard-level panel chart types this dogfood exercises. Under
 * the hood two of them (`line` / `bar`) map to the observability package's
 * `timeseries` PanelKind — the app-level distinction is preserved as
 * metadata on the render result so Grafana-style chart selection is
 * observable end-to-end (v1.17-2 AC — 5 panel type 描画動作).
 */
export type ChartType = 'line' | 'bar' | 'gauge' | 'stat' | 'table';

/** PromQL-style query — a metric name + aggregation + optional filters. */
export interface DashboardQuery {
  /** Prometheus metric name (mock: TelemetryCollector metric name). */
  metricName: string;
  /** Aggregation applied to the matched sample set. */
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count' | 'last';
  /** Optional label / tag filter. */
  labels?: Record<string, string>;
  /** Optional time window (unix ms). */
  sinceMs?: number;
  untilMs?: number;
}

/** Aggregated numeric result of a single query, provider-neutral. */
export interface QueryResult {
  metricName: string;
  value: number;
  matchedSamples: number;
  latencyMs: number;
}

/**
 * Threshold band definition that decides which alert badge attaches to
 * the panel when it renders. Mirrors the observability package
 * {@link PanelThreshold} shape but reflects a Grafana-style alert badge
 * (`ok` / `warn` / `critical`).
 */
export interface PanelThresholdDef {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
  label: 'ok' | 'warn' | 'critical';
}

/**
 * App-level panel configuration. The app owns 5 panels (1 per chart type)
 * so the fidelity harness can assert every chart_type is observed on
 * both mock and real paths.
 */
export interface PanelDef {
  id: string;
  title: string;
  chartType: ChartType;
  query: DashboardQuery;
  thresholds?: PanelThresholdDef[];
}

/**
 * Rendered panel — everything a Grafana-style Next.js App Router page
 * would need to render one panel. Value + matched samples + badge + the
 * app-level chartType (preserved so line / bar / gauge / stat / table are
 * all distinguishable in the report).
 */
export interface PanelRenderResult {
  panelId: string;
  title: string;
  chartType: ChartType;
  value: number;
  matchedSamples: number;
  badge: 'ok' | 'warn' | 'critical' | null;
  refreshedAt: number;
}

/**
 * A single behavioural trace event emitted by the adapter — the fidelity
 * harness diffs the mock vs real trace arrays op-by-op.
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?:
    | 'PROMETHEUS_ENV_MISSING'
    | 'PROMETHEUS_HTTP_ERROR'
    | 'PROMETHEUS_FETCH_MISSING'
    | 'BEHAVIORAL_DIVERGENCE';
  detail?: string;
}

/**
 * Metrics captured by the adapter itself so the fidelity harness can feed
 * refresh cadence + query latency into `@kiwa/quality-metrics`.
 */
export interface DashboardMetrics {
  queryCount: number;
  refreshCount: number;
  queryLatencySamplesMs: number[];
  refreshLatencySamplesMs: number[];
  requests: number;
}

/** Configuration passed at adapter construction — the app owns 5 panels. */
export interface DashboardAdapterConfig {
  dashboardId: string;
  title: string;
  panels: PanelDef[];
  /** Optional deterministic clock (mock mode only). */
  now?: () => number;
}

/** Provider-neutral dashboard surface. */
export interface DashboardAdapter {
  readonly mode: 'mock' | 'real';
  traces(): TraceEvent[];
  runQuery(query: DashboardQuery): Promise<QueryResult>;
  refreshDashboard(): Promise<PanelRenderResult[]>;
  getRefreshCount(): number;
  getPanel(panelId: string): PanelRenderResult | undefined;
  metrics(): DashboardMetrics;
  /** Reset internal trace + metric state (mock mode: also resets collector clock). */
  reset(): Promise<void>;
}
