import { MockEngine } from './engine.js';
import { toTranscriptionKey, type MessagePart, type TranscriptionResult } from './multimodal.js';
import type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  ChatMessage,
  MockConfig,
  StreamEvent,
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
/**
 * OpenAI vision / audio content part (v0.2、 real Chat Completions vision +
 * gpt-4o audio input 準拠)。
 */
export type OpenAiContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: {
        /** `data:image/jpeg;base64,{...}` or `https://...`。 */
        url: string;
        /** OpenAI vision resolution hint。 */
        detail?: 'low' | 'high' | 'auto';
      };
    }
  | {
      type: 'input_audio';
      input_audio: {
        data: string;
        /** `wav` / `mp3` 等。 */
        format: string;
      };
    };

export interface OpenAiChatCompletionsRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | OpenAiContentPart[] | null;
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

/**
 * Whisper transcription request (real `client.audio.transcriptions.create` の
 * shape 準拠)。 file は base64 data URL or URL string で受ける。
 */
export interface OpenAiTranscriptionRequest {
  /** base64 data (`data:audio/wav;base64,...`) or URL (`https://.../audio.wav`)。 */
  file: string;
  model?: string;
  /** `json` = text のみ、 `verbose_json` = segments 込。 default 'json'。 */
  response_format?: 'json' | 'verbose_json' | 'text';
  language?: string;
}

/** Whisper transcription response (`json` 相当)。 */
export interface OpenAiTranscriptionJson {
  text: string;
  /** kiwa 拡張。 */
  _kiwa: { costUsd: number; latencyMs: number };
}

/** Whisper transcription response (`verbose_json` 相当)。 */
export interface OpenAiTranscriptionVerboseJson extends OpenAiTranscriptionJson {
  language: string;
  duration: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
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
  /** Whisper audio transcription mock (v0.2)。 */
  audio: {
    transcriptions: {
      create(
        req: OpenAiTranscriptionRequest,
      ): Promise<OpenAiTranscriptionJson | OpenAiTranscriptionVerboseJson>;
    };
  };
  /**
   * kiwa 統一 API — audio → transcription を SDK 表面と別に露出。
   * fidelity harness / non-OpenAI 経路から呼びやすくする。
   */
  transcribeAudio(source: { kind: 'base64' | 'url'; data?: string; url?: string; mediaType?: string }): Promise<TranscriptionResult>;
}

export function createOpenAIMock(config: MockConfig = {}): OpenAiMock {
  const engine = new MockEngine({ model: 'gpt-4o-mini-mock', ...config });
  const transcriptions = config.transcriptions ?? {};
  const defaultTranscription = config.defaultTranscription ?? 'transcribed audio';

  async function runTranscription(
    source: { kind: 'base64' | 'url'; data?: string; url?: string; mediaType?: string },
  ): Promise<TranscriptionResult> {
    const key =
      source.kind === 'url'
        ? toTranscriptionKey({ kind: 'url', url: source.url ?? '' })
        : toTranscriptionKey({
            kind: 'base64',
            mediaType: source.mediaType ?? 'audio/wav',
            data: source.data ?? '',
          });
    const start = Date.now();
    // artificialLatencyMs を transcription にも適用 (real Whisper と近い挙動)。
    await sleep(engine.config.artificialLatencyMs);
    const hit = transcriptions[key];
    const text = hit?.text ?? defaultTranscription;
    const language = hit?.language ?? 'en';
    const segments =
      hit?.segments ??
      [{ id: 0, start: 0, end: 5, text }];
    // Whisper 課金 ≈ US$0.006/分。 mock は 30 s と仮定して簡易換算。
    const durationSeconds = segments[segments.length - 1]?.end ?? 5;
    const costUsd = (durationSeconds / 60) * 0.006;
    const latencyMs = Math.max(0, Date.now() - start);
    return {
      text,
      language,
      durationSeconds,
      segments,
      _kiwa: { costUsd, latencyMs },
    };
  }

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
    audio: {
      transcriptions: {
        async create(req) {
          // file field は `data:audio/*;base64,...` or URL。 kind を判別して
          // MediaSource 相当に normalize してから runTranscription へ。
          const source = parseTranscriptionFile(req.file);
          const result = await runTranscription(source);
          if (req.response_format === 'verbose_json') {
            return {
              text: result.text,
              language: result.language,
              duration: result.durationSeconds,
              segments: result.segments,
              _kiwa: result._kiwa,
            } satisfies OpenAiTranscriptionVerboseJson;
          }
          return {
            text: result.text,
            _kiwa: result._kiwa,
          } satisfies OpenAiTranscriptionJson;
        },
      },
    },
    async transcribeAudio(source) {
      return runTranscription(source);
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

function convertOpenAiPartsToMessageParts(
  content: OpenAiContentPart[],
): { parts: MessagePart[]; text: string } {
  const parts: MessagePart[] = [];
  let text = '';
  for (const c of content) {
    if (c.type === 'text') {
      parts.push({ type: 'text', text: c.text });
      text += c.text;
    } else if (c.type === 'image_url') {
      const url = c.image_url.url;
      const dataMatch = url.match(/^data:([^;]+);base64,(.*)$/);
      const source = dataMatch
        ? { kind: 'base64' as const, mediaType: dataMatch[1]!, data: dataMatch[2]! }
        : { kind: 'url' as const, url };
      const imagePart: MessagePart = { type: 'image', source };
      if (c.image_url.detail !== undefined) {
        (imagePart as { detail?: 'low' | 'high' | 'auto' }).detail = c.image_url.detail;
      }
      parts.push(imagePart);
    } else if (c.type === 'input_audio') {
      // input_audio は base64 data + format (`wav` / `mp3`)、 audio purpose = chat。
      parts.push({
        type: 'audio',
        source: {
          kind: 'base64',
          mediaType: `audio/${c.input_audio.format}`,
          data: c.input_audio.data,
        },
        purpose: 'chat',
      });
    }
  }
  return { parts, text };
}

function extractTextFromContentParts(content: OpenAiContentPart[]): string {
  return content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

function parseTranscriptionFile(
  file: string,
): { kind: 'base64' | 'url'; data?: string; url?: string; mediaType?: string } {
  // data URI = `data:audio/wav;base64,{data}`
  if (file.startsWith('data:')) {
    const match = file.match(/^data:([^;]+);base64,(.*)$/);
    if (match && match[1] && match[2]) {
      return { kind: 'base64', mediaType: match[1], data: match[2] };
    }
  }
  if (/^https?:\/\//.test(file)) {
    return { kind: 'url', url: file };
  }
  // それ以外 (bare base64 or path) は base64 として扱う。
  return { kind: 'base64', mediaType: 'audio/wav', data: file };
}

function toChatInput(req: OpenAiChatCompletionsRequest): ChatInput {
  const messages: ChatMessage[] = [];
  let systemPrompt: string | undefined;
  for (const m of req.messages) {
    if (m.role === 'system') {
      systemPrompt = typeof m.content === 'string' ? m.content : extractTextFromContentParts(m.content ?? []);
      continue;
    }
    let content: string;
    let parts: MessagePart[] | undefined;
    if (typeof m.content === 'string' || m.content === null) {
      content = m.content ?? '';
    } else {
      // OpenAI content parts → kiwa MessagePart[] + text 抽出。
      const converted = convertOpenAiPartsToMessageParts(m.content);
      parts = converted.parts;
      content = converted.text;
    }
    const msg: ChatMessage = {
      role: m.role,
      content,
    };
    if (parts && parts.length > 0) msg.parts = parts;
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
