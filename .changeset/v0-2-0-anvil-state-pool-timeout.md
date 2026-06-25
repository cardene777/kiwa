---
"@kiwa-test/core": minor
"@kiwa-test/cli": minor
---

v0.2.0 — vitest helper / anvil state load / anvil pool / transport timeout

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
