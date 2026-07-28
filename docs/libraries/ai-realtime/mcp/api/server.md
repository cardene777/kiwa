---
title: "@kiwa-lab/mcp server の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mcp</code> <code v-pre>server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>MCP&#95;PROTOCOL&#95;VERSION</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L18) <code v-pre>packages/mcp/src/server.ts</code>

kiwa mock が話す MCP protocol version。 real MCP は "2024-11-05" 系。

```ts
export declare const MCP_PROTOCOL_VERSION = "2024-11-05";
```

#### <code v-pre>McpServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L50) <code v-pre>packages/mcp/src/server.ts</code>

MCP server mock — JSON-RPC 2.0 の request 1 件を受け取り response 1 件を返す 純粋関数的 dispatch。 register / unregister で tool 登録、 `handle(request)` で 呼出処理する。 ### handshake 強制 (default) `initialize` op を先に呼び出さないと `tools/list` / `tools/call` は `NotInitialized` (-32002) error を返す。 real MCP protocol spec でも initialize が最初の必須 op と規定されている。 ### method dispatch table | method | handler | |---|---| | `initialize` | handshake、 protocol version + capabilities + serverInfo を返す | | `notifications/initialized` | client からの initialize 完了通知 (notification、 response なし) | | `tools/list` | 登録 tool 一覧を返す | | `tools/call` | 1 tool を invoke、 schema validate → handler → result | | (other) | MethodNotFound (-32601) を返す |

```ts
/**
 * MCP server mock — JSON-RPC 2.0 の request 1 件を受け取り response 1 件を返す
 * 純粋関数的 dispatch。 register / unregister で tool 登録、 `handle(request)` で
 * 呼出処理する。
 *
 * ### handshake 強制 (default)
 *
 * `initialize` op を先に呼び出さないと `tools/list` / `tools/call` は
 * `NotInitialized` (-32002) error を返す。 real MCP protocol spec でも
 * initialize が最初の必須 op と規定されている。
 *
 * ### method dispatch table
 *
 * | method | handler |
 * |---|---|
 * | `initialize` | handshake、 protocol version + capabilities + serverInfo を返す |
 * | `notifications/initialized` | client からの initialize 完了通知 (notification、 response なし) |
 * | `tools/list` | 登録 tool 一覧を返す |
 * | `tools/call` | 1 tool を invoke、 schema validate → handler → result |
 * | (other) | MethodNotFound (-32601) を返す |
 */
export declare class McpServer {
    readonly name: string;
    readonly version: string;
    readonly protocolVersion: string;
    constructor(config?: McpServerConfig);
    /** 1 tool を register。 handler は同期 or 非同期どちらでも可。 */
    register(tool: McpTool, handler: ToolHandler): void;
    /** 1 tool を unregister、 返り値は存在有無。 */
    unregister(name: string): boolean;
    /** 登録 tool 数 (test / debug 用)。 */
    get toolCount(): number;
    /** handshake 済みかどうか (test / debug 用)。 */
    get isInitialized(): boolean;
    /** test 用に handshake 状態を reset (rare use、 stateful test 補助)。 */
    reset(): void;
    /**
     * 1 JSON-RPC request を dispatch、 1 response を返す。 notification
     * (`notifications/*` prefix) は例外的に response なし (null 返り)。
     */
    handle(request: JsonRpcRequest): Promise<JsonRpcResponse | null>;
}
```

### 型

#### <code v-pre>McpServerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L21) <code v-pre>packages/mcp/src/server.ts</code>

server 起動時 config。

```ts
export interface McpServerConfig {
    name?: string;
    version?: string;
    protocolVersion?: string;
    /** handshake を強制するか (default true)、 false なら initialize 前でも tools/* 呼出可。 */
    requireHandshake?: boolean;
}
```
