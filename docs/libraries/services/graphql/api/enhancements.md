---
title: "@kiwa-lab/graphql enhancements の API 契約"
---

# <code v-pre>@kiwa-lab/graphql</code> <code v-pre>enhancements</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L148) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(server: GraphQLServer, options?: CircuitBreakerOptions): CircuitBreaker;
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

#### <code v-pre>executeWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/enhancements.ts#L13) <code v-pre>packages/graphql/src/enhancements.ts</code>

```ts
export declare function executeWithRetry(server: GraphQLServer, query: string, variables?: GraphQLVariables, options?: RetryOptions): Promise<GraphQLExecutionResult & {
    attempts: number;
}>;
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
