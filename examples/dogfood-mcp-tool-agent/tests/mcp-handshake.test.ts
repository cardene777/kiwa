import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { ALL_TOOLS } from '../src/tools/schema.js';

describe('dogfood-mcp-tool-agent — MCP handshake + tools/list op assertions', () => {
  it('T-DFMCP-H-001 handshake returns a stable protocol + server info shape', async () => {
    const adapter = makeMockAdapter();
    const info = await adapter.handshake();
    expect(info.protocolVersion).toBe('2024-11-05');
    expect(info.serverName).toBe('kiwa-mcp-mock');
    expect(info.serverVersion).toBe('0.1.0');
    await adapter.reset();
  });

  it('T-DFMCP-H-002 tools/list returns the 3 declared tools with valid inputSchema shape', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    const tools = await adapter.listTools();
    expect(tools).toHaveLength(ALL_TOOLS.length);
    for (const declared of ALL_TOOLS) {
      const found = tools.find((t) => t.name === declared.name);
      expect(found, `tool ${declared.name} not listed`).toBeDefined();
      expect(found?.inputSchema.type).toBe('object');
      expect(found?.inputSchema.properties).toBeDefined();
      expect(Array.isArray(found?.inputSchema.required)).toBe(true);
    }
    await adapter.reset();
  });

  it('T-DFMCP-H-003 listTools before handshake still runs when handshake is already latched by ensureClient', async () => {
    // ensureClient inside the mock adapter runs initialize eagerly the first
    // time either op is called, so a listTools-first sequence still succeeds
    // and mirrors how real MCP client libraries auto-handshake on connect.
    const adapter = makeMockAdapter();
    const tools = await adapter.listTools();
    expect(tools.length).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DFMCP-H-004 handshake traces record the negotiated tool count for the fidelity harness', async () => {
    const adapter = makeMockAdapter();
    await adapter.handshake();
    const traces = adapter.traces();
    const handshake = traces.find((t) => t.op === 'handshake');
    expect(handshake?.detail?.['toolCount']).toBe(3);
    await adapter.reset();
  });
});
