import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runParallelWeatherFlow } from '../src/flows/agent-flows.js';

/**
 * Task 3.3 — the mock must preserve OpenAI's parallel tool_calls semantics.
 * The agent asks about the weather in two cities in the same turn; the
 * model returns two `get_weather` tool_calls in a single assistant message,
 * the app resolves them concurrently, and the loop terminates on turn 2.
 *
 * Real mode is optional — when skipped the assertion set collapses to
 * "mock behaves as expected" (the fidelity harness records the divergence).
 */
describe('dogfood-openai-tool-agent — parallel tool use (Task 3.3)', () => {
  it('T-DFO-PAR-001 mock emits both get_weather calls in a single turn', async () => {
    const mock = makeMockAdapter();
    const result = await runParallelWeatherFlow(mock);
    expect(result.parallelBatches).toEqual([2]);
    expect(result.toolCallOrder).toHaveLength(2);
    expect(result.toolCallOrder.every((n) => n === 'get_weather')).toBe(true);
    await mock.reset();
  });

  it('T-DFO-PAR-002 mock produces distinct tool_call ids for the parallel batch', async () => {
    const mock = makeMockAdapter();
    const result = await runParallelWeatherFlow(mock);
    const ids = result.steps[0]?.toolCalls.map((c) => c.id) ?? [];
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(ids.length);
    await mock.reset();
  });

  it('T-DFO-PAR-003 real adapter records skip when key absent', async () => {
    const original = process.env['OPENAI_API_KEY'];
    delete process.env['OPENAI_API_KEY'];
    try {
      const real = makeRealAdapter();
      await expect(runParallelWeatherFlow(real)).rejects.toThrow(/OPENAI_API_KEY/);
    } finally {
      if (original !== undefined) process.env['OPENAI_API_KEY'] = original;
    }
  });

  it('T-DFO-PAR-004 finalisation turn incorporates both tool results', async () => {
    const mock = makeMockAdapter();
    const result = await runParallelWeatherFlow(mock);
    expect(result.finalText.toLowerCase()).toContain('tokyo');
    expect(result.finalText.toLowerCase()).toContain('washington');
    expect(result.finishReason).toBe('stop');
    // Both cities' temperatures make it into the answer.
    expect(result.finalText).toContain('22C');
    expect(result.finalText).toContain('24C');
    await mock.reset();
  });

  it('T-DFO-PAR-005 parallel batch results feed the same conversation turn', async () => {
    const mock = makeMockAdapter();
    const result = await runParallelWeatherFlow(mock);
    // Step 0 has the tool calls + matching tool results.
    const step0 = result.steps[0]!;
    expect(step0.toolCalls).toHaveLength(2);
    expect(step0.toolResults).toHaveLength(2);
    // Tool results are keyed by the tool_call id.
    for (const call of step0.toolCalls) {
      const match = step0.toolResults.find((r) => r.toolCallId === call.id);
      expect(match).toBeDefined();
    }
    await mock.reset();
  });
});
