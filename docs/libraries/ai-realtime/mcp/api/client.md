---
title: "@kiwa-lab/mcp client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mcp</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>connectClientToServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L172) <code v-pre>packages/mcp/src/client.ts</code>

shortcut — server + client + transport を 1 発で組み立てて handshake まで完了する factory。 test の 8 割はこれで足りる想定。

```ts
export declare function connectClientToServer(server: McpServer, clientConfig?: McpClientConfig): Promise<{
    client: McpClient;
    transport: InMemoryTransport;
}>;
```

#### <code v-pre>InMemoryTransport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L150) <code v-pre>packages/mcp/src/client.ts</code>

In-process transport — client の request を直接 server の `handle` に渡す。 real MCP は stdio / SSE / websocket 等を挟むが、 mock test の 9 割はこの transport で足りる。 notification (response なし) には null-response を 合成して JsonRpcResponse 型を満たす。

```ts
/**
 * In-process transport — client の request を直接 server の `handle` に渡す。
 * real MCP は stdio / SSE / websocket 等を挟むが、 mock test の 9 割はこの
 * transport で足りる。 notification (response なし) には null-response を
 * 合成して JsonRpcResponse 型を満たす。
 */
export declare class InMemoryTransport implements McpTransport {
    constructor(server: McpServer);
    send(request: JsonRpcRequest): Promise<JsonRpcResponse>;
}
```

#### <code v-pre>McpClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L45) <code v-pre>packages/mcp/src/client.ts</code>

MCP client mock — real MCP client と同じく initialize → tools/list → tools/call の 3 op を wrap する。 in-process McpServer と直結する `InMemoryTransport` を default で使うが、 real MCP client と mock server の 突合 test 用に任意 `McpTransport` を注入可能。

```ts
/**
 * MCP client mock — real MCP client と同じく initialize → tools/list →
 * tools/call の 3 op を wrap する。 in-process McpServer と直結する
 * `InMemoryTransport` を default で使うが、 real MCP client と mock server の
 * 突合 test 用に任意 `McpTransport` を注入可能。
 */
export declare class McpClient {
    readonly name: string;
    readonly version: string;
    readonly protocolVersion: string | undefined;
    constructor(transport: McpTransport, config?: McpClientConfig);
    /** handshake 済かどうか (test / debug 用)。 */
    get isInitialized(): boolean;
    /** server と handshake した後の合意 protocol version、 未 handshake は undefined。 */
    get serverProtocolVersion(): string | undefined;
    /**
     * handshake — real MCP は initialize request → initialized notification の
     * 2 step。 mock も 2 step を実行して server の initialize 済 flag を立てる。
     */
    initialize(): Promise<InitializeResult>;
    /** tools/list — 登録 tool 一覧を取得。 */
    listTools(): Promise<McpTool[]>;
    /** tools/call — 1 tool を呼び出す、 result は content + isError。 */
    callTool(name: string, args?: Record<string, unknown>): Promise<ToolCallResult>;
    /**
     * 任意 JSON-RPC method を呼び出す (未対応の MCP op 実験 / test 用)。 error
     * response は McpRpcError で throw する。
     */
    call<T>(method: string, params: unknown): Promise<T>;
    /**
     * notification (response なし) を送出。 JSON-RPC 2.0 では id 省略で
     * notification 扱い、 transport は null / 相応の non-response を返す。
     */
    notify(method: string, params: unknown): Promise<void>;
}
```

#### <code v-pre>McpRpcError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L27) <code v-pre>packages/mcp/src/client.ts</code>

client → server 呼出で error response を受け取った場合の JS 例外。 `code` / `message` / `data` は JSON-RPC error object のまま。

```ts
export declare class McpRpcError extends Error {
    readonly code: number;
    readonly data: unknown;
    constructor(error: JsonRpcErrorObject);
}
```

### 型

#### <code v-pre>McpClientConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L15) <code v-pre>packages/mcp/src/client.ts</code>

MCP client 起動時 config。

```ts
export interface McpClientConfig {
    /** client identifier (initialize params.clientInfo で送出)。 */
    name?: string;
    version?: string;
    /** 話す protocol version、 default は server 側 SSOT に揃える。 */
    protocolVersion?: string;
}
```
