---
title: "@kiwa-lab/query subscription の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/query</code> <code v-pre>subscription</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>subscribeToQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts#L14) <code v-pre>packages/query/src/subscription.ts</code>

key に state 変更を subscribe。 fetchQuery / invalidateQuery が触ると listener に通知。 SWR の subscribe / TanStack Query の queryClient.getQueryCache().subscribe 相当。

```ts
export declare function subscribeToQuery(client: QueryClient, key: QueryKey, listener: QueryListener): Subscription;
```

### 型

#### <code v-pre>QueryListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts#L3) <code v-pre>packages/query/src/subscription.ts</code>

```ts
export type QueryListener = (state: QueryState) => void;
```

#### <code v-pre>Subscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts#L5) <code v-pre>packages/query/src/subscription.ts</code>

```ts
export interface Subscription {
    unsubscribe: () => void;
    key: string;
}
```
