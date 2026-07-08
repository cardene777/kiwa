/**
 * `/siem` HTTP handler — structured CIM event + tamper-evident seal +
 * retention policy + correlation rule ops the runtime exposes to the
 * SIEM surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up
 * a Splunk HEC endpoint.
 *
 * The SIEM surface pairs the parent v1.39-1 `siem-audit` axis
 * (startSiemAuditSession + structureEvent + sealEvents + applyRetention
 * + correlate) with `@kiwa/security` v0.2 — every op has a
 * neutral event counterpart the fidelity harness can compare across
 * mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type SiemOpKind = 'structure' | 'seal' | 'retention' | 'correlate';

export interface SiemRequest {
  kind: SiemOpKind;
  sessionId: string;
  // structure
  actor?: string;
  action?: string;
  target?: string;
  timestamp?: number;
  result?: 'success' | 'failure';
  // seal
  previousHash?: string;
  // retention
  hotDays?: number;
  warmDays?: number;
  coldDays?: number;
  legalHold?: boolean;
  // correlate
  ruleId?: string;
  requiredEventIds?: string[];
  windowMs?: number;
}

export interface SiemResponse {
  ok: boolean;
  kind: SiemOpKind;
  sessionId: string;
  eventId?: string;
  cimSchemaVersion?: string;
  sealHash?: string;
  eventCount?: number;
  totalDays?: number;
  ruleId?: string;
  matched?: boolean;
  errorKind?: string;
}

export function validateSiemRequest(
  body: unknown,
): { ok: true; value: SiemRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'structure' &&
    kind !== 'seal' &&
    kind !== 'retention' &&
    kind !== 'correlate'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_structure_seal_retention_or_correlate',
    };
  }
  const value: SiemRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'structure') {
    if (typeof b['actor'] !== 'string' || !b['actor']) {
      return { ok: false, errorKind: 'actor_required' };
    }
    if (typeof b['action'] !== 'string' || !b['action']) {
      return { ok: false, errorKind: 'action_required' };
    }
    if (typeof b['target'] !== 'string' || !b['target']) {
      return { ok: false, errorKind: 'target_required' };
    }
    if (typeof b['timestamp'] !== 'number') {
      return { ok: false, errorKind: 'timestamp_required_number' };
    }
    if (b['result'] !== 'success' && b['result'] !== 'failure') {
      return { ok: false, errorKind: 'result_must_be_success_or_failure' };
    }
    value.actor = b['actor'];
    value.action = b['action'];
    value.target = b['target'];
    value.timestamp = b['timestamp'];
    value.result = b['result'];
    return { ok: true, value };
  }
  if (kind === 'seal') {
    if (typeof b['previousHash'] !== 'string') {
      return { ok: false, errorKind: 'previousHash_required_string' };
    }
    value.previousHash = b['previousHash'];
    return { ok: true, value };
  }
  if (kind === 'retention') {
    for (const key of ['hotDays', 'warmDays', 'coldDays']) {
      if (typeof b[key] !== 'number' || (b[key] as number) < 0) {
        return { ok: false, errorKind: `${key}_required_non_negative_number` };
      }
    }
    if (typeof b['legalHold'] !== 'boolean') {
      return { ok: false, errorKind: 'legalHold_required_boolean' };
    }
    value.hotDays = b['hotDays'] as number;
    value.warmDays = b['warmDays'] as number;
    value.coldDays = b['coldDays'] as number;
    value.legalHold = b['legalHold'];
    return { ok: true, value };
  }
  // kind === 'correlate'
  if (typeof b['ruleId'] !== 'string' || !b['ruleId']) {
    return { ok: false, errorKind: 'ruleId_required' };
  }
  if (!Array.isArray(b['requiredEventIds'])) {
    return { ok: false, errorKind: 'requiredEventIds_required' };
  }
  if (typeof b['windowMs'] !== 'number' || (b['windowMs'] as number) <= 0) {
    return { ok: false, errorKind: 'windowMs_must_be_positive' };
  }
  value.ruleId = b['ruleId'];
  value.requiredEventIds = (b['requiredEventIds'] as unknown[]).filter(
    (p): p is string => typeof p === 'string',
  );
  value.windowMs = b['windowMs'];
  return { ok: true, value };
}

export async function handleSiemRequest(
  adapter: SecurityAdapter,
  req: SiemRequest,
): Promise<SiemResponse> {
  try {
    if (req.kind === 'structure') {
      const result = await adapter.structureEvent({
        sessionId: req.sessionId,
        actor: req.actor!,
        action: req.action!,
        target: req.target!,
        timestamp: req.timestamp!,
        result: req.result!,
      });
      return {
        ok: true,
        kind: 'structure',
        sessionId: result.sessionId,
        eventId: result.eventId,
        cimSchemaVersion: result.cimSchemaVersion,
      };
    }
    if (req.kind === 'seal') {
      const result = await adapter.sealEvents({
        sessionId: req.sessionId,
        previousHash: req.previousHash!,
      });
      return {
        ok: true,
        kind: 'seal',
        sessionId: result.sessionId,
        sealHash: result.sealHash,
        eventCount: result.eventCount,
      };
    }
    if (req.kind === 'retention') {
      const result = await adapter.applyRetention({
        sessionId: req.sessionId,
        hotDays: req.hotDays!,
        warmDays: req.warmDays!,
        coldDays: req.coldDays!,
        legalHold: req.legalHold!,
      });
      return {
        ok: true,
        kind: 'retention',
        sessionId: result.sessionId,
        totalDays: result.totalDays,
      };
    }
    const result = await adapter.correlate({
      sessionId: req.sessionId,
      ruleId: req.ruleId!,
      requiredEventIds: req.requiredEventIds!,
      windowMs: req.windowMs!,
    });
    return {
      ok: true,
      kind: 'correlate',
      sessionId: result.sessionId,
      ruleId: result.ruleId,
      matched: result.matched,
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
