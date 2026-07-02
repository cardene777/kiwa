# @kiwa-test/nextjs

## 1.1.0

### Minor Changes

- 9f92567: Next.js RSC streaming + Suspense boundary test helper を追加 (Issue #558、 v1.3-1)。

  ## What's added

  - `setupNextRscEnv({ component?, dataSource?, suspenseFallback?, streamingTimeout?, injectError?, props? })` — RSC streaming chunk + Suspense fallback / resolved 遷移 + error boundary を deterministic に capture する新規 helper。 既存 `renderServerComponent` (leaf-level + signal capture) の補完で、 streaming + Suspense に焦点を絞る。
  - `env.chunks` — streaming chunk を arrival order で配列保持 (fallback がある場合は chunks[0] = fallback、 以降は source yield 順)。
  - `env.fallback` — Suspense fallback markup (`<Suspense fallback={...}>` の解像前 state)。
  - `env.resolved` — 最終 resolved subtree (source 最後の chunk、 fallback only の場合は null)。
  - `env.errorBoundary` — `RSC_ERROR_BOUNDARY_SYMBOL` で brand された `error.tsx` 相当 signal、 component throw / stream throw / `injectError` の 3 経路で起動。
  - `env.timedOut` — `streamingTimeout` (default 5000ms) 到達時 true、 hung stream に test が止まらない safety gate。
  - `RSC_ERROR_BOUNDARY_SYMBOL` — `Symbol.for(...)` registered symbol (cross-realm 一致)。
  - 6 type を export — `SetupNextRscEnvOptions` / `SetupNextRscEnvResult` / `RscStreamSource` / `RscErrorBoundarySignal` + signal helpers。

  ## Coverage

  - `tests/setup-next-rsc-env.test.ts` で 15 test (T-SNE-001 .. T-SNE-015) all pass、 single-chunk / streaming order / Suspense fallback / fallback-only / component throw / injectError / mid-stream throw / streamingTimeout / dataSource precedence / 0ms fail-fast 等 cover。
  - 既存 4 layer (server-action / middleware / RSC leaf / parallel-routes) 回帰なし、 既存 46 test に 15 test 追加で 61 test all pass。

  ## Companion

  - PoC ... `examples/nextjs-app-router-full/app/items/_kiwa/items-streaming.ts` (streamItems async generator、 partial / final item list + error injection 経路) + `examples/nextjs-app-router-full/tests/items-streaming.test.ts` (T-NS-301 .. T-NS-305、 5 PoC test all pass)。
  - skill description 更新 (`/kiwa-nextjs --layer nextjs-rsc-streaming` mode 追加)。
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `nextjs-rsc-streaming` 追加。
  - stryker `mutate` + coverage `--coverage.include` に `setup-next-rsc-env.js` 追加。
  - release-smoke `import-surface.test.ts` に新 export 検証 block 追加。
  - root README Limitations 表に Next.js RSC streaming + Suspense ✅ 行追加、 Roadmap v1.3 行 1/6 にカウント。

  ## Out of scope (separate Issues)

  - 実 React `renderToReadableStream` rendering / flight payload byte format → leaf-level は `renderServerComponent` で十分、 wire protocol は別 Issue 候補
  - 同一 component 内の複数 Suspense boundary 並列 interleaving → 別 Issue 候補
  - client-side hydration after a chunk arrives → `@kiwa-test/ui` React mode

  関連: GitHub #558 (本 sub) / 親 #556 v1.3 milestone、 後続 sub = SvelteKit hooks (#559) / Astro view transitions (#560) / Remix Resource Routes (#561) / Nuxt middleware (#562) / ORM follow-up (#563)。

## 1.0.5

### Patch Changes

- 5c3ad4b: Next.js App Router Parallel Routes + Intercepting Routes test helper を追加 (Issue #523、 v1.2)。

  ## What's added

  - `invokeParallelRoutes(opts)` — `layout({ children, @modal, @sidebar })` 形式の parallel-route layout を isolated に render し、 全 slot を `Promise.all` で並列 await (slow slot が fast slot を block しない)、 per-slot error を `slotResults[]` に capture (broken slot が layout 全体を倒さない)。
  - Intercepting Routes 対応 — `intercepting: { variant: 'intercepted' | 'default', url, distance }` で soft-vs-hard navigation 切替を表現、 `variant: 'default'` 時は `defaultFallback` を強制 render (Intercepting Route の hard-nav 経路を test 内で再現)。
  - `PARALLEL_INTERCEPTION_SYMBOL` — `Symbol.for(...)` registered symbol で cross-realm 一致。
  - 9 type を export — `InvokeParallelRoutesOptions` / `InvokeParallelRoutesResult` / `ParallelLayoutFunction` / `ParallelLayoutChildren` / `SlotComponent` / `SlotInput` / `SlotRenderResult` / `DefaultFallbackComponent` / `InterceptionMatch`。

  ## Coverage

  - `tests/invoke-parallel-routes.test.ts` で 13 test (T-PR-001 .. T-PR-013) all pass、 parallel slot await + per-slot error isolation + default fallback + intercepting/default variant + zero slots edge case + custom childrenProps/slotProps 全部 cover。

  ## Companion

  - skill description 更新 (`/kiwa-nextjs --layer nextjs-parallel-route` mode 追加)
  - `kiwa-design` / `kiwa-review` の `--layer` enum に `nextjs-parallel-route` 追加
  - stryker `mutate` + coverage `--coverage.include` に `invoke-parallel-routes.js` 追加
  - release-smoke `import-surface.test.ts` に新 export 検証 block 追加
  - root README Limitations 表に Next.js Parallel Routes ✅ 行追加

  ## Out of scope (separate Issues)

  - 実 React renderer / flight payload serialization → `renderServerComponent` (leaf-level) との併用推奨
  - matcher / `loading.tsx` / `error.tsx` evaluation → 別 Issue
  - `'use client'` boundary → `@kiwa-test/ui` React mode

## 1.0.3

### Patch Changes

- 9b35a2a: 🎉 Next.js React Server Components (RSC) test adapter (Issue #494) — `renderServerComponent({ component, props })` で async server component を direct await + element tree を `findAll(tree, predicate)` / `textContent(tree)` で検証する軽量 helper を追加。

  ## API

  - `renderServerComponent<TProps>(opts): Promise<RenderServerComponentResult>` — async / sync server component を invoke して `{ tree, signal, error }` を返す。
  - `findAll(tree, predicate)` — element tree を再帰的に walk して predicate を満たす element 全件返す。
  - `textContent(tree)` — string / number leaf を space joined で連結 (`expect(textContent(tree)).toContain('hello')` 用)。
  - `NOT_FOUND_SYMBOL` / `FORBIDDEN_SYMBOL` / `RSC_REDIRECT_SYMBOL` — component が throw する signal の brand。
  - types: `RscNode` / `RscElement` / `RscSignal` / `NotFoundSignal` / `ForbiddenSignal` / `RscRedirectSignal` / `RenderServerComponentOptions` / `RenderServerComponentResult`。

  ## Coverage

  13 unit tests (正常系 / 空 props / sync component / findAll / textContent / 3 signals / 異常系 / data-testid 検索 / fetch / string return / boolean & null children) で `lines / branches / functions / statements` 全 100%。

  ## Companion

  - `/kiwa-nextjs` skill SKILL.md description / 3 mode (server-action + middleware + rsc) / RSC mode 9 column 拡張表 + test 生成 template を追加。
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `nextjs-rsc` 追加、 出力 path 表 / Glob 表に entry 追加。
  - `examples/nextjs-rsc-poc/` 新規 (5 case PoC、 UserPage notFound + UserList searchParams filter)。
  - README Limitations 表で RSC ❌ → ✅ production-ready (v1.0.3+) に更新。

  ## Scope

  軽量 element-tree 検証 helper。 full RSC flight payload format、 client component (`'use client'`) 境界、 suspense streaming は対象外 (server component が return する element の shape を assertion する用途に限定)。

## 1.0.2

### Patch Changes

- 08edc4b: 🎉 Next.js `middleware.ts` test adapter (Issue #495) — `invokeMiddleware({ middleware, url, method, headers, cookies, geo })` で simulated request 経由で middleware を direct invoke、 outgoing response headers / cookies / action (`next` / `redirect` / `rewrite` / `json`) を捕捉する。

  ## API

  - `invokeMiddleware(opts): Promise<InvokeMiddlewareResult>` — middleware を invoke して env を返す。
  - `middlewareActions.{next, redirect, rewrite, json}(...)` — production code が `NextResponse` の代わりに return する seam helper。
  - `MIDDLEWARE_ACTION_SYMBOL` — action object の brand symbol。
  - types: `MiddlewareFunction` / `MiddlewareRequest` / `MiddlewareEnv` / `MiddlewareAction` / `MiddlewareActionKind` / `InvokeMiddlewareOptions` / `InvokeMiddlewareResult`。

  ## Coverage

  12 unit tests (auth gate redirect / pass-through / api skip / locale rewrite / response header capture / cookie capture / json short-circuit / geo block / error / nextUrl parsing / header normalization / method override) で `lines / branches / functions / statements` 全 100%。

  ## Companion

  - `/kiwa-nextjs` skill SKILL.md に middleware mode + 9 column 拡張表 + test 生成 template を追加 (description / `/kiwa-design --layer nextjs-middleware` / `/kiwa-review --layer nextjs-middleware` も同期更新)。
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `nextjs-middleware` 追加、 出力 path 表 / Glob 表に entry 追加。
  - `examples/nextjs-middleware-poc/` 新規 (6 case PoC、 authGate + localeRewrite + headerInject)。
  - README Limitations 表で middleware ❌ → ✅ production-ready (v1.0.2+) に更新。

## 1.0.1

### Patch Changes

- 9b53f75: 🎉 New package `@kiwa-test/nextjs` v1.0 — Next.js App Router Server Actions test adapter (Issue #493、 first v1.1 deliverable).

  Invoke `'use server'` async functions in isolation through `invokeServerAction({ action, formData, args, cookies, headers })` and assert on the captured `env.redirect` / `env.cookies` / `env.headers` / `error` without a running Next.js server.

  ## What's in the box

  - `invokeServerAction<TResult>(opts)` — wrap a Server Action call and capture side-effects.
  - `REDIRECT_SYMBOL` — throw `{ [REDIRECT_SYMBOL]: true, url, type }` from the action's injected `env.redirect` seam to surface redirects in tests.
  - `CookieJar` / `ServerActionEnv` / `RedirectSignal` / `ServerActionResult` types.

  ## Test surface

  - 8/8 unit tests pass, coverage `98.61 lines / 94.11 branches / 87.5 functions / 98.61 statements` (above the 90/80/90/90 gate).
  - Release-smoke import-surface check added (`expect(typeof mod.invokeServerAction).toBe('function')`).

  ## Companion changes (this same PR)

  - New skill `/kiwa-nextjs` (`.claude/skills/kiwa-nextjs/`) — Layer 2 generator for Server Action tests, plus `references/server-action-seam.md` documenting Pattern A (env parameter, recommended) and Pattern B (module setter, legacy).
  - `/kiwa-design` adds `--layer nextjs-server-action` with a 9-column extension table (`ID / Observation / Given / FormData / Args / Then / Priority / Automation / Action`).
  - `/kiwa-test --target nextjs` (and `all`) routes the new chain.
  - `/kiwa-review --layer nextjs-server-action` review mode.
  - `examples/nextjs-server-actions-poc/` — 4-case PoC exercising login redirect + cookie state + validation paths.

  ## Out of scope (tracked separately for v1.1)

  - React Server Components (RSC) — Issue #494, separate package mode.
  - Next.js `middleware.ts` — Issue #495.
  - Real `revalidatePath` / `revalidateTag` capture — deferred until real-world demand surfaces.
