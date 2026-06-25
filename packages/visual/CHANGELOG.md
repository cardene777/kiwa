# @kiwa-test/visual

## 0.1.1

### Patch Changes

- 8f0348c: Add a README.md to the published tarball so the npm package detail page renders install + Quickstart + API instead of being blank. Source `packages/{a11y,visual}/src/` and behavior unchanged.

## 0.1.0

### Minor Changes

- dabacd9: v9 — @kiwa-test/visual v0.1.0 新設: visual regression test adapter

  - `comparePngBuffers(baseline, actual, opts)` ... pixelmatch + pngjs を lazy load して PNG diff、 diffPixels + diffRatio + ok + diffBuffer を返す
  - `expectNoVisualDiff(result, expect)` ... `ok=false` で throw する vitest helper
  - maxDiffRatio (default 0.005 = 0.5%) / threshold / includeAA / emitDiff カスタマイズ可
