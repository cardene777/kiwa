import type { McpAgentAdapter } from '../adapters/interface.js';
import { ALL_TOOLS } from '../tools/schema.js';

/**
 * User-facing MCP tool-agent flows the dogfood app exposes. Each flow talks
 * only through {@link McpAgentAdapter} so the same code powers both
 * `KIWA_MODE=real` (real MCP server + real Anthropic) and `KIWA_MODE=mock`
 * (`@kiwa-test/mcp` in-process + `@kiwa-test/ai-llm` `createAnthropicMock`).
 *
 * The 3 flows below mirror the AC in Issue #750 —
 * Task 1: MCP handshake + tools/list assertion
 * Task 2: 3-tool orchestrated call chain via Anthropic
 * Task 3: individual `tools/call` roundtrip + isError path
 */

/**
 * Flow 1 (Task 1) — MCP handshake + tools/list. The adapter runs the
 * `initialize` op, then asks the server for its tool inventory, and the
 * flow returns the negotiated protocol version + tool count so the test
 * can assert on both.
 */
export async function performHandshakeAndDiscover(
  adapter: McpAgentAdapter,
): Promise<{
  protocolVersion: string;
  serverName: string;
  toolNames: string[];
}> {
  const info = await adapter.handshake();
  const tools = await adapter.listTools();
  return {
    protocolVersion: info.protocolVersion,
    serverName: info.serverName,
    toolNames: tools.map((t) => t.name),
  };
}

/**
 * Flow 2 (Task 2) — Anthropic Claude drives the 3-tool chain via MCP. The
 * user prompt is the canonical dogfood scenario: "Fetch the weather in
 * Tokyo, convert the temperature to Fahrenheit, and search for typhoon-
 * related news." The LLM emits 3 `tool_use` blocks across 3 turns, each
 * forwarded to the MCP server; the final turn is a plain text answer.
 */
export async function runClaudeMcpChain(
  adapter: McpAgentAdapter,
): Promise<{
  finalText: string;
  toolCallOrder: string[];
  totalCostUsd: number;
  totalToolCalls: number;
}> {
  await adapter.handshake();
  const result = await adapter.runMcpToolLoop({
    userMessage:
      'Fetch the weather in Tokyo, convert the temperature to Fahrenheit, and search for typhoon-related news.',
  });
  return {
    finalText: result.finalText,
    toolCallOrder: result.toolCallOrder,
    totalCostUsd: result.totalCostUsd,
    totalToolCalls: result.toolCallOrder.length,
  };
}

/**
 * Flow 3 (Task 3) — direct `tools/call` roundtrip. Exercises the JSON-RPC
 * `tools/call` op with a valid arg set for each of the 3 tools, then
 * deliberately triggers a schema validation error (weather with a
 * missing `city` field) so the fidelity harness can compare the mock's
 * `ToolSchemaError` code with the real MCP server's error shape.
 */
export async function callEachToolDirectly(
  adapter: McpAgentAdapter,
): Promise<{
  weatherText: string;
  calcText: string;
  searchText: string;
  errorRaised: boolean;
}> {
  await adapter.handshake();

  const weatherRes = await adapter.callTool('weather', { city: 'tokyo' });
  const calcRes = await adapter.callTool('calculator', { op: 'multiply', a: 22, b: 1.8 });
  const searchRes = await adapter.callTool('search', { query: 'typhoon japan' });

  const weatherText = extractText(weatherRes);
  const calcText = extractText(calcRes);
  const searchText = extractText(searchRes);

  let errorRaised = false;
  try {
    // Missing required `city` field should throw a McpRpcError (mock) or
    // an equivalent JSON-RPC error object (real). Both branches record a
    // failing trace entry, which the fidelity harness diffs.
    await adapter.callTool('weather', {});
  } catch {
    errorRaised = true;
  }

  return { weatherText, calcText, searchText, errorRaised };
}

/**
 * Convenience helper for the perf harness — hits every declared MCP tool
 * once without the full LLM loop, so latency measurement isolates the
 * MCP roundtrip cost from the mock LLM cost.
 */
export async function warmMcpRoundtrip(
  adapter: McpAgentAdapter,
): Promise<{ toolCount: number }> {
  await adapter.handshake();
  await adapter.listTools();
  for (const tool of ALL_TOOLS) {
    const args = defaultArgsFor(tool.name);
    await adapter.callTool(tool.name, args);
  }
  return { toolCount: ALL_TOOLS.length };
}

function defaultArgsFor(name: string): Record<string, unknown> {
  switch (name) {
    case 'weather':
      return { city: 'tokyo' };
    case 'calculator':
      return { op: 'add', a: 1, b: 2 };
    case 'search':
      return { query: 'kiwa mcp' };
    default:
      return {};
  }
}

function extractText(
  result: import('@kiwa-test/mcp').ToolCallResult,
): string {
  return result.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('');
}
