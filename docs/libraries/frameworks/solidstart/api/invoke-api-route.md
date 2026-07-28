---
title: "@kiwa-lab/solidstart invoke-api-route の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/solidstart</code> <code v-pre>invoke-api-route</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeApiRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L61) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export declare function invokeApiRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(opts: InvokeApiRouteOptions<TParams>): Promise<InvokeApiRouteResult>;
```

#### <code v-pre>json</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L95) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export declare function json<T>(body: T, init?: ResponseInit): Response;
```

#### <code v-pre>redirectResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L101) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export declare function redirectResponse(location: string, status?: number): Response;
```

### 型

#### <code v-pre>APIRouteHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L15) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export type APIRouteHandler<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (event: SimulatedAPIEvent<TParams>) => Promise<Response> | Response;
```

#### <code v-pre>InvokeApiRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L19) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export interface InvokeApiRouteOptions<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly handler: APIRouteHandler<TParams>;
    readonly url: string;
    readonly method?: string;
    readonly params?: TParams;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
    readonly locals?: Record<string, unknown>;
}
```

#### <code v-pre>InvokeApiRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L30) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export interface InvokeApiRouteResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
}
```

#### <code v-pre>SimulatedAPIEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L8) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export interface SimulatedAPIEvent<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly request: Request;
    readonly params: TParams;
    readonly locals: Record<string, unknown>;
    readonly nativeEvent: Record<string, unknown>;
}
```
