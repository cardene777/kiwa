---
'@kiwa-test/nuxt': patch
---

Nuxt 3 route middleware test helper を追加 (Issue #523、 v1.2)。

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
