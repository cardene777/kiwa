# Contract Coverage Report — mint-nft (Foundry)

Generated: 2026-06-08
Skill: /kiwa-forge | Run: round 1 (final)
Loop terminated: production_100_achieved

## 1. 判定サマリ

| metric | production target | Total |
|---|---|---|
| Lines | ✅ 100.00% (87/87) | 100.00% (93/93) |
| Statements | ✅ 100.00% (92/92) | 100.00% (95/95) |
| Branches | ✅ 100.00% (18/18) | 100.00% (18/18) |
| Functions | ✅ 100.00% (21/21) | 100.00% (24/24) |

**判定 — ✅ PASS** (全 4 metric 100%)

## 2. file 別 coverage 内訳

| File | カテゴリ | Lines | Stmts | Branches | Funcs |
|---|---|---|---|---|---|
| contracts/MintNft.sol | production | 100% | 100% | 100% | 100% |
| test/MintNft.t.sol | test 自身 | - | - | - | - |

## 3. 未到達 line の分類と判断

未到達なし。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| (該当なし) | - | - |

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227) — 適用結果

contract 内に block.timestamp 巻き戻し / vm.warp(0) 必要な branch なし、 runner 差異 bullet は contract spec に未記載で OK。 ただし Hardhat 経路は別 file の coverage report で別途記録 (try/catch の catch branch が Hardhat では inline mock 定義が複雑なため未踏)。

## 5. test 件数サマリ

- forge test PASS: 38 件 (revertingReceiver / GoodReceiver / BadReceiver mock 含む 32 TC + 6 補助 test)
- fuzz test: 0 (本 contract は ttl のような scalar fuzz 対象が薄い、 enumerable 整合が integration test 中心)
- 主要 gas: mint 200k / batchMint(10) 1.6M / transferFrom 130k (Enumerable swap-and-pop で O(1))
