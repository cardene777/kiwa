---
title: "@kiwa-lab/graphql server の API 契約"
---

# <code v-pre>@kiwa-lab/graphql</code> <code v-pre>server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createGraphQLServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L67) <code v-pre>packages/graphql/src/server.ts</code>

schema + resolvers を受け取って mock GraphQL server を作る。 executeQuery で query / mutation を dispatch し、 対応する resolver を呼出、 結果を data / errors 形式で返す。 subscription は subscribeSubscription 経由で呼出 (別 module)。

```ts
export declare function createGraphQLServer(schema: GraphQLSchemaDef, resolvers: GraphQLResolvers, options?: CreateGraphQLServerOptions): GraphQLServer;
```

#### <code v-pre>executeQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L97) <code v-pre>packages/graphql/src/server.ts</code>

mock server 経由で GraphQL query / mutation を実行する。 parser で operation を分解し、 対応する resolver を selection ごとに呼出、 data を組み立てる。 subscription は subscribeSubscription 経由で呼出。

```ts
export declare function executeQuery(server: GraphQLServer, query: string, variables?: GraphQLVariables, context?: GraphQLContext, onCall?: (call: GraphQLServerCall) => void, now?: () => number): Promise<GraphQLExecutionResult>;
```

### 型

#### <code v-pre>GraphQLContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L6) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export type GraphQLContext = Record<string, unknown>;
```

#### <code v-pre>GraphQLError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L8) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export interface GraphQLError {
    message: string;
    path?: (string | number)[];
    extensions?: Record<string, unknown>;
}
```

#### <code v-pre>GraphQLExecutionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L14) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export interface GraphQLExecutionResult {
    data?: Record<string, unknown> | null;
    errors?: GraphQLError[];
    extensions?: Record<string, unknown>;
}
```

#### <code v-pre>GraphQLProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L3) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export type GraphQLProvider = 'apollo' | 'yoga' | 'urql' | 'relay';
```

#### <code v-pre>GraphQLResolvers</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L25) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export interface GraphQLResolvers {
    Query?: Record<string, GraphQLResolverFn>;
    Mutation?: Record<string, GraphQLResolverFn>;
    Subscription?: Record<string, (args: Record<string, unknown>, context: GraphQLContext) => AsyncIterable<unknown>>;
}
```

#### <code v-pre>GraphQLSchemaDef</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L31) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export interface GraphQLSchemaDef {
    typeDefs: string;
}
```

#### <code v-pre>GraphQLServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L44) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export interface GraphQLServer {
    provider: GraphQLProvider;
    schema: GraphQLSchemaDef;
    resolvers: GraphQLResolvers;
    executeQuery: (query: string, variables?: GraphQLVariables, context?: GraphQLContext) => Promise<GraphQLExecutionResult>;
    listCalls: () => GraphQLServerCall[];
    clear: () => void;
}
```

#### <code v-pre>GraphQLServerCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L35) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export interface GraphQLServerCall {
    operationType: 'query' | 'mutation' | 'subscription';
    operationName?: string;
    query: string;
    variables: GraphQLVariables;
    status: 'ok' | 'error';
    timestamp: number;
}
```

#### <code v-pre>GraphQLVariables</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L5) <code v-pre>packages/graphql/src/server.ts</code>

```ts
export type GraphQLVariables = Record<string, string | number | boolean | null>;
```
