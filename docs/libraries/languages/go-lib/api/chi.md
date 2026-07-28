---
title: "@kiwa-lab/go-lib chi の API 契約"
---

# <code v-pre>@kiwa-lab/go-lib</code> <code v-pre>chi</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureChiRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L72) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export declare function captureChiRoute(options: CaptureChiRouteOptions): Promise<CaptureChiRouteResult>;
```

### 型

#### <code v-pre>CaptureChiRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L14) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export interface CaptureChiRouteOptions {
    app: ChiApp;
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
```

#### <code v-pre>CaptureChiRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L23) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export interface CaptureChiRouteResult extends GoResponse {
    matched: boolean;
    middlewareTrace: GoMiddlewareTraceEntry[];
    matchedPattern?: string;
}
```

#### <code v-pre>ChiApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L6) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export interface ChiApp {
    routes: Map<string, {
        method: string;
        pattern: string;
        handler: ChiHandler;
    }>;
    middlewares: Array<{
        name: string;
        fn: ChiMiddleware;
    }>;
    addRoute: (method: string, pattern: string, handler: ChiHandler) => void;
    use: (name: string, fn: ChiMiddleware) => void;
    match: (method: string, path: string) => {
        pattern: string;
        handler: ChiHandler;
        params: Record<string, string>;
    } | null;
}
```

#### <code v-pre>ChiHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L3) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export type ChiHandler = (req: GoRequest) => {
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
} | Promise<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
}>;
```

#### <code v-pre>ChiMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L4) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export type ChiMiddleware = (name: string, next: () => void | Promise<void>) => void | Promise<void>;
```
