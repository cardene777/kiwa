# spec-review-axes — `/kiwa-review --mode spec-review` の 5 軸詳細

`/kiwa-design` が生成した spec (9 section + 11 観点 + 9 column 表) を review する 5 軸の判定基準と評価例。 weighted_score 計算の SSOT。

## 1. 観点網羅 (weight 0.30)

11 観点 catalog (`.claude/skills/kiwa-design/references/viewpoints-catalog.md`) のうち、 適用条件を満たす全観点が spec に選択されているか判定。

### 判定手順

1. 対象機能 (spec 「対象機能」 section) を Read し、 適用条件を 11 観点ごとに評価:
   - 観点 1 正常系 — 常に適用 (省略不可)
   - 観点 2 異常系 — 外部依存 (RPC / API / DB / 3rd-party SDK) があれば必須
   - 観点 3 境界値 — 数値入力 / 文字列長 / 時間範囲 / 配列長があれば必須
   - ...
2. 適用条件を満たすのに spec の「テスト観点一覧」 section に選択されていない観点を列挙
3. 漏れ件数で score:
   - 漏れ 0 件 → 10/10
   - 漏れ 1 件 → 7/10
   - 漏れ 2 件 → 4/10
   - 漏れ 3+ 件 → 0/10

### 評価例 (token-gating)

- spec で選択された観点: 1, 2, 3, 4, 5, 7, 10 (7 観点)
- 適用条件評価:
  - 観点 6 入力バリデーション → grantTimedAccess(addr, uint256 ttl) で uint256 入力あり → **適用、 漏れ**
  - 観点 8 並行処理 → multi-tab 想定の dApp → **適用、 漏れ**
  - 観点 11 回帰 → 既存 test あり → **適用、 漏れ**
- 漏れ 3 件 → score 0/10

## 2. TC 件数妥当性 (weight 0.20)

観点ごとに最低 1 件 (正常系は 1+)、 高リスク機能は観点あたり 3+ 件あるか。

### 判定手順

1. spec の「テストケース一覧」 9 column 表を行単位で集計、 観点ごとの TC 件数を算出
2. リスク表 (spec 「主な品質リスク」) と組合せ:
   - 高リスク (売上/セキュリティ/データ破壊 のいずれかが「高」) → 観点あたり 3+ 件期待
   - 中リスク → 観点あたり 2+ 件期待
   - 低リスク → 観点あたり 1+ 件で OK
3. 未達観点の件数で score:
   - 全観点が期待件数満たす → 10/10
   - 1-2 観点が期待件数未達 → 7/10
   - 3-4 観点未達 → 4/10
   - 5+ 観点未達 → 0/10

### 評価例 (mint-nft)

- リスク = 高 (mint fee 売上影響 / mint bypass セキュリティ影響)
- 観点ごと TC 件数:
  - 正常系: 5 件 (3+ 期待) ✅
  - 境界値: 2 件 (3+ 期待) ❌
  - 権限: 1 件 (3+ 期待) ❌
- 2 観点未達 → score 7/10

## 3. 優先度妥当性 (weight 0.20)

リスク表 (Step 2) と優先度判定 (Step 5 ルール) が整合しているか。 「全 TC が低」 等の偏り検出。

### 判定手順

1. 各 TC の優先度を集計、 高 / 中 / 低 の比率を算出
2. リスク表との整合 check:
   - リスク高 → TC の 50%+ が「高」優先度であるべき
   - リスク低 → TC の 80%+ が「低」優先度であるべき
3. 偏り検出:
   - 全 TC が「低」(リスク高なのに) → 0/10
   - 全 TC が「高」(リスク低なのに) → 0/10
   - リスク表に対し優先度比率が許容範囲 (±20%) → 10/10
   - 比率が許容外 → 5/10

### 評価例

リスク高だが TC 12 件中「高」優先度が 2 件 (17%) → 比率違反 → 0/10

## 4. 入力 / 期待結果の具体性 (weight 0.20)

9 column 表の「入力値」「期待結果」 column が具体値で書かれているか。 抽象表現 (「適切に」「正しく」「必要に応じて」) は禁止。

### 判定手順

1. 全 TC の「入力値」「期待結果」 column を Read
2. 抽象表現を grep でカウント:
   - `適切に` / `正しく` / `必要に応じて` / `適宜` / `要件通り` / `要件に従って` / `その他`
3. 抽象表現ヒット件数で score:
   - 0 件 → 10/10
   - 1-2 件 → 7/10
   - 3-5 件 → 4/10
   - 6+ 件 → 0/10

### 評価例

「期待結果」 column に `tx 成功で balance 適切に更新` → 「適切に」 ヒット 1 件 → 軽微減点

## 5. 不足している仕様 section の使い方 (weight 0.10)

「不足している仕様」 section が:
- 仕様不明点 / author 確認推奨事項を bullet で明示している (skill が勝手に補完していない)
- 空の場合は「(なし)」 placeholder で意図的に空

### 判定手順

1. spec の「不足している仕様」 section を Read
2. 内容判定:
   - 仕様不明点が bullet で具体的に列挙されている → 10/10
   - 「(なし)」 + spec が仕様完備 → 10/10
   - 「(なし)」 だが skill が暗黙補完した形跡あり (例 「適切に処理」等の記述) → 0/10
   - section 自体が欠落 → 0/10

### 評価例 (token-gating)

「不足している仕様」 に 6 件の bullet (UI 未実装 function / hardcode の SECRET 値 / refetchInterval マジックナンバー 等) → 10/10

## 重み付き総合判定

```
weighted_score = (axis_1 × 0.30) + (axis_2 × 0.20) + (axis_3 × 0.20) + (axis_4 × 0.20) + (axis_5 × 0.10)
```

- 7.0 以上 → ✅ PASS
- 7.0 未満 → ❌ FAIL (spec 修正推奨)
- いずれかの軸が 0 → critical 警告 (該当軸の修正が最優先)

## 関連

- 親 SKILL: `.claude/skills/kiwa-review/SKILL.md`
- 並立 reference: `references/test-review-axes.md` (test-review mode の 5 軸)
- 観点 SSOT: `.claude/skills/kiwa-design/references/viewpoints-catalog.md`
