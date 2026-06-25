# @kiwa-test/cli

## 0.2.0

### Minor Changes

- dacbc69: v0.2.0 — vitest helper / anvil state load / anvil pool / transport timeout

  新規 helper と API を追加した minor release。
  既存 API の後方互換は完全維持、 追加機能のみ。

  ## 新規機能

  ### @kiwa-test/core

  - `setupTestEnv` / `withAnvil` ... vitest test 内で mock 経路 (anvil 不起動) と 実 anvil 経路 (clean / state-load) を同 API で切替 (#350)
  - `StartAnvilOptions.loadState` / `dumpState` ... anvil の `--load-state` / `--dump-state` flag を透過、 deploy + setup を 1 回だけ実行して state.json を一括コピペ可能 (#350)
  - `createAnvilPool` / `AnvilPool` / `AnvilLease` ... N 個事前 spawn + borrow / release lease API + `anvil_reset` 再利用で 0 ms 取得 (#354)
  - `setupTestEnv({ pool })` ... pool 経由経路の opt-in、 `anvil` option と排他 (#354)
  - `TxBroadcastCtx.transportTimeoutMs` / `transportRetryCount` ... viem http transport の timeout / retry を制御、 fail-fast (#356)

  ### @kiwa-test/cli

  - `kiwa anvil seed <script> --out <path>` ... seed script で deploy + setup を 1 回実行 → anvil 終了時に `--dump-state` で chain 状態を一括書出する CLI sub-command (#350)

  ## 高速化

  - anvil ready polling 100 ms → 25 ms に短縮、 clean 起動が 107.7 ms → 32.3 ms (70 % 短縮、 #354)
  - anvil pool 経由の borrow + release が 0 ms (#354)
  - test file 並列実行 (`--no-file-parallelism` 撤去、 #354)
  - `startAnvilCluster` を `Promise.allSettled` で並列 spawn 化 (#356)
  - `sendTransaction` の transport timeout を明示化、 invalid-port test が 2.1 s → 200 ms (#356)
  - 結果として `pnpm -C packages/core test` の実行時間は 9.47 s → 2.67 s (72 % 短縮)

  ## 関連 PR

  - #350 vitest helper + anvil state load + seed CLI
  - #352 skill SSOT (kiwa-vitest / kiwa-api) 追記
  - #354 anvil 起動高速化 + test 並列化 + anvil pool
  - #356 tx transport timeout + cluster 並列 spawn
  - #357 release 準備 (本 PR)

## 0.1.2

### Patch Changes

- c856f93: README の v7 promo gif (10fps / 800px / 4.5-4.7MB、 npm camo 5MB 制限内) と 3 経路 brand statement (`@kiwa-test/forge` + `@kiwa-test/core` + 手書き) 言及を npm registry に届けるための patch bump。 code 変更なし、 README の同期目的のみ。

  詳細は PR #326 (v7 fix commit e401595) を参照。

## 0.1.1

### Patch Changes

- a713753: 公式 logo を packages/{core,cli}/README header に追加して npm package page で表示できるようにした。

  assets/kiwa-logo.png を repo に配置し、 packages/{core,cli}/README.{md,ja.md} の冒頭に `<p align="center">` で中央寄せ logo を挿入。 npm package page は repo の相対 path を解決できないため、 raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png の絶対 URL で参照する。 logo は黒緑 2 色で「際 (boundary)」 を体現するキャラクター design、 brand identity を確立する目的の patch release。 機能 / API 変更なし。

## 0.1.0

### Minor Changes

- 40dc74b: `@kiwa-test/cli` の `init` 命令に 4 option (`--testDir <path>` / `--config-suffix <name>` / `--script-key <key>` / `--with-deploy <foundry-path>`) を追加 (#150 / #154)。
  既存 Playwright 構成を持つ project への共存導入と、Foundry boilerplate (`tests/prepare-env.ts` / `global-setup.ts` / `global-teardown.ts` / `fixture.ts`) の自動生成が可能になった。
  `@kiwa-test/core` の `RpcContext` に opt-in `rejectConnect` flag を追加し、 `setApprovalMode('reject')` 時に `eth_requestAccounts` を EIP-1193 code 4001 で reject 可能に (#156)。 `eth_accounts` は read-only として従来挙動を維持し下位互換を保つ。 `WalletApi` / `DappE2eApi` に `setRejectConnect(enabled)` setter を expose。
- 4104571: Issue #4 — Changesets + GitHub Actions CI (node 20/22 matrix) + npm publish provenance による v0.1.0 publish 基盤を確立。
  各 package に publishConfig (access public + provenance true) + repository + license MIT + keywords を追加し、`.npmignore` と `files: ["dist"]` で公開 tarball を dist のみに限定。
  本 changeset は次回 release.yml 起動時の version PR に集約され、v0.0.0 → v0.1.0 bump の起点となる (実 publish は NPM_TOKEN 配布後)。
