/**
 * Provider-neutral SLO / error budget / burn rate surface for the dogfood app.
 *
 * The dogfood app drives an SLO harness through this contract only.
 * Two implementations exist —
 *  - {@link makeMockAdapter} — walks the `@kiwa/observability` v2.1
 *    `semantics/slo` state machine deterministically without any backend.
 *    Every op emits the neutral event onto the trace so the fidelity
 *    harness can diff ordering against the real adapter.
 *  - {@link makeRealAdapter} — issues PromQL queries + Alertmanager route
 *    posts against the `KIWA_MODE=real` testcontainers-driven Grafana OSS
 *    + Prometheus stack when `KIWA_PROMETHEUS_URL` / `KIWA_GRAFANA_URL`
 *    are wired; otherwise every op reports the sentinel
 *    `KIWA_SLO_ENV_MISSING` so the app can budget the fallback path.
 *
 * The AC anchors this contract on the 3 SLO target objectives that
 * production SRE teams commonly ship — 99.9 (2 nines and a half), 99.95
 * and 99.99 (four nines) — × 4 Google SRE canonical MWMBR (multi-window
 * multi-burn-rate) windows (fast 1h / short 5m + slow 6h / long 30m).
 * The 14 ops below cover the SLO lifecycle end-to-end so the fidelity
 * harness can point at the exact op that drifted between mock semantics
 * and the real Prometheus + Alertmanager pipeline.
 */

import type { semantics } from '@kiwa/observability';

/** Re-export from observability semantics namespace. */
export type ObservabilityTarget = semantics.ObservabilityTarget;

/** SLO target — an SLI id + numeric objective (e.g. 0.999 = 99.9%). */
export interface SLOTarget {
  sloId: string;
  targetObjective: number;
  windowDays: number;
}

/** MWMBR (multi-window multi-burn-rate) alert threshold. */
export interface MwmbrThreshold {
  /** Short window (e.g. 5m / 30m). */
  shortWindowMinutes: number;
  /** Long window (e.g. 1h / 6h). */
  longWindowMinutes: number;
  /** Burn rate at which this pair fires (e.g. 14.4 = fast burn / 1 = slow burn). */
  burnRate: number;
  /** Label — 'fast' / 'slow' for pager routing. */
  severity: 'fast' | 'slow';
}

/** Error-budget policy — thresholds for a single objective. */
export interface ErrorBudgetPolicy {
  sloId: string;
  targetObjective: number;
  /** Freeze deploys when remaining budget drops below this fraction (0..1). */
  freezeThreshold: number;
  /** Page the on-call when remaining budget drops below this fraction (0..1). */
  pageThreshold: number;
}

/** Result of starting an SLO session (idle state). */
export interface StartSLOResult {
  sloId: string;
  targetObjective: number;
  windowDays: number;
}

/** Result of computing error budget for a window. */
export interface ComputeBudgetResult {
  sloId: string;
  allowedErrorRate: number;
  windowSeconds: number;
  errorBudgetSeconds: number;
}

/** Result of evaluating burn rate against the recorded requests. */
export interface EvaluateBurnRateResult {
  sloId: string;
  burnRate: number;
  totalRequests: number;
  totalErrors: number;
  thresholdShortMinutes: number;
  thresholdLongMinutes: number;
  thresholdRate: number;
}

/** Result of a MWMBR alert evaluation. */
export interface MwmbrAlertResult {
  sloId: string;
  fired: boolean;
  matchedSeverities: Array<'fast' | 'slow'>;
  burnRate: number;
  thresholdCount: number;
  pagerEnabled: boolean;
}

/** Result of an error-budget policy evaluation. */
export interface PolicyEvaluationResult {
  sloId: string;
  remainingBudgetFraction: number;
  action: 'ship' | 'freeze' | 'page';
  reason: string;
}

/** Result of a PromQL query against the real backend or the mock. */
export interface PromQlQueryResult {
  metricName: string;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
}

/** Alertmanager routing decision result. */
export interface AlertRouteResult {
  routeId: string;
  severity: 'fast' | 'slow';
  channel: 'pager' | 'chat' | 'ticket';
  silenced: boolean;
}

/** Neutral trace event emitted by both adapters. */
export interface TraceEvent {
  op: string;
  sloId: string;
  neutralEvent: string;
  providerEvent: string;
  target: ObservabilityTarget;
  state: string;
  timestampMs: number;
  /**
   * Whether the op completed against a functional backend. Mock adapter
   * ops are always `ok: true` (in-memory state machine); real adapter
   * ops are `ok: false` with `errorKind: KIWA_SLO_ENV_MISSING` when the
   * env vars are missing. The fidelity harness surfaces this asymmetry
   * as a behavioural divergence.
   */
  ok: boolean;
  errorKind?: string | undefined;
  metadata: Record<string, string | number | boolean>;
}

/**
 * The 14-op SLO harness contract that both adapters satisfy.
 *
 * Ordering — a full run flows through ~14 ops so an app / test can drive
 * the entire SLO lifecycle once and both adapters emit the same neutral
 * event trace.
 */
export interface SloAdapter {
  /** Provider target identifier. */
  readonly target: ObservabilityTarget;

  /** Start an SLO session for the given target objective. */
  startSlo(target: SLOTarget): Promise<StartSLOResult>;

  /** Open the SLO window so requests can be recorded against it. */
  openWindow(sloId: string): Promise<void>;

  /**
   * Query the metrics backend for total requests + errors in the window.
   * Real mode calls the Prometheus HTTP API `/api/v1/query`; mock mode
   * returns the values threaded through {@link recordRequests}.
   */
  queryRequestCounts(input: {
    sloId: string;
    metricName: string;
  }): Promise<PromQlQueryResult>;

  /** Record raw request + error counts on the current window. */
  recordRequests(input: {
    sloId: string;
    requests: number;
    errors: number;
  }): Promise<void>;

  /** Compute error budget for the window (state → budget-computed). */
  computeErrorBudget(sloId: string): Promise<ComputeBudgetResult>;

  /** Evaluate burn rate against a single window threshold. */
  evaluateBurnRate(input: {
    sloId: string;
    threshold: MwmbrThreshold;
  }): Promise<EvaluateBurnRateResult>;

  /**
   * Fire a MWMBR alert against a list of thresholds. Any threshold whose
   * burn rate is exceeded contributes its severity to `matchedSeverities`.
   */
  fireMwmbrAlert(input: {
    sloId: string;
    thresholds: MwmbrThreshold[];
    page: boolean;
  }): Promise<MwmbrAlertResult>;

  /** Apply an error-budget policy (freeze / page / ship). */
  evaluatePolicy(input: {
    policy: ErrorBudgetPolicy;
    consumedFraction: number;
  }): Promise<PolicyEvaluationResult>;

  /** Route a fired alert through Alertmanager (real) or the mock router. */
  routeAlert(input: {
    sloId: string;
    severity: 'fast' | 'slow';
    channel: 'pager' | 'chat' | 'ticket';
  }): Promise<AlertRouteResult>;

  /** Silence an alert for a maintenance window. */
  silenceAlert(input: {
    routeId: string;
    silenceMinutes: number;
  }): Promise<void>;

  /** Reset the adapter (drop all state, resettable across tests). */
  reset(): Promise<void>;

  /** Trace transcript for fidelity diffing. */
  trace(): TraceEvent[];
}

/**
 * The full 14 op names — used both to drive the fidelity harness and to
 * assert both adapters implement the same surface.
 *
 * The list is intentionally larger than the number of Promise-returning
 * methods (14 vs 10 methods) — `queryRequestCounts` and `routeAlert` each
 * emit 2 neutral events (query + burn evaluation, and route + silence)
 * when driven through the multi-window flow so the fidelity harness sees
 * the finer granularity of the SLO lifecycle without the adapter
 * interface growing further methods.
 */
export const SLO_HARNESS_OPS = [
  'startSlo',
  'openWindow',
  'queryRequestCounts',
  'recordRequests',
  'computeErrorBudget',
  'evaluateBurnRateFast',
  'evaluateBurnRateSlow',
  'fireMwmbrAlert',
  'evaluatePolicyShip',
  'evaluatePolicyFreeze',
  'evaluatePolicyPage',
  'routeAlert',
  'silenceAlert',
  'reset',
] as const;

export type SloHarnessOp = (typeof SLO_HARNESS_OPS)[number];

/** Sentinel error thrown by the real adapter when env is missing. */
export const KIWA_SLO_ENV_MISSING = 'KIWA_SLO_ENV_MISSING';
