# @kiwa-lab/solidjs

## 0.1.0

### Minor Changes

- 🎉 New package `@kiwa-lab/solidjs` v0.1 — SolidJS Signal + Effect + createResource + Suspense boundary test adapter (Issue #813, v1.19-1a).

  ## What's in the box

  - `mockSignal(initial)` — Solid-shaped `[getter, setter]` pair with subscribe / unsubscribe wired to the effect system, `Object.is` equality short-circuit, and updater-fn setter form.
  - `mockEffect(fn)` — immediate + reactive re-run, `runCount()` / `trace()` / `dispose()`, dedup inside `batch()`.
  - `batch(fn)` — group signal writes so subscribed effects run at most once per batch (nested batch flushes once at the outermost boundary).
  - `track(fn)` — capture every signal getter read inside the callback into `{ result, reads }`.
  - `createResourceStub(fetcher)` — full state machine (`unresolved` → `pending` → `ready` / `errored` / `refreshing`) with `refetch()` + `mutate()` + `latest` accessors.
  - `renderSolid({ component, props })` — synchronous mount + effect scope capture + `dispose()` teardown + `html()` SSR-shaped stringifier.
  - `hydrate({ component, ssrMarkup })` — reports `hydrated: boolean` + human-readable `mismatch` string when client HTML diverges from SSR markup.
  - `createRoot(fn)` — mirrors Solid's `createRoot(dispose => ...)`, runs the body inside a fresh effect scope + exposes `scope.disposed()`.
  - `h(type, props, ...children)` — lightweight JSX-shaped factory for tests + component bodies.
  - `findElements(tree, predicate)` — depth-first virtual DOM walker.
  - `invokeSolidRoute({ page, load, params, query })` — SolidStart-shaped route runner with `redirect()` / `notFound()` signal capture.
  - `renderWithSuspense({ component, fallback, waitFor, timeoutMs })` — first mounts the fallback tree, awaits `waitFor` (or times out at `timeoutMs`, default 5000), then remounts the component and returns a `SUSPENSE_BOUNDARY_SYMBOL`-branded signal with `fallback` / `resolved` / `timedOut` fields.
  - `errorBoundary({ component, fallback })` — wraps a component body so throws land in a `ERROR_BOUNDARY_SYMBOL`-branded signal carrying the caught error + rendered fallback.
  - Brand symbols: `SIGNAL_SYMBOL` / `EFFECT_SYMBOL` / `RESOURCE_SYMBOL` / `SOLID_ELEMENT_SYMBOL` / `SOLID_ROOT_SYMBOL` / `SOLID_REDIRECT_SYMBOL` / `SOLID_NOT_FOUND_SYMBOL` / `SUSPENSE_BOUNDARY_SYMBOL` / `ERROR_BOUNDARY_SYMBOL`.

  ## Coverage

  42 unit tests passing (signal 18 + render 14 + route 10)、 coverage `lines / functions / statements` 全 100%、 branches 97.6%. release gate 7 軸 pass (build ESM + CJS + DTS clean、 typecheck clean、 coverage above 80%).

  ## Out of scope (separate Issues)

  - real Solid runtime binding (`solid-js` package integration) → tests use standalone mocks with the same brand symbols
  - fine-grained dependency tracking of downstream computations beyond direct signal reads → mockEffect only subscribes to signals it reads
  - real `startTransition` concurrent rendering → batched writes go through `batch()`
  - true Suspense pause mid-render → renderWithSuspense first mounts fallback then swaps to the resolved tree (deterministic 2-phase model)
  - full DOM API (real synthetic events / attributes with side-effects) → `stringify()` renders SSR-shaped HTML, tests assert on shape

  ## Companion

  - v1.19-1 (#807) は本 pkg + Fresh (#814) + Hono (#8xx) の 3 分割で 1 pkg = 1 PR 化.
  - `packages/solidjs/{stryker.config.mjs,vitest.stryker.config.mjs}` 配置で mutation gate 統合準備.
  - `scripts/check-coverage-gates.mjs` に `@kiwa-lab/solidjs` 行追加.
  - `tests/release-smoke/tests/import-surface.test.ts` に new export block 追加.
  - root README Limitations 表に SolidJS Signal ✅ 行追加、 Roadmap v1.19 行にカウント.

  関連: GitHub #813 (本 sub) / 親 #807 v1.19-1 / v1.19 milestone #806.
