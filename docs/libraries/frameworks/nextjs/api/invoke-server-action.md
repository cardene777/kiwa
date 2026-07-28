---
title: "@kiwa-lab/nextjs invoke-server-action の API 契約"
---

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>invoke-server-action</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeServerAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L99) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

Invoke a Next.js Server Action in isolation and capture its side-effects. The action is called as `await action(formData, ...args)`. The kiwa helper does NOT monkey-patch global `next/navigation` / `next/headers` / `next/cache` imports. Instead the action under test should accept its dependencies via an injectable seam (a parameter or a module-level setter) so tests stay deterministic. See `examples/nextjs-server-actions-poc/` for the pattern.

```ts
export declare function invokeServerAction<TResult>(opts: ServerActionInvocation<TResult>): Promise<ServerActionResult<TResult>>;
```

#### <code v-pre>REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L14) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export declare const REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>CookieJar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L22) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface CookieJar {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
    entries(): Array<[string, string]>;
}
```

#### <code v-pre>RedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L16) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface RedirectSignal {
    readonly [REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly type: 'replace' | 'push';
}
```

#### <code v-pre>ServerActionEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L29) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface ServerActionEnv {
    readonly cookies: CookieJar;
    readonly headers: Map<string, string>;
    readonly revalidated: {
        paths: string[];
        tags: string[];
    };
    readonly redirect: RedirectSignal | null;
}
```

#### <code v-pre>ServerActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L40) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export type ServerActionFunction<TResult> = (...args: any[]) => Promise<TResult> | TResult;
```

#### <code v-pre>ServerActionInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L42) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface ServerActionInvocation<TResult> {
    /** The `'use server'` async function under test. */
    readonly action: ServerActionFunction<TResult>;
    /** Optional FormData first argument (default empty). */
    readonly formData?: FormData;
    /** Extra positional args appended after FormData (e.g. previous state for useFormState). */
    readonly args?: unknown[];
    /** Initial cookie jar entries (name → value). */
    readonly cookies?: Record<string, string>;
    /** Initial request headers (case-insensitive). */
    readonly headers?: Record<string, string>;
}
```

#### <code v-pre>ServerActionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L55) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface ServerActionResult<TResult> {
    /** Resolved return value (or `undefined` if the action threw a redirect signal). */
    readonly result: TResult | undefined;
    /** Error thrown by the action (excluding redirect signals which are normalized). */
    readonly error: unknown;
    /** Side-effects captured during the invocation. */
    readonly env: ServerActionEnv;
}
```
