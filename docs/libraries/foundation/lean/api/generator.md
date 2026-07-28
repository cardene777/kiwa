---
title: "@kiwa-lab/lean generator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>generator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/generator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>generateLeanSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/generator.ts#L57) <code v-pre>packages/lean/src/generator.ts</code>

Generate a Lean 4 spec for a lifecycle-orchestrator state machine. The generated file lists every `(state, event)` cell and has no catch-all. That is deliberate: Lean refuses a non-exhaustive match, so the exhaustiveness of the table is checked by Lean rather than asserted by a theorem that cannot fail. ```lean inductive Step where | to : State → Step | invalid : Step def dispatch : State → Event → Step | .Beginning, .BeginCompleted =&gt; .to .Active | .Beginning, .QueryExecuted =&gt; .invalid ... theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .invalid := by intro e; cases e &lt;;&gt; rfl theorem beginning_can_leave : ∃ e, escapes .Beginning e = true := ⟨.BeginCompleted, rfl⟩ ``` The theorems say things a reader could otherwise get wrong: which states are terminal, which can actually be left, which accept events and go nowhere, and which paths reach which states. Their proofs are mechanical because the generator already knows the table, and they fail to compile if it is misread.

```ts
export declare function generateLeanSpec(spec: OrchestratorSpec): LeanSpecOutput;
```


