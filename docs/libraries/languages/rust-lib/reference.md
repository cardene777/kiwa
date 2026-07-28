# rust-lib リファレンス

## 公開 API

`createRustAppEnv` はframeworkとroute一覧を持つ環境を作ります。`invokeAxumHandler` と `invokeActixHandler` はhandlerを実行します。`captureTowerMiddleware` はmiddlewareのtrace、`invokeRocketRoute` はRocket routeの結果を返します。

## 設定

frameworkは `axum`、`actix-web`、`tower-http`、`rocket` を選べ、未指定時は `axum` です。環境のrouteはmethodとpathが完全一致した最初のものを返します。`clear` はroute一覧を空にします。

axumにはbodyとheader、actixにはbodyと `extractors`、Rocketにはbodyとguard名配列を渡します。これらの値はhandlerへ自動で注入されません。handlerの引数はbodyだけで、headers、extractors、guardsは結果に記録するメタデータです。

## 結果の分岐

handler実行はstatus、body、method、path、durationを返します。axumは渡されたheader、actixはextractor、Rocketはguard名を結果に返します。成功は常に200、例外は500かつbody `null` です。例外はreasonで区別し、成功responseのbodyとして比較しないでください。

Tower traceはenteredとexitedを返します。handlerを省略した場合は `{ status: 200, body: null }` が終端responseです。middlewareの例外は捕捉しません。

## resilience補助

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は環境と独立したasync wrapperです。rate limitとcircuit breakerの状態は、返されたwrapperごとに保持されます。`batchOperate` は全itemを並列実行し、失敗したitemだけを `{ ok: false, error }` に変換します。

## 後始末と制約

環境、middleware、resilience wrapperはテストごとに用意してください。Rust compiler、実server、実middleware crateは起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| &#96;rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded&#96; | [packages/rust-lib/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L57) |
| 'circuit breaker open' | [packages/rust-lib/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L72) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchOperate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L111) `packages/rust-lib/src/resilience.ts`

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### `captureTowerMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L27) `packages/rust-lib/src/tower.ts`

tower-http middleware layer trace capture。 real tower の Service::call を chain させ、 entered / exited を record して middleware 実行順序を verify できる。

```ts
export declare function captureTowerMiddleware(options: CaptureTowerOptions): Promise<TowerTrace>;
```

#### `createRustAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L33) `packages/rust-lib/src/env.ts`

framework 別 route registry を持つ mock env。 real axum / actix / tower / rocket の router 相当を in-process で保持し、 method + path match で handler を dispatch する。

```ts
export declare function createRustAppEnv(options?: CreateRustAppEnvOptions): RustAppEnv;
```

#### `invokeActixHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L25) `packages/rust-lib/src/actix.ts`

actix-web handler mock invoke。 real actix の `async fn handler(...) -&gt; impl Responder` を TypeScript 側で模倣、 extractor 群 (web::Path / web::Json / web::Data) を Record として保持。

```ts
export declare function invokeActixHandler<TReq = unknown>(options: InvokeActixOptions<TReq>): Promise<InvokeActixResult>;
```

#### `invokeAxumHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L25) `packages/rust-lib/src/axum.ts`

axum handler mock invoke。 real axum の `async fn handler(...) -&gt; impl IntoResponse` を TypeScript 側で模倣、 body / headers / method / path を snapshot して結果を wrap。

```ts
export declare function invokeAxumHandler<TReq = unknown>(options: InvokeAxumOptions<TReq>): Promise<InvokeAxumResult>;
```

#### `invokeRocketRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L25) `packages/rust-lib/src/rocket.ts`

rocket route mock invoke。 real rocket の `#[get("/x")] fn route(...) -&gt; impl Responder` を TypeScript 側で模倣、 request guard 群を name 配列で保持して guard 通過を record。

```ts
export declare function invokeRocketRoute<TReq = unknown>(options: InvokeRocketOptions<TReq>): Promise<InvokeRocketResult>;
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L64) `packages/rust-lib/src/resilience.ts`

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L101) `packages/rust-lib/src/resilience.ts`

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L86) `packages/rust-lib/src/resilience.ts`

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L50) `packages/rust-lib/src/resilience.ts`

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L20) `packages/rust-lib/src/resilience.ts`

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L40) `packages/rust-lib/src/resilience.ts`

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### `ActixHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L1) `packages/rust-lib/src/actix.ts`

```ts
export type ActixHandler<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;
```

#### `AxumHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L1) `packages/rust-lib/src/axum.ts`

```ts
export type AxumHandler<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;
```

#### `BatchItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L17) `packages/rust-lib/src/resilience.ts`

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L18) `packages/rust-lib/src/resilience.ts`

```ts
export interface BatchResult {
    ok: boolean;
    output?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L11) `packages/rust-lib/src/resilience.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### `InvokeActixOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L3) `packages/rust-lib/src/actix.ts`

```ts
export interface InvokeActixOptions<TReq = unknown> {
    handler: ActixHandler<TReq, unknown>;
    method: string;
    path: string;
    body?: TReq;
    extractors?: Record<string, unknown>;
}
```

#### `InvokeActixResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L11) `packages/rust-lib/src/actix.ts`

```ts
export interface InvokeActixResult {
    status: number;
    body: unknown;
    method: string;
    path: string;
    extractors: Record<string, unknown>;
    durationMs: number;
    reason?: string;
}
```

#### `InvokeAxumOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L3) `packages/rust-lib/src/axum.ts`

```ts
export interface InvokeAxumOptions<TReq = unknown> {
    handler: AxumHandler<TReq, unknown>;
    method: string;
    path: string;
    body?: TReq;
    headers?: Record<string, string>;
}
```

#### `InvokeAxumResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L11) `packages/rust-lib/src/axum.ts`

```ts
export interface InvokeAxumResult {
    status: number;
    body: unknown;
    method: string;
    path: string;
    headers: Record<string, string>;
    durationMs: number;
    reason?: string;
}
```

#### `InvokeRocketOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L3) `packages/rust-lib/src/rocket.ts`

```ts
export interface InvokeRocketOptions<TReq = unknown> {
    route: RocketRoute<TReq, unknown>;
    method: string;
    path: string;
    body?: TReq;
    guards?: string[];
}
```

#### `InvokeRocketResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L11) `packages/rust-lib/src/rocket.ts`

```ts
export interface InvokeRocketResult {
    status: number;
    body: unknown;
    method: string;
    path: string;
    guardsPassed: string[];
    durationMs: number;
    reason?: string;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L12) `packages/rust-lib/src/resilience.ts`

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L10) `packages/rust-lib/src/resilience.ts`

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L4) `packages/rust-lib/src/resilience.ts`

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### `RocketRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L1) `packages/rust-lib/src/rocket.ts`

```ts
export type RocketRoute<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;
```

#### `RustAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L15) `packages/rust-lib/src/env.ts`

```ts
export interface RustAppEnv {
    framework: RustFramework;
    routes: RustRoute[];
    addRoute: (route: RustRoute) => void;
    matchRoute: (method: string, path: string) => RustRoute | undefined;
    listRoutes: () => RustRoute[];
    clear: () => void;
}
```

#### `RustFramework`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L1) `packages/rust-lib/src/env.ts`

```ts
export type RustFramework = 'axum' | 'actix-web' | 'tower-http' | 'rocket';
```

#### `RustResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L9) `packages/rust-lib/src/env.ts`

```ts
export interface RustResponse {
    status: number;
    body: unknown;
    headers: Record<string, string>;
}
```

#### `RustRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L3) `packages/rust-lib/src/env.ts`

```ts
export interface RustRoute {
    method: string;
    path: string;
    handler: (req: unknown) => Promise<unknown> | unknown;
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L9) `packages/rust-lib/src/resilience.ts`

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### `TowerMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L15) `packages/rust-lib/src/tower.ts`

```ts
export type TowerMiddleware = (req: TowerRequest, next: (req: TowerRequest) => Promise<{
    status: number;
    body: unknown;
}>) => Promise<{
    status: number;
    body: unknown;
}>;
```

#### `TowerRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L1) `packages/rust-lib/src/tower.ts`

```ts
export interface TowerRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: unknown;
}
```

#### `TowerTrace`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L8) `packages/rust-lib/src/tower.ts`

```ts
export interface TowerTrace {
    entered: string[];
    exited: string[];
    request: TowerRequest;
    response?: {
        status: number;
        body: unknown;
    };
}
```
<!-- kiwa-public-api:end -->
