/**
 * `/remediation` HTTP handler — anomaly detection + auto-remediation
 * ops the runtime exposes to the remediation surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up a real PagerDuty AIOps +
 * runbook endpoint.
 *
 * The remediation surface pairs the parent v1.42-1 `aiops` observability
 * axis (detectAnomaly + executeRemediation) with the runtime session
 * lifecycle (start / close) — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  AnomalyPoint,
  ChaosAiopsAdapter,
  ObservabilityTarget,
  RemediationAction,
} from '../../adapters/interface.js';

export type RemediationOpKind = 'start' | 'detect' | 'execute' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

export interface RemediationRequest {
  kind: RemediationOpKind;
  sessionId: string;
  // start
  clusterId?: string;
  target?: ObservabilityTarget;
  // detect
  points?: AnomalyPoint[];
  zScoreThreshold?: number;
  // execute
  actions?: RemediationAction[];
}

export interface RemediationResponse {
  ok: boolean;
  kind: RemediationOpKind;
  sessionId: string;
  clusterId?: string;
  target?: ObservabilityTarget;
  pointCount?: number;
  anomalyCount?: number;
  zScoreThreshold?: number;
  hasAnomaly?: boolean;
  actionCount?: number;
  succeeded?: number;
  failed?: number;
  allSucceeded?: boolean;
  errorKind?: string;
}

export function validateRemediationRequest(
  body: unknown,
): { ok: true; value: RemediationRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'start' &&
    kind !== 'detect' &&
    kind !== 'execute' &&
    kind !== 'close'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_start_detect_execute_or_close',
    };
  }
  const value: RemediationRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'start') {
    if (typeof b['clusterId'] !== 'string' || !b['clusterId']) {
      return { ok: false, errorKind: 'clusterId_required' };
    }
    if (!VALID_TARGETS.includes(b['target'] as ObservabilityTarget)) {
      return { ok: false, errorKind: 'target_required_valid' };
    }
    value.clusterId = b['clusterId'];
    value.target = b['target'] as ObservabilityTarget;
    return { ok: true, value };
  }
  if (kind === 'detect') {
    if (!Array.isArray(b['points'])) {
      return { ok: false, errorKind: 'points_required_array' };
    }
    const rawPoints = b['points'] as unknown[];
    if (rawPoints.length === 0) {
      return { ok: false, errorKind: 'points_must_not_be_empty' };
    }
    const points: AnomalyPoint[] = [];
    for (const raw of rawPoints) {
      if (!raw || typeof raw !== 'object') {
        return { ok: false, errorKind: 'point_not_object' };
      }
      const p = raw as Record<string, unknown>;
      if (typeof p['metric'] !== 'string' || !p['metric']) {
        return { ok: false, errorKind: 'point_metric_required' };
      }
      if (typeof p['value'] !== 'number') {
        return { ok: false, errorKind: 'point_value_required_number' };
      }
      if (typeof p['zScore'] !== 'number') {
        return { ok: false, errorKind: 'point_zScore_required_number' };
      }
      points.push({
        metric: p['metric'],
        value: p['value'],
        zScore: p['zScore'],
      });
    }
    if (typeof b['zScoreThreshold'] !== 'number' || b['zScoreThreshold'] <= 0) {
      return {
        ok: false,
        errorKind: 'zScoreThreshold_required_positive',
      };
    }
    value.points = points;
    value.zScoreThreshold = b['zScoreThreshold'];
    return { ok: true, value };
  }
  if (kind === 'execute') {
    if (!Array.isArray(b['actions'])) {
      return { ok: false, errorKind: 'actions_required_array' };
    }
    const rawActions = b['actions'] as unknown[];
    if (rawActions.length === 0) {
      return { ok: false, errorKind: 'actions_must_not_be_empty' };
    }
    const actions: RemediationAction[] = [];
    for (const raw of rawActions) {
      if (!raw || typeof raw !== 'object') {
        return { ok: false, errorKind: 'action_not_object' };
      }
      const a = raw as Record<string, unknown>;
      if (typeof a['actionId'] !== 'string' || !a['actionId']) {
        return { ok: false, errorKind: 'action_actionId_required' };
      }
      if (typeof a['runbookId'] !== 'string' || !a['runbookId']) {
        return { ok: false, errorKind: 'action_runbookId_required' };
      }
      if (typeof a['success'] !== 'boolean') {
        return { ok: false, errorKind: 'action_success_required_boolean' };
      }
      actions.push({
        actionId: a['actionId'],
        runbookId: a['runbookId'],
        success: a['success'],
      });
    }
    value.actions = actions;
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handleRemediationRequest(
  adapter: ChaosAiopsAdapter,
  req: RemediationRequest,
): Promise<RemediationResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startRemediation({
        sessionId: req.sessionId,
        clusterId: req.clusterId!,
        target: req.target!,
      });
      return {
        ok: true,
        kind: 'start',
        sessionId: req.sessionId,
        clusterId: req.clusterId!,
        target: req.target!,
      };
    }
    if (req.kind === 'detect') {
      const result = await adapter.detectAnomaly({
        sessionId: req.sessionId,
        points: req.points!,
        zScoreThreshold: req.zScoreThreshold!,
      });
      return {
        ok: true,
        kind: 'detect',
        sessionId: result.sessionId,
        clusterId: result.clusterId,
        pointCount: result.pointCount,
        anomalyCount: result.anomalyCount,
        zScoreThreshold: result.zScoreThreshold,
        hasAnomaly: result.hasAnomaly,
      };
    }
    if (req.kind === 'execute') {
      const result = await adapter.executeRemediation({
        sessionId: req.sessionId,
        actions: req.actions!,
      });
      return {
        ok: true,
        kind: 'execute',
        sessionId: result.sessionId,
        clusterId: result.clusterId,
        actionCount: result.actionCount,
        succeeded: result.succeeded,
        failed: result.failed,
        allSucceeded: result.allSucceeded,
      };
    }
    await adapter.closeRemediation({ sessionId: req.sessionId });
    return { ok: true, kind: 'close', sessionId: req.sessionId };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
