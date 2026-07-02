# @kiwa-test/astro

## 1.2.0

### Minor Changes

- 170bc54: Astro v5 View Transitions API の 4 lifecycle event を 1 env で capture できる test helper を追加 (Issue #560、 v1.3-3)。

  ## What's added

  - `setupAstroViewTransitionEnv({ fromPath, toPath, transitionName, navigationType, direction, fromHtml, toHtml, supportsViewTransitions, formData, sourceElement, info })` — 1 度 env を build して 4 lifecycle event (`astro:before-preparation` / `astro:after-preparation` / `astro:before-swap` / `astro:after-swap`) を `dispatchAll()` で順次 dispatch できる helper。 個別 event は `dispatch(type)` で単発 invoke 可能、 listener は `on(type, listener)` で登録し `off(type, listener)` で解除する。
  - 公式 router 動作 (Astro v5 / `node_modules/astro/dist/transitions/{router.js,events.js}`) と厳密に整合 ... `supportsViewTransitions` flag は preparation event の dispatch 有無に **影響せず**、 `before-swap.viewTransition` を `undefined` にするだけ (= 視覚 transition の有無のみ表現)。 `after-preparation` / `after-swap` event は plain (`type` のみ、 `from` / `to` / `newDocument` は持たない)。 `before-swap.swap()` は post-listener で **必ず** 1 回呼ばれ、 listener が呼べば計 2 回 (`swapCallCount` で観測可能)。
  - `before-preparation.preventDefault()` で nav cancellation (preparation 中断)、 `before-preparation.loader = async () => {...}` で loader override、 `before-swap.swap()` で DOM swap timing 制御を listener に expose。
  - `env.diffDom()` — from-page と to-page の top-level tag 差分 (added / removed / kept) を抽出、 void element (`<img>` / `<br>` / `<hr>` / `<input>` 等) / 自己終端形 (`<x />`) / HTML comment / DOCTYPE を識別する parser、 named view transition (`transition:name`) 起点の DOM 移動を assertion 可能。
  - new types: `SetupAstroViewTransitionEnvOptions` / `AstroViewTransitionEnv` / `AstroViewTransitionEvent` / `AstroViewTransitionEventPayload` / `AstroBeforePreparationEvent` / `AstroAfterPreparationEvent` / `AstroBeforeSwapEvent` / `AstroAfterSwapEvent` / `AstroViewTransitionEventType` / `AstroViewTransitionListener` / `AstroViewTransitionDispatchResult` / `AstroViewTransitionDomDiff`.

  ## Why

  v1.0.x の `invokeEndpoint` / `renderAstroPage` は API Route と `.astro` page SSR 単体の動作を test できるが、 Astro v5 で標準化された View Transitions API (`<ViewTransitions />` component) の lifecycle event を unit test する方法がなかった。 v1.1 では 4 event 全てを 1 env で順次 dispatch し、 listener 側 (page 内 script / framework hook) の挙動を real browser なしで検証できる。 既存 `invokeEndpoint` / `renderAstroPage` は backward compat 維持。

  ## Coverage

  22 new unit tests (`setup-view-transition-env.test.ts`、 T-AVT-001 〜 T-AVT-022)、 astro package 全体 coverage `lines 97.84 / branches 88.28 / functions 90.69 / statements 97.84` (gate 90/80/90/90 全クリア)。

  ## Companion

  - `tests/release-smoke/tests/import-surface.test.ts` に v1.1+ export 検証 (`setupAstroViewTransitionEnv`) を追加。
  - `packages/astro/stryker.config.mjs` の mutate に `setup-view-transition-env.js` を追加、 `test:cov` の coverage.include 拡張。
  - `packages/astro/package.json` description / keywords に View Transitions を反映。

  ## Out of scope

  - Real browser の `document.startViewTransition()` による visual transition (CSS animation / pseudo-element timing) — Playwright e2e で別途 cover (`tests/e2e/astro-view-transitions.spec.ts` 参照)。
  - Astro prefetch event (`astro:before-prefetch`) — 需要次第で別 Issue。
  - HTML perfect diff (`from.body.innerHTML` vs `to.body.innerHTML` の文字列単位差分) — `env.diffDom()` の top-level tag 比較で大半の use case を cover、 詳細は jsdom / happy-dom を別途 setup して assertion。

## 1.1.0

### Minor Changes

- Astro v5 View Transitions API の 4 lifecycle event を 1 env で capture できる test helper を追加 (Issue #560、 v1.3-3).

  ## What's added

  - `setupAstroViewTransitionEnv({ fromPath, toPath, transitionName, navigationType, direction, fromHtml, toHtml, supportsViewTransitions, formData, sourceElement, info })` — 1 度 env を build して 4 lifecycle event (`astro:before-preparation` / `astro:after-preparation` / `astro:before-swap` / `astro:after-swap`) を `dispatchAll()` で順次 dispatch、 個別 event は `dispatch(type)` で単発 invoke 可。 listener は `on(type, listener)` 登録 / `off(type, listener)` 解除。
  - 公式 router 動作 (Astro v5 / `node_modules/astro/dist/transitions/{router.js,events.js}`) と厳密に整合 ... `supportsViewTransitions` flag は preparation event の dispatch 有無に **影響せず**、 `before-swap.viewTransition` を `undefined` にするだけ (= 視覚 transition の有無のみ表現)。 `after-preparation` / `after-swap` event は plain (`type` のみ、 `from` / `to` / `newDocument` は持たない)。 `before-swap.swap()` は post-listener で **必ず** 1 回呼ばれ、 listener が呼べば計 2 回 (`swapCallCount` で観測可能、 listener が swap を no-op 化したい場合は `event.swap = () => {}`)。
  - `before-preparation.preventDefault()` で nav cancellation (preparation 中断)、 `loader = async () => {...}` で loader override (公式 `doPreparation` 互換)。
  - `env.diffDom()` — from-page と to-page の top-level tag 差分 (added / removed / kept) を抽出、 void element (`<img>` / `<br>` / `<hr>` / `<input>` 等 14 種) / 自己終端形 (`<x />`) / HTML comment / DOCTYPE / CDATA を識別する parser、 named view transition (`transition:name`) 起点の DOM 移動を assertion 可能。
  - 12 type を export — `SetupAstroViewTransitionEnvOptions` / `AstroViewTransitionEnv` / `AstroViewTransitionEvent` / `AstroViewTransitionEventPayload` / `AstroBeforePreparationEvent` / `AstroAfterPreparationEvent` / `AstroBeforeSwapEvent` / `AstroAfterSwapEvent` / `AstroViewTransitionEventType` / `AstroViewTransitionListener` / `AstroViewTransitionDispatchResult` / `AstroViewTransitionDomDiff`.

  ## Coverage

  28 new unit tests (T-AVT-001 .. T-AVT-027 + T-AVT-008-2)、 astro package 全体 coverage `lines 97.92 / branches 91.80 / functions 90.69 / statements 97.92` (gate 90/80/90/90 全クリア)。

  ## Companion

  - skill update (`/kiwa-astro --layer astro-view-transitions` mode 追加、 9 column 表 + template + 11 観点 mapping)
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `astro-view-transitions` 追加
  - stryker `mutate` + coverage `--coverage.include` に `setup-view-transition-env.js` 追加
  - release-smoke `import-surface.test.ts` に v1.1+ export 検証 (`setupAstroViewTransitionEnv`) 追加
  - PoC ... `examples/astro-server-endpoints-full/src/pages/blog/` に View Transitions 起点 + 遷移先 page 追加、 `tests/view-transitions.test.ts` で `setupAstroViewTransitionEnv` 5 test (unit) + `tests/e2e/astro-view-transitions.spec.ts` で Playwright e2e 3 test (real `<ViewTransitions />`)

  ## Out of scope (separate Issues)

  - Real browser の `document.startViewTransition()` による visual transition (CSS animation / pseudo-element timing) — Playwright e2e で別途 cover。
  - Astro prefetch event (`astro:before-prefetch`) — 需要次第で別 Issue。
  - HTML perfect diff (`from.body.innerHTML` vs `to.body.innerHTML` の文字列単位差分) — `env.diffDom()` の top-level tag 比較で大半の use case を cover、 詳細は jsdom / happy-dom を別途 setup して assertion。

## 1.0.3

### Patch Changes

- 5c3ad4b: Astro `.astro` page SSR test helper を追加 (Issue #523、 v1.2)。

  ## What's added

  - `renderAstroPage(opts)` — `.astro` page を Astro Container API 不要で isolated に render し、 HTML string / Response / redirect signal / notFound signal / rewrite signal を normalize して return。 page は `(context: SimulatedAstroContext) => string | Response` 形式の async function として呼出。
  - `kiwaAstroNotFound(response?)` — `throw Astro.notFound()` 等価の branded signal を helper 内で構築 (real Astro runtime の `notFound()` import なしで test 可能)。
  - `SimulatedAstroContext` — `request` / `url` / `params` / `props` / `site` / `generator` / `locals` / `cookies` / `redirect()` / `rewrite()` 全 9 surface を hand-rolled (Astro Container API import なし)。
  - 3 signal symbol — `ASTRO_REDIRECT_SYMBOL` / `ASTRO_NOT_FOUND_SYMBOL` / `ASTRO_REWRITE_SYMBOL` (全部 `Symbol.for(...)`)。
  - 9 type を export — `AstroPageComponent` / `RenderAstroPageOptions` / `RenderAstroPageResult` / `SimulatedAstroContext` / `AstroSignal` / `AstroRedirectSignal` / `AstroNotFoundSignal` / `AstroRewriteSignal`。

  ## Coverage

  - `tests/render-astro-page.test.ts` で 17 test (T-AP-001 .. T-AP-017) all pass、 HTML string / Response 両 return + cookies mutate + redirect (default 302 + custom 301) + notFound (default 404 + custom Response) + rewrite + non-signal error 500 + async page + site optional 全部 cover。

  ## Companion

  - skill description 更新 (`/kiwa-astro --layer astro-ssr` mode 追加)
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `astro-ssr` 追加
  - stryker `mutate` + coverage `--coverage.include` に `render-astro-page.js` 追加
  - release-smoke `import-surface.test.ts` に新 export 検証 block 追加
  - root README Limitations 表で `.astro` SSR を ✅ 化、 v1.2 roadmap から該当項目除去

  ## Out of scope (separate Issues)

  - Astro Islands (`client:*` directive) → `@kiwa-test/ui` Vue/React/Svelte adapter
  - View transitions / streaming SSR → 別 Issue
  - HTML-perfect snapshot → Astro Container API 直接利用推奨 (本 helper は redirect / notFound / locals 等の **動作** 検証に focus)

## 1.0.1

### Patch Changes

- a21876d: 🎉 New package `@kiwa-test/astro` v1.0 — Astro Server Endpoints (`pages/api/*.ts`) test adapter (Issue #499、 v1.1 milestone 8/8 完成).

  ## What's in the box

  - `invokeEndpoint<TParams>({ endpoint, url, method, params, headers, cookies, formData, jsonBody, locals, site })` — invoke an `APIRoute` (`(context: APIContext) => Response`) with a simulated APIContext and capture the returned `Response` + auto-normalized `redirect` (status / url) for 3xx responses.
  - types: `APIRoute` / `SimulatedAPIContext` / `InvokeEndpointOptions` / `InvokeEndpointResult`.
  - `context.redirect(path, status?)` helper built into the simulated context (matches Astro's `APIContext.redirect`).

  ## Coverage

  18 unit tests passing, coverage `lines / branches / functions / statements` 全 100%.

  ## Companion

  - New skill `/kiwa-astro` (`.claude/skills/kiwa-astro/`) — Layer 2 generator with 9 column extension table for `astro-endpoint`.
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `astro-endpoint` 追加 (Issue #499 / 出力 path 表 / Glob path)。
  - `release.yml` + `scripts/check-coverage-gates.mjs` + `tests/release-smoke/` 4 file + `package.json` release script を 15 packages 化。
  - README Limitations 表で Astro Server Endpoints ❌ → ✅ production-ready (v1.0.0+).

  ## Out of scope (separate Issues)

  - Astro Islands (client-side hydration) — covered by `@kiwa-test/ui` framework adapters (React / Vue / Svelte / Solid / Lit / Qwik / Angular).
  - `.astro` page SSR rendering — use Astro Container API directly (`experimental_AstroContainer`), helper not needed.

  ## v1.1 milestone closeout

  This is the **final v1.1 milestone PR** — all 8 issues resolved (#492 PyPI / #493 Server Actions / #494 RSC / #495 middleware / #496 Nuxt / #497 SvelteKit / #498 Remix / #499 Astro).
