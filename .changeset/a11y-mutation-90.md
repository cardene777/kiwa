---
"@kiwa-test/a11y": patch
---

Introduce mutation testing for `@kiwa-test/a11y`. Stryker config (`thresholds.break: 80`) added with jsonReporter. MSI achieves **93.62%** out of the gate after 8 mutation-kill tests targeting `runOptions` defaulting / `runOptions` forwarding / `summary` literal phrasing / `maxImpact` default / `axe-core` default-export resolution / `no-context-no-document` error path. No public API change.
