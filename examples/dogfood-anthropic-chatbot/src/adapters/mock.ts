import {
  createAnthropicMock,
  type AnthropicMock,
  type AnthropicMessagesRequest,
  type MockResponse,
} from '@kiwa-test/ai-llm';
import type {
  ChatbotAdapter,
  ChatResult,
  StreamedChatResult,
  ToolLoopResult,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives the `@kiwa-test/ai-llm` Anthropic mock so the same
 * app code exercises {@link AnthropicMock} without touching the network. The
 * mock returns deterministic responses so fidelity tests can assert on the
 * shape of streaming, system prompt and tool_use behaviour.
 *
 * The response bank below is intentionally close to the shape a Claude 3.5
 * Sonnet reply would take — the fidelity harness compares mock vs real
 * behaviour (SSE token count, cost, tool call sequencing) rather than exact
 * text, so approximate content is sufficient.
 */
export function makeMockAdapter(): ChatbotAdapter {
  const client = createAnthropicMock({
    model: 'claude-3-5-sonnet-mock',
    defaultResponse:
      'This is a deterministic mock reply produced by @kiwa-test/ai-llm createAnthropicMock. The dogfood harness diffs this against a real Anthropic response.',
    responses: buildResponseBank(),
    artificialLatencyMs: 8,
    costPer1kTokens: { prompt: 0.003, completion: 0.015 }, // Sonnet-style pricing so cost tracking has realistic magnitudes
  });
  const trace: TraceEvent[] = [];

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async reply(input) {
      const req: AnthropicMessagesRequest = {
        model: 'claude-3-5-sonnet-mock',
        messages: [{ role: 'user', content: input.userMessage }],
        max_tokens: input.maxTokens ?? 1024,
      };
      if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
      // MockEngine records latency internally on each runChat call; we
      // do not shadow-count it here.
      const res = await client.messages.create(req);
      const text = res.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('');
      record('reply', true, { detail: { hasSystemPrompt: input.systemPrompt !== undefined } });
      return {
        text,
        usage: {
          promptTokens: res.usage.input_tokens,
          completionTokens: res.usage.output_tokens,
          totalTokens: res.usage.input_tokens + res.usage.output_tokens,
        },
        costUsd: res._kiwa.costUsd,
        latencyMs: res._kiwa.latencyMs,
        finishReason: toFinishReason(res.stop_reason),
      };
    },

    async replyStream(input) {
      const req: AnthropicMessagesRequest = {
        model: 'claude-3-5-sonnet-mock',
        messages: [{ role: 'user', content: input.userMessage }],
        stream: true,
        max_tokens: input.maxTokens ?? 1024,
      };
      if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
      const start = performance.now();
      const chunks: string[] = [];
      let promptTokens = 0;
      let completionTokens = 0;
      let costUsd = 0;
      let latencyMs = 0;
      for await (const ev of client.messages.stream(req)) {
        if (ev.type === 'content_block_delta' && ev.delta && 'text' in ev.delta) {
          chunks.push(ev.delta.text);
        }
        if (ev.type === 'message_delta' && ev.usage) {
          promptTokens = ev.usage.input_tokens;
          completionTokens = ev.usage.output_tokens;
        }
        if (ev.type === 'message_stop' && ev._kiwa) {
          costUsd = ev._kiwa.costUsd;
          latencyMs = ev._kiwa.latencyMs;
        }
      }
      // Fallback to wall clock when the mock event stream did not carry a
      // _kiwa latency (older responses / non-streaming paths).
      if (latencyMs === 0) latencyMs = performance.now() - start;
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
        latencyMs,
      };
    },

    async toolLoop(input) {
      const maxIter = input.maxIterations ?? 4;
      const conversation: AnthropicMessagesRequest['messages'] = [
        { role: 'user', content: input.userMessage },
      ];
      const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
      let finalText = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let costUsd = 0;
      let latencyMs = 0;

      for (let iter = 0; iter < maxIter; iter += 1) {
        const req: AnthropicMessagesRequest = {
          model: 'claude-3-5-sonnet-mock',
          messages: conversation,
          tools: input.tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          })),
          max_tokens: 1024,
        };
        if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
        // MockEngine records latency internally per create() call.
        const res = await client.messages.create(req);
        usage = {
          promptTokens: usage.promptTokens + res.usage.input_tokens,
          completionTokens: usage.completionTokens + res.usage.output_tokens,
          totalTokens: usage.totalTokens + res.usage.input_tokens + res.usage.output_tokens,
        };
        costUsd += res._kiwa.costUsd;
        latencyMs += res._kiwa.latencyMs;

        const toolUses = res.content.filter(
          (c): c is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
            c.type === 'tool_use',
        );
        finalText = res.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join('');

        if (toolUses.length === 0 || res.stop_reason !== 'tool_use') {
          break;
        }

        // Assistant asked for tool_use — resolve each one, feed results back
        // as the next user turn.
        conversation.push({
          role: 'assistant',
          content: res.content.map((c) =>
            c.type === 'text' ? { type: 'text', text: c.text } : { type: 'tool_use', input: c.input },
          ),
        });
        const results: Array<{ type: string; tool_use_id: string; content: string }> = [];
        for (const use of toolUses) {
          toolCalls.push({ name: use.name, args: use.input });
          const result = await input.resolveTool(use.name, use.input);
          results.push({ type: 'tool_result', tool_use_id: use.id, content: result });
        }
        conversation.push({ role: 'user', content: results });
      }

      record('toolLoop', true, { detail: { toolCallCount: toolCalls.length } });
      return { finalText, toolCalls, usage, costUsd, latencyMs };
    },

    metrics() {
      const m = client.getMetrics();
      return {
        totalCostUsd: m.totalCostUsd,
        totalPromptTokens: m.totalTokens.promptTokens,
        totalCompletionTokens: m.totalTokens.completionTokens,
        totalTokens: m.totalTokens.totalTokens,
        latencySamplesMs: [...m.latencySamplesMs],
        requests: m.requests,
      };
    },

    async reset() {
      client.reset();
      trace.length = 0;
    },
  };
}

function toFinishReason(
  stop: 'end_turn' | 'tool_use' | 'max_tokens',
): ChatResult['finishReason'] {
  if (stop === 'tool_use') return 'tool_use';
  if (stop === 'max_tokens') return 'length';
  return 'stop';
}

/**
 * Deterministic response bank — user prompt → mock reply. The keys mirror
 * the prompts driven by the dogfood flows so every test path hits a
 * canonical, inspectable response instead of the default fallback.
 */
function buildResponseBank(): Record<string, MockResponse> {
  return {
    'Say hi in one sentence.': {
      content:
        'Hi there! I hope you are having a great day.',
      usage: { promptTokens: 12, completionTokens: 10 },
    },
    'Stream a short bedtime story about a robot.': {
      content: 'Once upon a time a robot dreamt of stars and drifted to sleep.',
      chunks: [
        'Once ',
        'upon ',
        'a ',
        'time ',
        'a ',
        'robot ',
        'dreamt ',
        'of ',
        'stars ',
        'and ',
        'drifted ',
        'to ',
        'sleep.',
      ],
      usage: { promptTokens: 18, completionTokens: 14 },
    },
    "What is the weather in Tokyo and what is 12 * 7?": {
      // First response asks for both tools. The mock is a static replier so
      // the followup after tool_result is a plain text finalisation.
      content: '',
      toolCalls: [
        {
          id: 'toolu_mock_weather_tokyo',
          name: 'get_weather',
          arguments: JSON.stringify({ city: 'Tokyo' }),
        },
        {
          id: 'toolu_mock_calc_84',
          name: 'calculator',
          arguments: JSON.stringify({ expression: '12 * 7' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 42, completionTokens: 18 },
    },
    // After tool_use, the follow-up user message contains only tool_result
    // blocks — the ai-llm anthropic adapter maps non-text content to an
    // empty string, so the engine matches on '' for the finalisation turn.
    '': {
      content:
        'Tokyo currently has clear skies, and 12 * 7 = 84. Anything else you would like to know?',
      usage: { promptTokens: 96, completionTokens: 22 },
      finishReason: 'stop',
    },
    'Reply as a pirate.': {
      content: 'Arrr matey! The tides be favourable and the horizon be wide.',
      usage: { promptTokens: 14, completionTokens: 16 },
    },
  };
}
