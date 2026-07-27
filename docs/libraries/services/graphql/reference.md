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
| 'expected {' | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L41) |
| 'unterminated selection set' | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L50) |
| `unexpected token at position 0 near "${source.slice(0, 20)}"` | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L56) |
| 'unterminated arguments' | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L66) |
| `subscribeSubscription requires a subscription operation, got ${parsed.type}` | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L26) |
| 'no Subscription resolvers registered' | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L30) |
| 'subscription requires at least 1 selection' | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L33) |
| `no subscription resolver for ${rootSel.name}` | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L35) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L148) `packages/graphql/src/enhancements.ts`

```ts
export declare function createCircuitBreaker(server: GraphQLServer, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### `createGraphQLClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L27) `packages/graphql/src/client.ts`

mock GraphQL client。 内部で server.executeQuery を叩くだけの thin wrapper だが、 client 側の呼出を独立に記録して urql / Relay 相当の caller inspection を可能にする。

```ts
export declare function createGraphQLClient(options: GraphQLClientOptions): GraphQLClient;
```

#### `createGraphQLServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L67) `packages/graphql/src/server.ts`

schema + resolvers を受け取って mock GraphQL server を作る。 executeQuery で query / mutation を dispatch し、 対応する resolver を呼出、 結果を data / errors 形式で返す。 subscription は subscribeSubscription 経由で呼出 (別 module)。

```ts
export declare function createGraphQLServer(schema: GraphQLSchemaDef, resolvers: GraphQLResolvers, options?: CreateGraphQLServerOptions): GraphQLServer;
```

#### `createHookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L101) `packages/graphql/src/enhancements.ts`

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### `createIdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L58) `packages/graphql/src/enhancements.ts`

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### `executeBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L41) `packages/graphql/src/enhancements.ts`

```ts
export declare function executeBatch(server: GraphQLServer, queries: readonly {
    query: string;
    variables?: GraphQLVariables;
}[]): Promise<BatchExecuteResult>;
```

#### `executeIdempotent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L68) `packages/graphql/src/enhancements.ts`

```ts
export declare function executeIdempotent(server: GraphQLServer, query: string, variables: GraphQLVariables, idempotencyKey: string, cache: IdempotencyCache): Promise<GraphQLExecutionResult & {
    cached: boolean;
}>;
```

#### `executeObservable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L115) `packages/graphql/src/enhancements.ts`

```ts
export declare function executeObservable(server: GraphQLServer, query: string, variables: GraphQLVariables, hooks: HookRegistry): Promise<GraphQLExecutionResult>;
```

#### `executeQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L97) `packages/graphql/src/server.ts`

mock server 経由で GraphQL query / mutation を実行する。 parser で operation を分解し、 対応する resolver を selection ごとに呼出、 data を組み立てる。 subscription は subscribeSubscription 経由で呼出。

```ts
export declare function executeQuery(server: GraphQLServer, query: string, variables?: GraphQLVariables, context?: GraphQLContext, onCall?: (call: GraphQLServerCall) => void, now?: () => number): Promise<GraphQLExecutionResult>;
```

#### `executeWithRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L13) `packages/graphql/src/enhancements.ts`

```ts
export declare function executeWithRetry(server: GraphQLServer, query: string, variables?: GraphQLVariables, options?: RetryOptions): Promise<GraphQLExecutionResult & {
    attempts: number;
}>;
```

#### `parseGraphQLOperation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L21) `packages/graphql/src/parser.ts`

最小 GraphQL parser。 operation type (query/mutation/subscription) + name + selection set + 引数を抜き出す。 fragment / directive / inline union は非対応 (mock 用途では十分)。

```ts
export declare function parseGraphQLOperation(source: string): ParsedOperation;
```

#### `subscribeSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L18) `packages/graphql/src/subscription.ts`

subscription mock。 real WebSocket transport は張らず、 resolver が返す AsyncIterable を そのまま purely-in-process で iterate する。 close を呼ぶまで active。

```ts
export declare function subscribeSubscription(server: GraphQLServer, query: string, variables?: GraphQLVariables, context?: GraphQLContext): SubscriptionHandle;
```

### 型

#### `BatchExecuteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L34) `packages/graphql/src/enhancements.ts`

```ts
export interface BatchExecuteResult {
    total: number;
    succeeded: number;
    failed: number;
    results: GraphQLExecutionResult[];
}
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L141) `packages/graphql/src/enhancements.ts`

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

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L135) `packages/graphql/src/enhancements.ts`

```ts
export interface CircuitBreakerOptions {
    errorThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L133) `packages/graphql/src/enhancements.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `GraphQLClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L15) `packages/graphql/src/client.ts`

```ts
export interface GraphQLClient {
    provider: GraphQLServer['provider'];
    query: (query: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult>;
    mutate: (mutation: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult>;
    listCalls: () => GraphQLClientCall[];
    clear: () => void;
}
```

#### `GraphQLClientCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L8) `packages/graphql/src/client.ts`

```ts
export interface GraphQLClientCall {
    method: 'query' | 'mutate' | 'subscribe';
    query: string;
    variables: GraphQLVariables;
    timestamp: number;
}
```

#### `GraphQLClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/client.ts#L3) `packages/graphql/src/client.ts`

```ts
export interface GraphQLClientOptions {
    server: GraphQLServer;
    defaultContext?: GraphQLContext;
}
```

#### `GraphQLContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L6) `packages/graphql/src/server.ts`

```ts
export type GraphQLContext = Record<string, unknown>;
```

#### `GraphQLError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L8) `packages/graphql/src/server.ts`

```ts
export interface GraphQLError {
    message: string;
    path?: (string | number)[];
    extensions?: Record<string, unknown>;
}
```

#### `GraphQLExecutionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L14) `packages/graphql/src/server.ts`

```ts
export interface GraphQLExecutionResult {
    data?: Record<string, unknown> | null;
    errors?: GraphQLError[];
    extensions?: Record<string, unknown>;
}
```

#### `GraphQLProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L3) `packages/graphql/src/server.ts`

```ts
export type GraphQLProvider = 'apollo' | 'yoga' | 'urql' | 'relay';
```

#### `GraphQLResolvers`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L25) `packages/graphql/src/server.ts`

```ts
export interface GraphQLResolvers {
    Query?: Record<string, GraphQLResolverFn>;
    Mutation?: Record<string, GraphQLResolverFn>;
    Subscription?: Record<string, (args: Record<string, unknown>, context: GraphQLContext) => AsyncIterable<unknown>>;
}
```

#### `GraphQLSchemaDef`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L31) `packages/graphql/src/server.ts`

```ts
export interface GraphQLSchemaDef {
    typeDefs: string;
}
```

#### `GraphQLServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L44) `packages/graphql/src/server.ts`

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

#### `GraphQLServerCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L35) `packages/graphql/src/server.ts`

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

#### `GraphQLVariables`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/server.ts#L5) `packages/graphql/src/server.ts`

```ts
export type GraphQLVariables = Record<string, string | number | boolean | null>;
```

#### `HookCallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L93) `packages/graphql/src/enhancements.ts`

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### `HookContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L85) `packages/graphql/src/enhancements.ts`

```ts
export interface HookContext {
    event: QueryHookEvent;
    query: string;
    variables?: GraphQLVariables;
    result?: GraphQLExecutionResult;
    error?: string;
}
```

#### `HookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L95) `packages/graphql/src/enhancements.ts`

```ts
export interface HookRegistry {
    register: (event: QueryHookEvent, cb: HookCallback) => () => void;
    emit: (event: QueryHookEvent, ctx: HookContext) => void;
    count: (event: QueryHookEvent) => number;
}
```

#### `IdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L51) `packages/graphql/src/enhancements.ts`

```ts
export interface IdempotencyCache {
    get: (key: string) => GraphQLExecutionResult | undefined;
    set: (key: string, value: GraphQLExecutionResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### `OperationType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L1) `packages/graphql/src/parser.ts`

```ts
export type OperationType = 'query' | 'mutation' | 'subscription';
```

#### `ParsedOperation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L10) `packages/graphql/src/parser.ts`

```ts
export interface ParsedOperation {
    type: OperationType;
    name?: string;
    variableDefs: string[];
    selections: SelectionField[];
}
```

#### `QueryHookEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L83) `packages/graphql/src/enhancements.ts`

```ts
export type QueryHookEvent = 'before-query' | 'after-query' | 'error';
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L7) `packages/graphql/src/enhancements.ts`

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number) => void;
}
```

#### `SelectionField`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L3) `packages/graphql/src/parser.ts`

```ts
export interface SelectionField {
    name: string;
    alias?: string;
    arguments: Record<string, string | number | boolean | null>;
    selections: SelectionField[];
}
```

#### `SubscriptionEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L4) `packages/graphql/src/subscription.ts`

```ts
export interface SubscriptionEvent {
    data?: Record<string, unknown> | null;
    errors?: {
        message: string;
    }[];
}
```

#### `SubscriptionHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L9) `packages/graphql/src/subscription.ts`

```ts
export interface SubscriptionHandle {
    events: AsyncIterable<SubscriptionEvent>;
    close: () => void;
}
```
<!-- kiwa-public-api:end -->
