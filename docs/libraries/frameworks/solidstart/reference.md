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

#### <code v-pre>invokeApiRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L61) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export declare function invokeApiRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(opts: InvokeApiRouteOptions<TParams>): Promise<InvokeApiRouteResult>;
```

#### <code v-pre>invokeServerFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L51) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

Invoke a SolidStart server function in isolation and capture its return value + redirect signal. Headers / cookies are exposed for assertion but the function itself receives them via the args contract (kiwa stays minimal: pass any context the function needs through `args`).

```ts
export declare function invokeServerFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown>(opts: InvokeServerFunctionOptions<TArgs, TResult>): Promise<InvokeServerFunctionResult<TResult>>;
```

#### <code v-pre>json</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L95) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export declare function json<T>(body: T, init?: ResponseInit): Response;
```

#### <code v-pre>redirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L80) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export declare function redirect(url: string, status?: number): SolidStartRedirectSignal;
```

#### <code v-pre>redirectResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L101) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export declare function redirectResponse(location: string, status?: number): Response;
```

#### <code v-pre>SOLIDSTART&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L8) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export declare const SOLIDSTART_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>APIRouteHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L15) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export type APIRouteHandler<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (event: SimulatedAPIEvent<TParams>) => Promise<Response> | Response;
```

#### <code v-pre>InvokeApiRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L19) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

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

#### <code v-pre>InvokeApiRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L30) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export interface InvokeApiRouteResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
}
```

#### <code v-pre>InvokeServerFunctionOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L20) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export interface InvokeServerFunctionOptions<TArgs extends readonly unknown[], TResult> {
    readonly fn: ServerFunctionFunction<TArgs, TResult>;
    readonly args?: TArgs;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
}
```

#### <code v-pre>InvokeServerFunctionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L27) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

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

#### <code v-pre>ServerFunctionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L16) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export type ServerFunctionFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown> = (...args: TArgs) => Promise<TResult> | TResult;
```

#### <code v-pre>SimulatedAPIEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-api-route.ts#L8) <code v-pre>packages/solidstart/src/invoke-api-route.ts</code>

```ts
export interface SimulatedAPIEvent<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly request: Request;
    readonly params: TParams;
    readonly locals: Record<string, unknown>;
    readonly nativeEvent: Record<string, unknown>;
}
```

#### <code v-pre>SolidStartRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L10) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export interface SolidStartRedirectSignal {
    readonly [SOLIDSTART_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```
<!-- kiwa-public-api:end -->
