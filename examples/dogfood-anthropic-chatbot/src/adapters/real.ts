import { costForTokens } from '@kiwa-lab/ai-llm';
import type {
  ChatbotAdapter,
  ChatResult,
  StreamedChatResult,
  ToolLoopResult,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — points at the real Anthropic Messages API. When
 * `ANTHROPIC_API_KEY` is not set the adapter returns a `skipped` variant
 * whose every method records a `ANTHROPIC_ENV_MISSING` trace and throws a
 * distinguished error. Tests use this behaviour to short-circuit gracefully
 * — the fidelity report captures "environment absent" rather than failing
 * the whole suite in local dev.
 *
 * The real HTTP driving is deliberately kept minimal — a direct
 * `fetch` against `https://api.anthropic.com/v1/messages` matches the
 * `@anthropic-ai/sdk` request shape (Anthropic version + auth headers +
 * SSE stream) so the fidelity harness measures the *observable behaviour*
 * of the mock without dragging the SDK into the workspace root.
 */

export interface RealAdapterEnv {
  apiKey: string;
  model: string;
  baseUrl: string;
}

const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

export function detectRealEnv(): RealAdapterEnv | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    baseUrl: process.env.ANTHROPIC_BASE_URL ?? DEFAULT_BASE_URL,
  };
}

/**
 * Distinguished error emitted when the real adapter is asked to run without
 * an API key. Callers should catch it and let the fidelity harness record
 * the divergence rather than aborting the whole test suite.
 */
export class SkippedError extends Error {
  readonly code = 'ANTHROPIC_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because ANTHROPIC_API_KEY is not set`,
    );
  }
}

export function makeRealAdapter(): ChatbotAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): ChatbotAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'ANTHROPIC_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    reply: async () => unsupported('reply'),
    replyStream: async () => unsupported('replyStream'),
    toolLoop: async () => unsupported('toolLoop'),
    metrics: () => ({
      totalCostUsd: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      latencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): ChatbotAdapter {
  const trace: TraceEvent[] = [];
  const latencies: number[] = [];
  let totalCostUsd = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let requests = 0;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function post(path: string, body: unknown): Promise<Response> {
    return fetch(`${env.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'x-api-key': env.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async reply(input): Promise<ChatResult> {
      const start = performance.now();
      const body: Record<string, unknown> = {
        model: env.model,
        max_tokens: input.maxTokens ?? 1024,
        messages: [{ role: 'user', content: input.userMessage }],
      };
      if (input.systemPrompt !== undefined) body['system'] = input.systemPrompt;
      const res = await post('/v1/messages', body);
      const latency = performance.now() - start;
      latencies.push(latency);
      if (!res.ok) {
        const errText = await res.text();
        record('reply', false, { errorKind: `HTTP_${res.status}`, detail: { errText } });
        throw new Error(`Anthropic reply failed ${res.status}: ${errText}`);
      }
      const json = (await res.json()) as {
        content: Array<{ type: 'text'; text: string } | { type: 'tool_use' }>;
        usage: { input_tokens: number; output_tokens: number };
        stop_reason: string;
      };
      const text = json.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('');
      const costUsd = costFor(json.usage, env.model);
      totalCostUsd += costUsd;
      totalPromptTokens += json.usage.input_tokens;
      totalCompletionTokens += json.usage.output_tokens;
      requests += 1;
      record('reply', true);
      return {
        text,
        usage: {
          promptTokens: json.usage.input_tokens,
          completionTokens: json.usage.output_tokens,
          totalTokens: json.usage.input_tokens + json.usage.output_tokens,
        },
        costUsd,
        latencyMs: latency,
        finishReason: mapStop(json.stop_reason),
      };
    },

    async replyStream(input): Promise<StreamedChatResult> {
      const start = performance.now();
      const body: Record<string, unknown> = {
        model: env.model,
        max_tokens: input.maxTokens ?? 1024,
        stream: true,
        messages: [{ role: 'user', content: input.userMessage }],
      };
      if (input.systemPrompt !== undefined) body['system'] = input.systemPrompt;
      const res = await post('/v1/messages', body);
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        record('replyStream', false, { errorKind: `HTTP_${res.status}` });
        throw new Error(`Anthropic stream failed ${res.status}: ${errText}`);
      }
      const chunks: string[] = [];
      let promptTokens = 0;
      let completionTokens = 0;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = false;
      while (!done) {
        const { value, done: end } = await reader.read();
        done = end;
        if (value) buf += decoder.decode(value, { stream: true });
        let idx = buf.indexOf('\n\n');
        while (idx !== -1) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const evt = parseSseEvent(raw);
          if (evt.type === 'content_block_delta' && evt.data?.['delta']) {
            const d = evt.data['delta'] as { type: string; text?: string };
            if (d.type === 'text_delta' && d.text) chunks.push(d.text);
          }
          // Finding 1 — input_tokens ships in message_start.message.usage per
          // Anthropic Messages Streaming spec; message_delta only carries the
          // cumulative output_tokens. Reading input_tokens off message_delta
          // (previous behaviour) silently under-reports prompt cost when the
          // server omits it in the delta event.
          if (evt.type === 'message_start' && evt.data?.['message']) {
            const m = evt.data['message'] as {
              usage?: { input_tokens?: number; output_tokens?: number };
            };
            if (m.usage?.input_tokens !== undefined) {
              promptTokens = m.usage.input_tokens;
            }
            if (m.usage?.output_tokens !== undefined) {
              completionTokens = m.usage.output_tokens;
            }
          }
          if (evt.type === 'message_delta' && evt.data?.['usage']) {
            const u = evt.data['usage'] as {
              output_tokens: number;
            };
            completionTokens = u.output_tokens;
          }
          idx = buf.indexOf('\n\n');
        }
      }
      const latency = performance.now() - start;
      latencies.push(latency);
      const costUsd = costFor(
        { input_tokens: promptTokens, output_tokens: completionTokens },
        env.model,
      );
      totalCostUsd += costUsd;
      totalPromptTokens += promptTokens;
      totalCompletionTokens += completionTokens;
      requests += 1;
      record('replyStream', true, { detail: { chunkCount: chunks.length } });
      return {
        chunks,
        full: chunks.join(''),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        costUsd,
        latencyMs: latency,
      };
    },

    async toolLoop(input): Promise<ToolLoopResult> {
      const maxIter = input.maxIterations ?? 4;
      const conversation: Array<{ role: string; content: unknown }> = [
        { role: 'user', content: input.userMessage },
      ];
      const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
      let finalText = '';
      let promptTokens = 0;
      let completionTokens = 0;
      let costUsd = 0;
      let latencyMs = 0;

      for (let iter = 0; iter < maxIter; iter += 1) {
        const start = performance.now();
        const body: Record<string, unknown> = {
          model: env.model,
          max_tokens: 1024,
          tools: input.tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          })),
          messages: conversation,
        };
        if (input.systemPrompt !== undefined) body['system'] = input.systemPrompt;
        const res = await post('/v1/messages', body);
        const latency = performance.now() - start;
        latencies.push(latency);
        latencyMs += latency;
        if (!res.ok) {
          const errText = await res.text();
          record('toolLoop', false, { errorKind: `HTTP_${res.status}`, detail: { errText } });
          throw new Error(`Anthropic tool loop failed ${res.status}: ${errText}`);
        }
        const json = (await res.json()) as {
          content: Array<
            | { type: 'text'; text: string }
            | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
          >;
          usage: { input_tokens: number; output_tokens: number };
          stop_reason: string;
        };
        promptTokens += json.usage.input_tokens;
        completionTokens += json.usage.output_tokens;
        costUsd += costFor(json.usage, env.model);

        const toolUses = json.content.filter(
          (c): c is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
            c.type === 'tool_use',
        );
        finalText = json.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join('');

        if (toolUses.length === 0 || json.stop_reason !== 'tool_use') {
          break;
        }

        conversation.push({ role: 'assistant', content: json.content });
        const results: Array<{ type: string; tool_use_id: string; content: string }> = [];
        for (const use of toolUses) {
          toolCalls.push({ name: use.name, args: use.input });
          const result = await input.resolveTool(use.name, use.input);
          results.push({ type: 'tool_result', tool_use_id: use.id, content: result });
        }
        conversation.push({ role: 'user', content: results });
      }

      totalCostUsd += costUsd;
      totalPromptTokens += promptTokens;
      totalCompletionTokens += completionTokens;
      requests += 1;
      record('toolLoop', true, { detail: { toolCallCount: toolCalls.length } });
      return {
        finalText,
        toolCalls,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        costUsd,
        latencyMs,
      };
    },

    metrics: () => ({
      totalCostUsd,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      latencySamplesMs: [...latencies],
      requests,
    }),

    async reset() {
      trace.length = 0;
      latencies.length = 0;
      totalCostUsd = 0;
      totalPromptTokens = 0;
      totalCompletionTokens = 0;
      requests = 0;
    },
  };
}

// Finding 3 — cost lookup deferred to the shared @kiwa-lab/ai-llm price
// table so a model swap (Sonnet → Haiku → Opus) picks up the right rate
// without touching every dogfood adapter. Callers pass the vendor's raw
// token counts unchanged so the migration is drop-in.
function costFor(u: { input_tokens: number; output_tokens: number }, model: string): number {
  return costForTokens(model, u.input_tokens, u.output_tokens);
}

function mapStop(stop: string): ChatResult['finishReason'] {
  if (stop === 'tool_use') return 'tool_use';
  if (stop === 'max_tokens') return 'length';
  if (stop === 'content_filter') return 'content_filter';
  return 'stop';
}

/**
 * SSE event parser. Finding 4 — the SSE spec (WHATWG "Server-Sent
 * Events" § 9.2.6) mandates that multiple `data:` field lines within a
 * single event are joined with a literal LF between them; the previous
 * implementation concatenated them with no separator so a payload like
 *   data: {"foo":\n
 *   data: 1}
 * would parse to `{"foo":1}` instead of a syntax error, masking real
 * spec drift and occasionally corrupting valid JSON. LF join now matches
 * the spec.
 */
export function parseSseEvent(raw: string): { type: string | undefined; data: Record<string, unknown> | undefined } {
  let type: string | undefined;
  const dataLines: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('event: ')) type = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
    else if (line === 'data:') dataLines.push('');
  }
  if (dataLines.length === 0) return { type, data: undefined };
  const dataStr = dataLines.join('\n');
  try {
    return { type, data: JSON.parse(dataStr) as Record<string, unknown> };
  } catch {
    return { type, data: undefined };
  }
}
