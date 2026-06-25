---
"@kiwa-test/ui": minor
---

Add `setupSolidComponentEnv` — SolidJS adapter built on `@solidjs/testing-library`. Matches the existing React / Vue / Svelte adapters: same `mode` (`render | interaction | snapshot`) and `stop()` contract, returns `{ kind: 'solid', result, markup }`. Requires `solid-js` ^1.9 and `@solidjs/testing-library` ^0.8 as optional peer deps. See the new SolidJS quickstart in `packages/ui/README.md`.
