# @kiwa-test/remix

## 1.0.3

### Patch Changes

- 5c3ad4b: Remix v2 / React Router v7 Resource Routes test helper を追加 (Issue #523、 v1.2)。

  ## What's added

  - `invokeResourceRoute(opts)` — Resource Route module (`{ loader?, action? }`) を HTTP method で dispatch し、 GET/HEAD → loader、 POST/PUT/PATCH/DELETE → action、 該当 export 不在は 405 Response + `methodNotAllowed` signal を return。 既存 `invokeLoader` / `invokeAction` の Response normalize / redirect signal を内部で reuse。
  - `RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL` — `Symbol.for(...)` registered symbol で 405 dispatch 結果を branded signal 化、 `allow: ReadonlyArray<HTTP method>` で許容 method を提示。
  - 4 type を export — `InvokeResourceRouteOptions` / `InvokeResourceRouteResult` / `ResourceRouteModule` / `ResourceRouteMethodNotAllowedSignal`。

  ## Coverage

  - `tests/invoke-resource-route.test.ts` で 14 test (T-RR-001 .. T-RR-014) all pass、 GET/HEAD/POST/PUT/PATCH/DELETE 全 dispatch + 405 (loader-only POST / action-only GET / 空 module) + case-insensitive method + redirect Response + octet-stream binary download + action error capture + params/context/headers 伝搬 全部 cover。

  ## Companion

  - skill description 更新 (`/kiwa-remix --layer remix-resource-route` mode 追加)
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `remix-resource-route` 追加
  - stryker `mutate` + coverage `--coverage.include` に `invoke-resource-route.js` 追加
  - release-smoke `import-surface.test.ts` に新 export 検証 block 追加
  - root README Limitations 表に Remix Resource Routes ✅ 行追加

  ## Out of scope (separate Issues)

  - streaming Response body 詳細 assertion → caller が `result.response.body` の `ReadableStream` を直接消費
  - multipart/form-data 解析 → 別 Issue (現状は simple key-value formData のみ)

## 1.0.1

### Patch Changes

- a328da2: 🎉 New package `@kiwa-test/remix` v1.0 — Remix v2 / React Router v7 loader + action test adapter (Issue #498、 v1.1 milestone 7/8).

  ## What's in the box

  - `invokeLoader({ loader, url, params, context, headers, method })` — invoke a `LoaderFunction` with a simulated `Request` and capture the returned plain value or `Response` (auto-normalized into `result` / `response` / `redirect`).
  - `invokeAction({ action, url, formData, jsonBody, params, context, headers, method })` — invoke an `ActionFunction` with FormData / JSON body and capture the same shape.
  - `redirect(location, status?)` / `json(body, init?)` — kiwa equivalents of Remix's Response helpers.
  - `REMIX_REDIRECT_SYMBOL` — thrown `RemixRedirectSignal` objects are normalized.
  - 18 unit tests passing, coverage `95 / 94 / 100 / 95` (above the 90/80/90/90 gate).

  ## Companion

  - New skill `/kiwa-remix` — Layer 2 generator with 9 column extension tables for loader + action modes.
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `remix-loader` / `remix-action` を追加。
  - `release.yml` + `scripts/check-coverage-gates.mjs` + `tests/release-smoke/` 4 file + `package.json` release script を 15 packages 化。
  - README Limitations 表で Remix ❌ → ✅ production-ready (v1.0.0+).

  ## Out of scope (separate Issues)

  - Remix `useFetcher` / SPA hooks — covered by `@kiwa-test/ui` React mode for the client side.
  - Remix `links` / `meta` exports — pure object exports, no helper needed.
