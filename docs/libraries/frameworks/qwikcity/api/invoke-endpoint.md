---
title: "@kiwa-lab/qwikcity invoke-endpoint の API 契約"
---

# <code v-pre>@kiwa-lab/qwikcity</code> <code v-pre>invoke-endpoint</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L85) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export declare function invokeEndpoint<TParams extends Record<string, string> = Record<string, string>>(opts: InvokeEndpointOptions<TParams>): Promise<InvokeEndpointResult>;
```

#### <code v-pre>QWIK&#95;ENDPOINT&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L8) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export declare const QWIK_ENDPOINT_REDIRECT_SYMBOL: unique symbol;
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

#### <code v-pre>QwikEndpointRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-endpoint.ts#L10) <code v-pre>packages/qwikcity/src/invoke-endpoint.ts</code>

```ts
export interface QwikEndpointRedirectSignal {
    readonly [QWIK_ENDPOINT_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
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
