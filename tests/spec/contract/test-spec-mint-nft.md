# test-spec-mint-nft.md

> Layer 1 (`/test-design --layer contract --module mint-nft`) 出力
> 生成元: `examples/mint-nft/contracts/MintNft.sol` (実 contract grep 逆算)

## 対象機能

`mint-nft` — OpenZeppelin 非依存の minimum ERC-721 + ERC-721 Enumerable + ERC-2981 royalty 実装。 `mint(to)` で 1 枚 mint、 `batchMint(to, count)` で batch、 max supply = 10、 royalty = 5% (500 bps)、 totalSupply 単調増加で tokenId = totalSupply + 1。

## 仕様の要約

### API 契約

| 関数 | 引数 | 戻り | error |
|---|---|---|---|
| `mint(to)` | `[address]` | `tokenId` | InvalidRecipient (to=0) / MaxSupplyReached |
| `batchMint(to, count)` | `[address, uint256]` | `uint256[]` | InvalidRecipient / MaxSupplyReached |
| `transferFrom(from, to, tokenId)` | `[address, address, uint256]` | — | NotOwner / InvalidRecipient |
| `safeTransferFrom(from, to, tokenId)` | `[address, address, uint256]` | — | NotOwner / InvalidRecipient / UnsafeRecipient |
| `approve(to, tokenId)` | `[address, uint256]` | — | NotOwner |
| `royaltyInfo(_, salePrice)` | `[uint256, uint256]` | `(receiver, royaltyAmount)` | — |
| `supportsInterface(id)` | `[bytes4]` | `bool` | — |
| `tokenOfOwnerByIndex(owner, idx)` | `[address, uint256]` | `tokenId` | OwnerIndexOutOfBounds |

### 権限モデル

- `mint` / `batchMint` — 全 user 可能
- `transferFrom` / `safeTransferFrom` — owner / approved / operator のみ
- `approve` — token owner または operator
- royaltyReceiver は constructor で deployer 固定 (immutable)

### 失敗 mode

- to = address(0) → InvalidRecipient
- totalSupply == MAX_SUPPLY (10) → MaxSupplyReached
- 非 owner / 非 approved の transfer → NotOwner
- safeTransfer 先 contract で onERC721Received 返却値不正 → UnsafeRecipient

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `mint()` / `batchMint()` | 高 | 高 | 中 | 高 | 低 | NFT 発行収益、 access bypass で free mint 可能 |
| `transferFrom()` | 低 | 高 | 高 | 高 | 低 | 不可逆 write、 owner check 必須 |
| `safeTransferFrom()` | 低 | 高 | 高 | 中 | 低 | onERC721Received callback で reentrancy 可能性 |
| `approve()` / `setApprovalForAll()` | 低 | 高 | 中 | 中 | 低 | approval bypass で transfer 可能 |
| `royaltyInfo()` | 中 | 低 | 低 | 中 | 低 | 二次流通の royalty 受取、 計算 bug で取り逃し |

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| 単体 | mint / transfer / approve / royalty の正常 + 異常 + 境界 | 正常系 / 異常系 / 境界値 / 状態遷移 / 権限 |
| 統合 | mint + transfer chain での enumerable index 整合 | 正常系 / 状態遷移 |
| E2E | UI → wallet → mint → balance 表示 | (既存 spec.ts でカバー) |

## テスト観点一覧

- 1. 正常系 — 適用
- 2. 異常系 — 適用 (revert path 多数)
- 3. 境界値 — 適用 (MAX_SUPPLY 直前 / ちょうど / 超過)
- 4. 状態遷移 — 適用 (totalSupply / balanceOf / ownerOf / approval / enumerable)
- 5. 権限 — 適用 (owner / approved / operator)
- 6. 入力バリデーション — 非適用 (address は ERC-20 calldata 検証なし)
- 7. 冪等性 — 非適用 (mint は単調増加で idempotent 要件なし)
- 8. 並行処理 — 非適用 (anvil ordering)
- 9. 性能 — 非適用 (gas budget 余裕)
- 10. セキュリティ — 適用 (safeTransferFrom callback / approval bypass / royalty 計算)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | (なし) | to = alice | mint(alice) | tokenId == 1、 balanceOf(alice) == 1、 ownerOf(1) == alice、 Transfer(0, alice, 1) emit | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | TC-001 完了 | to = alice、 count = 3 | batchMint(alice, 3) | tokenIds == [2,3,4]、 balanceOf(alice) == 4 | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | TC-001 完了 | salePrice = 1 ether | royaltyInfo(1, 1 ether) | receiver == deployer、 royaltyAmount == 0.05 ether | 高 | 推奨 |
| TC-004 | 単体 | 正常系 | TC-001 完了、 from=alice、 to=bob、 tokenId=1 | (なし) | vm.prank(alice) transferFrom(alice, bob, 1) | ownerOf(1) == bob、 balanceOf(alice) == 0、 balanceOf(bob) == 1 | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-005 | 単体 | 異常系 | (なし) | to = address(0) | mint(address(0)) | InvalidRecipient revert | 高 | 推奨 |
| TC-006 | 単体 | 異常系 | TC-001 完了、 非 owner | (なし) | vm.prank(bob) transferFrom(alice, bob, 1) | NotOwner revert | 高 | 推奨 |
| TC-007 | 単体 | 異常系 | TC-001 完了 | to = address(0) | vm.prank(alice) transferFrom(alice, 0, 1) | InvalidRecipient revert | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-008 | 単体 | 境界値 | MAX_SUPPLY = 10 | to = alice、 count = 10 | batchMint(alice, 10) | success、 totalSupply == 10 | 高 | 推奨 |
| TC-009 | 単体 | 境界値 | TC-008 完了 | to = alice | mint(alice) | MaxSupplyReached(10) revert | 高 | 推奨 |
| TC-010 | 単体 | 境界値 | totalSupply = 0 | to = alice、 count = 11 | batchMint(alice, 11) | MaxSupplyReached(10) revert | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-011 | 単体 | 状態遷移 | TC-002 完了 (alice 4 枚) | (なし) | tokenOfOwnerByIndex(alice, 0..3) | 順に [1, 2, 3, 4] | 高 | 推奨 |
| TC-012 | 単体 | 状態遷移 | TC-011 + transfer 後 | tokenId = 2 を bob へ transfer | tokenOfOwnerByIndex(alice, 0..2) | enumerable index swap で順序 reorder | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-013 | 単体 | 権限 | TC-001 完了 | alice が bob に approve | approve(bob, 1) → vm.prank(bob) transferFrom | bob が owner で transferFrom 成功、 ownerOf(1) == bob (new owner) | 高 | 推奨 |
| TC-014 | 単体 | 権限 | TC-001 完了 | alice が operator として carol を setApprovalForAll | setApprovalForAll(carol, true) → vm.prank(carol) transferFrom | carol も transferFrom 可能、 isApprovedForAll(alice, carol) == true | 高 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-015 | 単体 | セキュリティ | TC-001 完了、 to = EOA address | (なし) | safeTransferFrom(alice, bob, 1) | bob が EOA なので code.length == 0 で callback skip、 success | 中 | 推奨 |
| TC-016 | 単体 | セキュリティ | supportsInterface 確認 | (なし) | supportsInterface(0x80ac58cd) / (0x2a55205a) | 両方 true (ERC721 + ERC2981) | 中 | 推奨 |

## 自動化すべきテスト

- TC-001 〜 TC-016 全 16 件 (高 14 件 / 中 2 件)、 全件自動化推奨

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- royaltyReceiver の更新メカニズム (現状 immutable で deployer 固定)
- pause 機能の有無
- max supply 拡張の可否 (constant 定義で拡張不可)
