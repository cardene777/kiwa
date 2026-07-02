import type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  MockConfig,
  MockResponse,
  StreamEvent,
  Usage,
} from './types.js';

/**
 * 4 SDK adapter で共通の内部エンジン。 responses dict lookup + cost /
 * token 計測 + streaming chunk 分割を集約する。 SDK 別 adapter (anthropic
 * / openai / vercel-ai / langchain) は本エンジンを wrap するだけ。
 */
/** Internal shape after all defaults resolved. */
interface ResolvedConfig {
  artificialLatencyMs: number;
  costPer1kTokens: { prompt: number; completion: number };
  model: string;
  defaultResponse: string;
  responses?: Record<string, MockResponse>;
}

export class MockEngine {
  readonly config: ResolvedConfig;
  private totalCostUsd = 0;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private latencySamplesMs: number[] = [];
  private requestCount = 0;
  private responseCallIndex = new Map<string, number>();

  constructor(config: MockConfig = {}) {
    const resolved: ResolvedConfig = {
      artificialLatencyMs: config.artificialLatencyMs ?? 10,
      costPer1kTokens: config.costPer1kTokens ?? { prompt: 0.00025, completion: 0.00125 },
      model: config.model ?? 'mock-model',
      defaultResponse: config.defaultResponse ?? 'mock default response',
    };
    if (config.responses !== undefined) resolved.responses = config.responses;
    this.config = resolved;
  }

  /** 1 request の完全な処理 (non-streaming)。 */
  async runChat(input: ChatInput): Promise<ChatCompletion> {
    const start = Date.now();
    const userPrompt = extractUserPrompt(input);
    const resp = this.resolveResponse(userPrompt);
    await this.simulateLatency();
    const usage = this.buildUsage(input, resp);
    const costUsd = this.computeCost(usage);
    const latencyMs = Math.max(0, Date.now() - start);
    this.record(costUsd, usage, latencyMs);
    const finishReason: ChatCompletion['finishReason'] = resp.finishReason
      ?? (resp.toolCalls && resp.toolCalls.length > 0 ? 'tool_use' : 'stop');
    return {
      message: {
        role: 'assistant',
        content: resp.content,
        ...(resp.toolCalls ? { toolCalls: resp.toolCalls } : {}),
      },
      usage,
      costUsd,
      latencyMs,
      finishReason,
    };
  }

  /** streaming — chunk 列を async generator で返す。 */
  async *runStream(input: ChatInput): AsyncGenerator<StreamEvent, void, unknown> {
    const start = Date.now();
    const userPrompt = extractUserPrompt(input);
    const resp = this.resolveResponse(userPrompt);
    const chunks = resp.chunks && resp.chunks.length > 0
      ? resp.chunks
      : splitContentIntoChunks(resp.content);
    const usage = this.buildUsage(input, resp);
    const costUsd = this.computeCost(usage);

    // 各 chunk の間に artificial latency を分散させて streaming の
    // observable な遅延をシミュレート。
    const perChunkLatency = Math.max(1, Math.floor(this.config.artificialLatencyMs / Math.max(1, chunks.length)));
    for (const chunk of chunks) {
      await sleep(perChunkLatency);
      yield { delta: chunk, done: false };
    }
    const latencyMs = Math.max(0, Date.now() - start);
    this.record(costUsd, usage, latencyMs);
    yield { delta: '', done: true, usage, costUsd, latencyMs };
  }

  getMetrics(): ReturnType<AiLlmMock['getMetrics']> {
    return {
      totalCostUsd: this.totalCostUsd,
      totalTokens: {
        promptTokens: this.totalPromptTokens,
        completionTokens: this.totalCompletionTokens,
        totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
      },
      latencySamplesMs: [...this.latencySamplesMs],
      requests: this.requestCount,
    };
  }

  reset(): void {
    this.totalCostUsd = 0;
    this.totalPromptTokens = 0;
    this.totalCompletionTokens = 0;
    this.latencySamplesMs = [];
    this.requestCount = 0;
    this.responseCallIndex.clear();
  }

  private resolveResponse(userPrompt: string): MockResponse {
    if (this.config.responses && userPrompt in this.config.responses) {
      const entry = this.config.responses[userPrompt]!;
      // 同一 prompt の複数回呼出時、 現状は同じ response を返す。
      // 将来的な拡張 (turn-based シナリオ) の余地を確保して index を記録。
      const idx = this.responseCallIndex.get(userPrompt) ?? 0;
      this.responseCallIndex.set(userPrompt, idx + 1);
      return entry;
    }
    return { content: this.config.defaultResponse };
  }

  private buildUsage(input: ChatInput, resp: MockResponse): Usage {
    // 明示指定がある場合はそれを尊重、 なければ「4 文字 ≈ 1 token」 の
    // ざっくり概算 (実 LLM tokenizer と厳密には一致しない、 mock の
    // fidelity 計測用には十分)。
    const promptTokens = resp.usage?.promptTokens
      ?? Math.max(1, Math.floor(estimatePromptCharCount(input) / 4));
    const completionTokens = resp.usage?.completionTokens
      ?? Math.max(1, Math.floor(resp.content.length / 4));
    return {
      promptTokens,
      completionTokens,
      totalTokens: resp.usage?.totalTokens ?? promptTokens + completionTokens,
    };
  }

  private computeCost(usage: Usage): number {
    const promptUsd = (usage.promptTokens / 1000) * this.config.costPer1kTokens.prompt;
    const completionUsd = (usage.completionTokens / 1000) * this.config.costPer1kTokens.completion;
    return promptUsd + completionUsd;
  }

  private async simulateLatency(): Promise<void> {
    if (this.config.artificialLatencyMs > 0) {
      await sleep(this.config.artificialLatencyMs);
    }
  }

  private record(costUsd: number, usage: Usage, latencyMs: number): void {
    this.totalCostUsd += costUsd;
    this.totalPromptTokens += usage.promptTokens;
    this.totalCompletionTokens += usage.completionTokens;
    this.latencySamplesMs.push(latencyMs);
    this.requestCount += 1;
  }
}

function extractUserPrompt(input: ChatInput): string {
  // 最後の user role message を prompt key として扱う (mock 決定論の
  // 単純化)。 systemPrompt / 以前の会話履歴は key に含めない。
  for (let i = input.messages.length - 1; i >= 0; i -= 1) {
    const msg = input.messages[i]!;
    if (msg.role === 'user') {
      return msg.content;
    }
  }
  return '';
}

function estimatePromptCharCount(input: ChatInput): number {
  let total = 0;
  if (input.systemPrompt) total += input.systemPrompt.length;
  for (const m of input.messages) {
    total += m.content.length;
  }
  return total;
}

function splitContentIntoChunks(content: string, chunkSize = 8): string[] {
  if (!content) return [''];
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
