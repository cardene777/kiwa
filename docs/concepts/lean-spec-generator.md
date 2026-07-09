---
title: "@kiwa-lab/lean v0.1 spec generator SSOT"
---

# @kiwa-lab/lean v0.1 spec generator SSOT

## What this covers

`@kiwa-lab/lean` v0.1 = kiwa の depth-5 pattern (5 state + 8 event + 40 セル 遷移表 SSOT) を Lean 4 spec に変換する generator。 runtime testing に加えて 静的形式検証 layer を追加、 kiwa を **testing 特化** から **testing + 形式検証 の 統合実験場** に格上げする pair。

## 2 軸融合仕様駆動開発 SSOT

kiwa v2.14+ は 同じ SSOT (5 state / 8 event / 40 セル) を 2 層で駆動する。

- **Lean spec 層** = specification-level SSOT。 遷移表の網羅は Lean の網羅性検査が担い、 表から導ける不変条件は実装前に定理として証明される
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
  transitions: ReadonlyArray<
    | { from: string; event: string; to: string }   // 遷移 (to === from は意図した自己遷移)
    | { from: string; event: string; invalid: true } // 拒否
  >;
  unspecified?: 'error' | 'invalid'; // 宣言されていない cell の扱い、 既定は error
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

/-- 次状態か、 拒否か。 自己遷移は `to` で同じ状態に戻ることであり、 拒否とは別物。 -/
inductive Step where
  | to : State → Step
  | invalid : Step
deriving DecidableEq, Repr

-- 40 cell を全て列挙する。 catch-all は置かない。
def dispatch : State → Event → Step
  | .Beginning, .BeginCompleted => .to .Active
  | .Beginning, .QueryExecuted  => .invalid
  ...

/-- 終端状態: どの event でも動かない。 -/
theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .invalid := by
  intro e; cases e <;> rfl

/-- 非終端状態: 少なくとも 1 つ出口がある。 証人は生成器が知っている。 -/
theorem beginning_has_exit : ∃ e s, dispatch .Beginning e = .to s :=
  ⟨.BeginCompleted, .Active, rfl⟩

end Transaction
```

## 統合方針

- **同 SSOT** = TypeScript impl と Lean spec は 同じ 5 state / 8 event / 40 cell definition を共有
- **shape 契約 preserving** = 既存 41 package 変更 0、 packages/lean/ 追加のみ
- **opt-in** = Lean toolchain 未 install 環境でも generator 単体 で動作、 生成 file を実 toolchain で検証するのは user 側 opt-in
- **網羅は定理でなく型検査** = catch-all を置かないので、 cell が欠ければ Lean が `missing cases` として cell 名を挙げて落ちる。 v0.2 までの `dispatch_total` は任意の関数について `rfl` で証明でき、 遷移ゼロの表でも通ったため v0.3 で削除した
- **定理は反証可能なものだけ** = `<state>_absorbing` と `<state>_has_exit` の 2 種。 表と矛盾すれば証明が通らない

## v2.14 milestone signal

- 59 milestone streak (v1.23-v2.14)
- 4 PR rhythm 13 milestone 目 (v2.1-v2.14)
- backward compat 絶対維持 22 milestone 連続 (v1.61-v2.14)
- systematic pattern 56 度目 = Lean spec generator 適用
- kiwa 全体 branding = testing → testing + 形式検証 に格上げ signal
- @kiwa-lab org 42 package 到達 (41 → 42)
