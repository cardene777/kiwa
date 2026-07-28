---
title: "@kiwa-lab/qwikcity invoke-route-loader の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/qwikcity</code> <code v-pre>invoke-route-loader</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeRouteLoader</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L48) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export declare function invokeRouteLoader<TParams extends Record<string, string> = Record<string, string>, TResult = unknown>(opts: InvokeRouteLoaderOptions<TParams, TResult>): Promise<InvokeRouteLoaderResult<TResult>>;
```

### 型

#### <code v-pre>InvokeRouteLoaderOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L29) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export interface InvokeRouteLoaderOptions<TParams extends Record<string, string>, TResult> {
    readonly loader: RouteLoaderFunction<TParams, TResult>;
    readonly url: string;
    readonly params?: TParams;
    readonly cookies?: Record<string, string>;
    readonly headers?: Record<string, string>;
    readonly platform?: Record<string, unknown>;
}
```

#### <code v-pre>InvokeRouteLoaderResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L38) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export interface InvokeRouteLoaderResult<TResult> {
    readonly data: TResult | undefined;
    readonly redirect: QwikRedirectSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>RouteLoaderFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L25) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export type RouteLoaderFunction<TParams extends Record<string, string> = Record<string, string>, TResult = unknown> = (event: SimulatedLoaderEvent<TParams>) => Promise<TResult> | TResult;
```

#### <code v-pre>SimulatedLoaderEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L13) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export interface SimulatedLoaderEvent<TParams extends Record<string, string> = Record<string, string>> {
    readonly url: URL;
    readonly params: TParams;
    readonly query: URLSearchParams;
    readonly cookie: {
        get(name: string): {
            value: string;
        } | null;
    };
    readonly headers: ReadonlyMap<string, string>;
    readonly platform: Record<string, unknown>;
    redirect(status: number, location: string): never;
}
```
