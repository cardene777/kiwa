---
'@kiwa-test/nuxt': patch
---

Nuxt 3 / Nitro plugin lifecycle test helper を追加 (Issue #523、 v1.2)。

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
