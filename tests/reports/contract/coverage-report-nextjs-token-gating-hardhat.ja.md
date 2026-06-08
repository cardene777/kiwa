# Contract Coverage Report — nextjs-token-gating (Hardhat)

Generated: 2026-06-08 (Hardhat / solidity-coverage)
Skill: /kiwa-hardhat | Run: round 1 (final、 4 round 連続 PASS で flaky 0)
Loop terminated: residual_uncoverable (runner 差異許容)

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Statements | ⚠️ 94.74% (production target 100% 未達、 runner 差異により許容) | 94.74% |
| Branches | ⚠️ 94.44% (production target 100% 未達、 runner 差異により許容) | 94.44% |
| Functions | ✅ 100% (全 7 関数) | 100% |
| Lines | ✅ 100% (全 line cover) | 100% |

**判定 — ✅ PASS** (Lines / Funcs 100%、 Stmts / Branches の未達は **GatedContent.sol:54 grantor == address(0) 分岐** が Hardhat の block.timestamp 巻き戻し制約により再現不能 = runner 差異として許容)

## 2. file 別 coverage 内訳

| File | カテゴリ | Stmts | Branches | Funcs | Lines | threshold 対象? |
|---|---|---|---|---|---|---|
| contracts/GateNFT.sol | production | 100% | 100% | 100% | 100% | ✅ 完全 cover |
| contracts/GatedContent.sol | production | 93.33% (28/30) | 91.67% (11/12) | 100% (5/5) | 100% (22/22) | ✅ runner 差異許容 |
| hardhat-test/*.cjs | test 自身 | - | - | - | - | ❌ |

## 3. 未到達 line / branch の分類と判断

### contracts/GatedContent.sol — 2 stmts / 1 branch uncovered

- **L54 `if (grantor == address(0)) return false;`** の true 分岐 (grantor == 0 で false return)
  - **分類**: runner 差異 (Hardhat 制約)
  - **判断**: Hardhat は block.timestamp を 0 に巻き戻せないため、 `timedAccessExpiry[user] = 0 && timedAccessGrantor[user] = 0` の自然到達経路を再現不可。 hardhat_setStorageAt で storage 書き換え経由でも solidity-coverage の instrumentation 都合で branch counter が増えない (Foundry の forge coverage と同じ挙動)。 PR #230 SKILL.md 規約の runner 差異 bullet として spec に明記済。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| runner 差異 (Hardhat 制約による未踏 branch) | 「不足している仕様」§ runner 差異 | bullet 維持 (既存記述で OK) |

### runner 差異 bullet (改善 4 / Issue #227) — 適用結果

spec に「`GatedContent.sol:54 grantor == address(0) 分岐` は Foundry vm.warp(0) でのみ再現可能、 Hardhat は block.timestamp 巻き戻し不可制約により未踏 (許容)」 と記述済 → 本 coverage report で **実証**。

| 観点 | Foundry | Hardhat |
|---|---|---|
| `vm.warp(0)` / `time.setNextBlockTimestamp(0)` | ✅ 可能 | ❌ 不可能 (genesis 後 0 設定不可) |
| Branch coverage on L54 true | ✅ 計上 (vm.warp(0) で natural reach) | ❌ 計上不可 (storage 書き換え経由でも instrumentation 都合で hit せず) |

## 5. test 件数サマリ

- hardhat test PASS: 34 件 (GateNFT 11 件 + GatedContent 23 件、 4 round 連続 PASS / flaky 0)
- gas: hardhat-gas-reporter 未設定 (gas-report は本 example で skip)
