/**
 * Provider-neutral chatbot surface for the dogfood app.
 *
 * The app talks to Anthropic only through this interface. Two implementations
 * exist — {@link makeRealAdapter} (calls `@anthropic-ai/sdk` when
 * `ANTHROPIC_API_KEY` is set, otherwise reports each method as
 * `ANTHROPIC_ENV_MISSING`) and {@link makeMockAdapter} (backed by
 * `@kiwa/ai-llm`'s {@link createAnthropicMock}). Both must satisfy the
 * same contract so behavioural fidelity between real vs mock can be measured
 * side-by-side and fed to `@kiwa/quality-metrics` 11-axis release gate.
 */

/** A completed chat turn — non-streaming. */
export interface ChatResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
  finishReason: 'stop' | 'tool_use' | 'length' | 'content_filter';
}

/** A streamed chat turn — collects SSE deltas + final usage. */
export interface StreamedChatResult {
  chunks: string[];
  full: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
}

/** A tool_use loop turn — captures every tool call the assistant issued. */
export interface ToolLoopResult {
  finalText: string;
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface ChatbotAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Non-streaming Messages API call with an optional system prompt.
   */
  reply(input: {
    userMessage: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<ChatResult>;

  /**
   * Streaming Messages API call — accumulates the SSE deltas into `chunks`
   * so the harness can diff token-by-token.
   */
  replyStream(input: {
    userMessage: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<StreamedChatResult>;

  /**
   * tool_use loop — the assistant may emit `tool_use` blocks that the app
   * resolves via `resolveTool`, then the loop continues until the assistant
   * returns a final text. The 2 tool sample (weather + calculator) mirrors
   * the AC in Issue #696.
   */
  toolLoop(input: {
    userMessage: string;
    systemPrompt?: string;
    tools: Array<{
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, { type: string; description?: string }>;
        required?: string[];
      };
    }>;
    resolveTool: (name: string, args: Record<string, unknown>) => Promise<string>;
    maxIterations?: number;
  }): Promise<ToolLoopResult>;

  /**
   * Rolling metric aggregate the adapter has seen since construction / reset.
   * Fed into the fidelity harness for real-vs-mock diff.
   */
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
