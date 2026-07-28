---
title: "@kiwa-lab/nuxt invoke-event-handler の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nuxt</code> <code v-pre>invoke-event-handler</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeEventHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L87) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

Invoke a Nuxt `defineEventHandler` callback in isolation and capture its return value + redirect signal + response headers / cookies / status.

```ts
export declare function invokeEventHandler<TResult = unknown>(opts: InvokeEventHandlerOptions<TResult>): Promise<InvokeEventHandlerResult<TResult>>;
```

#### <code v-pre>NUXT&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L14) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export declare const NUXT_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>EventHandlerEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L36) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export interface EventHandlerEnv {
    readonly responseHeaders: Map<string, string>;
    readonly responseCookies: Map<string, string>;
    status: number;
}
```

#### <code v-pre>EventHandlerFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L42) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export type EventHandlerFunction<TResult = unknown> = (event: SimulatedH3Event) => Promise<TResult> | TResult;
```

#### <code v-pre>InvokeEventHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L44) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export interface InvokeEventHandlerOptions<TResult = unknown> {
    readonly handler: EventHandlerFunction<TResult>;
    readonly url: string;
    readonly method?: string;
    readonly body?: unknown;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly query?: Record<string, string | string[]>;
}
```

#### <code v-pre>InvokeEventHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L54) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export interface InvokeEventHandlerResult<TResult = unknown> {
    readonly result: TResult | undefined;
    readonly redirect: NuxtRedirectSignal | null;
    readonly error: unknown;
    readonly env: EventHandlerEnv;
}
```

#### <code v-pre>NuxtRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L16) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export interface NuxtRedirectSignal {
    readonly [NUXT_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```

#### <code v-pre>SimulatedH3Event</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L22) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export interface SimulatedH3Event {
    readonly method: string;
    readonly path: string;
    readonly url: string;
    readonly query: Readonly<Record<string, string | string[]>>;
    readonly body: unknown;
    readonly headers: ReadonlyMap<string, string>;
    readonly cookies: ReadonlyMap<string, string>;
    setHeader(name: string, value: string): void;
    setCookie(name: string, value: string): void;
    setStatusCode(code: number): void;
    sendRedirect(url: string, status?: number): never;
}
```
