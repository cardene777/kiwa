import { describe, expect, it } from 'vitest';
import {
  blockToxicity,
  checkConstitutional,
  matchRegex,
  redactPii,
  startGuardrailSession,
  validateSchema,
} from '../../src/semantics/index.js';

describe('startGuardrailSession', () => {
  it('creates idle session', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    expect(s.state).toBe('idle');
  });

  it('throws when sessionId empty', () => {
    expect(() => startGuardrailSession({ target: 'openai', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('validateSchema', () => {
  it('validates required fields', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    const { valid, errors } = validateSchema(s, {
      value: { name: 'kiwa' },
      schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name', 'age'],
      },
    });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('age'))).toBe(true);
  });

  it('validates string minLength / maxLength', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    const { valid, errors } = validateSchema(s, {
      value: { name: 'a' },
      schema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 2, maxLength: 5 } },
      },
    });
    expect(valid).toBe(false);
    expect(errors[0]).toContain('minLength');
  });

  it('validates number minimum / maximum', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    const { valid, errors } = validateSchema(s, {
      value: { n: 150 },
      schema: {
        type: 'object',
        properties: { n: { type: 'number', minimum: 0, maximum: 100 } },
      },
    });
    expect(valid).toBe(false);
    expect(errors[0]).toContain('maximum');
  });

  it('validates enum', () => {
    const s = startGuardrailSession({ target: 'vercel-ai', sessionId: 's' });
    const { valid } = validateSchema(s, {
      value: { role: 'admin' },
      schema: {
        type: 'object',
        properties: { role: { type: 'string', enum: ['user', 'guest'] } },
      },
    });
    expect(valid).toBe(false);
  });

  it('validates type mismatch', () => {
    const s = startGuardrailSession({ target: 'langchain', sessionId: 's' });
    const { valid, errors } = validateSchema(s, {
      value: { n: 'abc' },
      schema: { type: 'object', properties: { n: { type: 'number' } } },
    });
    expect(valid).toBe(false);
    expect(errors[0]).toContain('expected number');
  });

  it('rejects non-object value', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    const { valid } = validateSchema(s, {
      value: [1, 2, 3],
      schema: { type: 'object', properties: {} },
    });
    expect(valid).toBe(false);
  });

  it('passes valid nested object', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    const { valid } = validateSchema(s, {
      value: { name: 'kiwa', age: 5 },
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      },
    });
    expect(valid).toBe(true);
  });
});

describe('matchRegex', () => {
  it('allow mode passes when pattern matches', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { passed } = matchRegex(s, {
      text: 'foo bar',
      patterns: [/bar/],
      mode: 'allow',
    });
    expect(passed).toBe(true);
  });

  it('deny mode fails when pattern matches', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { passed } = matchRegex(s, {
      text: 'password=secret',
      patterns: [/password/],
      mode: 'deny',
    });
    expect(passed).toBe(false);
  });

  it('throws when session idle', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    expect(() => matchRegex(s, { text: 'x', patterns: [/x/], mode: 'allow' })).toThrow(
      'schema validation first',
    );
  });
});

describe('blockToxicity', () => {
  it('blocks when threshold exceeded', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { blocked, score } = blockToxicity(s, {
      text: 'kill destroy attack harm',
      threshold: 0.1,
    });
    expect(blocked).toBe(true);
    expect(score).toBeGreaterThan(0.1);
  });

  it('does not block benign text', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { blocked } = blockToxicity(s, { text: 'i love kiwa fruit' });
    expect(blocked).toBe(false);
  });

  it('uses default threshold when omitted', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { step } = blockToxicity(s, { text: 'peace kindness love' });
    expect(step.metadata.threshold).toBe(0.05);
  });

  it('handles empty text without crash', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { score } = blockToxicity(s, { text: '' });
    expect(score).toBe(0);
  });
});

describe('redactPii', () => {
  it('redacts email', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { redacted, hits } = redactPii(s, 'contact me at foo@bar.com please');
    expect(redacted).toContain('[REDACTED_EMAIL]');
    expect(hits.some((h) => h.kind === 'email')).toBe(true);
  });

  it('redacts phone', () => {
    const s = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { redacted, hits } = redactPii(s, 'call 555-123-4567 now');
    expect(redacted).toContain('[REDACTED_PHONE]');
    expect(hits.some((h) => h.kind === 'phone')).toBe(true);
  });

  it('redacts ssn', () => {
    const s = startGuardrailSession({ target: 'vercel-ai', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { redacted } = redactPii(s, 'my ssn 123-45-6789');
    expect(redacted).toContain('[REDACTED_SSN]');
  });

  it('leaves benign text unchanged', () => {
    const s = startGuardrailSession({ target: 'langchain', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { redacted, hits } = redactPii(s, 'kiwa fruit is green');
    expect(redacted).toBe('kiwa fruit is green');
    expect(hits).toEqual([]);
  });
});

describe('checkConstitutional', () => {
  it('flags forbidden words per principle', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { violations } = checkConstitutional(s, {
      text: 'contains banned word',
      principles: [
        { id: 'p1', ruleText: 'no banned', forbidden: ['banned'] },
      ],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.id).toBe('p1');
  });

  it('returns no violations for compliant text', () => {
    const s = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    validateSchema(s, { value: {}, schema: { type: 'object', properties: {} } });
    const { violations } = checkConstitutional(s, {
      text: 'clean text',
      principles: [{ id: 'p1', ruleText: 'no banned', forbidden: ['banned'] }],
    });
    expect(violations).toEqual([]);
  });
});
