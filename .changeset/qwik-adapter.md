---
"@kiwa-test/ui": minor
---

Add `setupQwikComponentEnv` — Qwik (resumable framework) adapter built on `@noma.to/qwik-testing-library`. Matches the existing React / Vue / Svelte / Solid / Lit adapters: same `mode` (`render | interaction | snapshot`) and `stop()` contract, returns `{ kind: 'qwik', result, markup }`. Requires `@builder.io/qwik` ^1.12 and `@noma.to/qwik-testing-library` ^1.6 as optional peer deps, plus the `@builder.io/qwik/optimizer` Vite plugin on the consumer side. See the new Qwik quickstart in `packages/ui/README.md`.
