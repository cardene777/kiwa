# @kiwa-lab/trpc リファレンス

tRPC router の公開 API です。

## 主要 API

- `createRouter` は procedure map と middleware から router を作ります
- `defineProcedure` は `type`、`handler`、任意の middleware 配列を順に渡して query、mutation、subscription を定義します
- `invokeProcedure` は path と input で server 側を実行します
- `createClient` は client proxy を作ります
- `middleware`、`TRPCError`、`createContext` は middleware と context を扱います

## 設定

procedure の `type` と handler を指定します。router の global middleware は procedure middleware より先に実行されます。未知の path は `NOT_FOUND` の `TRPCError` になります。

## 後始末

外部接続は作りません。router はテストごとに作成してください。

## client とprocedure type

`defineProcedure` のtypeは `query`、`mutation`、`subscription` の識別子です。`invokeProcedure` と `createClient` はtypeに応じた実行分岐をせず、いずれもhandlerを直接呼びます。

`createClient(router)` のpath propertyはProxyで動的に作られます。存在しないpathのerrorはproperty取得時ではなく、query、mutate、subscribeを呼んだときに返ります。

## resilience helper

すべてのresilience helperはhandler wrapperです。router middlewareではありません。`withRetry` はretryOnがtrueのerrorだけをretryします。`withTimeout` は元handlerをcancelしません。`withRateLimit` はwrapper内のwall clock timestampを使います。`withCircuitBreaker` はfailure threshold到達時にopenし、reset時間後の一callをhalf-openで許可します。

`batchInvoke` は全itemをPromise.allで実行し、個別errorを `BatchInvokeResult` に正規化します。`withIdempotencyKey` は成功したresultだけをinputのidempotency keyでcacheします。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'circuit breaker open' | [packages/trpc/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L111) |
| `rate limit ${options.maxRequests}/${options.windowMs}ms exceeded` | [packages/trpc/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L92) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchInvoke`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L151) `packages/trpc/src/resilience.ts`

batchInvoke — 複数 procedure を Promise.all で並列 invoke、 各結果を BatchInvokeResult shape で正規化 (individual failure が全体 fail しない)。

```ts
export declare function batchInvoke(router: Router, items: BatchInvokeItem[], ctx?: ProcedureContext): Promise<BatchInvokeResult[]>;
```

#### `createClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/client.ts#L17) `packages/trpc/src/client.ts`

tRPC の createTRPCProxyClient 相当。 client.&lt;path&gt;.query(input) / .mutate(input) を呼ぶと 内部で invokeProcedure に translate される。 real tRPC の typed client と同じ shape の assertion が書ける。

```ts
export declare function createClient(router: Router): TypedClient;
```

#### `createContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts#L13) `packages/trpc/src/context.ts`

tRPC 実 server の createContext 相当。 request 単位で context を組み立てる。 実運用では cookie / auth header を読んで userId / session を注入する pattern を mock で再現。

```ts
export declare function createContext(options?: CreateContextOptions): ProcedureContext;
```

#### `createRouter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L24) `packages/trpc/src/router.ts`

tRPC v10 の router() 相当。 path (dot-notation もフラット key もサポート) と procedure の map を保持する。 globalMiddlewares は全 procedure 呼出前に走らせる。

```ts
export declare function createRouter(options: CreateRouterOptions): Router;
```

#### `defineProcedure`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L22) `packages/trpc/src/procedure.ts`

tRPC v10 の t.procedure.query(handler) / .mutation(handler) / .subscription(handler) 相当。 middleware 配列を挟めるようにして、 procedure 単位で auth / logging を宣言する pattern を 再現する。

```ts
export declare function defineProcedure<TInput = unknown, TOutput = unknown>(type: ProcedureType, handler: ProcedureHandler<TInput, TOutput>, middlewares?: Middleware[]): ProcedureDefinition<TInput, TOutput>;
```

#### `invokeProcedure`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L35) `packages/trpc/src/router.ts`

router に対して procedure を実行。 middleware chain (global → per-procedure) を順に走らせ、 全 middleware 通過後に handler を呼び出す。 途中 throw で TRPCError を包んで返す。

```ts
export declare function invokeProcedure(router: Router, path: string, input: unknown, ctx?: ProcedureContext): Promise<unknown>;
```

#### `middleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L38) `packages/trpc/src/middleware.ts`

middleware wrapper。 実 tRPC の t.middleware(async ({ ctx, next }) =&gt; ...) と同じ形。 内部で next() を呼ぶことで chain 継続、 呼ばずに throw で早期 abort を表現する。

```ts
export declare function middleware(fn: Middleware): Middleware;
```

#### `TRPCError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L25) `packages/trpc/src/middleware.ts`

```ts
export declare class TRPCError extends Error {
    code: TRPCErrorCode;
    constructor(params: {
        code: TRPCErrorCode;
        message?: string;
    });
}
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L103) `packages/trpc/src/resilience.ts`

withCircuitBreaker — 連続失敗が failureThreshold 超で「open」 状態に切替、 resetMs 経過で half-open で 1 attempt allow、 成功で closed 復帰。

```ts
export declare function withCircuitBreaker<T>(handler: ProcedureHandler<unknown, T>, options: CircuitBreakerOptions): ProcedureHandler<unknown, T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L171) `packages/trpc/src/resilience.ts`

withIdempotencyKey — 同一 key の重複 invoke で cached result を返す。 downstream への 副作用を防ぐ (payment / charge / booking 系で重要)。

```ts
export declare function withIdempotencyKey<T>(handler: ProcedureHandler<unknown, T>): ProcedureHandler<unknown, T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L132) `packages/trpc/src/resilience.ts`

withObservability — handler の start / success / error / duration を hook 通知。 tracing / metrics / logging の統合を統一 interface で実現。

```ts
export declare function withObservability<T>(name: string, handler: ProcedureHandler<unknown, T>, hook: ObservabilityHook): ProcedureHandler<unknown, T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L85) `packages/trpc/src/resilience.ts`

withRateLimit — sliding window rate limiter。 window 内 request 数が maxRequests 超で throw。

```ts
export declare function withRateLimit<T>(handler: ProcedureHandler<unknown, T>, options: RateLimitOptions): ProcedureHandler<unknown, T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L46) `packages/trpc/src/resilience.ts`

withRetry — procedure handler を retry policy でラップ。 exponential backoff (backoffMs * 2^(attempt-1)) を default で適用、 retryOn callback で条件付き retry も可能。

```ts
export declare function withRetry<T>(handler: ProcedureHandler<unknown, T>, options: RetryOptions): ProcedureHandler<unknown, T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L70) `packages/trpc/src/resilience.ts`

withTimeout — handler を timeout でラップ。 ms 経過で Promise.race で timeout error throw。

```ts
export declare function withTimeout<T>(handler: ProcedureHandler<unknown, T>, options: TimeoutOptions): ProcedureHandler<unknown, T>;
```

### 型

#### `BatchInvokeItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L31) `packages/trpc/src/resilience.ts`

```ts
export interface BatchInvokeItem<TInput = unknown> {
    procedureName: string;
    input: TInput;
}
```

#### `BatchInvokeResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L36) `packages/trpc/src/resilience.ts`

```ts
export interface BatchInvokeResult {
    ok: boolean;
    output?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L20) `packages/trpc/src/resilience.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### `CreateContextOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts#L3) `packages/trpc/src/context.ts`

```ts
export interface CreateContextOptions {
    headers?: Record<string, string>;
    userId?: string;
    session?: Record<string, unknown>;
}
```

#### `CreateRouterOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L15) `packages/trpc/src/router.ts`

```ts
export interface CreateRouterOptions {
    procedures: Record<string, ProcedureDefinition>;
    middlewares?: Middleware[];
}
```

#### `Middleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L16) `packages/trpc/src/middleware.ts`

```ts
export type Middleware = (params: MiddlewareParams) => Promise<MiddlewareResult>;
```

#### `MiddlewareParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L3) `packages/trpc/src/middleware.ts`

```ts
export interface MiddlewareParams {
    ctx: ProcedureContext;
    input: unknown;
    path: string;
    next: (params?: {
        ctx?: ProcedureContext;
    }) => Promise<MiddlewareResult>;
}
```

#### `MiddlewareResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L10) `packages/trpc/src/middleware.ts`

```ts
export interface MiddlewareResult {
    ok: boolean;
    data?: unknown;
    error?: TRPCError;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L25) `packages/trpc/src/resilience.ts`

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `ProcedureContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts#L1) `packages/trpc/src/context.ts`

```ts
export type ProcedureContext = Record<string, unknown>;
```

#### `ProcedureDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L11) `packages/trpc/src/procedure.ts`

```ts
export interface ProcedureDefinition<TInput = unknown, TOutput = unknown> {
    type: ProcedureType;
    handler: ProcedureHandler<TInput, TOutput>;
    middlewares: Middleware[];
}
```

#### `ProcedureHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L6) `packages/trpc/src/procedure.ts`

```ts
export type ProcedureHandler<TInput = unknown, TOutput = unknown> = (params: {
    input: TInput;
    ctx: ProcedureContext;
}) => Promise<TOutput> | TOutput;
```

#### `ProcedureType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/procedure.ts#L4) `packages/trpc/src/procedure.ts`

```ts
export type ProcedureType = 'query' | 'mutation' | 'subscription';
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L15) `packages/trpc/src/resilience.ts`

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L5) `packages/trpc/src/resilience.ts`

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### `Router`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/router.ts#L10) `packages/trpc/src/router.ts`

```ts
export interface Router {
    procedures: Record<string, ProcedureDefinition>;
    globalMiddlewares: Middleware[];
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L11) `packages/trpc/src/resilience.ts`

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### `TRPCErrorCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/middleware.ts#L18) `packages/trpc/src/middleware.ts`

```ts
export type TRPCErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR';
```

#### `TypedClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/client.ts#L4) `packages/trpc/src/client.ts`

```ts
export interface TypedClient {
    [path: string]: {
        query: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
        mutate: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
        subscribe: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
    };
}
```
<!-- kiwa-public-api:end -->
