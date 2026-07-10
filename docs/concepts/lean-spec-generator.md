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

両層は 同じ OrchestratorSpec 型 SSOT を共有、 depth-5 pattern の 5 lifecycle-orchestrator (transaction / session / cache / job / cli) は 両層で 対称に定義。 対称であることは規約ではなく `checkConformance` が検査する (200 cell = 40 × 5 台)。

## API SSOT

```ts
generateLeanSpec(spec: OrchestratorSpec): LeanSpecOutput;
generateLakeProject(config: LakeProjectConfig): LakeProjectFiles;
// config.modules を渡すと根 module が各 spec を import する。
// lakefile は @[default_target] + globs を出すので、 lake build が spec を実際に建てる。
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
  initial?: string;                    // 与えると到達可能性を検査する
  terminal?: readonly string[];        // 著者が終端だと考える状態、 表と突き合わせる
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

/-- event が別の状態へ動かすか。 自己遷移は動かさない。 -/
def escapes (s : State) (e : Event) : Bool :=
  match dispatch s e with
  | .to s' => !(decide (s' = s))
  | .invalid => false

/-- 終端状態: どの event でも動かない。 -/
theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .invalid := by
  intro e; cases e <;> rfl

/-- 出ていける状態: 別の状態へ動かす event がある。 証人は生成器が知っている。 -/
theorem beginning_can_leave : ∃ e, escapes .Beginning e = true :=
  ⟨.BeginCompleted, rfl⟩

/-- sink: event を受理するが、 どれも外へ出さない。 -/
theorem dlq_no_escape : ∀ e, escapes .Dlq e = false := by
  intro e; cases e <;> rfl

/-- initial を与えた場合のみ。 到達経路を証人として持つ。 -/
theorem active_reachable : steps .Beginning [.BeginCompleted] = .to .Active := rfl

end Transaction
```

## 統合方針

- **同 SSOT** = TypeScript impl と Lean spec は 同じ 5 state / 8 event / 40 cell definition を共有、 `checkConformance(spec, observe)` が全 cell を実装に問うて突き合わせる
- **生成器も検査対象** = `checkLeanTable(spec)` が生成 Lean に `lean --run` で自分の表を出力させ、 spec と突き合わせる。 定理は生成器と同じ表から導かれるので、 cell の移動を捕まえられない (欠落は網羅性検査が捕まえる)
- **拒否と誤印字は別の失敗** = `lean --run` は file 全体を elaborate するので、 定理が偽なら Lean は表を印字する前に file を撥ねる。 これを `verification-failed` と呼ぶ。 Lean が受理して走り、 返ってきた表が仕様の表でない (cell 不足 / cell 重複 / 読めない行) 場合が `extraction-failed`。 v0.3 は両方を後者と呼んでおり、 偽の定理を渡した読み手は印字の不具合を疑いに行った
- **生成物は repo に置ける** = `checkLeanTable(spec, { source })` に手元の `.lean` file を渡すと、 その file がまだ仕様の表を保持しているかを問える。 `examples/dogfood-lean-orchestrator-specs-app/specs/` が実例で、 `generateLakeProject` が書いた Lake project を `lake build` が証明し、 file が仕様から drift すれば test が落ちる
- **表の意味論は 1 箇所** = `src/table.ts` の `resolveTable` を生成器と突き合わせの双方が読む。 spec を 2 箇所で解釈すると、 片方だけが policy を知る状態に必ず drift する
- **shape 契約 preserving** = 既存 41 package 変更 0、 packages/lean/ 追加のみ
- **opt-in** = Lean toolchain 未 install 環境でも generator 単体 で動作、 生成 file を実 toolchain で検証するのは user 側 opt-in
- **網羅は定理でなく型検査** = catch-all を置かないので、 cell が欠ければ Lean が `missing cases` として cell 名を挙げて落ちる。 v0.2 までの `dispatch_total` は任意の関数について `rfl` で証明でき、 遷移ゼロの表でも通ったため v0.3 で削除した
- **定理は反証可能なものだけ** = `<state>_absorbing` (終端) / `<state>_can_leave` (出ていける) / `<state>_no_escape` (sink) / `<state>_reachable` (到達経路) の 4 種。 表と矛盾すれば証明が通らない
- **sink と終端の区別** = 自己遷移しか持たない状態は event を受理するので終端ではない。 だが二度と出られない。 「有効な event がある」 を出口の条件にすると、 この状態を「出口がある」 と誤って報告する。 `escapes` は「別の状態へ動くか」 を問う。 実在の `JOB_SPEC` の `dlq` がこれに当たる (`dlq-inspected` を受理して `dlq` に留まる)
- **到達可能性は opt-in** = `initial` を与えると全状態への最短経路を幅優先で求め、 各状態に証人付きの定理を出す。 経路を持たない状態は定理を書けないので生成が停止し、 その状態名を挙げる
- **terminal は著者の主張** = 与えると表と突き合わせる。 終端だと宣言した状態に出口があるか、 出口のない状態を宣言し忘れていれば停止する

## v2.14 milestone signal

- 59 milestone streak (v1.23-v2.14)
- 4 PR rhythm 13 milestone 目 (v2.1-v2.14)
- backward compat 絶対維持 22 milestone 連続 (v1.61-v2.14)
- systematic pattern 56 度目 = Lean spec generator 適用
- kiwa 全体 branding = testing → testing + 形式検証 に格上げ signal
- @kiwa-lab org 42 package 到達 (41 → 42)
