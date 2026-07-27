# ruby リファレンス

## 公開 API

`createRubyAppEnv` は framework、route、session、cookie、ActiveRecord操作記録を持つ環境を作ります。`dispatchRailsRequest` は Rails風のbefore actionとactionを、`dispatchGenericRequest` は Sinatra、Roda、Hanami風のrouteを実行します。`renderERB` と `captureActiveRecord` は入力契約と操作記録を扱います。

## 設定

`framework` は `rails`、`sinatra`、`roda`、`hanami` を選べ、未指定時は `rails` です。`initialSession` と `initialCookies` は環境ごとに浅く複製されます。

generic route は環境作成時の `routes` または `env.addRoute` で登録します。methodは `GET`、`POST`、`PUT`、`PATCH`、`DELETE` だけです。pathは完全一致、または同数のsegmentからなる `:name` のワイルドカードで一致します。値の抽出やquery string解析は行いません。

## 結果の分岐

controller dispatch はresponse、`beforeActionCount`、空の`renderCalls`を返します。before action は登録順にawaitされ、いずれかがthrowするとactionは呼ばれず、その例外が伝わります。actionが返すcookieとsessionはresponseの値であり、環境へ自動反映されません。

generic dispatch は一致時に `{ matched: true }`、不一致時に `{ matched: false }` と404responseを返します。handlerの例外は捕捉しません。ActiveRecord capture はrecord済みqueryの順序と集計をsnapshotとして返すため、statusが成功でも余分な操作を検出できます。

## 表示と補助関数

`renderERB` は `<%= variable %>` のみを展開し、`html`、`variables`、`missing`を返します。未指定localは空文字になり、例外にはなりません。`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は環境と独立した非同期wrapperです。timeoutは元の処理をcancelせず、idempotencyは成功値のみをkeyごとにメモリへ保持します。

## 後始末と制約

環境はroute、session、cookie、操作記録を保持します。テストごとに作り直すか、`clear`で初期化してください。Ruby VM、Railsのcallback実装、実database、実template engineは起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `rate limit ${options.maxRequests}/${options.windowMs}ms exceeded` | [packages/ruby/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L57) |
| 'circuit breaker open' | [packages/ruby/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L72) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchOperate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L111) `packages/ruby/src/resilience.ts`

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### `captureActiveRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L23) `packages/ruby/src/active-record.ts`

activeRecordLog の集計 snapshot。 op 別 / model 別 count を assertion で使える shape で 露出、 「Post.where 3 回 + User.find 1 回」 等の invariant を書ける。

```ts
export declare function captureActiveRecord(env: RubyAppEnv): ActiveRecordSnapshot;
```

#### `createRubyAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L54) `packages/ruby/src/env.ts`

Framework 別の request 転送先を返す minimal mock。 Rails は Sinatra 系より complex な before_action chain を持つが、 統一 shape に落とせる範囲は同一 interface で扱う。

```ts
export declare function createRubyAppEnv(options?: CreateRubyAppEnvOptions): RubyAppEnv;
```

#### `dispatchGenericRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/generic.ts#L13) `packages/ruby/src/generic.ts`

Sinatra / Roda / Hanami の統一 request dispatch。 routes を lookup し、 matched なら handler 実行、 unmatched なら 404 相当 default response を返す。

```ts
export declare function dispatchGenericRequest(env: RubyAppEnv, req: RubyRequest): Promise<GenericDispatchResult>;
```

#### `dispatchRailsRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L37) `packages/ruby/src/rails.ts`

Rails controller の dispatch simulation。 before_action → action → render の chain を 順に走らせ、 redirect_to() 相当は throw で捕捉する。 実 Rails の render 経路 (json / text / partial) を統一 shape で捕捉して assertion 用に露出する。

```ts
export declare function dispatchRailsRequest(env: RubyAppEnv, req: RubyRequest, controller: RailsControllerAction): Promise<RailsDispatchResult>;
```

#### `renderERB`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts#L13) `packages/ruby/src/erb.ts`

ERB `&lt;%= name %&gt;` interpolation の minimal mock。 実 ERB engine の control flow (`&lt;% if %&gt;` 等) は未対応、 pure variable substitution のみ。

```ts
export declare function renderERB(template: string, locals: ERBLocals): ERBRenderResult;
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L64) `packages/ruby/src/resilience.ts`

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L101) `packages/ruby/src/resilience.ts`

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L86) `packages/ruby/src/resilience.ts`

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L50) `packages/ruby/src/resilience.ts`

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L20) `packages/ruby/src/resilience.ts`

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L40) `packages/ruby/src/resilience.ts`

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### `ActiveRecordOp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L3) `packages/ruby/src/active-record.ts`

```ts
export type ActiveRecordOp = 'find' | 'where' | 'create' | 'update' | 'destroy' | 'all';
```

#### `ActiveRecordQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L5) `packages/ruby/src/active-record.ts`

```ts
export interface ActiveRecordQuery {
    op: ActiveRecordOp;
    model: string;
    args: unknown;
    sql?: string;
}
```

#### `ActiveRecordSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L12) `packages/ruby/src/active-record.ts`

```ts
export interface ActiveRecordSnapshot {
    total: number;
    byOp: Record<ActiveRecordOp, number>;
    byModel: Record<string, number>;
    queries: ActiveRecordQuery[];
}
```

#### `BatchItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L17) `packages/ruby/src/resilience.ts`

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L18) `packages/ruby/src/resilience.ts`

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

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L11) `packages/ruby/src/resilience.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### `CreateRubyAppEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L31) `packages/ruby/src/env.ts`

```ts
export interface CreateRubyAppEnvOptions {
    framework?: RubyFramework;
    routes?: RubyRoute[];
    initialSession?: Record<string, unknown>;
    initialCookies?: Record<string, string>;
}
```

#### `ERBLocals`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts#L1) `packages/ruby/src/erb.ts`

```ts
export type ERBLocals = Record<string, string | number | boolean>;
```

#### `ERBRenderResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts#L3) `packages/ruby/src/erb.ts`

```ts
export interface ERBRenderResult {
    html: string;
    variables: string[];
    missing: string[];
}
```

#### `GenericDispatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/generic.ts#L3) `packages/ruby/src/generic.ts`

```ts
export interface GenericDispatchResult {
    response: RubyResponse;
    matched: boolean;
    framework: RubyAppEnv['framework'];
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L12) `packages/ruby/src/resilience.ts`

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `RailsControllerAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L18) `packages/ruby/src/rails.ts`

```ts
export interface RailsControllerAction {
    render?: (call: Omit<RailsRenderCall, 'status'> & {
        status?: number;
    }) => RubyResponse;
    redirectTo?: (url: string, status?: number) => never;
    beforeActions?: Array<(req: RubyRequest, env: RubyAppEnv) => void | Promise<void>>;
    action: (req: RubyRequest, env: RubyAppEnv) => RubyResponse | Promise<RubyResponse>;
}
```

#### `RailsDispatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L25) `packages/ruby/src/rails.ts`

```ts
export interface RailsDispatchResult {
    response: RubyResponse;
    redirect?: RailsRedirectSignal;
    renderCalls: RailsRenderCall[];
    beforeActionCount: number;
}
```

#### `RailsRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L5) `packages/ruby/src/rails.ts`

```ts
export interface RailsRedirectSignal {
    readonly [RAILS_REDIRECT_SYMBOL]: true;
    url: string;
    status: number;
}
```

#### `RailsRenderCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L11) `packages/ruby/src/rails.ts`

```ts
export interface RailsRenderCall {
    template?: string;
    json?: unknown;
    text?: string;
    status: number;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L10) `packages/ruby/src/resilience.ts`

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L4) `packages/ruby/src/resilience.ts`

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### `RubyAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L38) `packages/ruby/src/env.ts`

```ts
export interface RubyAppEnv {
    framework: RubyFramework;
    routes: RubyRoute[];
    session: Record<string, unknown>;
    cookies: Record<string, string>;
    activeRecordLog: ActiveRecordQuery[];
    addRoute: (route: RubyRoute) => void;
    matchRoute: (method: RubyRequest['method'], path: string) => RubyRoute | undefined;
    recordAR: (query: ActiveRecordQuery) => void;
    clear: () => void;
}
```

#### `RubyFramework`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L3) `packages/ruby/src/env.ts`

```ts
export type RubyFramework = 'rails' | 'sinatra' | 'roda' | 'hanami';
```

#### `RubyRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L5) `packages/ruby/src/env.ts`

```ts
export interface RubyRequest {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: unknown;
    session?: Record<string, unknown>;
}
```

#### `RubyResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L15) `packages/ruby/src/env.ts`

```ts
export interface RubyResponse {
    status: number;
    body: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    session: Record<string, unknown>;
}
```

#### `RubyRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L25) `packages/ruby/src/env.ts`

```ts
export interface RubyRoute {
    method: RubyRequest['method'];
    path: string;
    handler: RubyRouteHandler;
}
```

#### `RubyRouteHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L23) `packages/ruby/src/env.ts`

```ts
export type RubyRouteHandler = (req: RubyRequest, env: RubyAppEnv) => RubyResponse | Promise<RubyResponse>;
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L9) `packages/ruby/src/resilience.ts`

```ts
export interface TimeoutOptions {
    ms: number;
}
```
<!-- kiwa-public-api:end -->
