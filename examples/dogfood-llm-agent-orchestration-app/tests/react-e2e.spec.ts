/**
 * ReAct end-to-end fidelity spec (agent-orchestration ReAct axis:
 * thought → action → observation trace).
 *
 * Sub-Issue CAR-858 (v1.38-4) AC — the mock adapter drives a full ReAct
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across the axis.
 *
 *  1. reactStep appends monotonic-indexed entries to the trace.
 *  2. reactStep records the tool name in the neutral event metadata.
 *  3. reactStep enforces empty-tool rejection so the state machine
 *     cannot advance with a missing action.
 *  4. reactStep can be repeated after reflect (state=reflected).
 *  5. traces record ordered ops with detail payloads suitable for the
 *     fidelity harness.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_LLM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link LlmAgentAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleReactRequest,
  validateReactRequest,
} from '../src/app/react/route.js';
import type { LlmAgentAdapter } from '../src/adapters/interface.js';

let mock: LlmAgentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — ReAct step', () => {
  it('axis 1: reactStep appends 1 entry with index 0', async () => {
    await mock.startAgent({ sessionId: 'r1' });
    const r = await mock.reactStep({
      sessionId: 'r1',
      step: {
        thought: 'search for weather in tokyo',
        action: { tool: 'search', input: 'tokyo weather' },
        observation: 'result: sunny, 72F',
      },
    });
    expect(r.index).toBe(0);
    expect(r.traceLength).toBe(1);
    expect(r.tool).toBe('search');
  });

  it('axis 1: reactStep two consecutive steps have monotonic indices', async () => {
    await mock.startAgent({ sessionId: 'r2' });
    await mock.reactStep({
      sessionId: 'r2',
      step: {
        thought: 't1',
        action: { tool: 'search', input: 'x' },
        observation: 'o1',
      },
    });
    const r2 = await mock.reactStep({
      sessionId: 'r2',
      step: {
        thought: 't2',
        action: { tool: 'read', input: 'y' },
        observation: 'o2',
      },
    });
    expect(r2.index).toBe(1);
    expect(r2.traceLength).toBe(2);
  });

  it('axis 1: reactStep records tool name in the trace detail', async () => {
    await mock.startAgent({ sessionId: 'r3' });
    await mock.reactStep({
      sessionId: 'r3',
      step: {
        thought: 't',
        action: { tool: 'weather', input: 'x' },
        observation: 'o',
      },
    });
    const trace = mock.traces().find((t) => t.op === 'reactStep');
    expect((trace?.detail as { tool?: string })?.tool).toBe('weather');
  });

  it('axis 1: reactStep rejects empty tool name', async () => {
    await mock.startAgent({ sessionId: 'r4' });
    await expect(
      mock.reactStep({
        sessionId: 'r4',
        step: {
          thought: 't',
          action: { tool: '', input: 'x' },
          observation: 'o',
        },
      }),
    ).rejects.toThrow(/tool must not be empty/);
  });

  it('axis 1: reactStep can follow a reflect cycle', async () => {
    await mock.startAgent({ sessionId: 'r5' });
    await mock.reactStep({
      sessionId: 'r5',
      step: {
        thought: 't1',
        action: { tool: 'search', input: 'x' },
        observation: 'o1',
      },
    });
    await mock.reflect({
      sessionId: 'r5',
      reflect: { output: 'clean', critiqueRules: ['forbidden'] },
    });
    const r = await mock.reactStep({
      sessionId: 'r5',
      step: {
        thought: 't2',
        action: { tool: 'read', input: 'y' },
        observation: 'o2',
      },
    });
    expect(r.index).toBe(1);
    expect(r.traceLength).toBe(2);
  });

  it('axis 1: reactStep latency is positive', async () => {
    await mock.startAgent({ sessionId: 'r6' });
    const r = await mock.reactStep({
      sessionId: 'r6',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('axis 1: reactStep without startAgent fails with MISSING_SESSION', async () => {
    await expect(
      mock.reactStep({
        sessionId: 'missing',
        step: {
          thought: 't',
          action: { tool: 'search', input: 'x' },
          observation: 'o',
        },
      }),
    ).rejects.toThrow(/no session missing/);
  });
});

describe('mock adapter — ReAct session lifecycle', () => {
  it('axis 5: closeAgent records session history length', async () => {
    await mock.startAgent({ sessionId: 'c1' });
    await mock.reactStep({
      sessionId: 'c1',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    await mock.closeAgent({ sessionId: 'c1' });
    const trace = mock.traces().find((t) => t.op === 'closeAgent');
    expect(trace?.ok).toBe(true);
    expect(
      (trace?.detail as { historyLength?: number })?.historyLength,
    ).toBeGreaterThan(0);
  });

  it('axis 5: full ReAct ceremony records ordered ops', async () => {
    await mock.startAgent({ sessionId: 'c2' });
    await mock.reactStep({
      sessionId: 'c2',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    await mock.closeAgent({ sessionId: 'c2' });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual(['startAgent', 'reactStep', 'closeAgent']);
  });

  it('axis 5: startAgent twice throws DUPLICATE_SESSION', async () => {
    await mock.startAgent({ sessionId: 'c3' });
    await expect(mock.startAgent({ sessionId: 'c3' })).rejects.toThrow(
      /duplicate session c3/,
    );
  });
});

describe('real adapter — refuses without KIWA_MODE=real', () => {
  const originalMode = process.env['KIWA_MODE'];
  const originalKey = process.env['ANTHROPIC_API_KEY'];
  const originalBudget = process.env['KIWA_LLM_BUDGET_USD'];

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env['KIWA_MODE'];
    } else {
      process.env['KIWA_MODE'] = originalMode;
    }
    if (originalKey === undefined) {
      delete process.env['ANTHROPIC_API_KEY'];
    } else {
      process.env['ANTHROPIC_API_KEY'] = originalKey;
    }
    if (originalBudget === undefined) {
      delete process.env['KIWA_LLM_BUDGET_USD'];
    } else {
      process.env['KIWA_LLM_BUDGET_USD'] = originalBudget;
    }
  });

  it('default env reports KIWA_LLM_ENV_MISSING', () => {
    delete process.env['KIWA_MODE'];
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_ENV_MISSING');
  });

  it('KIWA_MODE=mock reports KIWA_MODE=mock', () => {
    process.env['KIWA_MODE'] = 'mock';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
  });

  it('KIWA_MODE=real without key reports ANTHROPIC_API_KEY_MISSING', () => {
    process.env['KIWA_MODE'] = 'real';
    delete process.env['ANTHROPIC_API_KEY'];
    delete process.env['KIWA_LLM_BUDGET_USD'];
    expect(detectRealEnvMissing()).toBe('ANTHROPIC_API_KEY_MISSING');
  });

  it('KIWA_MODE=real with key but no budget reports KIWA_LLM_BUDGET_USD_MISSING', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    delete process.env['KIWA_LLM_BUDGET_USD'];
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_MISSING');
  });

  it('KIWA_MODE=real with invalid budget reports KIWA_LLM_BUDGET_USD_INVALID', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = 'not-a-number';
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_INVALID');
  });

  it('KIWA_MODE=real with zero budget reports KIWA_LLM_BUDGET_USD_INVALID', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = '0';
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_INVALID');
  });

  it('all env set returns null (real available)', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = '10';
    expect(detectRealEnvMissing()).toBe(null);
  });

  it('real adapter reactStep refuses with env missing', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await expect(
      real.reactStep({
        sessionId: 'x',
        step: {
          thought: 't',
          action: { tool: 'search', input: 'x' },
          observation: 'o',
        },
      }),
    ).rejects.toThrow(/KIWA_LLM_ENV_MISSING/);
    const trace = real.traces().find((t) => t.op === 'reactStep');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_LLM_ENV_MISSING');
  });

  it('real adapter startAgent records refusal without throwing', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await real.startAgent({ sessionId: 'x' });
    const trace = real.traces().find((t) => t.op === 'startAgent');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_LLM_ENV_MISSING');
  });
});

describe('react route validator', () => {
  it('rejects non-object body', () => {
    const r = validateReactRequest('not-object');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId', () => {
    const r = validateReactRequest({ step: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects missing step', () => {
    const r = validateReactRequest({ sessionId: 's' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('step_required');
  });

  it('rejects missing step.action.tool', () => {
    const r = validateReactRequest({
      sessionId: 's',
      step: {
        thought: 't',
        observation: 'o',
        action: { tool: '', input: 'x' },
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('step.action.tool_required');
  });

  it('accepts valid request', () => {
    const r = validateReactRequest({
      sessionId: 's',
      step: {
        thought: 't',
        observation: 'o',
        action: { tool: 'search', input: 'x' },
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.step.action.tool).toBe('search');
  });
});

describe('react route handler', () => {
  it('handles reactStep end-to-end via mock', async () => {
    await mock.startAgent({ sessionId: 'h1' });
    const res = await handleReactRequest(mock, {
      sessionId: 'h1',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    expect(res.ok).toBe(true);
    expect(res.result?.index).toBe(0);
  });

  it('handles missing session with errorKind', async () => {
    const res = await handleReactRequest(mock, {
      sessionId: 'nope',
      step: {
        thought: 't',
        action: { tool: 'search', input: 'x' },
        observation: 'o',
      },
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
