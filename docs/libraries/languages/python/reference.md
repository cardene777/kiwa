# python リファレンス

## 公開 API

`createPythonAppEnv` は framework、route、template、middleware、呼び出し履歴を持つ環境を作ります。`dispatchRequest` は route を実行し、`renderTemplate` は登録済みtemplateを展開し、`captureMiddlewareCall` は呼び出し履歴のコピーを返します。

## 設定

`framework` は `django`、`flask`、`fastapi`、`starlette` を選べます。未指定時は `flask` です。`mode` を省略すると Django と Flask は `wsgi`、FastAPI と Starlette は `asgi` になります。`mode` は明示指定で上書きできます。

route は `env.registerRoute(method, path, handler)`、middleware は `env.registerMiddleware(entry)`、template は `env.registerTemplate(name, template)` で設定します。同一の method と path、または同一template名を再登録すると、後の登録が前を置き換えます。middlewareだけは置き換えず末尾へ追加します。

## 結果の分岐

route dispatch は handler の `PythonResponse` を返します。handlerがない場合だけ定型の404を返し、handlerやmiddlewareの例外は捕捉しません。requestの `headers`、`body`、`query` は変換されずそのままhandlerへ渡ります。

template描画は `html`、検出した `variables`、不足した `missing` を返します。対応する記法は `&#123;&#123; identifier &#125;&#125;` と `&#123;&#123; dotted.name &#125;&#125;` だけです。filter、条件分岐、loop、HTML escapeは実装しません。未登録templateは `template not found: <name>` をthrowします。

## resilience補助

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は、引数なしの非同期関数を包む独立した補助関数です。Python app env へ自動登録はしません。

`withTimeout` は時間切れ後も元の処理をcancelしません。`withIdempotencyKey` は成功した値だけをkeyごとにメモリへ保存します。`withRateLimit` と `withCircuitBreaker` の状態も、返されたwrapperの寿命に限られます。`batchOperate` は全itemを並列実行し、失敗したitemだけ `{ ok: false, error }` に変換します。

## 後始末と制約

環境はテストごとに作り、Python interpreter、WSGI、ASGI、実framework、実ネットワークは起動しません。フレームワーク固有のルーティング、template機能、例外変換を確認する用途には使わないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `rate limit ${options.maxRequests}/${options.windowMs}ms exceeded` | [packages/python/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L57) |
| 'circuit breaker open' | [packages/python/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L72) |
| `template not found: ${name}` | [packages/python/src/template.ts](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L18) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/python/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchOperate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L111) `packages/python/src/resilience.ts`

```ts
export async function batchOperate<TIn, TOut>(
  items: readonly BatchItem<TIn>[],
  runner: (item: BatchItem<TIn>) => Promise<TOut>,
): Promise<BatchResult[]>;
```

#### `captureMiddlewareCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/middleware.ts#L13) `packages/python/src/middleware.ts`

dispatch 経由で invoke された middleware の呼出履歴を返す。 middleware chain の順序 / 呼出回数 / 対象 path を assertion するための API。

```ts
export function captureMiddlewareCall(env: PythonAppEnv): MiddlewareCall[];
```

#### `createPythonAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L35) `packages/python/src/env.ts`

framework 別 mock env を返す。 real Django/Flask/FastAPI/Starlette の request pipeline を再現する in-process env。 django/flask = WSGI default、 fastapi/starlette = ASGI default (option で override 可能)。

```ts
export function createPythonAppEnv(options: CreatePythonAppEnvOptions = {}): PythonAppEnv;
```

#### `dispatchRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L23) `packages/python/src/dispatch.ts`

WSGI/ASGI request-response cycle を in-process で dispatch。 middleware chain を 順次実行 → route handler にたどり着き response を返す。 route 未登録は 404。

```ts
export async function dispatchRequest(env: PythonAppEnv, request: PythonRequest): Promise<PythonResponse>;
```

#### `renderTemplate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L15) `packages/python/src/template.ts`

Jinja2 相当の `&#123;&#123; var &#125;&#125;` interpolation。 template を env に register してから name 指定で render。 real Jinja2 の filter / for loop は含まない minimal 実装。

```ts
export function renderTemplate(env: PythonAppEnv, name: string, context: TemplateContext): TemplateRenderResult;
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L64) `packages/python/src/resilience.ts`

```ts
export function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L101) `packages/python/src/resilience.ts`

```ts
export function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L86) `packages/python/src/resilience.ts`

```ts
export function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L50) `packages/python/src/resilience.ts`

```ts
export function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L20) `packages/python/src/resilience.ts`

```ts
export function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L40) `packages/python/src/resilience.ts`

```ts
export function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### `BatchItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L17) `packages/python/src/resilience.ts`

```ts
export interface BatchItem<TIn = unknown> { name: string; input: TIn; }
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L18) `packages/python/src/resilience.ts`

```ts
export interface BatchResult { ok: boolean; output?: unknown; error?: { code: string; message: string }; }
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L11) `packages/python/src/resilience.ts`

```ts
export interface CircuitBreakerOptions { failureThreshold: number; resetMs: number; }
```

#### `CreatePythonAppEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L24) `packages/python/src/env.ts`

```ts
export interface CreatePythonAppEnvOptions {
  framework?: PythonFramework;
  mode?: PythonMode;
  now?: () => number;
}
```

#### `MiddlewareCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/middleware.ts#L3) `packages/python/src/middleware.ts`

```ts
export interface MiddlewareCall {
  name: string;
  path: string;
  at: number;
}
```

#### `MiddlewareEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L7) `packages/python/src/env.ts`

```ts
export interface MiddlewareEntry {
  name: string;
  handler: (req: PythonRequest, next: () => Promise<PythonResponse>) => Promise<PythonResponse>;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L12) `packages/python/src/resilience.ts`

```ts
export interface ObservabilityHook {
  onStart?: (name: string, input?: unknown) => void;
  onSuccess?: (name: string, output: unknown, durationMs: number) => void;
  onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `PythonAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L12) `packages/python/src/env.ts`

```ts
export interface PythonAppEnv {
  framework: PythonFramework;
  mode: PythonMode;
  routes: Map<string, (req: PythonRequest) => Promise<PythonResponse>>;
  middleware: MiddlewareEntry[];
  templates: Map<string, string>;
  middlewareCalls: Array<{ name: string; path: string; at: number }>;
  registerRoute: (method: string, path: string, handler: (req: PythonRequest) => Promise<PythonResponse>) => void;
  registerMiddleware: (entry: MiddlewareEntry) => void;
  registerTemplate: (name: string, tmpl: string) => void;
}
```

#### `PythonFramework`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L3) `packages/python/src/env.ts`

```ts
export type PythonFramework = 'django' | 'flask' | 'fastapi' | 'starlette';
```

#### `PythonHeaders`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L3) `packages/python/src/dispatch.ts`

```ts
export type PythonHeaders = Record<string, string>;
```

#### `PythonMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L5) `packages/python/src/env.ts`

```ts
export type PythonMode = 'wsgi' | 'asgi';
```

#### `PythonRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L5) `packages/python/src/dispatch.ts`

```ts
export interface PythonRequest {
  method: string;
  path: string;
  headers?: PythonHeaders;
  body?: string;
  query?: Record<string, string>;
}
```

#### `PythonResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L13) `packages/python/src/dispatch.ts`

```ts
export interface PythonResponse {
  status: number;
  headers: PythonHeaders;
  body: string;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L10) `packages/python/src/resilience.ts`

```ts
export interface RateLimitOptions { maxRequests: number; windowMs: number; }
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L4) `packages/python/src/resilience.ts`

```ts
export interface RetryOptions {
  maxAttempts: number;
  backoffMs?: number;
  retryOn?: (err: unknown) => boolean;
}
```

#### `TemplateContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L3) `packages/python/src/template.ts`

```ts
export type TemplateContext = Record<string, string | number | boolean>;
```

#### `TemplateRenderResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L5) `packages/python/src/template.ts`

```ts
export interface TemplateRenderResult {
  html: string;
  variables: string[];
  missing: string[];
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L9) `packages/python/src/resilience.ts`

```ts
export interface TimeoutOptions { ms: number; }
```
<!-- kiwa-public-api:end -->
