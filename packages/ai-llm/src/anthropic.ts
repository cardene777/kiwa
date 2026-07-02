import { MockEngine } from './engine.js';
import type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  ChatMessage,
  MockConfig,
  StreamEvent,
  ToolDefinition,
} from './types.js';

/**
 * Anthropic Messages API mock。
 *
 * SDK 呼出形式 (real `@anthropic-ai/sdk`) は以下 3 経路 ...
 * - `client.messages.create({ model, messages, system?, tools?, max_tokens })`
 * - `client.messages.stream({ ... })` — event iterator (`content_block_delta` 等)
 * - `client.beta.tools.messages.create({ ... })` — tool_use loop
 *
 * 本 mock は上記に近い interface を持つ薄い wrapper を提供、 内部で
 * {@link MockEngine} を呼出す。 real Anthropic SDK は import せず、
 * shape のみ互換を保つ。
 */
export interface AnthropicMessagesRequest {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; tool_use_id?: string; content?: string; input?: unknown }>;
  }>;
  system?: string;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: ToolDefinition['parameters'];
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AnthropicMessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  >;
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  /** kiwa 拡張 — mock 実測 cost / latency を SDK response に添付。 */
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}

export interface AnthropicStreamEvent {
  type:
    | 'message_start'
    | 'content_block_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop';
  delta?: { type: 'text_delta'; text: string } | { stop_reason: string };
  usage?: { input_tokens: number; output_tokens: number };
  _kiwa?: { costUsd: number; latencyMs: number };
}

/**
 * Anthropic mock client。 real SDK と同じ `messages.create` / `messages.stream`
 * API surface を提供。
 */
export interface AnthropicMock extends AiLlmMock {
  readonly sdk: 'anthropic';
  messages: {
    create(req: AnthropicMessagesRequest): Promise<AnthropicMessagesResponse>;
    stream(req: AnthropicMessagesRequest): AsyncIterable<AnthropicStreamEvent>;
  };
}

export function createAnthropicMock(config: MockConfig = {}): AnthropicMock {
  const engine = new MockEngine({ model: 'claude-3-haiku-mock', ...config });

  const client: AnthropicMock = {
    sdk: 'anthropic',
    messages: {
      async create(req) {
        const chatInput = toChatInput(req);
        const completion = await engine.runChat(chatInput);
        return toAnthropicResponse(completion, engine.config.model);
      },
      stream(req) {
        return toAnthropicStream(engine.runStream(toChatInput(req)), engine.config.model);
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
  return client;
}

function toChatInput(req: AnthropicMessagesRequest): ChatInput {
  const messages: ChatMessage[] = req.messages.map((m) => ({
    role: m.role,
    content: typeof m.content === 'string'
      ? m.content
      : m.content
          .map((c) => (c.type === 'text' ? c.text ?? '' : ''))
          .join(''),
  }));
  const out: ChatInput = { messages };
  if (req.system !== undefined) out.systemPrompt = req.system;
  if (req.max_tokens !== undefined) out.maxTokens = req.max_tokens;
  if (req.temperature !== undefined) out.temperature = req.temperature;
  if (req.tools) {
    out.tools = req.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    }));
  }
  return out;
}

function toAnthropicResponse(
  completion: ChatCompletion,
  model: string,
): AnthropicMessagesResponse {
  const content: AnthropicMessagesResponse['content'] = [];
  if (completion.message.content) {
    content.push({ type: 'text', text: completion.message.content });
  }
  if (completion.message.toolCalls) {
    for (const t of completion.message.toolCalls) {
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(t.arguments) as Record<string, unknown>;
      } catch {
        input = { raw: t.arguments };
      }
      content.push({ type: 'tool_use', id: t.id, name: t.name, input });
    }
  }
  const stopReason: AnthropicMessagesResponse['stop_reason'] =
    completion.finishReason === 'tool_use'
      ? 'tool_use'
      : completion.finishReason === 'length'
        ? 'max_tokens'
        : 'end_turn';
  return {
    id: `msg_mock_${Math.random().toString(36).slice(2, 10)}`,
    type: 'message',
    role: 'assistant',
    model,
    content,
    stop_reason: stopReason,
    usage: {
      input_tokens: completion.usage.promptTokens,
      output_tokens: completion.usage.completionTokens,
    },
    _kiwa: {
      costUsd: completion.costUsd,
      latencyMs: completion.latencyMs,
    },
  };
}

async function* toAnthropicStream(
  source: AsyncIterable<StreamEvent>,
  _model: string,
): AsyncIterable<AnthropicStreamEvent> {
  yield { type: 'message_start' };
  yield { type: 'content_block_start' };
  for await (const ev of source) {
    if (ev.done) {
      yield { type: 'content_block_stop' };
      yield {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn' },
        ...(ev.usage
          ? { usage: { input_tokens: ev.usage.promptTokens, output_tokens: ev.usage.completionTokens } }
          : {}),
      };
      yield {
        type: 'message_stop',
        ...(ev.costUsd !== undefined && ev.latencyMs !== undefined
          ? { _kiwa: { costUsd: ev.costUsd, latencyMs: ev.latencyMs } }
          : {}),
      };
      return;
    }
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: ev.delta },
    };
  }
}
