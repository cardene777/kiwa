---
title: "kiwa v1.15 released — Multimodal + MCP + Agent orchestration、 AI-LLM 深化"
emoji: "🌱"
type: "tech"
topics: ["oss", "typescript", "testing", "kiwa", "release"]
published: true
---

# kiwa v1.15 released

v1.15 は kiwa の 5 milestone 目です。 v1.14 (横軸拡張、 payment / search / telemetry / Go Iris/Chi) の後、 v1.15 は **AI-LLM 縦軸に戻り** v1.12 が cover しなかった 3 領域 (multimodal / MCP / agent orchestration) を land しました。

## 主な追加

### `@kiwa-test/ai-llm` v0.2

multimodal (image + audio) input mock を 4 SDK 全部で統一。 `content: MessagePart[]` array は v0.1 の `content: string` の superset なので、 text-only v0.1 test は無変更で pass。

```ts
import { createAnthropicMock } from '@kiwa-test/ai-llm';

const client = createAnthropicMock({
  imageTokenCost: 1500,
  responses: {
    'What is in this image?': { content: 'a maple leaf' },
  },
});

const res = await client.messages.create({
  model: 'claude-3-5-sonnet',
  max_tokens: 200,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: '...base64...' },
        },
        { type: 'text', text: 'What is in this image?' },
      ],
    },
  ],
});
```

- 4 SDK 全対応 (Anthropic vision content blocks / OpenAI image_url + input_audio / Vercel AI SDK multimodal / LangChain multimodal)
- image token 会計は prompt token に加算、 `detail=low/auto/high` で 0.5x/0.8x/1.0x scale
- Whisper transcription mock (`toTranscriptionKey` で URL + base64 の source 統一)
- text-only v0.1 shape は完全温存

### `@kiwa-test/mcp` v0.1

Model Context Protocol (JSON-RPC 2.0 の上に載る Anthropic 発 tool 交換 protocol) の server + client + transport を in-process で mock。

```ts
import { connectClientToServer, McpServer, registerAllFixtureTools } from '@kiwa-test/mcp';

const server = new McpServer({ name: 'demo', version: '1.0.0' });
registerAllFixtureTools(server);
const { client } = await connectClientToServer(server);

const tools = await client.listTools();
// [{ name: 'echo' }, { name: 'calc' }, { name: 'weather' }, { name: 'search' }, { name: 'db-query' }]

const result = await client.callTool('calc', { op: 'add', a: 2, b: 3 });
// result.content = [{ type: 'text', text: '5' }]
```

- 4 op cover (`initialize` / `notifications/initialized` / `tools/list` / `tools/call`)
- 8 error code (JSON-RPC spec 4 + MCP 拡張 -32000/-32001/-32002/-32003)
- 5 fixture tool (echo / calc / weather / search / db-query)
- `tools/list` を `initialize` 前に呼ぶと `-32002 NotInitialized` — real MCP と同じ order 強制

### `@kiwa-test/agent` v0.1

LangGraph 型 StateGraph と OpenAI Assistants v2 client を 1 API に統一。

```ts
import { END, START, StateGraph, AssistantsClient, toolCall } from '@kiwa-test/agent';

// LangGraph 型
const graph = new StateGraph<{ reply: string | null }>()
  .addNode('answer', () => ({ reply: 'hi' }))
  .addEdge(START, 'answer')
  .addEdge('answer', END)
  .compile();
const final = await graph.invoke({ reply: null });

// Assistants v2
const client = new AssistantsClient({ idSeed: 'demo' });
const assistant = client.createAssistant({
  name: 'weather',
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
```

- LangGraph = `addNode` + `addEdge` + `compile` + `invoke` / `stream`
- Assistants v2 = `createAssistant` + `createThread` + `createRun` + `poll` + `submitToolOutputs`
- 6 compile validation (fail-fast、 unreachable node / dangling edge / START/END 整合を graph 構築時に検出)
- deterministic run id (`idSeed` 指定で snapshot test 可)
- max steps guard で runaway loop 遮断

### dogfood 2 app

- `examples/dogfood-multimodal-chat` — Anthropic vision (image upload + streaming + cost tracking + multi-image compare)
- `examples/dogfood-mcp-tool-agent` — Node.js MCP server (weather + calculator + search) + Claude tool-use loop、 real MCP SDK + real Anthropic API に対して fidelity 測定

両 app とも provider prefix が `@kiwa-test/ai-*` なので 11 軸 release gate に載る。

### docs 3 pillars + concept doc

- Tutorial 16 (multimodal chat) / 17 (MCP tool-use agent) / 18 (agent orchestration)
- Migration guide `v1.14 → v1.15` (additive-only、 既存 test は無変更で pass)
- Concept doc `docs/concepts/ai-llm-multimodal-testing.md` — image token 会計 / Whisper mock 設計 / MCP handshake 強制 / agent state machine / dogfood app 11 軸 gate / multi-turn tool-loop の 6 design 判断を SSOT 化
- VitePress sidebar 追記 (AI-LLM 深化 (v1.15) section + concept doc link + migration link)
- `/docs-publish-kiwa` 経由 gh-pages 反映済

## v2.0 候補

- Storybook integration (8 framework matrix component visual regression)
- multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- Coverage 100% milestone
- Framework 深化 (SolidJS / Fresh / HonoJS)

## まとめ

v1.15 は AI-LLM 深化 milestone。 v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) の後、 v1.15 は AI-LLM 縦軸に戻り v1.12 で扱わなかった 3 shape (multimodal / MCP / agent) を land しました。 v1.11 - v1.15 で **31 sub-Issue 完遂 + 31 PR merge**、 kiwa の provider coverage は 5 milestone 連続で拡大しています。

Roadmap: https://github.com/cardene777/kiwa/issues/745
