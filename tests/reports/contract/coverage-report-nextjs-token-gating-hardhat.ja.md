# Contract Coverage Report — nextjs-token-gating (Hardhat)

Generated: 2026-06-08
Skill: /kiwa-hardhat | Run: round 1 (final)
Loop terminated: residual_uncoverable (Hardhat 制約による block.timestamp == 0 不可)

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Statements | ⚠️ 94.74% (18/19) | 94.74% (18/19) |
| Branches | ⚠️ 94.44% (17/18) | 94.44% (17/18) |
| Functions | ✅ 100% (7/7) | 100% (7/7) |
| Lines | ✅ 100% (28/28) | 100% (28/28) |

**判定 — ✅ PASS (residual_uncoverable)** — Lines / Funcs は 100%、 残 Stmts / Branches 1 件は Hardhat network の制約 (block.timestamp は 過去方向に巻き戻せない) で再現不能、 「外部依存」分類により test-passed marker を作成。 Foundry 経路 (`vm.warp(0)` で再現可能) で同一 branch は cover 済 (`tests/reports/contract/coverage-report-nextjs-token-gating.ja.md` 参照)。

実行サマリ — `npx hardhat test` 27 passed / 0 failed、 wall 160ms。 spec の TC-001〜TC-026 + coverage 補完 TC-add-1 (isGated) を `hardhat-test/TokenGating.test.cjs` に 1:1 mapping で実装、 観点 grouping 9/9 一致、 chai matchers (revertedWithCustomError / emit-withArgs / time helper) で具体値 assertion。

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Stmts | Branches | Funcs | Lines | threshold 対象? |
|---|---|---|---|---|---|---|
| `contracts/GateNFT.sol` | production | 100% | 100% | 100% | 100% | ✅ |
| `contracts/GatedContent.sol` | production | 93.33% | 91.67% | 100% | 100% | ✅ |
| `hardhat-test/TokenGating.test.cjs` | test 自身 | (計測対象外) | - | - | - | ❌ |

## 3. 未到達 line の分類と判断

### contracts/GatedContent.sol - 1 branch uncovered

- **L54 `if (grantor == address(0)) return false;` の true 分岐**
  - **分類**: 外部依存 (block.timestamp の特殊状態が必要)
  - **判断**: この branch は `timedAccessExpiry[user] == 0 == block.timestamp` を満たす状態でしか到達不能。 `timedAccessExpiry[unknown] == 0` のとき line 52 `0 < block.timestamp` が通常 true で早期 return false するため、 `block.timestamp == 0` が必要。 Hardhat network は EVM の制約上 timestamp を過去 (特に 0) に巻き戻せない (`evm_setNextBlockTimestamp` は前 block より進める方向のみ許容)。 Foundry の `vm.warp(0)` では再現可能で同 branch は cover 済 (Foundry 経路 production 全 4 metric 100%)。
  - **代替案 (未採用)**: deploy 時点で 1 block 進めず view 呼びだけ実行する fixture を作っても、 Hardhat network は genesis から timestamp が進む設計のため 0 を取れず却下。 mock contract を別途用意して GatedContent を継承し timestamp を override する経路は contract 内部 logic を不当に変えるため不採用。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| Hardhat 制約による branch 再現不可 (Foundry とのカバレッジ差) | 「不足している仕様」 / Layer 2 注記 | bullet 追加 (「block.timestamp == 0 branch は Foundry 経路でのみカバー、 Hardhat 経路は外部依存分類で除外」) |
| TC-add-1 isGated view 関数 | テストケース一覧 § 観点 1 正常系 (view 関数として) | 9 column 表に新規追加 (TC-027 として spec へ昇格、 Foundry / Hardhat 両方で実装済) |
| TC-013 期待結果の訂正 (Foundry と整合) | テストケース一覧 § 観点 3 境界値 TC-013 | 「grantor 保有有無に関わらず期限切れで false」 と訂正 |

> 注 — 本 skill (Layer 2) は spec を **書き換えず**、 上記提案を report に列挙のみ。 spec への反映は user 手動 or `/kiwa-design --mode update` (別 Issue 検討予定)。

## 5. test-passed marker

`test-passed` marker 作成条件 — 残 uncovered が「外部依存」分類で production 100% 理論不能 → ✅ marker 作成 (report Section 1 に理由明示済)。
