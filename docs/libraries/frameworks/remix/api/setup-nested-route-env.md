---
title: "@kiwa-lab/remix setup-nested-route-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/remix</code> <code v-pre>setup-nested-route-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>defer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L423) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export declare function defer<TData extends Record<string, unknown>>(data: TData, init?: ResponseInit): DeferredData<TData>;
```

#### <code v-pre>DEFERRED&#95;DATA&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L415) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

defer() 互換 — `Record&lt;string, T | Promise&lt;T&gt;&gt;` を返す helper。 Remix 公式 `defer()` の TypedDeferredData と異なり、 kiwa は real Promise をそのまま保持し、 `resolveDeferred()` で deterministic に全 Promise を await する。

```ts
export declare const DEFERRED_DATA_SYMBOL: unique symbol;
```

#### <code v-pre>isDeferred</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L432) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export declare function isDeferred(value: unknown): value is DeferredData<Record<string, unknown>>;
```

#### <code v-pre>resolveDeferred</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L448) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

defer() の値を全て deterministic に await。 settled Promise (resolved / rejected) を一括追跡、 errors map で個別 rejection を assertion 可能。 pendingKeys は 起動時に既に Promise だった key (= 「streaming で resolve した」 key) を保持する。

```ts
export declare function resolveDeferred<TData extends Record<string, unknown>>(deferred: DeferredData<TData>): Promise<ResolveDeferredResult<TData>>;
```

#### <code v-pre>setupRemixNestedRouteEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L321) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export declare function setupRemixNestedRouteEnv(options: SetupRemixNestedRouteEnvOptions): RemixNestedRouteEnv;
```

### 型

#### <code v-pre>DeferredData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L417) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface DeferredData<TData extends Record<string, unknown>> {
    readonly [DEFERRED_DATA_SYMBOL]: true;
    readonly data: TData;
    readonly init?: ResponseInit;
}
```

#### <code v-pre>RemixNestedRouteDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L36) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RemixNestedRouteDefinition<TResult = unknown> {
    readonly id: string;
    readonly loader?: LoaderFunction<TResult>;
    readonly headers?: RemixNestedRouteHeadersFunction;
}
```

#### <code v-pre>RemixNestedRouteEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L62) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RemixNestedRouteEnv {
    readonly cookies: Map<string, string>;
    /** parent → child loader chain を 1 request で順次 invoke、 child は parent の result を context.parentData として受け取る */
    runLoaderChain(): Promise<RunLoaderChainResult>;
    /** cookies / locals を初期 snapshot に戻す (同 env を別 test で再利用するため) */
    reset(): void;
}
```

#### <code v-pre>RemixNestedRouteHeadersArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L25) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RemixNestedRouteHeadersArgs {
    readonly loaderHeaders: Headers;
    readonly parentHeaders: Headers;
    readonly actionHeaders: Headers;
    readonly errorHeaders?: Headers | undefined;
}
```

#### <code v-pre>RemixNestedRouteHeadersFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L32) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export type RemixNestedRouteHeadersFunction = ((args: RemixNestedRouteHeadersArgs) => HeadersInit) | HeadersInit;
```

#### <code v-pre>ResolveDeferredResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L436) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface ResolveDeferredResult<TData extends Record<string, unknown>> {
    readonly resolved: {
        [K in keyof TData]: Awaited<TData[K]>;
    };
    readonly pendingKeys: ReadonlyArray<keyof TData>;
    readonly errors: {
        readonly [K in keyof TData]?: unknown;
    };
    readonly init?: ResponseInit;
}
```

#### <code v-pre>RunLoaderChainResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L53) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RunLoaderChainResult {
    readonly parent: InvokeRouteResult;
    readonly child: InvokeRouteResult;
    readonly parentLoaderHeaders: Headers;
    readonly childLoaderHeaders: Headers;
    readonly mergedHeaders: Headers;
    readonly cookies: Map<string, string>;
}
```

#### <code v-pre>SetupRemixNestedRouteEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L42) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface SetupRemixNestedRouteEnvOptions {
    readonly parentRoute: RemixNestedRouteDefinition;
    readonly childRoute: RemixNestedRouteDefinition;
    readonly url: string;
    readonly params?: Record<string, string>;
    readonly context?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly method?: string;
}
```
