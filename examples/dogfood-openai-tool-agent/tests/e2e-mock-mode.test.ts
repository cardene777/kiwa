import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AgentAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  runOrderedThreeToolFlow,
  runParallelWeatherFlow,
  validateAllToolSchemas,
} from '../src/flows/agent-flows.js';
import { AGENT_TOOLS } from '../src/tools/schema.js';

let adapter: AgentAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-openai-tool-agent (mock mode) — schema + tool-call sequence + parallel tool call', () => {
  it('T-DFO-M-001 validateToolSchemas accepts every declared tool schema', async () => {
    const result = await validateAllToolSchemas(adapter);
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('T-DFO-M-002 validateToolSchemas rejects malformed schemas', async () => {
    const bad = [
      {
        name: 'bad_tool',
        description: 'missing properties',
        parameters: { type: 'object' as const, properties: {} },
      },
    ];
    const result = await adapter.validateToolSchemas(bad);
    expect(result.ok).toBe(false);
    expect(result.failures[0]?.tool).toBe('bad_tool');
  });

  it('T-DFO-M-003 runOrderedThreeToolFlow chains weather → calculator → search in order', async () => {
    const result = await runOrderedThreeToolFlow(adapter);
    expect(result.toolCallOrder).toEqual(['get_weather', 'calculator', 'search']);
    expect(result.finishReason).toBe('stop');
    expect(result.finalText.toLowerCase()).toContain('tokyo');
    expect(result.finalText).toContain('71.6');
    expect(result.totalUsage.totalTokens).toBeGreaterThan(0);
    expect(result.totalCostUsd).toBeGreaterThan(0);
  });

  it('T-DFO-M-004 runOrderedThreeToolFlow terminates within maxIterations (default 5)', async () => {
    const result = await runOrderedThreeToolFlow(adapter);
    expect(result.steps.length).toBeGreaterThanOrEqual(3);
    expect(result.steps.length).toBeLessThanOrEqual(5);
    // Last step must be a terminal `stop` — no runaway loop.
    expect(result.steps[result.steps.length - 1]?.finishReason).toBe('stop');
  });

  it('T-DFO-M-005 runParallelWeatherFlow emits two get_weather calls in a single turn', async () => {
    const result = await runParallelWeatherFlow(adapter);
    expect(result.parallelBatches).toEqual([2]);
    expect(result.toolCallOrder).toEqual(['get_weather', 'get_weather']);
    expect(result.finalText.toLowerCase()).toContain('tokyo');
    expect(result.finalText.toLowerCase()).toContain('washington');
    expect(result.finishReason).toBe('stop');
  });

  it('T-DFO-M-006 metrics roll up across multiple flows', async () => {
    await validateAllToolSchemas(adapter);
    await runOrderedThreeToolFlow(adapter);
    await runParallelWeatherFlow(adapter);
    const m = adapter.metrics();
    // schema probe = 3 requests, tool loop = 4 requests, parallel = 2 requests
    expect(m.requests).toBeGreaterThanOrEqual(8);
    expect(m.totalCostUsd).toBeGreaterThan(0);
    expect(m.totalTokens).toBeGreaterThan(0);
    expect(m.latencySamplesMs.length).toBe(m.requests);
  });

  it('T-DFO-M-007 reset clears traces + metrics', async () => {
    await runOrderedThreeToolFlow(adapter);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
  });

  it('T-DFO-M-008 AGENT_TOOLS declares exactly 3 tools with distinct names', async () => {
    const names = AGENT_TOOLS.map((t) => t.name);
    expect(names).toEqual(['get_weather', 'calculator', 'search']);
    expect(new Set(names).size).toBe(names.length);
  });
});
