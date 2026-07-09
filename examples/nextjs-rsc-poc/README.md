# examples/nextjs-rsc-poc

Proof of concept for `@kiwa-lab/nextjs` RSC mode (Issue #494). Tests two real-world async server components — `UserPage([slug])` (notFound throw) and `UserList(?q=)` (searchParams filter) — through `renderServerComponent` without a running Next.js server or JSX runtime.

## What it covers

- ✅ `renderServerComponent({ component, props })` direct await
- ✅ `notFound()` throw captured via `NOT_FOUND_SYMBOL` signal
- ✅ Element tree introspection via `findAll(tree, predicate)` and `textContent(tree)`
- ✅ `searchParams.q` filter logic

## Run

```bash
pnpm -F examples-nextjs-rsc-poc test
```

## Notes

The PoC uses a plain object element factory (`el('main', {}, ...)`) instead of JSX. In a real Next.js app the component would use JSX (`<main>...</main>`) and the React runtime; the kiwa helper doesn't care about the renderer — it just awaits the function and walks the returned object tree.
