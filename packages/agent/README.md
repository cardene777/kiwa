# @kiwa-lab/agent

Agent orchestration mock harness for kiwa — LangGraph 型 state machine + OpenAI Assistants v2 の 1 統一 API。

LangGraph は agent graph の DSL、 OpenAI Assistants v2 は stateful conversation + run status polling model。 本 package は kiwa test で real LangGraph runtime / real OpenAI API を叩かずに agent orchestration chain を組み立てるための in-process implementation を提供する。

- `StateGraph` — LangGraph 型 API (`addNode` + `addEdge` + `compile` → `invoke` / `stream`)
- `StateMachine` — 低水準 state graph 実行 engine、 `StateGraph` の backing store
- `AssistantsClient` — Assistants v2 mock (`createAssistant` + `createThread` + `addMessage` + `createRun` + `poll` + `submitToolOutputs`)
- deterministic id 発行 (`idSeed` 指定で snapshot test 可)、 6 compile validation + max steps guard で runaway loop 遮断

## Usage — LangGraph 型 state machine

```ts
import { END, START, StateGraph } from '@kiwa-lab/agent';

interface ChatState {
  messages: string[];
  intent: string | null;
  reply: string | null;
}

const graph = new StateGraph<ChatState>()
  .addNode('classify', (s) => ({
    intent: s.messages[0]?.startsWith('/help') ? 'help' : 'chat',
  }))
  .addNode('answer', (s) => ({
    reply: s.intent === 'help' ? 'help: A, B, C' : `chat: ${s.messages[0]}`,
  }))
  .addEdge(START, 'classify')
  .addEdge('classify', 'answer')
  .addEdge('answer', END);

const compiled = graph.compile();
const final = await compiled.invoke({ messages: ['/help me'], intent: null, reply: null });
// final.intent === 'help'
// final.reply === 'help: A, B, C'

// stream で中間 state を順次観測
for await (const step of compiled.stream({ messages: ['hi'], intent: null, reply: null })) {
  console.log(step.node, step.patch);
}
```

## Usage — OpenAI Assistants v2

```ts
import { AssistantsClient, toolCall } from '@kiwa-lab/agent';

const client = new AssistantsClient({ idSeed: 'demo' });

const assistant = client.createAssistant({
  name: 'weather-agent',
  instructions: 'answer weather with the weather tool',
  handler: async (ctx) => {
    if (ctx.toolOutputs === undefined) {
      return {
        kind: 'tool_calls',
        toolCalls: [toolCall({ id: 'c1', name: 'weather', arguments: { city: 'tokyo' } })],
      };
    }
    return { kind: 'message', content: `weather: ${ctx.toolOutputs[0]?.output}` };
  },
});

const thread = client.createThread({ messages: [{ role: 'user', content: 'weather in tokyo?' }] });
const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

const step1 = await client.poll(run.id);
// step1.status === 'requires_action'
// step1.requiredAction.toolCalls === [ { id: 'c1', function: { name: 'weather', arguments: '{"city":"tokyo"}' }, ... } ]

client.submitToolOutputs(run.id, {
  toolOutputs: [{ toolCallId: 'c1', output: 'sunny 22C' }],
});

const step2 = await client.poll(run.id);
// step2.status === 'completed'
// thread.messages.at(-1) === { role: 'assistant', content: 'weather: sunny 22C' }
```

## LangGraph → real 対応表

| real LangGraph API | kiwa mock 対応 |
|---|---|
| `new StateGraph(channels)` | `new StateGraph<TState>()` (v0.1 は shallow merge) |
| `graph.addNode(name, fn)` | `graph.addNode(name, handler)` |
| `graph.addEdge(from, to)` | `graph.addEdge(from, to)` (unconditional) |
| `graph.setEntryPoint(name)` | `graph.addEdge(START, name)` に統一 |
| `graph.setFinishPoint(name)` | `graph.addEdge(name, END)` に統一 |
| `graph.compile()` | `graph.compile()` → `CompiledGraph` |
| `compiled.invoke(state)` | `compiled.invoke(state)` |
| `compiled.stream(state)` | `compiled.stream(state)` async generator |

## Assistants v2 → real 対応表

| real Assistants v2 API | kiwa mock 対応 |
|---|---|
| `openai.beta.assistants.create` | `client.createAssistant({ name, instructions, handler })` |
| `openai.beta.threads.create` | `client.createThread({ messages? })` |
| `openai.beta.threads.messages.create` | `client.addMessage(threadId, { role, content })` |
| `openai.beta.threads.runs.create` | `client.createRun({ threadId, assistantId })` |
| `openai.beta.threads.runs.retrieve` | `client.poll(runId)` |
| `openai.beta.threads.runs.submitToolOutputs` | `client.submitToolOutputs(runId, { toolOutputs })` |
| `openai.beta.threads.runs.cancel` | `client.cancel(runId)` |

## Run status transition

1. `createRun()` → status = **queued**
2. 1 回目の `poll()` → handler を呼び、 結果に応じて
   - `{ kind: 'message' }` → **completed** + assistant message を thread に append
   - `{ kind: 'tool_calls' }` → **requires_action** + pending tool_calls を保持
   - handler が throw → **failed** + lastError = { code: 'handler_error', message }
3. **requires_action** 中に `submitToolOutputs()` → **queued** に戻し、 次 `poll()` で handler 再呼出 (context.toolOutputs で結果参照可能)
4. `cancel()` → queued / requires_action / in_progress を **failed** に倒す (lastError.code = 'cancelled')

## Compile validation (6 項目、 fail-fast)

1. START edge が最低 1 本存在する
2. START edge の to が存在する node (or END)
3. 全 edge の to が存在する node (or END)
4. 全 edge の from が存在する node (or START)
5. 全 node に out-edge が最低 1 本存在する
6. START edge は 1 本のみ

## 未対応 (v0.2 以降)

- LangGraph — `addConditionalEdges` / `channels` reducer / `interrupt` / `checkpointer`
- Assistants v2 — vector store / `file_search` / `code_interpreter` / streaming (SSE)

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/ai-realtime/agent/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/ai-realtime/agent/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/ai-realtime/agent/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/ai-realtime/agent/reference)

編集元は [docs/libraries/ai-realtime/agent](../../docs/libraries/ai-realtime/agent/) です。
<!-- kiwa-docs:end -->

## License

MIT
