---
title: "@kiwa-lab/graphql subscription の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/graphql</code> <code v-pre>subscription</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>subscribeSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L18) <code v-pre>packages/graphql/src/subscription.ts</code>

subscription mock。 real WebSocket transport は張らず、 resolver が返す AsyncIterable を そのまま purely-in-process で iterate する。 close を呼ぶまで active。

```ts
export declare function subscribeSubscription(server: GraphQLServer, query: string, variables?: GraphQLVariables, context?: GraphQLContext): SubscriptionHandle;
```

### 型

#### <code v-pre>SubscriptionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L4) <code v-pre>packages/graphql/src/subscription.ts</code>

```ts
export interface SubscriptionEvent {
    data?: Record<string, unknown> | null;
    errors?: {
        message: string;
    }[];
}
```

#### <code v-pre>SubscriptionHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L9) <code v-pre>packages/graphql/src/subscription.ts</code>

```ts
export interface SubscriptionHandle {
    events: AsyncIterable<SubscriptionEvent>;
    close: () => void;
}
```
