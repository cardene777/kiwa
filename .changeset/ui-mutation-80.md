---
"@kiwa-test/ui": patch
---

Strengthen `@kiwa-test/ui` mutation test coverage. MSI raised from 76.92% to **82.11%** by adding 24 mutation-kill tests across React (`setup-component-env`), Vue, Solid, and Lit adapters. Stryker config updated to mutate all 4 active adapters (Svelte / Qwik / Angular are excluded because their framework-specific compilers don't run inside the package-local Vitest pipeline). MSI per file: Lit 90.00% / setup-component-env 87.18% / Vue 73.68% / Solid 70.59% — Vue and Solid are thin wrappers around `@vue/test-utils` and `@solidjs/testing-library` whose internal cleanup makes additional mutants equivalent. No public API change.
