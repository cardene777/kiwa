# OpenAI tool-use agent (function calling + parallel calls)

## What you'll build

A vitest test file that drives an OpenAI Chat Completions **function-calling agent** through two flows — a **3-tool sequential loop** (weather → calculator → search) and a **parallel tool call** (two weather calls at once) — using `@kiwa-test/ai-llm`'s `createOpenAIMock`. The mock preserves OpenAI's per-turn `role: 'tool'` message shape so tests can assert both call ordering and parallel-safe semantics.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-openai-tool-agent && cd kiwa-openai-tool-agent
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-test/ai-llm
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/tools.ts` — three canned tool executors + JSON schemas:

```ts
export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const AGENT_TOOLS: ToolSchema[] = [
  {
    name: 'get_weather',
    description: 'Return the current weather for a city as a compact JSON string.',
    parameters: {
      type: 'object',
      properties: { location: { type: 'string' } },
      required: ['location'],
    },
  },
  {
    name: 'calculator',
    description: 'Evaluate a simple arithmetic expression and return the result.',
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string' } },
      required: ['expression'],
    },
  },
  {
    name: 'search',
    description: 'Search a canned news index and return up to 3 titles as JSON.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (name === 'get_weather') {
    const location = String(args['location'] ?? 'Unknown');
    const canned: Record<string, { temp_c: number; sky: string }> = {
      Tokyo: { temp_c: 22, sky: 'clear' },
      'Washington DC': { temp_c: 24, sky: 'partly cloudy' },
    };
    return JSON.stringify({ location, ...(canned[location] ?? { temp_c: 18, sky: 'clear' }) });
  }
  if (name === 'calculator') {
    const expression = String(args['expression'] ?? '');
    if (!/^[\s0-9+\-*/().]+$/.test(expression)) return 'NaN';
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expression});`) as () => number;
    try {
      const v = fn();
      return String(typeof v === 'number' && Number.isFinite(v) ? v : NaN);
    } catch {
      return 'NaN';
    }
  }
  if (name === 'search') {
    return JSON.stringify(['Typhoon Nari approaches Kanto region']);
  }
  return `unknown tool ${name}`;
}
```

Create `src/mock-turns.ts` — per-turn response banks that mirror the dogfood app's approach:

```ts
import type { MockResponse } from '@kiwa-test/ai-llm';

/**
 * OpenAI's tool loop appends `role: 'tool'` messages after the assistant's
 * tool_call turn. The MockEngine's response bank keys by the last
 * `role: 'user'` message content, so we need a fresh response bank per turn
 * — one for the weather call, one for the calculator call, one for the
 * search call, and one for the finaliser.
 */
export function bankForTurn(iter: number): Record<string, MockResponse> {
  const prompt =
    'Fetch the weather in Tokyo, convert the temperature to Fahrenheit, and search for related typhoon news.';
  const bank: Record<string, MockResponse> = {};
  if (iter === 0) {
    bank[prompt] = {
      content: '',
      finishReason: 'tool_use',
      usage: { promptTokens: 40, completionTokens: 16 },
      toolCalls: [
        {
          id: 'call_mock_weather_tokyo',
          name: 'get_weather',
          arguments: JSON.stringify({ location: 'Tokyo' }),
        },
      ],
    };
  } else if (iter === 1) {
    bank[prompt] = {
      content: '',
      finishReason: 'tool_use',
      usage: { promptTokens: 60, completionTokens: 18 },
      toolCalls: [
        {
          id: 'call_mock_calc_fahrenheit',
          name: 'calculator',
          arguments: JSON.stringify({ expression: '22 * 9 / 5 + 32' }),
        },
      ],
    };
  } else if (iter === 2) {
    bank[prompt] = {
      content: '',
      finishReason: 'tool_use',
      usage: { promptTokens: 82, completionTokens: 14 },
      toolCalls: [
        {
          id: 'call_mock_search_typhoon',
          name: 'search',
          arguments: JSON.stringify({ query: 'typhoon Japan' }),
        },
      ],
    };
  } else {
    bank[prompt] = {
      content:
        'Tokyo is clear at 22C (71.6F). Latest news mentions Typhoon Nari approaching the Kanto region.',
      finishReason: 'stop',
      usage: { promptTokens: 120, completionTokens: 32 },
    };
  }
  return bank;
}

/** Parallel-call bank — one prompt, two simultaneous tool_calls on turn 0. */
export function parallelBank(): Record<string, MockResponse> {
  return {
    'What is the current temperature in Tokyo and Washington DC? Fetch both at the same time.': {
      content: '',
      finishReason: 'tool_use',
      usage: { promptTokens: 44, completionTokens: 20 },
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
    },
  };
}

export function parallelFinaliser(): Record<string, MockResponse> {
  return {
    'What is the current temperature in Tokyo and Washington DC? Fetch both at the same time.': {
      content: 'Tokyo is 22C. Washington DC is 24C.',
      finishReason: 'stop',
      usage: { promptTokens: 96, completionTokens: 18 },
    },
  };
}
```

Add `tests/agent.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createOpenAIMock,
  type OpenAiChatCompletionsRequest,
  type OpenAiChatCompletionsResponse,
} from '@kiwa-test/ai-llm';
import { AGENT_TOOLS, executeTool, type ToolSchema } from '../src/tools.js';
import { bankForTurn, parallelBank, parallelFinaliser } from '../src/mock-turns.js';

function toOpenAiTool(t: ToolSchema) {
  return {
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  };
}

describe('openai tool-use agent — mock', () => {
  it('drives a 3-tool sequential loop and finalises to text', async () => {
    const conversation: OpenAiChatCompletionsRequest['messages'] = [
      {
        role: 'user',
        content:
          'Fetch the weather in Tokyo, convert the temperature to Fahrenheit, and search for related typhoon news.',
      },
    ];
    const toolCallOrder: string[] = [];
    let finalText = '';

    for (let iter = 0; iter < 5; iter += 1) {
      const client = createOpenAIMock({
        model: 'gpt-4o-mini-mock',
        responses: bankForTurn(iter),
        artificialLatencyMs: 6,
        costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
      });
      const res = (await client.chat.completions.create({
        messages: conversation,
        tools: AGENT_TOOLS.map(toOpenAiTool),
        max_tokens: 512,
      })) as OpenAiChatCompletionsResponse;
      const choice = res.choices[0]!;
      const toolCalls = choice.message.tool_calls ?? [];

      if (toolCalls.length === 0 || choice.finish_reason !== 'tool_calls') {
        finalText = choice.message.content ?? '';
        break;
      }

      // Append the assistant turn verbatim, then feed tool results back.
      conversation.push({
        role: 'assistant',
        content: choice.message.content,
        tool_calls: toolCalls,
      });
      for (const call of toolCalls) {
        toolCallOrder.push(call.function.name);
        const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
        const result = await executeTool(call.function.name, args);
        conversation.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result,
        });
      }
    }

    expect(toolCallOrder).toEqual(['get_weather', 'calculator', 'search']);
    expect(finalText).toMatch(/Tokyo/);
    expect(finalText).toMatch(/71\.6F/);
  });

  it('resolves parallel tool_calls on a single turn', async () => {
    const client = createOpenAIMock({
      model: 'gpt-4o-mini-mock',
      responses: parallelBank(),
      artificialLatencyMs: 6,
      costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
    });
    const conversation: OpenAiChatCompletionsRequest['messages'] = [
      {
        role: 'user',
        content:
          'What is the current temperature in Tokyo and Washington DC? Fetch both at the same time.',
      },
    ];
    const res1 = (await client.chat.completions.create({
      messages: conversation,
      tools: AGENT_TOOLS.map(toOpenAiTool),
      max_tokens: 512,
    })) as OpenAiChatCompletionsResponse;
    const choice = res1.choices[0]!;
    const toolCalls = choice.message.tool_calls ?? [];
    expect(toolCalls.length).toBe(2);
    expect(toolCalls.map((c) => c.function.name)).toEqual(['get_weather', 'get_weather']);

    // Execute both in parallel (Promise.all) — real OpenAI expects the
    // caller to resolve every tool_call before the finaliser turn.
    const settled = await Promise.all(
      toolCalls.map(async (call) => ({
        call,
        result: await executeTool(
          call.function.name,
          JSON.parse(call.function.arguments) as Record<string, unknown>,
        ),
      })),
    );
    conversation.push({
      role: 'assistant',
      content: choice.message.content,
      tool_calls: toolCalls,
    });
    for (const s of settled) {
      conversation.push({
        role: 'tool',
        tool_call_id: s.call.id,
        content: s.result,
      });
    }

    const finaliser = createOpenAIMock({
      model: 'gpt-4o-mini-mock',
      responses: parallelFinaliser(),
      artificialLatencyMs: 6,
      costPer1kTokens: { prompt: 0.00015, completion: 0.0006 },
    });
    const res2 = (await finaliser.chat.completions.create({
      messages: conversation,
      tools: AGENT_TOOLS.map(toOpenAiTool),
      max_tokens: 512,
    })) as OpenAiChatCompletionsResponse;
    expect(res2.choices[0]?.message.content).toMatch(/Tokyo is 22C/);
    expect(res2.choices[0]?.message.content).toMatch(/Washington DC is 24C/);
  });
});
```

Run:

```bash
pnpm test
```

You should see two passing tests in under a second.

## Explanation

- The **fresh mock client per turn** pattern sidesteps a quirk of OpenAI's tool loop. When the assistant asks for a tool call, the follow-up user turn is delivered as `role: 'tool'` messages — the MockEngine's response-bank lookup still keys on the last `role: 'user'` message, so the same prompt would replay on turn 2+ and the loop would never terminate. Constructing a fresh mock per iteration with a different response bank per turn preserves OpenAI's per-turn behaviour without changing the shared engine.
- `AGENT_TOOLS` is the OpenAI JSON Schema subset (`type: 'object'` + `properties` + `required`). `toOpenAiTool` wraps each schema in `{ type: 'function', function: { ... } }` — the shape `POST /v1/chat/completions` accepts.
- Parallel tool call is a first-class OpenAI feature since 2024-06. The mock returns two `tool_calls` on turn 0; the app resolves both via `Promise.all` before feeding results back on turn 1. Real OpenAI expects the caller to resolve **every** `tool_call` before the finaliser turn — omitting any triggers `400 invalid_request_error`.
- Cost tracking uses gpt-4o-mini rates ($0.00015 prompt / $0.0006 completion per 1k tokens) so cost assertions have realistic magnitudes.

## Real-vs-mock fidelity (optional)

The dogfood app at `examples/dogfood-openai-tool-agent/` (see [`src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-openai-tool-agent/src/adapters/mock.ts) + [`src/adapters/real.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-openai-tool-agent/src/adapters/real.ts)) wraps the same flows behind an `AgentAdapter` interface. The fidelity harness diffs mock vs real trace events (`toolCallOrder`, `parallelBatches`, cost / latency deltas) and emits `quality-report/fidelity-latest.md` for the 11-axis release gate.

Real-mode envs.

- `OPENAI_API_KEY` — required. Without it, `makeRealAdapter()` reports `OPENAI_ENV_MISSING`.
- `OPENAI_MODEL` — defaults to `gpt-4o-mini`.
- `OPENAI_BASE_URL` — defaults to `https://api.openai.com`.

## Troubleshoot

- **`toolCallOrder` mismatch** — Check the per-turn bank keys the prompt exactly. The MockEngine uses strict string equality on the last user message content; a stray newline or trailing space triggers the default fallback and the loop terminates early.
- **`tool_call_id` mismatch (real mode)** — OpenAI requires the `tool_call_id` in each `role: 'tool'` message match the `id` from the assistant's `tool_calls` array. The snippet propagates `call.id` verbatim.
- **Parallel finaliser returns another `tool_calls` batch** — Your finaliser bank probably still declares `finishReason: 'tool_use'`. Set `finishReason: 'stop'` on the finaliser response.
- **Cost is `0`** — `costPer1kTokens` was not passed. The default rate is Haiku's ($0.00025 prompt / $0.00125 completion); pass gpt-4o-mini rates explicitly if you want realistic magnitudes.

## Next steps

- [Vercel AI RAG](./08-vercel-ai-rag.md) shows retrieval-augmented answering with embeddings + a vector store.
- The [AI-LLM testing concept guide](../concepts/ai-llm-testing.md) explains why AI-LLM tests need the extra fidelity / cost / accuracy axes.
- The dogfood app's [`shared.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-openai-tool-agent/src/adapters/shared.ts) has a small `summariseSteps` helper for aggregating per-turn cost / latency / token totals.
