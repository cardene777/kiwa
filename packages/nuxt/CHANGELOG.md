# @kiwa-test/nuxt

## 1.0.4

### Patch Changes

- 5c3ad4b: Nuxt 3 / Nitro plugin lifecycle test helper を追加 (Issue #523、 v1.2)。

  ## What's added

  - `invokeNitroPlugin(opts)` — `defineNitroPlugin((nitroApp) => ...)` を isolated に実行し、 plugin が登録した hook を `RegisteredHook[]` として捕捉、 `callHook(name, payload)` driver で 7 lifecycle hook (`request` / `beforeResponse` / `afterResponse` / `error` / `render:html` / `render:response` / `close`) を任意 payload で fire 可能。
  - `SimulatedNitroApp.hooks` — `hook` / `hookOnce` / `callHook` / `removeHook` 4 method を full implement (`hookOnce` は first call 後 auto-detach、 hook error は `callHookErrors[]` に capture して後続 handler は継続実行)。
  - 6 type を export — `InvokeNitroPluginOptions` / `InvokeNitroPluginResult` / `NitroPlugin` / `SimulatedNitroApp` / `NitroHookName` / `NitroHookHandler` / `RegisteredHook`。

  ## Coverage

  - `tests/invoke-nitro-plugin.test.ts` で 14 test (T-NNP-001 .. T-NNP-014) all pass、 multi-handler order + async setup + hookOnce auto-detach + localFetch 受け渡し + render:html mutation + setup error capture 全部 cover。

  ## Companion

  - skill description 更新 (`/kiwa-nuxt --layer nuxt-nitro-plugin` mode 追加)
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `nuxt-nitro-plugin` 追加
  - stryker `mutate` + coverage `--coverage.include` に `invoke-nitro-plugin.js` 追加
  - release-smoke `import-surface.test.ts` に新 export 検証 block 追加
  - root README Limitations 表に Nuxt Nitro plugin ✅ 行追加

  ## Out of scope (separate Issues)

  - 実 `h3` / `nitropack` runtime 起動 → 重量級 e2e test は `@kiwa-test/e2e` 推奨
  - `h3App` 詳細 stub → 必要なら caller が test 内で `vi.fn()` で置換

- 5c3ad4b: Nuxt 3 route middleware test helper を追加 (Issue #523、 v1.2)。

  ## What's added

  - `invokeRouteMiddleware(opts)` — `defineNuxtRouteMiddleware((to, from) => ...)` を Nitro 起動なしで isolated に実行し、 `navigateTo()` / `abortNavigation()` の throw を branded signal として捕捉する。
  - `NUXT_MIDDLEWARE_REDIRECT_SYMBOL` / `NUXT_MIDDLEWARE_ABORT_SYMBOL` — `Symbol.for(...)` registered symbol で cross-realm 一致を保証。
  - 8 type を export — `InvokeRouteMiddlewareOptions` / `InvokeRouteMiddlewareResult` / `RouteMiddlewareFunction` / `RouteLocationInput` / `SimulatedRouteLocation` / `MiddlewareNavigateOptions` / `NuxtMiddlewareRedirectSignal` / `NuxtMiddlewareAbortSignal`。

  ## Coverage

  - `tests/invoke-route-middleware.test.ts` で 15 test (T-NRM-001 .. T-NRM-015) all pass、 fullPath 生成 + array query serialize + redirect/abort signal capture + async middleware + 短形 return 全部 cover。

  ## Companion

  - skill description 更新 (`/kiwa-nuxt --layer nuxt-route-middleware` mode 追加)
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `nuxt-route-middleware` 追加
  - stryker `mutate` + coverage `--coverage.include` に `invoke-route-middleware.js` 追加
  - release-smoke `import-surface.test.ts` に新 export 検証 block 追加
  - root README Limitations 表に Nuxt route middleware ✅ 行追加

  ## Out of scope (separate Issues)

  - `useFetch` / `useState` 等 composables → `@kiwa-test/ui` Vue mode で client side cover
  - Nuxt server middleware (`server/middleware/*.ts`) → 別 Issue (server middleware は H3 event-based、 route middleware は client/server 両対応の navigation-time hook)

## 1.0.1

### Patch Changes

- f19aae3: 🎉 New package `@kiwa-test/nuxt` v1.0 — Nuxt 3 Server Routes test adapter (Issue #496、 v1.1 milestone 5/7).

  Invoke `defineEventHandler((event) => ...)` callbacks in isolation through `invokeEventHandler({ handler, url, method, body, query, headers, cookies })` and assert on the captured `result` / `redirect` / `env.responseHeaders` / `env.responseCookies` / `env.status` without a running Nitro server.

  ## What's in the box

  - `invokeEventHandler<TResult>(opts)` — wrap a defineEventHandler callback and capture side-effects.
  - `NUXT_REDIRECT_SYMBOL` — `event.sendRedirect(url, status)` throws a branded object that the helper normalizes into `result.redirect`.
  - types: `SimulatedH3Event` / `EventHandlerFunction` / `EventHandlerEnv` / `NuxtRedirectSignal` / `InvokeEventHandlerOptions` / `InvokeEventHandlerResult`.

  ## Coverage

  14 unit tests (正常系 JSON return / query parse / array query / query override / body / redirect with status / default status 302 / setHeader / setCookie / setStatusCode / non-redirect error / header normalization / method default / path with search) with `lines / branches / functions / statements` 全 100%.

  ## Companion changes (this same PR)

  - New skill `/kiwa-nuxt` (`.claude/skills/kiwa-nuxt/`) — Layer 2 generator for Nuxt 3 Server Route tests, 9 column extension table, test 生成 template, 11 観点 mapping.
  - `/kiwa-design` adds `--layer nuxt-server-route` with a 9-column extension table.
  - `/kiwa-review --layer nuxt-server-route` review mode + Glob path.
  - `release.yml` workflow: Test (nuxt) step + Coverage (all 13 packages) + Typecheck / Build / publish filter に nuxt 追加.
  - `scripts/check-coverage-gates.mjs` PACKAGES + PKG_DIRS に nuxt 追加.
  - `tests/release-smoke/` 4 file (package.json + coverage-gate.test.ts + coverage-diff.test.ts + import-surface.test.ts) に nuxt 追加.
  - `README.md` Limitations 表で Nuxt 3 ❌ → ✅ production-ready (v1.0.0+).
  - `package.json` release script に -F @kiwa-test/nuxt build + --filter @kiwa-test/nuxt publish 追加.

  ## Out of scope (separate Issues)

  - Nuxt composables (`useFetch` / `useState` / `useNuxtApp`) — covered by `@kiwa-test/ui` Vue mode.
  - Nitro plugin lifecycle.
  - Server-side route middleware (Nuxt route middleware prepass).
