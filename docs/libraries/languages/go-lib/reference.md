# go-lib リファレンス

## 公開 API

`createGoAppEnv` はframeworkとroute定義を保持します。`invokeGinHandler`、`invokeEchoHandler`、`invokeFiberHandler` は個別handlerを実行し、`captureChiRoute` はchi appのmatchとmiddleware traceを返します。`composeMiddleware` と `createRouteGroup` はroute構成を補助します。

## 設定

環境の `framework` は `gin`、`echo`、`fiber`、`chi` です。`createGoAppEnv` の `initialRoutes` と `addRoute` はメタデータを保存するだけで、handler関数は保存せずdispatchもしません。`reset` はこの一覧だけを空にします。

handler実行ではhandlerと `req` を渡します。ginの `Param` と `Query` は存在しなければ `undefined`、echoとfiberの `Param` と `Query` は空文字です。header keyを設定する場合は小文字で結果へ保存されます。echoとfiberが返す `Error` は `handlerError`、ginのabortは `aborted` として結果に反映されます。

chiではapp、method、pathを渡します。一致したpatternの `{name}` を `params.name` に入れ、middlewareは登録順に実行記録へ追加します。middlewareが `next` を呼ばなくても、現実装ではmiddleware chainの後にhandlerを実行します。`ChiApp` のfactoryは公開entry pointに含まれない点に注意してください。

## 結果の分岐

route実行はstatus、body、header、matchedを返します。chiの未一致はhandler errorではなく `matched: false` と404であり、ginなどのcontext値と分けて確認します。chiでhandlerがthrowした場合は捕捉しません。

## 補助関数

`retryWithBackoff` は指数backoff後に失敗結果を返します。`withTimeout` は時間切れ後も元の処理をcancelしません。`createRateLimiter` はメモリ上のtoken bucketで、`tryAcquire` の真偽を返します。`createCircuitBreaker` は失敗回数でopenとなり、reset時間の後にhalf-openになります。

`createCancelToken` は複数回cancelしてもlistenerを一度だけ呼びます。`composeMiddleware` は同じ `next` を二度呼ぶとrejectします。`createRouteGroup` のsubgroupで追加したrouteは親の一覧にも追加されます。

## 後始末と制約

環境、router fixture、rate limiter、circuit breakerはテストごとに作ります。Goのバイナリ、実framework、networkは起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>circuit-open</code> | [packages/go-lib/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L219) |
| <code v-pre>next() called multiple times</code> | [packages/go-lib/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L276) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>batchDispatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L66) <code v-pre>packages/go-lib/src/extensions.ts</code>

batch handler dispatch — 並列/直列両対応

```ts
export declare function batchDispatch<T>(handlers: Array<() => Promise<T>>, options?: BatchDispatchOptions): Promise<BatchDispatchResult<T>>;
```

#### <code v-pre>captureChiRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L72) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export declare function captureChiRoute(options: CaptureChiRouteOptions): Promise<CaptureChiRouteResult>;
```

#### <code v-pre>composeMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L272) <code v-pre>packages/go-lib/src/extensions.ts</code>

middleware compose helper — 複数 middleware を 1 chain に連結

```ts
export declare function composeMiddleware(...middlewares: MiddlewareFn[]): MiddlewareFn;
```

#### <code v-pre>createCancelToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L250) <code v-pre>packages/go-lib/src/extensions.ts</code>

context.WithCancel simulation — Go の context 相当

```ts
export declare function createCancelToken(): CancelToken;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L206) <code v-pre>packages/go-lib/src/extensions.ts</code>

circuit breaker — 失敗閾値超えで open、 resetTimeout 経過で half-open

```ts
export declare function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createGoAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L48) <code v-pre>packages/go-lib/src/env.ts</code>

gin/echo/fiber/chi の mock env を生成。 route 一覧の宣言 + reset で 4 framework 共通で router state を扱えるようにする。

```ts
export declare function createGoAppEnv(options: CreateGoAppEnvOptions): GoAppEnv;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L111) <code v-pre>packages/go-lib/src/extensions.ts</code>

observability hook — request 一覧を蓄積

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L164) <code v-pre>packages/go-lib/src/extensions.ts</code>

token bucket rate limiter

```ts
export declare function createRateLimiter(options: RateLimitOptions): RateLimiter;
```

#### <code v-pre>createRouteGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L299) <code v-pre>packages/go-lib/src/extensions.ts</code>

route group + subrouter helper — gin.Group / echo.Group / fiber.Group / chi.Route を統一

```ts
export declare function createRouteGroup(options: RouteGroupOptions): RouteGroup;
```

#### <code v-pre>invokeEchoHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L28) <code v-pre>packages/go-lib/src/echo.ts</code>

echo.Context 相当を simulate。 JSON/String/NoContent/Response/Param/QueryParam を capture、 echo 慣例通り Error return を尊重 (nil = 成功 / err = handler error) して結果に含める。

```ts
export declare function invokeEchoHandler(options: InvokeEchoHandlerOptions): Promise<InvokeEchoHandlerResult>;
```

#### <code v-pre>invokeFiberHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L30) <code v-pre>packages/go-lib/src/fiber.ts</code>

fiber.Ctx 相当を simulate。 Status chain + JSON/SendString/SendStatus + Set/Params/Query/Body を fiber 慣例通り expose、 handler の Error return を結果に反映する。

```ts
export declare function invokeFiberHandler(options: InvokeFiberHandlerOptions): Promise<InvokeFiberHandlerResult>;
```

#### <code v-pre>invokeGinHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L30) <code v-pre>packages/go-lib/src/gin.ts</code>

gin.Context 相当を simulate。 JSON/String/Header/Param/Query の 5 primitive を capture し、 c.AbortWithStatus 相当の abort も expose。 gin の実 handler がそのまま渡せる signature。

```ts
export declare function invokeGinHandler(options: InvokeGinHandlerOptions): Promise<InvokeGinHandlerResult>;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L26) <code v-pre>packages/go-lib/src/extensions.ts</code>

exponential backoff retry — echo/gin middleware に組み込む想定

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L132) <code v-pre>packages/go-lib/src/extensions.ts</code>

handler timeout — timeoutMs 経過で reject

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T>;
```

### 型

#### <code v-pre>BatchDispatchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L54) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface BatchDispatchOptions {
    concurrency?: number;
    stopOnError?: boolean;
}
```

#### <code v-pre>BatchDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L59) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface BatchDispatchResult<T> {
    results: Array<{
        index: number;
        ok: boolean;
        value?: T;
        error?: unknown;
    }>;
    successCount: number;
    failureCount: number;
}
```

#### <code v-pre>CancelToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L243) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface CancelToken {
    cancelled: () => boolean;
    cancel: () => void;
    onCancel: (fn: () => void) => void;
}
```

#### <code v-pre>CaptureChiRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L14) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export interface CaptureChiRouteOptions {
    app: ChiApp;
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
```

#### <code v-pre>CaptureChiRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L23) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export interface CaptureChiRouteResult extends GoResponse {
    matched: boolean;
    middlewareTrace: GoMiddlewareTraceEntry[];
    matchedPattern?: string;
}
```

#### <code v-pre>ChiApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L6) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export interface ChiApp {
    routes: Map<string, {
        method: string;
        pattern: string;
        handler: ChiHandler;
    }>;
    middlewares: Array<{
        name: string;
        fn: ChiMiddleware;
    }>;
    addRoute: (method: string, pattern: string, handler: ChiHandler) => void;
    use: (name: string, fn: ChiMiddleware) => void;
    match: (method: string, path: string) => {
        pattern: string;
        handler: ChiHandler;
        params: Record<string, string>;
    } | null;
}
```

#### <code v-pre>ChiHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L3) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export type ChiHandler = (req: GoRequest) => {
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
} | Promise<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
}>;
```

#### <code v-pre>ChiMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L4) <code v-pre>packages/go-lib/src/chi.ts</code>

```ts
export type ChiMiddleware = (name: string, next: () => void | Promise<void>) => void | Promise<void>;
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L199) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    reset: () => void;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L194) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L192) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>EchoContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L3) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export interface EchoContext {
    request: GoRequest;
    JSON: (code: number, body: unknown) => Error | null;
    String: (code: number, body: string) => Error | null;
    NoContent: (code: number) => Error | null;
    Response: () => {
        status: number;
        header: Record<string, string>;
    };
    Param: (key: string) => string;
    QueryParam: (key: string) => string;
}
```

#### <code v-pre>EchoHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L13) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export type EchoHandler = (c: EchoContext) => Error | null | Promise<Error | null>;
```

#### <code v-pre>FiberContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L3) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export interface FiberContext {
    request: GoRequest;
    Status: (code: number) => FiberContext;
    JSON: (body: unknown) => Error | null;
    SendString: (body: string) => Error | null;
    SendStatus: (code: number) => Error | null;
    Set: (key: string, value: string) => void;
    Params: (key: string) => string;
    Query: (key: string) => string;
    Body: () => unknown;
}
```

#### <code v-pre>FiberHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L15) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export type FiberHandler = (c: FiberContext) => Error | null | Promise<Error | null>;
```

#### <code v-pre>GinContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L3) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export interface GinContext {
    request: GoRequest;
    status: (code: number) => GinContext;
    JSON: (code: number, body: unknown) => void;
    String: (code: number, body: string) => void;
    Header: (key: string, value: string) => void;
    Param: (key: string) => string | undefined;
    Query: (key: string) => string | undefined;
    aborted: boolean;
    abort: () => void;
}
```

#### <code v-pre>GinHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L15) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export type GinHandler = (c: GinContext) => void | Promise<void>;
```

#### <code v-pre>GoAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L31) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoAppEnv {
    framework: GoFramework;
    routes: GoRouteDefinition[];
    addRoute: (route: GoRouteDefinition) => void;
    listRoutes: () => GoRouteDefinition[];
    reset: () => void;
}
```

#### <code v-pre>GoFramework</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L1) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export type GoFramework = 'gin' | 'echo' | 'fiber' | 'chi';
```

#### <code v-pre>GoMiddlewareTraceEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L25) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoMiddlewareTraceEntry {
    name: string;
    order: number;
    ranAt: number;
}
```

#### <code v-pre>GoRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L3) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoRequest {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
}
```

#### <code v-pre>GoResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L12) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoResponse {
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
    framework: GoFramework;
}
```

#### <code v-pre>GoRouteDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L19) <code v-pre>packages/go-lib/src/env.ts</code>

```ts
export interface GoRouteDefinition {
    method: string;
    path: string;
    handlerName: string;
}
```

#### <code v-pre>InvokeEchoHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L15) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export interface InvokeEchoHandlerOptions {
    handler: EchoHandler;
    req: GoRequest;
}
```

#### <code v-pre>InvokeEchoHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L20) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export interface InvokeEchoHandlerResult extends GoResponse {
    handlerError?: string;
}
```

#### <code v-pre>InvokeFiberHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L17) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export interface InvokeFiberHandlerOptions {
    handler: FiberHandler;
    req: GoRequest;
}
```

#### <code v-pre>InvokeFiberHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L22) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export interface InvokeFiberHandlerResult extends GoResponse {
    handlerError?: string;
}
```

#### <code v-pre>InvokeGinHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L17) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export interface InvokeGinHandlerOptions {
    handler: GinHandler;
    req: GoRequest;
}
```

#### <code v-pre>InvokeGinHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L22) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export interface InvokeGinHandlerResult extends GoResponse {
    aborted: boolean;
}
```

#### <code v-pre>MiddlewareFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L269) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export type MiddlewareFn = (req: GoRequest, next: () => Promise<GoResponse>) => Promise<GoResponse>;
```

#### <code v-pre>ObservabilityEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L95) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface ObservabilityEvent {
    framework: GoFramework;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    timestamp: number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L104) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    onRequest: (event: ObservabilityEvent) => void;
    events: () => ObservabilityEvent[];
    clear: () => void;
}
```

#### <code v-pre>RateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L157) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RateLimiter {
    tryAcquire: () => boolean;
    reset: () => void;
    remaining: () => number;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L152) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RateLimitOptions {
    requestsPerSecond: number;
    burst?: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L11) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: unknown) => void;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L18) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>RouteGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L290) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RouteGroup {
    prefix: string;
    framework: GoFramework;
    routes: Array<{
        method: string;
        fullPath: string;
        handlerName: string;
    }>;
    addRoute: (method: string, subpath: string, handlerName: string) => void;
    subgroup: (childPrefix: string) => RouteGroup;
}
```

#### <code v-pre>RouteGroupOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L285) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RouteGroupOptions {
    prefix: string;
    framework: GoFramework;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L126) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface TimeoutOptions {
    timeoutMs: number;
    onTimeout?: () => void;
}
```
<!-- kiwa-public-api:end -->
