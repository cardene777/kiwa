# @kiwa-test/observability

## 1.2.0

### Minor Changes

- v1.1: telemetry provider mocks added (OpenTelemetry + Datadog + Sentry). Unified `TelemetryCollector` shape (spans / metrics / logs / exceptions / transactions) so assertions read the same regardless of provider. Sentry fingerprint dedupe + breadcrumb lifecycle match the real SDK. Existing v1.0 API (flaky / spec-coverage / dashboard / coverage) unchanged.

## 1.0.1

### Patch Changes

- 32a6c10: 📦 11 packages initial v1.0.x npm publish (改名後初回)。

  PR #476 で `@kiwa-test/core` ↔ `@kiwa-test/spec` swap rename + dApp 改名 + v1.0 major bump を local で実施したが、 npm への publish が未実行のため npm 上では旧 0.x 系のまま停滞していた。

  本 changeset で全 11 packages を v1.0.1 へ patch bump して publish を発火させ、 改名後の v1.0 系を npm に反映する。

  ## 影響範囲

  - 旧 `@kiwa-test/core` (0.3.1) は dApp E2E fixture の名残、 v1.0.1 では新 spec として publish
  - 旧 `@kiwa-test/spec` は廃止 (`@kiwa-test/core` に統合)
  - 新 `@kiwa-test/dapp` (404 → v1.0.1 として初公開)
  - 既存 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) は v1.0.1 patch bump で公開
  - v1.0.0 → v1.0.1 patch bump (PR #476 の v1.0.0 内部 bump を上書きせず継続)

  ## 確認方法

  ```bash
  npm view @kiwa-test/core version    # → 1.0.1
  npm view @kiwa-test/dapp version    # → 1.0.1 (新規公開)
  npm view @kiwa-test/e2e version     # → 1.0.1
  npm view @kiwa-test/a11y version    # → 1.0.1
  npm view @kiwa-test/visual version  # → 1.0.1
  ```

- Updated dependencies [32a6c10]
  - @kiwa-test/core@1.0.1

## 0.2.1

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa-test/core@0.1.1

## 0.2.0

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

## 0.1.0

### Minor Changes

- 8afad1c: v5 — @kiwa-test/observability v0.1.0 新設: test 集計 + flaky 検出 + spec coverage gap dashboard

  設計 × 実装 × 観測 ループの観測 → 上流 spec フィードバック経路を SSOT 化する終端 adapter。

  ## 新規 API

  - `collectRunHistory` ... vitest 出力を history に追加、 maxPerTest で FIFO eviction
  - `fromVitestJson` ... vitest JSON reporter 出力を TestRunRecord[] に変換、 fullName から `T-XXX-NNN` ID を抽出
  - `detectFlaky` ... minRuns + threshold で pass/fail mixed test を抽出 (always-pass / always-fail は除外)
  - `analyzeSpecCoverage` ... spec markdown と test code を突き合わせ、 missingTcIds / extraTcIds 抽出
  - `renderDashboard` ... Summary + Flaky tests + Spec coverage gaps の markdown dashboard を出力

  ## skill SSOT

  - `.claude/skills/kiwa-observe/SKILL.md` ... 新設、 vitest 実行 → dashboard 生成 → user 提示までの Layer 3 flow
