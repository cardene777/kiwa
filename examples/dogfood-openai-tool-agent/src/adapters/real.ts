import type {
  AgentAdapter,
  AgentLoopResult,
  AgentLoopStep,
  TraceEvent,
} from './interface.js';
import { parseToolCall, summariseSteps } from './shared.js';
import type { ToolSchema } from '../tools/schema.js';

/**
 * "Real" adapter — points at OpenAI's Chat Completions endpoint. When
 * `OPENAI_API_KEY` is absent the adapter returns a `skipped` variant that
 * records `OPENAI_ENV_MISSING` on every op so the fidelity harness sees a
 * measured divergence rather than a hard test failure. Real HTTP is kept
 * minimal — direct `fetch` against `/v1/chat/completions` — so the SDK
 * isn't pulled into the workspace root.
 */

export interface RealAdapterEnv {
  apiKey: string;
  model: string;
  baseUrl: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_BASE_URL = 'https://api.openai.com';

/** gpt-4o-mini price table (US$ / 1k tokens) — refreshed 2026-07. */
const PRICE_PER_1K = {
  prompt: 0.00015,
  completion: 0.0006,
};

export function detectRealEnv(): RealAdapterEnv | null {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env['OPENAI_MODEL'] ?? DEFAULT_MODEL,
    baseUrl: process.env['OPENAI_BASE_URL'] ?? DEFAULT_BASE_URL,
  };
}

/** Distinguished error emitted when the real adapter runs without a key. */
export class SkippedError extends Error {
  readonly code = 'OPENAI_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because OPENAI_API_KEY is not set`);
  }
}

export function makeRealAdapter(): AgentAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): AgentAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'OPENAI_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    validateToolSchemas: async () => unsupported('validateToolSchemas'),
    runToolLoop: async () => unsupported('runToolLoop'),
    runParallelToolCall: async () => unsupported('runParallelToolCall'),
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

interface OpenAiToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAiCompletionResponse {
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: OpenAiToolCall[];
    };
    finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
  name?: string;
}

function makeConnectedRealAdapter(env: RealAdapterEnv): AgentAdapter {
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
        Authorization: `Bearer ${env.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async function completionCall(
    messages: ConversationMessage[],
    tools: ToolSchema[],
  ): Promise<{ response: OpenAiCompletionResponse; latencyMs: number; costUsd: number }> {
    const start = performance.now();
    const res = await post('/v1/chat/completions', {
      model: env.model,
      messages,
      tools: tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      max_tokens: 512,
    });
    const latencyMs = performance.now() - start;
    latencies.push(latencyMs);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI completion failed ${res.status}: ${errText}`);
    }
    const response = (await res.json()) as OpenAiCompletionResponse;
    const costUsd = costFor(response.usage);
    totalCostUsd += costUsd;
    totalPromptTokens += response.usage.prompt_tokens;
    totalCompletionTokens += response.usage.completion_tokens;
    requests += 1;
    return { response, latencyMs, costUsd };
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async validateToolSchemas(tools) {
      const failures: Array<{ tool: string; reason: string }> = [];
      // Cheap local validation first (same rules as the mock) so a bad
      // schema is caught even without spending a real API call.
      for (const t of tools) {
        if (!t.name) failures.push({ tool: t.name ?? '<unnamed>', reason: 'missing name' });
        else if (t.parameters.type !== 'object') {
          failures.push({ tool: t.name, reason: `parameters.type must be "object", got ${t.parameters.type}` });
        } else if (Object.keys(t.parameters.properties).length === 0) {
          failures.push({ tool: t.name, reason: 'parameters.properties must not be empty' });
        }
      }
      if (failures.length === 0) {
        // Round-trip a no-op prompt to have the OpenAI endpoint accept the
        // tool definitions, so the harness records real server acceptance.
        try {
          await completionCall(
            [
              { role: 'system', content: 'Reply with the single word "ok" and issue no tool calls.' },
              { role: 'user', content: 'ok' },
            ],
            tools,
          );
        } catch (err) {
          failures.push({
            tool: '<probe>',
            reason: `real endpoint rejected schemas: ${(err as Error).message}`,
          });
        }
      }
      const ok = failures.length === 0;
      record('validateToolSchemas', ok, { detail: { toolCount: tools.length, failures } });
      return { ok, failures };
    },

    async runToolLoop(input) {
      const maxIter = input.maxIterations ?? 5;
      const conversation: ConversationMessage[] = [
        { role: 'user', content: input.userMessage },
      ];
      if (input.systemPrompt !== undefined) {
        conversation.unshift({ role: 'system', content: input.systemPrompt });
      }
      const steps: AgentLoopStep[] = [];
      const toolCallOrder: string[] = [];
      const parallelBatches: number[] = [];
      let finalText = '';
      let finish: AgentLoopResult['finishReason'] = 'iteration_cap';

      for (let iter = 0; iter < maxIter; iter += 1) {
        let called: { response: OpenAiCompletionResponse; latencyMs: number; costUsd: number };
        try {
          called = await completionCall(conversation, input.tools);
        } catch (err) {
          record('runToolLoop', false, { errorKind: 'HTTP_ERROR', detail: { iter, message: (err as Error).message } });
          throw err;
        }
        const { response, latencyMs, costUsd } = called;
        const choice = response.choices[0];
        if (!choice) {
          record('runToolLoop', false, { errorKind: 'EMPTY_CHOICES', detail: { iter } });
          break;
        }
        const toolCalls = (choice.message.tool_calls ?? []).map(parseToolCall);

        const step: AgentLoopStep = {
          iteration: iter,
          toolCalls,
          toolResults: [],
          finishReason: choice.finish_reason,
          costUsd,
          latencyMs,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          },
        };
        if (toolCalls.length === 0 || choice.finish_reason !== 'tool_calls') {
          finalText = choice.message.content ?? '';
          finish = choice.finish_reason === 'length'
            ? 'length'
            : choice.finish_reason === 'content_filter'
              ? 'content_filter'
              : 'stop';
          steps.push(step);
          break;
        }
        const assistantMsg: ConversationMessage = {
          role: 'assistant',
          content: choice.message.content,
        };
        if (choice.message.tool_calls !== undefined) {
          assistantMsg.tool_calls = choice.message.tool_calls;
        }
        conversation.push(assistantMsg);
        if (toolCalls.length > 1) parallelBatches.push(toolCalls.length);
        for (const call of toolCalls) {
          toolCallOrder.push(call.name);
          const result = await input.executeTool(call.name, call.args);
          step.toolResults.push({ toolCallId: call.id, result });
          conversation.push({
            role: 'tool',
            tool_call_id: call.id,
            content: result,
          });
        }
        steps.push(step);
      }

      record('runToolLoop', true, {
        detail: {
          iterations: steps.length,
          toolCallOrder,
          parallelBatches,
          finish,
        },
      });

      return {
        finalText,
        steps,
        toolCallOrder,
        parallelBatches,
        ...summariseSteps(steps),
        finishReason: finish,
      };
    },

    async runParallelToolCall(input) {
      const conversation: ConversationMessage[] = [
        { role: 'user', content: input.userMessage },
      ];
      const first = await completionCall(conversation, input.tools);
      const choice = first.response.choices[0];
      const toolCalls = (choice?.message.tool_calls ?? []).map(parseToolCall);
      const step1: AgentLoopStep = {
        iteration: 0,
        toolCalls,
        toolResults: [],
        finishReason: choice?.finish_reason ?? 'tool_calls',
        costUsd: first.costUsd,
        latencyMs: first.latencyMs,
        usage: {
          promptTokens: first.response.usage.prompt_tokens,
          completionTokens: first.response.usage.completion_tokens,
          totalTokens: first.response.usage.total_tokens,
        },
      };
      const settled = await Promise.all(
        toolCalls.map(async (call) => ({
          call,
          result: await input.executeTool(call.name, call.args),
        })),
      );
      for (const s of settled) {
        step1.toolResults.push({ toolCallId: s.call.id, result: s.result });
      }
      const parAssistantMsg: ConversationMessage = {
        role: 'assistant',
        content: choice?.message.content ?? null,
      };
      if (choice?.message.tool_calls !== undefined) {
        parAssistantMsg.tool_calls = choice.message.tool_calls;
      }
      conversation.push(parAssistantMsg);
      for (const s of settled) {
        conversation.push({
          role: 'tool',
          tool_call_id: s.call.id,
          content: s.result,
        });
      }
      const second = await completionCall(conversation, input.tools);
      const finalText = second.response.choices[0]?.message.content ?? '';
      const step2: AgentLoopStep = {
        iteration: 1,
        toolCalls: [],
        toolResults: [],
        finishReason: 'stop',
        costUsd: second.costUsd,
        latencyMs: second.latencyMs,
        usage: {
          promptTokens: second.response.usage.prompt_tokens,
          completionTokens: second.response.usage.completion_tokens,
          totalTokens: second.response.usage.total_tokens,
        },
      };
      record('runParallelToolCall', true, {
        detail: {
          parallelCallCount: toolCalls.length,
          toolNames: toolCalls.map((c) => c.name),
        },
      });
      const steps = [step1, step2];
      return {
        finalText,
        steps,
        toolCallOrder: toolCalls.map((c) => c.name),
        parallelBatches: [toolCalls.length],
        ...summariseSteps(steps),
        finishReason: 'stop',
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

function costFor(u: { prompt_tokens: number; completion_tokens: number }): number {
  return (u.prompt_tokens * PRICE_PER_1K.prompt + u.completion_tokens * PRICE_PER_1K.completion) / 1000;
}
