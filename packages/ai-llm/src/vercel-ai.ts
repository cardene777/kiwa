import { MockEngine } from './engine.js';
import type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  ChatMessage,
  MockConfig,
  StreamEvent,
} from './types.js';

/**
 * Vercel AI SDK mock (`ai` npm、 `streamText` / `generateText` / `useChat`)。
 *
 * SDK 呼出形式 (real Vercel AI SDK v3+) は以下 3 経路 ...
 * - `streamText({ model, messages, tools?, system? })` → `textStream` async iterable + `text` promise
 * - `generateText({ model, messages, tools?, system? })` → `text` + `usage` promise
 * - `useChat()` React hook (本 mock では runtime 側の shape のみ模倣)
 *
 * 本 mock は real Vercel AI SDK と同じ shape の戻り値を提供、 dogfood app
 * で real / mock 切替可能にする。
 */
export interface VercelAiRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
  }>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Record<
    string,
    {
      description: string;
      parameters: Record<string, unknown>;
    }
  >;
}

export interface VercelGenerateTextResult {
  text: string;
  toolCalls: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'tool-calls' | 'length' | 'content-filter';
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}

export interface VercelStreamTextResult {
  /** 逐次 text chunk を送出する async iterable。 */
  textStream: AsyncIterable<string>;
  /** 全 stream 完了後の最終 text (resolve 順は SDK と同じで stream 後)。 */
  text: Promise<string>;
  /** stream 完了後 resolve される usage。 */
  usage: Promise<VercelGenerateTextResult['usage']>;
  finishReason: Promise<VercelGenerateTextResult['finishReason']>;
  _kiwa: Promise<{ costUsd: number; latencyMs: number }>;
}

export interface VercelAiMock extends AiLlmMock {
  readonly sdk: 'vercel-ai';
  generateText(req: VercelAiRequest): Promise<VercelGenerateTextResult>;
  streamText(req: VercelAiRequest): VercelStreamTextResult;
}

export function createVercelAiMock(config: MockConfig = {}): VercelAiMock {
  const engine = new MockEngine({ model: 'vercel-ai-mock', ...config });

  const mock: VercelAiMock = {
    sdk: 'vercel-ai',
    async generateText(req) {
      const chatInput = toChatInput(req);
      const completion = await engine.runChat(chatInput);
      return toGenerateTextResult(completion);
    },
    streamText(req) {
      const chatInput = toChatInput(req);
      const source = engine.runStream(chatInput);
      return toStreamTextResult(source);
    },
    async chatCompletion(input) {
      return engine.runChat(input);
    },
    chatStream(input) {
      return engine.runStream(input);
    },
    getMetrics() {
      return engine.getMetrics();
    },
    reset() {
      engine.reset();
    },
  };
  return mock;
}

function toChatInput(req: VercelAiRequest): ChatInput {
  const messages: ChatMessage[] = [];
  let systemPrompt: string | undefined = req.system;
  for (const m of req.messages) {
    if (m.role === 'system') {
      systemPrompt = m.content;
      continue;
    }
    messages.push({ role: m.role, content: m.content });
  }
  const out: ChatInput = { messages };
  if (systemPrompt !== undefined) out.systemPrompt = systemPrompt;
  if (req.maxTokens !== undefined) out.maxTokens = req.maxTokens;
  if (req.temperature !== undefined) out.temperature = req.temperature;
  if (req.tools) {
    out.tools = Object.entries(req.tools).map(([name, t]) => ({
      name,
      description: t.description,
      parameters: t.parameters as ChatInput['tools'] extends
        | Array<infer U>
        | undefined
        ? U extends { parameters: infer P }
          ? P
          : never
        : never,
    }));
  }
  return out;
}

function toGenerateTextResult(completion: ChatCompletion): VercelGenerateTextResult {
  const toolCalls = (completion.message.toolCalls ?? []).map((t) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(t.arguments) as Record<string, unknown>;
    } catch {
      args = { raw: t.arguments };
    }
    return { toolCallId: t.id, toolName: t.name, args };
  });
  const finishReason: VercelGenerateTextResult['finishReason'] =
    completion.finishReason === 'tool_use'
      ? 'tool-calls'
      : completion.finishReason === 'content_filter'
        ? 'content-filter'
        : completion.finishReason === 'length'
          ? 'length'
          : 'stop';
  return {
    text: completion.message.content,
    toolCalls,
    usage: {
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    },
    finishReason,
    _kiwa: {
      costUsd: completion.costUsd,
      latencyMs: completion.latencyMs,
    },
  };
}

function toStreamTextResult(source: AsyncIterable<StreamEvent>): VercelStreamTextResult {
  let resolveText!: (v: string) => void;
  let resolveUsage!: (v: VercelGenerateTextResult['usage']) => void;
  let resolveFinishReason!: (v: VercelGenerateTextResult['finishReason']) => void;
  let resolveKiwa!: (v: { costUsd: number; latencyMs: number }) => void;
  const text = new Promise<string>((r) => {
    resolveText = r;
  });
  const usage = new Promise<VercelGenerateTextResult['usage']>((r) => {
    resolveUsage = r;
  });
  const finishReason = new Promise<VercelGenerateTextResult['finishReason']>((r) => {
    resolveFinishReason = r;
  });
  const _kiwa = new Promise<{ costUsd: number; latencyMs: number }>((r) => {
    resolveKiwa = r;
  });

  const chunks: string[] = [];
  async function* generate(): AsyncGenerator<string, void, unknown> {
    for await (const ev of source) {
      if (ev.done) {
        resolveText(chunks.join(''));
        if (ev.usage) {
          resolveUsage({
            promptTokens: ev.usage.promptTokens,
            completionTokens: ev.usage.completionTokens,
            totalTokens: ev.usage.totalTokens,
          });
        } else {
          resolveUsage({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
        }
        resolveFinishReason('stop');
        if (ev.costUsd !== undefined && ev.latencyMs !== undefined) {
          resolveKiwa({ costUsd: ev.costUsd, latencyMs: ev.latencyMs });
        } else {
          resolveKiwa({ costUsd: 0, latencyMs: 0 });
        }
        return;
      }
      chunks.push(ev.delta);
      yield ev.delta;
    }
  }

  return {
    textStream: generate(),
    text,
    usage,
    finishReason,
    _kiwa,
  };
}
