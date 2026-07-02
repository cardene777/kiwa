# @kiwa-test/remix

## 1.2.0

### Minor Changes

- a781507: Remix v2 nested route の parent → child loader chain + `headers()` merge + `Set-Cookie` persistence + `defer()` streaming を 1 env で deterministic に test できる helper を追加 (Issue #561、 v1.3-4)。

  ## What's added

  - `setupRemixNestedRouteEnv({ parentRoute, childRoute, url, params, context, headers, cookies, method })` — 1 度 env を build して `runLoaderChain()` で parent → child の loader を順次 invoke できる helper。 parent loader 結果は child の `context.parentData` に渡る (plain value 素通し / JSON Response auto-deserialize / non-JSON は undefined)、 `Set-Cookie` は cookieStore に persist し後続 chain 起動で child request の Cookie header に乗る、 `mergedHeaders` は Remix 公式 `getDocumentHeaders` (`@remix-run/server-runtime/dist/esm/headers.js`) の reduce step と整合した logic で parent / child の `headers()` export + loader Set-Cookie を accumulate する。
  - `defer(data, init?)` / `resolveDeferred(deferred)` / `isDeferred(value)` / `DEFERRED_DATA_SYMBOL` — Remix v2 `defer()` 互換 streaming helper。 `defer()` は branded signal を返し、 `resolveDeferred()` で全 Promise を deterministic に await (resolved / pendingKeys / errors の 3 view を提供、 init は そのまま伝播)。
  - new types: `SetupRemixNestedRouteEnvOptions` / `RemixNestedRouteEnv` / `RemixNestedRouteDefinition` / `RemixNestedRouteHeadersArgs` / `RemixNestedRouteHeadersFunction` / `RunLoaderChainResult` / `DeferredData` / `ResolveDeferredResult`.

  ## Why

  v1.0.x の `invokeLoader` / `invokeAction` / `invokeResourceRoute` は単発 route の invoke を cover していたが、 Remix の特徴である「parent route の loader → child route の loader への data 連鎖」「parent / child の `headers()` export merge」「`Set-Cookie` の親子横断 preservation」「`defer()` による streaming」 を unit test する経路がなかった。 v1.1 では 1 env で 4 観点を全て deterministic に再現でき、 real Remix dev server を起動せずに nested route の全 contract を assertion 可能。 既存 `invokeLoader` / `invokeAction` / `invokeResourceRoute` は backward compat 維持。

  公式 Remix `headers.js` の `prependCookies` 経路と厳密に整合し、 parent loader が Set-Cookie を返した時に child Headers に prepend、 同 cookie 文字列は child 側を優先 (duplicate 抑止) する logic を T-NR-008 / T-NR-009 で固定。

  ## Coverage

  24 new unit tests (`setup-nested-route-env.test.ts`、 T-NR-001 〜 T-NR-022)、 remix package 全体 coverage `lines 99.51 / branches 89.39 / functions 100 / statements 99.51` (gate 90/80/90/90 全クリア)。

  ## Companion

  - PoC ... `examples/remix-full/app/lib/_kiwa/dashboard-layout-loader.ts` + `dashboard-profile-loader.ts` + `app/routes/dashboard.tsx` + `app/routes/dashboard.profile.tsx` で nested route 構成を追加、 `tests/dashboard-nested.test.ts` で `setupRemixNestedRouteEnv` の 5 unit test (T-NR-PoC-001 〜 T-NR-PoC-005) を実 PoC として cover。
  - `/kiwa-design` / `/kiwa-review` の `--layer` 選択肢に `remix-nested-route-chain` を追加 (出力 path `tests/spec/integration/test-spec-{module}.remix-nested-chain.md`)。
  - `/kiwa-remix` skill に nested-route-chain mode section (9 column 表 + template) を追加。
  - `packages/remix/stryker.config.mjs` の mutate に `setup-nested-route-env.js` を追加、 `test:cov` の coverage.include 拡張。
  - `tests/release-smoke/tests/import-surface.test.ts` に v1.1+ export 検証 (`setupRemixNestedRouteEnv` + `defer` + `resolveDeferred` + `isDeferred` + `DEFERRED_DATA_SYMBOL`) を追加。
  - `packages/remix/package.json` description / keywords に nested-route / loader-chain / headers / Set-Cookie / defer / streaming を反映。

  ## Out of scope

  - nested route の action chain (parent action → child loader への post-action data 連鎖) — Remix の `useActionData()` propagation は別 Issue。
  - 3 階層以上の deeply nested route (root > parent > child > grand) — v1.1 は 2 階層 (parent + child) 固定、 N 階層は別 Issue。
  - real `<Await/>` component + suspense fallback の DOM 描画 — defer の data resolve だけを cover、 render は別 Issue で `@kiwa-test/ui` 連携。

### Patch Changes

- b15c504: v1.1.0 で追加した `setupRemixNestedRouteEnv` / `invokeLoader` の Remix 公式仕様乖離 5 MAJOR + 1 MINOR を fix (Issue #568、 PR #567 post-merge Codex adversarial review 起因)。

  ## Fixes

  - **MAJOR 1** ... `prependSetCookies` が `getSetCookie()` のみ使用していたため `Headers.append("Set-Cookie", ...)` で combined された folded Set-Cookie merge が壊れていた。 Remix 公式 `packages/react-router/lib/server-runtime/headers.ts` の `prependCookies` 仕様に揃え、 `get("Set-Cookie")` + 自前 `splitSetCookieString` (cookie-es / set-cookie-parser 互換 algorithm、 `Expires=Thu, 01 Jan 2025` 内 comma を境界に誤 split しない) で 1 cookie 毎に分解してから merge する経路に変更。
  - **MAJOR 2** ... `extractResponseHeaders` が `defer(data, { headers })` の `ResponseInit.headers` を無視していたため deferred loader の Set-Cookie が cookieStore / mergedHeaders に到達しなかった。 `isDeferred(result.result)` 経路で `init.headers` を Headers として抽出するよう拡張、 `defer()` return 時も同 semantics で cookie persist / headers merge が走る。
  - **MAJOR 3** ... `invokeLoader` が loader の explicit `undefined` return を accept していたが、 Remix 公式 `callRouteLoader` は `"You defined a loader but didn't return anything from your loader function."` を throw する仕様。 kiwa env も同 semantics に揃え、 loader 実装漏れ (`return` 文書き忘れ) を unit test 段階で fail 検出可能にする。 `action` は許容 (Remix v2 仕様)、 `null` return は OK (RR 6.11+ 仕様)。
  - **MAJOR 4** ... child request が explicit `options.headers.cookie` を `cookieStore` で上書きしていたが、 parent request 側は explicit precedence を honor していて inconsistent だった。 child も parent と同じ `typeof childHeaders.cookie === 'undefined'` guard で揃え、 user 明示指定の cookie header を一貫して尊重するよう修正 (T-NR-015 と整合)。
  - **MAJOR 5** ... `updateCookieStoreFromSetCookies` が `Max-Age=0` / 過去 `Expires` の cookie 削除指示を無視していたため、 削除した cookie が次の `runLoaderChain()` で resurrect していた (RFC 6265 § 5.3 step 11 違反)。 `isExpiredSetCookie` helper で `Max-Age` (`<= 0`) / `Expires` (past date) を判定、 削除指示なら `store.delete(name)` で除去する経路を追加。 `Max-Age` が `Expires` より優先 (RFC 6265 § 4.1.2.2)。
  - **MINOR 6** ... 旧 docstring / コメントは「同名 child cookie が勝つ」 と書いていたが、 公式 `prependCookies` は文字列単位 dedupe で同 cookie 名で値違いは両方残す semantics (browser cookie jar が last-write-wins する前提)。 docstring と test (T-NR-009) を公式準拠の「両方残る」 で明示固定し、 SKILL.md レベルの documentation / test 仕様乖離を解消。

  ## Test additions

  - `T-NR-023 / T-NR-024` (MAJOR 1) ... folded Set-Cookie 分解 + Expires 内 comma 誤 split 防止
  - `T-NR-025` (MAJOR 2) ... `defer(data, { headers: { 'set-cookie': ... } })` の cookie persist / mergedHeaders 反映
  - `T-NR-026` (MAJOR 4) ... parent / child 双方の explicit cookie precedence 一致
  - `T-NR-027 / T-NR-028` (MAJOR 5) ... `Max-Age=0` / 過去 `Expires` で cookieStore が削除され next chain で resurrect しない
  - `T-NR-029` (MAJOR 3) ... parent loader の `undefined` return を error 捕捉
  - `T-RX-009b / T-RX-009c` (MAJOR 3) ... `invokeLoader` 単体での `undefined` throw + `null` accept の区別

  ## Coverage

  remix package 65 unit test all pass、 coverage `99.65 / 92.13 / 100 / 99.65` (gate 90/80/90/90 全クリア、 branch coverage v1.1.0 の 90.44 から +1.69pt 向上)、 `examples/remix-full` PoC 31 unit test も全て pass。

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
