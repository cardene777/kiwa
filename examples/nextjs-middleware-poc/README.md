# examples/nextjs-middleware-poc

Proof of concept for `@kiwa-lab/nextjs` middleware mode (Issue #495). Tests three real-world middleware patterns — auth gate, locale rewrite, header inject — through `invokeMiddleware` without a running Next.js server.

## What it covers

- ✅ `auth gate` → `middlewareActions.redirect('/login')` on missing session cookie, pass-through on `/api/*`
- ✅ `locale rewrite` → `middlewareActions.rewrite('/{locale}/...')` based on cookie, idempotent when already prefixed
- ✅ `header inject` → `env.setHeader(...)` for security headers (X-Frame-Options / X-Content-Type-Options / Referrer-Policy)

## Run

```bash
pnpm -F examples-nextjs-middleware-poc test
```

## Notes

This PoC is a pure Vitest workspace (no `next.config.ts`, no `app/`). A full-stack `examples/nextjs-*` example would import from `next/server` directly; the middleware module here demonstrates the kiwa seam pattern instead.
