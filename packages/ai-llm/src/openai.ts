import { MockEngine } from './engine.js';
import type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  ChatMessage,
  MockConfig,
  StreamEvent,
  Usage,
} from './types.js';

/**
 * OpenAI Chat Completions mock (function calling / tool_use loop 対応)。
 *
 * SDK 呼出形式 (real `openai` npm) は以下 2 経路 ...
 * - `client.chat.completions.create({ model, messages, tools?, stream? })`
 * - `for await (const chunk of client.chat.completions.create({ ..., stream: true }))`
 *
 * 本 mock は上記に近い interface を持つ薄い wrapper を提供、 real OpenAI
 * SDK は import せず shape のみ互換。
 */
export interface OpenAiChatCompletionsRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
    name?: string;
  }>;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenAiChatCompletionsResponse {
  id: string;
  object: 'chat.completion';
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}

export interface OpenAiStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason: 'stop' | 'tool_calls' | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _kiwa?: { costUsd: number; latencyMs: number };
}

export interface OpenAiMock extends AiLlmMock {
  readonly sdk: 'openai';
  chat: {
    completions: {
      create(
        req: OpenAiChatCompletionsRequest,
      ): Promise<OpenAiChatCompletionsResponse> | AsyncIterable<OpenAiStreamChunk>;
    };
  };
}

export function createOpenAIMock(config: MockConfig = {}): OpenAiMock {
  const engine = new MockEngine({ model: 'gpt-4o-mini-mock', ...config });

  const mock: OpenAiMock = {
    sdk: 'openai',
    chat: {
      completions: {
        create(req) {
          const chatInput = toChatInput(req);
          if (req.stream) {
            return toOpenAiStream(engine.runStream(chatInput), engine.config.model);
          }
          return engine.runChat(chatInput).then((c) => toOpenAiResponse(c, engine.config.model));
        },
      },
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

function toChatInput(req: OpenAiChatCompletionsRequest): ChatInput {
  const messages: ChatMessage[] = [];
  let systemPrompt: string | undefined;
  for (const m of req.messages) {
    if (m.role === 'system') {
      systemPrompt = m.content ?? '';
      continue;
    }
    const msg: ChatMessage = {
      role: m.role,
      content: m.content ?? '',
    };
    if (m.tool_calls) {
      msg.toolCalls = m.tool_calls.map((t) => ({
        id: t.id,
        name: t.function.name,
        arguments: t.function.arguments,
      }));
    }
    if (m.tool_call_id !== undefined) msg.toolCallId = m.tool_call_id;
    if (m.name !== undefined) msg.name = m.name;
    messages.push(msg);
  }
  const out: ChatInput = { messages };
  if (systemPrompt !== undefined) out.systemPrompt = systemPrompt;
  if (req.max_tokens !== undefined) out.maxTokens = req.max_tokens;
  if (req.temperature !== undefined) out.temperature = req.temperature;
  if (req.tools) {
    out.tools = req.tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters as ChatInput['tools'] extends
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

function toOpenAiResponse(
  completion: ChatCompletion,
  model: string,
): OpenAiChatCompletionsResponse {
  const message: OpenAiChatCompletionsResponse['choices'][number]['message'] = {
    role: 'assistant',
    content: completion.message.content || null,
  };
  if (completion.message.toolCalls) {
    message.tool_calls = completion.message.toolCalls.map((t) => ({
      id: t.id,
      type: 'function' as const,
      function: { name: t.name, arguments: t.arguments },
    }));
  }
  const finishReason: OpenAiChatCompletionsResponse['choices'][number]['finish_reason'] =
    completion.finishReason === 'tool_use'
      ? 'tool_calls'
      : completion.finishReason === 'length'
        ? 'length'
        : 'stop';
  return {
    id: `chatcmpl-mock-${Math.random().toString(36).slice(2, 10)}`,
    object: 'chat.completion',
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
    usage: {
      prompt_tokens: completion.usage.promptTokens,
      completion_tokens: completion.usage.completionTokens,
      total_tokens: completion.usage.totalTokens,
    },
    _kiwa: {
      costUsd: completion.costUsd,
      latencyMs: completion.latencyMs,
    },
  };
}

async function* toOpenAiStream(
  source: AsyncIterable<StreamEvent>,
  model: string,
): AsyncIterable<OpenAiStreamChunk> {
  const id = `chatcmpl-mock-${Math.random().toString(36).slice(2, 10)}`;
  let first = true;
  for await (const ev of source) {
    if (ev.done) {
      yield {
        id,
        object: 'chat.completion.chunk',
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        ...(ev.usage
          ? {
              usage: {
                prompt_tokens: ev.usage.promptTokens,
                completion_tokens: ev.usage.completionTokens,
                total_tokens: ev.usage.totalTokens,
              },
            }
          : {}),
        ...(ev.costUsd !== undefined && ev.latencyMs !== undefined
          ? { _kiwa: { costUsd: ev.costUsd, latencyMs: ev.latencyMs } }
          : {}),
      };
      return;
    }
    const delta: OpenAiStreamChunk['choices'][number]['delta'] = { content: ev.delta };
    if (first) {
      delta.role = 'assistant';
      first = false;
    }
    yield {
      id,
      object: 'chat.completion.chunk',
      model,
      choices: [{ index: 0, delta, finish_reason: null }],
    };
  }
}
