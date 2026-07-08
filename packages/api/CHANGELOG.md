# @kiwa/api

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

## 0.1.2

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa/core@0.1.1

## 0.1.1

### Patch Changes

- bb82a04: Strengthen `@kiwa/api` mutation test coverage. MSI raised from 79.55% to **92.42%** by adding 38 mutation-kill tests targeting null body / ArrayBuffer body / Uint8Array body / object-spread header layering / `path.startsWith('http')` branch / msw `onUnhandledRequest: 'bypass'` side effect / stop() side effect. Stryker config updated to mutate all 4 source files (was 2) with `thresholds.break: 80`. No public API change.

## 0.1.0

### Minor Changes

- e16898f: v1 — 汎用テストツール化 MVP: spec / api 新設 + core を spec ベースに整理

  kiwa を dApp E2E 専用から汎用テストツールへ拡大する v1。
  spec 共通基盤を `@kiwa/core` として新設、 HTTP API adapter を `@kiwa/api` として新設し、 `@kiwa/dapp` は `@kiwa/core` を peer dep として依存しつつ既存 dApp E2E API を完全互換で維持する。

  ## 新規 package

  ### @kiwa/core 0.1.0 (新設)

  - `parseSpec(markdown)` ... kiwa-design 9 column markdown を `SpecDoc` (cases, layer, mode, route) にパース
  - `createPool({ size, acquire, reset, release })` ... 汎用 borrow / release pool、 anvil pool の基底
  - `TestEnvBase<TMode>` / `Lease` / `Pool` / `TestLayer` / `TestMode` ... 全 adapter 共通の型

  ### @kiwa/api 0.1.0 (新設)

  - `setupApiServer({ mode })` ... HTTP API テストの 3 経路統合 helper
    - `mode: 'mock'` ... msw v2 handler で固定応答
    - `mode: 'live'` ... 実 HTTP server を free port で起動 (Next.js Route Handler / Express / Fastify / NestJS 対応)
    - `mode: 'hybrid'` ... live + msw 共存 (path 単位の override 可能)
  - 統一 `request` client (`get` / `post` / `put` / `patch` / `delete`) + `ApiResponseSnapshot` (`status` / `headers` / `bodyText` / `json<T>()`)
  - msw / supertest / vitest は optional peer dep

  ## 変更 package

  ### @kiwa/dapp 0.2.0 → 0.3.0 (minor)

  - `@kiwa/core` を dependency として参照、 spec の共通型 (`TestLayer` / `TestMode` / `Lease` / `Pool` / `SpecDoc`) を main entry から re-export
  - `parseSpec` も core から re-export (既存 user が `@kiwa/dapp` の単一 install で spec parser を使える経路を確保)
  - 既存 API 完全互換、 既存 118 件 test PASS

  ## PoC

  - `examples/nextjs-api-poc/` ... Next.js App Router Route Handler 1 つ + Layer 1 spec.md + Vitest test 9 件 (`live` / `mock` / `hybrid` の 3 経路) PASS

  ## skill SSOT

  - `.claude/skills/kiwa-design/SKILL.md` ... `--layer api` の出力 path (`tests/spec/integration/test-spec-{module}.api.md`) + api 専用 9 column 表 (Mode / Route 追加) を追記
  - `.claude/skills/kiwa-api/SKILL.md` ... `@kiwa/api` 経路 + msw / supertest mapping + 実装例を追記

### Patch Changes

- Updated dependencies [e16898f]
  - @kiwa/core@0.1.0
