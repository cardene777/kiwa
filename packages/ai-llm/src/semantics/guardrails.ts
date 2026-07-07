import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Guardrails axis — JSON schema + regex + toxicity + PII + Constitutional AI
 * state machine。 deterministic mock で 5 signal 系統を提供。
 */

export type GuardrailState =
  | 'idle'
  | 'schema-validated'
  | 'regex-matched'
  | 'toxicity-blocked'
  | 'pii-redacted'
  | 'constitutional-checked';

export interface GuardrailSession {
  target: AiLlmTarget;
  sessionId: string;
  state: GuardrailState;
  history: AxisStep<GuardrailState>[];
}

export interface SimpleSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: Array<string | number | boolean>;
}

export interface SimpleSchema {
  type: 'object';
  properties: Record<string, SimpleSchemaProperty>;
  required?: string[];
}

export interface ConstitutionalPrinciple {
  id: string;
  ruleText: string;
  forbidden: string[];
}

export function startGuardrailSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): GuardrailSession {
  if (input.sessionId.length === 0) {
    throw new Error('startGuardrailSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
  };
}

export function validateSchema(
  session: GuardrailSession,
  input: { value: unknown; schema: SimpleSchema },
): { step: AxisStep<GuardrailState>; valid: boolean; errors: string[] } {
  if (session.state !== 'idle' && session.state !== 'pii-redacted') {
    throw new Error(`validateSchema: session is ${session.state}`);
  }
  const errors: string[] = [];
  if (typeof input.value !== 'object' || input.value === null || Array.isArray(input.value)) {
    errors.push('value is not an object');
    session.state = 'schema-validated';
    const step0 = emit(session, 'guardrail.schema_validated', {
      valid: false,
      errorCount: errors.length,
    });
    return { step: step0, valid: false, errors };
  }
  const obj = input.value as Record<string, unknown>;
  for (const key of input.schema.required ?? []) {
    if (!(key in obj)) errors.push(`missing required field: ${key}`);
  }
  for (const [key, prop] of Object.entries(input.schema.properties)) {
    if (!(key in obj)) continue;
    const v = obj[key];
    if (!typeMatches(v, prop.type)) {
      errors.push(`${key}: expected ${prop.type}, got ${typeof v}`);
      continue;
    }
    if (prop.type === 'string' && typeof v === 'string') {
      if (prop.minLength !== undefined && v.length < prop.minLength) {
        errors.push(`${key}: length ${v.length} < minLength ${prop.minLength}`);
      }
      if (prop.maxLength !== undefined && v.length > prop.maxLength) {
        errors.push(`${key}: length ${v.length} > maxLength ${prop.maxLength}`);
      }
    }
    if (prop.type === 'number' && typeof v === 'number') {
      if (prop.minimum !== undefined && v < prop.minimum) {
        errors.push(`${key}: ${v} < minimum ${prop.minimum}`);
      }
      if (prop.maximum !== undefined && v > prop.maximum) {
        errors.push(`${key}: ${v} > maximum ${prop.maximum}`);
      }
    }
    if (prop.enum && !prop.enum.includes(v as string | number | boolean)) {
      errors.push(`${key}: value not in enum`);
    }
  }
  const valid = errors.length === 0;
  session.state = 'schema-validated';
  const step = emit(session, 'guardrail.schema_validated', {
    valid,
    errorCount: errors.length,
  });
  return { step, valid, errors };
}

export function matchRegex(
  session: GuardrailSession,
  input: { text: string; patterns: RegExp[]; mode: 'allow' | 'deny' },
): { step: AxisStep<GuardrailState>; passed: boolean; hits: string[] } {
  if (session.state === 'idle') {
    throw new Error('matchRegex: run schema validation first');
  }
  const hits: string[] = [];
  for (const p of input.patterns) {
    const m = input.text.match(p);
    if (m) hits.push(m[0]);
  }
  const passed = input.mode === 'allow' ? hits.length > 0 : hits.length === 0;
  session.state = 'regex-matched';
  const step = emit(session, 'guardrail.regex_matched', {
    mode: input.mode,
    hitCount: hits.length,
    passed,
  });
  return { step, passed, hits };
}

const TOXIC_WORDS = new Set([
  'kill',
  'die',
  'hate',
  'attack',
  'destroy',
  'weapon',
  'harm',
  'violent',
]);

export function blockToxicity(
  session: GuardrailSession,
  input: { text: string; threshold?: number },
): { step: AxisStep<GuardrailState>; blocked: boolean; score: number } {
  if (session.state === 'idle') {
    throw new Error('blockToxicity: run earlier checks first');
  }
  const tokens = input.text.toLowerCase().split(/\W+/).filter((t) => t.length > 0);
  const hits = tokens.filter((t) => TOXIC_WORDS.has(t)).length;
  const score = tokens.length === 0 ? 0 : hits / tokens.length;
  const threshold = input.threshold ?? 0.05;
  const blocked = score >= threshold;
  if (blocked) session.state = 'toxicity-blocked';
  const step = emit(session, 'guardrail.toxicity_blocked', {
    score,
    threshold,
    blocked,
    tokenCount: tokens.length,
    hits,
  });
  return { step, blocked, score };
}

const PII_PATTERNS: Array<{ kind: string; pattern: RegExp; replace: string }> = [
  { kind: 'email', pattern: /[\w.-]+@[\w.-]+\.\w+/g, replace: '[REDACTED_EMAIL]' },
  { kind: 'phone', pattern: /\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, replace: '[REDACTED_PHONE]' },
  {
    kind: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replace: '[REDACTED_SSN]',
  },
  {
    kind: 'credit-card',
    pattern: /\b(?:\d[ -]*?){13,16}\b/g,
    replace: '[REDACTED_CC]',
  },
];

export function redactPii(
  session: GuardrailSession,
  text: string,
): { step: AxisStep<GuardrailState>; redacted: string; hits: Array<{ kind: string; count: number }> } {
  if (session.state === 'idle') {
    throw new Error('redactPii: run earlier checks first');
  }
  let redacted = text;
  const hits: Array<{ kind: string; count: number }> = [];
  for (const { kind, pattern, replace } of PII_PATTERNS) {
    const matches = redacted.match(pattern);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      hits.push({ kind, count });
      redacted = redacted.replace(pattern, replace);
    }
  }
  session.state = 'pii-redacted';
  const step = emit(session, 'guardrail.pii_redacted', {
    hitKindCount: hits.length,
    totalHits: hits.reduce((s, h) => s + h.count, 0),
  });
  return { step, redacted, hits };
}

export function checkConstitutional(
  session: GuardrailSession,
  input: { text: string; principles: ConstitutionalPrinciple[] },
): { step: AxisStep<GuardrailState>; violations: Array<{ id: string; word: string }> } {
  if (session.state === 'idle') {
    throw new Error('checkConstitutional: run earlier checks first');
  }
  const violations: Array<{ id: string; word: string }> = [];
  const lower = input.text.toLowerCase();
  for (const p of input.principles) {
    for (const word of p.forbidden) {
      if (lower.includes(word.toLowerCase())) {
        violations.push({ id: p.id, word });
      }
    }
  }
  session.state = 'constitutional-checked';
  const step = emit(session, 'guardrail.constitutional_checked', {
    principleCount: input.principles.length,
    violationCount: violations.length,
  });
  return { step, violations };
}

function typeMatches(v: unknown, t: SimpleSchemaProperty['type']): boolean {
  switch (t) {
    case 'string':
      return typeof v === 'string';
    case 'number':
      return typeof v === 'number' && !Number.isNaN(v);
    case 'boolean':
      return typeof v === 'boolean';
    case 'array':
      return Array.isArray(v);
    case 'object':
      return typeof v === 'object' && v !== null && !Array.isArray(v);
  }
}

function emit(
  session: GuardrailSession,
  neutralEvent: AxisStep<GuardrailState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<GuardrailState> {
  const step: AxisStep<GuardrailState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
