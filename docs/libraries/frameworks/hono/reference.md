# hono リファレンス

## app と route

`createHonoApp` は `get`、`post`、`put`、`delete`、`patch`、`all`、`use`、`route` を持つ builder を返します。`invokeRoute` は app、method、path、headers、body、env、execution context を受け取り、`matched`、buffered response、middleware trace、error を返します。

`compileRoute` と `matchRoute` は `/users/:id` と `/files/*` を扱います。パラメータは URL decode されます。正規表現や任意の Hono router 拡張は扱いません。

`createContext` は `c.req`、`c.env`、`c.status`、`c.header`、`c.json`、`c.text`、`c.set`、`c.get` を単体 handler テスト用に提供します。`c.json` の既定 content type は JSON、`c.text` の既定 content type は UTF-8 text です。

## RPC

`createRpcClient` は Proxy による in-process client を返します。各 response には `ok`、status、headers、trace、matched、error、`json`、`text` があります。text response の `json()` は `JSON.parse` を行うため、JSON でない text は失敗します。

`defineRpcApp` は configure callback から app と client をまとめて作ります。`isHcResponse` は response shape の判定だけを行います。

## Workers mock

`createWorkersEnv` は KV、D1、R2、vars、secrets を binding 名のまま一つの env object にまとめます。`createExecutionContext` は `waitUntil`、`waitUntilAll`、`passThroughOnException`、`didPassThrough`、`pendingCount` を提供します。background work を登録した test は、assertion の前に `waitUntilAll` を await します。

KV は get、put、delete、metadata、expiration、prefix list を in-memory で扱います。D1 は query ごとにあらかじめ登録した response と bindings log を返し、SQL や transaction を実行しません。R2 は object と metadata を保持しますが、checksum や content type を推論しません。D1 batch も transaction を保証せず、各 statement を独立して `run()` します。Workers の Durable Objects、Queue、WebSocket、実 binding lifecycle は対象外です。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `missing param "${key}" for path segment "${seg}"` | [packages/hono/src/rpc.ts](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L85) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `buildRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L223) `packages/hono/src/app.ts`

Build a `HonoRequest` shape from the primitives `invokeRoute` receives. Body handling is deferred (json() / text() re-parse the raw body on demand) so tests can assert on the raw string when needed.

```ts
export declare function buildRequest(input: {
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    params?: RouteParams;
}): HonoRequest;
```

#### `compileRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L150) `packages/hono/src/app.ts`

Compile a Hono-shaped pattern (`/users/:id`, `/blog/*`, `/*`) into a regex + captured param name list. Kept intentionally small — real Hono uses a trie for prefix sharing; the subset we support is enough to model 90%+ of test targets without duplicating the runtime.

```ts
export declare function compileRoute(pattern: string): RouteMatcher;
```

#### `createContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L274) `packages/hono/src/app.ts`

Build a `HonoContext` — the `c` object handlers receive. `set` / `get` write to an internal Map; `json` / `text` capture the response into a spec the caller can inspect after the chain resolves.

```ts
export declare function createContext<TEnv = Record<string, unknown>, TVars = Record<string, unknown>>(opts: {
    req: HonoRequest;
    env?: TEnv;
    executionCtx?: ExecutionCtxLike;
}): HonoContext<TEnv, TVars>;
```

#### `createExecutionContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L334) `packages/hono/src/workers.ts`

Build a Workers-shaped `ExecutionContext`. `waitUntil` collects the promises so tests can await them all with `ctx.waitUntilAll()` before asserting on side-effects (KV writes, log flushes, etc).

```ts
export declare function createExecutionContext(): ExecutionContextMockLike;
```

#### `createHonoApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L335) `packages/hono/src/app.ts`

Create a Hono-shaped app builder. Routes registered via `.get()` etc. get matched by `compileRoute`; middleware registered via `.use()` runs in registration order for every matching request.

```ts
export declare function createHonoApp<TEnv = Record<string, unknown>, TVars = Record<string, unknown>>(): HonoAppLike<TEnv, TVars>;
```

#### `createRpcClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L75) `packages/hono/src/rpc.ts`

Build a hc-shaped RPC client for an app. Property access walks a route string (bracketed segments = `:name` params), terminals `$get` / `$post` / ... fire a request through `invokeRoute` and wrap the resulting response spec into an `HcResponse` object. The client is intentionally schemaless at runtime — TS `AppType` inference lives in the caller's app types; kiwa doesn't parse or enforce them. That keeps the runtime tiny (a Proxy tree) and matches real Hono `hc` behavior.

```ts
export declare function createRpcClient<TEnv = Record<string, unknown>>(app: HonoAppLike<TEnv>, opts?: {
    baseUrl?: string;
}): HcClient;
```

#### `createWorkersEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L380) `packages/hono/src/workers.ts`

Assemble a Workers-shaped `env` object. KV / D1 / R2 stubs get spread onto the env under their binding names + `vars` / `secrets` become plain string properties. Callers can pass the result directly to `HonoAppLike.request(url, init, env, ctx)` or attach it to `createContext({ env })`.

```ts
export declare function createWorkersEnv(spec?: WorkersEnvSpec): WorkersEnvLike;
```

#### `D1_DATABASE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L29) `packages/hono/src/workers.ts`

```ts
export declare const D1_DATABASE_SYMBOL: unique symbol;
```

#### `defineRpcApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L194) `packages/hono/src/rpc.ts`

Convenience: build an app + client pair in one call. Useful for tests that want to declare the app + immediately drive it through the client without a separate `createHonoApp()` line.

```ts
export declare function defineRpcApp<TEnv = Record<string, unknown>>(opts: DefineRpcAppOptions<TEnv>): {
    app: HonoAppLike<TEnv>;
    client: HcClient;
};
```

#### `EXECUTION_CTX_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L27) `packages/hono/src/workers.ts`

```ts
export declare const EXECUTION_CTX_SYMBOL: unique symbol;
```

#### `HC_CLIENT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L32) `packages/hono/src/rpc.ts`

```ts
export declare const HC_CLIENT_SYMBOL: unique symbol;
```

#### `HC_REQUEST_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L33) `packages/hono/src/rpc.ts`

```ts
export declare const HC_REQUEST_SYMBOL: unique symbol;
```

#### `HONO_APP_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L25) `packages/hono/src/app.ts`

```ts
export declare const HONO_APP_SYMBOL: unique symbol;
```

#### `HONO_CONTEXT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L26) `packages/hono/src/app.ts`

```ts
export declare const HONO_CONTEXT_SYMBOL: unique symbol;
```

#### `HONO_ROUTE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L27) `packages/hono/src/app.ts`

```ts
export declare const HONO_ROUTE_SYMBOL: unique symbol;
```

#### `invokeRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L482) `packages/hono/src/app.ts`

Invoke a single request against an app: build request, walk registered middleware chain, dispatch to the first matching route handler, capture trace + response + error. Returns a `matched: false` result when nothing matches (so callers can assert the 404 fallback path).

```ts
export declare function invokeRoute<TEnv, TVars>(opts: InvokeRouteOptions<TEnv, TVars>): Promise<InvokeRouteResult>;
```

#### `isD1DatabaseMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L420) `packages/hono/src/workers.ts`

Type guard: recognize a D1 database mock.

```ts
export declare function isD1DatabaseMock(value: unknown): value is D1DatabaseLike;
```

#### `isExecutionContextMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L402) `packages/hono/src/workers.ts`

Type guard: recognize an ExecutionContext mock.

```ts
export declare function isExecutionContextMock(value: unknown): value is ExecutionContextMockLike;
```

#### `isHcResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L204) `packages/hono/src/rpc.ts`

Type guard: recognize an HcResponse.

```ts
export declare function isHcResponse(value: unknown): value is HcResponse;
```

#### `isHonoApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L595) `packages/hono/src/app.ts`

Type guard: recognize a HonoAppLike.

```ts
export declare function isHonoApp(value: unknown): value is HonoAppLike;
```

#### `isHonoContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L604) `packages/hono/src/app.ts`

Type guard: recognize a HonoContext.

```ts
export declare function isHonoContext(value: unknown): value is HonoContext;
```

#### `isKVNamespaceMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L411) `packages/hono/src/workers.ts`

Type guard: recognize a KV namespace mock.

```ts
export declare function isKVNamespaceMock(value: unknown): value is KVNamespaceLike;
```

#### `isR2BucketMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L429) `packages/hono/src/workers.ts`

Type guard: recognize an R2 bucket mock.

```ts
export declare function isR2BucketMock(value: unknown): value is R2BucketLike;
```

#### `isWorkersEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L393) `packages/hono/src/workers.ts`

Type guard: recognize a WorkersEnvLike.

```ts
export declare function isWorkersEnv(value: unknown): value is WorkersEnvLike;
```

#### `KV_NAMESPACE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L28) `packages/hono/src/workers.ts`

```ts
export declare const KV_NAMESPACE_SYMBOL: unique symbol;
```

#### `matchRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L174) `packages/hono/src/app.ts`

Match a request `path` against a matcher and return `{params}` when it hits, `null` when it doesn't. Callers use this for both route dispatch + middleware scope checks (`app.use('/api/*', ...)`).

```ts
export declare function matchRoute(matcher: RouteMatcher, path: string): RouteParams | null;
```

#### `mockD1Database`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L174) `packages/hono/src/workers.ts`

Build an in-memory D1 database stub. Tests register canned responses per query text with `__setResponse` and inspect executed queries + bindings via `__log()`. Real D1 uses SQLite; the mock is intentionally query-string matched (no SQL parsing) so the behavior tests observe is deterministic.

```ts
export declare function mockD1Database(): D1DatabaseLike;
```

#### `mockKVNamespace`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L68) `packages/hono/src/workers.ts`

Build an in-memory KV namespace stub with the Cloudflare Workers surface (`get` / `put` / `delete` / `list` / `getWithMetadata`). Expiration is evaluated against `Date.now()` on read, matching Workers behavior.

```ts
export declare function mockKVNamespace<TMetadata = unknown>(): KVNamespaceLike<TMetadata>;
```

#### `mockR2Bucket`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L277) `packages/hono/src/workers.ts`

Build an in-memory R2 bucket stub. Values may be strings or ArrayBuffers; the mock does not parse content type or compute checksums — those are the caller's responsibility if a test asserts on them.

```ts
export declare function mockR2Bucket(): R2BucketLike;
```

#### `R2_BUCKET_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L30) `packages/hono/src/workers.ts`

```ts
export declare const R2_BUCKET_SYMBOL: unique symbol;
```

#### `WORKERS_ENV_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L26) `packages/hono/src/workers.ts`

```ts
export declare const WORKERS_ENV_SYMBOL: unique symbol;
```

### 型

#### `D1DatabaseLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L158) `packages/hono/src/workers.ts`

```ts
export interface D1DatabaseLike {
    readonly [D1_DATABASE_SYMBOL]: true;
    prepare(query: string): D1PreparedStatementLike;
    batch(statements: ReadonlyArray<D1PreparedStatementLike>): Promise<D1Result[]>;
    exec(query: string): Promise<D1Result<D1Row>>;
    /** Test-only: register a canned response for `prepare(query).all()` / `.first()`. */
    __setResponse(query: string, rows: readonly D1Row[]): void;
    __log(): ReadonlyArray<{
        query: string;
        bindings: unknown[];
    }>;
}
```

#### `D1PreparedStatementLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L151) `packages/hono/src/workers.ts`

```ts
export interface D1PreparedStatementLike {
    bind(...values: unknown[]): D1PreparedStatementLike;
    first<T = D1Row>(colName?: string): Promise<T | null>;
    all<T = D1Row>(): Promise<D1Result<T>>;
    run(): Promise<D1Result<D1Row>>;
}
```

#### `D1Result`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L145) `packages/hono/src/workers.ts`

```ts
export interface D1Result<T = D1Row> {
    readonly results: T[];
    readonly success: boolean;
    readonly meta: {
        readonly duration: number;
        readonly changes: number;
        readonly last_row_id: number;
    };
}
```

#### `D1Row`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L143) `packages/hono/src/workers.ts`

D1 result row — dictionary of column → value.

```ts
export type D1Row = Record<string, unknown>;
```

#### `DefineRpcAppOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L185) `packages/hono/src/rpc.ts`

```ts
export interface DefineRpcAppOptions<TEnv = Record<string, unknown>> {
    readonly configure: (app: HonoAppLike<TEnv>) => void;
}
```

#### `ExecutionContextMockLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L319) `packages/hono/src/workers.ts`

```ts
export interface ExecutionContextMockLike extends ExecutionCtxLike {
    readonly [EXECUTION_CTX_SYMBOL]: true;
    /** Test hook — resolve every promise passed to `waitUntil`. */
    waitUntilAll(): Promise<void>;
    /** Was `passThroughOnException()` called at least once? */
    didPassThrough(): boolean;
    /** How many promises did `waitUntil()` receive? */
    pendingCount(): number;
}
```

#### `ExecutionCtxLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L80) `packages/hono/src/app.ts`

Shape of `ExecutionContext` from workers.ts (avoid circular import).

```ts
export interface ExecutionCtxLike {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}
```

#### `Handler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L86) `packages/hono/src/app.ts`

Handler = `(c) =&gt; c.json(...) | Response spec | Promise&lt;...&gt;`.

```ts
export type Handler<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> = (c: HonoContext<TEnv, TVars>) => HonoResponseSpec | Promise<HonoResponseSpec> | void | Promise<void>;
```

#### `HcClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L183) `packages/hono/src/rpc.ts`

Runtime shape of a hc client — an untyped Proxy for JS callers. TS callers typically re-cast the return value into their app-specific typed client (`const client = createRpcClient&lt;AppType&gt;(app) as ClientType`).

```ts
export type HcClient = unknown;
```

#### `HcRequestOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L36) `packages/hono/src/rpc.ts`

Options passed at every `$get` / `$post` / ... call.

```ts
export interface HcRequestOptions<TEnv = Record<string, unknown>> {
    readonly param?: RouteParams;
    readonly query?: QueryParams;
    readonly json?: unknown;
    readonly text?: string;
    readonly headers?: Record<string, string>;
    readonly env?: TEnv;
    readonly executionCtx?: ExecutionCtxLike;
}
```

#### `HcResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L51) `packages/hono/src/rpc.ts`

Response returned to hc callers. Mirrors the parts of the Fetch `Response` shape tests need (`ok` / `status` / `json()` / `text()` / `headers`), plus a `trace` array for asserting on the middleware chain a route went through.

```ts
export interface HcResponse<T = unknown> {
    readonly [HC_REQUEST_SYMBOL]: true;
    readonly ok: boolean;
    readonly status: number;
    readonly headers: Record<string, string>;
    readonly trace: ReadonlyArray<MiddlewareTraceEntry>;
    readonly matched: boolean;
    readonly error: unknown;
    json(): Promise<T>;
    text(): Promise<string>;
}
```

#### `HonoAppLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L119) `packages/hono/src/app.ts`

```ts
export interface HonoAppLike<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> {
    readonly [HONO_APP_SYMBOL]: true;
    get(path: string, handler: Handler<TEnv, TVars>): this;
    post(path: string, handler: Handler<TEnv, TVars>): this;
    put(path: string, handler: Handler<TEnv, TVars>): this;
    delete(path: string, handler: Handler<TEnv, TVars>): this;
    patch(path: string, handler: Handler<TEnv, TVars>): this;
    all(path: string, handler: Handler<TEnv, TVars>): this;
    use(pattern: string, middleware: Middleware<TEnv, TVars>): this;
    route(prefix: string, sub: HonoAppLike<TEnv, TVars>): this;
    request(input: string | RequestInit, init?: RequestInit, env?: TEnv, executionCtx?: ExecutionCtxLike): Promise<HonoResponseSpec>;
    readonly routes: ReadonlyArray<RouteEntry<TEnv, TVars>>;
    readonly middlewares: ReadonlyArray<MiddlewareEntry<TEnv, TVars>>;
}
```

#### `HonoContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L65) `packages/hono/src/app.ts`

Handler context — `c` in Hono.

```ts
export interface HonoContext<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> {
    readonly [HONO_CONTEXT_SYMBOL]: true;
    readonly req: HonoRequest;
    readonly env: TEnv;
    readonly executionCtx: ExecutionCtxLike | undefined;
    status(code: number): HonoContext<TEnv, TVars>;
    header(name: string, value: string): HonoContext<TEnv, TVars>;
    json<T>(body: T, status?: number): HonoResponseSpec;
    text(body: string, status?: number): HonoResponseSpec;
    set(key: string, value: unknown): void;
    get(key: string): unknown;
    readonly response: HonoResponseSpec;
}
```

#### `HonoRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L42) `packages/hono/src/app.ts`

Request contract exposed to handlers as `c.req`.

```ts
export interface HonoRequest {
    readonly method: HttpMethod;
    readonly url: string;
    readonly path: string;
    readonly headers: Record<string, string>;
    readonly params: RouteParams;
    readonly query: QueryParams;
    json<T = unknown>(): Promise<T>;
    text(): Promise<string>;
    header(name: string): string | undefined;
    param(name: string): string | undefined;
    queryValue(name: string): string | undefined;
}
```

#### `HonoResponseSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L57) `packages/hono/src/app.ts`

Buffered response captured by `c.json()` / `c.text()` / `c.header()`.

```ts
export interface HonoResponseSpec {
    status: number;
    headers: Record<string, string>;
    body: unknown;
    bodyKind: 'json' | 'text' | 'empty';
}
```

#### `HttpMethod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L29) `packages/hono/src/app.ts`

```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
```

#### `InvokeRouteOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L459) `packages/hono/src/app.ts`

```ts
export interface InvokeRouteOptions<TEnv, TVars> {
    readonly app: HonoAppLike<TEnv, TVars>;
    readonly method: HttpMethod;
    readonly path: string;
    readonly headers?: Record<string, string>;
    readonly body?: string;
    readonly env?: TEnv;
    readonly executionCtx?: ExecutionCtxLike;
}
```

#### `InvokeRouteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L469) `packages/hono/src/app.ts`

```ts
export interface InvokeRouteResult {
    readonly matched: boolean;
    readonly response: HonoResponseSpec;
    readonly trace: MiddlewareTraceEntry[];
    readonly error: unknown;
}
```

#### `KVEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L33) `packages/hono/src/workers.ts`

KV entry — value + optional metadata + expiration timestamp.

```ts
export interface KVEntry<TMetadata = unknown> {
    readonly value: string;
    readonly metadata?: TMetadata;
    readonly expiresAt: number | null;
}
```

#### `KVListResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L39) `packages/hono/src/workers.ts`

```ts
export interface KVListResult<TMetadata = unknown> {
    readonly keys: ReadonlyArray<{
        readonly name: string;
        readonly metadata?: TMetadata;
        readonly expiration?: number;
    }>;
    readonly list_complete: boolean;
    readonly cursor: string | null;
}
```

#### `KVNamespaceLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L52) `packages/hono/src/workers.ts`

```ts
export interface KVNamespaceLike<TMetadata = unknown> {
    readonly [KV_NAMESPACE_SYMBOL]: true;
    get(key: string): Promise<string | null>;
    getWithMetadata(key: string): Promise<{
        value: string | null;
        metadata: TMetadata | null;
    }>;
    put(key: string, value: string, options?: KVPutOptions<TMetadata>): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
    }): Promise<KVListResult<TMetadata>>;
    /** Test-only escape hatch — snapshot every key + entry synchronously. */
    __snapshot(): Record<string, KVEntry<TMetadata>>;
}
```

#### `KVPutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L46) `packages/hono/src/workers.ts`

Options passed to `KVNamespace.put()`.

```ts
export interface KVPutOptions<TMetadata = unknown> {
    readonly expirationTtl?: number;
    readonly expiration?: number;
    readonly metadata?: TMetadata;
}
```

#### `Middleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L91) `packages/hono/src/app.ts`

Middleware = `(c, next) =&gt; await next()` shape.

```ts
export type Middleware<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> = (c: HonoContext<TEnv, TVars>, next: () => Promise<void>) => void | Promise<void>;
```

#### `MiddlewareTraceEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L111) `packages/hono/src/app.ts`

Trace entry produced by `invokeRoute` for the middleware chain.

```ts
export interface MiddlewareTraceEntry {
    readonly kind: 'middleware' | 'handler';
    readonly pattern: string;
    readonly method: HttpMethod | 'ALL';
    readonly enteredAt: number;
    readonly exitedAt: number | null;
}
```

#### `QueryParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L37) `packages/hono/src/app.ts`

Parsed query object from a URL search string.

```ts
export interface QueryParams {
    readonly [key: string]: string | undefined;
}
```

#### `R2BucketLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L259) `packages/hono/src/workers.ts`

```ts
export interface R2BucketLike {
    readonly [R2_BUCKET_SYMBOL]: true;
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: string | ArrayBuffer, options?: {
        httpMetadata?: R2Object['httpMetadata'];
        customMetadata?: R2Object['customMetadata'];
    }): Promise<R2Object>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
    }): Promise<R2ListResult>;
    __snapshot(): Record<string, R2Object>;
}
```

#### `R2ListResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L253) `packages/hono/src/workers.ts`

```ts
export interface R2ListResult {
    readonly objects: ReadonlyArray<R2Object>;
    readonly truncated: boolean;
    readonly cursor: string | null;
}
```

#### `R2Object`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L244) `packages/hono/src/workers.ts`

```ts
export interface R2Object {
    readonly key: string;
    readonly value: string | ArrayBuffer;
    readonly httpMetadata?: {
        readonly contentType?: string;
    };
    readonly customMetadata?: Record<string, string>;
    readonly size: number;
    readonly uploaded: Date;
}
```

#### `RouteParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L32) `packages/hono/src/app.ts`

Params captured from a `:name` segment.

```ts
export interface RouteParams {
    readonly [key: string]: string | undefined;
}
```

#### `WorkersEnvLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L370) `packages/hono/src/workers.ts`

```ts
export interface WorkersEnvLike extends Record<string, unknown> {
    readonly [WORKERS_ENV_SYMBOL]: true;
}
```

#### `WorkersEnvSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L362) `packages/hono/src/workers.ts`

```ts
export interface WorkersEnvSpec {
    readonly kv?: Record<string, KVNamespaceLike>;
    readonly d1?: Record<string, D1DatabaseLike>;
    readonly r2?: Record<string, R2BucketLike>;
    readonly vars?: Record<string, string>;
    readonly secrets?: Record<string, string>;
}
```
<!-- kiwa-public-api:end -->
