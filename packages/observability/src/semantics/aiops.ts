import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * AIOps axis — anomaly detection + auto-remediation + RCA + alert correlation
 * state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: detect-anomaly → execute-remediation → analyze-root-cause →
 * correlate-alerts。 anomaly は z-score threshold、 remediation は runbook 実行成否、
 * RCA は依存 graph 上流 root 特定、 correlation は同時発火 alert group 化。
 */

export type AiopsState =
  | 'idle'
  | 'anomaly-detected'
  | 'remediation-executed'
  | 'root-cause-analyzed'
  | 'alerts-correlated';

export interface AiopsAnomalyPoint {
  metric: string;
  value: number;
  zScore: number;
}

export interface AiopsRemediationAction {
  actionId: string;
  runbookId: string;
  success: boolean;
}

export interface AiopsDependencyEdge {
  from: string;
  to: string;
}

export interface AiopsAlert {
  alertId: string;
  service: string;
  firedAtMs: number;
}

export interface AiopsSession {
  target: ObservabilityTarget;
  clusterId: string;
  state: AiopsState;
  history: AxisStep<AiopsState>[];
  anomalies: AiopsAnomalyPoint[];
  remediations: AiopsRemediationAction[];
  rootCauseService: string | null;
  correlationGroups: string[][];
}

export function startAiopsSession(input: {
  target: ObservabilityTarget;
  clusterId: string;
}): AiopsSession {
  if (input.clusterId.length === 0) {
    throw new Error('startAiopsSession: clusterId must not be empty');
  }
  return {
    target: input.target,
    clusterId: input.clusterId,
    state: 'idle',
    history: [],
    anomalies: [],
    remediations: [],
    rootCauseService: null,
    correlationGroups: [],
  };
}

export function detectAnomaly(
  session: AiopsSession,
  input: { points: AiopsAnomalyPoint[]; zScoreThreshold: number },
): AxisStep<AiopsState> {
  if (session.state !== 'idle') {
    throw new Error(`detectAnomaly: session is ${session.state}, not idle`);
  }
  if (input.points.length === 0) {
    throw new Error('detectAnomaly: points must not be empty');
  }
  if (input.zScoreThreshold <= 0) {
    throw new Error('detectAnomaly: zScoreThreshold must be positive');
  }
  const anomalies = input.points.filter((p) => Math.abs(p.zScore) >= input.zScoreThreshold);
  session.anomalies = anomalies;
  session.state = 'anomaly-detected';
  return emit(session, 'aiops.anomaly_detected', {
    pointCount: input.points.length,
    anomalyCount: anomalies.length,
    zScoreThreshold: input.zScoreThreshold,
    hasAnomaly: anomalies.length > 0,
  });
}

export function executeRemediation(
  session: AiopsSession,
  input: { actions: AiopsRemediationAction[] },
): AxisStep<AiopsState> {
  if (session.state !== 'anomaly-detected') {
    throw new Error(`executeRemediation: session is ${session.state}, not anomaly-detected`);
  }
  if (input.actions.length === 0) {
    throw new Error('executeRemediation: actions must not be empty');
  }
  session.remediations = [...input.actions];
  const succeeded = input.actions.filter((a) => a.success).length;
  const failed = input.actions.length - succeeded;
  session.state = 'remediation-executed';
  return emit(session, 'aiops.remediation_executed', {
    actionCount: input.actions.length,
    succeeded,
    failed,
    allSucceeded: failed === 0,
  });
}

export function analyzeRootCause(
  session: AiopsSession,
  input: { edges: AiopsDependencyEdge[]; failedServices: string[] },
): AxisStep<AiopsState> {
  if (session.state !== 'remediation-executed') {
    throw new Error(`analyzeRootCause: session is ${session.state}, not remediation-executed`);
  }
  if (input.failedServices.length === 0) {
    throw new Error('analyzeRootCause: failedServices must not be empty');
  }
  const failedSet = new Set(input.failedServices);
  const outgoing = new Map<string, string[]>();
  for (const e of input.edges) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from)?.push(e.to);
  }
  let root: string | null = null;
  for (const svc of input.failedServices) {
    const downstream = outgoing.get(svc) ?? [];
    const allDownstreamFailed = downstream.every((d) => failedSet.has(d));
    if (allDownstreamFailed) {
      root = svc;
      break;
    }
  }
  session.rootCauseService = root ?? input.failedServices[0] ?? null;
  session.state = 'root-cause-analyzed';
  return emit(session, 'aiops.root_cause_analyzed', {
    failedCount: input.failedServices.length,
    edgeCount: input.edges.length,
    rootCause: session.rootCauseService ?? 'unknown',
  });
}

export function correlateAlerts(
  session: AiopsSession,
  input: { alerts: AiopsAlert[]; windowMs: number },
): AxisStep<AiopsState> {
  if (session.state !== 'root-cause-analyzed') {
    throw new Error(`correlateAlerts: session is ${session.state}, not root-cause-analyzed`);
  }
  if (input.alerts.length === 0) {
    throw new Error('correlateAlerts: alerts must not be empty');
  }
  if (input.windowMs <= 0) {
    throw new Error('correlateAlerts: windowMs must be positive');
  }
  const sorted = [...input.alerts].sort((a, b) => a.firedAtMs - b.firedAtMs);
  const groups: string[][] = [];
  let current: AiopsAlert[] = [];
  for (const a of sorted) {
    const head = current[0];
    if (!head || a.firedAtMs - head.firedAtMs <= input.windowMs) {
      current.push(a);
    } else {
      groups.push(current.map((x) => x.alertId));
      current = [a];
    }
  }
  if (current.length > 0) groups.push(current.map((x) => x.alertId));
  session.correlationGroups = groups;
  session.state = 'alerts-correlated';
  return emit(session, 'aiops.alerts_correlated', {
    alertCount: input.alerts.length,
    groupCount: groups.length,
    windowMs: input.windowMs,
  });
}

function emit(
  session: AiopsSession,
  neutralEvent: AxisStep<AiopsState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<AiopsState> {
  const step: AxisStep<AiopsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, clusterId: session.clusterId, ...metadata },
  };
  session.history.push(step);
  return step;
}
