---
"@kiwa-test/astro": patch
---

🎉 New package `@kiwa-test/astro` v1.0 — Astro Server Endpoints (`pages/api/*.ts`) test adapter (Issue #499、 v1.1 milestone 8/8 完成).

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
