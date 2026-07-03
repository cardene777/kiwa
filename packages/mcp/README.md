# @kiwa-test/mcp

Model Context Protocol (MCP) server + client mock harness for kiwa.

Anthropic MCP は JSON-RPC 2.0 の上に載る tool 交換 protocol。 本 package は kiwa test で real MCP server 実装を叩かずに tool 呼出 chain を組み立てるための in-process server + client + transport を提供する。

- `McpServer` — JSON-RPC 2.0 dispatch + handshake 強制 (initialize → tools/list → tools/call の 3 op)
- `McpClient` + `InMemoryTransport` — server と直結する in-process client、 real MCP client と mock server の突合 test 用に任意 `McpTransport` を注入可能
- `ToolRegistry` + `validateSchema` — JSONSchema subset (type + properties + required + items + enum) の 5 keyword を検証
- 5 fixture tools (`echo` / `calc` / `weather` / `search` / `db-query`) — tutorial + dogfood + smoke test を 1 行 setup で組める

## Usage

```ts
import {
  connectClientToServer,
  McpServer,
  registerAllFixtureTools,
} from '@kiwa-test/mcp';

const server = new McpServer({ name: 'my-mock', version: '1.0.0' });
registerAllFixtureTools(server);

const { client } = await connectClientToServer(server);
const tools = await client.listTools();
// [{ name: 'echo', ... }, { name: 'calc', ... }, ...]

const result = await client.callTool('calc', { op: 'add', a: 2, b: 3 });
// result.content = [{ type: 'text', text: '5' }]
```

## 対応 op (v0.1)

1. `initialize` — 双方向 handshake
2. `notifications/initialized` — client → server の初期化完了通知 (notification、 response なし)
3. `tools/list` — 登録 tool 一覧
4. `tools/call` — 1 tool を invoke、 schema validate → handler → result

`resources/*` / `prompts/*` / `sampling/*` / `logging/*` は v0.2 以降。 v0.1 は tool 呼出 chain に絞る。

## Error codes

JSON-RPC 2.0 spec 4 種 + MCP server-defined 4 種。

| code | 意味 |
|---|---|
| -32700 | ParseError |
| -32600 | InvalidRequest |
| -32601 | MethodNotFound |
| -32602 | InvalidParams |
| -32603 | InternalError |
| -32000 | ToolExecutionError (handler が throw) |
| -32001 | ToolSchemaError (input が schema に不整合) |
| -32002 | NotInitialized (handshake 前に tools/* を呼んだ) |
| -32003 | ToolNotFound (未登録 tool 名) |
