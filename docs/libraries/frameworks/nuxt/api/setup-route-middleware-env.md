---
title: "@kiwa-lab/nuxt setup-route-middleware-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nuxt</code> <code v-pre>setup-route-middleware-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupNuxtMiddlewareEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L119) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

Wrap a middleware (or chain) in a captured execution environment. Returns spy buffers + aggregated outcome. The helper never re-throws — captured signals are surfaced through `outcome.redirect` / `outcome.abort` and the spy buffers.

```ts
export declare function setupNuxtMiddlewareEnv(opts: SetupNuxtMiddlewareEnvOptions): Promise<SetupNuxtMiddlewareEnvResult>;
```

### 型

#### <code v-pre>NuxtMiddlewareAbortCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/setup-route-middleware-env.ts#L46) <code v-pre>packages/nuxt/src/setup-route-middleware-env.ts</code>

Single recorded `abortNavigation()` call captured by the spy.

```ts
export interface NuxtMiddlewareAbortCall {
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
