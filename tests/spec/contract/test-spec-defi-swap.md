# test-spec-defi-swap.md

> Layer 1 (`/test-design --layer contract --module defi-swap`) 出力
> 生成元: `examples/defi-swap/contracts/SwapTokens.sol` (実 contract grep 逆算)

## 対象機能

`defi-swap` — minimum ERC-20 (Erc20) と 1:1 swap pool (SimpleSwap)。 TokenA を受け取り TokenB を等量返す pool で、 slippage protection (minOutputAmount) と liquidity check + InsufficientAllowance / InsufficientBalance / SlippageExceeded / InsufficientLiquidity の 4 error。

## 仕様の要約

### 対象 contract

- `Erc20` — minimum ERC-20、 constructor で initialSupply を recipient に mint
- `SimpleSwap` — `swapAforB(amountIn, minOutputAmount)` で 1:1 swap

### API 契約

| 関数 | error |
|---|---|
| `Erc20.transfer(to, value)` | InsufficientBalance |
| `Erc20.transferFrom(from, to, value)` | InsufficientAllowance / InsufficientBalance |
| `Erc20.approve(spender, value)` | — |
| `SimpleSwap.swapAforB(amountIn)` (backward-compat) | InsufficientLiquidity / TransferInFailed |
| `SimpleSwap.swapAforB(amountIn, minOutputAmount)` | InsufficientLiquidity / SlippageExceeded / TransferInFailed / TransferOutFailed |

### 権限モデル

- `transferFrom` — allowance 必要、 不足は InsufficientAllowance
- swap — 全 user 可能、 ただし caller が tokenA を approve 済み必須

### 失敗 mode

- approve なしで transferFrom → InsufficientAllowance
- balance 不足の transfer → InsufficientBalance
- pool に tokenB 残高不足で swap → InsufficientLiquidity
- amountOut < minOutputAmount → SlippageExceeded

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `swapAforB()` | 高 | 高 | 中 | 高 | 低 | swap 経由の資金移動、 reentrancy / slippage 防御必須 |
| `transferFrom()` allowance | 低 | 高 | 中 | 高 | 低 | infinite approval (uint256.max) で allowance 不変仕様 |
| `transfer()` balance | 低 | 中 | 中 | 高 | 低 | 不足時 revert |

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| 単体 | swap / transfer / approve / allowance の正常 + 異常 + 境界 | 正常系 / 異常系 / 境界値 / 状態遷移 / 入力バリデーション |
| 統合 | swap 経由の token migration の full cycle | 正常系 / 状態遷移 |

## テスト観点一覧

- 1. 正常系 — 適用
- 2. 異常系 — 適用 (4 error path)
- 3. 境界値 — 適用 (slippage 直前直後 / liquidity 境界 / infinite approval)
- 4. 状態遷移 — 適用 (allowance / balance / pool liquidity)
- 5. 権限 — 非適用 (admin role なし)
- 6. 入力バリデーション — 非適用 (amount 数値のみ)
- 7. 冪等性 — 非適用
- 8. 並行処理 — 非適用
- 9. 性能 — 非適用
- 10. セキュリティ — 適用 (infinite approval / reentrancy 観点)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | initial supply alice 1000 | to=bob, value=100 | alice.transfer(bob, 100) | alice 900 / bob 100、 Transfer event | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | TC-001 完了 | spender=bob, value=50 | alice.approve(bob, 50) | allowance[alice][bob] == 50、 Approval event | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | tokenA pool に 1000、 alice approve 100 | amountIn=100, minOut=100 | swap.swapAforB(100, 100) | alice tokenB 100、 pool tokenA 100 / tokenB 900、 Swapped event | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-004 | 単体 | 異常系 | approve なし | from=alice, value=100 | bob.transferFrom(alice, bob, 100) | InsufficientAllowance revert | 高 | 推奨 |
| TC-005 | 単体 | 異常系 | balance 50 のみ | to=bob, value=100 | alice.transfer(bob, 100) | InsufficientBalance revert | 高 | 推奨 |
| TC-006 | 単体 | 異常系 | pool tokenB 50 のみ | amountIn=100 | swapAforB(100) | InsufficientLiquidity revert | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-007 | 単体 | 境界値 | TC-003 setup | amountIn=100, minOut=101 | swapAforB(100, 101) | SlippageExceeded revert | 高 | 推奨 |
| TC-008 | 単体 | 境界値 | pool tokenB = amountIn (ちょうど) | amountIn=1000 | swapAforB(1000, 1000) | success、 pool tokenB 0 | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-009 | 単体 | 状態遷移 | infinite approval (max uint256) | from=alice, value=100 | transferFrom 後 allowance 確認 | allowance == max のまま不変 (infinite approval 仕様) | 高 | 推奨 |
| TC-010 | 単体 | 状態遷移 | TC-002 完了、 allowance 50 | from=alice, value=30 | transferFrom 後 allowance 確認 | allowance == 20 (差分減算) | 高 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-011 | 単体 | セキュリティ | swap 後 allowance 確認 | 通常 approval | swap で 100 消費 | tokenA allowance が 100 減 (infinite approval なら不変) | 高 | 推奨 |

## 自動化すべきテスト

- TC-001 〜 TC-011 全 11 件、 全件自動化推奨

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- LP (liquidity provider) 経由の add/remove liquidity API は未定義 (pool に直接 transfer で初期化)
- fee 仕様なし (1:1 fixed rate のみ)
- pause 機能なし
