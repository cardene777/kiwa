/**
 * Provider-neutral Prometheus AlertManager style alert orchestrator surface.
 *
 * The app talks to its alert source (real Prometheus AlertManager in real
 * mode, the kiwa `@kiwa/observability` {@link AlertRouter} in mock
 * mode) only through this interface. Two implementations exist —
 * {@link makeRealAdapter} (posts fires to the AlertManager HTTP API when
 * `ALERTMANAGER_URL` is set, otherwise reports each op as
 * `ALERTMANAGER_ENV_MISSING`) and {@link makeMockAdapter} (backed by the
 * `@kiwa/observability` `AlertRouter` + `TelemetryCollector`). Both
 * satisfy the same contract so behavioural fidelity between real vs mock
 * can be measured side-by-side and fed to `@kiwa/quality-metrics`
 * release gate.
 *
 * The 5 ops below cover the AlertManager alert lifecycle end-to-end.
 *
 * - `emitMetric` — push a metric sample the rule engine will evaluate.
 *   Mock: appends to the collector; real: no-op (Prometheus scrapes on
 *   its own cadence — the real path skips this op).
 * - `evaluateRules` — evaluate every registered rule against the metric
 *   window and return the fires that were newly transitioned into
 *   `firing` state.
 * - `routeAlert` — route a fire through the routing tree, respecting
 *   silences that match its labels; returns the receiver name +
 *   silenced flag.
 * - `advanceEscalation` — walk the escalation ladder (L1 30s → L2 5min
 *   → L3 30min) and return receiver notifications whose after-window
 *   has elapsed since the fire.
 * - `getActive` — return the currently firing alerts, so tests can
 *   assert state without relying on wall-clock coupling.
 *
 * The `emitMetric` op is scoped to the mock path — the real
 * AlertManager receives fires the caller already staged (Prometheus
 * server sends them), so the harness records `ALERTMANAGER_METRIC_NOOP`
 * for it. Fidelity ops under measurement are the 4 lifecycle ops
 * (`evaluateRules` / `routeAlert` / `advanceEscalation` / `getActive`).
 */

/** Severity levels the routing tree branches on. */
export type AlertSeverity = 'info' | 'warn' | 'critical';

/** Comparison operators the rule engine supports. */
export type RuleOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

/** Rule kind — threshold (single sample) / rate (per-second) / anomaly (stddev). */
export type RuleKind = 'threshold' | 'rate' | 'anomaly';

/**
 * Provider-neutral alert rule definition. Rate + anomaly kinds are
 * compiled down to threshold checks in the mock adapter — rate divides
 * cumulative counters by elapsed window; anomaly compares latest sample
 * to the trailing mean + stddev.
 */
export interface AlertRuleDef {
  id: string;
  kind: RuleKind;
  metricName: string;
  operator: RuleOperator;
  threshold: number;
  /**
   * How many samples must satisfy the operator before the rule
   * transitions pending → firing. Default: 1. Rate kind uses a
   * rolling window instead of a sample count.
   */
  forSamples?: number;
  /**
   * Rolling window (unix ms) for the rate kind — the rate is computed
   * over `(latest.value - windowStart.value) / (windowMs / 1000)`.
   * Ignored for threshold / anomaly kinds.
   */
  windowMs?: number;
  /**
   * Standard-deviation multiplier the anomaly kind uses — a sample
   * that exceeds `mean + stddevMult × stddev` triggers the alert.
   * Defaults to 3 (three-sigma).
   */
  stddevMult?: number;
  labels: Record<string, string>;
  severity: AlertSeverity;
}

/**
 * Firing alert produced by the rule engine — provider-neutral.
 */
export interface AlertFireEvent {
  ruleId: string;
  severity: AlertSeverity;
  labels: Record<string, string>;
  value: number;
  firedAt: number;
  state: 'firing' | 'escalated' | 'resolved';
}

/**
 * Routing decision — the receiver a fire was directed to, plus a flag
 * indicating whether a silence suppressed the delivery.
 */
export interface RouteDecision {
  ruleId: string;
  receiver: string | null;
  silenced: boolean;
  silenceId?: string;
  matchedAt: number;
}

/**
 * Escalation delivery — a receiver notification triggered by an
 * elapsed escalation step.
 */
export interface EscalationDelivery {
  ruleId: string;
  receiver: string;
  step: 'L1' | 'L2' | 'L3';
  afterMs: number;
  deliveredAt: number;
}

/** Metric sample the mock adapter appends before rule evaluation. */
export interface MetricSample {
  metricName: string;
  kind: 'counter' | 'gauge' | 'histogram';
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

/**
 * Single behavioural trace event emitted by the adapter — the fidelity
 * harness diffs the mock vs real trace arrays op-by-op.
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?:
    | 'ALERTMANAGER_ENV_MISSING'
    | 'ALERTMANAGER_HTTP_ERROR'
    | 'ALERTMANAGER_FETCH_MISSING'
    | 'ALERTMANAGER_METRIC_NOOP'
    | 'BEHAVIORAL_DIVERGENCE';
  detail?: string;
}

/**
 * Adapter-level metrics — the fidelity harness feeds evaluation +
 * routing latency into `@kiwa/quality-metrics`.
 */
export interface AlertOrchestratorMetrics {
  evaluationCount: number;
  routeCount: number;
  escalationCount: number;
  evaluationLatencySamplesMs: number[];
  routingLatencySamplesMs: number[];
  requests: number;
}

/**
 * Silence definition — matches fire labels by literal or regex pattern.
 * The provider-neutral rule tree lets AlertManager-style silences fold
 * into a mock without pulling a full regex engine into the collector.
 */
export interface SilenceDef {
  id: string;
  match: Record<string, string>;
  /** Optional regex match — value is a regex string tested against label value. */
  matchRe?: Record<string, string>;
  expiresAt: number;
}

/** Routing tree node — a match rule + receiver + optional nested routes. */
export interface RouteNode {
  match: Record<string, string>;
  receiver: string;
  routes?: RouteNode[];
}

/** Escalation ladder — one entry per step (L1 / L2 / L3). */
export interface EscalationLadderStep {
  step: 'L1' | 'L2' | 'L3';
  afterMs: number;
  receiver: string;
}

/** Adapter construction config. */
export interface AlertOrchestratorConfig {
  orchestratorId: string;
  rules: AlertRuleDef[];
  route: RouteNode;
  silences: SilenceDef[];
  escalation: EscalationLadderStep[];
  /** Optional deterministic clock (mock mode only). */
  now?: () => number;
}

/** Provider-neutral alert orchestrator surface. */
export interface AlertOrchestratorAdapter {
  readonly mode: 'mock' | 'real';
  traces(): TraceEvent[];
  emitMetric(sample: MetricSample): Promise<void>;
  evaluateRules(): Promise<AlertFireEvent[]>;
  routeAlert(fire: AlertFireEvent): Promise<RouteDecision>;
  advanceEscalation(): Promise<EscalationDelivery[]>;
  getActive(): AlertFireEvent[];
  metrics(): AlertOrchestratorMetrics;
  /** Reset internal trace + metric state (mock mode: also resets router). */
  reset(): Promise<void>;
}
