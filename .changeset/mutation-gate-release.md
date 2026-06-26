---
"@kiwa-test/spec": patch
"@kiwa-test/core": patch
"@kiwa-test/api": patch
"@kiwa-test/ui": patch
"@kiwa-test/data": patch
"@kiwa-test/cli-test": patch
"@kiwa-test/observability": patch
"@kiwa-test/e2e": patch
"@kiwa-test/cli": patch
"@kiwa-test/a11y": patch
"@kiwa-test/visual": patch
---

Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
