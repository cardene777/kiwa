/**
 * `/zero-trust` HTTP handler — device posture evaluate + risk score +
 * JIT (Just-in-Time) access request + micro-segmentation enforce ops the
 * runtime exposes to the zero-trust surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock and
 * real without spinning up an OPA rego bundle.
 *
 * The zero-trust surface pairs the parent v1.39-1 `zero-trust` axis
 * (startZeroTrustSession + evaluatePosture + scoreRisk + requestJit +
 * enforceMicroSegment) with `@kiwa/security` v0.2 — every op has a
 * neutral event counterpart the fidelity harness can compare across
 * mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type ZtOpKind = 'posture' | 'risk' | 'jit' | 'segment';

export interface ZtRequest {
  kind: ZtOpKind;
  sessionId: string;
  // posture
  osUpToDate?: boolean;
  diskEncrypted?: boolean;
  edrRunning?: boolean;
  mdmEnrolled?: boolean;
  // risk
  unusualLocation?: boolean;
  unusualTime?: boolean;
  newDevice?: boolean;
  threatIntelHit?: boolean;
  // jit
  requestedRole?: string;
  justification?: string;
  ttlSeconds?: number;
  // segment
  workload?: string;
  allowedPeers?: string[];
  requestedPeer?: string;
}

export interface ZtResponse {
  ok: boolean;
  kind: ZtOpKind;
  sessionId: string;
  passed?: boolean;
  riskScore?: number;
  granted?: boolean;
  workload?: string;
  requestedPeer?: string;
  allowed?: boolean;
  errorKind?: string;
}

export function validateZtRequest(
  body: unknown,
): { ok: true; value: ZtRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'posture' && kind !== 'risk' && kind !== 'jit' && kind !== 'segment') {
    return { ok: false, errorKind: 'kind_must_be_posture_risk_jit_or_segment' };
  }
  const value: ZtRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'posture') {
    const keys = ['osUpToDate', 'diskEncrypted', 'edrRunning', 'mdmEnrolled'];
    for (const key of keys) {
      if (typeof b[key] !== 'boolean') {
        return { ok: false, errorKind: `${key}_required_boolean` };
      }
    }
    value.osUpToDate = b['osUpToDate'] as boolean;
    value.diskEncrypted = b['diskEncrypted'] as boolean;
    value.edrRunning = b['edrRunning'] as boolean;
    value.mdmEnrolled = b['mdmEnrolled'] as boolean;
    return { ok: true, value };
  }
  if (kind === 'risk') {
    const keys = ['unusualLocation', 'unusualTime', 'newDevice', 'threatIntelHit'];
    for (const key of keys) {
      if (typeof b[key] !== 'boolean') {
        return { ok: false, errorKind: `${key}_required_boolean` };
      }
    }
    value.unusualLocation = b['unusualLocation'] as boolean;
    value.unusualTime = b['unusualTime'] as boolean;
    value.newDevice = b['newDevice'] as boolean;
    value.threatIntelHit = b['threatIntelHit'] as boolean;
    return { ok: true, value };
  }
  if (kind === 'jit') {
    if (typeof b['requestedRole'] !== 'string' || !b['requestedRole']) {
      return { ok: false, errorKind: 'requestedRole_required' };
    }
    if (typeof b['justification'] !== 'string' || !b['justification']) {
      return { ok: false, errorKind: 'justification_required' };
    }
    if (typeof b['ttlSeconds'] !== 'number' || b['ttlSeconds'] <= 0) {
      return { ok: false, errorKind: 'ttlSeconds_must_be_positive' };
    }
    value.requestedRole = b['requestedRole'];
    value.justification = b['justification'];
    value.ttlSeconds = b['ttlSeconds'];
    return { ok: true, value };
  }
  // kind === 'segment'
  if (typeof b['workload'] !== 'string' || !b['workload']) {
    return { ok: false, errorKind: 'workload_required' };
  }
  if (!Array.isArray(b['allowedPeers'])) {
    return { ok: false, errorKind: 'allowedPeers_required' };
  }
  if (typeof b['requestedPeer'] !== 'string' || !b['requestedPeer']) {
    return { ok: false, errorKind: 'requestedPeer_required' };
  }
  value.workload = b['workload'];
  value.allowedPeers = (b['allowedPeers'] as unknown[]).filter(
    (p): p is string => typeof p === 'string',
  );
  value.requestedPeer = b['requestedPeer'];
  return { ok: true, value };
}

export async function handleZtRequest(
  adapter: SecurityAdapter,
  req: ZtRequest,
): Promise<ZtResponse> {
  try {
    if (req.kind === 'posture') {
      const result = await adapter.evaluatePosture({
        sessionId: req.sessionId,
        osUpToDate: req.osUpToDate!,
        diskEncrypted: req.diskEncrypted!,
        edrRunning: req.edrRunning!,
        mdmEnrolled: req.mdmEnrolled!,
      });
      return {
        ok: true,
        kind: 'posture',
        sessionId: result.sessionId,
        passed: result.passed,
      };
    }
    if (req.kind === 'risk') {
      const result = await adapter.scoreRisk({
        sessionId: req.sessionId,
        unusualLocation: req.unusualLocation!,
        unusualTime: req.unusualTime!,
        newDevice: req.newDevice!,
        threatIntelHit: req.threatIntelHit!,
      });
      return {
        ok: true,
        kind: 'risk',
        sessionId: result.sessionId,
        riskScore: result.riskScore,
      };
    }
    if (req.kind === 'jit') {
      const result = await adapter.requestJit({
        sessionId: req.sessionId,
        requestedRole: req.requestedRole!,
        justification: req.justification!,
        ttlSeconds: req.ttlSeconds!,
      });
      return {
        ok: true,
        kind: 'jit',
        sessionId: result.sessionId,
        granted: result.granted,
        riskScore: result.riskScore,
      };
    }
    const result = await adapter.enforceMicroSegment({
      sessionId: req.sessionId,
      workload: req.workload!,
      allowedPeers: req.allowedPeers!,
      requestedPeer: req.requestedPeer!,
    });
    return {
      ok: true,
      kind: 'segment',
      sessionId: result.sessionId,
      workload: result.workload,
      requestedPeer: result.requestedPeer,
      allowed: result.allowed,
    };
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
