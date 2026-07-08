# kiwa v1.64 x-thread (日本語)

## Tweet 1

kiwa v1.64 リリース — Desktop 深化 VIII。 **@kiwa/desktop v0.9** で 実 native binding 呼出 (probeAndInvoke) 追加、 probe availability 判定で 実 CLI 存在時のみ 実 spawn 呼出。 v1.55-v1.63 4 PR rhythm 継承 (**11 milestone 連続 = 44 PR 連続同 rhythm**)、 **systematic pattern 39 度目適用**、 **depth-9 pattern 新設 candidate 到達**。

## Tweet 2

InvokeStatus 4 経路 SSOT = invoked (probe + 実 spawn 完了) / cli-unavailable (CLI 未 install) / axis-skipped (platform mismatch) / no-cli-mapping (semantics-only axis)、 shape 契約 preserving 絶対維持 (invoked = SpawnResult 保持、 他 3 status = spawnResult=null)。 **v1.62 real behavior + v1.63 probe + v1.64 実 invoke の 3 layer separation の完全 pay off phase**。

## Tweet 3

dogfood-desktop-native-invoke-app 新規、 4 pattern workflow (invokeSingleAxis + invokeAllAxes + generateStatusReport + extractInvokedSpawnResults)、 10 test 全 PASS。 kiwa package 48 個到達。 **42 milestone 連続 snippet validation streak** (v1.23-v1.64) 達成。

## Tweet 4

`pnpm add -D @kiwa/desktop@^0.9`。 migration: https://cardene777.github.io/kiwa/migrations/v1.63-to-v1.64

v1.65+ で 他 pair depth-5/6 拡張 (3 例安定化) 予定。 backward compat 絶対維持で v0.1-v0.8 完全保持。

4 sub 完遂 (v1.64-1 native-invoke / v1.64-2 dogfood / v1.64-3 docs 42 streak / v1.64-4 publish)。

#kiwa #desktop #native-invoke #testing #vitest
