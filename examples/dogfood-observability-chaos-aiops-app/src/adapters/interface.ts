/**
 * Provider-neutral chaos + AIOps observability surface for the
 * chaos-aiops dogfood.
 *
 * The app talks to the chaos-engine + AIOps engine + runbook API surface
 * only through this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real LitmusChaos + Gremlin +
 *    PagerDuty AIOps + runbook style stack (KIWA_CHAOS_ENGINE_URL +
 *    KIWA_AIOPS_API_URL + KIWA_RUNBOOK_URL) when `KIWA_MODE=real` +
 *    `CHAOS_AIOPS_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_CHAOS_AIOPS_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/observability` v2.2
 *    chaos + aiops semantics (injectFault / computeBlastRadius /
 *    triggerRollback / detectAnomaly / executeRemediation /
 *    analyzeRootCause / correlateAlerts).
 *
 * Both must satisfy the same 12-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.42-4
 * dogfoods —
 *  - chaos (session start + inject fault + trigger rollback + close)
 *  - remediation (session start + detect anomaly + execute remediation + close)
 *  - rca (session start + analyze root cause + correlate alerts + close)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - chaos-e2e (startChaos + injectFault + triggerRollback + closeChaos)
 *  - remediation-e2e (startRemediation + detectAnomaly + executeRemediation + closeRemediation)
 *  - rca-e2e (startRca + analyzeRootCause + correlateAlerts + closeRca)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

import type { semantics } from '@kiwa/observability';

/** Re-export from observability semantics namespace. */
export type ObservabilityTarget = semantics.ObservabilityTarget;

/** Fault kinds the chaos engine can inject. */
export type FaultKind =
  | 'network-latency'
  | 'network-partition'
  | 'pod-kill'
  | 'cpu-stress'
  | 'disk-fill';

/** A single fault injection request. */
export interface FaultRequest {
  kind: FaultKind;
  target: string;
  durationSec: number;
}

/** Blast radius input — affected vs total instance counts. */
export interface BlastRadiusInput {
  affectedInstances: number;
  totalInstances: number;
}

/** Rollback threshold — error rate + trigger threshold. */
export interface RollbackInput {
  errorRate: number;
  threshold: number;
}

/** A single AIOps anomaly point — metric + value + z-score. */
export interface AnomalyPoint {
  metric: string;
  value: number;
  zScore: number;
}

/** A single AIOps remediation action — runbook + success outcome. */
export interface RemediationAction {
  actionId: string;
  runbookId: string;
  success: boolean;
}

/** A dependency edge in the RCA graph — service -> downstream service. */
export interface DependencyEdge {
  from: string;
  to: string;
}

/** A single AIOps alert — id + service + fire timestamp. */
export interface AlertRecord {
  alertId: string;
  service: string;
  firedAtMs: number;
}

/** Result of injecting a fault into the chaos engine. */
export interface FaultInjectResult {
  sessionId: string;
  experimentId: string;
  faultKind: FaultKind;
  faultTarget: string;
  durationSec: number;
  latencyMs: number;
}

/** Result of triggering an auto-rollback based on error rate. */
export interface RollbackTriggerResult {
  sessionId: string;
  experimentId: string;
  triggered: boolean;
  errorRate: number;
  threshold: number;
  blastRadiusRatio: number;
  affectedInstances: number;
  latencyMs: number;
}

/** Result of detecting anomalies across a set of metric points. */
export interface AnomalyDetectResult {
  sessionId: string;
  clusterId: string;
  pointCount: number;
  anomalyCount: number;
  zScoreThreshold: number;
  hasAnomaly: boolean;
  latencyMs: number;
}

/** Result of executing a set of remediation actions. */
export interface RemediationExecuteResult {
  sessionId: string;
  clusterId: string;
  actionCount: number;
  succeeded: number;
  failed: number;
  allSucceeded: boolean;
  latencyMs: number;
}

/** Result of analyzing the RCA graph for a failing service topology. */
export interface RootCauseAnalyzeResult {
  sessionId: string;
  clusterId: string;
  failedCount: number;
  edgeCount: number;
  rootCause: string;
  latencyMs: number;
}

/** Result of correlating a set of alerts into groups within a window. */
export interface AlertCorrelateResult {
  sessionId: string;
  clusterId: string;
  alertCount: number;
  groupCount: number;
  windowMs: number;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startChaos'
    | 'injectFault'
    | 'triggerRollback'
    | 'closeChaos'
    | 'startRemediation'
    | 'detectAnomaly'
    | 'executeRemediation'
    | 'closeRemediation'
    | 'startRca'
    | 'analyzeRootCause'
    | 'correlateAlerts'
    | 'closeRca';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening a chaos-engineering session. */
export interface ChaosSessionInput {
  sessionId: string;
  experimentId: string;
  target: ObservabilityTarget;
}

/** Input for opening a remediation session. */
export interface RemediationSessionInput {
  sessionId: string;
  clusterId: string;
  target: ObservabilityTarget;
}

/** Input for opening a root-cause-analysis session. */
export interface RcaSessionInput {
  sessionId: string;
  clusterId: string;
  target: ObservabilityTarget;
}

/** The chaos + AIOps Adapter — 12 ops across 3 domain surfaces. */
export interface ChaosAiopsAdapter {
  readonly mode: 'real' | 'mock';

  // chaos surface (chaos-e2e axis: session + inject + rollback + close)
  startChaos(input: ChaosSessionInput): Promise<void>;
  injectFault(input: {
    sessionId: string;
    fault: FaultRequest;
  }): Promise<FaultInjectResult>;
  triggerRollback(input: {
    sessionId: string;
    blastRadius: BlastRadiusInput;
    rollback: RollbackInput;
  }): Promise<RollbackTriggerResult>;
  closeChaos(input: { sessionId: string }): Promise<void>;

  // remediation surface (remediation-e2e axis: session + detect + execute + close)
  startRemediation(input: RemediationSessionInput): Promise<void>;
  detectAnomaly(input: {
    sessionId: string;
    points: AnomalyPoint[];
    zScoreThreshold: number;
  }): Promise<AnomalyDetectResult>;
  executeRemediation(input: {
    sessionId: string;
    actions: RemediationAction[];
  }): Promise<RemediationExecuteResult>;
  closeRemediation(input: { sessionId: string }): Promise<void>;

  // rca surface (rca-e2e axis: session + analyze + correlate + close)
  startRca(input: RcaSessionInput): Promise<void>;
  analyzeRootCause(input: {
    sessionId: string;
    edges: DependencyEdge[];
    failedServices: string[];
  }): Promise<RootCauseAnalyzeResult>;
  correlateAlerts(input: {
    sessionId: string;
    alerts: AlertRecord[];
    windowMs: number;
  }): Promise<AlertCorrelateResult>;
  closeRca(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}

/** Sentinel error thrown by the real adapter when env is missing. */
export const KIWA_CHAOS_AIOPS_ENV_MISSING = 'KIWA_CHAOS_AIOPS_ENV_MISSING';

/**
 * The 12 op names — used both to drive the fidelity harness and to
 * assert both adapters implement the same surface.
 */
export const CHAOS_AIOPS_HARNESS_OPS = [
  'startChaos',
  'injectFault',
  'triggerRollback',
  'closeChaos',
  'startRemediation',
  'detectAnomaly',
  'executeRemediation',
  'closeRemediation',
  'startRca',
  'analyzeRootCause',
  'correlateAlerts',
  'closeRca',
] as const;

export type ChaosAiopsHarnessOp = (typeof CHAOS_AIOPS_HARNESS_OPS)[number];
