# @kiwa-test/visual

## 0.1.3

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa-test/core@0.1.1

## 0.1.2

### Patch Changes

- 416b360: Introduce mutation testing for `@kiwa-test/visual`. Stryker config (`thresholds.break: 80`) added with jsonReporter. MSI rises from 74.07% to **81.48%** after 15 mutation-kill tests targeting size-mismatch branches (width vs height) / `opts.threshold` default / `opts.includeAA` default / `opts.emitDiff` default / `diffRatio` arithmetic / `ok` epsilon tolerance / pixelmatch options forwarding / `expectNoVisualDiff` error message. No public API change.

## 0.1.1

### Patch Changes

- 8f0348c: Add a README.md to the published tarball so the npm package detail page renders install + Quickstart + API instead of being blank. Source `packages/{a11y,visual}/src/` and behavior unchanged.

## 0.1.0

### Minor Changes

- dabacd9: v9 — @kiwa-test/visual v0.1.0 新設: visual regression test adapter

  - `comparePngBuffers(baseline, actual, opts)` ... pixelmatch + pngjs を lazy load して PNG diff、 diffPixels + diffRatio + ok + diffBuffer を返す
  - `expectNoVisualDiff(result, expect)` ... `ok=false` で throw する vitest helper
  - maxDiffRatio (default 0.005 = 0.5%) / threshold / includeAA / emitDiff カスタマイズ可
