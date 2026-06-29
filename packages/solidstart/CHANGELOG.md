# @kiwa-test/solidstart

## 1.0.2

### Patch Changes

- re-publish 3 packages with version 1.0.2 — previous 1.0.1 publish + unpublish の履歴により同 version 再 publish 不可、 1.0.2 へ bump して registry に再登録。

  実装変更なし、 package.json version + CHANGELOG.md だけの patch bump。 npm registry に v1.0.2 として appear し、 v1.2 milestone (Issue #518/#519/#522) の publish 完了状態化する。

## 1.0.1

### Patch Changes

- d13cb73: 🎉 New package `@kiwa-test/solidstart` v1.0 — SolidStart Server Functions + API Routes test adapter (Issue #518、 v1.2 milestone 2/10).

  ## What's in the box

  - `invokeServerFunction<TArgs, TResult>({ fn, args, headers, cookies })` — invoke a `'use server'` async function and capture `result` / `redirect` / `error` / `env`.
  - `invokeApiRoute<TParams>({ handler, url, method, params, headers, formData, jsonBody, locals })` — invoke an API Route handler with a simulated APIEvent and capture the returned `Response` + auto-normalized `redirect`.
  - `redirect(url, status?)` / `redirectResponse(location, status?)` / `json(body, init?)` — SolidStart-shaped Response helpers.
  - `SOLIDSTART_REDIRECT_SYMBOL` — server function thrown redirect signal brand.
  - types: `ServerFunctionFunction` / `APIRouteHandler` / `SimulatedAPIEvent` / `SolidStartRedirectSignal` / `InvokeServerFunctionOptions` / `InvokeServerFunctionResult` / `InvokeApiRouteOptions` / `InvokeApiRouteResult`.

  ## Coverage

  22 unit tests passing (server-function 8 + api-route 14)、 coverage `lines 100 / branches 97 / functions 100 / statements 100` (gate 90/80/90/90 全クリア).

  ## Companion

  - New skill `/kiwa-solidstart` — Layer 2 generator with 9 column extension tables for both server-function and api-route modes.
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `solidstart-server-function` / `solidstart-api-route` 追加。
  - `release.yml` workflow + `scripts/check-coverage-gates.mjs` + `scripts/check-mutation-gates.mjs` + `tests/release-smoke/` 4 file + `package.json` release script を **17 packages 化**。
  - packages/solidstart/{stryker.config.mjs,vitest.stryker.config.mjs} 配置で mutation gate 統合。
  - README Limitations 表で SolidStart Server Functions ❌ → ✅ production-ready (v1.0.0+)、 Qwik City のみ v1.2 残存 (#519)。

  ## Out of scope (separate Issues)

  - Qwik City routeAction\$ / routeLoader\$ / Endpoints — Issue #519。
  - SolidStart route data (`route.data` / `createAsync`) — client side、 `@kiwa-test/ui` Solid mode 対応済。
