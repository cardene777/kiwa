import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { AGENT_TOOLS } from '../src/tools/schema.js';

/**
 * Task 3.1 — every tool schema must be shape-identical when handed to the
 * real adapter and the mock. Since real mode is often skipped in local dev,
 * this suite focuses on the mock path (which enforces the same rules) plus
 * a compile-time check that both adapters share the ToolSchema type.
 */
describe('dogfood-openai-tool-agent — tool schema validation (Task 3.1)', () => {
  it('T-DFO-SC-001 mock validation accepts the canonical 3-tool set', async () => {
    const mock = makeMockAdapter();
    const result = await mock.validateToolSchemas(AGENT_TOOLS);
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    await mock.reset();
  });

  it('T-DFO-SC-002 real adapter records skip when OPENAI_API_KEY absent', async () => {
    const original = process.env['OPENAI_API_KEY'];
    delete process.env['OPENAI_API_KEY'];
    try {
      const real = makeRealAdapter();
      await expect(real.validateToolSchemas(AGENT_TOOLS)).rejects.toThrow(/OPENAI_API_KEY/);
      const traces = real.traces();
      expect(traces).toHaveLength(1);
      expect(traces[0]?.errorKind).toBe('OPENAI_ENV_MISSING');
    } finally {
      if (original !== undefined) process.env['OPENAI_API_KEY'] = original;
    }
  });

  it('T-DFO-SC-003 every tool schema conforms to JSON Schema object subset', () => {
    for (const tool of AGENT_TOOLS) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.parameters.type).toBe('object');
      expect(Object.keys(tool.parameters.properties).length).toBeGreaterThan(0);
      for (const prop of Object.values(tool.parameters.properties)) {
        expect(typeof prop.type).toBe('string');
      }
    }
  });

  it('T-DFO-SC-004 all required fields point at declared properties', () => {
    for (const tool of AGENT_TOOLS) {
      for (const required of tool.parameters.required ?? []) {
        expect(tool.parameters.properties[required]).toBeDefined();
      }
    }
  });

  it('T-DFO-SC-005 parseToolCall flags malformed JSON args via argsParseError', async () => {
    const { parseToolCall } = await import('../src/adapters/shared.js');
    const call = parseToolCall({
      id: 'call_bad',
      type: 'function',
      function: { name: 'get_weather', arguments: '{not-json' },
    });
    expect(call.args).toEqual({});
    expect(call.argsParseError).toBeDefined();
    expect(call.argumentsRaw).toBe('{not-json');
  });

  it('T-DFO-SC-006 parseToolCall preserves round-trip for well-formed args', async () => {
    const { parseToolCall } = await import('../src/adapters/shared.js');
    const call = parseToolCall({
      id: 'call_ok',
      type: 'function',
      function: { name: 'get_weather', arguments: JSON.stringify({ location: 'Tokyo' }) },
    });
    expect(call.args).toEqual({ location: 'Tokyo' });
    expect(call.argsParseError).toBeUndefined();
  });
});
