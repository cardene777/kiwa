---
title: "@kiwa-lab/nextjs invoke-middleware の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>invoke-middleware</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L120) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

Invoke a middleware function in isolation and capture its outgoing response shape + headers + cookies. Mirrors the kiwa style of invokeServerAction: no globals, no real Next.js runtime.

```ts
export declare function invokeMiddleware(opts: InvokeMiddlewareOptions): Promise<InvokeMiddlewareResult>;
```

#### <code v-pre>MIDDLEWARE&#95;ACTION&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L15) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export declare const MIDDLEWARE_ACTION_SYMBOL: unique symbol;
```

#### <code v-pre>middlewareActions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L100) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

Helpers your `middleware.ts` returns instead of constructing NextResponse directly. Keep the production code shape close by re-exporting these from a shared module; the helper expects the returned value to be a MiddlewareAction shaped object.

```ts
export declare const middlewareActions: {
    next(): MiddlewareAction;
    redirect(url: string, status?: number): MiddlewareAction;
    rewrite(url: string): MiddlewareAction;
    json(body: unknown, status?: number): MiddlewareAction;
};
```

### 型

#### <code v-pre>InvokeMiddlewareOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L55) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface InvokeMiddlewareOptions {
    readonly middleware: MiddlewareFunction;
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly geo?: {
        readonly country?: string;
        readonly region?: string;
        readonly city?: string;
    };
}
```

#### <code v-pre>InvokeMiddlewareResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L68) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface InvokeMiddlewareResult {
    readonly env: MiddlewareEnv;
    readonly error: unknown;
}
```

#### <code v-pre>MiddlewareAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L19) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface MiddlewareAction {
    readonly [MIDDLEWARE_ACTION_SYMBOL]: true;
    readonly kind: MiddlewareActionKind;
    readonly url?: string;
    readonly body?: unknown;
    readonly status?: number;
}
```

#### <code v-pre>MiddlewareActionKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L17) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export type MiddlewareActionKind = 'next' | 'redirect' | 'rewrite' | 'json' | 'noop';
```

#### <code v-pre>MiddlewareEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L44) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface MiddlewareEnv {
    readonly responseHeaders: Map<string, string>;
    readonly responseCookies: Map<string, string>;
    readonly action: MiddlewareAction;
}
```

#### <code v-pre>MiddlewareFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L50) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export type MiddlewareFunction = (req: MiddlewareRequest, env: {
    setHeader: (name: string, value: string) => void;
    setCookie: (name: string, value: string) => void;
}) => MiddlewareAction | Promise<MiddlewareAction>;
```

#### <code v-pre>MiddlewareRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L27) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface MiddlewareRequest {
    readonly url: string;
    readonly method: string;
    readonly headers: ReadonlyMap<string, string>;
    readonly cookies: ReadonlyMap<string, string>;
    readonly nextUrl: {
        readonly pathname: string;
        readonly search: string;
        readonly searchParams: URLSearchParams;
    };
    readonly geo: {
        readonly country?: string;
        readonly region?: string;
        readonly city?: string;
    };
}
```
