# @kiwa-lab/fresh

## 0.2.0

### Minor Changes

- cb53fae: New package `@kiwa-lab/fresh` v0.1 — Deno Fresh Islands + Route Handler + Head normalization test adapter (Issue #814, v1.19-1b). Provides `invokeFreshHandler` + `defineRoute` + `invokeDefineRoute` + `defineIsland` + `mountIsland` + `hydrateIslands` + `simulateInteraction` + `defineHead` + `mergeHead` + `renderHead` + `extractHead` + JSX-shaped helpers (`h` / `stringify` / `findNodes`) + brand symbols (`FRESH_REDIRECT_SYMBOL` / `FRESH_NOT_FOUND_SYMBOL` / `FRESH_ROUTE_SYMBOL` / `ISLAND_SYMBOL` / `ISLAND_MOUNT_SYMBOL` / `HEAD_SYMBOL`). 58 unit tests passing (route 26 + islands 16 + head 16), coverage 97.5% lines / 92.3% branches / 91.2% functions, release gate 7 軸 pass.

## 0.1.0

### Minor Changes

- New package `@kiwa-lab/fresh` v0.1 — Deno Fresh Islands + Route Handler + Head normalization test adapter (Issue #814, v1.19-1b).

  ## What's in the box

  - `invokeFreshHandler({ handlers, req, params, state, page })` — dispatches a Fresh `handler` for the request method, captures `ctx.render(data)` calls, invokes an optional page component with `PageProps`, and returns `{ response, renderData, page, redirect, notFound, error }`. Handles direct `Response` returns, `ctx.redirect()` + `ctx.renderNotFound()` shortcuts, thrown `redirect()` / `notFound()` signals, and `405` fallback with `Allow` header when the method is unhandled.
  - `defineRoute<T>(fn)` + `invokeDefineRoute({ route, req, params, state })` — Fresh's `defineRoute` wrapper with a brand symbol + `invokeDefineRoute` runner that synthesizes a minimal `ctx`, awaits the body, captures redirect / not-found / non-signal throws, and returns `{ tree, redirect, notFound, error, html }`.
  - `defineIsland({ name, component, defaultProps })` + `islandPlaceholder(island, props)` + `mountIsland(island, props)` + `hydrateIslands({ ssrTree, islands })` — model Fresh's islands architecture: SSR emits `<div data-island="Name" data-props="{...}">` placeholders, `hydrateIslands` walks the tree, decodes `data-props`, mounts the matching island component, and returns a diff (`hydrated` / `missing` / `unregistered`) plus the fully hydrated HTML string.
  - `simulateInteraction({ mount, event, value, targetType })` — dispatch a synthetic `click` / `input` / `submit` (etc.) event against a mounted island, invokes every `on{Event}` handler collected from the tree, supports `preventDefault()` + `defaultPrevented` capture, and optionally exposes the first matching element on `event.target` via a `targetType` filter.
  - `defineHead({ title, meta, link, script, base })` + `mergeHead([...fragments])` + `renderHead(head)` + `extractHead(tree)` — Fresh's `<Head>` collection semantics: merge N fragments in order with dedup rules matching Fresh (latest title wins, meta dedup by `name` / `property` / `httpEquiv`, `charset` singleton emitted first, link dedup by `rel + href`, script dedup by `src` + inline scripts always kept, latest base wins). `renderHead` emits in canonical order (`title → base → meta → link → script`) so tests can diff on the exact serialized shape.
  - `h(type, props, ...children)` + `stringify(tree)` + `findNodes(tree, predicate)` + `isFreshVNode` — lightweight JSX factory + tree walker + HTML5-spec void-element self-closing (`<meta>` / `<link>` / etc. render as `<meta ... />`, not `<meta></meta>`).
  - Brand symbols: `FRESH_REDIRECT_SYMBOL` / `FRESH_NOT_FOUND_SYMBOL` / `FRESH_ROUTE_SYMBOL` / `ISLAND_SYMBOL` / `ISLAND_MOUNT_SYMBOL` / `HEAD_SYMBOL`.

  ## Coverage

  58 unit tests passing (route 26 + islands 16 + head 16)、 coverage `lines / statements 97.51%`、 `branches 92.28%`、 `functions 91.22%` (全 90/80% 閾値超え)。 release gate 7 軸 pass (build ESM + CJS + DTS clean、 typecheck clean、 coverage above 90/80)。

  ## Out of scope (separate Issues)

  - real Deno runtime + Deno Fresh file-system router → tests invoke handlers / defineRoute wrappers directly
  - middleware chain (`_middleware.ts`) traversal → separate Issue
  - `_app.tsx` / `_layout.tsx` nesting → separate Issue
  - real esbuild islands bundle compilation → tests operate on virtual trees
  - real DOM (synthetic events don't bubble) → `simulateInteraction` captures handler invocations only
  - Signal-based reactive graph → see `@kiwa-lab/solidjs` for that shape

  ## Companion

  - v1.19-1 (#807) は SolidJS (#813) + 本 pkg + Hono (#8xx) の 3 分割で 1 pkg = 1 PR 化.
  - `packages/fresh/{stryker.config.mjs,vitest.stryker.config.mjs}` 配置で mutation gate 統合準備.
  - `scripts/check-coverage-gates.mjs` + `scripts/check-mutation-gates.mjs` に `@kiwa-lab/fresh` 行追加.
  - `tests/release-smoke/tests/import-surface.test.ts` に new export block 追加.
  - root README Roadmap v1.19 行にカウント.

  関連: GitHub #814 (本 sub) / 親 #807 v1.19-1 / v1.19 milestone #806.
