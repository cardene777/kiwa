# Anthropic chatbot streaming + tool_use in 10 min

## What you'll build

A single vitest test that drives a small chatbot through **three Anthropic Messages API surfaces** — a non-streaming reply with a system prompt, a streaming reply with delta chunks, and a two-tool `tool_use` loop (weather + calculator) — using `@kiwa-lab/ai-llm`'s `createAnthropicMock`. The same test file also works against the real Anthropic API when `ANTHROPIC_API_KEY` is set, so the fidelity harness can diff mock vs real behaviour.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (the snippets use pnpm; npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-anthropic-chatbot && cd kiwa-anthropic-chatbot
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/ai-llm
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

Create `src/mock-adapter.ts` — the mock the tests drive:

```ts
import { createAnthropicMock, type AnthropicMessagesRequest } from '@kiwa-lab/ai-llm';

/**
 * Build a chatbot mock that mirrors real Anthropic response shapes for the
 * three flows the tests exercise. The response bank keys are the exact
 * user-message content strings the tests send in.
 */
export function makeChatbotMock() {
  return createAnthropicMock({
    model: 'claude-3-5-sonnet-mock',
    artificialLatencyMs: 8,
    costPer1kTokens: { prompt: 0.003, completion: 0.015 },
    responses: {
      'Reply as a pirate.': {
        content: 'Arrr matey! The tides be favourable and the horizon be wide.',
        usage: { promptTokens: 14, completionTokens: 16 },
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
      'What is the weather in Tokyo and what is 12 * 7?': {
        content: '',
        finishReason: 'tool_use',
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
        usage: { promptTokens: 42, completionTokens: 18 },
      },
      // Follow-up turn after tool_result: the ai-llm anthropic adapter maps
      // non-text content to an empty string, so the mock matches on '' to
      // finalise the loop.
      '': {
        content:
          'Tokyo currently has clear skies, and 12 * 7 = 84. Anything else you would like to know?',
        finishReason: 'stop',
        usage: { promptTokens: 96, completionTokens: 22 },
      },
    },
  });
}

/** Reusable request shape for `messages.create` + `messages.stream`. */
export function buildRequest(input: {
  userMessage: string;
  systemPrompt?: string;
  stream?: boolean;
}): AnthropicMessagesRequest {
  const req: AnthropicMessagesRequest = {
    model: 'claude-3-5-sonnet-mock',
    max_tokens: 1024,
    messages: [{ role: 'user', content: input.userMessage }],
  };
  if (input.systemPrompt) req.system = input.systemPrompt;
  if (input.stream) req.stream = true;
  return req;
}
```

Add `tests/chatbot.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { buildRequest, makeChatbotMock } from '../src/mock-adapter.js';

let client: ReturnType<typeof makeChatbotMock>;

afterEach(() => {
  client?.reset();
});

describe('anthropic chatbot — mock', () => {
  it('replies with a system prompt applied (non-streaming)', async () => {
    client = makeChatbotMock();
    const res = await client.messages.create(
      buildRequest({
        userMessage: 'Reply as a pirate.',
        systemPrompt: 'You are a helpful pirate. Speak in a swashbuckling tone.',
      }),
    );
    const text = res.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('');
    expect(text).toMatch(/Arrr/);
    expect(res.usage.output_tokens).toBeGreaterThan(0);
    expect(res._kiwa.costUsd).toBeGreaterThan(0);
    expect(res._kiwa.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('streams a reply as SSE delta chunks', async () => {
    client = makeChatbotMock();
    const chunks: string[] = [];
    for await (const ev of client.messages.stream(
      buildRequest({
        userMessage: 'Stream a short bedtime story about a robot.',
        stream: true,
      }),
    )) {
      if (ev.type === 'content_block_delta' && ev.delta && 'text' in ev.delta) {
        chunks.push(ev.delta.text);
      }
    }
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toContain('robot');
  });

  it('drives a two-tool tool_use loop and finalises to a text answer', async () => {
    client = makeChatbotMock();
    // Turn 0 — assistant asks for both tools.
    const first = await client.messages.create({
      model: 'claude-3-5-sonnet-mock',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: 'What is the weather in Tokyo and what is 12 * 7?' },
      ],
      tools: [
        {
          name: 'get_weather',
          description: 'Return the current weather for a city.',
          input_schema: {
            type: 'object',
            properties: { city: { type: 'string' } },
            required: ['city'],
          },
        },
        {
          name: 'calculator',
          description: 'Evaluate a simple arithmetic expression.',
          input_schema: {
            type: 'object',
            properties: { expression: { type: 'string' } },
            required: ['expression'],
          },
        },
      ],
    });
    const toolUses = first.content.filter(
      (c): c is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
        c.type === 'tool_use',
    );
    expect(toolUses.map((t) => t.name)).toEqual(['get_weather', 'calculator']);

    // Turn 1 — app resolves each tool and feeds results back.
    const toolResults = toolUses.map((use) => ({
      type: 'tool_result' as const,
      tool_use_id: use.id,
      content:
        use.name === 'get_weather'
          ? 'Tokyo: clear skies, 22C'
          : String(12 * 7),
    }));
    const final = await client.messages.create({
      model: 'claude-3-5-sonnet-mock',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: 'What is the weather in Tokyo and what is 12 * 7?' },
        { role: 'assistant', content: first.content },
        { role: 'user', content: toolResults },
      ],
    });
    const finalText = final.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('');
    expect(finalText).toMatch(/Tokyo/);
    expect(finalText).toMatch(/84/);
  });
});
```

Run:

```bash
pnpm test
```

You should see three passing tests in under a second.

## Explanation

- `createAnthropicMock` returns a client whose `messages.create` + `messages.stream` shape matches `@anthropic-ai/sdk`. The mock is a deterministic replier — every response comes from the `responses` bank keyed by the last `role: 'user'` message content.
- Each returned message carries `res._kiwa = { costUsd, latencyMs }` so cost + latency assertions do not need external instrumentation. The `costPer1kTokens` field controls the pricing table — the snippet uses Sonnet-style rates ($0.003 prompt / $0.015 completion per 1k tokens).
- The streaming test consumes the same SSE event shape (`content_block_delta` → `text_delta`) real Anthropic returns, so switching to the real API is a matter of pointing the request at `https://api.anthropic.com/v1/messages` — no test code changes.
- The `tool_use` test mirrors Anthropic's two-turn tool loop. Turn 0 returns `stop_reason: 'tool_use'` with a `tool_use` block per requested tool; the app supplies `tool_result` blocks on turn 1 and the assistant finalises to plain text. The mock keys the finalisation response on `''` because non-text content blocks resolve to an empty string in the response bank lookup.

## Real-vs-mock fidelity (optional)

The dogfood app at `examples/dogfood-anthropic-chatbot/` (see [`src/adapters/interface.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-anthropic-chatbot/src/adapters/interface.ts) + [`src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-anthropic-chatbot/src/adapters/mock.ts) + [`src/adapters/real.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-anthropic-chatbot/src/adapters/real.ts)) wraps the same three flows behind a `ChatbotAdapter` interface so the fidelity harness can diff mock vs real trace events. The `quality-report/fidelity-latest.md` snapshot records cost / latency / token / accuracy divergence — those four axes feed the release gate's AI-LLM branch.

Real-mode envs.

- `ANTHROPIC_API_KEY` — required. Without it, `makeRealAdapter()` returns a "skipped" variant whose every method records `ANTHROPIC_ENV_MISSING`.
- `ANTHROPIC_MODEL` — defaults to `claude-3-5-sonnet-latest`.
- `ANTHROPIC_BASE_URL` — defaults to `https://api.anthropic.com`.

## Troubleshoot

- **`Cannot find module '@kiwa-lab/ai-llm'`** — Reinstall with `pnpm install`. The package is peer-dep free but the mock engine ships as ESM only, so `"type": "module"` in `package.json` is required.
- **`chunks` is empty in the streaming test** — The mock only emits `content_block_delta` events when the response bank entry has a `chunks: [...]` array. Add `chunks: [...]` alongside `content` to any prompt you want to stream.
- **Tool loop never finalises** — The mock resolves the follow-up turn by matching on `''` (empty content lookup key). Make sure your response bank has an entry for `''` after your `tool_use` response.
- **`costUsd` is 0 for streamed responses** — Streaming mode reports cost via `message_stop._kiwa.costUsd`. If your test loop breaks before consuming `message_stop` the cost falls back to 0 — always drain the async iterator.

## Next steps

- [OpenAI tool agent](./07-openai-tool-agent.md) shows the OpenAI function-calling equivalent with parallel tool calls.
- [Vercel AI RAG](./08-vercel-ai-rag.md) chains Vercel AI SDK + LangChain + a vector store for retrieval-augmented answering.
- The [ai-LLM testing concept guide](../concepts/ai-llm-testing.md) explains why AI-LLM tests need the extra fidelity / cost / accuracy axes.
