# result-review-axes — `/kiwa-review --mode result-review` の 5 軸詳細

`/kiwa-test` 完了後の統合 report と各子 report を集約して、 test 実行結果の総合品質を review する 5 軸の判定基準と評価例。 weighted_score 計算の SSOT。

## 1. coverage 達成度 (weight 0.30)

production target (contracts/ 配下) 100% 達成 / 不可能分類 (defensive code / 外部依存 / 削除候補 mock) で意図的未達 / 真の未達 を区別。

### 判定手順

1. 統合 report Section 2 の「coverage report」 行に載っている path を開き、 Section 1 (判定サマリ) を Read。 file 名は組み立てない
2. production target 全 4 metric の pct を抽出 (Lines / Statements / Branches / Functions)
3. 未達分について Section 3 (未到達 line 分類) を Read、 5 分類 (削除候補 / defensive / 外部依存 / 計測除外 / 真の未踏) を集計
4. score:
   - 全 4 metric 100% → 10/10
   - 未達 (95-99%) + 残 uncovered 全て「不可能」分類 → 9/10
   - 未達 (90-94%) + 残 uncovered 全て「不可能」分類 → 7/10
   - 未達 + 「真の未踏」あり → -3 (重大な test 漏れ)
   - 80% 未満 → 0/10 + critical

### 評価例 (nft-marketplace)

| metric | production | Total |
|---|---|---|
| Lines | 100% | 90.87% |
| Branches | 100% | 88.71% |

production 100% 達成、 Total 未達は test/mock 含む分母 → 10/10

## 2. passing 件数 vs 設計件数 (weight 0.20)

spec 設計件数と test 実行件数の一致、 skip 件数の妥当性 (理由明示の有無)。

### 判定手順

1. spec file の TC 件数 (`spec_count`) を Grep。 **path は組み立てず `kiwa layers` が返す `spec_path` を使う** (親 SKILL.md § 入力 spec の path は CLI から受け取る)
2. test 実行結果 (統合 report Section 1 の passing / failing / skipped) を取得 (`executed_count` / `skipped_count`)
3. test code 内の skip 理由 (`it.skip` / `test.skip` の前後コメント) を Grep
4. score:
   - `spec_count == passing + skipped` + skip 全件に理由明示 → 10/10
   - `spec_count > passing + skipped` (実装漏れあり) → -2 per 漏れ件
   - skip 理由不明 → -1 per 件 (TODO 未実装 等の注釈なし)
   - failing > 0 → 0/10 + critical

### 評価例 (token-gating)

- spec TC: 13 件
- 実行結果: 12 passing + 1 skipped (TC-005 = mint Reject、 「onError ハンドラ実装後に有効化」 注記あり)
- 漏れ 0 件、 skip 理由明示 → 10/10

## 3. flaky 兆候 (weight 0.20)

4 round 実行で件数 / timing がブレていないか、 同 round 内 retry 発生の有無。

### 判定手順

1. 統合 report Section 1 から各 round の passing / failing 件数を抽出 (4 round 連続)
2. 各 round の実行 timing (ms 単位) を集計、 標準偏差を算出
3. retry 発生件数 (Playwright `test-results/*/retry-*/` dir 存在数) を集計
4. score:
   - 全 round 件数一致 + timing 標準偏差 < 平均 ±20% + retry 0 → 10/10
   - timing 標準偏差 ±20-50% → 7/10 (flaky 一歩手前、 監視推奨)
   - timing 標準偏差 ±50%+ or retry 1+ 件 → 4/10 (flaky 兆候、 修正推奨)
   - 同 round 内で 1 件でも failing → 0/10 + critical (本格的 flaky)

### 評価例 (nft-marketplace)

| round | passing | failing | timing (ms) |
|---|---|---|---|
| 1 | 51 | 0 | 2100 |
| 2 | 51 | 0 | 2050 |
| 3 | 51 | 0 | 2200 |
| 4 | 51 | 0 | 1980 |

標準偏差 ≈ ±5% (2082 ± 100ms) → 10/10

## 4. review 結果集約 (weight 0.20)

子 spec-review / test-review の weighted_score 平均、 critical 指摘の残存。

### 判定手順

1. 子 review report の path を **統合 report Section 2 の「review report」 行から読む**。 file 名を組み立てない (§ 子 report の path は組み立てない)
2. 読めた report の Section 1 から weighted_score を抽出
3. 全 review の平均 score を算出
4. 各 review report の critical / major 件数を集計
5. score:
   - 平均 score >= 8.0 + critical 0 件 → 10/10
   - 平均 score 7.0-7.9 + critical 0 件 → 7/10
   - 平均 score < 7.0 (FAIL あり) → -3
   - critical 残存 1+ 件 → 0/10 + critical (本 result-review でも critical)
   - **読めた report が 1 件も無い → score を出さず `—` (未測定)**

### 子 report の path は組み立てない

統合 report Section 2 に載っている path をそのまま開く。 載っていない、 または載っているが実在しない場合は **その path を控えて未測定として扱う**。

観測対象の一覧を読む側が持たない形は、 同じ result-review mode の observe dashboard で既に採っている (親 SKILL.md § 1C)。 軸 4 だけが `{example}` から file 名を組み立てており、 **子 report を書く側は `--module` の値で書く**ため、 module と example が違う layer (ui / api / data / cli / unit ...) では毎回外す。

### 読めなかった時に推定で埋めない

**子 report が 1 件も読めない run で、 自前の推定値を入れてはいけない**。 軸 4 は「独立に行われた review の集約」 を測る軸で、 推定を入れた瞬間に測っているものが自己採点に変わる。 集約される側と集約する側が同じ agent になり、 軸そのものが消える。

実測 = `tests/reports/review/` にある result-review 5 件はすべて子 report 0 件の状態で書かれ、 5 件とも「推定 weighted_score 平均 9.3-9.5」 として 9/10 を計上していた。 5 回とも軸 4 は何も集約していない。

未測定の時は以下 3 点を守る。

| # | 扱い |
|---|---|
| 1 | 軸 4 の score 欄は `—`、 重み付き欄は `0.00` |
| 2 | **weighted_score の分母は 1.00 のまま**。 残り 4 軸で再正規化しない |
| 3 | 総合判定は score に関わらず ⚠️ CONDITIONAL。 未測定である旨と、 開いて無かった path を report に列挙する |

2 を再正規化しないのは、 分母を 0.80 に詰めると **証拠が少ない run ほど score が上がる**から。 親 SKILL.md § 未生成 TC の扱い が cover 率で同じ形を禁じているのと同じ理由で、 ここでも「gate を通すほど成績が良くなる」 経路を作らない。

### 評価例

| review | score | critical |
|---|---|---|
| spec-review (contract) | 8.2/10 | 0 |
| spec-review (e2e) | 8.0/10 | 0 |
| test-review (Foundry) | 7.8/10 | 0 |
| test-review (Hardhat) | 7.8/10 | 0 |
| test-review (Playwright) | 7.5/10 | 0 |

平均 7.86/10、 critical 0 → 7/10

## 5. 後追い項目 (weight 0.10)

spec 「不足している仕様」 section の未消化 bullet 件数、 統合 report の「次アクション」 残件数。

### 判定手順

1. spec file の 「不足している仕様」 section を Read、 bullet を集計
2. 各 bullet が以下のいずれかであるか check:
   - **Issue 番号紐付け済** (例 `Issue #1234 で対応予定`) → 解消済扱い
   - **TODO 明記** (例 `(TODO: PRD 確定後に追記)`) → 後追い予定
   - **無視** (Issue / TODO なし、 放置) → 後追い漏れ
3. 統合 report Section 4 「次アクション」 の残件数 (例 `修正要 3 件`) を集計
4. score:
   - 不足 0 件 (完備) → 10/10
   - 不足 1-2 件 + 全て Issue 紐付け or TODO 明記 → 8/10
   - 不足 3+ 件 + 全て紐付け → 7/10
   - 不足あり + 紐付け無し (放置) → -2 per 放置件
   - 統合 report の次アクション critical 1+ 件 → 0/10 + critical

### 評価例 (token-gating)

- spec 「不足している仕様」: 6 件 bullet (UI 未実装 function / hardcode SECRET / refetchInterval 等)
- Issue / TODO 紐付け: 0 件 (放置)
- 統合 report 次アクション: minor 2 件 (UI 補完推奨 / spec 補強推奨)

→ 放置 6 件 → score 0/10 + 警告

## 重み付き総合判定

```
weighted_score = (coverage × 0.30) + (件数 × 0.20) + (flaky × 0.20) + (review 集約 × 0.20) + (後追い × 0.10)
```

未測定軸 (`—`) は 0 として加算し、 **分母は 1.00 のまま**にする。

- 未測定軸が 1 つでもある → ⚠️ CONDITIONAL (score に関わらず、 親 SKILL.md § Step 3 の判定表と同じ優先順位)
- 未測定軸なし + 7.0 以上 → ✅ PASS (test suite 全体が production 公開水準)
- 未測定軸なし + 7.0 未満 → ❌ FAIL (修正推奨、 critical 軸を最優先)
- 軸 1 (coverage) や 軸 4 (review 集約) が 0 → critical (test の信頼性 or 全体品質に重大問題)

**未測定 (`—`) と 0 点は別**。 前者は測っていない、 後者は測って悪かった。 どちらも加算値は 0 だが、 判定は前者が CONDITIONAL (何を測れば決まるかを添えて先へ進む)、 後者が critical。

## 関連

- 親 SKILL: `.claude/skills/kiwa-review/SKILL.md`
- 並立 reference:
  - `references/spec-review-axes.md` (spec-review mode の 5 軸)
  - `references/test-review-axes.md` (test-review mode の 5 軸)
- 観点 SSOT: `.claude/skills/kiwa-design/references/viewpoints-catalog.md`
- 統合 report SSOT: `.claude/skills/kiwa-test/SKILL.md` § Step 5 (4 section format)
