---
"@kiwa-test/api": patch
---

Strengthen `@kiwa-test/api` mutation test coverage. MSI raised from 79.55% to **92.42%** by adding 38 mutation-kill tests targeting null body / ArrayBuffer body / Uint8Array body / object-spread header layering / `path.startsWith('http')` branch / msw `onUnhandledRequest: 'bypass'` side effect / stop() side effect. Stryker config updated to mutate all 4 source files (was 2) with `thresholds.break: 80`. No public API change.
