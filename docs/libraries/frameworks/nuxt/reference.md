# nuxt リファレンス

## 公開 API

`invokeEventHandler` は H3 event を作り `result`、`redirect`、`error`、`env` を返します。`invokeRouteMiddleware` と `setupNuxtMiddlewareEnv` は route guard を扱います。`invokeNitroPlugin` は Nitro hook の登録と実行を扱います。

## 設定

event handler は URL、method、body、headers、cookies、query override を受け取ります。URL の同名 query は配列になり、明示した query override が優先されます。

## 結果の分岐

event handler は result、redirect、error を分離して返します。cookie と header は env で確認するため、redirect response のみを見て副作用の有無を判断しません。

route middleware の結果は `result`、`redirect`、`abort`、`error` です。`navigateTo` の options は external、replace、redirectCode を記録します。

Nitro plugin は request、beforeResponse、afterResponse、error、render:html、render:response、close の hook を登録できます。hook callback の例外は call driver が収集するため、plugin setup error と別に確認します。

## 後始末と制約

cookie と response header は env に残るため環境を共有しません。redirect 以外の例外は error で確認します。Nitro server、Nuxt composable、実 network は起動しません。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>invokeEventHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L87) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

Invoke a Nuxt `defineEventHandler` callback in isolation and capture its return value + redirect signal + response headers / cookies / status.

```ts
export declare function invokeEventHandler<TResult = unknown>(opts: InvokeEventHandlerOptions<TResult>): Promise<InvokeEventHandlerResult<TResult>>;
```

#### <code v-pre>invokeNitroPlugin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L65) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

Invoke a Nitro plugin setup in isolation and return the hooks it registered + a `callHook` driver to fire them with synthetic payloads.

```ts
export declare function invokeNitroPlugin(opts: InvokeNitroPluginOptions): Promise<InvokeNitroPluginResult>;
```

#### <code v-pre>invokeRouteMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L113) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

Invoke a Nuxt 3 route middleware in isolation and capture its outcome. Return-value semantics mirror Nuxt: - `undefined` / `void` → continue navigation (no redirect, no abort) - `false` → abort silently - `string` → navigate to that path (synchronous return form) - thrown redirect/abort signal → captured into `redirect` / `abort`

```ts
export declare function invokeRouteMiddleware(opts: InvokeRouteMiddlewareOptions): Promise<InvokeRouteMiddlewareResult>;
```

#### <code v-pre>NUXT&#95;MIDDLEWARE&#95;ABORT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L12) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export declare const NUXT_MIDDLEWARE_ABORT_SYMBOL: unique symbol;
```

#### <code v-pre>NUXT&#95;MIDDLEWARE&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L11) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export declare const NUXT_MIDDLEWARE_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>NUXT&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L14) <code v-pre>packages/nuxt/src/invoke-event-handler.ts</code>

```ts
export declare const NUXT_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>setupNuxtMiddlewareEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L119) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

Wrap a middleware (or chain) in a captured execution environment. Returns spy buffers + aggregated outcome. The helper never re-throws — captured signals are surfaced through `outcome.redirect` / `outcome.abort` and the spy buffers.

```ts
export declare function setupNuxtMiddlewareEnv(opts: SetupNuxtMiddlewareEnvOptions): Promise<SetupNuxtMiddlewareEnvResult>;
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

#### <code v-pre>InvokeNitroPluginOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L39) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface InvokeNitroPluginOptions {
    readonly plugin: NitroPlugin;
    /**
     * Optional local fetch hook to expose on the simulated NitroApp. Useful when
     * the plugin under test reaches `nitroApp.localFetch(req)`.
     */
    readonly localFetch?: (request: Request) => Promise<Response>;
}
```

#### <code v-pre>InvokeNitroPluginResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L54) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface InvokeNitroPluginResult {
    readonly registered: RegisteredHook[];
    readonly callHook: <TPayload = unknown>(name: NitroHookName, payload: TPayload) => Promise<void>;
    readonly callHookErrors: Array<{
        readonly name: NitroHookName;
        readonly error: unknown;
    }>;
    readonly error: unknown;
}
```

#### <code v-pre>InvokeRouteMiddlewareOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L62) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface InvokeRouteMiddlewareOptions {
    readonly middleware: RouteMiddlewareFunction;
    readonly to: RouteLocationInput;
    readonly from?: RouteLocationInput;
}
```

#### <code v-pre>InvokeRouteMiddlewareResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L68) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface InvokeRouteMiddlewareResult {
    readonly result: void | false | string | NuxtMiddlewareRedirectSignal;
    readonly redirect: NuxtMiddlewareRedirectSignal | null;
    readonly abort: NuxtMiddlewareAbortSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>MiddlewareNavigateOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L38) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface MiddlewareNavigateOptions {
    readonly external?: boolean;
    readonly replace?: boolean;
    readonly redirectCode?: number;
}
```

#### <code v-pre>NitroHookHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L24) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export type NitroHookHandler<TPayload = unknown> = (payload: TPayload) => Promise<void> | void;
```

#### <code v-pre>NitroHookName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L15) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export type NitroHookName = 'request' | 'beforeResponse' | 'afterResponse' | 'error' | 'render:html' | 'render:response' | 'close';
```

#### <code v-pre>NitroPlugin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L37) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export type NitroPlugin = (nitroApp: SimulatedNitroApp) => Promise<void> | void;
```

#### <code v-pre>NuxtMiddlewareAbortCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L46) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

Single recorded `abortNavigation()` call captured by the spy.

```ts
export interface NuxtMiddlewareAbortCall {
    readonly message: string | undefined;
    readonly statusCode: number;
}
```

#### <code v-pre>NuxtMiddlewareAbortSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L22) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface NuxtMiddlewareAbortSignal {
    readonly [NUXT_MIDDLEWARE_ABORT_SYMBOL]: true;
    readonly message: string | undefined;
    readonly statusCode: number;
}
```

#### <code v-pre>NuxtMiddlewareNavigateCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L38) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

Single recorded `navigateTo()` call captured by the spy.

```ts
export interface NuxtMiddlewareNavigateCall {
    readonly target: string;
    readonly options: MiddlewareNavigateOptions;
}
```

#### <code v-pre>NuxtMiddlewareRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L14) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface NuxtMiddlewareRedirectSignal {
    readonly [NUXT_MIDDLEWARE_REDIRECT_SYMBOL]: true;
    readonly to: string;
    readonly external: boolean;
    readonly replace: boolean;
    readonly status: number;
}
```

#### <code v-pre>NuxtMiddlewareUserFixture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L30) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

User session fixture injected into `to.meta.userSession` so middleware that reads `useUserSession()` (or any equivalent composable mirrored into `meta`) can branch on auth state without a real Nuxt app. `state: 'expired'` is a sentinel value the middleware can opt-into; it does not carry meaning at the helper level beyond being placed in meta verbatim.

```ts
export type NuxtMiddlewareUserFixture = {
    readonly state: 'authenticated';
    readonly userId: string;
    readonly role?: string;
    readonly extra?: Readonly<Record<string, unknown>>;
} | {
    readonly state: 'expired';
    readonly userId?: string;
    readonly role?: string;
    readonly extra?: Readonly<Record<string, unknown>>;
} | {
    readonly state: 'anonymous';
};
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

#### <code v-pre>RegisteredHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L48) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface RegisteredHook {
    readonly name: NitroHookName;
    readonly handler: NitroHookHandler;
    readonly once: boolean;
}
```

#### <code v-pre>RouteLocationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L53) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface RouteLocationInput {
    readonly path: string;
    readonly name?: string;
    readonly params?: Record<string, string>;
    readonly query?: Record<string, string | string[]>;
    readonly hash?: string;
    readonly meta?: Record<string, unknown>;
}
```

#### <code v-pre>RouteMiddlewareFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L44) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export type RouteMiddlewareFunction = (to: SimulatedRouteLocation, from: SimulatedRouteLocation, helpers: {
    navigateTo(target: string, options?: MiddlewareNavigateOptions): never;
    abortNavigation(message?: string, statusCode?: number): never;
}) => Promise<void | false | string | NuxtMiddlewareRedirectSignal> | void | false | string | NuxtMiddlewareRedirectSignal;
```

#### <code v-pre>SetupNuxtMiddlewareEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L51) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

```ts
export interface SetupNuxtMiddlewareEnvOptions {
    /**
     * One middleware function or an ordered chain. Chain order follows Nuxt:
     * global middleware first, route-specific middleware after, executed in
     * array order. Execution stops at the first redirect / abort / non-signal
     * throw — later entries are reported in `result.skipped`.
     */
    readonly middleware: RouteMiddlewareFunction | readonly RouteMiddlewareFunction[];
    readonly to: RouteLocationInput;
    readonly from?: RouteLocationInput;
    /**
     * Optional user session fixture. When provided, it is merged into
     * `to.meta.userSession` so existing middleware (which reads meta) keeps
     * working unchanged. Anonymous → no key written (meta absent).
     */
    readonly user?: NuxtMiddlewareUserFixture;
}
```

#### <code v-pre>SetupNuxtMiddlewareEnvResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L69) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

```ts
export interface SetupNuxtMiddlewareEnvResult {
    /**
     * Aggregated outcome:
     *   - `redirect` / `abort` / `error` mirror the *first* halting signal in the chain.
     *   - `result` mirrors the return value of the last executed middleware.
     *   - `executed` lists the indices of middlewares that ran (in order).
     *   - `skipped` lists the indices that never ran because the chain halted.
     */
    readonly outcome: InvokeRouteMiddlewareResult & {
        readonly executed: readonly number[];
        readonly skipped: readonly number[];
    };
    /**
     * Spy capture for all `navigateTo()` invocations across the chain. A redirect
     * throw still produces exactly one entry — duplicates would only appear if a
     * middleware swallows the signal and calls again (uncommon).
     */
    readonly navigateToCalls: readonly NuxtMiddlewareNavigateCall[];
    /**
     * Spy capture for all `abortNavigation()` invocations across the chain.
     */
    readonly abortNavigationCalls: readonly NuxtMiddlewareAbortCall[];
    /**
     * Convenience assertion — the redirect target if one was captured, else null.
     */
    readonly redirectedTo: string | null;
    /**
     * Convenience assertion — true when an abort signal was captured.
     */
    readonly aborted: boolean;
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

#### <code v-pre>SimulatedNitroApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L26) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface SimulatedNitroApp {
    readonly hooks: {
        hook<TPayload = unknown>(name: NitroHookName, handler: NitroHookHandler<TPayload>): void;
        callHook<TPayload = unknown>(name: NitroHookName, payload: TPayload): Promise<void>;
        hookOnce<TPayload = unknown>(name: NitroHookName, handler: NitroHookHandler<TPayload>): void;
        removeHook(name: NitroHookName, handler: NitroHookHandler): void;
    };
    readonly localFetch?: (request: Request) => Promise<Response>;
    readonly h3App: unknown;
}
```

#### <code v-pre>SimulatedRouteLocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L28) <code v-pre>packages/nuxt/src/invoke-route-middleware.ts</code>

```ts
export interface SimulatedRouteLocation {
    readonly fullPath: string;
    readonly path: string;
    readonly name: string | undefined;
    readonly params: Readonly<Record<string, string>>;
    readonly query: Readonly<Record<string, string | string[]>>;
    readonly hash: string;
    readonly meta: Readonly<Record<string, unknown>>;
}
```
<!-- kiwa-public-api:end -->
