# examples/nextjs-server-actions-poc

Proof of concept for [`@kiwa-lab/nextjs`](../../packages/nextjs) — drives a Next.js Server Action through Vitest without a running Next.js server.

The example uses the **injectable env seam** pattern documented in [`server-action-seam.md`](../../.claude/skills/kiwa-nextjs/references/server-action-seam.md). The action under test accepts `(formData, env)`, defaulting to a production-shaped env that throws a kiwa redirect signal. The test substitutes a recording env so it can assert on the captured redirect URL + cookie writes.

## What it covers

- ✅ Server Action invocation through `invokeServerAction({ action, formData, args })`
- ✅ `redirect()` capture via `REDIRECT_SYMBOL` → `env.redirect.url` assertion
- ✅ `cookies().set()` capture via a recording env → assertion on the recorded map
- ✅ FormData input validation paths (`error.message`)

## Run

```bash
pnpm -F examples-nextjs-server-actions-poc test
```

## Notes

This PoC does not ship a real Next.js app (no `app/`, no `next.config.ts`). It is a pure Vitest workspace that exercises the helper in isolation. A full-stack example (Next.js dev server + Playwright e2e + Server Action unit test in the same project) lives separately under the `examples/nextjs-*` family once Issue #494 (RSC) and #495 (middleware) ship in v1.1.
