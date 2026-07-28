# qwikcity リファレンス

## route action

`invokeRouteAction` は action、formValues、URL、cookies、headers を受け取ります。結果は `result`、`fail`、`redirect`、`error`、更新後の `env` を持ちます。

| action の結果 | helper の結果 |
| --- | --- |
| 通常の値 | `result` |
| `event.fail` の戻り値 | `fail` |
| `event.redirect` | `redirect` |
| その他の例外 | `error` |

## route loader

`invokeRouteLoader` は absolute URL が必要です。event には URL、params、URLSearchParams、read-only cookie、headers、platform、redirect があります。結果は data、redirect、error です。

## endpoint

`invokeEndpoint` は handler と URL を受け取ります。event の `json` と `text` は response kind と body を記録します。`status` と `setHeader` は後から response に反映されます。

| body の指定 | 既定 method |
| --- | --- |
| なし | GET |
| formData | POST |
| jsonBody | POST |

response headers は小文字の Map です。Endpoint の redirect signal と通常の exception は response の status に変換されず、各々 `redirect` と `error` に入ります。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>invokeEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L85) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export declare function invokeEndpoint<TParams extends Record<string, string> = Record<string, string>>(opts: InvokeEndpointOptions<TParams>): Promise<InvokeEndpointResult>;
```

#### <code v-pre>invokeRouteAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L67) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export declare function invokeRouteAction<TFormValues extends Record<string, unknown> = Record<string, unknown>, TResult = unknown>(opts: InvokeRouteActionOptions<TFormValues, TResult>): Promise<InvokeRouteActionResult<TResult>>;
```

#### <code v-pre>invokeRouteLoader</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L48) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export declare function invokeRouteLoader<TParams extends Record<string, string> = Record<string, string>, TResult = unknown>(opts: InvokeRouteLoaderOptions<TParams, TResult>): Promise<InvokeRouteLoaderResult<TResult>>;
```

#### <code v-pre>QWIK&#95;ENDPOINT&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L8) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export declare const QWIK_ENDPOINT_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>QWIK&#95;FAIL&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L9) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export declare const QWIK_FAIL_SYMBOL: unique symbol;
```

#### <code v-pre>QWIK&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L10) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export declare const QWIK_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>EndpointHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L35) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export type EndpointHandler<TParams extends Record<string, string> = Record<string, string>> = (event: SimulatedRequestEvent<TParams>) => Promise<void> | void;
```

#### <code v-pre>EndpointResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L16) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export interface EndpointResponse<T = unknown> {
    readonly kind: 'json' | 'text' | 'noop';
    readonly status: number;
    readonly body?: T;
    readonly headers: Map<string, string>;
}
```

#### <code v-pre>InvokeEndpointOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L39) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export interface InvokeEndpointOptions<TParams extends Record<string, string> = Record<string, string>> {
    readonly handler: EndpointHandler<TParams>;
    readonly url: string;
    readonly method?: string;
    readonly params?: TParams;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
}
```

#### <code v-pre>InvokeEndpointResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L49) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export interface InvokeEndpointResult {
    readonly response: EndpointResponse;
    readonly redirect: QwikEndpointRedirectSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>InvokeRouteActionOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L41) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface InvokeRouteActionOptions<TFormValues extends Record<string, unknown>, TResult> {
    readonly action: RouteActionFunction<TFormValues, TResult>;
    readonly formValues: TFormValues;
    readonly url?: string;
    readonly cookies?: Record<string, string>;
    readonly headers?: Record<string, string>;
}
```

#### <code v-pre>InvokeRouteActionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L49) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface InvokeRouteActionResult<TResult> {
    readonly result: TResult | undefined;
    readonly fail: QwikFailSignal | null;
    readonly redirect: QwikRedirectSignal | null;
    readonly error: unknown;
    readonly env: {
        readonly cookies: Map<string, string>;
        readonly requestHeaders: Map<string, string>;
    };
}
```

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

#### <code v-pre>QwikEndpointRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L10) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export interface QwikEndpointRedirectSignal {
    readonly [QWIK_ENDPOINT_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
}
```

#### <code v-pre>QwikFailSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L12) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface QwikFailSignal {
    readonly [QWIK_FAIL_SYMBOL]: true;
    readonly status: number;
    readonly data: unknown;
}
```

#### <code v-pre>QwikRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L18) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface QwikRedirectSignal {
    readonly [QWIK_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
}
```

#### <code v-pre>RouteActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L36) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export type RouteActionFunction<TFormValues extends Record<string, unknown> = Record<string, unknown>, TResult = unknown> = (formValues: TFormValues, event: SimulatedActionEvent) => Promise<TResult | QwikFailSignal> | TResult | QwikFailSignal;
```

#### <code v-pre>RouteLoaderFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-loader.ts#L25) <code v-pre>packages/qwikcity/src/invoke-route-loader.ts</code>

```ts
export type RouteLoaderFunction<TParams extends Record<string, string> = Record<string, string>, TResult = unknown> = (event: SimulatedLoaderEvent<TParams>) => Promise<TResult> | TResult;
```

#### <code v-pre>SimulatedActionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L24) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface SimulatedActionEvent {
    readonly url: URL;
    readonly cookie: {
        get(name: string): {
            value: string;
        } | null;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string, options?: Record<string, unknown>): void;
    };
    readonly headers: ReadonlyMap<string, string>;
    fail<T>(status: number, data: T): QwikFailSignal;
    redirect(status: number, location: string): never;
}
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

#### <code v-pre>SimulatedRequestEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L23) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export interface SimulatedRequestEvent<TParams extends Record<string, string> = Record<string, string>> {
    readonly request: Request;
    readonly params: TParams;
    readonly url: URL;
    readonly headers: ReadonlyMap<string, string>;
    json<T>(status: number, body: T): void;
    text(status: number, body: string): void;
    redirect(status: number, location: string): never;
    status(code: number): void;
    setHeader(name: string, value: string): void;
}
```
<!-- kiwa-public-api:end -->
