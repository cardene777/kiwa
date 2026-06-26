# @kiwa-test/a11y

## 0.1.2

### Patch Changes

- 5a75e07: Introduce mutation testing for `@kiwa-test/a11y`. Stryker config (`thresholds.break: 80`) added with jsonReporter. MSI achieves **93.62%** out of the gate after 8 mutation-kill tests targeting `runOptions` defaulting / `runOptions` forwarding / `summary` literal phrasing / `maxImpact` default / `axe-core` default-export resolution / `no-context-no-document` error path. No public API change.

## 0.1.1

### Patch Changes

- 8f0348c: Add a README.md to the published tarball so the npm package detail page renders install + Quickstart + API instead of being blank. Source `packages/{a11y,visual}/src/` and behavior unchanged.

## 0.1.0

### Minor Changes

- f2bb16c: v9 — @kiwa-test/a11y v0.1.0 新設: a11y test adapter

  - `runAxe` ... axe-core を lazy import で読み込み、 任意の Document/Element/selector に対して run
  - `reportViolations` ... maxImpact 閾値以上の violation を blocking として抽出 + 人間可読 summary
  - `expectNoViolations` ... blocking 存在時に throw する vitest helper
  - jsdom + Playwright page どちらでも動作可能

  PoC 経路は v9-2 (visual) と同 PR で `examples/full-stack-poc` 経由を follow-up。
