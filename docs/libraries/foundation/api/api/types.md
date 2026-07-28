---
title: "@kiwa-lab/api types の API 契約"
---

# <code v-pre>@kiwa-lab/api</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>ApiHandlerSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L3) <code v-pre>packages/api/src/types.ts</code>

```ts
export type ApiHandlerSource = {
    kind: 'fetch';
    handler: (req: Request) => Promise<Response> | Response;
} | {
    kind: 'node';
    handler: NodeRequestHandler;
};
```

#### <code v-pre>ApiRequestClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L45) <code v-pre>packages/api/src/types.ts</code>

```ts
export interface ApiRequestClient {
    get: (path: string, init?: RequestInit) => Promise<ApiResponseSnapshot>;
    post: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
    put: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
    patch: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
    delete: (path: string, init?: RequestInit) => Promise<ApiResponseSnapshot>;
}
```

#### <code v-pre>ApiResponseSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L53) <code v-pre>packages/api/src/types.ts</code>

```ts
export interface ApiResponseSnapshot {
    status: number;
    headers: Record<string, string>;
    bodyText: string;
    json: <T = unknown>() => T;
}
```

#### <code v-pre>ApiTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L43) <code v-pre>packages/api/src/types.ts</code>

```ts
export type ApiTestEnv = MockTestEnvApi | LiveTestEnvApi | HybridTestEnvApi;
```

#### <code v-pre>HybridTestEnvApi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L37) <code v-pre>packages/api/src/types.ts</code>

```ts
export interface HybridTestEnvApi extends TestEnvBase<'hybrid'> {
    baseUrl: string;
    request: ApiRequestClient;
    mocks: {
        reset: () => void;
    };
}
```

#### <code v-pre>LiveTestEnvApi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L32) <code v-pre>packages/api/src/types.ts</code>

```ts
export interface LiveTestEnvApi extends TestEnvBase<'live'> {
    baseUrl: string;
    request: ApiRequestClient;
}
```

#### <code v-pre>MockHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L12) <code v-pre>packages/api/src/types.ts</code>

```ts
export type MockHandler = unknown;
```

#### <code v-pre>MockTestEnvApi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L26) <code v-pre>packages/api/src/types.ts</code>

```ts
export interface MockTestEnvApi extends TestEnvBase<'mock'> {
    baseUrl: string;
    request: ApiRequestClient;
    mocks: {
        reset: () => void;
    };
}
```

#### <code v-pre>NodeRequestHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L7) <code v-pre>packages/api/src/types.ts</code>

```ts
export type NodeRequestHandler = (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void>;
```

#### <code v-pre>SetupApiServerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L14) <code v-pre>packages/api/src/types.ts</code>

```ts
export interface SetupApiServerOptions<TMode extends TestMode = TestMode> {
    mode: TMode;
    /** msw v2 RequestHandler[] (mode = "mock" / "hybrid") */
    mockHandlers?: MockHandler[];
    /** Live HTTP handler (mode = "live" / "hybrid") */
    app?: ApiHandlerSource | NodeRequestHandler;
    /** Optional base URL applied to issued requests */
    baseUrl?: string;
    /** Optional headers applied to every request */
    defaultHeaders?: Record<string, string>;
}
```
