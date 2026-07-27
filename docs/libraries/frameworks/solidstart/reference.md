# solidstart リファレンス

## server function

`invokeServerFunction` は `fn` と `args` を直接実行します。結果は `result`、`redirect`、`error`、小文字化された request headers と cookie Map を持つ `env` です。

`redirect(url, status)` は `SOLIDSTART_REDIRECT_SYMBOL` を持つ signal を返します。function がこれを throw した場合だけ `redirect` になります。

## API route

`invokeApiRoute` は handler、absolute URL、method、params、headers、formData、jsonBody、locals を受け取ります。event は Request、params、locals、空 object の nativeEvent を持ちます。

| body | 既定 method |
| --- | --- |
| なし | GET |
| formData | POST |
| jsonBody | POST |

`json` は JSON content type を補い、`redirectResponse` は location header を持つ Response を作ります。3xx Response は `redirect` に記録されますが、API handler の例外は捕捉されません。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `invokeApiRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L61) `packages/solidstart/src/invoke-api-route.ts`

```ts
export declare function invokeApiRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(opts: InvokeApiRouteOptions<TParams>): Promise<InvokeApiRouteResult>;
```

#### `invokeServerFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L51) `packages/solidstart/src/invoke-server-function.ts`

Invoke a SolidStart server function in isolation and capture its return value + redirect signal. Headers / cookies are exposed for assertion but the function itself receives them via the args contract (kiwa stays minimal: pass any context the function needs through `args`).

```ts
export declare function invokeServerFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown>(opts: InvokeServerFunctionOptions<TArgs, TResult>): Promise<InvokeServerFunctionResult<TResult>>;
```

#### `json`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L95) `packages/solidstart/src/invoke-api-route.ts`

```ts
export declare function json<T>(body: T, init?: ResponseInit): Response;
```

#### `redirect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L80) `packages/solidstart/src/invoke-server-function.ts`

```ts
export declare function redirect(url: string, status?: number): SolidStartRedirectSignal;
```

#### `redirectResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L101) `packages/solidstart/src/invoke-api-route.ts`

```ts
export declare function redirectResponse(location: string, status?: number): Response;
```

#### `SOLIDSTART_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L8) `packages/solidstart/src/invoke-server-function.ts`

```ts
export declare const SOLIDSTART_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### `APIRouteHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L15) `packages/solidstart/src/invoke-api-route.ts`

```ts
export type APIRouteHandler<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (event: SimulatedAPIEvent<TParams>) => Promise<Response> | Response;
```

#### `InvokeApiRouteOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L19) `packages/solidstart/src/invoke-api-route.ts`

```ts
export interface InvokeApiRouteOptions<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly handler: APIRouteHandler<TParams>;
    readonly url: string;
    readonly method?: string;
    readonly params?: TParams;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
    readonly locals?: Record<string, unknown>;
}
```

#### `InvokeApiRouteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L30) `packages/solidstart/src/invoke-api-route.ts`

```ts
export interface InvokeApiRouteResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
}
```

#### `InvokeServerFunctionOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L20) `packages/solidstart/src/invoke-server-function.ts`

```ts
export interface InvokeServerFunctionOptions<TArgs extends readonly unknown[], TResult> {
    readonly fn: ServerFunctionFunction<TArgs, TResult>;
    readonly args?: TArgs;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
}
```

#### `InvokeServerFunctionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L27) `packages/solidstart/src/invoke-server-function.ts`

```ts
export interface InvokeServerFunctionResult<TResult> {
    readonly result: TResult | undefined;
    readonly redirect: SolidStartRedirectSignal | null;
    readonly error: unknown;
    readonly env: {
        readonly requestHeaders: Map<string, string>;
        readonly requestCookies: Map<string, string>;
    };
}
```

#### `ServerFunctionFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L16) `packages/solidstart/src/invoke-server-function.ts`

```ts
export type ServerFunctionFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown> = (...args: TArgs) => Promise<TResult> | TResult;
```

#### `SimulatedAPIEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L8) `packages/solidstart/src/invoke-api-route.ts`

```ts
export interface SimulatedAPIEvent<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly request: Request;
    readonly params: TParams;
    readonly locals: Record<string, unknown>;
    readonly nativeEvent: Record<string, unknown>;
}
```

#### `SolidStartRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L10) `packages/solidstart/src/invoke-server-function.ts`

```ts
export interface SolidStartRedirectSignal {
    readonly [SOLIDSTART_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```
<!-- kiwa-public-api:end -->
