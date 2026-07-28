---
title: "@kiwa-lab/trpc middleware の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/trpc</code> <code v-pre>middleware</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>middleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L38) <code v-pre>packages/trpc/src/middleware.ts</code>

middleware wrapper。 実 tRPC の t.middleware(async ({ ctx, next }) =&gt; ...) と同じ形。 内部で next() を呼ぶことで chain 継続、 呼ばずに throw で早期 abort を表現する。

```ts
export declare function middleware(fn: Middleware): Middleware;
```

#### <code v-pre>TRPCError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L25) <code v-pre>packages/trpc/src/middleware.ts</code>

```ts
export declare class TRPCError extends Error {
    code: TRPCErrorCode;
    constructor(params: {
        code: TRPCErrorCode;
        message?: string;
    });
}
```

### 型

#### <code v-pre>Middleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L16) <code v-pre>packages/trpc/src/middleware.ts</code>

```ts
export type Middleware = (params: MiddlewareParams) => Promise<MiddlewareResult>;
```

#### <code v-pre>MiddlewareParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L3) <code v-pre>packages/trpc/src/middleware.ts</code>

```ts
export interface MiddlewareParams {
    ctx: ProcedureContext;
    input: unknown;
    path: string;
    next: (params?: {
        ctx?: ProcedureContext;
    }) => Promise<MiddlewareResult>;
}
```

#### <code v-pre>MiddlewareResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L10) <code v-pre>packages/trpc/src/middleware.ts</code>

```ts
export interface MiddlewareResult {
    ok: boolean;
    data?: unknown;
    error?: TRPCError;
}
```

#### <code v-pre>TRPCErrorCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L18) <code v-pre>packages/trpc/src/middleware.ts</code>

```ts
export type TRPCErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR';
```
