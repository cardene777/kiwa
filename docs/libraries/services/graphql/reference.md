# @kiwa-lab/graphql リファレンス

## server

`createGraphQLServer(schema, resolvers, options)` は provider、schema、resolver、call log を持つ server を返します。provider の既定値は `apollo`、時刻の既定値はゼロです。

`executeQuery(query, variables, context)` は query または mutation を実行します。各 selection の resolver は `args` と `context` を受け取ります。結果には data、必要なら errors、extensions を含められます。未登録の resolver と resolver の例外は errors になり、実行できた field の data は残ります。

subscription document を `executeQuery` へ渡すと error を返します。subscription は `subscribeSubscription` を使います。

## client と subscription

`createGraphQLClient({ server, defaultContext })` は `query` と `mutate` を提供し、client call を別に記録します。`query` と `mutate` は server の `executeQuery` を呼びます。

`subscribeSubscription(server, query, variables, context)` は `SubscriptionHandle` を返します。events は AsyncIterable、`close` は以降の event を停止します。非 subscription operation、Subscription resolver の欠落、field の欠落は throw します。

## parser

`parseGraphQLOperation` は operation type、任意の operation name、variable definition 名、selection、scalar arguments を取り出します。対応しない GraphQL syntax は本番 parser の代わりに使わないでください。

## 補助 API

retry、batch、idempotency、observability、circuit breaker の API は server の execution を包む helper です。cache と hook registry はテストごとに作成して状態を共有しないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>expected &#123;</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L41) |
| <code v-pre>unterminated selection set</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L50) |
| <code v-pre>unexpected token at position 0 near "$&#123;source.slice(0, 20)&#125;"</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L56) |
| <code v-pre>unterminated arguments</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L66) |
| <code v-pre>subscribeSubscription requires a subscription operation, got $&#123;parsed.type&#125;</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L26) |
| <code v-pre>no Subscription resolvers registered</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L30) |
| <code v-pre>subscription requires at least 1 selection</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L33) |
| <code v-pre>no subscription resolver for $&#123;rootSel.name&#125;</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L35) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L148) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(server: GraphQLServer, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createGraphQLClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L27) <code v-pre>packages/graphql/src/client.ts</code>

mock GraphQL client。 内部で server.executeQuery を叩くだけの thin wrapper だが、 client 側の呼出を独立に記録して urql / Relay 相当の caller inspection を可能にする。

```ts
export declare function createGraphQLClient(options: GraphQLClientOptions): GraphQLClient;
```

#### <code v-pre>createGraphQLServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L67) <code v-pre>packages/graphql/src/server.ts</code>

schema + resolvers を受け取って mock GraphQL server を作る。 executeQuery で query / mutation を dispatch し、 対応する resolver を呼出、 結果を data / errors 形式で返す。 subscription は subscribeSubscription 経由で呼出 (別 module)。

```ts
export declare function createGraphQLServer(schema: GraphQLSchemaDef, resolvers: GraphQLResolvers, options?: CreateGraphQLServerOptions): GraphQLServer;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L101) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L58) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>executeBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L41) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function executeBatch(server: GraphQLServer, queries: readonly {
    query: string;
    variables?: GraphQLVariables;
}[]): Promise<BatchExecuteResult>;
```

#### <code v-pre>executeIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L68) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function executeIdempotent(server: GraphQLServer, query: string, variables: GraphQLVariables, idempotencyKey: string, cache: IdempotencyCache): Promise<GraphQLExecutionResult & {
    cached: boolean;
}>;
```

#### <code v-pre>executeObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L115) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function executeObservable(server: GraphQLServer, query: string, variables: GraphQLVariables, hooks: HookRegistry): Promise<GraphQLExecutionResult>;
```

#### <code v-pre>executeQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L97) <code v-pre>packages/graphql/src/server.ts</code>

mock server 経由で GraphQL query / mutation を実行する。 parser で operation を分解し、 対応する resolver を selection ごとに呼出、 data を組み立てる。 subscription は subscribeSubscription 経由で呼出。

```ts
export declare function executeQuery(server: GraphQLServer, query: string, variables?: GraphQLVariables, context?: GraphQLContext, onCall?: (call: GraphQLServerCall) => void, now?: () => number): Promise<GraphQLExecutionResult>;
```

#### <code v-pre>executeWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L13) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function executeWithRetry(server: GraphQLServer, query: string, variables?: GraphQLVariables, options?: RetryOptions): Promise<GraphQLExecutionResult & {
    attempts: number;
}>;
```

#### <code v-pre>parseGraphQLOperation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L21) <code v-pre>packages/graphql/src/parser.ts</code>

最小 GraphQL parser。 operation type (query/mutation/subscription) + name + selection set + 引数を抜き出す。 fragment / directive / inline union は非対応 (mock 用途では十分)。

```ts
export declare function parseGraphQLOperation(source: string): ParsedOperation;
```

#### <code v-pre>subscribeSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L18) <code v-pre>packages/graphql/src/subscription.ts</code>

subscription mock。 real WebSocket transport は張らず、 resolver が返す AsyncIterable を そのまま purely-in-process で iterate する。 close を呼ぶまで active。

```ts
export declare function subscribeSubscription(server: GraphQLServer, query: string, variables?: GraphQLVariables, context?: GraphQLContext): SubscriptionHandle;
```

### 型

#### <code v-pre>BatchExecuteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L34) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface BatchExecuteResult {
    total: number;
    succeeded: number;
    failed: number;
    results: GraphQLExecutionResult[];
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L141) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: (query: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    errorCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L135) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface CircuitBreakerOptions {
    errorThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L133) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

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

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L93) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L85) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface HookContext {
    event: QueryHookEvent;
    query: string;
    variables?: GraphQLVariables;
    result?: GraphQLExecutionResult;
    error?: string;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L95) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface HookRegistry {
    register: (event: QueryHookEvent, cb: HookCallback) => () => void;
    emit: (event: QueryHookEvent, ctx: HookContext) => void;
    count: (event: QueryHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L51) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => GraphQLExecutionResult | undefined;
    set: (key: string, value: GraphQLExecutionResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### <code v-pre>OperationType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L1) <code v-pre>packages/graphql/src/parser.ts</code>

```ts
export type OperationType = 'query' | 'mutation' | 'subscription';
```

#### <code v-pre>ParsedOperation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L10) <code v-pre>packages/graphql/src/parser.ts</code>

```ts
export interface ParsedOperation {
    type: OperationType;
    name?: string;
    variableDefs: string[];
    selections: SelectionField[];
}
```

#### <code v-pre>QueryHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L83) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export type QueryHookEvent = 'before-query' | 'after-query' | 'error';
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L7) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number) => void;
}
```

#### <code v-pre>SelectionField</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L3) <code v-pre>packages/graphql/src/parser.ts</code>

```ts
export interface SelectionField {
    name: string;
    alias?: string;
    arguments: Record<string, string | number | boolean | null>;
    selections: SelectionField[];
}
```

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
<!-- kiwa-public-api:end -->
