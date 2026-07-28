---
title: "@kiwa-lab/sveltekit invoke-hooks の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/sveltekit</code> <code v-pre>invoke-hooks</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L116) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export declare function invokeHandle<TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: InvokeHandleOptions<TLocals>): Promise<InvokeHandleResult<TLocals>>;
```

#### <code v-pre>invokeHandleError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L218) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export declare function invokeHandleError<TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: InvokeHandleErrorOptions<TLocals>): Promise<InvokeHandleErrorResult>;
```

#### <code v-pre>invokeHandleFetch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L169) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export declare function invokeHandleFetch<TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: InvokeHandleFetchOptions<TLocals>): Promise<InvokeHandleFetchResult>;
```

### 型

#### <code v-pre>HandleArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L25) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export type HandleArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
    readonly event: SimulatedHookRequestEvent<TLocals>;
    resolve(event: SimulatedHookRequestEvent<TLocals>): Promise<Response> | Response;
};
```

#### <code v-pre>HandleErrorArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L44) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export type HandleErrorArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
    readonly error: unknown;
    readonly event: SimulatedHookRequestEvent<TLocals>;
    readonly status: number;
    readonly message: string;
};
```

#### <code v-pre>HandleErrorFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L51) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export type HandleErrorFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (args: HandleErrorArgs<TLocals>) => Promise<{
    message: string;
} | void> | {
    message: string;
} | void;
```

#### <code v-pre>HandleFetchArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L34) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export type HandleFetchArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
    readonly event: SimulatedHookRequestEvent<TLocals>;
    readonly request: Request;
    fetch(req: Request): Promise<Response>;
};
```

#### <code v-pre>HandleFetchFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L40) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export type HandleFetchFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (args: HandleFetchArgs<TLocals>) => Promise<Response> | Response;
```

#### <code v-pre>HandleFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L30) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export type HandleFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (args: HandleArgs<TLocals>) => Promise<Response> | Response;
```

#### <code v-pre>InvokeHandleErrorOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L202) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface InvokeHandleErrorOptions<TLocals extends Record<string, unknown>> {
    readonly handleError: HandleErrorFunction<TLocals>;
    readonly error: unknown;
    readonly url: string;
    readonly status: number;
    readonly message: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly locals?: TLocals;
}
```

#### <code v-pre>InvokeHandleErrorResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L213) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface InvokeHandleErrorResult {
    readonly report: {
        message: string;
    } | void;
    readonly thrown: unknown;
}
```

#### <code v-pre>InvokeHandleFetchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L147) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface InvokeHandleFetchOptions<TLocals extends Record<string, unknown>> {
    readonly handleFetch: HandleFetchFunction<TLocals>;
    readonly eventUrl: string;
    readonly fetchUrl: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly locals?: TLocals;
    /**
     * Fake fetch that handleFetch delegates to via `fetch(req)`. Default returns
     * an empty 200 Response.
     */
    readonly downstreamFetch?: (req: Request) => Promise<Response>;
}
```

#### <code v-pre>InvokeHandleFetchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L162) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface InvokeHandleFetchResult {
    readonly response: Response;
    readonly downstreamCalled: boolean;
    readonly downstreamRequest: Request | null;
    readonly error: unknown;
}
```

#### <code v-pre>InvokeHandleOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L55) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface InvokeHandleOptions<TLocals extends Record<string, unknown>> {
    readonly handle: HandleFunction<TLocals>;
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly params?: Record<string, string>;
    readonly locals?: TLocals;
    readonly routeId?: string;
    readonly platform?: Record<string, unknown>;
    /**
     * What `resolve(event)` should return when the handler delegates to the
     * downstream layer. Default = `new Response('ok', { status: 200 })`.
     */
    readonly resolveResponse?: Response | ((event: SimulatedHookRequestEvent<TLocals>) => Response | Promise<Response>);
}
```

#### <code v-pre>InvokeHandleResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L72) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface InvokeHandleResult<TLocals extends Record<string, unknown>> {
    readonly response: Response;
    readonly resolveCalled: boolean;
    readonly localsAtResolve: TLocals | null;
    readonly error: unknown;
    readonly env: {
        readonly cookies: Map<string, string>;
    };
}
```

#### <code v-pre>SimulatedHookRequestEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L11) <code v-pre>packages/sveltekit/src/invoke-hooks.ts</code>

```ts
export interface SimulatedHookRequestEvent<TLocals extends Record<string, unknown> = Record<string, unknown>> {
    readonly request: Request;
    readonly url: URL;
    readonly params: Readonly<Record<string, string>>;
    readonly cookies: {
        get(name: string): string | undefined;
        set(name: string, value: string): void;
        delete(name: string): void;
    };
    readonly locals: TLocals;
    readonly route: {
        readonly id: string | null;
    };
    readonly platform: Record<string, unknown> | undefined;
}
```
