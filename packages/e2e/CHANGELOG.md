# @kiwa/e2e

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

## 0.1.1

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa/core@0.1.1

## 0.1.0

### Minor Changes

- 465a82b: v6 完全版 — spec → test 自動変換 + 実 Chromium UI mode + E2E adapter + watch daemon + 統合 PoC

  ## 新規

  ### @kiwa/e2e v0.1.0 (新設)

  - `setupE2eEnv({ app | staticHtml, browser, initialPath })` ... 実 HTTP server を free port で起動 + Playwright (chromium/firefox/webkit) headless で navigate
  - `BrowserPageHandle` / `BrowserLocator` / `startServer` を export
  - @playwright/test を optional peer dep

  ### @kiwa/ui browser mode (minor)

  - `setupBrowserComponentEnv({ ui, browser, headless })` ... React 要素を SSR renderToStaticMarkup + Playwright 実 Chromium に load
  - 既存 jsdom 経路は変更なし
  - @playwright/test を optional peer dep に追加

  ### @kiwa/cli (minor)

  - `kiwa spec-to-test --in {spec.md} --out {test.ts} [--layer {layer}]` ... markdown 9 column を実 vitest test code に変換 (api / ui / data / cli 全 layer 対応)
  - `kiwa run --watch [--layer L]...` ... 複数 layer を並列 vitest watch daemon として spawn (default unit api ui、 --dry-run で plan 確認)

  ## PoC

  - `examples/full-stack-poc/` 新設 ... Todo + REST API 1 つで unit / integration / ui / e2e / observability 5 layer 全 PASS、 実 Chromium 含む
