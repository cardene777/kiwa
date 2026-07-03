import { MockEngine } from './engine.js';
import type { MessagePart } from './multimodal.js';
import type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  ChatMessage,
  MockConfig,
  StreamEvent,
} from './types.js';

/**
 * LangChain (`@langchain/core`) mock。 `BaseChatModel` / `Runnable`
 * interface に相当する mock を提供する。
 *
 * real LangChain の呼出形式 (v0.3+) は以下 3 経路 ...
 * - `chatModel.invoke([messages])` → `AIMessage`
 * - `chatModel.stream([messages])` → async iterable of `AIMessageChunk`
 * - `chatModel.batch([...messages])` → `AIMessage[]`
 *
 * 本 mock は real LangChain SDK は import せず、 shape のみ互換を提供。
 * dogfood app 側で `BaseChatModel` として dependency inject 可能。
 */
/**
 * LangChain content block (v0.2、 real @langchain/core 0.3+ 準拠)。 image_url
 * は OpenAI vision と同じ shape、 media は Google/Anthropic multimodal 用。
 */
export type LangchainContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: string | { url: string; detail?: 'low' | 'high' | 'auto' };
    }
  | {
      type: 'media';
      /** base64 data。 */
      data: string;
      mimeType: string;
    };

export interface LangchainInputMessage {
  role: 'system' | 'human' | 'ai' | 'tool';
  content: string | LangchainContentBlock[];
  name?: string;
  tool_call_id?: string;
}

export interface LangchainAIMessage {
  /** LangChain の `AIMessage.constructor.name` (mock では固定文字列)。 */
  _type: 'AIMessage';
  content: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  response_metadata: {
    finish_reason: 'stop' | 'tool_calls' | 'length';
    model: string;
  };
  usage_metadata: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}

export interface LangchainAIMessageChunk {
  _type: 'AIMessageChunk';
  content: string;
  response_metadata?: LangchainAIMessage['response_metadata'];
  usage_metadata?: LangchainAIMessage['usage_metadata'];
  _kiwa?: LangchainAIMessage['_kiwa'];
}

export interface LangchainMock extends AiLlmMock {
  readonly sdk: 'langchain';
  invoke(messages: LangchainInputMessage[]): Promise<LangchainAIMessage>;
  stream(messages: LangchainInputMessage[]): AsyncIterable<LangchainAIMessageChunk>;
  batch(batches: LangchainInputMessage[][]): Promise<LangchainAIMessage[]>;
  /** LangChain BaseChatModel は `_llmType()` を実装する。 */
  _llmType(): string;
}

export function createLangchainMock(config: MockConfig = {}): LangchainMock {
  const engine = new MockEngine({ model: 'langchain-mock', ...config });

  const mock: LangchainMock = {
    sdk: 'langchain',
    async invoke(messages) {
      const chatInput = toChatInput(messages);
      const completion = await engine.runChat(chatInput);
      return toAIMessage(completion, engine.config.model);
    },
    stream(messages) {
      const chatInput = toChatInput(messages);
      return toAIMessageChunkStream(engine.runStream(chatInput), engine.config.model);
    },
    async batch(batches) {
      const results: LangchainAIMessage[] = [];
      for (const batch of batches) {
        results.push(await this.invoke(batch));
      }
      return results;
    },
    _llmType() {
      return 'kiwa-mock-chat-model';
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

function toChatInput(messages: LangchainInputMessage[]): ChatInput {
  const out: ChatMessage[] = [];
  let systemPrompt: string | undefined;
  for (const m of messages) {
    const role = m.role === 'human' ? 'user' : m.role === 'ai' ? 'assistant' : m.role === 'tool' ? 'tool' : 'system';
    if (typeof m.content === 'string') {
      if (m.role === 'system') {
        systemPrompt = m.content;
        continue;
      }
      const msg: ChatMessage = { role, content: m.content };
      if (m.tool_call_id !== undefined) msg.toolCallId = m.tool_call_id;
      if (m.name !== undefined) msg.name = m.name;
      out.push(msg);
      continue;
    }
    // multimodal
    const converted = convertLangchainBlocksToMessageParts(m.content);
    if (m.role === 'system') {
      systemPrompt = converted.text;
      continue;
    }
    const msg: ChatMessage = { role, content: converted.text };
    if (converted.parts.length > 0) msg.parts = converted.parts;
    if (m.tool_call_id !== undefined) msg.toolCallId = m.tool_call_id;
    if (m.name !== undefined) msg.name = m.name;
    out.push(msg);
  }
  const chatInput: ChatInput = { messages: out };
  if (systemPrompt !== undefined) chatInput.systemPrompt = systemPrompt;
  return chatInput;
}

function convertLangchainBlocksToMessageParts(
  content: LangchainContentBlock[],
): { parts: MessagePart[]; text: string } {
  const parts: MessagePart[] = [];
  let text = '';
  for (const c of content) {
    if (c.type === 'text') {
      parts.push({ type: 'text', text: c.text });
      text += c.text;
    } else if (c.type === 'image_url') {
      const url = typeof c.image_url === 'string' ? c.image_url : c.image_url.url;
      const detail = typeof c.image_url === 'string' ? undefined : c.image_url.detail;
      const dataMatch = url.match(/^data:([^;]+);base64,(.*)$/);
      const source = dataMatch
        ? { kind: 'base64' as const, mediaType: dataMatch[1]!, data: dataMatch[2]! }
        : /^https?:\/\//.test(url)
          ? { kind: 'url' as const, url }
          : { kind: 'base64' as const, mediaType: 'image/jpeg', data: url };
      const imagePart: MessagePart = { type: 'image', source };
      if (detail !== undefined) {
        (imagePart as { detail?: 'low' | 'high' | 'auto' }).detail = detail;
      }
      parts.push(imagePart);
    } else if (c.type === 'media') {
      const isAudio = c.mimeType.startsWith('audio/');
      if (isAudio) {
        parts.push({
          type: 'audio',
          source: { kind: 'base64', mediaType: c.mimeType, data: c.data },
          purpose: 'chat',
        });
      } else if (c.mimeType.startsWith('image/')) {
        parts.push({
          type: 'image',
          source: { kind: 'base64', mediaType: c.mimeType, data: c.data },
        });
      }
    }
  }
  return { parts, text };
}

function toAIMessage(completion: ChatCompletion, model: string): LangchainAIMessage {
  const toolCalls = (completion.message.toolCalls ?? []).map((t) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(t.arguments) as Record<string, unknown>;
    } catch {
      args = { raw: t.arguments };
    }
    return { id: t.id, name: t.name, args };
  });
  const finishReason: LangchainAIMessage['response_metadata']['finish_reason'] =
    completion.finishReason === 'tool_use'
      ? 'tool_calls'
      : completion.finishReason === 'length'
        ? 'length'
        : 'stop';
  const msg: LangchainAIMessage = {
    _type: 'AIMessage',
    content: completion.message.content,
    response_metadata: { finish_reason: finishReason, model },
    usage_metadata: {
      input_tokens: completion.usage.promptTokens,
      output_tokens: completion.usage.completionTokens,
      total_tokens: completion.usage.totalTokens,
    },
    _kiwa: {
      costUsd: completion.costUsd,
      latencyMs: completion.latencyMs,
    },
  };
  if (toolCalls.length > 0) msg.tool_calls = toolCalls;
  return msg;
}

async function* toAIMessageChunkStream(
  source: AsyncIterable<StreamEvent>,
  model: string,
): AsyncIterable<LangchainAIMessageChunk> {
  for await (const ev of source) {
    if (ev.done) {
      const chunk: LangchainAIMessageChunk = {
        _type: 'AIMessageChunk',
        content: '',
        response_metadata: { finish_reason: 'stop', model },
      };
      if (ev.usage) {
        chunk.usage_metadata = {
          input_tokens: ev.usage.promptTokens,
          output_tokens: ev.usage.completionTokens,
          total_tokens: ev.usage.totalTokens,
        };
      }
      if (ev.costUsd !== undefined && ev.latencyMs !== undefined) {
        chunk._kiwa = { costUsd: ev.costUsd, latencyMs: ev.latencyMs };
      }
      yield chunk;
      return;
    }
    yield { _type: 'AIMessageChunk', content: ev.delta };
  }
}
