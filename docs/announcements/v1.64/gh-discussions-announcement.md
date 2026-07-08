# kiwa v1.64 released — Desktop 深化 VIII (v0.9 実 native binding 呼出 = probeAndInvoke、 depth-9 pattern 新設 candidate、 systematic pattern 39 度目、 42 milestone streak、 3 layer separation 完全 pay off)

## Summary

kiwa v1.64 is out。 **Desktop 深化 VIII** 単軸 milestone、 v1.63 probe layer に **v0.9 で 実 native binding 呼出 (probeAndInvoke)** を追加、 probe availability 判定で 実 CLI 存在時のみ 実 spawn 呼出、 未 install 時は skip 経路で shape 契約 preserving。 v1.55-v1.63 4 PR rhythm 継承 (**11 milestone 連続 = 44 PR 連続同 rhythm**)、 **systematic pattern 39 度目適用**、 **42 milestone snippet streak 達成**、 shape 契約 preserving 絶対維持、 **depth-9 pattern 新設 candidate 到達**、 **v1.62 real behavior + v1.63 probe + v1.64 実 invoke の 3 layer separation 完全 pay off phase**。

## What's new

### `@kiwa-test/desktop` v0.9 minor bump

- **native-invoke.ts 新設** = probeAndInvoke + probeAndInvokeAll + InvokeStatus SSOT (4 経路: invoked / cli-unavailable / axis-skipped / no-cli-mapping)
- **NativeInvokeInput + NativeInvokeResult + NativeInvokeMatrixSummary type SSOT**
- **probe + invoke 統合経路** = shouldSkipAxis → cliForAxis → probeCliAvailable → invokeDesktopCliWith の 4 step
- **shape 契約 preserving 絶対維持** = invoked = SpawnResult 保持、 他 3 status = spawnResult=null
- backward compat 絶対維持 = v0.1-v0.8 API 変更 0

### dogfood 新規

- `dogfood-desktop-native-invoke-app` = 4 pattern (invokeSingleAxis + invokeAllAxes + generateStatusReport + extractInvokedSpawnResults)、 10 test 全 PASS
- kiwa package 48 個到達

### 1 new tutorial + migration + concept

- **[Tutorial 124 — Desktop v0.9 実 native binding 呼出](https://cardene777.github.io/kiwa/tutorials/124-desktop-native-invoke)**
- Migration v1.63 → v1.64 additive
- Concept doc `desktop-native-invoke.md`

### 42-milestone consecutive snippet validation streak

v1.23 → v1.64 = **42 milestone**、 kiwa 史上最長記録更新継続。

### depth-9 pattern 新設 candidate 到達

Desktop pair v0.1 → v0.9 の 9 段拡張。

## Install

```bash
pnpm add -D @kiwa-test/desktop@^0.9
```

## Migration guide

[v1.63 → v1.64](https://cardene777.github.io/kiwa/migrations/v1.63-to-v1.64)

## What's next

- v1.65+ = 他 pair depth-5/6 拡張 (3 例安定化)
- v2.0 milestone coverage 100% goal
