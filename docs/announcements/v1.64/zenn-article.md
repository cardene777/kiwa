---
title: "kiwa v1.64 リリース — Desktop 深化 VIII (@kiwa-lab/desktop v0.9 実 native binding 呼出、 depth-9 pattern 新設 candidate、 systematic pattern 39 度目、 42 milestone streak、 3 layer separation 完全 pay off)"
emoji: "🔗"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.64 リリース — Desktop 深化 VIII

## Summary

**Desktop 深化 VIII** 単軸 milestone、 v0.9 で 実 native binding 呼出 = probeAndInvoke 実装、 probe availability 判定で 実 CLI 存在時のみ 実 spawn 呼出、 未 install 時は skip 経路で shape 契約 preserving。 v1.55-v1.63 4 PR rhythm 継承 (**11 milestone 連続 = 44 PR 連続同 rhythm**)、 **systematic pattern 39 度目適用**、 **42 milestone 連続 snippet validation streak** 達成、 **depth-9 pattern 新設 candidate 到達**、 **v1.62 real behavior + v1.63 probe + v1.64 実 invoke の 3 layer separation 完全 pay off phase**。

## What's new

### native-invoke 3 type SSOT

| type | 用途 |
|---|---|
| InvokeStatus | 4 経路 = 'invoked' \| 'cli-unavailable' \| 'axis-skipped' \| 'no-cli-mapping' |
| NativeInvokeResult | axis + target + status + reason + spawnResult (invoked のみ non-null) |
| NativeInvokeMatrixSummary | total + 4 status 別 array |

### 3 code pattern

```ts
// Pattern 1 — probeAndInvoke (single axis)
const result = await probeAndInvoke({ axis: 'auto-updater', target: 'macos' });

// Pattern 2 — probeAndInvokeAll (matrix)
const summary = await probeAndInvokeAll();

// Pattern 3 — status handling
switch (result.status) {
  case 'invoked': /* result.spawnResult は SpawnResult */ break;
  case 'cli-unavailable': /* 未 install */ break;
  case 'axis-skipped': /* platform mismatch */ break;
  case 'no-cli-mapping': /* semantics-only */ break;
}
```

### 3 layer separation 完全 pay off

- **v1.62 real behavior** = metadata + duration diff
- **v1.63 probe** = availability + skip
- **v1.64 実 invoke** = probe → invoke 統合、 4 InvokeStatus で完全 separation

### backward compat 絶対維持

v0.9 実 invoke の追加は additive、 v0.1-v0.8 API 変更 0、 shape 契約 preserving 継続。

### dogfood 新規

`dogfood-desktop-native-invoke-app` = 4 pattern、 10 test 全 PASS、 kiwa package 48 到達。

### 42 milestone 連続 snippet validation streak

### depth-9 pattern 新設 candidate

Desktop pair v0.1 → v0.9 の 9 段拡張。

## Install

```bash
pnpm add -D @kiwa-lab/desktop@^0.9
```

## Migration guide

[v1.63 → v1.64](https://cardene777.github.io/kiwa/migrations/v1.63-to-v1.64)

## What's next

- v1.65+ = 他 pair depth-5/6 拡張
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.64-1 = native-invoke.ts + 11 test (207 test 全 PASS)
- v1.64-2 = dogfood-desktop-native-invoke-app 新規 (10 test 全 PASS、 48 package)
- v1.64-3 = tutorial 124 + migration + concept + snippet 42 streak (210 test 全 PASS)
- v1.64-4 = publish
