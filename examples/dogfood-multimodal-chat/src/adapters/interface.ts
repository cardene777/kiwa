/**
 * Provider-neutral multimodal chat surface for the dogfood app.
 *
 * The app talks to Anthropic vision only through this interface. Two
 * implementations exist — {@link makeRealAdapter} (fetches Anthropic
 * Messages API with `image` content blocks when `ANTHROPIC_API_KEY` is
 * set, otherwise reports each method as `ANTHROPIC_ENV_MISSING`) and
 * {@link makeMockAdapter} (backed by `@kiwa-lab/ai-llm`
 * `createAnthropicMock` with `MessagePart` image support). Both must
 * satisfy the same contract so behavioural fidelity between real vs mock
 * can be measured side-by-side and fed to `@kiwa-lab/quality-metrics`
 * 11-axis release gate.
 *
 * The 4 flows this contract supports mirror the AC in Issue #749 —
 * image upload + streaming response + cost tracking + multi-image
 * comparison.
 */

/** Image reference — base64 (data uploaded by the user) or url (host image). */
export type ImageRef =
  | { kind: 'base64'; mediaType: string; data: string }
  | { kind: 'url'; url: string };

/** A completed vision reply — non-streaming. */
export interface VisionResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'content_filter';
  /**
   * Approximate cost breakdown so the UI can render "image tokens dominated
   * cost" style hints. Mock uses estimateMultimodalTokens (default 1500 per
   * image × detail factor); real reads from usage.input_tokens diff.
   */
  imageTokenEstimate: number;
}

/** A streamed vision reply — collects SSE deltas + final usage. */
export interface StreamedVisionResult {
  chunks: string[];
  full: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
  imageTokenEstimate: number;
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

export interface VisionChatAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Non-streaming vision call — 1 image + text prompt.
   */
  describeImage(input: {
    image: ImageRef;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    detail?: 'low' | 'high' | 'auto';
  }): Promise<VisionResult>;

  /**
   * Streaming vision call — 1 image + text prompt, SSE deltas.
   */
  streamDescribeImage(input: {
    image: ImageRef;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    detail?: 'low' | 'high' | 'auto';
  }): Promise<StreamedVisionResult>;

  /**
   * Non-streaming vision call with N images — cost tracking dominates.
   * The comparison flow uses this to prove multi-image scaling.
   */
  compareImages(input: {
    images: ImageRef[];
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    detail?: 'low' | 'high' | 'auto';
  }): Promise<VisionResult>;

  /**
   * Rolling metric aggregate the adapter has seen since construction / reset.
   * Fed into the fidelity harness for real-vs-mock diff.
   */
  metrics(): {
    totalCostUsd: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalImageTokens: number;
    latencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
