---
title: "@kiwa-lab/solidstart invoke-server-function の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/solidstart</code> <code v-pre>invoke-server-function</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeServerFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L51) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

Invoke a SolidStart server function in isolation and capture its return value + redirect signal. Headers / cookies are exposed for assertion but the function itself receives them via the args contract (kiwa stays minimal: pass any context the function needs through `args`).

```ts
export declare function invokeServerFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown>(opts: InvokeServerFunctionOptions<TArgs, TResult>): Promise<InvokeServerFunctionResult<TResult>>;
```

#### <code v-pre>redirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L80) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export declare function redirect(url: string, status?: number): SolidStartRedirectSignal;
```

#### <code v-pre>SOLIDSTART&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L8) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export declare const SOLIDSTART_REDIRECT_SYMBOL: unique symbol;
```

### 型

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

#### <code v-pre>SolidStartRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/invoke-server-function.ts#L10) <code v-pre>packages/solidstart/src/invoke-server-function.ts</code>

```ts
export interface SolidStartRedirectSignal {
    readonly [SOLIDSTART_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```
