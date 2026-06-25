# @kiwa-test/e2e

## 0.1.0

### Minor Changes

- 465a82b: v6 完全版 — spec → test 自動変換 + 実 Chromium UI mode + E2E adapter + watch daemon + 統合 PoC

  ## 新規

  ### @kiwa-test/e2e v0.1.0 (新設)

  - `setupE2eEnv({ app | staticHtml, browser, initialPath })` ... 実 HTTP server を free port で起動 + Playwright (chromium/firefox/webkit) headless で navigate
  - `BrowserPageHandle` / `BrowserLocator` / `startServer` を export
  - @playwright/test を optional peer dep

  ### @kiwa-test/ui browser mode (minor)

  - `setupBrowserComponentEnv({ ui, browser, headless })` ... React 要素を SSR renderToStaticMarkup + Playwright 実 Chromium に load
  - 既存 jsdom 経路は変更なし
  - @playwright/test を optional peer dep に追加

  ### @kiwa-test/cli (minor)

  - `kiwa spec-to-test --in {spec.md} --out {test.ts} [--layer {layer}]` ... markdown 9 column を実 vitest test code に変換 (api / ui / data / cli 全 layer 対応)
  - `kiwa run --watch [--layer L]...` ... 複数 layer を並列 vitest watch daemon として spawn (default unit api ui、 --dry-run で plan 確認)

  ## PoC

  - `examples/full-stack-poc/` 新設 ... Todo + REST API 1 つで unit / integration / ui / e2e / observability 5 layer 全 PASS、 実 Chromium 含む
