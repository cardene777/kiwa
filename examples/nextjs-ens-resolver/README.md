# examples/nextjs-ens-resolver

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

An ENS-style name → address resolver on a minimal contract (`SimpleResolver`). Exercises register / resolve / unregister through Playwright.

## What you can try

- Register names via `SimpleResolver.register`
- Forward lookup name → address
- Custom-error revert when resolving an unregistered name
- Overwrite permissions when re-registering

## How to run

```bash
pnpm -F examples-nextjs-ens-resolver test
```

Next.js dev server runs on port 3042.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/ens.spec.ts` | Register → resolve → unregister + revert on unregistered name, 6 cases |

## Related cookbook entries

- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Event-search example → [examples/nextjs-event-history](../nextjs-event-history/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
