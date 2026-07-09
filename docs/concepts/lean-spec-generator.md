---
title: "@kiwa-lab/lean v0.1 spec generator SSOT"
---

# @kiwa-lab/lean v0.1 spec generator SSOT

## What this covers

`@kiwa-lab/lean` v0.1 = kiwa の depth-5 pattern (5 state + 8 event + 40 セル 遷移表 SSOT) を Lean 4 spec に変換する generator。 runtime testing に加えて 静的形式検証 layer を追加、 kiwa を **testing 特化** から **testing + 形式検証 の 統合実験場** に格上げする pair。

## 2 軸融合仕様駆動開発 SSOT

kiwa v2.14+ は 同じ SSOT (5 state / 8 event / 40 セル) を 2 層で駆動する。

- **Lean spec 層** = specification-level SSOT with type-level totality proof、 実装前に不変条件を証明可能
- **TypeScript impl 層** = runtime behavior with vitest testing、 実行時挙動 verify

両層は 同じ OrchestratorSpec 型 SSOT を共有、 depth-5 pattern の 5 lifecycle-orchestrator (transaction / session / cache / job / cli) は 両層で 対称に定義。

## API SSOT

```ts
generateLeanSpec(spec: OrchestratorSpec): LeanSpecOutput;
generateLakeProject(config: LakeProjectConfig): LakeProjectFiles;
```

### OrchestratorSpec 型

```ts
{
  moduleName: string;        // Lean file 名
  namespace: string;         // Lean namespace (PascalCase)
  states: readonly string[]; // 5 state SSOT (kebab-case)
  events: readonly string[]; // 8 event SSOT (kebab-case)
  transitions: ReadonlyArray<{ from: string; event: string; to: string }>;
}
```

## Lean 4 出力 pattern

```lean
namespace Transaction

inductive State where
  | Beginning : State
  | Active : State
  | SavepointNested : State
  | Committing : State
  | Aborted : State
deriving DecidableEq, Repr

inductive Event where
  | BeginCompleted : Event
  ...
deriving DecidableEq, Repr

def dispatch : State → Event → State
  | .Beginning, .BeginCompleted => .Active
  ...
  | s, _ => s  -- invalid transition: identity fallthrough

theorem dispatch_total (s : State) (e : Event) : ∃ s', dispatch s e = s' := by
  exact ⟨dispatch s e, rfl⟩

end Transaction
```

## 統合方針

- **同 SSOT** = TypeScript impl と Lean spec は 同じ 5 state / 8 event / 40 cell definition を共有
- **shape 契約 preserving** = 既存 41 package 変更 0、 packages/lean/ 追加のみ
- **opt-in** = Lean toolchain 未 install 環境でも generator 単体 で動作、 生成 file を `lean --check` で検証は user 側 opt-in
- **depth-5 pattern → 定理化** = systematic law の rule 昇格 から type-level 定理 (`dispatch_total`) に格上げ

## v2.14 milestone signal

- 59 milestone streak (v1.23-v2.14)
- 4 PR rhythm 13 milestone 目 (v2.1-v2.14)
- backward compat 絶対維持 22 milestone 連続 (v1.61-v2.14)
- systematic pattern 56 度目 = Lean spec generator 適用
- kiwa 全体 branding = testing → testing + 形式検証 に格上げ signal
- @kiwa-lab org 42 package 到達 (41 → 42)
