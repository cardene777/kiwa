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

#### `invokeEventHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L87) `packages/nuxt/src/invoke-event-handler.ts`

Invoke a Nuxt `defineEventHandler` callback in isolation and capture its return value + redirect signal + response headers / cookies / status.

```ts
export declare function invokeEventHandler<TResult = unknown>(opts: InvokeEventHandlerOptions<TResult>): Promise<InvokeEventHandlerResult<TResult>>;
```

#### `invokeNitroPlugin`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L65) `packages/nuxt/src/invoke-nitro-plugin.ts`

Invoke a Nitro plugin setup in isolation and return the hooks it registered + a `callHook` driver to fire them with synthetic payloads.

```ts
export declare function invokeNitroPlugin(opts: InvokeNitroPluginOptions): Promise<InvokeNitroPluginResult>;
```

#### `invokeRouteMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L113) `packages/nuxt/src/invoke-route-middleware.ts`

Invoke a Nuxt 3 route middleware in isolation and capture its outcome. Return-value semantics mirror Nuxt: - `undefined` / `void` → continue navigation (no redirect, no abort) - `false` → abort silently - `string` → navigate to that path (synchronous return form) - thrown redirect/abort signal → captured into `redirect` / `abort`

```ts
export declare function invokeRouteMiddleware(opts: InvokeRouteMiddlewareOptions): Promise<InvokeRouteMiddlewareResult>;
```

#### `NUXT_MIDDLEWARE_ABORT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L12) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export declare const NUXT_MIDDLEWARE_ABORT_SYMBOL: unique symbol;
```

#### `NUXT_MIDDLEWARE_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L11) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export declare const NUXT_MIDDLEWARE_REDIRECT_SYMBOL: unique symbol;
```

#### `NUXT_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L14) `packages/nuxt/src/invoke-event-handler.ts`

```ts
export declare const NUXT_REDIRECT_SYMBOL: unique symbol;
```

#### `setupNuxtMiddlewareEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L119) `packages/nuxt/src/setup-route-middleware-env.ts`

Wrap a middleware (or chain) in a captured execution environment. Returns spy buffers + aggregated outcome. The helper never re-throws — captured signals are surfaced through `outcome.redirect` / `outcome.abort` and the spy buffers.

```ts
export declare function setupNuxtMiddlewareEnv(opts: SetupNuxtMiddlewareEnvOptions): Promise<SetupNuxtMiddlewareEnvResult>;
```

### 型

#### `EventHandlerEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L36) `packages/nuxt/src/invoke-event-handler.ts`

```ts
export interface EventHandlerEnv {
    readonly responseHeaders: Map<string, string>;
    readonly responseCookies: Map<string, string>;
    status: number;
}
```

#### `EventHandlerFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L42) `packages/nuxt/src/invoke-event-handler.ts`

```ts
export type EventHandlerFunction<TResult = unknown> = (event: SimulatedH3Event) => Promise<TResult> | TResult;
```

#### `InvokeEventHandlerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L44) `packages/nuxt/src/invoke-event-handler.ts`

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

#### `InvokeEventHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L54) `packages/nuxt/src/invoke-event-handler.ts`

```ts
export interface InvokeEventHandlerResult<TResult = unknown> {
    readonly result: TResult | undefined;
    readonly redirect: NuxtRedirectSignal | null;
    readonly error: unknown;
    readonly env: EventHandlerEnv;
}
```

#### `InvokeNitroPluginOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L39) `packages/nuxt/src/invoke-nitro-plugin.ts`

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

#### `InvokeNitroPluginResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L54) `packages/nuxt/src/invoke-nitro-plugin.ts`

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

#### `InvokeRouteMiddlewareOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L62) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export interface InvokeRouteMiddlewareOptions {
    readonly middleware: RouteMiddlewareFunction;
    readonly to: RouteLocationInput;
    readonly from?: RouteLocationInput;
}
```

#### `InvokeRouteMiddlewareResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L68) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export interface InvokeRouteMiddlewareResult {
    readonly result: void | false | string | NuxtMiddlewareRedirectSignal;
    readonly redirect: NuxtMiddlewareRedirectSignal | null;
    readonly abort: NuxtMiddlewareAbortSignal | null;
    readonly error: unknown;
}
```

#### `MiddlewareNavigateOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L38) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export interface MiddlewareNavigateOptions {
    readonly external?: boolean;
    readonly replace?: boolean;
    readonly redirectCode?: number;
}
```

#### `NitroHookHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L24) `packages/nuxt/src/invoke-nitro-plugin.ts`

```ts
export type NitroHookHandler<TPayload = unknown> = (payload: TPayload) => Promise<void> | void;
```

#### `NitroHookName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L15) `packages/nuxt/src/invoke-nitro-plugin.ts`

```ts
export type NitroHookName = 'request' | 'beforeResponse' | 'afterResponse' | 'error' | 'render:html' | 'render:response' | 'close';
```

#### `NitroPlugin`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L37) `packages/nuxt/src/invoke-nitro-plugin.ts`

```ts
export type NitroPlugin = (nitroApp: SimulatedNitroApp) => Promise<void> | void;
```

#### `NuxtMiddlewareAbortCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L46) `packages/nuxt/src/setup-route-middleware-env.ts`

Single recorded `abortNavigation()` call captured by the spy.

```ts
export interface NuxtMiddlewareAbortCall {
    readonly message: string | undefined;
    readonly statusCode: number;
}
```

#### `NuxtMiddlewareAbortSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L22) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export interface NuxtMiddlewareAbortSignal {
    readonly [NUXT_MIDDLEWARE_ABORT_SYMBOL]: true;
    readonly message: string | undefined;
    readonly statusCode: number;
}
```

#### `NuxtMiddlewareNavigateCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L38) `packages/nuxt/src/setup-route-middleware-env.ts`

Single recorded `navigateTo()` call captured by the spy.

```ts
export interface NuxtMiddlewareNavigateCall {
    readonly target: string;
    readonly options: MiddlewareNavigateOptions;
}
```

#### `NuxtMiddlewareRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L14) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export interface NuxtMiddlewareRedirectSignal {
    readonly [NUXT_MIDDLEWARE_REDIRECT_SYMBOL]: true;
    readonly to: string;
    readonly external: boolean;
    readonly replace: boolean;
    readonly status: number;
}
```

#### `NuxtMiddlewareUserFixture`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L30) `packages/nuxt/src/setup-route-middleware-env.ts`

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

#### `NuxtRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L16) `packages/nuxt/src/invoke-event-handler.ts`

```ts
export interface NuxtRedirectSignal {
    readonly [NUXT_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```

#### `RegisteredHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L48) `packages/nuxt/src/invoke-nitro-plugin.ts`

```ts
export interface RegisteredHook {
    readonly name: NitroHookName;
    readonly handler: NitroHookHandler;
    readonly once: boolean;
}
```

#### `RouteLocationInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L53) `packages/nuxt/src/invoke-route-middleware.ts`

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

#### `RouteMiddlewareFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L44) `packages/nuxt/src/invoke-route-middleware.ts`

```ts
export type RouteMiddlewareFunction = (to: SimulatedRouteLocation, from: SimulatedRouteLocation, helpers: {
    navigateTo(target: string, options?: MiddlewareNavigateOptions): never;
    abortNavigation(message?: string, statusCode?: number): never;
}) => Promise<void | false | string | NuxtMiddlewareRedirectSignal> | void | false | string | NuxtMiddlewareRedirectSignal;
```

#### `SetupNuxtMiddlewareEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L51) `packages/nuxt/src/setup-route-middleware-env.ts`

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

#### `SetupNuxtMiddlewareEnvResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L69) `packages/nuxt/src/setup-route-middleware-env.ts`

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

#### `SimulatedH3Event`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-event-handler.ts#L22) `packages/nuxt/src/invoke-event-handler.ts`

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

#### `SimulatedNitroApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L26) `packages/nuxt/src/invoke-nitro-plugin.ts`

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

#### `SimulatedRouteLocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-route-middleware.ts#L28) `packages/nuxt/src/invoke-route-middleware.ts`

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
