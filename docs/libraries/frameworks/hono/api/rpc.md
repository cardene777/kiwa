---
title: "@kiwa-lab/hono rpc の API 契約"
---

# <code v-pre>@kiwa-lab/hono</code> <code v-pre>rpc</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRpcClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L75) <code v-pre>packages/hono/src/rpc.ts</code>

Build a hc-shaped RPC client for an app. Property access walks a route string (bracketed segments = `:name` params), terminals `$get` / `$post` / ... fire a request through `invokeRoute` and wrap the resulting response spec into an `HcResponse` object. The client is intentionally schemaless at runtime — TS `AppType` inference lives in the caller's app types; kiwa doesn't parse or enforce them. That keeps the runtime tiny (a Proxy tree) and matches real Hono `hc` behavior.

```ts
export declare function createRpcClient<TEnv = Record<string, unknown>>(app: HonoAppLike<TEnv>, opts?: {
    baseUrl?: string;
}): HcClient;
```

#### <code v-pre>defineRpcApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L194) <code v-pre>packages/hono/src/rpc.ts</code>

Convenience: build an app + client pair in one call. Useful for tests that want to declare the app + immediately drive it through the client without a separate `createHonoApp()` line.

```ts
export declare function defineRpcApp<TEnv = Record<string, unknown>>(opts: DefineRpcAppOptions<TEnv>): {
    app: HonoAppLike<TEnv>;
    client: HcClient;
};
```

#### <code v-pre>HC&#95;CLIENT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L32) <code v-pre>packages/hono/src/rpc.ts</code>

```ts
export declare const HC_CLIENT_SYMBOL: unique symbol;
```

#### <code v-pre>HC&#95;REQUEST&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L33) <code v-pre>packages/hono/src/rpc.ts</code>

```ts
export declare const HC_REQUEST_SYMBOL: unique symbol;
```

#### <code v-pre>isHcResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L204) <code v-pre>packages/hono/src/rpc.ts</code>

Type guard: recognize an HcResponse.

```ts
export declare function isHcResponse(value: unknown): value is HcResponse;
```

### 型

#### <code v-pre>DefineRpcAppOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L185) <code v-pre>packages/hono/src/rpc.ts</code>

```ts
export interface DefineRpcAppOptions<TEnv = Record<string, unknown>> {
    readonly configure: (app: HonoAppLike<TEnv>) => void;
}
```

#### <code v-pre>HcClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L183) <code v-pre>packages/hono/src/rpc.ts</code>

Runtime shape of a hc client — an untyped Proxy for JS callers. TS callers typically re-cast the return value into their app-specific typed client (`const client = createRpcClient&lt;AppType&gt;(app) as ClientType`).

```ts
export type HcClient = unknown;
```

#### <code v-pre>HcRequestOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L36) <code v-pre>packages/hono/src/rpc.ts</code>

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

#### <code v-pre>HcResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L51) <code v-pre>packages/hono/src/rpc.ts</code>

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
