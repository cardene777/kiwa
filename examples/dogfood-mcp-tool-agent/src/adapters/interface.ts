/**
 * Provider-neutral MCP tool-agent surface for the dogfood app.
 *
 * The agent talks to the MCP server + LLM only through this interface. Two
 * implementations exist — {@link makeRealAdapter} (spawns a real
 * `@modelcontextprotocol/sdk` stdio server + optional real Anthropic Messages
 * API when `ANTHROPIC_API_KEY` is set, otherwise reports each method as
 * `MCP_REAL_ENV_MISSING`) and {@link makeMockAdapter} (backed by
 * `@kiwa/mcp` `McpServer` + `@kiwa/ai-llm` `createAnthropicMock`).
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to
 * `@kiwa/quality-metrics` 11-axis release gate.
 *
 * The 3 ops this contract supports mirror the AC in Issue #750 — MCP
 * handshake (initialize + tools/list) + tool call chain (weather / calc /
 * search) + Claude-driven tool orchestration.
 */

import type { McpTool, ToolCallResult } from '@kiwa/mcp';

/** A single tool_use block the LLM asked the agent to execute via MCP. */
export interface AgentToolCall {
  /** LLM-issued call id (e.g. `toolu_abc123`), preserved for round-trip. */
  id: string;
  /** Tool name — must match one of the MCP-registered tools. */
  name: string;
  /** Parsed args. Empty object if the LLM produced no arguments. */
  args: Record<string, unknown>;
}

/** MCP tools/call result, echoed back through the tool loop as tool_result. */
export interface AgentToolResult {
  /** The `toolu_...` id the assistant emitted, matched back to a call. */
  toolUseId: string;
  /** MCP tool name that produced the result. */
  toolName: string;
  /** Extracted text content (concatenated text blocks from MCP result). */
  text: string;
  /** True when the MCP server returned isError: true or the client threw. */
  isError: boolean;
}

/** One iteration of the tool-use loop — an assistant turn + resolved MCP tool calls. */
export interface AgentLoopStep {
  iteration: number;
  toolCalls: AgentToolCall[];
  toolResults: AgentToolResult[];
  finishReason: 'end_turn' | 'tool_use' | 'max_tokens';
  costUsd: number;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Terminal state after the loop completes. */
export interface AgentLoopResult {
  finalText: string;
  steps: AgentLoopStep[];
  toolCallOrder: string[];
  parallelBatches: number[];
  totalCostUsd: number;
  totalLatencyMs: number;
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'end_turn' | 'max_tokens' | 'iteration_cap';
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences (fidelity harness input).
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral MCP tool-agent contract. Every method emits at least one
 * trace event so the fidelity harness has a shape to diff.
 */
export interface McpAgentAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Handshake — run the MCP `initialize` request and stash the negotiated
   * protocol version. Must be called before {@link listTools} / {@link callTool}
   * in real MCP; the mock enforces the same order for parity.
   */
  handshake(): Promise<{
    protocolVersion: string;
    serverName: string;
    serverVersion: string;
  }>;

  /**
   * MCP `tools/list` — return the tool definitions the server advertises.
   * Should match the 3 registered tools (weather / calculator / search).
   */
  listTools(): Promise<McpTool[]>;

  /**
   * MCP `tools/call` — invoke 1 tool by name, MCP validates the schema
   * before the handler runs. Returns the raw `ToolCallResult` so the harness
   * can inspect `isError` + `content` shape.
   */
  callTool(name: string, args?: Record<string, unknown>): Promise<ToolCallResult>;

  /**
   * Drive an Anthropic Claude tool-use loop where every tool call is routed
   * through the MCP client. The LLM emits `tool_use` blocks whose `name` maps
   * to an MCP-registered tool; the adapter forwards them to {@link callTool}
   * and feeds `tool_result` blocks back. Repeats until the LLM returns a plain
   * text response or `maxIterations` (default 5) is hit.
   */
  runMcpToolLoop(input: {
    userMessage: string;
    systemPrompt?: string;
    maxIterations?: number;
  }): Promise<AgentLoopResult>;

  /** Rolling metric aggregate seen since construction / last reset. */
  metrics(): {
    totalCostUsd: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalToolCalls: number;
    latencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
