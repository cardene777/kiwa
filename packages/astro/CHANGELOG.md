# @kiwa-test/astro

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
