---
"@kiwa-test/sveltekit": patch
---

🎉 New package `@kiwa-test/sveltekit` v1.0 — SvelteKit `+page.server.ts` load + form actions test adapter (Issue #497、 v1.1 milestone 6/8).

## What's in the box

- `invokeLoad({ load, url, params, cookies, locals, fetch })` — invoke a `load` function and capture `data` / `redirect` / `error` / `env.responseHeaders` / `env.cookies`.
- `invokeAction({ action, url, formData, cookies, locals, method })` — invoke a form action callback and capture `result` / `fail` / `redirect` / `error` / `env.cookies`.
- `redirect(status, location)` / `error(status, message)` / `fail(status, data)` — kiwa equivalents of SvelteKit's signal helpers; throw or return them from your handler and the helper normalizes them into the result fields.
- 3 brand symbols: `SK_REDIRECT_SYMBOL` / `SK_ERROR_SYMBOL` / `SK_FAIL_SYMBOL`.

## Coverage

17 unit tests (load 10 + action 7) で `lines / branches / functions / statements` 全 100%.

## Companion

- New skill `/kiwa-sveltekit` — Layer 2 generator with 9 column extension tables for both load and action modes.
- `/kiwa-design` / `/kiwa-review` の `--layer` 選択肢に `sveltekit-load` / `sveltekit-action` 追加。
- `release.yml` workflow + `scripts/check-coverage-gates.mjs` + `tests/release-smoke/` 4 file + `package.json` release script を 14 packages 化。
- README Limitations 表で SvelteKit ❌ → ✅ production-ready (v1.0.0+).

## Out of scope (separate Issues)

- `hooks.server.ts` の `handle` (server hooks) — 別 Issue。
- `+server.ts` の standalone server endpoints (GET / POST) — load mode の variant で吸収可能、 専用 helper は需要次第で別 Issue。
