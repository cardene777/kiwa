---
"@kiwa-test/ui": minor
---

Add `setupLitComponentEnv` — Lit (Web Components) adapter built on `@open-wc/testing-helpers`. Matches the existing React / Vue / Svelte / Solid adapters: same `mode` (`render | interaction | snapshot`) and `stop()` contract, returns `{ kind: 'lit', handle, markup }`. `handle.shadowQuerySelector` provides a one-call shortcut into the upgraded element's shadow DOM. Requires `lit` ^3 and `@open-wc/testing-helpers` ^3 as optional peer deps. See the new Lit quickstart in `packages/ui/README.md`.
