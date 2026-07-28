# remix リファレンス

## 公開 API

`invokeLoader` と `invokeAction` は route function を実行します。`json` と `redirect` は Response を作ります。`invokeResourceRoute` は HTTP method ごとの Resource Route を扱います。`setupRemixNestedRouteEnv`、`defer`、`resolveDeferred` は nested loader と遅延データを扱います。

## 設定

loader と action は URL、params、context、headers を受け取ります。action は formData または jsonBody を受け取ります。JSON Response は response として保持され、redirect Response は redirect に正規化されます。

## 結果の分岐

loader と action は result、Response、redirect、error を区別します。`undefined` の戻りは通常 data ではないため、loader の実装漏れとして error を確認します。

Resource Route の結果には通常の route 結果に加え、`dispatch` と `methodNotAllowed` が入ります。405 の allow list は loader の有無で GET、HEAD、action の有無で POST、PUT、PATCH、DELETE を含みます。

`setupRemixNestedRouteEnv` は parent と child の loader chain、headers、cookie store を提供します。`defer` は immediate data、pending promise、ResponseInit を保持し、`resolveDeferred` は resolved と rejected key を報告します。実 server streaming や React rendering は対象外です。

## 後始末と制約

request と context は呼び出しごとに作られます。`undefined` loader return はエラー、`null` は許可されます。Remix server、実 cookie session、ブラウザ遷移は起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>LOADER&#95;UNDEFINED&#95;RETURN&#95;MESSAGE</code> | [packages/remix/src/invoke-route.ts](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L127) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>defer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L423) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export declare function defer<TData extends Record<string, unknown>>(data: TData, init?: ResponseInit): DeferredData<TData>;
```

#### <code v-pre>DEFERRED&#95;DATA&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L415) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

defer() 互換 — `Record&lt;string, T | Promise&lt;T&gt;&gt;` を返す helper。 Remix 公式 `defer()` の TypedDeferredData と異なり、 kiwa は real Promise をそのまま保持し、 `resolveDeferred()` で deterministic に全 Promise を await する。

```ts
export declare const DEFERRED_DATA_SYMBOL: unique symbol;
```

#### <code v-pre>invokeAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L138) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export declare function invokeAction(opts: InvokeActionOptions): Promise<InvokeRouteResult>;
```

#### <code v-pre>invokeLoader</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L111) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export declare function invokeLoader(opts: InvokeLoaderOptions): Promise<InvokeRouteResult>;
```

#### <code v-pre>invokeResourceRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L76) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

Resource Route dispatcher — picks `loader` for GET/HEAD and `action` for POST/PUT/PATCH/DELETE. Method is required (no implicit default) because Resource Routes intentionally rely on HTTP semantics to choose behavior. Methods not implemented by the route module return a 405 Response and a branded `methodNotAllowed` signal so tests can assert dispatch behavior without conflating it with the route's own 4xx responses.

```ts
export declare function invokeResourceRoute(opts: InvokeResourceRouteOptions): Promise<InvokeResourceRouteResult>;
```

#### <code v-pre>isDeferred</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L432) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export declare function isDeferred(value: unknown): value is DeferredData<Record<string, unknown>>;
```

#### <code v-pre>json</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L160) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export declare function json<T>(body: T, init?: ResponseInit): Response;
```

#### <code v-pre>redirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L156) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export declare function redirect(location: string, status?: number): Response;
```

#### <code v-pre>REMIX&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L9) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export declare const REMIX_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>resolveDeferred</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L448) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

defer() の値を全て deterministic に await。 settled Promise (resolved / rejected) を一括追跡、 errors map で個別 rejection を assertion 可能。 pendingKeys は 起動時に既に Promise だった key (= 「streaming で resolve した」 key) を保持する。

```ts
export declare function resolveDeferred<TData extends Record<string, unknown>>(deferred: DeferredData<TData>): Promise<ResolveDeferredResult<TData>>;
```

#### <code v-pre>RESOURCE&#95;ROUTE&#95;METHOD&#95;NOT&#95;ALLOWED&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L25) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export declare const RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL: unique symbol;
```

#### <code v-pre>setupRemixNestedRouteEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L321) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export declare function setupRemixNestedRouteEnv(options: SetupRemixNestedRouteEnvOptions): RemixNestedRouteEnv;
```

### 型

#### <code v-pre>ActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L24) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export type ActionFunction<TResult = unknown> = (args: SimulatedRouteArgs) => Promise<TResult> | TResult;
```

#### <code v-pre>DeferredData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L417) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface DeferredData<TData extends Record<string, unknown>> {
    readonly [DEFERRED_DATA_SYMBOL]: true;
    readonly data: TData;
    readonly init?: ResponseInit;
}
```

#### <code v-pre>InvokeActionOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L35) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export interface InvokeActionOptions {
    readonly action: ActionFunction;
    readonly url: string;
    readonly params?: Record<string, string>;
    readonly context?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly method?: string;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
}
```

#### <code v-pre>InvokeLoaderOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L26) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export interface InvokeLoaderOptions {
    readonly loader: LoaderFunction;
    readonly url: string;
    readonly params?: Record<string, string>;
    readonly context?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly method?: string;
}
```

#### <code v-pre>InvokeResourceRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L38) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface InvokeResourceRouteOptions {
    readonly route: ResourceRouteModule;
    readonly url: string;
    readonly method: string;
    readonly params?: Record<string, string>;
    readonly context?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
}
```

#### <code v-pre>InvokeResourceRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L49) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface InvokeResourceRouteResult extends InvokeRouteResult {
    readonly dispatch: 'loader' | 'action' | 'method-not-allowed';
    readonly methodNotAllowed: ResourceRouteMethodNotAllowedSignal | null;
}
```

#### <code v-pre>InvokeRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L46) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export interface InvokeRouteResult {
    readonly result: unknown;
    readonly response: Response | null;
    readonly redirect: RemixRedirectSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>LoaderFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L23) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export type LoaderFunction<TResult = unknown> = (args: SimulatedRouteArgs) => Promise<TResult> | TResult;
```

#### <code v-pre>RemixNestedRouteDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L36) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RemixNestedRouteDefinition<TResult = unknown> {
    readonly id: string;
    readonly loader?: LoaderFunction<TResult>;
    readonly headers?: RemixNestedRouteHeadersFunction;
}
```

#### <code v-pre>RemixNestedRouteEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L62) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RemixNestedRouteEnv {
    readonly cookies: Map<string, string>;
    /** parent → child loader chain を 1 request で順次 invoke、 child は parent の result を context.parentData として受け取る */
    runLoaderChain(): Promise<RunLoaderChainResult>;
    /** cookies / locals を初期 snapshot に戻す (同 env を別 test で再利用するため) */
    reset(): void;
}
```

#### <code v-pre>RemixNestedRouteHeadersArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L25) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RemixNestedRouteHeadersArgs {
    readonly loaderHeaders: Headers;
    readonly parentHeaders: Headers;
    readonly actionHeaders: Headers;
    readonly errorHeaders?: Headers | undefined;
}
```

#### <code v-pre>RemixNestedRouteHeadersFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L32) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export type RemixNestedRouteHeadersFunction = ((args: RemixNestedRouteHeadersArgs) => HeadersInit) | HeadersInit;
```

#### <code v-pre>RemixRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L11) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export interface RemixRedirectSignal {
    readonly [REMIX_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
}
```

#### <code v-pre>ResolveDeferredResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L436) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface ResolveDeferredResult<TData extends Record<string, unknown>> {
    readonly resolved: {
        [K in keyof TData]: Awaited<TData[K]>;
    };
    readonly pendingKeys: ReadonlyArray<keyof TData>;
    readonly errors: {
        readonly [K in keyof TData]?: unknown;
    };
    readonly init?: ResponseInit;
}
```

#### <code v-pre>ResourceRouteMethodNotAllowedSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L27) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface ResourceRouteMethodNotAllowedSignal {
    readonly [RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL]: true;
    readonly method: string;
    readonly allow: ReadonlyArray<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
}
```

#### <code v-pre>ResourceRouteModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L33) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface ResourceRouteModule {
    readonly loader?: LoaderFunction;
    readonly action?: ActionFunction;
}
```

#### <code v-pre>RunLoaderChainResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L53) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface RunLoaderChainResult {
    readonly parent: InvokeRouteResult;
    readonly child: InvokeRouteResult;
    readonly parentLoaderHeaders: Headers;
    readonly childLoaderHeaders: Headers;
    readonly mergedHeaders: Headers;
    readonly cookies: Map<string, string>;
}
```

#### <code v-pre>SetupRemixNestedRouteEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/setup-nested-route-env.ts#L42) <code v-pre>packages/remix/src/setup-nested-route-env.ts</code>

```ts
export interface SetupRemixNestedRouteEnvOptions {
    readonly parentRoute: RemixNestedRouteDefinition;
    readonly childRoute: RemixNestedRouteDefinition;
    readonly url: string;
    readonly params?: Record<string, string>;
    readonly context?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly method?: string;
}
```

#### <code v-pre>SimulatedRouteArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L17) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export interface SimulatedRouteArgs<TContext = Record<string, unknown>> {
    readonly request: Request;
    readonly params: Readonly<Record<string, string>>;
    readonly context: TContext;
}
```
<!-- kiwa-public-api:end -->
