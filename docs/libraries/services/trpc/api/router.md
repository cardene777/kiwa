---
title: "@kiwa-lab/trpc router の API 契約"
---

# <code v-pre>@kiwa-lab/trpc</code> <code v-pre>router</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRouter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L24) <code v-pre>packages/trpc/src/router.ts</code>

tRPC v10 の router() 相当。 path (dot-notation もフラット key もサポート) と procedure の map を保持する。 globalMiddlewares は全 procedure 呼出前に走らせる。

```ts
export declare function createRouter(options: CreateRouterOptions): Router;
```

#### <code v-pre>invokeProcedure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L35) <code v-pre>packages/trpc/src/router.ts</code>

router に対して procedure を実行。 middleware chain (global → per-procedure) を順に走らせ、 全 middleware 通過後に handler を呼び出す。 途中 throw で TRPCError を包んで返す。

```ts
export declare function invokeProcedure(router: Router, path: string, input: unknown, ctx?: ProcedureContext): Promise<unknown>;
```

### 型

#### <code v-pre>CreateRouterOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L15) <code v-pre>packages/trpc/src/router.ts</code>

```ts
export interface CreateRouterOptions {
    procedures: Record<string, ProcedureDefinition>;
    middlewares?: Middleware[];
}
```

#### <code v-pre>Router</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L10) <code v-pre>packages/trpc/src/router.ts</code>

```ts
export interface Router {
    procedures: Record<string, ProcedureDefinition>;
    globalMiddlewares: Middleware[];
}
```
