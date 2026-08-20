# Contract Coverage Report — defi-swap (Foundry)

Generated: 2026-08-20
Skill: /kiwa-forge | Run: round 1 (final)
Loop terminated: production_100_achieved

## 1. 判定サマリ

| metric | production target | Total |
|---|---|---|
| Lines | ✅ 100.00% (40/40) | 83.08% (54/65) |
| Statements | ✅ 100.00% (42/42) | 88.33% (53/60) |
| Branches | ✅ 100.00% (8/8) | 100.00% (10/10) |
| Functions | ✅ 100.00% (7/7) | 75.00% (12/16) |

**判定 — ✅ PASS** (production 4 metric すべて 100%)

Total 側が 100% に届かないのは分母に `contract-test/SwapTokens.t.sol` 自身が入るため。
test file の未実行行は helper と mock の宣言で、 production の到達性とは無関係。

## 2. file 別 coverage 内訳

| File | カテゴリ | Lines | Stmts | Branches | Funcs |
|---|---|---|---|---|---|
| contracts/SwapTokens.sol | production | 100.00% (40/40) | 100.00% (42/42) | 100.00% (8/8) | 100.00% (7/7) |
| contract-test/SwapTokens.t.sol | test 自身 | 56.00% (14/25) | 61.11% (11/18) | 100.00% (2/2) | 55.56% (5/9) |

## 3. 未到達 line の分類と判断

未到達なし。

本 report の作成時点では 1 件残っていた。

| 対象 | 状態 |
|---|---|
| `contracts/SwapTokens.sol:45` の `if (balanceOf[from] < value) revert InsufficientBalance();` | revert 側が未到達 (Branches 87.50% = 7/8) |

`transferFrom` は allowance と残高を別々に検査する。
既存 test は `test_TransferFrom_Reverts_NoApproval` で allowance 側の revert を通していたが、
**allowance を満たした上で残高が足りない** 経路をどの test も通っていなかった。

`test_TransferFrom_Reverts_InsufficientBalance` を追加して塞いだ。
残高 0 の口座を出金元にし、 上限まで許可を与えた第三者から引き落とす形で、
allowance の検査を通過した後に残高の検査へ到達する。

Hardhat 経路の同 branch は既存の TC-022 で到達済。 今回の gap は Foundry 側だけにあった。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| allowance 充足かつ残高不足の `transferFrom` | 異常系 test case 表 | TC 追加 (`transferFrom` の検査が 2 段であることを明示) |

`transferFrom` の検査が 2 段 (allowance → 残高) であることを spec に書いていなかったため、
test 設計時に allowance 側だけを異常系として拾っていた。
検査が 2 つある関数は、 2 つとも独立に失敗させる case を spec 側で並べる。

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227) — 適用結果

`swapAforB` の `TransferInFailed` / `TransferOutFailed` は、 `transfer` が revert せず
`false` を返す ERC20 を必要とする。 Foundry では `.t.sol` 内に mock を直接定義できるため
到達済。 現在の Hardhat config は `./contracts` だけを Solidity source として compile するため、
同じ経路には test 専用 mock を compile 対象へ追加する必要がある。 本 PR の production contract
非変更制約では採らず、 fixture 構成上の runner 差異として contract spec に bullet 追加が要る。

## 5. test 件数サマリ

- `FOUNDRY_OFFLINE=true forge test` PASS: 18 件 (追加 1 件を含む)
- fuzz test: 1 件 (`testFuzz_Swap_Boundary`、 256 runs)
- 主要 gas: swap 106k / transferFrom 78k / transfer 50k
