import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * SIEM / audit log axis — structured logging + tamper-evident sealing +
 * retention policy + correlation rule state machine。
 *
 * Deterministic mock で 4 signal 系統を提供。 real driver 経路では Splunk /
 * Elastic SIEM に HEC endpoint 経由で event を送信する。
 */

export type SiemAuditState =
  | 'idle'
  | 'structured'
  | 'sealed'
  | 'retention-tagged'
  | 'correlated';

export interface SiemEvent {
  actor: string;
  action: string;
  target: string;
  timestamp: number;
  result: 'success' | 'failure';
}

export interface StructuredEvent extends SiemEvent {
  eventId: string;
  cimSchemaVersion: string;
}

export interface SiemAuditSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: SiemAuditState;
  history: AxisAdvStep<SiemAuditState>[];
  structuredEvents: StructuredEvent[];
  sealHashChain: string[];
}

export interface RetentionPolicy {
  hotDays: number;
  warmDays: number;
  coldDays: number;
  legalHold: boolean;
}

export interface CorrelationRule {
  ruleId: string;
  requiredEventIds: string[];
  windowMs: number;
}

export function startSiemAuditSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): SiemAuditSession {
  if (input.sessionId.length === 0) {
    throw new Error('startSiemAuditSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    structuredEvents: [],
    sealHashChain: [],
  };
}

export function structureEvent(
  session: SiemAuditSession,
  raw: SiemEvent,
): { step: AxisAdvStep<SiemAuditState>; event: StructuredEvent } {
  if (session.state !== 'idle' && session.state !== 'structured') {
    throw new Error(`structureEvent: session is ${session.state}, cannot structure`);
  }
  if (raw.actor.length === 0 || raw.action.length === 0 || raw.target.length === 0) {
    throw new Error('structureEvent: actor / action / target must not be empty');
  }
  const event: StructuredEvent = {
    ...raw,
    eventId: `evt-${session.structuredEvents.length + 1}`,
    cimSchemaVersion: '1.0',
  };
  session.structuredEvents.push(event);
  session.state = 'structured';
  const step = emit(session, 'siem.event_structured', {
    eventId: event.eventId,
    actor: event.actor,
    action: event.action,
    result: event.result,
  });
  return { step, event };
}

export function sealEvents(
  session: SiemAuditSession,
  input: { previousHash: string },
): AxisAdvStep<SiemAuditState> {
  if (session.state !== 'structured') {
    throw new Error('sealEvents: no structured events to seal');
  }
  if (session.structuredEvents.length === 0) {
    throw new Error('sealEvents: 0 structured events, cannot seal empty batch');
  }
  const hashInput = input.previousHash + JSON.stringify(session.structuredEvents);
  const hash = simpleHash(hashInput);
  session.sealHashChain.push(hash);
  session.state = 'sealed';
  return emit(session, 'siem.tamper_evident_sealed', {
    previousHash: input.previousHash,
    sealHash: hash,
    eventCount: session.structuredEvents.length,
  });
}

export function applyRetention(
  session: SiemAuditSession,
  policy: RetentionPolicy,
): AxisAdvStep<SiemAuditState> {
  if (session.state !== 'sealed') {
    throw new Error('applyRetention: events must be sealed first');
  }
  if (policy.hotDays < 0 || policy.warmDays < 0 || policy.coldDays < 0) {
    throw new Error('applyRetention: retention days must be non-negative');
  }
  const total = policy.hotDays + policy.warmDays + policy.coldDays;
  session.state = 'retention-tagged';
  return emit(session, 'siem.retention_applied', {
    hotDays: policy.hotDays,
    warmDays: policy.warmDays,
    coldDays: policy.coldDays,
    totalDays: total,
    legalHold: policy.legalHold,
  });
}

export function correlate(
  session: SiemAuditSession,
  rule: CorrelationRule,
): AxisAdvStep<SiemAuditState> {
  if (session.state !== 'retention-tagged') {
    throw new Error('correlate: retention must be applied first');
  }
  if (rule.requiredEventIds.length === 0) {
    throw new Error('correlate: rule must require >= 1 event id');
  }
  const structuredIds = new Set(session.structuredEvents.map((e) => e.eventId));
  const matched = rule.requiredEventIds.every((id) => structuredIds.has(id));
  session.state = 'correlated';
  return emit(session, 'siem.correlation_matched', {
    ruleId: rule.ruleId,
    windowMs: rule.windowMs,
    matched,
    requiredCount: rule.requiredEventIds.length,
  });
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `sha-${Math.abs(hash).toString(16)}`;
}

function emit(
  session: SiemAuditSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<SiemAuditState> {
  const step: AxisAdvStep<SiemAuditState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
