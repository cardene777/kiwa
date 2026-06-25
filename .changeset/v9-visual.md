---
"@kiwa-test/visual": minor
---

v9 — @kiwa-test/visual v0.1.0 新設: visual regression test adapter

- `comparePngBuffers(baseline, actual, opts)` ... pixelmatch + pngjs を lazy load して PNG diff、 diffPixels + diffRatio + ok + diffBuffer を返す
- `expectNoVisualDiff(result, expect)` ... `ok=false` で throw する vitest helper
- maxDiffRatio (default 0.005 = 0.5%) / threshold / includeAA / emitDiff カスタマイズ可
