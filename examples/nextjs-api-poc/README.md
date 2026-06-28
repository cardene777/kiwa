# examples/nextjs-api-poc

Proof-of-concept that exercises `@kiwa-test/api` and `@kiwa-test/core` against a single Route Handler (`/api/items`).

## What this shows

- A Next.js-style Route Handler implemented as `(req: Request) => Response`.
- A Layer 1 kiwa-design spec (`tests/spec/integration/test-spec-items.api.md`) listing 9 cases with explicit `Mode` and `Route` columns.
- A Vitest suite that turns the spec into runnable tests across all three modes:
  - `live` — `setupApiServer({ mode: 'live', app })` actually launches the handler on a free port.
  - `mock` — msw handlers return canned responses without ever touching the live implementation.
  - `hybrid` — live server + msw overrides coexisting.

## Run

```bash
pnpm install
pnpm -F examples-nextjs-api-poc test
```

Expected output: `Test Files 1 passed (1) / Tests 9 passed (9)`.

## License

MIT
