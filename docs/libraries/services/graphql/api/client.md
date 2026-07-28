---
title: "@kiwa-lab/graphql client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/graphql</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createGraphQLClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L27) <code v-pre>packages/graphql/src/client.ts</code>

mock GraphQL client。 内部で server.executeQuery を叩くだけの thin wrapper だが、 client 側の呼出を独立に記録して urql / Relay 相当の caller inspection を可能にする。

```ts
export declare function createGraphQLClient(options: GraphQLClientOptions): GraphQLClient;
```

### 型

#### <code v-pre>GraphQLClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L15) <code v-pre>packages/graphql/src/client.ts</code>

```ts
export interface GraphQLClient {
    provider: GraphQLServer['provider'];
    query: (query: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult>;
    mutate: (mutation: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult>;
    listCalls: () => GraphQLClientCall[];
    clear: () => void;
}
```

#### <code v-pre>GraphQLClientCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L8) <code v-pre>packages/graphql/src/client.ts</code>

```ts
export interface GraphQLClientCall {
    method: 'query' | 'mutate' | 'subscribe';
    query: string;
    variables: GraphQLVariables;
    timestamp: number;
}
```

#### <code v-pre>GraphQLClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L3) <code v-pre>packages/graphql/src/client.ts</code>

```ts
export interface GraphQLClientOptions {
    server: GraphQLServer;
    defaultContext?: GraphQLContext;
}
```
