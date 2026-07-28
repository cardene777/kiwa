---
title: "@kiwa-lab/nuxt invoke-route-middleware の API 契約"
---

# <code v-pre>@kiwa-lab/nuxt</code> <code v-pre>invoke-route-middleware</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeRouteMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L113) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

Invoke a Nuxt 3 route middleware in isolation and capture its outcome. Return-value semantics mirror Nuxt: - `undefined` / `void` → continue navigation (no redirect, no abort) - `false` → abort silently - `string` → navigate to that path (synchronous return form) - thrown redirect/abort signal → captured into `redirect` / `abort`

```ts
export declare function invokeRouteMiddleware(opts: InvokeRouteMiddlewareOptions): Promise<InvokeRouteMiddlewareResult>;
```

#### <code v-pre>NUXT&#95;MIDDLEWARE&#95;ABORT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L12) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export declare const NUXT_MIDDLEWARE_ABORT_SYMBOL: unique symbol;
```

#### <code v-pre>NUXT&#95;MIDDLEWARE&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L11) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export declare const NUXT_MIDDLEWARE_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>InvokeRouteMiddlewareOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L62) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface InvokeRouteMiddlewareOptions {
    readonly middleware: RouteMiddlewareFunction;
    readonly to: RouteLocationInput;
    readonly from?: RouteLocationInput;
}
```

#### <code v-pre>InvokeRouteMiddlewareResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L68) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface InvokeRouteMiddlewareResult {
    readonly result: void | false | string | NuxtMiddlewareRedirectSignal;
    readonly redirect: NuxtMiddlewareRedirectSignal | null;
    readonly abort: NuxtMiddlewareAbortSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>MiddlewareNavigateOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L38) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface MiddlewareNavigateOptions {
    readonly external?: boolean;
    readonly replace?: boolean;
    readonly redirectCode?: number;
}
```

#### <code v-pre>NuxtMiddlewareAbortSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L22) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface NuxtMiddlewareAbortSignal {
    readonly [NUXT_MIDDLEWARE_ABORT_SYMBOL]: true;
    readonly message: string | undefined;
    readonly statusCode: number;
}
```

#### <code v-pre>NuxtMiddlewareRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L14) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface NuxtMiddlewareRedirectSignal {
    readonly [NUXT_MIDDLEWARE_REDIRECT_SYMBOL]: true;
    readonly to: string;
    readonly external: boolean;
    readonly replace: boolean;
    readonly status: number;
}
```

#### <code v-pre>RouteLocationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L53) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface RouteLocationInput {
    readonly path: string;
    readonly name?: string;
    readonly params?: Record<string, string>;
    readonly query?: Record<string, string | string[]>;
    readonly hash?: string;
    readonly meta?: Record<string, unknown>;
}
```

#### <code v-pre>RouteMiddlewareFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L44) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export type RouteMiddlewareFunction = (to: SimulatedRouteLocation, from: SimulatedRouteLocation, helpers: {
    navigateTo(target: string, options?: MiddlewareNavigateOptions): never;
    abortNavigation(message?: string, statusCode?: number): never;
}) => Promise<void | false | string | NuxtMiddlewareRedirectSignal> | void | false | string | NuxtMiddlewareRedirectSignal;
```

#### <code v-pre>SimulatedRouteLocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L28) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface SimulatedRouteLocation {
    readonly fullPath: string;
    readonly path: string;
    readonly name: string | undefined;
    readonly params: Readonly<Record<string, string>>;
    readonly query: Readonly<Record<string, string | string[]>>;
    readonly hash: string;
    readonly meta: Readonly<Record<string, unknown>>;
}
```
