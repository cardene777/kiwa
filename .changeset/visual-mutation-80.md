---
"@kiwa-test/visual": patch
---

Introduce mutation testing for `@kiwa-test/visual`. Stryker config (`thresholds.break: 80`) added with jsonReporter. MSI rises from 74.07% to **81.48%** after 15 mutation-kill tests targeting size-mismatch branches (width vs height) / `opts.threshold` default / `opts.includeAA` default / `opts.emitDiff` default / `diffRatio` arithmetic / `ok` epsilon tolerance / pixelmatch options forwarding / `expectNoVisualDiff` error message. No public API change.
