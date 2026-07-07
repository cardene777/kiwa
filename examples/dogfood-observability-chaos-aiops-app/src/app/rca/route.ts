/**
 * `/rca` HTTP handler — root cause analysis + alert correlation ops the
 * runtime exposes to the rca surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock and
 * real without spinning up a real PagerDuty AIOps endpoint.
 *
 * The rca surface pairs the parent v1.42-1 `aiops` observability axis
 * (analyzeRootCause + correlateAlerts) with the runtime session
 * lifecycle (start / close) — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  AlertRecord,
  ChaosAiopsAdapter,
  DependencyEdge,
  ObservabilityTarget,
} from '../../adapters/interface.js';

export type RcaOpKind = 'start' | 'analyze' | 'correlate' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

export interface RcaRequest {
  kind: RcaOpKind;
  sessionId: string;
  // start
  clusterId?: string;
  target?: ObservabilityTarget;
  // analyze
  edges?: DependencyEdge[];
  failedServices?: string[];
  // correlate
  alerts?: AlertRecord[];
  windowMs?: number;
}

export interface RcaResponse {
  ok: boolean;
  kind: RcaOpKind;
  sessionId: string;
  clusterId?: string;
  target?: ObservabilityTarget;
  failedCount?: number;
  edgeCount?: number;
  rootCause?: string;
  alertCount?: number;
  groupCount?: number;
  windowMs?: number;
  errorKind?: string;
}

export function validateRcaRequest(
  body: unknown,
): { ok: true; value: RcaRequest } | { ok: false; errorKind: string } {
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
    kind !== 'analyze' &&
    kind !== 'correlate' &&
    kind !== 'close'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_start_analyze_correlate_or_close',
    };
  }
  const value: RcaRequest = { kind, sessionId: b['sessionId'] };
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
  if (kind === 'analyze') {
    if (!Array.isArray(b['edges'])) {
      return { ok: false, errorKind: 'edges_required_array' };
    }
    const rawEdges = b['edges'] as unknown[];
    const edges: DependencyEdge[] = [];
    for (const raw of rawEdges) {
      if (!raw || typeof raw !== 'object') {
        return { ok: false, errorKind: 'edge_not_object' };
      }
      const e = raw as Record<string, unknown>;
      if (typeof e['from'] !== 'string' || !e['from']) {
        return { ok: false, errorKind: 'edge_from_required' };
      }
      if (typeof e['to'] !== 'string' || !e['to']) {
        return { ok: false, errorKind: 'edge_to_required' };
      }
      edges.push({ from: e['from'], to: e['to'] });
    }
    if (!Array.isArray(b['failedServices'])) {
      return { ok: false, errorKind: 'failedServices_required_array' };
    }
    const failed = (b['failedServices'] as unknown[]).map((s) => String(s));
    if (failed.length === 0) {
      return { ok: false, errorKind: 'failedServices_must_not_be_empty' };
    }
    value.edges = edges;
    value.failedServices = failed;
    return { ok: true, value };
  }
  if (kind === 'correlate') {
    if (!Array.isArray(b['alerts'])) {
      return { ok: false, errorKind: 'alerts_required_array' };
    }
    const rawAlerts = b['alerts'] as unknown[];
    if (rawAlerts.length === 0) {
      return { ok: false, errorKind: 'alerts_must_not_be_empty' };
    }
    const alerts: AlertRecord[] = [];
    for (const raw of rawAlerts) {
      if (!raw || typeof raw !== 'object') {
        return { ok: false, errorKind: 'alert_not_object' };
      }
      const a = raw as Record<string, unknown>;
      if (typeof a['alertId'] !== 'string' || !a['alertId']) {
        return { ok: false, errorKind: 'alert_alertId_required' };
      }
      if (typeof a['service'] !== 'string' || !a['service']) {
        return { ok: false, errorKind: 'alert_service_required' };
      }
      if (typeof a['firedAtMs'] !== 'number') {
        return { ok: false, errorKind: 'alert_firedAtMs_required_number' };
      }
      alerts.push({
        alertId: a['alertId'],
        service: a['service'],
        firedAtMs: a['firedAtMs'],
      });
    }
    if (typeof b['windowMs'] !== 'number' || b['windowMs'] <= 0) {
      return { ok: false, errorKind: 'windowMs_required_positive' };
    }
    value.alerts = alerts;
    value.windowMs = b['windowMs'];
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handleRcaRequest(
  adapter: ChaosAiopsAdapter,
  req: RcaRequest,
): Promise<RcaResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startRca({
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
    if (req.kind === 'analyze') {
      const result = await adapter.analyzeRootCause({
        sessionId: req.sessionId,
        edges: req.edges!,
        failedServices: req.failedServices!,
      });
      return {
        ok: true,
        kind: 'analyze',
        sessionId: result.sessionId,
        clusterId: result.clusterId,
        failedCount: result.failedCount,
        edgeCount: result.edgeCount,
        rootCause: result.rootCause,
      };
    }
    if (req.kind === 'correlate') {
      const result = await adapter.correlateAlerts({
        sessionId: req.sessionId,
        alerts: req.alerts!,
        windowMs: req.windowMs!,
      });
      return {
        ok: true,
        kind: 'correlate',
        sessionId: result.sessionId,
        clusterId: result.clusterId,
        alertCount: result.alertCount,
        groupCount: result.groupCount,
        windowMs: result.windowMs,
      };
    }
    await adapter.closeRca({ sessionId: req.sessionId });
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
