import { describe, expect, it } from 'vitest';
import {
  startGuardrailSession,
  validateSchema,
} from '../src/semantics/guardrails.js';
import type { SimpleSchema } from '../src/semantics/guardrails.js';
import {
  startSlaSession,
  measureLatency,
} from '../src/semantics/cost-latency-sla.js';

describe('guardrails/validateSchema object typeguard branches', () => {
  it('validates value that is object with required + typed properties', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's1' });
    const schema: SimpleSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        age: { type: 'number', minimum: 0 },
      },
      required: ['name'],
    };
    const { valid, errors } = validateSchema(session, {
      value: { name: 'a', age: 20 },
      schema,
    });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('rejects value that is array (Array.isArray true)', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's2' });
    const schema: SimpleSchema = {
      type: 'object',
      properties: {},
    };
    const { valid, errors } = validateSchema(session, {
      value: [1, 2, 3],
      schema,
    });
    expect(valid).toBe(false);
    expect(errors).toContain('value is not an object');
  });

  it('rejects value that is null', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's3' });
    const { valid } = validateSchema(session, {
      value: null,
      schema: { type: 'object', properties: {} },
    });
    expect(valid).toBe(false);
  });

  it('rejects value that is a primitive (typeof !== object)', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's4' });
    const { valid } = validateSchema(session, {
      value: 'a string',
      schema: { type: 'object', properties: {} },
    });
    expect(valid).toBe(false);
  });

  it('reports required-field missing', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's5' });
    const schema: SimpleSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    const { valid, errors } = validateSchema(session, {
      value: {},
      schema,
    });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('missing required field'))).toBe(true);
  });

  it('reports string minLength / maxLength violations', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's6' });
    const schema: SimpleSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 5 },
      },
    };
    const short = validateSchema(session, {
      value: { name: 'a' },
      schema,
    });
    expect(short.valid).toBe(false);
    const session2 = startGuardrailSession({ target: 'openai', sessionId: 's7' });
    const long = validateSchema(session2, {
      value: { name: 'toolongname' },
      schema,
    });
    expect(long.valid).toBe(false);
  });

  it('reports number minimum / maximum + enum violations', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's8' });
    const schema: SimpleSchema = {
      type: 'object',
      properties: {
        n: { type: 'number', minimum: 10, maximum: 20 },
        color: { type: 'string', enum: ['red', 'blue'] },
      },
    };
    const { valid, errors } = validateSchema(session, {
      value: { n: 5, color: 'green' },
      schema,
    });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('reports type mismatch', () => {
    const session = startGuardrailSession({ target: 'openai', sessionId: 's9' });
    const schema: SimpleSchema = {
      type: 'object',
      properties: { n: { type: 'number' } },
    };
    const { valid, errors } = validateSchema(session, {
      value: { n: 'not a number' },
      schema,
    });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('expected number'))).toBe(true);
  });
});

describe('cost-latency-sla measureLatency percentile branches', () => {
  it('throws when samples is empty', () => {
    const session = startSlaSession({
      target: 'openai',
      sessionId: 's1',
      budgetUsd: 1,
    });
    expect(() => measureLatency(session, [])).toThrow(/samples must not be empty/);
  });

  it('picks p50/p95/p99 from a single-sample array (sorted[idx] fallback)', () => {
    const session = startSlaSession({
      target: 'openai',
      sessionId: 's2',
      budgetUsd: 1,
    });
    const { p50, p95, p99, count } = measureLatency(session, [
      { latencyMs: 100 } as never,
    ]);
    expect(p50).toBe(100);
    expect(p95).toBe(100);
    expect(p99).toBe(100);
    expect(count).toBe(1);
  });

  it('picks p50/p95/p99 correctly from an ordered set of samples', () => {
    const session = startSlaSession({
      target: 'openai',
      sessionId: 's3',
      budgetUsd: 1,
    });
    const samples = Array.from({ length: 100 }, (_, i) => ({
      latencyMs: i + 1,
    })) as never[];
    const { p50, p95, p99 } = measureLatency(session, samples);
    expect(p50).toBe(50);
    expect(p95).toBe(95);
    expect(p99).toBe(99);
  });

  it('startSlaSession throws when sessionId is empty', () => {
    expect(() =>
      startSlaSession({ target: 'openai', sessionId: '', budgetUsd: 1 }),
    ).toThrow(/sessionId must not be empty/);
  });

  it('startSlaSession throws when budgetUsd is negative', () => {
    expect(() =>
      startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: -1 }),
    ).toThrow(/budgetUsd must be non-negative/);
  });
});
