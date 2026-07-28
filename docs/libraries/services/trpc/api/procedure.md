---
title: "@kiwa-lab/trpc procedure の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/trpc</code> <code v-pre>procedure</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>defineProcedure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L22) <code v-pre>packages/trpc/src/procedure.ts</code>

tRPC v10 の t.procedure.query(handler) / .mutation(handler) / .subscription(handler) 相当。 middleware 配列を挟めるようにして、 procedure 単位で auth / logging を宣言する pattern を 再現する。

```ts
export declare function defineProcedure<TInput = unknown, TOutput = unknown>(type: ProcedureType, handler: ProcedureHandler<TInput, TOutput>, middlewares?: Middleware[]): ProcedureDefinition<TInput, TOutput>;
```

### 型

#### <code v-pre>ProcedureDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L11) <code v-pre>packages/trpc/src/procedure.ts</code>

```ts
export interface ProcedureDefinition<TInput = unknown, TOutput = unknown> {
    type: ProcedureType;
    handler: ProcedureHandler<TInput, TOutput>;
    middlewares: Middleware[];
}
```

#### <code v-pre>ProcedureHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L6) <code v-pre>packages/trpc/src/procedure.ts</code>

```ts
export type ProcedureHandler<TInput = unknown, TOutput = unknown> = (params: {
    input: TInput;
    ctx: ProcedureContext;
}) => Promise<TOutput> | TOutput;
```

#### <code v-pre>ProcedureType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L4) <code v-pre>packages/trpc/src/procedure.ts</code>

```ts
export type ProcedureType = 'query' | 'mutation' | 'subscription';
```
