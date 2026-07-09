---
title: "@kiwa-lab/lean v0.2 verify integration SSOT"
---

# @kiwa-lab/lean v0.2 verify integration SSOT

## What this covers

v2.14 で追加した `@kiwa-lab/lean` v0.1 spec generator を v0.2 で `verifyLeanSpec` 統合、 生成 Lean file を **実際に Lean toolchain で検証** する Level 2 layer 追加。 kiwa 全体 branding「testing + 形式検証」 の pipeline を完成、 systematic pattern 57 度目。

## Level 1 vs Level 2

| Layer | v0.1 | v0.2 |
|---|---|---|
| generateLeanSpec | ✅ Lean source 生成 | ✅ 変更 0 (shape preserving) |
| generateLakeProject | ✅ Lake scaffold 生成 | ✅ 変更 0 |
| verifyLeanSpec | ❌ | ✅ 新規 = lean --check 実行 |

## verifyLeanSpec API SSOT

```ts
verifyLeanSpec(specs: readonly LeanSpecOutput[], opts?: VerifyOptions): VerifyResult;
```

### 3 経路 (VerifyStatus)

| status | 発火条件 |
|---|---|
| `ok` | Lean install 済 + 全 spec の `lean --check` 成功 |
| `verification-failed` | Lean install 済 + いずれかの spec の `lean --check` 失敗 (stderr 添付) |
| `lean-not-installed` | Lean toolchain 未 install (throw なし return) |
| `skipped-by-env` | `KIWA_LEAN_SKIP_VERIFY=1` env or `opts.skip=true` |

### 決定的 CI 動作

Lean toolchain 未 install 環境 (CI default / offline / sandbox) は `lean-not-installed` で throw なし return、 CI が Lean install を待つ必要なし。 `KIWA_LEAN_SKIP_VERIFY=1` で 明示 skip 可能、 test suite 決定性維持。

## 5 lifecycle-orchestrator の 2 軸融合仕様駆動開発 pipeline

```
OrchestratorSpec (SSOT)
    ├─► generateLeanSpec → Lean 4 source
    │       └─► verifyLeanSpec → lean --check → { status: 'ok' }
    └─► TypeScript impl → vitest runtime testing
```

同 SSOT (5 state / 8 event / 40 セル) を 両層で駆動、 Lean 側で型 + 定理 (`dispatch_total`) を検証、 TS 側で 実行時挙動 verify。

## v2.15 milestone signal

- 60 milestone streak (v1.23-v2.15)
- 4 PR rhythm 14 milestone 目 (v2.1-v2.15)
- backward compat 絶対維持 23 milestone 連続 (v1.61-v2.15)
- systematic pattern 57 度目 = Lean toolchain 統合
- kiwa 全体 pipeline = testing + spec 生成 + spec 検証 の 3 段 完成
- @kiwa-lab org 42 package 維持 (lean 既存 の minor 拡張)
