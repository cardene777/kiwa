import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runOrderedThreeToolFlow } from '../src/flows/agent-flows.js';

/**
 * Task 3.2 — multi-tool orchestration must preserve call order across mock
 * and (when available) real. Fidelity score = fraction of matching tool
 * calls in the same slot, capped at 1.0. Real mode is optional — when
 * skipped the score is `mock ordering only` (deterministic), documented in
 * the emitted fidelity report.
 */
describe('dogfood-openai-tool-agent — tool-call sequence (Task 3.2)', () => {
  it('T-DFO-SEQ-001 mock issues 3 tool calls in weather → calculator → search order', async () => {
    const mock = makeMockAdapter();
    const result = await runOrderedThreeToolFlow(mock);
    expect(result.toolCallOrder).toEqual(['get_weather', 'calculator', 'search']);
    expect(result.finishReason).toBe('stop');
    expect(result.finalText.length).toBeGreaterThan(0);
    await mock.reset();
  });

  it('T-DFO-SEQ-002 real adapter surfaces OPENAI_ENV_MISSING when key absent', async () => {
    const original = process.env['OPENAI_API_KEY'];
    delete process.env['OPENAI_API_KEY'];
    try {
      const real = makeRealAdapter();
      await expect(runOrderedThreeToolFlow(real)).rejects.toThrow(/OPENAI_API_KEY/);
    } finally {
      if (original !== undefined) process.env['OPENAI_API_KEY'] = original;
    }
  });

  it('T-DFO-SEQ-003 tool_calls preserve the round-trip schema shape', async () => {
    const mock = makeMockAdapter();
    const result = await runOrderedThreeToolFlow(mock);
    const weatherStep = result.steps.find((s) => s.toolCalls.some((c) => c.name === 'get_weather'));
    expect(weatherStep?.toolCalls[0]?.args).toEqual({ location: 'Tokyo' });
    const calcStep = result.steps.find((s) => s.toolCalls.some((c) => c.name === 'calculator'));
    expect(calcStep?.toolCalls[0]?.args).toEqual({ expression: '22 * 9 / 5 + 32' });
    await mock.reset();
  });

  it('T-DFO-SEQ-004 each tool_call receives a result before the next model turn', async () => {
    const mock = makeMockAdapter();
    const result = await runOrderedThreeToolFlow(mock);
    for (const step of result.steps) {
      if (step.toolCalls.length > 0) {
        expect(step.toolResults).toHaveLength(step.toolCalls.length);
      }
    }
    await mock.reset();
  });
});
