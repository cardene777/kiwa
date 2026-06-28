---
"@kiwa-test/nextjs": patch
---

🎉 New package `@kiwa-test/nextjs` v1.0 — Next.js App Router Server Actions test adapter (Issue #493、 first v1.1 deliverable).

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
