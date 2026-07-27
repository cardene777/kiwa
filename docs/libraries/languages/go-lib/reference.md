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
| 'circuit-open' | [packages/go-lib/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L219) |
| 'next() called multiple times' | [packages/go-lib/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L276) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchDispatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L66) `packages/go-lib/src/extensions.ts`

batch handler dispatch — 並列/直列両対応

```ts
export async function batchDispatch<T>(
  handlers: Array<() => Promise<T>>,
  options: BatchDispatchOptions = {},
): Promise<BatchDispatchResult<T>>;
```

#### `captureChiRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L72) `packages/go-lib/src/chi.ts`

```ts
export async function captureChiRoute(options: CaptureChiRouteOptions): Promise<CaptureChiRouteResult>;
```

#### `composeMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L272) `packages/go-lib/src/extensions.ts`

middleware compose helper — 複数 middleware を 1 chain に連結

```ts
export function composeMiddleware(...middlewares: MiddlewareFn[]): MiddlewareFn;
```

#### `createCancelToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L250) `packages/go-lib/src/extensions.ts`

context.WithCancel simulation — Go の context 相当

```ts
export function createCancelToken(): CancelToken;
```

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L206) `packages/go-lib/src/extensions.ts`

circuit breaker — 失敗閾値超えで open、 resetTimeout 経過で half-open

```ts
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker;
```

#### `createGoAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L48) `packages/go-lib/src/env.ts`

gin/echo/fiber/chi の mock env を生成。 route 一覧の宣言 + reset で 4 framework 共通で router state を扱えるようにする。

```ts
export function createGoAppEnv(options: CreateGoAppEnvOptions): GoAppEnv;
```

#### `createObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L111) `packages/go-lib/src/extensions.ts`

observability hook — request 一覧を蓄積

```ts
export function createObservabilityHook(): ObservabilityHook;
```

#### `createRateLimiter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L164) `packages/go-lib/src/extensions.ts`

token bucket rate limiter

```ts
export function createRateLimiter(options: RateLimitOptions): RateLimiter;
```

#### `createRouteGroup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L299) `packages/go-lib/src/extensions.ts`

route group + subrouter helper — gin.Group / echo.Group / fiber.Group / chi.Route を統一

```ts
export function createRouteGroup(options: RouteGroupOptions): RouteGroup;
```

#### `invokeEchoHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L28) `packages/go-lib/src/echo.ts`

echo.Context 相当を simulate。 JSON/String/NoContent/Response/Param/QueryParam を capture、 echo 慣例通り Error return を尊重 (nil = 成功 / err = handler error) して結果に含める。

```ts
export async function invokeEchoHandler(options: InvokeEchoHandlerOptions): Promise<InvokeEchoHandlerResult>;
```

#### `invokeFiberHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L30) `packages/go-lib/src/fiber.ts`

fiber.Ctx 相当を simulate。 Status chain + JSON/SendString/SendStatus + Set/Params/Query/Body を fiber 慣例通り expose、 handler の Error return を結果に反映する。

```ts
export async function invokeFiberHandler(options: InvokeFiberHandlerOptions): Promise<InvokeFiberHandlerResult>;
```

#### `invokeGinHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L30) `packages/go-lib/src/gin.ts`

gin.Context 相当を simulate。 JSON/String/Header/Param/Query の 5 primitive を capture し、 c.AbortWithStatus 相当の abort も expose。 gin の実 handler がそのまま渡せる signature。

```ts
export async function invokeGinHandler(options: InvokeGinHandlerOptions): Promise<InvokeGinHandlerResult>;
```

#### `retryWithBackoff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L26) `packages/go-lib/src/extensions.ts`

exponential backoff retry — echo/gin middleware に組み込む想定

```ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L132) `packages/go-lib/src/extensions.ts`

handler timeout — timeoutMs 経過で reject

```ts
export async function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T>;
```

### 型

#### `BatchDispatchOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L54) `packages/go-lib/src/extensions.ts`

```ts
export interface BatchDispatchOptions {
  concurrency?: number;
  stopOnError?: boolean;
}
```

#### `BatchDispatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L59) `packages/go-lib/src/extensions.ts`

```ts
export interface BatchDispatchResult<T> {
  results: Array<{ index: number; ok: boolean; value?: T; error?: unknown }>;
  successCount: number;
  failureCount: number;
}
```

#### `CancelToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L243) `packages/go-lib/src/extensions.ts`

```ts
export interface CancelToken {
  cancelled: () => boolean;
  cancel: () => void;
  onCancel: (fn: () => void) => void;
}
```

#### `CaptureChiRouteOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L14) `packages/go-lib/src/chi.ts`

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

#### `CaptureChiRouteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L23) `packages/go-lib/src/chi.ts`

```ts
export interface CaptureChiRouteResult extends GoResponse {
  matched: boolean;
  middlewareTrace: GoMiddlewareTraceEntry[];
  matchedPattern?: string;
}
```

#### `ChiApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L6) `packages/go-lib/src/chi.ts`

```ts
export interface ChiApp {
  routes: Map<string, { method: string; pattern: string; handler: ChiHandler }>;
  middlewares: Array<{ name: string; fn: ChiMiddleware }>;
  addRoute: (method: string, pattern: string, handler: ChiHandler) => void;
  use: (name: string, fn: ChiMiddleware) => void;
  match: (method: string, path: string) => { pattern: string; handler: ChiHandler; params: Record<string, string> } | null;
}
```

#### `ChiHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L3) `packages/go-lib/src/chi.ts`

```ts
export type ChiHandler = (req: GoRequest) => { status: number; body?: unknown; headers?: Record<string, string> } | Promise<{ status: number; body?: unknown; headers?: Record<string, string> }>;
```

#### `ChiMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/chi.ts#L4) `packages/go-lib/src/chi.ts`

```ts
export type ChiMiddleware = (name: string, next: () => void | Promise<void>) => void | Promise<void>;
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L199) `packages/go-lib/src/extensions.ts`

```ts
export interface CircuitBreaker {
  state: () => CircuitState;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L194) `packages/go-lib/src/extensions.ts`

```ts
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L192) `packages/go-lib/src/extensions.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `EchoContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L3) `packages/go-lib/src/echo.ts`

```ts
export interface EchoContext {
  request: GoRequest;
  JSON: (code: number, body: unknown) => Error | null;
  String: (code: number, body: string) => Error | null;
  NoContent: (code: number) => Error | null;
  Response: () => { status: number; header: Record<string, string> };
  Param: (key: string) => string;
  QueryParam: (key: string) => string;
}
```

#### `EchoHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L13) `packages/go-lib/src/echo.ts`

```ts
export type EchoHandler = (c: EchoContext) => Error | null | Promise<Error | null>;
```

#### `FiberContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L3) `packages/go-lib/src/fiber.ts`

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

#### `FiberHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L15) `packages/go-lib/src/fiber.ts`

```ts
export type FiberHandler = (c: FiberContext) => Error | null | Promise<Error | null>;
```

#### `GinContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L3) `packages/go-lib/src/gin.ts`

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

#### `GinHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L15) `packages/go-lib/src/gin.ts`

```ts
export type GinHandler = (c: GinContext) => void | Promise<void>;
```

#### `GoAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L31) `packages/go-lib/src/env.ts`

```ts
export interface GoAppEnv {
  framework: GoFramework;
  routes: GoRouteDefinition[];
  addRoute: (route: GoRouteDefinition) => void;
  listRoutes: () => GoRouteDefinition[];
  reset: () => void;
}
```

#### `GoFramework`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L1) `packages/go-lib/src/env.ts`

```ts
export type GoFramework = 'gin' | 'echo' | 'fiber' | 'chi';
```

#### `GoMiddlewareTraceEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L25) `packages/go-lib/src/env.ts`

```ts
export interface GoMiddlewareTraceEntry {
  name: string;
  order: number;
  ranAt: number;
}
```

#### `GoRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L3) `packages/go-lib/src/env.ts`

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

#### `GoResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L12) `packages/go-lib/src/env.ts`

```ts
export interface GoResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  framework: GoFramework;
}
```

#### `GoRouteDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/env.ts#L19) `packages/go-lib/src/env.ts`

```ts
export interface GoRouteDefinition {
  method: string;
  path: string;
  handlerName: string;
}
```

#### `InvokeEchoHandlerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L15) `packages/go-lib/src/echo.ts`

```ts
export interface InvokeEchoHandlerOptions {
  handler: EchoHandler;
  req: GoRequest;
}
```

#### `InvokeEchoHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L20) `packages/go-lib/src/echo.ts`

```ts
export interface InvokeEchoHandlerResult extends GoResponse {
  handlerError?: string;
}
```

#### `InvokeFiberHandlerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L17) `packages/go-lib/src/fiber.ts`

```ts
export interface InvokeFiberHandlerOptions {
  handler: FiberHandler;
  req: GoRequest;
}
```

#### `InvokeFiberHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L22) `packages/go-lib/src/fiber.ts`

```ts
export interface InvokeFiberHandlerResult extends GoResponse {
  handlerError?: string;
}
```

#### `InvokeGinHandlerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L17) `packages/go-lib/src/gin.ts`

```ts
export interface InvokeGinHandlerOptions {
  handler: GinHandler;
  req: GoRequest;
}
```

#### `InvokeGinHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L22) `packages/go-lib/src/gin.ts`

```ts
export interface InvokeGinHandlerResult extends GoResponse {
  aborted: boolean;
}
```

#### `MiddlewareFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L269) `packages/go-lib/src/extensions.ts`

```ts
export type MiddlewareFn = (req: GoRequest, next: () => Promise<GoResponse>) => Promise<GoResponse>;
```

#### `ObservabilityEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L95) `packages/go-lib/src/extensions.ts`

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

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L104) `packages/go-lib/src/extensions.ts`

```ts
export interface ObservabilityHook {
  onRequest: (event: ObservabilityEvent) => void;
  events: () => ObservabilityEvent[];
  clear: () => void;
}
```

#### `RateLimiter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L157) `packages/go-lib/src/extensions.ts`

```ts
export interface RateLimiter {
  tryAcquire: () => boolean;
  reset: () => void;
  remaining: () => number;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L152) `packages/go-lib/src/extensions.ts`

```ts
export interface RateLimitOptions {
  requestsPerSecond: number;
  burst?: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L11) `packages/go-lib/src/extensions.ts`

```ts
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}
```

#### `RetryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L18) `packages/go-lib/src/extensions.ts`

```ts
export interface RetryResult<T> {
  ok: boolean;
  attempts: number;
  value?: T;
  error?: unknown;
}
```

#### `RouteGroup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L290) `packages/go-lib/src/extensions.ts`

```ts
export interface RouteGroup {
  prefix: string;
  framework: GoFramework;
  routes: Array<{ method: string; fullPath: string; handlerName: string }>;
  addRoute: (method: string, subpath: string, handlerName: string) => void;
  subgroup: (childPrefix: string) => RouteGroup;
}
```

#### `RouteGroupOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L285) `packages/go-lib/src/extensions.ts`

```ts
export interface RouteGroupOptions {
  prefix: string;
  framework: GoFramework;
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L126) `packages/go-lib/src/extensions.ts`

```ts
export interface TimeoutOptions {
  timeoutMs: number;
  onTimeout?: () => void;
}
```
<!-- kiwa-public-api:end -->
