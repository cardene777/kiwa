---
title: "@kiwa-lab/go-lib env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/go-lib</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createGoAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L48) <code v-pre>packages/go-lib/src/env.ts</code>

gin/echo/fiber/chi の mock env を生成。 route 一覧の宣言 + reset で 4 framework 共通で router state を扱えるようにする。

```ts
export declare function createGoAppEnv(options: CreateGoAppEnvOptions): GoAppEnv;
```

### 型

#### <code v-pre>GoAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L31) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoAppEnv {
    framework: GoFramework;
    routes: GoRouteDefinition[];
    addRoute: (route: GoRouteDefinition) => void;
    listRoutes: () => GoRouteDefinition[];
    reset: () => void;
}
```

#### <code v-pre>GoFramework</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L1) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export type GoFramework = 'gin' | 'echo' | 'fiber' | 'chi';
```

#### <code v-pre>GoMiddlewareTraceEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L25) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoMiddlewareTraceEntry {
    name: string;
    order: number;
    ranAt: number;
}
```

#### <code v-pre>GoRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L3) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoRequest {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
}
```

#### <code v-pre>GoResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L12) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoResponse {
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
    framework: GoFramework;
}
```

#### <code v-pre>GoRouteDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L19) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoRouteDefinition {
    method: string;
    path: string;
    handlerName: string;
}
```
