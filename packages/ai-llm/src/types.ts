/**
 * Shared types for `@kiwa-test/ai-llm` — 4 SDK 統一 mock の共通契約。
 *
 * v1.12 milestone (Issue #695) で新設。 kiwa の思想 = 「1 度書けば 4 SDK
 * 同一挙動で回せる mock」 を実現するため、 provider agnostic な message /
 * tool / usage の型を SSOT にする。
 *
 * SDK 別 adapter (`anthropic.ts` / `openai.ts` / `vercel-ai.ts` /
 * `langchain.ts`) は本ファイルの共通型を SDK 固有の shape に変換する
 * 薄い層に留める。
 */

/** Chat message role — 4 SDK 全てで共通。 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Provider agnostic chat message。 tool_call / tool_result は
 * `toolCalls` / `toolCallId` field で表現する。
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  /** assistant message が tool_use を持つ場合の呼出 payload。 */
  toolCalls?: ToolCall[];
  /** role === 'tool' のとき、 元の tool_call を紐付ける id。 */
  toolCallId?: string;
  /** tool 名 (role === 'tool' のとき使用)。 */
  name?: string;
}

/**
 * Tool 定義 — 4 SDK で shape が違うため、 本 harness では JSON Schema
 * ベースの共通形式で保持する。
 */
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema (subset)。 */
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

/** Assistant が生成する tool_use / function_call の統一表現。 */
export interface ToolCall {
  id: string;
  name: string;
  /** arguments は JSON.stringify 済の文字列で保持する。 */
  arguments: string;
}

/** LLM 呼出の token 使用量。 */
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** 1 回の chat request 結果 (non-streaming)。 */
export interface ChatCompletion {
  /** assistant 生成 message (通常 role='assistant')。 */
  message: ChatMessage;
  usage: Usage;
  /** 実測 US$ (mock は固定 rate、 real は SDK 実測)。 */
  costUsd: number;
  /** 実測 latency (ms、 mock は artificial delay、 real は wall clock)。 */
  latencyMs: number;
  /** stop / tool_use / length など終了理由。 */
  finishReason: 'stop' | 'tool_use' | 'length' | 'content_filter';
}

/** streaming で観測される 1 event (delta)。 */
export interface StreamEvent {
  /** 差分文字列 (finish 時は空文字列)。 */
  delta: string;
  /** stream 終了 event。 */
  done: boolean;
  /** stream 終了時のみ設定される最終 usage / cost。 */
  usage?: Usage;
  costUsd?: number;
  latencyMs?: number;
}

/**
 * Mock 設定。 4 SDK adapter で共通に使う。
 *
 * `responses` は user プロンプトを完全一致で index、 hit なしは
 * `defaultResponse` を返す。 tool_calls / streaming も `responses` で
 * 制御 (同じ user prompt に対し tool_use → 次 turn で最終応答、 等の
 * multi-turn シナリオも表現可能)。
 */
export interface MockConfig {
  /** default response (dict miss 時のフォールバック)。 */
  defaultResponse?: string;
  /** user prompt → mock 応答 (順序 = 呼出順)。 */
  responses?: Record<string, MockResponse>;
  /** artificial latency in ms (default 10)。 */
  artificialLatencyMs?: number;
  /**
   * cost per 1k tokens ($US)。 default は Anthropic Haiku 相当の
   * `{ prompt: 0.00025, completion: 0.00125 }`。
   */
  costPer1kTokens?: { prompt: number; completion: number };
  /** provider / model 識別子 (report 用、 default 'mock-model')。 */
  model?: string;
}

/** MockConfig.responses の 1 entry。 */
export interface MockResponse {
  content: string;
  /** tool_use を返す場合の呼出定義。 */
  toolCalls?: ToolCall[];
  /** stream で送出する chunk 列 (未指定 = content を 1 chunk で送出)。 */
  chunks?: string[];
  /** token 使用量の override (未指定 = 文字数 / 4 で概算)。 */
  usage?: Partial<Usage>;
  /** finishReason の override (default 'stop'、 toolCalls 有りは 'tool_use')。 */
  finishReason?: ChatCompletion['finishReason'];
}

/**
 * kiwa mock を全 SDK adapter が満たすべき最小 interface。 SDK 固有の API
 * (`messages.create` / `chat.completions.create` / `generateText` / `invoke`
 * 等) は adapter 別に定義、 本 interface は 4 SDK 共通の低レベル呼出だけ
 * を集約する。
 *
 * `chatCompletion` = non-streaming、 `chatStream` = SSE 相当の async iterable。
 * SDK 表面の名前 (`chat` / `stream`) と衝突しないよう prefix を付ける。
 */
export interface AiLlmMock {
  /** SDK 名 (`anthropic` / `openai` / `vercel-ai` / `langchain`)。 */
  readonly sdk: string;
  chatCompletion(input: ChatInput): Promise<ChatCompletion>;
  chatStream(input: ChatInput): AsyncIterable<StreamEvent>;
  /** 累積の cost / token / latency を返す (fidelity 計測用)。 */
  getMetrics(): {
    totalCostUsd: number;
    totalTokens: Usage;
    latencySamplesMs: number[];
    requests: number;
  };
  /** metric 状態を初期化する。 */
  reset(): void;
}

/** chat / stream 共通の入力。 */
export interface ChatInput {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  /** temperature / topP / maxTokens 等 provider 共通の hint。 */
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}
