/**
 * `/chaos` HTTP handler — fault injection + auto-rollback ops the
 * runtime exposes to the chaos surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock and
 * real without spinning up a real LitmusChaos + Gremlin endpoint.
 *
 * The chaos surface pairs the parent v1.42-1 `chaos` observability axis
 * (injectFault + computeBlastRadius + triggerRollback) with the runtime
 * session lifecycle (start / close) — every op has a neutral event
 * counterpart the fidelity harness can compare across mock vs real.
 */

import type {
  BlastRadiusInput,
  ChaosAiopsAdapter,
  FaultKind,
  FaultRequest,
  ObservabilityTarget,
  RollbackInput,
} from '../../adapters/interface.js';

export type ChaosOpKind = 'start' | 'inject' | 'rollback' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

const VALID_FAULT_KINDS: readonly FaultKind[] = [
  'network-latency',
  'network-partition',
  'pod-kill',
  'cpu-stress',
  'disk-fill',
];

export interface ChaosRequest {
  kind: ChaosOpKind;
  sessionId: string;
  // start
  experimentId?: string;
  target?: ObservabilityTarget;
  // inject
  fault?: FaultRequest;
  // rollback
  blastRadius?: BlastRadiusInput;
  rollback?: RollbackInput;
}

export interface ChaosResponse {
  ok: boolean;
  kind: ChaosOpKind;
  sessionId: string;
  experimentId?: string;
  target?: ObservabilityTarget;
  faultKind?: FaultKind;
  faultTarget?: string;
  durationSec?: number;
  triggered?: boolean;
  errorRate?: number;
  threshold?: number;
  blastRadiusRatio?: number;
  affectedInstances?: number;
  errorKind?: string;
}

export function validateChaosRequest(
  body: unknown,
): { ok: true; value: ChaosRequest } | { ok: false; errorKind: string } {
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
    kind !== 'inject' &&
    kind !== 'rollback' &&
    kind !== 'close'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_start_inject_rollback_or_close',
    };
  }
  const value: ChaosRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'start') {
    if (typeof b['experimentId'] !== 'string' || !b['experimentId']) {
      return { ok: false, errorKind: 'experimentId_required' };
    }
    if (!VALID_TARGETS.includes(b['target'] as ObservabilityTarget)) {
      return { ok: false, errorKind: 'target_required_valid' };
    }
    value.experimentId = b['experimentId'];
    value.target = b['target'] as ObservabilityTarget;
    return { ok: true, value };
  }
  if (kind === 'inject') {
    const raw = b['fault'];
    if (!raw || typeof raw !== 'object') {
      return { ok: false, errorKind: 'fault_required_object' };
    }
    const f = raw as Record<string, unknown>;
    if (!VALID_FAULT_KINDS.includes(f['kind'] as FaultKind)) {
      return { ok: false, errorKind: 'fault_kind_required_valid' };
    }
    if (typeof f['target'] !== 'string' || !f['target']) {
      return { ok: false, errorKind: 'fault_target_required' };
    }
    if (typeof f['durationSec'] !== 'number' || f['durationSec'] <= 0) {
      return { ok: false, errorKind: 'fault_durationSec_required_positive' };
    }
    value.fault = {
      kind: f['kind'] as FaultKind,
      target: f['target'],
      durationSec: f['durationSec'],
    };
    return { ok: true, value };
  }
  if (kind === 'rollback') {
    const rawBlast = b['blastRadius'];
    if (!rawBlast || typeof rawBlast !== 'object') {
      return { ok: false, errorKind: 'blastRadius_required_object' };
    }
    const br = rawBlast as Record<string, unknown>;
    if (
      typeof br['affectedInstances'] !== 'number' ||
      br['affectedInstances'] < 0
    ) {
      return {
        ok: false,
        errorKind: 'affectedInstances_required_non_negative',
      };
    }
    if (typeof br['totalInstances'] !== 'number' || br['totalInstances'] <= 0) {
      return { ok: false, errorKind: 'totalInstances_required_positive' };
    }
    const rawRb = b['rollback'];
    if (!rawRb || typeof rawRb !== 'object') {
      return { ok: false, errorKind: 'rollback_required_object' };
    }
    const rb = rawRb as Record<string, unknown>;
    if (
      typeof rb['errorRate'] !== 'number' ||
      rb['errorRate'] < 0 ||
      rb['errorRate'] > 1
    ) {
      return { ok: false, errorKind: 'errorRate_required_within_zero_and_one' };
    }
    if (
      typeof rb['threshold'] !== 'number' ||
      rb['threshold'] < 0 ||
      rb['threshold'] > 1
    ) {
      return { ok: false, errorKind: 'threshold_required_within_zero_and_one' };
    }
    value.blastRadius = {
      affectedInstances: br['affectedInstances'],
      totalInstances: br['totalInstances'],
    };
    value.rollback = {
      errorRate: rb['errorRate'],
      threshold: rb['threshold'],
    };
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handleChaosRequest(
  adapter: ChaosAiopsAdapter,
  req: ChaosRequest,
): Promise<ChaosResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startChaos({
        sessionId: req.sessionId,
        experimentId: req.experimentId!,
        target: req.target!,
      });
      return {
        ok: true,
        kind: 'start',
        sessionId: req.sessionId,
        experimentId: req.experimentId!,
        target: req.target!,
      };
    }
    if (req.kind === 'inject') {
      const result = await adapter.injectFault({
        sessionId: req.sessionId,
        fault: req.fault!,
      });
      return {
        ok: true,
        kind: 'inject',
        sessionId: result.sessionId,
        experimentId: result.experimentId,
        faultKind: result.faultKind,
        faultTarget: result.faultTarget,
        durationSec: result.durationSec,
      };
    }
    if (req.kind === 'rollback') {
      const result = await adapter.triggerRollback({
        sessionId: req.sessionId,
        blastRadius: req.blastRadius!,
        rollback: req.rollback!,
      });
      return {
        ok: true,
        kind: 'rollback',
        sessionId: result.sessionId,
        experimentId: result.experimentId,
        triggered: result.triggered,
        errorRate: result.errorRate,
        threshold: result.threshold,
        blastRadiusRatio: result.blastRadiusRatio,
        affectedInstances: result.affectedInstances,
      };
    }
    await adapter.closeChaos({ sessionId: req.sessionId });
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
