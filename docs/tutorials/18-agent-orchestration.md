# Agent orchestration — LangGraph + Assistants v2 in 12 min

## What you'll build

A vitest test file that drives **two agent orchestration styles** under one API — a LangGraph-style `StateGraph` that classifies a message → answers, and an OpenAI Assistants v2 flow that spawns an assistant, opens a thread, creates a run, handles a `requires_action` step by submitting tool outputs, and observes the run transitioning to `completed`. `@kiwa-test/agent` runs both flows in-process, deterministic run ids, and 6-item compile validation so runaway agent loops fail fast in tests instead of production.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-agent && cd kiwa-agent
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-test/agent
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

Create `src/chat-graph.ts` — a 2-node `StateGraph` that classifies then answers:

```ts
import { END, START, StateGraph } from '@kiwa-test/agent';

export interface ChatState {
  messages: string[];
  intent: 'help' | 'chat' | null;
  reply: string | null;
}

export function buildChatGraph() {
  return new StateGraph<ChatState>()
    .addNode('classify', (s) => ({
      intent: s.messages[0]?.startsWith('/help') ? 'help' : 'chat',
    }))
    .addNode('answer', (s) => ({
      reply:
        s.intent === 'help'
          ? 'help: A, B, C'
          : `chat: ${s.messages[0]}`,
    }))
    .addEdge(START, 'classify')
    .addEdge('classify', 'answer')
    .addEdge('answer', END)
    .compile();
}
```

Create `src/weather-agent.ts` — an Assistants v2 flow that requires a tool output before completing:

```ts
import { AssistantsClient, toolCall } from '@kiwa-test/agent';

export function buildWeatherAssistant() {
  const client = new AssistantsClient({ idSeed: 'weather-demo' });

  const assistant = client.createAssistant({
    name: 'weather-agent',
    instructions: 'answer weather with the weather tool',
    handler: async (ctx) => {
      if (ctx.toolOutputs === undefined) {
        return {
          kind: 'tool_calls',
          toolCalls: [
            toolCall({ id: 'c1', name: 'weather', arguments: { city: 'tokyo' } }),
          ],
        };
      }
      return {
        kind: 'message',
        content: `weather: ${ctx.toolOutputs[0]?.output}`,
      };
    },
  });

  return { client, assistant };
}
```

## Test — 2 orchestration styles under one file

Create `tests/orchestration.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildChatGraph } from '../src/chat-graph';
import { buildWeatherAssistant } from '../src/weather-agent';

describe('LangGraph — StateGraph.invoke + .stream', () => {
  it('classify → answer routes /help to the help branch', async () => {
    const graph = buildChatGraph();
    const final = await graph.invoke({
      messages: ['/help me'],
      intent: null,
      reply: null,
    });
    expect(final.intent).toBe('help');
    expect(final.reply).toBe('help: A, B, C');
  });

  it('classify → answer echoes chat when the message is not /help', async () => {
    const graph = buildChatGraph();
    const final = await graph.invoke({
      messages: ['hi'],
      intent: null,
      reply: null,
    });
    expect(final.intent).toBe('chat');
    expect(final.reply).toBe('chat: hi');
  });

  it('stream yields per-node patches in order', async () => {
    const graph = buildChatGraph();
    const nodes: string[] = [];
    for await (const step of graph.stream({
      messages: ['/help me'],
      intent: null,
      reply: null,
    })) {
      nodes.push(step.node);
    }
    expect(nodes).toEqual(['classify', 'answer']);
  });
});

describe('Assistants v2 — createRun → requires_action → completed', () => {
  it('poll → requires_action → submitToolOutputs → completed', async () => {
    const { client, assistant } = buildWeatherAssistant();

    const thread = client.createThread({
      messages: [{ role: 'user', content: 'weather in tokyo?' }],
    });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    const step1 = await client.poll(run.id);
    expect(step1.status).toBe('requires_action');
    expect(step1.requiredAction?.toolCalls[0]?.function.name).toBe('weather');

    client.submitToolOutputs(run.id, {
      toolOutputs: [{ toolCallId: 'c1', output: 'sunny 22C' }],
    });

    const step2 = await client.poll(run.id);
    expect(step2.status).toBe('completed');

    const lastMessage = thread.messages.at(-1);
    expect(lastMessage).toEqual({
      role: 'assistant',
      content: 'weather: sunny 22C',
    });
  });

  it('cancel flips a queued run to failed with lastError.code=cancelled', async () => {
    const { client, assistant } = buildWeatherAssistant();
    const thread = client.createThread();
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    client.cancel(run.id);
    const step = await client.poll(run.id);
    expect(step.status).toBe('failed');
    expect(step.lastError?.code).toBe('cancelled');
  });
});
```

Run:

```bash
pnpm test
```

You should see 5 passing tests across the two orchestration styles.

## Run status transitions the mock enforces

Assistants v2 runs move through 5 statuses; the mock reproduces every transition so tests catch status-order regressions.

| from | trigger | to |
|---|---|---|
| `queued` | first `poll` invokes handler → `{ kind: 'message' }` | `completed` |
| `queued` | first `poll` invokes handler → `{ kind: 'tool_calls' }` | `requires_action` |
| `queued` | first `poll` throws in handler | `failed` (lastError.code = `handler_error`) |
| `requires_action` | `submitToolOutputs` | `queued` (next `poll` re-invokes handler with `ctx.toolOutputs`) |
| any non-terminal | `cancel` | `failed` (lastError.code = `cancelled`) |

Real Assistants v2 also has `in_progress` (surfaced when polling during handler execution). The mock resolves handlers synchronously so the `in_progress` step is folded into the initial `poll` call — tests do not need to sleep-poll.

## LangGraph compile validation (6 items, fail-fast)

`StateGraph.compile()` fails immediately if any invariant is violated, so bugs surface at graph construction time instead of graph execution time.

1. `START` edge must have at least one out-edge
2. `START` edge target must be a registered node or `END`
3. Every edge's `to` must be a registered node or `END`
4. Every edge's `from` must be a registered node or `START`
5. Every registered node must have at least one out-edge
6. `START` must have exactly one out-edge (unconditional routing in v0.1)

Conditional edges (`addConditionalEdges` in real LangGraph), channels reducers, `interrupt`, and `checkpointer` are on the v0.2 roadmap. Test suites that rely on them can vendor a passthrough transform node in the meantime.

## When to pick each style

- **LangGraph `StateGraph`** — declarative dataflow where the graph shape is known ahead of time (RAG pipelines, decision trees, multi-step transforms). Easier to inspect + test node-by-node.
- **Assistants v2** — stateful multi-turn conversation where the model decides tool calls dynamically. Easier to swap between real + mock when you already speak the Assistants v2 API.
- **Both** — a chat product with a decision graph on the input side (classify + route) that then hands off to an Assistants-style tool-loop for the actual answer.

## Related

- [Tutorial 17 — MCP tool-use agent](./17-mcp-tool-agent) — MCP tool loop that pairs well with Assistants v2
- [Tutorial 07 — OpenAI tool-use agent](./07-openai-tool-agent) — native (non-Assistants) tool loop
- [Concept — AI-LLM multimodal testing SSOT](../concepts/ai-llm-multimodal-testing) — includes agent-state gotchas
- [`@kiwa-test/agent` on npm](https://www.npmjs.com/package/@kiwa-test/agent)
