---
title: "@kiwa-lab/sveltekit setup-hooks-env の API 契約"
---

# <code v-pre>@kiwa-lab/sveltekit</code> <code v-pre>setup-hooks-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sequence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L201) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

sequence — SvelteKit 公式 `sequence(...handlers)` 相当の handle chain composer。 sequence(h1, h2) は h1 の resolve として h2 を渡し、 h2 の resolve として 最終の resolve を渡す。 結果として h1-before → h2-before → resolve → h2-after → h1-after の順で実行される。 引数なし時は no-op (resolve(event) を直接呼ぶ)。

```ts
export declare function sequence<TLocals extends Record<string, unknown> = Record<string, unknown>>(...handles: HandleFunction<TLocals>[]): HandleFunction<TLocals>;
```

#### <code v-pre>setupSvelteKitHooksEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L83) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

```ts
export declare function setupSvelteKitHooksEnv<TLocals extends Record<string, unknown> = Record<string, unknown>>(options: SetupSvelteKitHooksEnvOptions<TLocals>): SvelteKitHooksEnv<TLocals>;
```

### 型

#### <code v-pre>RunHandleErrorOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L55) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

```ts
export interface RunHandleErrorOptions {
    readonly error: unknown;
    readonly status: number;
    readonly message: string;
}
```

#### <code v-pre>RunHandleErrorResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L61) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

```ts
export interface RunHandleErrorResult {
    readonly report: {
        message: string;
    } | void;
    readonly thrown: unknown;
}
```

#### <code v-pre>RunHandleFetchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L41) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

```ts
export interface RunHandleFetchOptions {
    readonly fetchUrl: string;
    readonly fetchMethod?: string;
    readonly fetchHeaders?: Record<string, string>;
    readonly downstreamFetch?: (req: Request) => Promise<Response>;
}
```

#### <code v-pre>RunHandleFetchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L48) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

```ts
export interface RunHandleFetchResult {
    readonly response: Response;
    readonly downstreamCalled: boolean;
    readonly downstreamRequest: Request | null;
    readonly error: unknown;
}
```

#### <code v-pre>RunHandleResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L34) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

```ts
export interface RunHandleResult<TLocals extends Record<string, unknown>> {
    readonly response: Response;
    readonly resolveCalled: boolean;
    readonly localsAtResolve: TLocals | null;
    readonly error: unknown;
}
```

#### <code v-pre>SetupSvelteKitHooksEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L23) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

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

#### <code v-pre>SvelteKitHooksEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/setup-hooks-env.ts#L66) <code v-pre>packages/sveltekit/src/setup-hooks-env.ts</code>

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
