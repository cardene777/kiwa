# MCP リファレンス

## サーバーとクライアント

| API | 説明 |
| --- | --- |
| `new McpServer(config)` | MCP サーバーを作ります |
| `McpServer.register(tool, handler)` | ツールとその handler を登録します |
| `McpClient` | initialize、tools list、tools call を行うクライアントです |
| `connectClientToServer(server, config)` | インメモリ転送へ接続し初期化済みの client を返します |
| `InMemoryTransport` | client と server を接続する転送です |
| `MCP_PROTOCOL_VERSION` | 実装する MCP protocol version です |

## ツール

| API | 説明 |
| --- | --- |
| `ToolRegistry` | 登録済みツールの管理と呼び出しを行います |
| `validateSchema(schema, input)` | object、string、number、boolean の入力スキーマを検証します |
| `textContent(text)` | text 型の `ToolCallContent` を作ります |
| `registerAllFixtureTools(server)` | echo、calc、weather、search、db query を登録します |
| `registerEcho` など | 個別の fixture ツールを登録します |

McpRpcError はclientが受け取るJSON RPC errorです。code、message、dataを保持します。error responseのIDがrequest IDと一致しない場合もinternal errorとしてthrowします。エラーコードは JsonRpcErrorCode で参照できます。

## 実行境界

InMemoryTransport はnotificationに対するserverのnull responseを空のsuccess responseへ変換します。notificationの結果はclient側で破棄されます。任意の McpTransport を注入できるため、別transportのresponse IDやerror処理をtestできますが、network transportは提供しません。

fixture toolはtest専用です。weatherは固定都市、searchは小さなword-overlap corpus、db-queryはmock rowsに対するSELECT判定だけを行います。実databaseや検索indexを操作しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `mock db supports SELECT only, got: ${sql.slice(0, 20)}...` | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L221) |
| 'echo: message must be a string' | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L40) |
| 'division by zero' | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L83) |
| `unknown op: ${String(op)}` | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L88) |
| 'tool.name must be a non-empty string' | [packages/mcp/src/tools.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L30) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `buildCalcTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L53) `packages/mcp/src/fixture.ts`

```ts
export declare const buildCalcTool: () => McpTool;
```

#### `buildDbQueryTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L204) `packages/mcp/src/fixture.ts`

```ts
export declare const buildDbQueryTool: () => McpTool;
```

#### `buildEchoTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L26) `packages/mcp/src/fixture.ts`

5 tool builder — kiwa test で頻出する MCP tool の shape を SSOT 化。 各 builder は `(server) =&gt; tool + handler` を返す形ではなく `(server) =&gt; void` で直接 register する。 test は `registerEcho(server)` 1 行で使い始められる。 ### 5 tool の役割分担 | tool | 想定シナリオ | |---|---| | echo | JSON-RPC handshake + tools/call chain の smoke test | | calc | 数値 arg + validation error path | | weather | enum arg + mock data 分岐 | | search | array return + relevance ranking (word overlap 近似) | | db-query | multi-arg + isError=true path (SQL parse error mock) | 各 builder は tool definition だけを取り出す helper (`buildXTool`) も提供し、 schema 検証 test 用に直接 return する。

```ts
export declare const buildEchoTool: () => McpTool;
```

#### `buildSearchTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L153) `packages/mcp/src/fixture.ts`

```ts
export declare const buildSearchTool: () => McpTool;
```

#### `buildWeatherTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L110) `packages/mcp/src/fixture.ts`

```ts
export declare const buildWeatherTool: () => McpTool;
```

#### `calcHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L67) `packages/mcp/src/fixture.ts`

```ts
export declare const calcHandler: ToolHandler;
```

#### `connectClientToServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L172) `packages/mcp/src/client.ts`

shortcut — server + client + transport を 1 発で組み立てて handshake まで完了する factory。 test の 8 割はこれで足りる想定。

```ts
export declare function connectClientToServer(server: McpServer, clientConfig?: McpClientConfig): Promise<{
    client: McpClient;
    transport: InMemoryTransport;
}>;
```

#### `dbQueryHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L217) `packages/mcp/src/fixture.ts`

```ts
export declare const dbQueryHandler: ToolHandler;
```

#### `echoHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L38) `packages/mcp/src/fixture.ts`

```ts
export declare const echoHandler: ToolHandler;
```

#### `InMemoryTransport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L150) `packages/mcp/src/client.ts`

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

#### `JsonRpcErrorCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L66) `packages/mcp/src/types.ts`

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

#### `MCP_PROTOCOL_VERSION`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L18) `packages/mcp/src/server.ts`

kiwa mock が話す MCP protocol version。 real MCP は "2024-11-05" 系。

```ts
export declare const MCP_PROTOCOL_VERSION = "2024-11-05";
```

#### `McpClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L45) `packages/mcp/src/client.ts`

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

#### `McpRpcError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L27) `packages/mcp/src/client.ts`

client → server 呼出で error response を受け取った場合の JS 例外。 `code` / `message` / `data` は JSON-RPC error object のまま。

```ts
export declare class McpRpcError extends Error {
    readonly code: number;
    readonly data: unknown;
    constructor(error: JsonRpcErrorObject);
}
```

#### `McpServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L50) `packages/mcp/src/server.ts`

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

#### `registerAllFixtureTools`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L234) `packages/mcp/src/fixture.ts`

5 tool を一括 register。 tutorial / dogfood 起動用の 1 行 setup。

```ts
export declare function registerAllFixtureTools(server: McpServer): void;
```

#### `registerCalc`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L93) `packages/mcp/src/fixture.ts`

```ts
export declare function registerCalc(server: McpServer): void;
```

#### `registerDbQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L227) `packages/mcp/src/fixture.ts`

```ts
export declare function registerDbQuery(server: McpServer): void;
```

#### `registerEcho`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L44) `packages/mcp/src/fixture.ts`

```ts
export declare function registerEcho(server: McpServer): void;
```

#### `registerSearch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L187) `packages/mcp/src/fixture.ts`

```ts
export declare function registerSearch(server: McpServer): void;
```

#### `registerWeather`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L135) `packages/mcp/src/fixture.ts`

```ts
export declare function registerWeather(server: McpServer): void;
```

#### `searchHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L166) `packages/mcp/src/fixture.ts`

```ts
export declare const searchHandler: ToolHandler;
```

#### `textContent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L128) `packages/mcp/src/tools.ts`

shortcut — text content 1 block だけの result を組み立てる。 handler 実装補助。

```ts
export declare function textContent(text: string): ToolCallContent;
```

#### `ToolRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L21) `packages/mcp/src/tools.ts`

Tool registry — MCP server が保持する tool 一覧の SSOT。 register / unregister / list / get / validateInput の 5 op を提供する。 順序保持は Map の insertion order で担保、 real MCP と同じく tools/list の順序は register 順。

```ts
/**
 * Tool registry — MCP server が保持する tool 一覧の SSOT。 register / unregister /
 * list / get / validateInput の 5 op を提供する。 順序保持は Map の insertion
 * order で担保、 real MCP と同じく tools/list の順序は register 順。
 */
export declare class ToolRegistry {
    /**
     * register a tool。 同 name の既存 tool は上書きする (real MCP でも
     * tools/list_changed notification 後の再登録は上書き相当)。
     */
    register(tool: McpTool, handler: ToolHandler): void;
    /** unregister a tool by name。 存在しない場合は false を返す。 */
    unregister(name: string): boolean;
    /** register 順で全 tool の definition を返す。 */
    list(): McpTool[];
    /** 1 tool を name で lookup、 存在しない場合は undefined。 */
    get(name: string): RegisteredTool | undefined;
    /** 登録 tool 数。 */
    get size(): number;
}
```

#### `validateSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L64) `packages/mcp/src/tools.ts`

ToolInputSchema に対して input value を validate する。 real MCP は Draft 7 の full JSONSchema を許容するが、 kiwa mock は type + properties + required + items + enum + description の 5 種のみ検証する (types.ts のコメント SSOT)。 それ以外の schema keyword は「always valid」 扱い。 返り値 = validation error list。 empty なら valid。

```ts
export declare function validateSchema(schema: ToolInputSchema, value: unknown, path?: string): string[];
```

#### `weatherHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L123) `packages/mcp/src/fixture.ts`

```ts
export declare const weatherHandler: ToolHandler;
```

### 型

#### `InitializeParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L126) `packages/mcp/src/types.ts`

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

#### `InitializeResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L140) `packages/mcp/src/types.ts`

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

#### `JsonRpcError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L56) `packages/mcp/src/types.ts`

JSON-RPC 2.0 error response envelope。

```ts
export interface JsonRpcError {
    jsonrpc: '2.0';
    id: JsonRpcId;
    error: JsonRpcErrorObject;
}
```

#### `JsonRpcErrorObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L49) `packages/mcp/src/types.ts`

JSON-RPC 2.0 error object。

```ts
export interface JsonRpcErrorObject {
    code: number;
    message: string;
    data?: unknown;
}
```

#### `JsonRpcId`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L31) `packages/mcp/src/types.ts`

JSON-RPC 2.0 request id — real spec は string / number / null (notification)。

```ts
export type JsonRpcId = string | number | null;
```

#### `JsonRpcRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L34) `packages/mcp/src/types.ts`

JSON-RPC 2.0 request envelope。

```ts
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: JsonRpcId;
    method: string;
    params?: unknown;
}
```

#### `JsonRpcResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L63) `packages/mcp/src/types.ts`

JSON-RPC 2.0 response union。

```ts
export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;
```

#### `JsonRpcSuccess`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L42) `packages/mcp/src/types.ts`

JSON-RPC 2.0 successful response envelope。

```ts
export interface JsonRpcSuccess<T = unknown> {
    jsonrpc: '2.0';
    id: JsonRpcId;
    result: T;
}
```

#### `McpClientConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L15) `packages/mcp/src/client.ts`

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

#### `McpServerConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L21) `packages/mcp/src/server.ts`

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

#### `McpTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L100) `packages/mcp/src/types.ts`

MCP tool definition — server 側に register する 1 tool の shape。 tools/list response で client に返される。

```ts
export interface McpTool {
    name: string;
    description: string;
    inputSchema: ToolInputSchema;
}
```

#### `McpTransport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L169) `packages/mcp/src/types.ts`

MCP transport — server と client を直接繋ぐ in-process channel の抽象。 real MCP は stdio / SSE / websocket 等を使うが、 mock は関数呼出 1 段の bidirectional channel だけあれば test を書ける。

```ts
export interface McpTransport {
    /** client → server request、 server の 1 response を返す。 */
    send(request: JsonRpcRequest): Promise<JsonRpcResponse>;
}
```

#### `RegisteredTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L11) `packages/mcp/src/tools.ts`

Registered tool = definition + handler。 server 内で name をキーに保持する。

```ts
export interface RegisteredTool {
    tool: McpTool;
    handler: ToolHandler;
}
```

#### `ToolCallContent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L114) `packages/mcp/src/types.ts`

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

#### `ToolCallResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L120) `packages/mcp/src/types.ts`

tools/call result — content 配列 + `isError` flag。 real MCP と同 shape。

```ts
export interface ToolCallResult {
    content: ToolCallContent[];
    isError: boolean;
}
```

#### `ToolHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L111) `packages/mcp/src/types.ts`

1 tool の実 handler。 tools/call で呼び出される。 input は inputSchema で validate 済、 handler は同期 or 非同期どちらでも可。 return value は MCP tools/call の `content` block 相当。

```ts
export type ToolHandler = (input: Record<string, unknown>) => ToolCallContent[] | Promise<ToolCallContent[]>;
```

#### `ToolInputSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L87) `packages/mcp/src/types.ts`

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

#### `ToolsCallParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L159) `packages/mcp/src/types.ts`

tools/call request params。

```ts
export interface ToolsCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}
```

#### `ToolsListResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/types.ts#L154) `packages/mcp/src/types.ts`

tools/list response result。

```ts
export interface ToolsListResult {
    tools: McpTool[];
}
```
<!-- kiwa-public-api:end -->
