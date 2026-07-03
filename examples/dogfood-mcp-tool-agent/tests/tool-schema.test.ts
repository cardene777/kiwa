import { describe, expect, it } from 'vitest';
import { JsonRpcErrorCode, McpRpcError } from '@kiwa-test/mcp';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { ALL_TOOLS, TOOL_HANDLERS } from '../src/tools/schema.js';

describe('dogfood-mcp-tool-agent — tool schema + MCP JSON-RPC error semantics', () => {
  it('T-DFMCP-S-001 all 3 declared tools have handlers and object-typed inputSchemas', () => {
    expect(ALL_TOOLS).toHaveLength(3);
    for (const tool of ALL_TOOLS) {
      expect(TOOL_HANDLERS[tool.name]).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('T-DFMCP-S-002 valid weather args return a text content block with the temperature string', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    const result = await adapter.callTool('weather', { city: 'tokyo', unit: 'celsius' });
    expect(result.isError).toBe(false);
    expect(result.content[0]).toEqual({ type: 'text', text: 'tokyo: 22C, sunny' });
    await adapter.reset();
  });

  it('T-DFMCP-S-003 valid calculator args round-trip 4 arithmetic ops with expected results', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    const cases = [
      { op: 'add', a: 2, b: 3, expected: '5' },
      { op: 'subtract', a: 10, b: 4, expected: '6' },
      { op: 'multiply', a: 6, b: 7, expected: '42' },
      { op: 'divide', a: 20, b: 5, expected: '4' },
    ];
    for (const c of cases) {
      const result = await adapter.callTool('calculator', {
        op: c.op,
        a: c.a,
        b: c.b,
      });
      expect(result.isError).toBe(false);
      expect(result.content[0]).toEqual({ type: 'text', text: c.expected });
    }
    await adapter.reset();
  });

  it('T-DFMCP-S-004 invalid weather args (missing required city) surface ToolSchemaError -32001', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    await expect(adapter.callTool('weather', {})).rejects.toMatchObject({
      code: JsonRpcErrorCode.ToolSchemaError,
    });
    await adapter.reset();
  });

  it('T-DFMCP-S-005 unknown tool name surfaces ToolNotFound -32003', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    try {
      await adapter.callTool('not-a-real-tool', {});
      throw new Error('expected McpRpcError');
    } catch (err) {
      expect(err).toBeInstanceOf(McpRpcError);
      expect((err as McpRpcError).code).toBe(JsonRpcErrorCode.ToolNotFound);
    }
    await adapter.reset();
  });

  it('T-DFMCP-S-006 calculator divide-by-zero surfaces ToolExecutionError -32000 (handler throw path)', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    try {
      await adapter.callTool('calculator', { op: 'divide', a: 5, b: 0 });
      throw new Error('expected divide-by-zero to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(McpRpcError);
      expect((err as McpRpcError).code).toBe(JsonRpcErrorCode.ToolExecutionError);
      expect((err as McpRpcError).message).toContain('division by zero');
    }
    await adapter.reset();
  });

  it('T-DFMCP-S-007 search returns top-N docs ordered by word overlap score', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    const result = await adapter.callTool('search', { query: 'typhoon japan', limit: 2 });
    expect(result.isError).toBe(false);
    const text = (result.content[0] as { text: string }).text;
    // The corpus doc-3 is titled "Typhoon Nari approaches Kanto" and its
    // text contains "typhoon japan" — it must rank first.
    expect(text.split('\n')[0]).toContain('doc-3');
  });
});
