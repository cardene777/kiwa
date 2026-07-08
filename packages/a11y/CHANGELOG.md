# @kiwa/a11y

## 1.0.1

### Patch Changes

- 32a6c10: 📦 11 packages initial v1.0.x npm publish (改名後初回)。

  PR #476 で `@kiwa/core` ↔ `@kiwa/spec` swap rename + dApp 改名 + v1.0 major bump を local で実施したが、 npm への publish が未実行のため npm 上では旧 0.x 系のまま停滞していた。

  本 changeset で全 11 packages を v1.0.1 へ patch bump して publish を発火させ、 改名後の v1.0 系を npm に反映する。

  ## 影響範囲

  - 旧 `@kiwa/core` (0.3.1) は dApp E2E fixture の名残、 v1.0.1 では新 spec として publish
  - 旧 `@kiwa/spec` は廃止 (`@kiwa/core` に統合)
  - 新 `@kiwa/dapp` (404 → v1.0.1 として初公開)
  - 既存 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) は v1.0.1 patch bump で公開
  - v1.0.0 → v1.0.1 patch bump (PR #476 の v1.0.0 内部 bump を上書きせず継続)

  ## 確認方法

  ```bash
  npm view @kiwa/core version    # → 1.0.1
  npm view @kiwa/dapp version    # → 1.0.1 (新規公開)
  npm view @kiwa/e2e version     # → 1.0.1
  npm view @kiwa/a11y version    # → 1.0.1
  npm view @kiwa/visual version  # → 1.0.1
  ```

- Updated dependencies [32a6c10]
  - @kiwa/core@1.0.1

## 0.1.3

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa/core@0.1.1

## 0.1.2

### Patch Changes

- 5a75e07: Introduce mutation testing for `@kiwa/a11y`. Stryker config (`thresholds.break: 80`) added with jsonReporter. MSI achieves **93.62%** out of the gate after 8 mutation-kill tests targeting `runOptions` defaulting / `runOptions` forwarding / `summary` literal phrasing / `maxImpact` default / `axe-core` default-export resolution / `no-context-no-document` error path. No public API change.

## 0.1.1

### Patch Changes

- 8f0348c: Add a README.md to the published tarball so the npm package detail page renders install + Quickstart + API instead of being blank. Source `packages/{a11y,visual}/src/` and behavior unchanged.

## 0.1.0

### Minor Changes

- f2bb16c: v9 — @kiwa/a11y v0.1.0 新設: a11y test adapter

  - `runAxe` ... axe-core を lazy import で読み込み、 任意の Document/Element/selector に対して run
  - `reportViolations` ... maxImpact 閾値以上の violation を blocking として抽出 + 人間可読 summary
  - `expectNoViolations` ... blocking 存在時に throw する vitest helper
  - jsdom + Playwright page どちらでも動作可能

  PoC 経路は v9-2 (visual) と同 PR で `examples/full-stack-poc` 経由を follow-up。
