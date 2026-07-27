# test-review-axes — `/kiwa-review --mode test-review` の 5 軸詳細

Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play`) が生成した test code を spec と突き合わせて review する 5 軸の判定基準と評価例。 weighted_score 計算の SSOT。

## 1. TC ID mapping (weight 0.30)

spec の「テストケース一覧」 9 column 表の全 TC ID が test code に存在するか (1:1 mapping)。

### 判定手順

1. spec の TC ID 一覧を抽出 (例 TC-001 〜 TC-013、 計 13 件)
2. test code (`.t.sol` / `.test.cjs` / `.spec.ts`) から test 関数名 / it block 名で `TC-NNN` を grep
3. mapping 状態を 3 種に分類:
   - **完全 mapping**: spec TC ID = test ID (件数一致 + 全件 mapping) → 10/10
   - **実装漏れ**: spec にあって test にない → 1 件ごと -1 (例 5 件漏れで 5/10)
   - **余剰 test**: test にあって spec にない → 1 件ごと -0.5 (test が spec を超えるのは品質向上だが trace 切れ)

### 評価例 (token-gating)

- spec TC: TC-001 〜 TC-013 (13 件)
- test 実装: TC-001 〜 TC-013 (13 件、 完全 mapping、 TC-005 は test.skip)
- 実装漏れ 0 件、 余剰 0 件 → 10/10 (skip は実装済扱い、 理由が test code に明示されていれば OK)

## 2. 観点 grouping 一致 (weight 0.15)

test code の describe block / コメント (`// 観点 N: {name}`) が spec の観点 grouping と一致しているか。

### 判定手順

1. spec の「テスト観点一覧」 section から観点名 (1-11) を抽出
2. test code から `// 観点 N:` (Foundry) / `describe('観点 N: ...')` (Hardhat / Playwright) を grep
3. 一致状態:
   - 全観点が一致 → 10/10
   - 1-2 観点不一致 (rename / 欠落) → 7/10
   - 3+ 観点不一致 → 4/10
   - grouping 自体が無い (flat 構造) → 0/10

### 評価例

spec で観点 5 「権限」 を選択しているが test code に `// 観点 5:` コメントが無い → 1 件不一致 → 7/10

## 3. assertion 品質 (weight 0.25)

spec の「期待結果」 column と test の `expect()` / `assertEq()` / `vm.expectRevert()` が意味的に対応、 truthy 判定 (`toBeTruthy()` / `to.exist`) ではなく具体値 assertion。

### 判定手順

1. test code の全 assertion を grep:
   - Foundry: `assertEq` / `assertTrue` / `vm.expectRevert` / `vm.expectEmit`
   - Hardhat: `expect(...).to.equal` / `.to.be.revertedWith` / `.to.emit`
   - Playwright: `expect(...).toHaveText` / `.toBe` / `.toBeVisible`
2. 抽象 assertion をカウント:
   - `toBeTruthy()` / `to.be.true` / `to.exist` / `assertTrue(condition)` (具体値なし)
   - `to.be.greaterThan(0)` (具体上限なし)
3. spec の「期待結果」 column の具体値 (例 `balance = 1` / `Transfer event emit with args (from, to, 1)`) が test に反映されているか
4. score:
   - 全 assertion が具体値 + spec 通り → 10/10
   - 抽象 assertion 1-3 件 → 7/10
   - 抽象 assertion 4-6 件 → 4/10
   - 抽象 assertion 7+ 件 or spec と乖離 → 0/10

### 評価例

spec 「期待結果」 = `tokenId 1 の owner が buyer に変わる`
test code `expect(await nft.ownerOf(1)).to.equal(buyer.address)` → 具体値 assertion ✅
別 test で `expect(result).to.exist` → 抽象 ❌

## 4. 観点別 cover 率 (weight 0.20)

観点ごとに spec TC が全件実装されているか。 例えば spec で観点 5 「権限」 が 5 TC 設計、 test に 3 件しかなければ cover 率 60%。

### 判定手順

1. spec の TC を観点別に集計 (観点 N → TC 件数)
2. test code の TC を観点別に集計 (観点 N コメント or describe で grouping)
3. 観点別 cover 率を算出 (test_count / spec_count × 100)
4. 全観点の平均 cover 率で score:
   - 95-100% → 10/10
   - 85-94% → 7/10
   - 70-84% → 4/10
   - 70% 未満 → 0/10

### 評価例

| 観点 | spec TC | test TC | cover 率 |
|---|---|---|---|
| 1 正常系 | 5 | 5 | 100% |
| 2 異常系 | 3 | 3 | 100% |
| 3 境界値 | 2 | 1 | 50% |
| 4 状態遷移 | 3 | 3 | 100% |
| 平均 | | | 87.5% |

平均 87.5% → score 7/10

## 5. 追加すべき test 提案 (weight 0.10)

spec にも test にも無いが、 contract / UI 実装を見て「この観点 / 機能の test も追加すべき」 と判定。 実装漏れと将来 enhancement を区別。

### 判定手順

1. contract code (`contracts/*.sol`) / UI code (`app/`) を grep で function / event / error を抽出
2. spec / test に登場していない function を列挙
3. 各未 cover function について追加 test 提案を生成:
   - **観点を明示**: 11 観点のどれに該当するか
   - **具体的 TC を提案**: 「TC-XXX として TX-YYY scenario を test」
   - **緊急度**: critical (security) / major (機能漏れ) / minor (edge case)
4. 提案件数で score:
   - 提案 0-2 件 → 10/10 (cover 充実)
   - 提案 3-5 件 → 7/10 (改善余地あり)
   - 提案 6+ 件 → 4/10 (大きな穴あり)
   - critical 提案あり → 軸別 score とは別に critical 警告

### 評価例 (token-gating)

提案 5 件:
- 観点 11 回帰: grantTimedAccess(addr, 0) で 0 秒 grant が即時 expire するか (critical: contract に未テスト edge case)
- 観点 4 状態遷移: transfer 後の grant 自動 revoke が別 user 経由でも有効か (major)
- 観点 8 並行処理: 同 grantee へ複数 grant が同時実行された場合 (minor)
- 観点 10 セキュリティ: signature 経由 grant の replay 攻撃 (major)
- 観点 5 権限: grantor 削除後の grant 有効性 (minor)

→ critical 1 件 + major 2 件 + minor 2 件、 計 5 件 → score 7/10 + critical 警告

## 重み付き総合判定

```
weighted_score = (mapping × 0.30) + (grouping × 0.15) + (assertion × 0.25) + (cover × 0.20) + (提案 × 0.10)
```

- 7.0 以上 → ✅ PASS
- 7.0 未満 → ❌ FAIL (test 修正推奨)
- 軸 1 (mapping) が 0 → critical (spec 通り全 TC を実装、 最優先)
- 軸 3 (assertion) が 0 → critical (test の信頼性が無い)

## 関連

- 親 SKILL: `.claude/skills/kiwa-review/SKILL.md`
- 並立 reference: `references/spec-review-axes.md` (spec-review mode の 5 軸)
- 観点 SSOT: `.claude/skills/kiwa-design/references/viewpoints-catalog.md`
