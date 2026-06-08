# test-spec-mint-nft.ja.md (contract)

> Layer 1 (`/kiwa-design --layer contract`) 出力 — Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat`) が消費する仕様書

## 対象機能

`mint-nft` — ERC-721 完全準拠 + ERC-2981 royalty + ERC-721 Enumerable + safe transfer + ERC721Receiver check を最小実装で備える NFT contract。 OpenZeppelin 非依存で bytecode を小さく保つ kiwa example の代表 contract。

対象 file。

- `examples/mint-nft/contracts/MintNft.sol` — 単一 contract (約 200 行)

対象 function / event / error の一覧。

| symbol | kind |
|---|---|
| `mint(address to)` | function |
| `batchMint(address to, uint256 count)` | function |
| `transferFrom(address from, address to, uint256 tokenId)` | function |
| `safeTransferFrom(address from, address to, uint256 tokenId)` | function (2 overload) |
| `approve(address to, uint256 tokenId)` | function |
| `setApprovalForAll(address operator, bool approved)` | function |
| `balanceOf(address owner)` | view function |
| `ownerOf(uint256 tokenId)` | view function |
| `tokenOfOwnerByIndex(address, uint256)` | view function |
| `tokenByIndex(uint256)` | view function |
| `getApproved(uint256)` | view function |
| `isApprovedForAll(address, address)` | view function |
| `supportsInterface(bytes4)` | pure function |
| `royaltyInfo(uint256, uint256)` | view function (IERC2981) |
| `Transfer(from, to, tokenId)` | event |
| `Approval(owner, approved, tokenId)` | event |
| `ApprovalForAll(owner, operator, approved)` | event |
| `NotOwner()` | error |
| `AlreadyMinted()` | error |
| `InvalidRecipient()` | error |
| `MaxSupplyReached(uint256)` | error (with param) |
| `OwnerIndexOutOfBounds()` | error |
| `TokenIndexOutOfBounds()` | error |
| `UnsafeRecipient()` | error |
| `MAX_SUPPLY` | constant uint256 (= 10) |
| `ROYALTY_BPS` | constant uint96 (= 500) |
| `royaltyReceiver` | immutable address (= constructor msg.sender) |

## 仕様の要約

### ユーザー操作

- mint(to) で 1 個 NFT を to に発行 (tokenId は totalSupply+1)
- batchMint(to, count) で N 個まとめて mint
- approve / setApprovalForAll で transfer 権限委譲
- transferFrom / safeTransferFrom で所有権移転
- supportsInterface で ERC165/721/Enumerable/2981 の対応確認
- royaltyInfo で sale price から royalty を 5% (500 bps) で算出

### API 契約 (HTTP / RPC)

(該当なし、 contract 直接呼出のみ)

### DB / State 更新

| state | 触れる variable | tx 境界 |
|---|---|---|
| 所有 | `_owners[tokenId]` / `_balances[owner]` / `totalSupply` | mint / transferFrom 1 tx |
| Enumerable | `_ownedTokens[owner][index]` / `_ownedTokensIndex[tokenId]` | mint / transferFrom で追加 / 削除 |
| Approval | `_tokenApprovals[tokenId]` | approve / transferFrom 後 delete |
| Operator | `_operatorApprovals[owner][operator]` | setApprovalForAll |

### 権限モデル

- 誰でも — mint() / batchMint() / view 関数全般
- 所有者 or 承認済 — transferFrom / safeTransferFrom (`from == msg.sender` or `_tokenApprovals[tokenId] == msg.sender` or `_operatorApprovals[from][msg.sender]`)
- 所有者 or operator — approve()

#### kiwa fixture inject 前提 (e2e layer のみ、 改善 2 / Issue #226)

(該当なし、 contract test に wallet inject 概念なし)

### 外部連携

- IERC2981 / IERC721Receiver interface を内部定義 (外部 contract に依存しない、 但し safeTransferFrom で受信側 contract の onERC721Received を try/catch 呼出)

### 失敗 mode

- mint() — `to == address(0)` → InvalidRecipient / `totalSupply == MAX_SUPPLY` で次回 mint → MaxSupplyReached / `_owners[tokenId] != 0` → AlreadyMinted (実際は totalSupply++ で重複しないが、 storage 直書き等で起こす実装防御)
- transferFrom() — `_owners[tokenId] != from` → NotOwner / msg.sender が owner/approved/operator のいずれでもない → NotOwner / `to == address(0)` → InvalidRecipient
- safeTransferFrom() — transferFrom と同じ revert 経路 + 受信 contract が `onERC721Received` を返さない → UnsafeRecipient
- approve() — msg.sender が owner でも operator でもない → NotOwner
- tokenOfOwnerByIndex() — `index >= _balances[owner]` → OwnerIndexOutOfBounds
- tokenByIndex() — `index >= totalSupply` → TokenIndexOutOfBounds
- batchMint() — `count > MAX_SUPPLY - totalSupply` → MaxSupplyReached / `to == 0` → InvalidRecipient

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `mint()` / `batchMint()` | 低 | 中 | 中 | 高 | 低 | mint fee なし、 MAX_SUPPLY=10 で意図的制限、 不可逆 state 変更 |
| `transferFrom()` / `safeTransferFrom()` | 低 | 高 | 高 | 中 | 低 | unauthorized transfer、 不可逆、 approval 権限管理が複雑 |
| `approve()` / `setApprovalForAll()` | 低 | 高 | 中 | 中 | 低 | 過剰 approve で wallet drain attack |
| `royaltyInfo()` | 中 | 中 | 低 | 中 | 低 | 売上計算ロジック、 計算誤りで royalty 流失 |
| `supportsInterface()` | 低 | 低 | 低 | 高 | 低 | wallet / marketplace の整合性確認 |
| Enumerable internal (`_addTokenToOwnerEnumeration` 等) | 低 | 中 | 高 | 中 | 低 | swap-and-pop logic の正確性、 不整合で tokenOfOwnerByIndex 破綻 |

**総合リスク = 高** (transferFrom / approve の security 高、 Enumerable のデータ破壊リスク高)

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| 単体 | 各 function の input / output / revert | 正常系 / 異常系 / 境界値 / 入力バリデーション / 権限 |
| 統合 | mint → transfer → batchMint の連携、 Enumerable 整合 | 状態遷移 / 並行処理 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用
- 2. 異常系 — 適用 (revert 経路 7 種)
- 3. 境界値 — 適用 (MAX_SUPPLY=10、 batchMint count 境界)
- 4. 状態遷移 — 適用 (mint → Enumerable index 更新 / transfer → swap-and-pop)
- 5. 権限 — 適用 (transferFrom の 3 経路、 approve の 2 経路)
- 6. 入力バリデーション — 適用 (zero address、 negative-like count)
- 7. 冪等性 — 適用 (mint は新 tokenId 発行で非冪等、 approve は上書き)
- 8. 並行処理 — 適用 (同 block 内 mint 競合、 transferFrom race)
- 9. 性能 — 適用 (batchMint の gas、 Enumerable の O(1) 確認)
- 10. セキュリティ — 適用 (royaltyReceiver の不変性、 safeTransferFrom の reentrancy 経路)
- 11. 回帰 — 非適用 (新規 contract)

## テストケース一覧

総合リスク=高なので各観点 3 TC 以上を確保 (PR #230 改善 5 enforce)。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | (なし) | to=alice | mint(alice) | tokenId=1、 ownerOf(1)=alice、 balanceOf(alice)=1、 totalSupply=1、 Transfer(0, alice, 1) emit | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | NFT 1 個 (alice 所有) | from=alice, to=bob, tokenId=1 | alice が transferFrom | ownerOf(1)=bob、 balanceOf(alice)=0、 balanceOf(bob)=1 | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | (なし) | to=alice, count=3 | batchMint(alice, 3) | tokenIds=[1,2,3]、 totalSupply=3、 Transfer 3 回 emit | 高 | 推奨 |
| TC-004 | 単体 | 正常系 | (なし) | (なし) | royaltyInfo(1, 1 ether) | receiver=deployer、 royaltyAmount=0.05 ether (500 bps = 5%) | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-005 | 単体 | 異常系 | (なし) | to=0 | mint(address(0)) | InvalidRecipient revert | 高 | 推奨 |
| TC-006 | 単体 | 異常系 | totalSupply=10 (max) | to=alice | mint(alice) | MaxSupplyReached(10) revert | 高 | 推奨 |
| TC-007 | 単体 | 異常系 | NFT 1 個 (alice 所有) | from=bob, to=charlie, tokenId=1 | bob が transferFrom | NotOwner revert | 高 | 推奨 |
| TC-008 | 単体 | 異常系 | NFT 1 個 (alice 所有) | to=0, tokenId=1 | alice が transferFrom(alice, 0, 1) | InvalidRecipient revert | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-009 | 単体 | 境界値 | (なし) | count=10 | batchMint(alice, 10) | 10 個全 mint、 totalSupply=10、 11 個目は MaxSupplyReached | 高 | 推奨 |
| TC-010 | 単体 | 境界値 | totalSupply=5 | count=6 | batchMint(alice, 6) | MaxSupplyReached(10) revert (5+6 > 10) | 高 | 推奨 |
| TC-011 | 単体 | 境界値 | totalSupply=5 | count=5 | batchMint(alice, 5) | 5 個 mint success、 totalSupply=10 | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-012 | 統合 | 状態遷移 | alice 3 個 mint 済 | from=alice, to=bob, tokenId=2 | alice が transferFrom(alice, bob, 2) | tokenOfOwnerByIndex(alice, 0/1) で残り tokenId 確認、 swap-and-pop で順序保証 | 高 | 推奨 |
| TC-013 | 統合 | 状態遷移 | (なし) | (なし) | mint 10 回 → tokenByIndex(0..9) 確認 | 各 index で tokenId=index+1、 totalSupply=10 | 高 | 推奨 |
| TC-014 | 統合 | 状態遷移 | alice 1 個 mint、 approve(bob) 済 | bob が transferFrom(alice, charlie, 1) | bob 経由で transferFrom | ownerOf(1)=charlie、 approval delete (getApproved(1)=0) | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-015 | 単体 | 権限 | alice 1 個 mint | charlie が approve(charlie, 1) | unauthorized approve | NotOwner revert | 高 | 推奨 |
| TC-016 | 単体 | 権限 | alice 1 個 mint、 setApprovalForAll(operator, true) 済 | operator が approve(other, 1) | operator から approve | success (operator 権限で approve 可能)、 Approval emit | 高 | 推奨 |
| TC-017 | 単体 | 権限 | alice 1 個 mint、 setApprovalForAll(operator, true) 済 | operator が transferFrom(alice, bob, 1) | operator 経由 transfer | success、 ownerOf(1)=bob | 高 | 推奨 |

### 観点 6: 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-018 | 単体 | 入力バリデーション | (なし) | to=0, count=5 | batchMint(0, 5) | InvalidRecipient revert | 高 | 推奨 |
| TC-019 | 単体 | 入力バリデーション | (なし) | (なし) | ownerOf(999) (存在しない) | "ERC721: nonexistent" require revert | 中 | 推奨 |
| TC-020 | 単体 | 入力バリデーション | balanceOf(alice)=2 | owner=alice, index=2 | tokenOfOwnerByIndex(alice, 2) | OwnerIndexOutOfBounds revert | 中 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-021 | 単体 | 冪等性 | (なし) | (なし) | mint(alice) 3 回連続 | 新 tokenId 1/2/3 で非冪等、 totalSupply=3 | 中 | 推奨 |
| TC-022 | 単体 | 冪等性 | alice 1 個 mint | approve(bob, 1) 2 回 | 2 回目 approve | 上書き、 getApproved(1)=bob (変化なし)、 Approval emit 2 回 | 中 | 推奨 |
| TC-023 | 単体 | 冪等性 | (なし) | (なし) | setApprovalForAll(operator, true) → 再度 (operator, false) | _operatorApprovals 上書き、 isApprovedForAll false | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-024 | 統合 | 並行処理 | (なし) | (なし) | alice / bob が同 block で mint | tokenId 1 / 2 が異なる user に、 totalSupply=2 | 中 | 推奨 |
| TC-025 | 統合 | 並行処理 | alice 1 個 mint、 approve(bob) 済 | bob と alice が同 tokenId に transferFrom 試行 | tx ordering で 1 人 success、 1 人 NotOwner | order に応じた結果 | 中 | 推奨 |
| TC-026 | 統合 | 並行処理 | (なし) | count=5 と count=6 を 2 user が同 block で batchMint | totalSupply=10 で 1 人 MaxSupplyReached | order で先勝ち、 後者 revert | 低 | 推奨 |

### 観点 9: 性能

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-027 | 単体 | 性能 | (なし) | count=10 | batchMint(alice, 10) gas 測定 | gas < 1M (10 mint で 1M gas 以下を目安) | 中 | 推奨 |
| TC-028 | 単体 | 性能 | alice 10 個 mint 済 | (なし) | tokenOfOwnerByIndex(alice, 0..9) を 10 回 | 各 call < 30k gas (view) | 中 | 推奨 |
| TC-029 | 単体 | 性能 | alice 5 個 mint 済 | from=alice, to=bob, tokenId=3 | transferFrom + tokenOfOwnerByIndex 再 enumerate | swap-and-pop O(1) で gas 一定 | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-030 | 単体 | セキュリティ | (なし) | (なし) | royaltyReceiver の不変性 — constructor 後の変更経路がないことを確認 | royaltyReceiver = deployer で固定、 変更 API なし | 高 | 推奨 |
| TC-031 | 単体 | セキュリティ | (受信側 contract が onERC721Received で間違った selector return) | from=alice, to=mock, tokenId=1 | safeTransferFrom(alice, mock, 1) | UnsafeRecipient revert | 高 | 推奨 |
| TC-032 | 単体 | セキュリティ | (受信側 EOA address) | from=alice, to=eoa, tokenId=1 | safeTransferFrom(alice, eoa, 1) | success (EOA は code.length == 0 で onERC721Received check skip) | 高 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-001..004 (高、 正常系)
- TC-005..008 (高、 異常系)
- TC-009..011 (高、 境界値)
- TC-012..014 (高、 状態遷移)
- TC-015..017 (高、 権限)
- TC-018 (高、 入力バリデーション)
- TC-030..032 (高、 セキュリティ)
- TC-019, 020 (中、 入力バリデーション)
- TC-021..023 (中、 冪等性)
- TC-024, 025 (中、 並行処理)
- TC-027..029 (中、 性能)
- TC-026 (低、 並行処理)

## 手動確認でよいテスト

(なし) — 全 TC が automatable (Foundry / Hardhat の決定論的環境で再現可能)。

## 不足している仕様

- `royaltyInfo` の tokenId 引数を無視している (`royaltyInfo(uint256, salePrice)` で第一引数 unused) — global royalty 設計が意図的か仕様確認
- `setApprovalForAll` で operator=msg.sender でも禁止していない (self-approval) — ERC-721 標準的にも許容なので OK だが、 spec 上に明示推奨
- `safeTransferFrom` 内の `_checkOnERC721Received` で `try/catch` の error data 廃棄 (revert reason が失われる) — debug 容易性のため preserve 検討余地
- MAX_SUPPLY=10 は example 固定値、 production 化時に config 化必要
- ERC-4906 (MetadataUpdate) 非対応、 OpenSea 等の metadata refresh 経路なし

### runner 差異 (Foundry / Hardhat の制約) bullet

- `MintNft.sol L190-195 _checkOnERC721Received の try/catch branch` は Foundry 側 `RevertingReceiver` / `BadReceiver` deployed mock で 100% cover、 Hardhat 側は inline mock 定義制約により未踏 (許容、 別 .sol file 追加 or hardhat-toolbox mock 機構で改善余地あり)

## Layer 2 連携

```text
/kiwa-forge --module mint-nft --gas-report --lang ja
/kiwa-hardhat --module mint-nft --gas-report --lang ja
```
