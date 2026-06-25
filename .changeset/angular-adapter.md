---
"@kiwa-test/ui": minor
---

Add `setupAngularComponentEnv` — Angular adapter built on `@testing-library/angular`. Matches the existing React / Vue / Svelte / Solid / Lit / Qwik adapters: same `mode` (`render | interaction | snapshot`) and `stop()` contract, returns `{ kind: 'angular', result, markup }`. Requires `@angular/core` ^17–^19, `@testing-library/angular` ^17–^19, `@angular/platform-browser-dynamic` and `zone.js` as optional peer deps, plus a TestBed-aware Vitest setup file on the consumer side. See the new Angular quickstart in `packages/ui/README.md`.
