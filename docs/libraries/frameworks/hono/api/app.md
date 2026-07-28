---
title: "@kiwa-lab/hono app の API 契約"
---

# <code v-pre>@kiwa-lab/hono</code> <code v-pre>app</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L223) <code v-pre>packages/hono/src/app.ts</code>

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

#### <code v-pre>compileRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L150) <code v-pre>packages/hono/src/app.ts</code>

Compile a Hono-shaped pattern (`/users/:id`, `/blog/*`, `/*`) into a regex + captured param name list. Kept intentionally small — real Hono uses a trie for prefix sharing; the subset we support is enough to model 90%+ of test targets without duplicating the runtime.

```ts
export declare function compileRoute(pattern: string): RouteMatcher;
```

#### <code v-pre>createContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L274) <code v-pre>packages/hono/src/app.ts</code>

Build a `HonoContext` — the `c` object handlers receive. `set` / `get` write to an internal Map; `json` / `text` capture the response into a spec the caller can inspect after the chain resolves.

```ts
export declare function createContext<TEnv = Record<string, unknown>, TVars = Record<string, unknown>>(opts: {
    req: HonoRequest;
    env?: TEnv;
    executionCtx?: ExecutionCtxLike;
}): HonoContext<TEnv, TVars>;
```

#### <code v-pre>createHonoApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L335) <code v-pre>packages/hono/src/app.ts</code>

Create a Hono-shaped app builder. Routes registered via `.get()` etc. get matched by `compileRoute`; middleware registered via `.use()` runs in registration order for every matching request.

```ts
export declare function createHonoApp<TEnv = Record<string, unknown>, TVars = Record<string, unknown>>(): HonoAppLike<TEnv, TVars>;
```

#### <code v-pre>HONO&#95;APP&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L25) <code v-pre>packages/hono/src/app.ts</code>

```ts
export declare const HONO_APP_SYMBOL: unique symbol;
```

#### <code v-pre>HONO&#95;CONTEXT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L26) <code v-pre>packages/hono/src/app.ts</code>

```ts
export declare const HONO_CONTEXT_SYMBOL: unique symbol;
```

#### <code v-pre>HONO&#95;ROUTE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L27) <code v-pre>packages/hono/src/app.ts</code>

```ts
export declare const HONO_ROUTE_SYMBOL: unique symbol;
```

#### <code v-pre>invokeRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L482) <code v-pre>packages/hono/src/app.ts</code>

Invoke a single request against an app: build request, walk registered middleware chain, dispatch to the first matching route handler, capture trace + response + error. Returns a `matched: false` result when nothing matches (so callers can assert the 404 fallback path).

```ts
export declare function invokeRoute<TEnv, TVars>(opts: InvokeRouteOptions<TEnv, TVars>): Promise<InvokeRouteResult>;
```

#### <code v-pre>isHonoApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L595) <code v-pre>packages/hono/src/app.ts</code>

Type guard: recognize a HonoAppLike.

```ts
export declare function isHonoApp(value: unknown): value is HonoAppLike;
```

#### <code v-pre>isHonoContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L604) <code v-pre>packages/hono/src/app.ts</code>

Type guard: recognize a HonoContext.

```ts
export declare function isHonoContext(value: unknown): value is HonoContext;
```

#### <code v-pre>matchRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L174) <code v-pre>packages/hono/src/app.ts</code>

Match a request `path` against a matcher and return `{params}` when it hits, `null` when it doesn't. Callers use this for both route dispatch + middleware scope checks (`app.use('/api/*', ...)`).

```ts
export declare function matchRoute(matcher: RouteMatcher, path: string): RouteParams | null;
```

### 型

#### <code v-pre>ExecutionCtxLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L80) <code v-pre>packages/hono/src/app.ts</code>

Shape of `ExecutionContext` from workers.ts (avoid circular import).

```ts
export interface ExecutionCtxLike {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}
```

#### <code v-pre>Handler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L86) <code v-pre>packages/hono/src/app.ts</code>

Handler = `(c) =&gt; c.json(...) | Response spec | Promise&lt;...&gt;`.

```ts
export type Handler<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> = (c: HonoContext<TEnv, TVars>) => HonoResponseSpec | Promise<HonoResponseSpec> | void | Promise<void>;
```

#### <code v-pre>HonoAppLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L119) <code v-pre>packages/hono/src/app.ts</code>

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

#### <code v-pre>HonoContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L65) <code v-pre>packages/hono/src/app.ts</code>

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

#### <code v-pre>HonoRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L42) <code v-pre>packages/hono/src/app.ts</code>

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

#### <code v-pre>HonoResponseSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L57) <code v-pre>packages/hono/src/app.ts</code>

Buffered response captured by `c.json()` / `c.text()` / `c.header()`.

```ts
export interface HonoResponseSpec {
    status: number;
    headers: Record<string, string>;
    body: unknown;
    bodyKind: 'json' | 'text' | 'empty';
}
```

#### <code v-pre>HttpMethod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L29) <code v-pre>packages/hono/src/app.ts</code>

```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
```

#### <code v-pre>InvokeRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L459) <code v-pre>packages/hono/src/app.ts</code>

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

#### <code v-pre>InvokeRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L469) <code v-pre>packages/hono/src/app.ts</code>

```ts
export interface InvokeRouteResult {
    readonly matched: boolean;
    readonly response: HonoResponseSpec;
    readonly trace: MiddlewareTraceEntry[];
    readonly error: unknown;
}
```

#### <code v-pre>Middleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L91) <code v-pre>packages/hono/src/app.ts</code>

Middleware = `(c, next) =&gt; await next()` shape.

```ts
export type Middleware<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> = (c: HonoContext<TEnv, TVars>, next: () => Promise<void>) => void | Promise<void>;
```

#### <code v-pre>MiddlewareTraceEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L111) <code v-pre>packages/hono/src/app.ts</code>

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

#### <code v-pre>QueryParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L37) <code v-pre>packages/hono/src/app.ts</code>

Parsed query object from a URL search string.

```ts
export interface QueryParams {
    readonly [key: string]: string | undefined;
}
```

#### <code v-pre>RouteParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/app.ts#L32) <code v-pre>packages/hono/src/app.ts</code>

Params captured from a `:name` segment.

```ts
export interface RouteParams {
    readonly [key: string]: string | undefined;
}
```
