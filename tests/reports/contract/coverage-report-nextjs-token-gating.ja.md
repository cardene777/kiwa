# Contract Coverage Report — nextjs-token-gating

Generated: 2026-06-08 (Foundry / forge coverage)
Skill: /kiwa-forge | Run: round 1 (final)
Loop terminated: production_100_achieved

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Lines | ✅ 100.00% (35/35) | 100.00% (35/35) |
| Statements | ✅ 100.00% (44/44) | 100.00% (44/44) |
| Branches | ✅ 100.00% (8/8) | 100.00% (8/8) |
| Functions | ✅ 100.00% (7/7) | 100.00% (7/7) |

**判定 — ✅ PASS** (全 4 metric 100% 到達、 production target 完全 cover)

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Lines | Stmts | Branches | Funcs | threshold 対象? |
|---|---|---|---|---|---|---|
| contracts/GateNFT.sol | production | 100% (13/13) | 100% (15/15) | 100% (2/2) | 100% (2/2) | ✅ |
| contracts/GatedContent.sol | production | 100% (22/22) | 100% (29/29) | 100% (6/6) | 100% (5/5) | ✅ |
| test/GateNFT.t.sol | test 自身 | - | - | - | - | ❌ |
| test/GatedContent.t.sol | test 自身 | - | - | - | - | ❌ |

## 3. 未到達 line の分類と判断

未到達 line / branch なし。全 production target 100% 到達。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| (該当なし) | - | - |

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227) — 適用結果

spec 段階で「GatedContent.sol:54 grantor == address(0) 分岐は Foundry vm.warp(0) でのみ再現可能、 Hardhat は block.timestamp 巻き戻し不可制約により未踏 (許容)」 と記述したが、 **実装段階で vm.warp(0) は不要であることが判明**。 vm.store で grantor=0 を直接書き換えるだけで分岐に到達でき、 Hardhat 側でも `hardhat_setStorageAt` で同等の書き換えが可能 (runner 差異ではない)。

**spec 訂正候補** — runner 差異 bullet を削除 or 「vm.store / hardhat_setStorageAt の storage 書き換えで両 runner cover 可能」 に書き換え。 PR #226/#227 SKILL.md 規約への発見的 feedback として記録 (修正は後続 Issue で対応)。

## 5. test 件数サマリ

- forge test PASS: 33 件 (GateNFT 11 件 + GatedContent 22 件)
- fuzz test: 2 件 (testFuzz_TC021_transferFrom_RejectsZeroRecipient, testFuzz_grantTimedAccess_TtlRange)
- fuzz runs: 256 (default)
- 平均 gas: GateNFT mint 88k / transferFrom 30k / grantTimedAccess 88k / getSecret 24k
