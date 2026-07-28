---
title: "@kiwa-lab/astro invoke-endpoint の API 契約"
---

# <code v-pre>@kiwa-lab/astro</code> <code v-pre>invoke-endpoint</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L89) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export declare function invokeEndpoint<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(opts: InvokeEndpointOptions<TParams>): Promise<InvokeEndpointResult>;
```

### 型

#### <code v-pre>APIRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L28) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export type APIRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (context: SimulatedAPIContext<TParams>) => Promise<Response> | Response;
```

#### <code v-pre>InvokeEndpointOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L32) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export interface InvokeEndpointOptions<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly endpoint: APIRoute<TParams>;
    readonly url: string;
    readonly method?: string;
    readonly params?: TParams;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
    readonly locals?: Record<string, unknown>;
    readonly site?: string;
}
```

#### <code v-pre>InvokeEndpointResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L45) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export interface InvokeEndpointResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
}
```

#### <code v-pre>SimulatedAPIContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L13) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export interface SimulatedAPIContext<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly request: Request;
    readonly params: TParams;
    readonly cookies: {
        get(name: string): {
            value: string;
        } | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string, options?: Record<string, unknown>): void;
        has(name: string): boolean;
    };
    readonly url: URL;
    readonly site: URL | undefined;
    readonly locals: Record<string, unknown>;
    redirect(path: string, status?: number): Response;
}
```
