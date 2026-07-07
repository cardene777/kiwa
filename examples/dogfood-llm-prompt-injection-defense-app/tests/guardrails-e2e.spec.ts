/**
 * Guardrails defense end-to-end fidelity spec (guardrails axis: JSON
 * schema + toxicity + PII + Constitutional AI).
 *
 * Sub-Issue CAR-845 (v1.38-2) AC — the mock adapter drives a full
 * guardrail ceremony end to end and the fidelity harness diffs the
 * raw {@link TraceEvent} sequence across four axes.
 *
 *  1. validateSchema returns valid=true for a matching object and
 *     valid=false plus per-field errors for a missing required key.
 *  2. blockToxicity blocks toxic content above a threshold and passes
 *     benign content below it.
 *  3. redactPii replaces email / phone / SSN / credit-card with
 *     `[REDACTED_*]` placeholders.
 *  4. checkConstitutional surfaces per-principle violations when
 *     forbidden words appear in the response.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleGuardrailRequest,
  validateGuardrailRequest,
} from '../src/app/guardrails/route.js';
import type {
  JsonSchemaInput,
  LlmSafetyAdapter,
} from '../src/adapters/interface.js';

let mock: LlmSafetyAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

const userSchema: JsonSchemaInput = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 50 },
    age: { type: 'number', minimum: 0, maximum: 150 },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
  },
  required: ['name', 'age'],
};

describe('mock adapter — guardrails schema validation', () => {
  it('axis 1: validateSchema accepts a matching object', async () => {
    await mock.startGuardrail({ sessionId: 'g1' });
    const r = await mock.validateSchema({
      sessionId: 'g1',
      value: { name: 'alice', age: 30, role: 'user' },
      schema: userSchema,
    });
    expect(r.valid).toBe(true);
    expect(r.errorCount).toBe(0);
  });

  it('axis 1: validateSchema rejects missing required field', async () => {
    await mock.startGuardrail({ sessionId: 'g2' });
    const r = await mock.validateSchema({
      sessionId: 'g2',
      value: { name: 'bob' },
      schema: userSchema,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('age'))).toBe(true);
  });

  it('axis 1: validateSchema rejects wrong type', async () => {
    await mock.startGuardrail({ sessionId: 'g3' });
    const r = await mock.validateSchema({
      sessionId: 'g3',
      value: { name: 'carol', age: 'thirty' },
      schema: userSchema,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('age'))).toBe(true);
  });

  it('axis 1: validateSchema rejects value not in enum', async () => {
    await mock.startGuardrail({ sessionId: 'g4' });
    const r = await mock.validateSchema({
      sessionId: 'g4',
      value: { name: 'dave', age: 25, role: 'root' },
      schema: userSchema,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('role'))).toBe(true);
  });

  it('axis 1: validateSchema rejects string too short', async () => {
    await mock.startGuardrail({ sessionId: 'g5' });
    const r = await mock.validateSchema({
      sessionId: 'g5',
      value: { name: '', age: 25 },
      schema: userSchema,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('axis 1: validateSchema rejects number out of range', async () => {
    await mock.startGuardrail({ sessionId: 'g6' });
    const r = await mock.validateSchema({
      sessionId: 'g6',
      value: { name: 'eve', age: 200 },
      schema: userSchema,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('age'))).toBe(true);
  });

  it('axis 1: validateSchema rejects non-object value', async () => {
    await mock.startGuardrail({ sessionId: 'g7' });
    const r = await mock.validateSchema({
      sessionId: 'g7',
      value: 'not-an-object',
      schema: userSchema,
    });
    expect(r.valid).toBe(false);
  });

  it('axis 1: validateSchema trace records valid + errorCount', async () => {
    await mock.startGuardrail({ sessionId: 'g8' });
    await mock.validateSchema({
      sessionId: 'g8',
      value: { name: 'frank', age: 40 },
      schema: userSchema,
    });
    const trace = mock.traces().find((t) => t.op === 'validateSchema');
    expect((trace?.detail as { valid?: boolean })?.valid).toBe(true);
    expect((trace?.detail as { errorCount?: number })?.errorCount).toBe(0);
  });
});

describe('mock adapter — guardrails toxicity blocking', () => {
  it('axis 2: blockToxicity blocks content above threshold', async () => {
    await mock.startGuardrail({ sessionId: 't1' });
    await mock.validateSchema({
      sessionId: 't1',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.blockToxicity({
      sessionId: 't1',
      text: 'kill die hate attack destroy',
      threshold: 0.1,
    });
    expect(r.blocked).toBe(true);
    expect(r.score).toBeGreaterThan(0.1);
  });

  it('axis 2: blockToxicity passes benign content', async () => {
    await mock.startGuardrail({ sessionId: 't2' });
    await mock.validateSchema({
      sessionId: 't2',
      value: { name: 'y', age: 1 },
      schema: userSchema,
    });
    const r = await mock.blockToxicity({
      sessionId: 't2',
      text: 'The weather is lovely today.',
      threshold: 0.05,
    });
    expect(r.blocked).toBe(false);
    expect(r.score).toBe(0);
  });

  it('axis 2: blockToxicity uses default threshold when omitted', async () => {
    await mock.startGuardrail({ sessionId: 't3' });
    await mock.validateSchema({
      sessionId: 't3',
      value: { name: 'z', age: 1 },
      schema: userSchema,
    });
    const r = await mock.blockToxicity({
      sessionId: 't3',
      text: 'a b c d',
    });
    expect(r.threshold).toBe(0.05);
    expect(r.blocked).toBe(false);
  });

  it('axis 2: blockToxicity threshold=0.5 passes low-density content', async () => {
    await mock.startGuardrail({ sessionId: 't4' });
    await mock.validateSchema({
      sessionId: 't4',
      value: { name: 'a', age: 1 },
      schema: userSchema,
    });
    // 1 toxic word among 8 = 0.125, below 0.5
    const r = await mock.blockToxicity({
      sessionId: 't4',
      text: 'I hate mondays but love the weekend so much always',
      threshold: 0.5,
    });
    expect(r.blocked).toBe(false);
  });

  it('axis 2: blockToxicity trace records score + threshold', async () => {
    await mock.startGuardrail({ sessionId: 't5' });
    await mock.validateSchema({
      sessionId: 't5',
      value: { name: 'b', age: 1 },
      schema: userSchema,
    });
    await mock.blockToxicity({
      sessionId: 't5',
      text: 'hello world',
      threshold: 0.05,
    });
    const trace = mock.traces().find((t) => t.op === 'blockToxicity');
    expect((trace?.detail as { threshold?: number })?.threshold).toBe(0.05);
  });
});

describe('mock adapter — guardrails PII redaction', () => {
  it('axis 3: redactPii replaces email address', async () => {
    await mock.startGuardrail({ sessionId: 'p1' });
    await mock.validateSchema({
      sessionId: 'p1',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.redactPii({
      sessionId: 'p1',
      text: 'Contact me at alice@example.com anytime.',
    });
    expect(r.redacted).toContain('[REDACTED_EMAIL]');
    expect(r.redacted).not.toContain('alice@example.com');
    expect(r.hitKinds).toContain('email');
  });

  it('axis 3: redactPii replaces phone number', async () => {
    await mock.startGuardrail({ sessionId: 'p2' });
    await mock.validateSchema({
      sessionId: 'p2',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.redactPii({
      sessionId: 'p2',
      text: 'Call 555-123-4567 later.',
    });
    expect(r.redacted).toContain('[REDACTED_PHONE]');
    expect(r.hitKinds).toContain('phone');
  });

  it('axis 3: redactPii replaces SSN', async () => {
    await mock.startGuardrail({ sessionId: 'p3' });
    await mock.validateSchema({
      sessionId: 'p3',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.redactPii({
      sessionId: 'p3',
      text: 'SSN: 123-45-6789 is private.',
    });
    expect(r.redacted).toContain('[REDACTED_SSN]');
    expect(r.hitKinds).toContain('ssn');
  });

  it('axis 3: redactPii replaces credit card', async () => {
    await mock.startGuardrail({ sessionId: 'p4' });
    await mock.validateSchema({
      sessionId: 'p4',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.redactPii({
      sessionId: 'p4',
      text: 'Card: 4111 1111 1111 1111',
    });
    expect(r.redacted).toContain('[REDACTED_CC]');
    expect(r.hitKinds).toContain('credit-card');
  });

  it('axis 3: redactPii returns unchanged text with no PII', async () => {
    await mock.startGuardrail({ sessionId: 'p5' });
    await mock.validateSchema({
      sessionId: 'p5',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.redactPii({
      sessionId: 'p5',
      text: 'no personal data here.',
    });
    expect(r.redacted).toBe('no personal data here.');
    expect(r.totalHits).toBe(0);
  });

  it('axis 3: redactPii replaces multiple emails', async () => {
    await mock.startGuardrail({ sessionId: 'p6' });
    await mock.validateSchema({
      sessionId: 'p6',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.redactPii({
      sessionId: 'p6',
      text: 'a@a.com and b@b.com',
    });
    const emailHits = r.hitKinds.filter((k) => k === 'email').length;
    expect(emailHits).toBeGreaterThanOrEqual(1);
    expect(r.redacted).not.toContain('a@a.com');
    expect(r.redacted).not.toContain('b@b.com');
  });
});

describe('mock adapter — guardrails Constitutional check', () => {
  it('axis 4: checkConstitutional reports zero violations for compliant output', async () => {
    await mock.startGuardrail({ sessionId: 'c1' });
    await mock.validateSchema({
      sessionId: 'c1',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.checkConstitutional({
      sessionId: 'c1',
      text: 'Here is a safe recipe for cookies.',
      principles: [
        { id: 'p1', ruleText: 'No harm', forbidden: ['weapon', 'attack'] },
      ],
    });
    expect(r.violationCount).toBe(0);
  });

  it('axis 4: checkConstitutional reports violation for forbidden word', async () => {
    await mock.startGuardrail({ sessionId: 'c2' });
    await mock.validateSchema({
      sessionId: 'c2',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.checkConstitutional({
      sessionId: 'c2',
      text: 'A weapon can hurt someone.',
      principles: [
        { id: 'no-harm', ruleText: 'No harm', forbidden: ['weapon'] },
      ],
    });
    expect(r.violationCount).toBe(1);
    expect(r.violations[0]?.principleId).toBe('no-harm');
    expect(r.violations[0]?.word).toBe('weapon');
  });

  it('axis 4: checkConstitutional aggregates violations across principles', async () => {
    await mock.startGuardrail({ sessionId: 'c3' });
    await mock.validateSchema({
      sessionId: 'c3',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.checkConstitutional({
      sessionId: 'c3',
      text: 'weapon and hate are bad.',
      principles: [
        { id: 'safety', ruleText: 'No harm', forbidden: ['weapon'] },
        { id: 'kindness', ruleText: 'No hate', forbidden: ['hate'] },
      ],
    });
    expect(r.violationCount).toBe(2);
  });

  it('axis 4: checkConstitutional is case-insensitive', async () => {
    await mock.startGuardrail({ sessionId: 'c4' });
    await mock.validateSchema({
      sessionId: 'c4',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.checkConstitutional({
      sessionId: 'c4',
      text: 'WEAPON is bad.',
      principles: [
        { id: 'safety', ruleText: 'No harm', forbidden: ['weapon'] },
      ],
    });
    expect(r.violationCount).toBe(1);
  });

  it('axis 4: checkConstitutional works with empty principle list', async () => {
    await mock.startGuardrail({ sessionId: 'c5' });
    await mock.validateSchema({
      sessionId: 'c5',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const r = await mock.checkConstitutional({
      sessionId: 'c5',
      text: 'anything goes',
      principles: [],
    });
    expect(r.violationCount).toBe(0);
  });
});

describe('mock adapter — guardrail close + trace', () => {
  it('closeGuardrail records history length', async () => {
    await mock.startGuardrail({ sessionId: 'x1' });
    await mock.validateSchema({
      sessionId: 'x1',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    await mock.closeGuardrail({ sessionId: 'x1' });
    const trace = mock.traces().find((t) => t.op === 'closeGuardrail');
    expect(trace?.ok).toBe(true);
  });

  it('startGuardrail twice throws DUPLICATE_SESSION', async () => {
    await mock.startGuardrail({ sessionId: 'x2' });
    await expect(
      mock.startGuardrail({ sessionId: 'x2' }),
    ).rejects.toThrow(/duplicate session x2/);
  });

  it('guardrail ops without startGuardrail fail', async () => {
    await expect(
      mock.blockToxicity({ sessionId: 'nope', text: 'hi' }),
    ).rejects.toThrow(/no session/);
  });
});

describe('guardrail route validator', () => {
  it('rejects non-object body', () => {
    const r = validateGuardrailRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId', () => {
    const r = validateGuardrailRequest({ kind: 'blockToxicity', text: 'hi' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects invalid kind', () => {
    const r = validateGuardrailRequest({
      sessionId: 's',
      kind: 'nope',
      text: 'x',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('kind_must_be_valid_op');
  });

  it('accepts valid blockToxicity', () => {
    const r = validateGuardrailRequest({
      sessionId: 's',
      kind: 'blockToxicity',
      text: 'x',
      threshold: 0.1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.kind).toBe('blockToxicity');
      expect(r.value.threshold).toBe(0.1);
    }
  });

  it('rejects validateSchema without schema', () => {
    const r = validateGuardrailRequest({
      sessionId: 's',
      kind: 'validateSchema',
      value: {},
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('schema_required');
  });

  it('rejects checkConstitutional without principles', () => {
    const r = validateGuardrailRequest({
      sessionId: 's',
      kind: 'checkConstitutional',
      text: 'x',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('principles_required');
  });
});

describe('guardrail route handler', () => {
  it('handles redactPii via mock', async () => {
    await mock.startGuardrail({ sessionId: 'h1' });
    await mock.validateSchema({
      sessionId: 'h1',
      value: { name: 'x', age: 1 },
      schema: userSchema,
    });
    const res = await handleGuardrailRequest(mock, {
      sessionId: 'h1',
      kind: 'redactPii',
      text: 'email a@b.com',
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('redactPii');
  });

  it('handles missing session with errorKind', async () => {
    const res = await handleGuardrailRequest(mock, {
      sessionId: 'nope',
      kind: 'redactPii',
      text: 'x',
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
