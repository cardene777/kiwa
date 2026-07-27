# sveltekit リファレンス

## 公開 API

`invokeLoad` は URL、params、cookies、locals を持つ load event を作ります。`invokeAction` と `fail` は form action を扱います。`invokeHandle`、`invokeHandleFetch`、`invokeHandleError` は個別 hook を実行します。`setupSvelteKitHooksEnv` は共有環境を作り、`sequence` は handle を連鎖します。

## 設定

hooks 環境は URL、cookies、locals、params、routeId、platform を受け取ります。`runHandle` には固定 Response または event から Response を作る関数を渡せます。

## 結果の分岐

load と form action は data、fail、redirect、error を区別します。`redirect` と `error` は throw する signal、`fail` は action から return する signal です。server hook が変更した locals と cookie は env から確認し、response だけで見落とさないようにします。

## 後始末と制約

共有 hooks 環境は `reset` で初期 cookie と locals の浅い snapshot に戻します。`sequence` は outer handle から inner handle、resolve、逆順の after 処理を組み立てます。例外は error と 500 response で確認します。SvelteKit server と browser navigation は起動しません。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `error`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L116) `packages/sveltekit/src/invoke-load.ts`

```ts
export declare function error(status: number, message: string): SvelteKitErrorSignal;
```

#### `fail`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L104) `packages/sveltekit/src/invoke-action.ts`

```ts
export declare function fail(status: number, data: unknown): SvelteKitFailSignal;
```

#### `invokeAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L59) `packages/sveltekit/src/invoke-action.ts`

```ts
export declare function invokeAction<TResult = unknown>(opts: InvokeActionOptions<TResult>): Promise<InvokeActionResult<TResult>>;
```

#### `invokeHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L116) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export declare function invokeHandle<TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: InvokeHandleOptions<TLocals>): Promise<InvokeHandleResult<TLocals>>;
```

#### `invokeHandleError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L218) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export declare function invokeHandleError<TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: InvokeHandleErrorOptions<TLocals>): Promise<InvokeHandleErrorResult>;
```

#### `invokeHandleFetch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L169) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export declare function invokeHandleFetch<TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: InvokeHandleFetchOptions<TLocals>): Promise<InvokeHandleFetchResult>;
```

#### `invokeLoad`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L65) `packages/sveltekit/src/invoke-load.ts`

```ts
export declare function invokeLoad<TResult = unknown>(opts: InvokeLoadOptions<TResult>): Promise<InvokeLoadResult<TResult>>;
```

#### `redirect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L112) `packages/sveltekit/src/invoke-load.ts`

```ts
export declare function redirect(status: number, location: string): SvelteKitRedirectSignal;
```

#### `sequence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L201) `packages/sveltekit/src/setup-hooks-env.ts`

sequence — SvelteKit 公式 `sequence(...handlers)` 相当の handle chain composer。 sequence(h1, h2) は h1 の resolve として h2 を渡し、 h2 の resolve として 最終の resolve を渡す。 結果として h1-before → h2-before → resolve → h2-after → h1-after の順で実行される。 引数なし時は no-op (resolve(event) を直接呼ぶ)。

```ts
export declare function sequence<TLocals extends Record<string, unknown> = Record<string, unknown>>(...handles: HandleFunction<TLocals>[]): HandleFunction<TLocals>;
```

#### `setupSvelteKitHooksEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L83) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export declare function setupSvelteKitHooksEnv<TLocals extends Record<string, unknown> = Record<string, unknown>>(options: SetupSvelteKitHooksEnvOptions<TLocals>): SvelteKitHooksEnv<TLocals>;
```

#### `SK_ERROR_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L9) `packages/sveltekit/src/invoke-load.ts`

```ts
export declare const SK_ERROR_SYMBOL: unique symbol;
```

#### `SK_FAIL_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L12) `packages/sveltekit/src/invoke-action.ts`

```ts
export declare const SK_FAIL_SYMBOL: unique symbol;
```

#### `SK_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L8) `packages/sveltekit/src/invoke-load.ts`

```ts
export declare const SK_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### `ActionFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L31) `packages/sveltekit/src/invoke-action.ts`

```ts
export type ActionFunction<TResult = unknown> = (event: SimulatedActionEvent) => Promise<TResult> | TResult;
```

#### `HandleArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L25) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export type HandleArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
    readonly event: SimulatedHookRequestEvent<TLocals>;
    resolve(event: SimulatedHookRequestEvent<TLocals>): Promise<Response> | Response;
};
```

#### `HandleErrorArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L44) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export type HandleErrorArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
    readonly error: unknown;
    readonly event: SimulatedHookRequestEvent<TLocals>;
    readonly status: number;
    readonly message: string;
};
```

#### `HandleErrorFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L51) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export type HandleErrorFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (args: HandleErrorArgs<TLocals>) => Promise<{
    message: string;
} | void> | {
    message: string;
} | void;
```

#### `HandleFetchArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L34) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export type HandleFetchArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
    readonly event: SimulatedHookRequestEvent<TLocals>;
    readonly request: Request;
    fetch(req: Request): Promise<Response>;
};
```

#### `HandleFetchFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L40) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export type HandleFetchFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (args: HandleFetchArgs<TLocals>) => Promise<Response> | Response;
```

#### `HandleFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L30) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export type HandleFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (args: HandleArgs<TLocals>) => Promise<Response> | Response;
```

#### `InvokeActionOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L33) `packages/sveltekit/src/invoke-action.ts`

```ts
export interface InvokeActionOptions<TResult = unknown> {
    readonly action: ActionFunction<TResult>;
    readonly url: string;
    readonly formData?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly locals?: Record<string, unknown>;
    readonly method?: string;
}
```

#### `InvokeActionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L42) `packages/sveltekit/src/invoke-action.ts`

```ts
export interface InvokeActionResult<TResult = unknown> {
    readonly result: TResult | undefined;
    readonly fail: SvelteKitFailSignal | null;
    readonly redirect: SvelteKitRedirectSignal | null;
    readonly error: unknown;
    readonly env: {
        readonly cookies: Map<string, string>;
    };
}
```

#### `InvokeHandleErrorOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L202) `packages/sveltekit/src/invoke-hooks.ts`

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

#### `InvokeHandleErrorResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L213) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export interface InvokeHandleErrorResult {
    readonly report: {
        message: string;
    } | void;
    readonly thrown: unknown;
}
```

#### `InvokeHandleFetchOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L147) `packages/sveltekit/src/invoke-hooks.ts`

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

#### `InvokeHandleFetchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L162) `packages/sveltekit/src/invoke-hooks.ts`

```ts
export interface InvokeHandleFetchResult {
    readonly response: Response;
    readonly downstreamCalled: boolean;
    readonly downstreamRequest: Request | null;
    readonly error: unknown;
}
```

#### `InvokeHandleOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L55) `packages/sveltekit/src/invoke-hooks.ts`

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

#### `InvokeHandleResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L72) `packages/sveltekit/src/invoke-hooks.ts`

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

#### `InvokeLoadOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L39) `packages/sveltekit/src/invoke-load.ts`

```ts
export interface InvokeLoadOptions<TResult = unknown> {
    readonly load: LoadFunction<TResult>;
    readonly url: string;
    readonly params?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly locals?: Record<string, unknown>;
    readonly fetch?: typeof globalThis.fetch;
}
```

#### `InvokeLoadResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L48) `packages/sveltekit/src/invoke-load.ts`

```ts
export interface InvokeLoadResult<TResult = unknown> {
    readonly data: TResult | undefined;
    readonly redirect: SvelteKitRedirectSignal | null;
    readonly error: SvelteKitErrorSignal | unknown;
    readonly env: {
        readonly responseHeaders: Map<string, string>;
        readonly cookies: Map<string, string>;
    };
}
```

#### `LoadFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L37) `packages/sveltekit/src/invoke-load.ts`

```ts
export type LoadFunction<TResult = unknown> = (event: SimulatedLoadEvent) => Promise<TResult> | TResult;
```

#### `RunHandleErrorOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L55) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface RunHandleErrorOptions {
    readonly error: unknown;
    readonly status: number;
    readonly message: string;
}
```

#### `RunHandleErrorResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L61) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface RunHandleErrorResult {
    readonly report: {
        message: string;
    } | void;
    readonly thrown: unknown;
}
```

#### `RunHandleFetchOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L41) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface RunHandleFetchOptions {
    readonly fetchUrl: string;
    readonly fetchMethod?: string;
    readonly fetchHeaders?: Record<string, string>;
    readonly downstreamFetch?: (req: Request) => Promise<Response>;
}
```

#### `RunHandleFetchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L48) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface RunHandleFetchResult {
    readonly response: Response;
    readonly downstreamCalled: boolean;
    readonly downstreamRequest: Request | null;
    readonly error: unknown;
}
```

#### `RunHandleResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L34) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface RunHandleResult<TLocals extends Record<string, unknown>> {
    readonly response: Response;
    readonly resolveCalled: boolean;
    readonly localsAtResolve: TLocals | null;
    readonly error: unknown;
}
```

#### `SetupSvelteKitHooksEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L23) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface SetupSvelteKitHooksEnvOptions<TLocals extends Record<string, unknown>> {
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly params?: Record<string, string>;
    readonly locals?: TLocals;
    readonly routeId?: string;
    readonly platform?: Record<string, unknown>;
}
```

#### `SimulatedActionEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L20) `packages/sveltekit/src/invoke-action.ts`

```ts
export interface SimulatedActionEvent {
    readonly request: Request;
    readonly cookies: {
        get(name: string): string | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string): void;
    };
    readonly locals: Record<string, unknown>;
    readonly url: URL;
}
```

#### `SimulatedHookRequestEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-hooks.ts#L11) `packages/sveltekit/src/invoke-hooks.ts`

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

#### `SimulatedLoadEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L23) `packages/sveltekit/src/invoke-load.ts`

```ts
export interface SimulatedLoadEvent {
    readonly url: URL;
    readonly params: Readonly<Record<string, string>>;
    readonly cookies: {
        get(name: string): string | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string): void;
        getAll(): Array<[string, string]>;
    };
    readonly fetch: typeof globalThis.fetch;
    readonly locals: Record<string, unknown>;
    setHeaders(headers: Record<string, string>): void;
}
```

#### `SvelteKitErrorSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L17) `packages/sveltekit/src/invoke-load.ts`

```ts
export interface SvelteKitErrorSignal {
    readonly [SK_ERROR_SYMBOL]: true;
    readonly status: number;
    readonly body: {
        readonly message: string;
    } | string;
}
```

#### `SvelteKitFailSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L14) `packages/sveltekit/src/invoke-action.ts`

```ts
export interface SvelteKitFailSignal {
    readonly [SK_FAIL_SYMBOL]: true;
    readonly status: number;
    readonly data: unknown;
}
```

#### `SvelteKitHooksEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L66) `packages/sveltekit/src/setup-hooks-env.ts`

```ts
export interface SvelteKitHooksEnv<TLocals extends Record<string, unknown>> {
    readonly cookies: Map<string, string>;
    readonly locals: TLocals;
    /** 現在の state で SimulatedHookRequestEvent を build (cookies / locals は共有参照) */
    buildEvent(): SimulatedHookRequestEvent<TLocals>;
    runHandle(handle: HandleFunction<TLocals>, resolveResponse?: Response | ((event: SimulatedHookRequestEvent<TLocals>) => Response | Promise<Response>)): Promise<RunHandleResult<TLocals>>;
    runHandleFetch(handleFetch: HandleFetchFunction<TLocals>, options: RunHandleFetchOptions): Promise<RunHandleFetchResult>;
    runHandleError(handleError: HandleErrorFunction<TLocals>, options: RunHandleErrorOptions): Promise<RunHandleErrorResult>;
    /** cookies / locals を初期 snapshot に戻す (同 env を別 test で再利用するため) */
    reset(): void;
}
```

#### `SvelteKitRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L11) `packages/sveltekit/src/invoke-load.ts`

```ts
export interface SvelteKitRedirectSignal {
    readonly [SK_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
}
```
<!-- kiwa-public-api:end -->
