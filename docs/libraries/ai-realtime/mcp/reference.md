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
| <code v-pre>mock db supports SELECT only, got: $&#123;sql.slice(0, 20)&#125;...</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L221) |
| <code v-pre>echo: message must be a string</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L40) |
| <code v-pre>division by zero</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L83) |
| <code v-pre>unknown op: $&#123;String(op)&#125;</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L88) |
| <code v-pre>tool.name must be a non-empty string</code> | [packages/mcp/src/tools.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L30) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>buildCalcTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L53) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildCalcTool: () => McpTool;
```

#### <code v-pre>buildDbQueryTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L204) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildDbQueryTool: () => McpTool;
```

#### <code v-pre>buildEchoTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L26) <code v-pre>packages/mcp/src/fixture.ts</code>

5 tool builder — kiwa test で頻出する MCP tool の shape を SSOT 化。 各 builder は `(server) =&gt; tool + handler` を返す形ではなく `(server) =&gt; void` で直接 register する。 test は `registerEcho(server)` 1 行で使い始められる。 ### 5 tool の役割分担 | tool | 想定シナリオ | |---|---| | echo | JSON-RPC handshake + tools/call chain の smoke test | | calc | 数値 arg + validation error path | | weather | enum arg + mock data 分岐 | | search | array return + relevance ranking (word overlap 近似) | | db-query | multi-arg + isError=true path (SQL parse error mock) | 各 builder は tool definition だけを取り出す helper (`buildXTool`) も提供し、 schema 検証 test 用に直接 return する。

```ts
export declare const buildEchoTool: () => McpTool;
```

#### <code v-pre>buildSearchTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L153) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildSearchTool: () => McpTool;
```

#### <code v-pre>buildWeatherTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L110) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildWeatherTool: () => McpTool;
```

#### <code v-pre>calcHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L67) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const calcHandler: ToolHandler;
```

#### <code v-pre>connectClientToServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts#L172) <code v-pre>packages/mcp/src/client.ts</code>

shortcut — server + client + transport を 1 発で組み立てて handshake まで完了する factory。 test の 8 割はこれで足りる想定。

```ts
export declare function connectClientToServer(server: McpServer, clientConfig?: McpClientConfig): Promise<{
    client: McpClient;
    transport: InMemoryTransport;
}>;
```

#### <code v-pre>dbQueryHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L217) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const dbQueryHandler: ToolHandler;
```

#### <code v-pre>echoHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L38) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const echoHandler: ToolHandler;
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

#### <code v-pre>MCP&#95;PROTOCOL&#95;VERSION</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts#L18) <code v-pre>packages/mcp/src/server.ts</code>

kiwa mock が話す MCP protocol version。 real MCP は "2024-11-05" 系。

```ts
export declare const MCP_PROTOCOL_VERSION = "2024-11-05";
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

#### <code v-pre>registerAllFixtureTools</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L234) <code v-pre>packages/mcp/src/fixture.ts</code>

5 tool を一括 register。 tutorial / dogfood 起動用の 1 行 setup。

```ts
export declare function registerAllFixtureTools(server: McpServer): void;
```

#### <code v-pre>registerCalc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L93) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerCalc(server: McpServer): void;
```

#### <code v-pre>registerDbQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L227) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerDbQuery(server: McpServer): void;
```

#### <code v-pre>registerEcho</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L44) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerEcho(server: McpServer): void;
```

#### <code v-pre>registerSearch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L187) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerSearch(server: McpServer): void;
```

#### <code v-pre>registerWeather</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L135) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerWeather(server: McpServer): void;
```

#### <code v-pre>searchHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L166) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const searchHandler: ToolHandler;
```

#### <code v-pre>textContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L128) <code v-pre>packages/mcp/src/tools.ts</code>

shortcut — text content 1 block だけの result を組み立てる。 handler 実装補助。

```ts
export declare function textContent(text: string): ToolCallContent;
```

#### <code v-pre>ToolRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L21) <code v-pre>packages/mcp/src/tools.ts</code>

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

#### <code v-pre>validateSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L64) <code v-pre>packages/mcp/src/tools.ts</code>

ToolInputSchema に対して input value を validate する。 real MCP は Draft 7 の full JSONSchema を許容するが、 kiwa mock は type + properties + required + items + enum + description の 5 種のみ検証する (types.ts のコメント SSOT)。 それ以外の schema keyword は「always valid」 扱い。 返り値 = validation error list。 empty なら valid。

```ts
export declare function validateSchema(schema: ToolInputSchema, value: unknown, path?: string): string[];
```

#### <code v-pre>weatherHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L123) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const weatherHandler: ToolHandler;
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

#### <code v-pre>RegisteredTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L11) <code v-pre>packages/mcp/src/tools.ts</code>

Registered tool = definition + handler。 server 内で name をキーに保持する。

```ts
export interface RegisteredTool {
    tool: McpTool;
    handler: ToolHandler;
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
<!-- kiwa-public-api:end -->
