# @kiwa-lab/mcp

## 0.2.0

### Minor Changes

- 73e01b7: v1.15-2: @kiwa-lab/mcp v0.1 — Model Context Protocol server + client mock harness

  - `packages/mcp/` を新設 (v0.1.0)。 JSON-RPC 2.0 envelope + MCP protocol 型 (`InitializeParams` / `InitializeResult` / `ToolsListResult` / `ToolsCallParams` / `ToolCallResult` / `McpTool` / `ToolInputSchema` / `JsonRpcErrorCode`) を SSOT 化。
  - `McpServer` — 4 op (initialize / notifications/initialized / tools/list / tools/call) を dispatch。 handshake 強制 default で pre-initialize 呼出は `NotInitialized` (-32002) を返す。 tool 呼出は schema validation → handler 実行 → `ToolCallResult { content, isError }` の流れで、 handler throw は `ToolExecutionError` (-32000)、 schema mismatch は `ToolSchemaError` (-32001)、 未登録 tool は `ToolNotFound` (-32003) を返す。
  - `McpClient` + `InMemoryTransport` — server と直結する in-process client。 `connectClientToServer(server)` で handshake まで 1 行 setup。 任意 `McpTransport` を注入すれば real MCP client と mock server の突合 test も書ける。 error response は `McpRpcError` として throw。
  - `ToolRegistry` + `validateSchema` — JSONSchema subset (`type` / `properties` / `required` / `items` / `enum`) の 5 keyword を検証、 それ以外の keyword は「always valid」 扱いで v0.2 以降拡張。
  - 5 fixture tools (`echo` / `calc` / `weather` / `search` / `db-query`) を `registerAllFixtureTools(server)` で一括登録。 tutorial + dogfood + smoke test を 1 行 setup で組める。
  - 33 test 追加 (handshake 6 / tools 10 / call 8 / fixture 9)、 typecheck clean、 build clean、 real MCP protocol shape に整合。

## 0.1.0

### Minor Changes

- Initial release. Model Context Protocol (MCP) server + client mock harness — JSON-RPC 2.0 handshake (initialize / notifications/initialized) + tools/list + tools/call の 4 op を統一 API。 5 fixture tools (echo / calc / weather / search / db-query) 同梱、 JSONSchema subset validation (type + properties + required + items + enum)、 `InMemoryTransport` で server / client 直結。
