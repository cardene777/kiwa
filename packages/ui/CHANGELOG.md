# @kiwa-test/ui

## 0.3.0

### Minor Changes

- 0a07815: v6.2 — vitest coverage 統合 + observability dashboard 取込 + ui Vue 対応

  ## A: vitest coverage 統合

  - spec / api / ui / data / cli-test / observability / e2e / cli / core の package.json に `test:cov` script 追加
  - `@vitest/coverage-v8` を devDep に追加
  - v8 provider で line / branch / function / statement coverage を JSON + text reporter で出力

  ## B: @kiwa-test/observability に coverage 取込 (minor)

  - `fromIstanbulCoverageSummary` ... v8 / istanbul coverage-summary.json を `CoverageSummary` に正規化、 total 不在時は files から自動集計
  - `checkThresholds` ... lines / branches / functions / statements の最低 % を gate
  - `renderDashboard({ coverage })` に Code coverage section 追加 (total line/branch/function/statement の表)
  - 6 件 test 追加 (合計 21 件 PASS)

  ## C: @kiwa-test/ui に Vue 3 対応 (minor)

  - `setupVueComponentEnv({ mode, component, props, slots })` ... `@vue/test-utils` を lazy load して mount、 jsdom 環境で動作 (PoC 2 件 PASS)
  - `setupSvelteComponentEnv({ mode, component, props })` ... `@testing-library/svelte` を lazy load する API のみ提供 (test は PoC 側で実装)
  - 既存 React 経路 + 実 Chromium browser mode は完全互換
  - peer dep に `@vue/test-utils` / `vue` / `@testing-library/svelte` / `svelte` を optional 追加

## 0.2.0

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

## 0.1.0

### Minor Changes

- 1d58d62: v2 — @kiwa-test/ui v0.1.0 新設: React component test adapter (Vitest + Testing Library + JSDOM)

  kiwa 汎用テストツール化 v2 (UI adapter)。
  React component の Layer 1 spec (kiwa-design markdown 9 column) → Layer 2 test code 経路を `@kiwa-test/ui` adapter で確立する。

  ## 新規 API

  - `setupComponentEnv({ mode })` ... `render` / `interaction` / `snapshot` の 3 経路統合
  - `RenderTestEnvUi` / `InteractionTestEnvUi` / `SnapshotTestEnvUi` ... mode 別の TestEnv 型
  - `@testing-library/react` + `@testing-library/user-event` + `jsdom` を peer dep として lazy import

  ## PoC

  - `examples/react-component-poc/` ... Counter component + Layer 1 spec.md (7 case) + vitest test 7 件 (render / interaction / snapshot 3 経路) 全 PASS

  ## skill SSOT

  - `.claude/skills/kiwa-design/SKILL.md` ... `--layer ui` 出力 path + ui 専用 9 column 表 (Mode / Component 追加) を SSOT 化
  - `.claude/skills/kiwa-ui/SKILL.md` ... 新設、 9 column → setupComponentEnv 機械変換 + 実装例
