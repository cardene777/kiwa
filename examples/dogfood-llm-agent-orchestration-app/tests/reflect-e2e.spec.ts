/**
 * Reflect + self-correct end-to-end fidelity spec (agent-orchestration
 * reflect axis: critique rules → revised output cycle).
 *
 * Sub-Issue CAR-858 (v1.38-4) AC — the mock adapter drives a full
 * reflect ceremony and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across the axis.
 *
 *  1. reflect with clean output reports no violations.
 *  2. reflect with violating word records violationCount > 0 and
 *     replaces the word in revised output.
 *  3. reflect cycle increments monotonically across calls.
 *  4. reflect throws when session is idle (no react or tot yet).
 *  5. reflect trace records cycle + violationCount in detail.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleReflectRequest,
  validateReflectRequest,
} from '../src/app/reflect/route.js';
import type { LlmAgentAdapter } from '../src/adapters/interface.js';

let mock: LlmAgentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — reflect + self-correct', () => {
  it('axis 1: reflect with clean output reports no violations', async () => {
    await mock.startAgent({ sessionId: 'f1' });
    await mock.reactStep({
      sessionId: 'f1',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.reflect({
      sessionId: 'f1',
      reflect: { output: 'clean output', critiqueRules: ['forbidden'] },
    });
    expect(r.violationCount).toBe(0);
    expect(r.critique).toContain('no rule violations');
  });

  it('axis 2: reflect replaces violating word with [revised]', async () => {
    await mock.startAgent({ sessionId: 'f2' });
    await mock.reactStep({
      sessionId: 'f2',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.reflect({
      sessionId: 'f2',
      reflect: {
        output: 'this contains forbidden phrasing',
        critiqueRules: ['forbidden'],
      },
    });
    expect(r.revised).toContain('[revised]');
    expect(r.violationCount).toBeGreaterThan(0);
  });

  it('axis 3: reflect cycle increments across two calls', async () => {
    await mock.startAgent({ sessionId: 'f3' });
    await mock.reactStep({
      sessionId: 'f3',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    const r1 = await mock.reflect({
      sessionId: 'f3',
      reflect: { output: 'a', critiqueRules: [] },
    });
    const r2 = await mock.reflect({
      sessionId: 'f3',
      reflect: { output: 'a', critiqueRules: [] },
    });
    expect(r1.cycle).toBe(1);
    expect(r2.cycle).toBe(2);
  });

  it('axis 4: reflect throws when session idle', async () => {
    await mock.startAgent({ sessionId: 'f4' });
    await expect(
      mock.reflect({
        sessionId: 'f4',
        reflect: { output: 'x', critiqueRules: [] },
      }),
    ).rejects.toThrow(/run react or tot first/);
  });

  it('axis 5: reflect trace records cycle in detail', async () => {
    await mock.startAgent({ sessionId: 'f5' });
    await mock.reactStep({
      sessionId: 'f5',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    await mock.reflect({
      sessionId: 'f5',
      reflect: { output: 'clean', critiqueRules: ['forbidden'] },
    });
    const trace = mock.traces().find((t) => t.op === 'reflect');
    expect((trace?.detail as { cycle?: number })?.cycle).toBe(1);
  });

  it('axis 5: reflect latency is positive', async () => {
    await mock.startAgent({ sessionId: 'f6' });
    await mock.reactStep({
      sessionId: 'f6',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.reflect({
      sessionId: 'f6',
      reflect: { output: 'clean', critiqueRules: ['forbidden'] },
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('axis 5: reflect after tot works (state=tot-expanded)', async () => {
    await mock.startAgent({ sessionId: 'f7' });
    await mock.expandToT({
      sessionId: 'f7',
      plan: {
        root: { thought: 'plan' },
        branches: [{ thought: 'a', score: 1 }],
        depth: 2,
      },
    });
    const r = await mock.reflect({
      sessionId: 'f7',
      reflect: { output: 'clean', critiqueRules: [] },
    });
    expect(r.cycle).toBe(1);
  });
});

describe('reflect route validator', () => {
  it('rejects missing reflect object', () => {
    const r = validateReflectRequest({ sessionId: 's' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('reflect_required');
  });

  it('rejects missing reflect.output', () => {
    const r = validateReflectRequest({
      sessionId: 's',
      reflect: { critiqueRules: [] },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('reflect.output_required');
  });

  it('rejects missing critiqueRules', () => {
    const r = validateReflectRequest({
      sessionId: 's',
      reflect: { output: 'x' },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('reflect.critiqueRules_required');
  });

  it('accepts valid request with empty rules', () => {
    const r = validateReflectRequest({
      sessionId: 's',
      reflect: { output: 'x', critiqueRules: [] },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.reflect.output).toBe('x');
  });
});

describe('reflect route handler', () => {
  it('handles reflect end-to-end via mock', async () => {
    await mock.startAgent({ sessionId: 'h1' });
    await mock.reactStep({
      sessionId: 'h1',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    const res = await handleReflectRequest(mock, {
      sessionId: 'h1',
      reflect: { output: 'clean', critiqueRules: ['forbidden'] },
    });
    expect(res.ok).toBe(true);
    expect(res.result?.cycle).toBe(1);
  });

  it('handles idle session with errorKind', async () => {
    await mock.startAgent({ sessionId: 'h2' });
    const res = await handleReflectRequest(mock, {
      sessionId: 'h2',
      reflect: { output: 'x', critiqueRules: [] },
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('run react or tot first');
  });
});
