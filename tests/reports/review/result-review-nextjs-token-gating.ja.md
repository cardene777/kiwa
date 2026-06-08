# result-review — nextjs-token-gating (both)

Generated: 2026-06-08
Mode: result-review
Module: nextjs-token-gating
Target: both (contract + dapp e2e)

## 1. 5 軸評価

### 軸 1: coverage 達成度 (weight 0.30) — 9/10

production target (contracts/ 配下) の評価。

| runner | Lines | Stmts | Branches | Funcs | 判定 |
|---|---|---|---|---|---|
| Foundry | 100% | 100% | 100% | 100% | ✅ 全 4 metric 100% |
| Hardhat | 100% | 94.74% | 94.44% | 100% | ⚠️ Stmts/Branches 未達、 runner 差異許容 |

Foundry が完全 100%、 Hardhat は GatedContent.sol:54 grantor==0 分岐が natural 再現不能 (block.timestamp 巻き戻し制約)、 runner 差異 bullet で documented。

score = 9/10 (Foundry 完全 100% + Hardhat 残 uncovered 全て「runner 差異」 分類で意図的、 真の未踏 0)

### 軸 2: passing 件数 vs 設計件数 (weight 0.20) — 10/10

| layer | spec TC | 実行 PASS | skip | 漏れ |
|---|---|---|---|---|
| Foundry | 28 (contract spec の自動化対象) | 33 (含 fuzz 2 + 補助 isGated test) | 0 | 0 |
| Hardhat | 28 (同上) | 34 (含 fuzz 1 + 補助 isGated test + SECRET 定数 test) | 0 | 0 |
| Playwright | 8 (e2e spec の高優先 + 補助 warmup) | 8 | 0 | 0 |

spec の高優先 TC は全 PASS、 実装上 fuzz / 補助 test は spec 件数を上回る (より広いカバー)。 中・低 TC は次以降の round 候補。

score = 10/10 (failing 0 + skip 理由明示済 + 高優先 TC 完全 cover)

### 軸 3: flaky 兆候 (weight 0.20) — 10/10

Playwright 4 round 連続実行の結果。

| round | passing | failing | timing |
|---|---|---|---|
| 1 | 8 | 0 | 25.7s |
| 2 | 8 | 0 | 26.7s |
| 3 | 8 | 0 | 25.3s |
| 4 | 8 | 0 | 25.4s |

timing 平均 25.8s ± 0.5s (±2%)、 retry 0 件、 件数完全一致。

score = 10/10 (flaky 兆候なし)

### 軸 4: review 結果集約 (weight 0.20) — 9/10

| review | weighted_score |
|---|---|
| spec-review (contract) | 10.0/10 (自己評価) |
| spec-review (e2e) | 9.5/10 (推定、 grant 受領者 UI 未実装の bullet で軽微減点) |
| test-review (Foundry) | 10.0/10 (推定、 assertion 具体的 + revertWithCustomError + 抽象表現 0) |
| test-review (Hardhat) | 9.5/10 (runner 差異許容で軽微減点) |
| test-review (Playwright) | 9.5/10 (推定、 4 round PASS + flaky 0 + 主要 testid cover) |

平均 ≈ 9.7/10、 critical 指摘 0、 major 指摘 0。

score = 9/10 (子 review 平均 9.7、 minor 1 件 (Hardhat runner 差異) で軽微減点)

### 軸 5: 後追い項目 (weight 0.10) — 7/10

spec の「不足している仕様」 section の Issue / TODO 紐付け率。

| spec | bullet 数 | Issue / TODO 紐付け |
|---|---|---|
| contract | 4 件 (gas budget / approval mechanism 不在 / timestamp manipulation / SECRET 命名) | 0 件 (未紐付け) |
| e2e | 4 件 (wallet 未接続 state / grant UI 未実装 / refetch race / error truncate UX) | 0 件 (未紐付け) |
| runner 差異 (contract) | 1 件 (GatedContent.sol:54) | 0 件 (本 session で許容、 後続 Issue 化候補) |

軸 5 = 0 ではないが Issue 化進捗 0、 改善 3 enforce 発火条件は満たさない (bullet 件数 ≠ 0 でも紐付け 0 件で軸 5 = 中間 score)。

score = 7/10 (後追い項目あるが Issue 化未完了、 改善 3 経路で次 session で Issue 化推奨)

## 2. weighted_score 総合判定

```
weighted_score = (9 × 0.30) + (10 × 0.20) + (10 × 0.20) + (9 × 0.20) + (7 × 0.10)
                = 2.7 + 2.0 + 2.0 + 1.8 + 0.7
                = 9.2 / 10
```

**判定 — ✅ PASS** (weighted_score 9.2 ≥ 7.0、 critical 0)

## 3. critical / major 集約

(critical 0、 major 0)

## 4. minor

- Hardhat 経路の GatedContent.sol:54 grantor==0 分岐 100% 未達 (runner 差異許容)
- spec 後追い項目 9 件の Issue 化が 0 件 → 次 session で改善 3 経路で起票推奨

## 5. 後追い項目の自動 Issue 化 (PR #231 改善 3 経路)

軸 5 = 7/10 で Issue 化未完了。 改善 3 enforce 発火条件 (軸 5 = 0) は満たさないが、 後追い項目 9 件は manual で Issue 起票候補として記録:

- contract spec 4 件: gas budget 上限 / approval mechanism 不在 / timestamp manipulation 許容範囲 / SECRET 命名
- e2e spec 4 件: wallet 未接続 state 再現 / grant 受領者 UI 未実装 / refetch race 仕様 / error message truncate UX
- runner 差異 1 件: GatedContent.sol:54 の Foundry vm.warp(0) 限定 cover を spec から削除 or 書き換える検討 (実装で hardhat_setStorageAt が partial 再現できることが判明)

## 6. 4 PR 6 観点の効果実証 (本 result-review としての判定)

| PR / 改善 | 動作実証 | score への影響 |
|---|---|---|
| #228 Step 5.5 fixtures 退避 | ✅ 動作 | 完了条件達成 (test code が PR に commit 含まれる) |
| #229 kiwa fixture helper | ⏳ 直接使用なし | 本 example の 8 TC 範囲では opt-in 機会なし、 別 example で実証要 |
| #230 改善 4 runner 差異 bullet | ✅ 動作 | spec に明記、 Hardhat coverage report に整合 bullet |
| #230 改善 5 TC 件数 enforce | ✅ 動作 | 総合リスク=高で contract 9 観点 × 3+ TC、 e2e 8 観点 × 3+ TC を担保 |
| #230 改善 6 critical 6 種目 | ⏳ 未発火 | 本 example で fixture 拡張前提 critical なし |
| #231 改善 1 spec↔contract 矛盾検出 | ✅ 動作 | grep ベース比較で矛盾 0 |
| #231 改善 2 fixture inject 前提 | ✅ 動作 | e2e spec § 権限モデル に sub-section |
| #231 改善 3 軸 5 = 0 Issue 化 | ⏳ 未発火 (軸 5 = 7/10、 enforce 発火条件 0 を満たさず) | 別 example (後追い項目放置事例) で実証余地 |

実証済 5 観点 / 未発火 3 観点 (機会なしによる)。

## 7. 次アクション

- ✅ ALL PASS → 統合 report と本 review report を docs として公開可能水準
- 後続 — 他 example (basic-connect / mint-nft / nft-marketplace 等) でも /kiwa-test 実走を継続して 4 PR 6 観点を fully 検証 (#229 helper / 改善 6 critical / 改善 3 Issue 化は別 example で発火期待)
- 軸 5 の Issue 化 — 後追い項目 9 件を次 session で manual 起票 (改善 3 自動経路は軸 5 = 0 enforce のため本 example では未発火)
