---
"@kiwa-test/sveltekit": patch
---

🎉 SvelteKit `hooks.server.ts` test helper を `@kiwa-test/sveltekit` v1.0.1 に追加 (Issue #526、 v1.2 milestone 5/10).

## What's added

- `invokeHandle({ handle, url, method, headers, cookies, params, locals, routeId, platform, resolveResponse })` — `Handle` hook を direct invoke、 resolve pass-through / short-circuit / locals 書込 / cookies 操作を捕捉。
- `invokeHandleFetch({ handleFetch, eventUrl, fetchUrl, method, headers, cookies, locals, downstreamFetch })` — `HandleFetch` hook を invoke、 downstream fetch call の URL rewrite + auth header 注入を捕捉。
- `invokeHandleError({ handleError, error, url, status, message, headers, cookies, locals })` — `HandleServerError` hook を invoke、 error logging / message format / event.url アクセスを捕捉。
- types: `HandleFunction` / `HandleFetchFunction` / `HandleErrorFunction` / `HandleArgs` / `HandleFetchArgs` / `HandleErrorArgs` / `InvokeHandleOptions` / `InvokeHandleResult` / `InvokeHandleFetchOptions` / `InvokeHandleFetchResult` / `InvokeHandleErrorOptions` / `InvokeHandleErrorResult` / `SimulatedHookRequestEvent`.

## Coverage

17 new unit tests (handle 9 + handleFetch 4 + handleError 4)、 sveltekit package 全体 coverage `lines 100 / branches 91.66 / functions 100 / statements 100` (gate 90/80/90/90 全クリア)。

## Companion

- `/kiwa-sveltekit` skill SKILL.md description 拡張 + hooks.server mode section (9 column 拡張表 × 3 + test 生成 template) 追加。
- `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `sveltekit-handle` / `sveltekit-handle-fetch` / `sveltekit-handle-error` を追加。
- packages/sveltekit/stryker.config.mjs の mutate に invoke-hooks.js 追加、 coverage.include 拡張。
- release-smoke import-surface に hooks export 検証追加。
- README Limitations 表で SvelteKit ✅ → ✅ + hooks.server section 追加 (v1.0.1+)。

## Out of scope

- SvelteKit `init` hook (server startup) — 需要次第で別 Issue。
- SvelteKit `reroute` hook (URL rewrite before routing) — 需要次第で別 Issue。
