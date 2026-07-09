# kiwa MANIFESTO

## 名前の由来 — kiwa = 際

`kiwa` は **「際 (きわ)」** から名付けた。 「際」 には 3 つの意味がある。

- **境界としての際** = testing / spec / implementation / verification の 各 layer の 境界を 意識的に扱う
- **際立ちとしての際** = 曖昧な仕様や テストの隙間を なくし、 検証されるべき対象を **際立たせる**
- **接続としての際** = 各開発 step (仕様 → 実装 → テスト → 検証 → merge) を 繋ぐ 「際」 の 統合基盤

kiwa は 「testing framework」 に留まらない。 **開発 workflow の 各 step の 際 (境界と接点) を 意識的に設計する 仕様駆動開発 platform** = 3 軸 (testing + 形式検証 + 仕様駆動開発) の 融合実験場。

## Core Message

> **際を制するものが 開発を制する。**
>
> 仕様と実装の 際、 testing と 形式検証の 際、 mock と real の 際、 dev-flow の 各 step の 際。
> それら全ての 際 に 「検証可能な保証」 を配置することが、 kiwa が目指す 仕様駆動開発。

## 3 軸融合の思想

### 軸 1 = Testing (runtime verification)

- 選ばれた入力例 に対して、 実行時挙動を verify
- 対象 = 副作用 / integration / performance / UX、 静的検証不可能な domain
- 実装 = kiwa 40+ package (dApp / API / UI / component / a11y / visual / e2e / edge / mobile / desktop / auth / payment / cache / queue / streaming / observability / search / cli-test / orm / real driver...)

### 軸 2 = 形式検証 (static verification)

- 全入力に対して、 数学的に 定理として証明
- 対象 = 状態機械 / 型契約 / pure function、 論理的に定式化可能な domain
- 実装 = `@kiwa-lab/lean` = Lean 4 spec generator + `lean --check` 統合

### 軸 3 = 仕様駆動開発 (spec-driven development)

- 仕様書を **形式検証可能** / **runtime test 対象** / **human review 対象** の **3 layer に分類**、 検証 gap を 構造的に排除
- **仕様 = 検証の source of truth**、 書けなかった仕様は 検証されない
- 実装 = `@kiwa-lab/spec-kit` (v2.16+) = specFormal / specRuntime 2 file 分離生成 + 3 layer 分類器

## 5 原則統合 pattern SSOT

kiwa の depth-5 pattern は、 全 orchestrator (transaction / session / cache / job / cli / auth / ...) に 適用される systematic law。

1. **5 state SSOT** = state 空間を 有限化、 型として存在させる
2. **8 event SSOT** = event 空間を 有限化、 型として存在させる
3. **40 セル 遷移表 SSOT** = 5 × 8 = 40 の 全 (state, event) pair を 網羅的に定義
4. **domain 別 guard 使い分け** = backend systems layer = throw guard (遷移確定的) / payment / realtime / streaming / webhook 重複配信 domain = soft-reject (idempotency 保証)
5. **shape 契約 preserving** = 既存 API 変更 0、 新規追加のみ、 backward compat 絶対維持

**systematic law の 型レベル格上げ** = `@kiwa-lab/lean` v0.1 で 5 原則を Lean 4 の inductive type + total dispatch + `dispatch_total` theorem に変換、 rule 昇格 (convention) から type-level 定理に格上げ。

## 検証の 3 段 pipeline

```
OrchestratorSpec (SSOT)
    ├─► generateLeanSpec → Lean 4 source
    │       └─► verifyLeanSpec → lean --check → { status: 'ok' }
    │
    └─► TypeScript impl → vitest runtime testing
            └─► fidelity harness → mock ↔ real 差分 verify (optional)
```

同 SSOT を 両層で駆動、 Lean 側で 型 + 定理検証 (Level 2)、 TS 側で 実挙動 verify + fidelity harness で real driver 差分 verify。

## Non-goals (kiwa は何を目指さないか)

- kiwa は **1 layer だけの test framework** ではない (test だけ、 spec だけ、 verify だけ、 は kiwa の思想と 矛盾する)
- kiwa は **形式検証 tool の代替** ではない (Coq / Isabelle / TLA+ の位置を狙わない、 opinionated な 状態機械 SSOT に特化)
- kiwa は **testing の完全自動化** を約束しない (副作用 / integration / UX は 人間による runtime test 記述が必要)

## v2.15 現状の到達点 (2026-07-09)

- 42 npm package (@kiwa-lab org、 v1.x @kiwa-test/* 41 package deprecated 誘導済)
- `@kiwa-lab/lean` v0.2 = Lean spec 生成 + `lean --check` 統合 (Level 1 + Level 2)
- systematic pattern 57 度到達 = 5 原則が 半世紀 pattern 適用 の 定常運用 phase
- backend systems layer 完全普及 (transaction / session / cache / job / cli の 5 lifecycle-orchestrator = depth-5 到達)
- 60 milestone streak (v1.23-v2.15)

## 貢献の指針

kiwa への 貢献は 「際」 の意識で 行う。

- 新規 pair は 5 原則統合 pattern (5 state + 8 event + 40 cell + guard + shape preserving) に従う
- 仕様は 3 layer (formal / runtime / human-review) に 明示分類、 layer 混在禁止
- backward compat 絶対維持 (新規追加のみ、 既存 API 変更 0)
- 4 PR rhythm (実装 + dogfood + docs + publish) を 各 milestone で 継承

kiwa は 開発 workflow の **際を 意識化する framework** であり、 その 意識化が testing / 形式検証 / 仕様駆動開発 の 融合を 生む。
