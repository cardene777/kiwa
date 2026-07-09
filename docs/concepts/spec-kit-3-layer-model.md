---
title: "@kiwa-lab/spec-kit v0.1 — 3 layer specification model SSOT"
---

# @kiwa-lab/spec-kit v0.1 — 3 layer specification model SSOT

## What this covers

`@kiwa-lab/spec-kit` = kiwa の 仕様駆動開発層。 仕様書を **3 layer に分類** し、 layer 別に paired file (`specFormal.md` + `specRuntime.md`) として書き出す。 kiwa MANIFESTO の 3 軸融合 (testing + 形式検証 + 仕様駆動開発) を 仕様書レベルで 実装。

## 3 layer model SSOT

| layer | 意味 | verify 経路 |
|---|---|---|
| `formal` | Lean 検証可能 (状態機械 / pure contract / 型契約) | `@kiwa-lab/lean` = generateLeanSpec + verifyLeanSpec |
| `runtime` | runtime test (副作用 / integration / performance) | vitest + real driver + fidelity harness |
| `human` | human review (UX / business intent / non-mechanical judgment) | PR review + manual approval |

## API SSOT

```ts
splitSpec(doc: SpecDoc): SplitResult;         // 2 file 分離生成
classify(doc: SpecDoc): ClassifyReport;       // 静的検査 (5 rule)
```

### SpecItem 型

```ts
{
  id: string;              // AC-001 等の 一意 identifier
  statement: string;       // 1 sentence AC
  layer: 'formal' | 'runtime' | 'human';
  verifyBy: string;        // Lean namespace or test path or review checkpoint
  notes?: string;
}
```

## 5 static rule (classify() 検査)

- **duplicate-id** = 同 id を 2 度使用禁止
- **empty-statement** = 内容空 AC 禁止
- **empty-verify-by** = verify 経路空 禁止
- **unknown-layer** = formal / runtime / human 以外の layer 禁止
- **both-layers-touch-same-artifact** = 同一 verifyBy target が 2 layer に跨る 禁止 = 「書いたのに検証されない」 silent gap の 構造的排除

## verification gap 構造的排除

従来 pattern (silent gap 発生原因)。

- markdown に 「foo should work」 と書く
- test に foo が 実装されていない
- code review でも 気付かず merge

3 layer model による排除。

- 各 AC を 1 layer に配置強制 (layer 混在 = classify() deny)
- verifyBy field で 明示的に verify 経路指定 (empty = classify() deny)
- 同一 verifyBy target が 2 layer に跨る = classify() deny (どちらも verify されない silent gap の 排除)

## v2.16 milestone signal

- 61 milestone streak (v1.23-v2.16)
- 4 PR rhythm 15 milestone 目 (v2.1-v2.16)
- backward compat 絶対維持 24 milestone 連続 (v1.61-v2.16)
- systematic pattern 58 度目 = @kiwa-lab/spec-kit 追加
- **kiwa 3 軸融合完成** = testing + 形式検証 (v2.14 lean v0.1 / v2.15 lean v0.2) + 仕様駆動開発 (v2.16 spec-kit v0.1)
- 43 package (42 + spec-kit) 到達
