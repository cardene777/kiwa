import { providerEventName, type AxisStep, type AiLlmTarget, type NeutralEventName } from './types.js';

/**
 * Prompt injection defense axis — direct + indirect + jailbreak + role hijacking
 * + XML injection detection state machine。
 *
 * Deterministic mock で 5 signal 系統を提供 (pattern-based classifier)。
 * real driver 経路では実 LLM に対し injection payload を投げて refusal を
 * 観測する。
 */

export type InjectionKind =
  | 'direct'
  | 'indirect'
  | 'jailbreak'
  | 'role-hijacking'
  | 'xml-injection';

export type InjectionState =
  | 'idle'
  | 'analyzed'
  | 'direct-detected'
  | 'indirect-detected'
  | 'jailbreak-blocked'
  | 'role-hijacking-blocked';

export interface InjectionSession {
  target: AiLlmTarget;
  sessionId: string;
  state: InjectionState;
  history: AxisStep<InjectionState>[];
  detections: Array<{ kind: InjectionKind; confidence: number; excerpt: string }>;
}

export interface InjectionDetection {
  kind: InjectionKind;
  confidence: number;
  excerpt: string;
  matchedPattern: string;
}

export function startInjectionSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): InjectionSession {
  if (input.sessionId.length === 0) {
    throw new Error('startInjectionSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    detections: [],
  };
}

const DIRECT_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+the\s+system\s+prompt/i,
  /forget\s+everything\s+above/i,
  /new\s+instructions:/i,
];

const INDIRECT_PATTERNS: RegExp[] = [
  /<!--\s*inject:/i,
  /```\s*system/i,
  /\{\{\s*prompt\s*\}\}/i,
];

const JAILBREAK_PATTERNS: RegExp[] = [
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /pretend\s+you\s+are\s+not\s+bound/i,
  /you\s+are\s+now\s+unrestricted/i,
];

const ROLE_HIJACK_PATTERNS: RegExp[] = [
  /you\s+are\s+now\s+a\s+different/i,
  /act\s+as\s+system/i,
  /<system>/i,
  /assistant:\s*ok\s*,?\s*i\s+will/i,
];

const XML_INJECTION_PATTERNS: RegExp[] = [
  /<user_input>[\s\S]*<\/user_input>/i,
  /<\/instructions>/i,
  /<\/system>/i,
];

export function detectInjection(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; detections: InjectionDetection[] } {
  if (session.state !== 'idle' && session.state !== 'analyzed') {
    throw new Error(`detectInjection: session is ${session.state}, cannot analyze`);
  }
  const detections: InjectionDetection[] = [];
  detections.push(...matchAll(input, 'direct', DIRECT_PATTERNS));
  detections.push(...matchAll(input, 'indirect', INDIRECT_PATTERNS));
  detections.push(...matchAll(input, 'jailbreak', JAILBREAK_PATTERNS));
  detections.push(...matchAll(input, 'role-hijacking', ROLE_HIJACK_PATTERNS));
  detections.push(...matchAll(input, 'xml-injection', XML_INJECTION_PATTERNS));

  session.detections.push(
    ...detections.map((d) => ({ kind: d.kind, confidence: d.confidence, excerpt: d.excerpt })),
  );
  session.state = 'analyzed';
  const eventForKind: Record<InjectionKind, NeutralEventName> = {
    direct: 'injection.direct_detected',
    indirect: 'injection.indirect_detected',
    jailbreak: 'injection.jailbreak_blocked',
    'role-hijacking': 'injection.role_hijacking_blocked',
    'xml-injection': 'injection.xml_detected',
  };
  const neutralEvent: NeutralEventName =
    detections.length === 0
      ? 'injection.direct_detected'
      : eventForKind[detections[0]!.kind];
  const step = emit(session, neutralEvent, {
    inputLength: input.length,
    detectionCount: detections.length,
    detectedKinds: Array.from(new Set(detections.map((d) => d.kind))).join(','),
  });
  return { step, detections };
}

export function classifyDirect(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean } {
  if (session.state !== 'analyzed') {
    throw new Error(`classifyDirect: session is ${session.state}, expected analyzed`);
  }
  const hit = matchAll(input, 'direct', DIRECT_PATTERNS);
  const blocked = hit.length > 0;
  if (blocked) session.state = 'direct-detected';
  const step = emit(session, 'injection.direct_detected', {
    blocked,
    hitCount: hit.length,
  });
  return { step, blocked };
}

export function classifyIndirect(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean } {
  if (session.state !== 'analyzed' && session.state !== 'direct-detected') {
    throw new Error(`classifyIndirect: session is ${session.state}`);
  }
  const hit = matchAll(input, 'indirect', INDIRECT_PATTERNS);
  const blocked = hit.length > 0;
  if (blocked) session.state = 'indirect-detected';
  const step = emit(session, 'injection.indirect_detected', {
    blocked,
    hitCount: hit.length,
  });
  return { step, blocked };
}

export function blockJailbreak(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean } {
  if (session.state === 'idle') {
    throw new Error('blockJailbreak: analyze first');
  }
  const hit = matchAll(input, 'jailbreak', JAILBREAK_PATTERNS);
  const blocked = hit.length > 0;
  if (blocked) session.state = 'jailbreak-blocked';
  const step = emit(session, 'injection.jailbreak_blocked', {
    blocked,
    hitCount: hit.length,
  });
  return { step, blocked };
}

export function blockRoleHijacking(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean } {
  if (session.state === 'idle') {
    throw new Error('blockRoleHijacking: analyze first');
  }
  const roleHits = matchAll(input, 'role-hijacking', ROLE_HIJACK_PATTERNS);
  const xmlHits = matchAll(input, 'xml-injection', XML_INJECTION_PATTERNS);
  const blocked = roleHits.length + xmlHits.length > 0;
  if (blocked) session.state = 'role-hijacking-blocked';
  const step = emit(session, 'injection.role_hijacking_blocked', {
    blocked,
    roleHitCount: roleHits.length,
    xmlHitCount: xmlHits.length,
  });
  return { step, blocked };
}

function matchAll(input: string, kind: InjectionKind, patterns: RegExp[]): InjectionDetection[] {
  const out: InjectionDetection[] = [];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) {
      out.push({
        kind,
        confidence: kindConfidence(kind),
        excerpt: m[0].slice(0, 80),
        matchedPattern: p.source,
      });
    }
  }
  return out;
}

function kindConfidence(kind: InjectionKind): number {
  switch (kind) {
    case 'direct':
      return 0.95;
    case 'jailbreak':
      return 0.9;
    case 'role-hijacking':
      return 0.85;
    case 'xml-injection':
      return 0.8;
    case 'indirect':
      return 0.75;
  }
}

function emit(
  session: InjectionSession,
  neutralEvent: AxisStep<InjectionState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<InjectionState> {
  const step: AxisStep<InjectionState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
