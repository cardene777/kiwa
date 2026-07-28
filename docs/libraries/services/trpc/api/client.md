---
title: "@kiwa-lab/trpc client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/trpc</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/client.ts#L17) <code v-pre>packages/trpc/src/client.ts</code>

tRPC の createTRPCProxyClient 相当。 client.&lt;path&gt;.query(input) / .mutate(input) を呼ぶと 内部で invokeProcedure に translate される。 real tRPC の typed client と同じ shape の assertion が書ける。

```ts
export declare function createClient(router: Router): TypedClient;
```

### 型

#### <code v-pre>TypedClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/client.ts#L4) <code v-pre>packages/trpc/src/client.ts</code>

```ts
export interface TypedClient {
    [path: string]: {
        query: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
        mutate: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
        subscribe: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
    };
}
```
