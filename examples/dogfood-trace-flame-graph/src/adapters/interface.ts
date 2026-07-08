/**
 * Provider-neutral trace flame graph explorer surface.
 *
 * The app talks to its trace source (real Jaeger HTTP API in real mode,
 * the kiwa `@kiwa/observability` `buildSpanTree` +
 * `renderFlameGraph` + `LogCorrelationIndex` in mock mode) only through
 * this interface. Two implementations exist — {@link makeRealAdapter}
 * (fetches traces from a Jaeger `/api/traces` endpoint when
 * `JAEGER_URL` is set, otherwise reports each op as
 * `JAEGER_ENV_MISSING`) and {@link makeMockAdapter} (backed by the
 * `@kiwa/observability` span tree + flame graph + log correlation
 * helpers). Both satisfy the same contract so behavioural fidelity
 * between real vs mock can be measured side-by-side and fed to
 * `@kiwa/quality-metrics` release gate.
 *
 * The 5 ops below cover the trace exploration lifecycle end-to-end.
 *
 * - `loadTrace` — pull the raw span array + log array for a traceId.
 *   Mock: reads from the seeded fixture set + collector; real: GETs
 *   `/api/traces/{id}` from Jaeger and normalizes the response.
 * - `renderFlame` — build the span tree + collapse siblings into a
 *   flame graph structure keyed by (depth, name).
 * - `drillDown` — return the subtree rooted at the first flame node
 *   whose name matches; depth normalised so the drilled-in root sits
 *   at depth 0.
 * - `joinLogs` — build a bidirectional index from spans to logs
 *   (log → span via spanId + trace → logs via traceId).
 * - `filterByName` — flatten the flame tree and return only nodes
 *   whose name equals the query. Used by the LogPanel + Drilldown UI
 *   so tests can assert per-name aggregate stats without walking the
 *   tree by hand.
 *
 * `loadTrace` is the only op that touches the network in real mode.
 * The remaining 4 ops execute the same pure logic on both paths so
 * the fidelity harness observes divergences only when the trace shape
 * itself differs (real mode's Jaeger might merge / re-order children
 * differently than the seeded mock fixture).
 */

/** Log level supported by the trace log panel. Matches the underlying LogRecord enum. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Raw span shape after the adapter normalises the provider payload.
 * The mock adapter stores this shape 1:1 in the fixture set; the real
 * adapter converts a Jaeger span to it.
 */
export interface AdapterSpan {
  spanId: string;
  parentSpanId: string | null;
  name: string;
  traceId: string;
  startedAt: number;
  endedAt: number | null;
  attributes: Record<string, unknown>;
}

/** Raw log shape after normalisation. */
export interface AdapterLog {
  level: LogLevel;
  message: string;
  timestamp: number;
  traceId: string | null;
  spanId: string | null;
  attributes: Record<string, unknown>;
}

/** Single node in the built span tree. Matches the observability SpanNode shape. */
export interface SpanTreeNode {
  name: string;
  depth: number;
  totalMs: number | null;
  selfMs: number | null;
  spanId: string;
  attributes: Record<string, unknown>;
  children: SpanTreeNode[];
}

/**
 * Single node in the collapsed flame graph. Matches the observability
 * FlameNode shape 1:1 (name + depth + totalMs + selfMs + samples + children).
 */
export interface FlameGraphNode {
  name: string;
  depth: number;
  totalMs: number;
  selfMs: number;
  samples: number;
  children: FlameGraphNode[];
}

/** Log ↔ span join result the LogPanel + Drilldown UI consume. */
export interface LogJoinEntry {
  log: AdapterLog;
  spanName: string | null;
  spanId: string | null;
  traceId: string | null;
}

/** Aggregate stats for a flame node identified by name — feeds the Drilldown UI. */
export interface FlameNameStats {
  name: string;
  samples: number;
  totalMs: number;
  selfMs: number;
  averageMs: number;
}

/** Result of `loadTrace` — the mock + real path return this shape. */
export interface LoadedTrace {
  traceId: string;
  spans: AdapterSpan[];
  logs: AdapterLog[];
}

/**
 * Single behavioural trace event emitted by the adapter — the fidelity
 * harness diffs the mock vs real trace arrays op-by-op.
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?:
    | 'JAEGER_ENV_MISSING'
    | 'JAEGER_HTTP_ERROR'
    | 'JAEGER_FETCH_MISSING'
    | 'JAEGER_TRACE_NOT_FOUND'
    | 'BEHAVIORAL_DIVERGENCE';
  detail?: string;
}

/** Adapter-level metrics — the fidelity harness feeds load + render latency into `@kiwa/quality-metrics`. */
export interface FlameExplorerMetrics {
  loadCount: number;
  renderCount: number;
  drillDownCount: number;
  loadLatencySamplesMs: number[];
  renderLatencySamplesMs: number[];
  requests: number;
}

/** Adapter construction config. */
export interface FlameExplorerConfig {
  explorerId: string;
  /**
   * Seeded traces the mock adapter serves. The real adapter ignores
   * this field and fetches from Jaeger — the field stays typed on both
   * paths so app code can build one config object.
   */
  traces: LoadedTrace[];
  /**
   * Correlation key overrides — Jaeger uses `trace.id` / `span.id`,
   * OpenTelemetry canonical is `trace_id` / `span_id`, Datadog is
   * `dd.trace_id`. Callers can pass their own convention.
   */
  correlationKeys?: {
    traceIdKey?: string;
    spanIdKey?: string;
    altTraceIdKeys?: string[];
  };
  /** Optional deterministic clock (mock mode only). */
  now?: () => number;
}

/** Provider-neutral trace flame graph explorer surface. */
export interface FlameExplorerAdapter {
  readonly mode: 'mock' | 'real';
  traces(): TraceEvent[];
  loadTrace(traceId: string): Promise<LoadedTrace>;
  renderFlame(traceId: string): Promise<FlameGraphNode[]>;
  drillDown(traceId: string, name: string): Promise<FlameGraphNode | null>;
  joinLogs(traceId: string): Promise<LogJoinEntry[]>;
  filterByName(traceId: string, name: string): Promise<FlameNameStats | null>;
  metrics(): FlameExplorerMetrics;
  /** Reset internal trace + metric state. */
  reset(): Promise<void>;
}
