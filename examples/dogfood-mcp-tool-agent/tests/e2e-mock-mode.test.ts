import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { McpAgentAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  callEachToolDirectly,
  performHandshakeAndDiscover,
  runClaudeMcpChain,
  warmMcpRoundtrip,
} from '../src/flows/agent-flows.js';

let adapter: McpAgentAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-mcp-tool-agent (mock mode) — MCP handshake + tools/list + tools/call + Claude tool-use loop', () => {
  it('T-DFMCP-M-001 performHandshakeAndDiscover negotiates 2024-11-05 protocol and lists 3 tools', async () => {
    const result = await performHandshakeAndDiscover(adapter);
    expect(result.protocolVersion).toBe('2024-11-05');
    expect(result.serverName).toBe('kiwa-mcp-mock');
    expect(result.toolNames).toEqual(
      expect.arrayContaining(['weather', 'calculator', 'search']),
    );
    expect(result.toolNames).toHaveLength(3);
  });

  it('T-DFMCP-M-002 runClaudeMcpChain drives 3 tool calls in weather -> calculator -> search order and returns finalisation text', async () => {
    const result = await runClaudeMcpChain(adapter);
    expect(result.toolCallOrder).toEqual(['weather', 'calculator', 'search']);
    expect(result.finalText.length).toBeGreaterThan(0);
    // Finalisation text must reference the tool outputs (Tokyo weather + typhoon news doc).
    expect(result.finalText.toLowerCase()).toContain('tokyo');
    expect(result.finalText.toLowerCase()).toContain('typhoon');
    expect(result.totalCostUsd).toBeGreaterThan(0);
    expect(result.totalToolCalls).toBe(3);
  });

  it('T-DFMCP-M-003 callEachToolDirectly roundtrips every tool and raises a JSON-RPC error on missing required arg', async () => {
    const result = await callEachToolDirectly(adapter);
    expect(result.weatherText).toContain('tokyo');
    // 22 * 1.8 = 39.6 (mock calculator answer for the Fahrenheit conversion)
    expect(result.calcText).toBe('39.6');
    expect(result.searchText).toContain('doc-');
    expect(result.errorRaised).toBe(true);
  });

  it('T-DFMCP-M-004 handshake trace records protocol version + tool count', async () => {
    await adapter.handshake();
    const traces = adapter.traces();
    const handshake = traces.find((t) => t.op === 'handshake');
    expect(handshake).toBeDefined();
    expect(handshake?.ok).toBe(true);
    expect(handshake?.detail?.['protocolVersion']).toBe('2024-11-05');
    expect(handshake?.detail?.['toolCount']).toBe(3);
  });

  it('T-DFMCP-M-005 metrics roll up across multiple flows and count tool calls separately from LLM requests', async () => {
    await performHandshakeAndDiscover(adapter);
    await runClaudeMcpChain(adapter);
    const m = adapter.metrics();
    expect(m.requests).toBeGreaterThanOrEqual(1);
    expect(m.totalCostUsd).toBeGreaterThan(0);
    expect(m.totalTokens).toBeGreaterThan(0);
    // Claude loop fires 3 tool_use blocks -> 3 MCP tools/call ops.
    expect(m.totalToolCalls).toBe(3);
  });

  it('T-DFMCP-M-006 reset clears traces + metrics + reconnects a fresh MCP client', async () => {
    await performHandshakeAndDiscover(adapter);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().totalToolCalls).toBeGreaterThanOrEqual(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().totalToolCalls).toBe(0);
    // Post-reset handshake succeeds — the adapter re-creates the MCP server.
    const post = await performHandshakeAndDiscover(adapter);
    expect(post.toolNames).toHaveLength(3);
  });

  it('T-DFMCP-M-007 warmMcpRoundtrip hits all 3 tools without invoking the LLM', async () => {
    const before = adapter.metrics().requests;
    const result = await warmMcpRoundtrip(adapter);
    const after = adapter.metrics();
    expect(result.toolCount).toBe(3);
    // No LLM request was necessary — the warm-up talks straight to MCP.
    expect(after.requests).toBe(before);
    expect(after.totalToolCalls).toBe(3);
  });
});
