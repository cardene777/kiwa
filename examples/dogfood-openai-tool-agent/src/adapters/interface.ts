/**
 * Provider-neutral tool-agent surface for the dogfood app.
 *
 * The agent talks to OpenAI only through this interface. Two implementations
 * exist — {@link makeRealAdapter} (calls the real OpenAI Chat Completions
 * endpoint when `OPENAI_API_KEY` is set, otherwise reports each method as
 * `OPENAI_ENV_MISSING`) and {@link makeMockAdapter} (backed by
 * `@kiwa-lab/ai-llm`'s {@link createOpenAIMock}). Both must satisfy the
 * same contract so behavioural fidelity between real vs mock can be measured
 * side-by-side and fed to `@kiwa-lab/quality-metrics` 11-axis release gate.
 */

import type { ToolSchema } from '../tools/schema.js';

/** A single tool_call the model asked the agent to execute. */
export interface AgentToolCall {
  /** OpenAI-issued call id (e.g. `call_abc123`), preserved for round-trip. */
  id: string;
  /** Tool name — must match one of the declared schemas. */
  name: string;
  /** Arguments as raw JSON string (OpenAI-native form). */
  argumentsRaw: string;
  /** Parsed args when the model returned valid JSON, empty object otherwise. */
  args: Record<string, unknown>;
  /**
   * Set when `argumentsRaw` could not be JSON-parsed — downstream can flag
   * bad model output instead of silently routing the tool with defaults.
   */
  argsParseError?: string;
}

/** One iteration of the tool-use loop — an assistant turn + resolved tools. */
export interface AgentLoopStep {
  iteration: number;
  toolCalls: AgentToolCall[];
  toolResults: Array<{ toolCallId: string; result: string }>;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  costUsd: number;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Terminal state after the loop completes (finish_reason === 'stop'). */
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
  finishReason: 'stop' | 'length' | 'content_filter' | 'iteration_cap';
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences (Task 3.1 fidelity harness input).
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface AgentAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Validate that every declared tool schema conforms to the OpenAI
   * function-calling contract (JSON Schema subset). Adapters may also
   * exercise a lightweight round-trip against the provider to confirm the
   * schema is accepted. Failures append a trace event with `errorKind`.
   */
  validateToolSchemas(tools: ToolSchema[]): Promise<{
    ok: boolean;
    failures: Array<{ tool: string; reason: string }>;
  }>;

  /**
   * Drive a full tool-use loop. Asks the model, executes any tool_calls
   * emitted, feeds results back, repeats until the model returns a plain
   * text answer or `maxIterations` is reached (default 5, matches AC 2.5).
   */
  runToolLoop(input: {
    userMessage: string;
    systemPrompt?: string;
    tools: ToolSchema[];
    executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
    maxIterations?: number;
  }): Promise<AgentLoopResult>;

  /**
   * Run the parallel tool-call turn (AC Task 3.3) — the model is expected
   * to emit multiple `get_weather` tool_calls in a single assistant turn
   * (one per location) which the loop resolves as a batch. Verifies that
   * the mock preserves OpenAI's parallel-tool-call semantics.
   */
  runParallelToolCall(input: {
    userMessage: string;
    tools: ToolSchema[];
    executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
  }): Promise<AgentLoopResult>;

  /** Rolling metric aggregate seen since construction / last reset. */
  metrics(): {
    totalCostUsd: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    latencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
