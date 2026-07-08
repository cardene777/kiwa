# @kiwa/sveltekit

## 1.2.0

### Minor Changes

- cd8ae2c: SvelteKit hooks 全 4 種を 1 env 内で chain test できる統一 helper を追加 (Issue #559、 v1.3-2)。

  ## What's added

  - `setupSvelteKitHooksEnv({ url, method, headers, cookies, params, locals, routeId, platform })` — 1 度 env を build して `runHandle` / `runHandleFetch` / `runHandleError` で 4 hook 種を順次 invoke できる unified env builder。 cookies / locals は env 内で persist し、 `env.reset()` で初期 snapshot に戻る。
  - `sequence(...handles)` — SvelteKit 公式 `sequence()` 相当の handle chain composer。 outer → inner → resolve → inner-after → outer-after の順で実行、 引数なしは no-op。
  - new types: `SetupSvelteKitHooksEnvOptions` / `SvelteKitHooksEnv` / `RunHandleResult` / `RunHandleFetchOptions` / `RunHandleFetchResult` / `RunHandleErrorOptions` / `RunHandleErrorResult`.

  ## Why

  v1.0.1 の `invokeHandle*` 3 関数は単発 invoke 専用で event が毎回 build され、 同 request 流の中で複数 hook を呼びたい / locals を hook 間共有したい場合に env を 3 回手作りする冗長さがあった。 v1.1 では env を 1 度作って 4 hook 全種を順次 invoke できるようにし、 `sequence` で chain も組める。 既存 `invokeHandle` / `invokeHandleFetch` / `invokeHandleError` は backward compat 維持。

  ## Coverage

  19 new unit tests (setup-hooks-env)、 sveltekit package 全体 coverage `lines 100 / branches 92.92 / functions 97.72 / statements 100` (gate 90/80/90/90 全クリア)。

  ## Companion

  - `/kiwa-design` / `/kiwa-review` の `--layer` 選択肢に `sveltekit-hooks-chain` を追加。
  - `/kiwa-sveltekit` skill に hooks-chain mode section (9 column 表 5 行 + template) を追加。
  - `packages/sveltekit/stryker.config.mjs` の mutate に `setup-hooks-env.js` を追加、 `test:cov` の coverage.include 拡張。
  - `tests/release-smoke/tests/import-surface.test.ts` に v1.1+ export 検証 (`setupSvelteKitHooksEnv` + `sequence`) を追加。
  - PoC ... `examples/sveltekit-full` に request-id-handle (sequence 前段) + api-fetch-handle (handleFetch) + error-logger-handle (handleError) を追加、 `hooks.server.ts` で 4 hook 全 export、 unit test 3 file (hooks-sequence / api-fetch / error-logger) で `setupSvelteKitHooksEnv` + `sequence` を実 PoC として cover。

  ## Out of scope

  - SvelteKit `init` hook (server startup) — 需要次第で別 Issue。
  - SvelteKit `reroute` hook (URL rewrite before routing) — 需要次第で別 Issue。

## 1.1.0

### Minor Changes

- 🆕 SvelteKit hooks 全 4 種を 1 env 内で chain test できる統一 helper を追加 (Issue #559、 v1.3 milestone)。

  ## What's added

  - `setupSvelteKitHooksEnv({ url, method, headers, cookies, params, locals, routeId, platform })` — 1 度 env を build して `runHandle` / `runHandleFetch` / `runHandleError` で 4 hook 種を順次 invoke できる unified env builder。 cookies / locals は env 内で persist し、 `env.reset()` で初期 snapshot に戻る。
  - `sequence(...handles)` — SvelteKit 公式 `sequence()` 相当の handle chain composer。 outer → inner → resolve → inner-after → outer-after の順で実行、 引数なしは no-op。
  - new types: `SetupSvelteKitHooksEnvOptions` / `SvelteKitHooksEnv` / `RunHandleResult` / `RunHandleFetchOptions` / `RunHandleFetchResult` / `RunHandleErrorOptions` / `RunHandleErrorResult`.

  ## Why

  v1.0.1 の `invokeHandle*` 3 関数は単発 invoke 専用で event が毎回 build され、 同 request 流の中で複数 hook を呼びたい / locals を hook 間共有したい場合に env を 3 回手作りする冗長さがあった。 v1.1 では env を 1 度作って 4 hook 全種を順次 invoke できるようにし、 `sequence` で chain も組める。 既存 `invokeHandle` / `invokeHandleFetch` / `invokeHandleError` は backward compat 維持。

  ## Coverage

  19 new unit tests (setup-hooks-env)、 sveltekit package 全体 coverage `lines 100 / branches 92.92 / functions 97.72 / statements 100` (gate 90/80/90/90 全クリア)。

  ## Companion

  - `/kiwa-design` / `/kiwa-review` の `--layer` 選択肢に `sveltekit-hooks-chain` を追加 (出力 path `tests/spec/integration/test-spec-{module}.svk-hooks-chain.md`).
  - `/kiwa-sveltekit` skill に hooks-chain mode section (9 column 表 5 行 + template) を追加。
  - `packages/sveltekit/stryker.config.mjs` の mutate に `setup-hooks-env.js` を追加、 `test:cov` の coverage.include 拡張。
  - `tests/release-smoke/tests/import-surface.test.ts` に v1.1+ export 検証 (`setupSvelteKitHooksEnv` + `sequence`) を追加。
  - PoC ... `examples/sveltekit-full` に request-id-handle (sequence 前段) + api-fetch-handle (handleFetch) + error-logger-handle (handleError) を追加、 `hooks.server.ts` で 4 hook 全 export、 unit test 3 file (hooks-sequence / api-fetch / error-logger) で `setupSvelteKitHooksEnv` + `sequence` を実 PoC として cover。

  ## Out of scope

  - SvelteKit `init` hook (server startup) — 需要次第で別 Issue。
  - SvelteKit `reroute` hook (URL rewrite before routing) — 需要次第で別 Issue。

## 1.0.2

### Patch Changes

- 0dc64e2: 🎉 SvelteKit `hooks.server.ts` test helper を `@kiwa/sveltekit` v1.0.1 に追加 (Issue #526、 v1.2 milestone 5/10).

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

## 1.0.1

### Patch Changes

- e4f34ef: 🎉 New package `@kiwa/sveltekit` v1.0 — SvelteKit `+page.server.ts` load + form actions test adapter (Issue #497、 v1.1 milestone 6/8).

  ## What's in the box

  - `invokeLoad({ load, url, params, cookies, locals, fetch })` — invoke a `load` function and capture `data` / `redirect` / `error` / `env.responseHeaders` / `env.cookies`.
  - `invokeAction({ action, url, formData, cookies, locals, method })` — invoke a form action callback and capture `result` / `fail` / `redirect` / `error` / `env.cookies`.
  - `redirect(status, location)` / `error(status, message)` / `fail(status, data)` — kiwa equivalents of SvelteKit's signal helpers; throw or return them from your handler and the helper normalizes them into the result fields.
  - 3 brand symbols: `SK_REDIRECT_SYMBOL` / `SK_ERROR_SYMBOL` / `SK_FAIL_SYMBOL`.

  ## Coverage

  17 unit tests (load 10 + action 7) で `lines / branches / functions / statements` 全 100%.

  ## Companion

  - New skill `/kiwa-sveltekit` — Layer 2 generator with 9 column extension tables for both load and action modes.
  - `/kiwa-design` / `/kiwa-review` の `--layer` 選択肢に `sveltekit-load` / `sveltekit-action` 追加。
  - `release.yml` workflow + `scripts/check-coverage-gates.mjs` + `tests/release-smoke/` 4 file + `package.json` release script を 14 packages 化。
  - README Limitations 表で SvelteKit ❌ → ✅ production-ready (v1.0.0+).

  ## Out of scope (separate Issues)

  - `hooks.server.ts` の `handle` (server hooks) — 別 Issue。
  - `+server.ts` の standalone server endpoints (GET / POST) — load mode の variant で吸収可能、 専用 helper は需要次第で別 Issue。
