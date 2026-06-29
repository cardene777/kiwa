---
'@kiwa-test/astro': patch
---

Astro `.astro` page SSR test helper を追加 (Issue #523、 v1.2)。

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
