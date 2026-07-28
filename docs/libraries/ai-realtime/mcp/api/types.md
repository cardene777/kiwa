---
title: "@kiwa-lab/mcp types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mcp</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>JsonRpcErrorCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L66) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 error code SSOT — spec 4 種 + MCP server-defined 4 種。

```ts
export declare const JsonRpcErrorCode: {
    readonly ParseError: -32700;
    readonly InvalidRequest: -32600;
    readonly MethodNotFound: -32601;
    readonly InvalidParams: -32602;
    readonly InternalError: -32603;
    /** MCP server-defined — tool 実行時 handler が throw した runtime error。 */
    readonly ToolExecutionError: -32000;
    /** MCP server-defined — tool schema validation で reject された input。 */
    readonly ToolSchemaError: -32001;
    /** MCP server-defined — handshake 前に protocol op が呼ばれた。 */
    readonly NotInitialized: -32002;
    /** MCP server-defined — 未登録 tool 名を tools/call で呼んだ。 */
    readonly ToolNotFound: -32003;
};
```

### 型

#### <code v-pre>InitializeParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L126) <code v-pre>packages/mcp/src/types.ts</code>

initialize request params (client → server)。

```ts
export interface InitializeParams {
    protocolVersion: string;
    capabilities: {
        tools?: Record<string, unknown>;
        resources?: Record<string, unknown>;
        prompts?: Record<string, unknown>;
    };
    clientInfo: {
        name: string;
        version: string;
    };
}
```

#### <code v-pre>InitializeResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L140) <code v-pre>packages/mcp/src/types.ts</code>

initialize response result (server → client)。

```ts
export interface InitializeResult {
    protocolVersion: string;
    capabilities: {
        tools?: {
            listChanged?: boolean;
        };
        resources?: Record<string, unknown>;
        prompts?: Record<string, unknown>;
    };
    serverInfo: {
        name: string;
        version: string;
    };
}
```

#### <code v-pre>JsonRpcError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L56) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 error response envelope。

```ts
export interface JsonRpcError {
    jsonrpc: '2.0';
    id: JsonRpcId;
    error: JsonRpcErrorObject;
}
```

#### <code v-pre>JsonRpcErrorObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L49) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 error object。

```ts
export interface JsonRpcErrorObject {
    code: number;
    message: string;
    data?: unknown;
}
```

#### <code v-pre>JsonRpcId</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L31) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 request id — real spec は string / number / null (notification)。

```ts
export type JsonRpcId = string | number | null;
```

#### <code v-pre>JsonRpcRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L34) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 request envelope。

```ts
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: JsonRpcId;
    method: string;
    params?: unknown;
}
```

#### <code v-pre>JsonRpcResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L63) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 response union。

```ts
export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;
```

#### <code v-pre>JsonRpcSuccess</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L42) <code v-pre>packages/mcp/src/types.ts</code>

JSON-RPC 2.0 successful response envelope。

```ts
export interface JsonRpcSuccess<T = unknown> {
    jsonrpc: '2.0';
    id: JsonRpcId;
    result: T;
}
```

#### <code v-pre>McpTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L100) <code v-pre>packages/mcp/src/types.ts</code>

MCP tool definition — server 側に register する 1 tool の shape。 tools/list response で client に返される。

```ts
export interface McpTool {
    name: string;
    description: string;
    inputSchema: ToolInputSchema;
}
```

#### <code v-pre>McpTransport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L169) <code v-pre>packages/mcp/src/types.ts</code>

MCP transport — server と client を直接繋ぐ in-process channel の抽象。 real MCP は stdio / SSE / websocket 等を使うが、 mock は関数呼出 1 段の bidirectional channel だけあれば test を書ける。

```ts
export interface McpTransport {
    /** client → server request、 server の 1 response を返す。 */
    send(request: JsonRpcRequest): Promise<JsonRpcResponse>;
}
```

#### <code v-pre>ToolCallContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L114) <code v-pre>packages/mcp/src/types.ts</code>

tools/call response の content block (real MCP shape に整合)。

```ts
export type ToolCallContent = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    data: string;
    mimeType: string;
} | {
    type: 'resource';
    resource: {
        uri: string;
        mimeType: string;
        text?: string;
    };
};
```

#### <code v-pre>ToolCallResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L120) <code v-pre>packages/mcp/src/types.ts</code>

tools/call result — content 配列 + `isError` flag。 real MCP と同 shape。

```ts
export interface ToolCallResult {
    content: ToolCallContent[];
    isError: boolean;
}
```

#### <code v-pre>ToolHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L111) <code v-pre>packages/mcp/src/types.ts</code>

1 tool の実 handler。 tools/call で呼び出される。 input は inputSchema で validate 済、 handler は同期 or 非同期どちらでも可。 return value は MCP tools/call の `content` block 相当。

```ts
export type ToolHandler = (input: Record<string, unknown>) => ToolCallContent[] | Promise<ToolCallContent[]>;
```

#### <code v-pre>ToolInputSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L87) <code v-pre>packages/mcp/src/types.ts</code>

Tool の JSONSchema (subset)。 real MCP は Draft 7 の full JSONSchema を許容 するが、 kiwa mock は type + properties + required + items + enum の 5 種 のみを検証、 それ以外は「always valid」 と扱う。 v0.2 以降で拡張予定。

```ts
export interface ToolInputSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
    properties?: Record<string, ToolInputSchema>;
    required?: string[];
    items?: ToolInputSchema;
    enum?: readonly (string | number | boolean | null)[];
    description?: string;
}
```

#### <code v-pre>ToolsCallParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L159) <code v-pre>packages/mcp/src/types.ts</code>

tools/call request params。

```ts
export interface ToolsCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}
```

#### <code v-pre>ToolsListResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L154) <code v-pre>packages/mcp/src/types.ts</code>

tools/list response result。

```ts
export interface ToolsListResult {
    tools: McpTool[];
}
```
