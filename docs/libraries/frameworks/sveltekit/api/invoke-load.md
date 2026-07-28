---
title: "@kiwa-lab/sveltekit invoke-load の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/sveltekit</code> <code v-pre>invoke-load</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>error</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L116) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export declare function error(status: number, message: string): SvelteKitErrorSignal;
```

#### <code v-pre>invokeLoad</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L65) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export declare function invokeLoad<TResult = unknown>(opts: InvokeLoadOptions<TResult>): Promise<InvokeLoadResult<TResult>>;
```

#### <code v-pre>redirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L112) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export declare function redirect(status: number, location: string): SvelteKitRedirectSignal;
```

#### <code v-pre>SK&#95;ERROR&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L9) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export declare const SK_ERROR_SYMBOL: unique symbol;
```

#### <code v-pre>SK&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L8) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export declare const SK_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>InvokeLoadOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L39) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export interface InvokeLoadOptions<TResult = unknown> {
    readonly load: LoadFunction<TResult>;
    readonly url: string;
    readonly params?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly locals?: Record<string, unknown>;
    readonly fetch?: typeof globalThis.fetch;
}
```

#### <code v-pre>InvokeLoadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L48) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export interface InvokeLoadResult<TResult = unknown> {
    readonly data: TResult | undefined;
    readonly redirect: SvelteKitRedirectSignal | null;
    readonly error: SvelteKitErrorSignal | unknown;
    readonly env: {
        readonly responseHeaders: Map<string, string>;
        readonly cookies: Map<string, string>;
    };
}
```

#### <code v-pre>LoadFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L37) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export type LoadFunction<TResult = unknown> = (event: SimulatedLoadEvent) => Promise<TResult> | TResult;
```

#### <code v-pre>SimulatedLoadEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L23) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export interface SimulatedLoadEvent {
    readonly url: URL;
    readonly params: Readonly<Record<string, string>>;
    readonly cookies: {
        get(name: string): string | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string): void;
        getAll(): Array<[string, string]>;
    };
    readonly fetch: typeof globalThis.fetch;
    readonly locals: Record<string, unknown>;
    setHeaders(headers: Record<string, string>): void;
}
```

#### <code v-pre>SvelteKitErrorSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L17) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export interface SvelteKitErrorSignal {
    readonly [SK_ERROR_SYMBOL]: true;
    readonly status: number;
    readonly body: {
        readonly message: string;
    } | string;
}
```

#### <code v-pre>SvelteKitRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-load.ts#L11) <code v-pre>packages/sveltekit/src/invoke-load.ts</code>

```ts
export interface SvelteKitRedirectSignal {
    readonly [SK_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
}
```
