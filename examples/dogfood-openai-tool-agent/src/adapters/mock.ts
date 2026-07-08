import {
  createOpenAIMock,
  type MockConfig,
  type MockResponse,
  type OpenAiChatCompletionsRequest,
  type OpenAiChatCompletionsResponse,
} from '@kiwa/ai-llm';
import type {
  AgentAdapter,
  AgentLoopResult,
  AgentLoopStep,
  TraceEvent,
} from './interface.js';
import { parseToolCall, summariseSteps } from './shared.js';
import type { ToolSchema } from '../tools/schema.js';

/**
 * Mock adapter — drives the `@kiwa/ai-llm` OpenAI mock so the same
 * agent code exercises {@link createOpenAIMock} without hitting the network.
 *
 * ## Why per-turn client instances
 *
 * OpenAI's function-calling loop has a subtle wrinkle vs Anthropic's — the
 * follow-up user turn is delivered as `role: 'tool'` messages, so the
 * mock's response-bank lookup (which keys by the last `role: 'user'`
 * message content) still resolves to the original prompt on turn 2+. To
 * avoid an infinite tool_use loop, the mock adapter constructs a **fresh
 * mock client with a distinct response bank per turn**, then hand-rolls
 * metric accumulation across turns. This mirrors real OpenAI behaviour
 * where turn 2 receives a new completion whose content depends on the
 * tool results, without requiring changes to the shared MockEngine.
 */
export function makeMockAdapter(): AgentAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    totalCostUsd: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    latencySamplesMs: [] as number[],
    requests: 0,
  };

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function absorbResponse(res: OpenAiChatCompletionsResponse): void {
    metricsAgg.totalCostUsd += res._kiwa.costUsd;
    metricsAgg.totalPromptTokens += res.usage.prompt_tokens;
    metricsAgg.totalCompletionTokens += res.usage.completion_tokens;
    metricsAgg.latencySamplesMs.push(res._kiwa.latencyMs);
    metricsAgg.requests += 1;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async validateToolSchemas(tools) {
      const failures: Array<{ tool: string; reason: string }> = [];
      for (const t of tools) {
        if (!t.name) failures.push({ tool: t.name ?? '<unnamed>', reason: 'missing name' });
        else if (t.parameters.type !== 'object') {
          failures.push({ tool: t.name, reason: `parameters.type must be "object", got ${t.parameters.type}` });
        } else if (Object.keys(t.parameters.properties).length === 0) {
          failures.push({ tool: t.name, reason: 'parameters.properties must not be empty' });
        }
        // Cross-check with the mock: submit a dry run so the response bank
        // registers the tool, giving the harness a real acceptance signal.
        const client = createOpenAIMock({
          responses: {
            [`__schema_probe_${t.name}__`]: { content: 'schema ok' },
          },
        });
        const res = (await client.chat.completions.create({
          messages: [{ role: 'user', content: `__schema_probe_${t.name}__` }],
          tools: [
            {
              type: 'function',
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            },
          ],
        })) as OpenAiChatCompletionsResponse;
        absorbResponse(res);
        if (res.choices[0]?.message.content !== 'schema ok') {
          failures.push({ tool: t.name, reason: 'schema probe did not round-trip' });
        }
      }
      const ok = failures.length === 0;
      record('validateToolSchemas', ok, { detail: { toolCount: tools.length, failures } });
      return { ok, failures };
    },

    async runToolLoop(input) {
      const maxIter = input.maxIterations ?? 5;
      const steps: AgentLoopStep[] = [];
      const toolCallOrder: string[] = [];
      const parallelBatches: number[] = [];
      const conversation: OpenAiChatCompletionsRequest['messages'] = [
        { role: 'user', content: input.userMessage },
      ];
      if (input.systemPrompt !== undefined) {
        conversation.unshift({ role: 'system', content: input.systemPrompt });
      }

      let finalText = '';
      let finish: AgentLoopResult['finishReason'] = 'iteration_cap';
      let breakReason: 'ok' | 'empty_choices' = 'ok';

      for (let iter = 0; iter < maxIter; iter += 1) {
        const client = createOpenAIMock({
          model: 'gpt-4o-mini-mock',
          responses: buildSequentialToolLoopBank(iter),
          artificialLatencyMs: 6,
          costPer1kTokens: { prompt: 0.00015, completion: 0.0006 }, // gpt-4o-mini style
        });
        const res = (await client.chat.completions.create({
          messages: conversation,
          tools: input.tools.map(toOpenAiTool),
          max_tokens: 512,
        })) as OpenAiChatCompletionsResponse;
        absorbResponse(res);
        const choice = res.choices[0];
        if (!choice) {
          record('runToolLoop', false, { errorKind: 'EMPTY_CHOICES', detail: { iter } });
          breakReason = 'empty_choices';
          break;
        }
        const toolCalls = (choice.message.tool_calls ?? []).map(parseToolCall);

        const step: AgentLoopStep = {
          iteration: iter,
          toolCalls,
          toolResults: [],
          finishReason: choice.finish_reason,
          costUsd: res._kiwa.costUsd,
          latencyMs: res._kiwa.latencyMs,
          usage: {
            promptTokens: res.usage.prompt_tokens,
            completionTokens: res.usage.completion_tokens,
            totalTokens: res.usage.total_tokens,
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

        // Append the assistant turn verbatim so real-mode conversation shape
        // is preserved for fidelity comparison.
        const assistantMsg: OpenAiChatCompletionsRequest['messages'][number] = {
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

      if (breakReason === 'ok') {
        record('runToolLoop', true, {
          detail: {
            iterations: steps.length,
            toolCallOrder,
            parallelBatches,
            finish,
          },
        });
      }

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
      const client = createOpenAIMock({
        model: 'gpt-4o-mini-mock',
        responses: buildParallelToolBank(),
        artificialLatencyMs: 6,
        costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
      });
      const conversation: OpenAiChatCompletionsRequest['messages'] = [
        { role: 'user', content: input.userMessage },
      ];
      const res1 = (await client.chat.completions.create({
        messages: conversation,
        tools: input.tools.map(toOpenAiTool),
        max_tokens: 512,
      })) as OpenAiChatCompletionsResponse;
      absorbResponse(res1);
      const choice = res1.choices[0];
      if (!choice) {
        record('runParallelToolCall', false, { errorKind: 'EMPTY_CHOICES' });
        throw new Error('mock parallel tool call turn 0 returned no choices');
      }
      const toolCalls = (choice.message.tool_calls ?? []).map(parseToolCall);
      const step1: AgentLoopStep = {
        iteration: 0,
        toolCalls,
        toolResults: [],
        finishReason: choice.finish_reason,
        costUsd: res1._kiwa.costUsd,
        latencyMs: res1._kiwa.latencyMs,
        usage: {
          promptTokens: res1.usage.prompt_tokens,
          completionTokens: res1.usage.completion_tokens,
          totalTokens: res1.usage.total_tokens,
        },
      };
      // If the mock chose not to call any tool on turn 0 the test surface
      // does not expect a finaliser — terminate on step 1 so the trace
      // records the divergence rather than papering it over.
      if (toolCalls.length === 0 || choice.finish_reason !== 'tool_calls') {
        record('runParallelToolCall', false, {
          errorKind: 'NO_PARALLEL_TOOL_CALLS',
          detail: { finishReason: choice.finish_reason },
        });
        const steps = [step1];
        return {
          finalText: choice.message.content ?? '',
          steps,
          toolCallOrder: [],
          parallelBatches: [],
          ...summariseSteps(steps),
          finishReason: choice.finish_reason === 'length'
            ? 'length'
            : choice.finish_reason === 'content_filter'
              ? 'content_filter'
              : 'stop',
        };
      }

      // Resolve all tool_calls concurrently to prove the mock preserves
      // parallel-safe semantics — the executor runs each call independently
      // and the app collects results before feeding them back.
      const settled = await Promise.all(
        toolCalls.map(async (call) => ({
          call,
          result: await input.executeTool(call.name, call.args),
        })),
      );
      for (const s of settled) {
        step1.toolResults.push({ toolCallId: s.call.id, result: s.result });
      }
      const parAssistantMsg: OpenAiChatCompletionsRequest['messages'][number] = {
        role: 'assistant',
        content: choice.message.content,
      };
      if (choice.message.tool_calls !== undefined) {
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

      const finaliserClient = createOpenAIMock({
        model: 'gpt-4o-mini-mock',
        responses: buildParallelFinaliserBank(),
        artificialLatencyMs: 6,
        costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
      });
      const res2 = (await finaliserClient.chat.completions.create({
        messages: conversation,
        tools: input.tools.map(toOpenAiTool),
        max_tokens: 512,
      })) as OpenAiChatCompletionsResponse;
      absorbResponse(res2);
      const secondChoice = res2.choices[0];
      if (!secondChoice) {
        record('runParallelToolCall', false, { errorKind: 'EMPTY_CHOICES_FINALISER' });
        throw new Error('mock parallel tool call finaliser turn returned no choices');
      }
      const finalText = secondChoice.message.content ?? '';
      const step2: AgentLoopStep = {
        iteration: 1,
        toolCalls: [],
        toolResults: [],
        finishReason: secondChoice.finish_reason,
        costUsd: res2._kiwa.costUsd,
        latencyMs: res2._kiwa.latencyMs,
        usage: {
          promptTokens: res2.usage.prompt_tokens,
          completionTokens: res2.usage.completion_tokens,
          totalTokens: res2.usage.total_tokens,
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
        finishReason: secondChoice.finish_reason === 'length'
          ? 'length'
          : secondChoice.finish_reason === 'content_filter'
            ? 'content_filter'
            : 'stop',
      };
    },

    metrics() {
      return {
        totalCostUsd: metricsAgg.totalCostUsd,
        totalPromptTokens: metricsAgg.totalPromptTokens,
        totalCompletionTokens: metricsAgg.totalCompletionTokens,
        totalTokens: metricsAgg.totalPromptTokens + metricsAgg.totalCompletionTokens,
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        requests: metricsAgg.requests,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.totalCostUsd = 0;
      metricsAgg.totalPromptTokens = 0;
      metricsAgg.totalCompletionTokens = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.requests = 0;
    },
  };
}

function toOpenAiTool(t: ToolSchema): NonNullable<OpenAiChatCompletionsRequest['tools']>[number] {
  return {
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  };
}

/**
 * Response bank for the sequential 3-tool orchestration prompt (Task 3.2).
 *
 * Turn 0 requests `get_weather` (Tokyo). Turn 1 requests `calculator` (C to
 * F conversion of the returned temperature). Turn 2 requests `search`
 * (typhoon Japan). Turn 3+ returns the final answer text.
 *
 * `iteration` selects a subset of the response bank so the same user prompt
 * yields a *different* mock response per turn — this simulates OpenAI's
 * behaviour where each completion depends on the running tool_results.
 */
function buildSequentialToolLoopBank(iteration: number): Record<string, MockResponse> {
  const prompt = 'Fetch the weather in Tokyo, convert the temperature to Fahrenheit, and search for related typhoon news.';
  const finalContent = 'Tokyo is 22C (about 71.6F) with clear skies, and there is one recent typhoon-related news item: "Typhoon Nari approaches Kanto region".';
  const bank: Record<string, MockResponse> = {};
  if (iteration === 0) {
    bank[prompt] = {
      content: '',
      toolCalls: [
        {
          id: 'call_mock_weather',
          name: 'get_weather',
          arguments: JSON.stringify({ location: 'Tokyo' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 48, completionTokens: 22 },
    };
  } else if (iteration === 1) {
    bank[prompt] = {
      content: '',
      toolCalls: [
        {
          id: 'call_mock_calc',
          name: 'calculator',
          arguments: JSON.stringify({ expression: '22 * 9 / 5 + 32' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 64, completionTokens: 26 },
    };
  } else if (iteration === 2) {
    bank[prompt] = {
      content: '',
      toolCalls: [
        {
          id: 'call_mock_search',
          name: 'search',
          arguments: JSON.stringify({ query: 'typhoon japan' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 80, completionTokens: 24 },
    };
  } else {
    bank[prompt] = {
      content: finalContent,
      finishReason: 'stop',
      usage: { promptTokens: 110, completionTokens: 34 },
    };
  }
  return bank;
}

/**
 * Response bank for the parallel-tool-call turn (Task 3.3). The prompt
 * elicits two `get_weather` calls (Tokyo + Washington) in the same
 * assistant turn — the app's `runParallelToolCall` resolves them together
 * and expects a single finalisation turn.
 */
function buildParallelToolBank(): Record<string, MockResponse> {
  const prompt = 'What is the current temperature in Tokyo and Washington DC? Fetch both at the same time.';
  return {
    [prompt]: {
      content: '',
      toolCalls: [
        {
          id: 'call_par_tokyo',
          name: 'get_weather',
          arguments: JSON.stringify({ location: 'Tokyo' }),
        },
        {
          id: 'call_par_washington',
          name: 'get_weather',
          arguments: JSON.stringify({ location: 'Washington DC' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 52, completionTokens: 30 },
    },
  };
}

function buildParallelFinaliserBank(): Record<string, MockResponse> {
  const prompt = 'What is the current temperature in Tokyo and Washington DC? Fetch both at the same time.';
  return {
    [prompt]: {
      content: 'Tokyo is 22C with clear skies, and Washington DC is 24C with partly cloudy skies.',
      finishReason: 'stop',
      usage: { promptTokens: 96, completionTokens: 30 },
    },
  };
}

/** Re-export for tests that peek at the mock config shape. */
export type { MockConfig };
