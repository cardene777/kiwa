---
title: "@kiwa-lab/remix invoke-route の API 契約"
---

# <code v-pre>@kiwa-lab/remix</code> <code v-pre>invoke-route</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

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

### 型

#### <code v-pre>ActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L24) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export type ActionFunction<TResult = unknown> = (args: SimulatedRouteArgs) => Promise<TResult> | TResult;
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

#### <code v-pre>RemixRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L11) <code v-pre>packages/remix/src/invoke-route.ts</code>

```ts
export interface RemixRedirectSignal {
    readonly [REMIX_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
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
