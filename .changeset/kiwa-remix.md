---
"@kiwa-test/remix": patch
---

🎉 New package `@kiwa-test/remix` v1.0 — Remix v2 / React Router v7 loader + action test adapter (Issue #498、 v1.1 milestone 7/8).

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
