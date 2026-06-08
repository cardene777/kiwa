# test-spec-nft-marketplace.md

> Layer 1 (`/kiwa-design`) 出力 — Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat`) が消費する仕様書

## 対象機能

`nft-marketplace` — ERC-721 互換 NFT (`MarketNft`) と固定価格 listing / オファー方式の二経路を持つ marketplace (`SimpleMarketplace`) を提供する。 marketplace は購入時に ERC-2981 royalty を seller proceeds から差し引いて royalty receiver に送金する。

対象 file:

- `contracts/MarketNft.sol` (ERC-721 + ERC-2981 を最小実装した NFT)
- `contracts/SimpleMarketplace.sol` (listing / offer 二経路 marketplace、 royalty 自動清算)

## 仕様の要約

### ユーザー操作

- NFT owner が `mint(to)` で新規 tokenId を発行する (誰でも mint 可、 access control なし)。
- NFT owner が `approve(marketplace, tokenId)` 後 `list(tokenId, price)` で listing を作成する。
- 任意の buyer が `buy(tokenId)` (alias `buyNft`) を payable で呼んで NFT を購入する (差額は refund)。
- listing seller が `cancel(tokenId)` で listing を撤回する。
- buyer が `makeOffer(tokenId, amount)` または `makeOffer(tokenId, amount, deadline)` を payable で呼びオファーする (ETH 預託)。
- buyer が `cancelOffer(offerId)` でオファーを撤回 + ETH refund を受ける。
- NFT owner が `acceptOffer(offerId)` でオファーを受諾 → NFT 移転 + ETH 清算 + 同 tokenId の他オファー全 refund + 既存 listing 自動 cancel。

### API 契約 (HTTP / RPC)

contract 直接 call のため HTTP API は未定義。 RPC `eth_call` / `eth_sendTransaction` 経由で以下 function を呼ぶ。

| Contract | Function | Args | Return / Payable |
|---|---|---|---|
| MarketNft | `mint(address to)` | to | `uint256 tokenId` |
| MarketNft | `approve(address to, uint256 tokenId)` | to, tokenId | void |
| MarketNft | `setApprovalForAll(address operator, bool approved)` | operator, approved | void |
| MarketNft | `transferFrom(address from, address to, uint256 tokenId)` | from, to, tokenId | void |
| MarketNft | `safeTransferFrom(address from, address to, uint256 tokenId)` | from, to, tokenId | void |
| MarketNft | `safeTransferFrom(address from, address to, uint256 tokenId, bytes data)` | from, to, tokenId, data | void |
| MarketNft | `royaltyInfo(uint256, uint256 salePrice)` | tokenId (未使用), salePrice | (receiver, royaltyAmount = salePrice * 500 / 10000) |
| MarketNft | `supportsInterface(bytes4 id)` | id | bool (ERC165 / ERC721 / ERC721Metadata / ERC2981) |
| SimpleMarketplace | `list(uint256 tokenId, uint256 price)` | tokenId, price | void |
| SimpleMarketplace | `buy(uint256 tokenId)` | tokenId | payable、 差額 refund |
| SimpleMarketplace | `buyNft(uint256 tokenId)` | tokenId | payable (`buy` の alias) |
| SimpleMarketplace | `cancel(uint256 tokenId)` | tokenId | void |
| SimpleMarketplace | `makeOffer(uint256 tokenId, uint256 amount)` | tokenId, amount | payable (msg.value == amount)、 deadline = type(uint256).max |
| SimpleMarketplace | `makeOffer(uint256 tokenId, uint256 amount, uint256 deadline)` | tokenId, amount, deadline | payable (msg.value == amount) |
| SimpleMarketplace | `cancelOffer(uint256 offerId)` | offerId | void (buyer へ refund) |
| SimpleMarketplace | `acceptOffer(uint256 offerId)` | offerId | void (NFT 移転 + 清算 + 他オファー refund) |
| SimpleMarketplace | `isOfferActive(uint256 offerId)` | offerId | bool |

### DB / State 更新

| State | 触れる slot | tx 境界 |
|---|---|---|
| `MarketNft.ownerOf[tokenId]` | mint / transfer 時 | 1 tx 内で更新 |
| `MarketNft.balanceOf[addr]` | mint / transfer 時 | 1 tx 内で更新 |
| `MarketNft.getApproved[tokenId]` | approve / transfer 時 (transfer で delete) | 1 tx 内で更新 |
| `MarketNft.isApprovedForAll[owner][op]` | setApprovalForAll 時 | 1 tx 内で更新 |
| `MarketNft.totalSupply` | mint 時 | 1 tx 内で +1 |
| `SimpleMarketplace.listings[tokenId]` | list / cancel / buy / acceptOffer 時 | 1 tx 内で seed/delete |
| `SimpleMarketplace.offers[offerId]` | makeOffer / cancelOffer / acceptOffer / _invalidateOffersForToken 時 | 1 tx 内で seed/delete |
| `SimpleMarketplace.offersByToken[tokenId]` | makeOffer (push) / buy / acceptOffer (delete) 時 | 1 tx 内で更新 |
| `SimpleMarketplace.nextOfferId` | makeOffer 時 | 1 tx 内で ++ |
| ETH 残高 (contract / buyer / seller / royalty receiver) | buy / cancelOffer / acceptOffer 時 | 同 tx 内で複数 transfer (`call{value: ...}`) |

### 権限モデル

- `MarketNft.mint(to)` — 誰でも呼べる (access control 一切なし、 owner / minter role なし)。
- `MarketNft.approve(to, tokenId)` — `ownerOf[tokenId]` または `isApprovedForAll[owner][caller]` のみ。
- `MarketNft.setApprovalForAll(op, approved)` — msg.sender 本人のみ (自分の operator 設定)。
- `MarketNft._transfer` — from が ownerOf と一致 + (msg.sender == from || getApproved[tokenId] == msg.sender || isApprovedForAll[from][msg.sender]) のみ。
- `SimpleMarketplace.list` — `nft.ownerOf(tokenId) == msg.sender` かつ `nft.getApproved(tokenId) == marketplace` (operator approval は許容しない)。
- `SimpleMarketplace.cancel` — `listings[tokenId].seller == msg.sender` のみ。
- `SimpleMarketplace.cancelOffer` — `offers[offerId].buyer == msg.sender` のみ。
- `SimpleMarketplace.acceptOffer` — 受諾時点で `nft.ownerOf(offer.tokenId) == msg.sender` かつ `nft.getApproved(offer.tokenId) == marketplace` のみ (元 lister と現 owner の不一致を許容)。

### 外部連携

- ERC-721 receiver — `safeTransferFrom` で contract 受領時 `onERC721Received` selector を検証 (return value 不一致 / try-catch 失敗で `UnsafeRecipient` revert)。
- ERC-2981 royalty — marketplace は `nft.royaltyInfo(tokenId, salePrice)` を `try/catch` で呼ぶ、 catch 時は royalty 0 として seller に全額。
- ETH transfer — `(bool ok, ) = addr.call{value: ...}("")` 経路、 失敗で `PaymentFailed` revert (royalty / seller / refund 全てに適用)。
- blockchain RPC — anvil / hardhat node に対する eth_sendTransaction / eth_call。

### 失敗 mode

- `safeTransferFrom` の receiver 拒否 → `UnsafeRecipient` で revert (state 巻き戻し)。
- buy の payment 不足 (`msg.value < l.price`) → `InsufficientPayment` revert、 state 変更なし。
- list 時の operator approval 不足 → `NotApproved` revert (operator approval は不可、 getApproved による explicit approve 必須)。
- makeOffer の `msg.value != amount` → `OfferPaymentMismatch` revert。
- makeOffer の `amount == 0` → `InvalidOfferAmount` revert。
- makeOffer の `deadline <= block.timestamp` → `InvalidDeadline` revert (3 引数版のみ、 2 引数版は max uint256 で常に valid)。
- acceptOffer の deadline 超過 → `OfferExpired` revert (受諾時に block.timestamp と比較)。
- acceptOffer / cancelOffer の inactive offer → `OfferNotActive` revert。
- ETH transfer 失敗 (receiver fallback revert) → `PaymentFailed` revert で **tx 全体を巻き戻し** (オファー一括 refund 中の 1 件失敗で全 refund 巻き戻し、 部分清算なし)。
- listing 重複 → `AlreadyListed` revert (active な listing がある間は再 list 不可)。
- partial state からの復旧 — solidity revert で全 state 巻き戻し、 復旧不要 (atomic)。
- idempotency key 設計 — nonce / event_id 等は未使用 (tokenId / offerId の uniqueness のみで担保)。

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `MarketNft.mint` | 中 | 高 | 中 | 高 | 低 | access control なし、 誰でも mint 可で需給操作可能 |
| `MarketNft._transfer` | 低 | 高 | 高 | 高 | 低 | owner / approval 検証経路、 不可逆 write |
| `MarketNft.safeTransferFrom` | 低 | 高 | 高 | 中 | 低 | receiver hook で外部呼出 (reentrancy 面) |
| `MarketNft.royaltyInfo` | 高 | 中 | 低 | 高 | 低 | 売上分配の計算ロジック、 整数除算精度 |
| `SimpleMarketplace.list` | 高 | 高 | 低 | 高 | 低 | 主要販売経路、 owner + approve 検証 |
| `SimpleMarketplace.buy` (`buyNft` alias) | 高 | 高 | 中 | 高 | 低 | 主要収益、 ETH 多段送金 + refund 経路 |
| `SimpleMarketplace.makeOffer` | 高 | 中 | 中 | 高 | 低 | ETH 預託、 deadline 管理 |
| `SimpleMarketplace.cancelOffer` | 中 | 中 | 中 | 中 | 低 | refund 経路、 reentrancy リスク |
| `SimpleMarketplace.acceptOffer` | 高 | 高 | 高 | 中 | 低 | NFT 移転 + 清算 + 他オファー一括 refund (最も複雑) |
| `_invalidateOffersForToken` | 中 | 高 | 高 | 高 | 低 | ループ内 ETH 送金、 1 件失敗で全巻戻し |
| `_payoutWithRoyalty` | 高 | 中 | 中 | 高 | 低 | royalty 計算 + ETH 送金順序 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 (forge / hardhat) | 各 function 単独の正常 / 異常 / 境界、 access control、 state 更新を網羅 | 正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / セキュリティ |
| 統合 (forge fork or hardhat) | 複数 function 連鎖 (mint → approve → list → buy)、 marketplace ↔ NFT 連携、 royalty 清算 | 正常系 / 異常系 / 状態遷移 / 並行処理 / セキュリティ |
| E2E (本仕様の対象外) | UI / wallet 経由の主要導線 (本仕様は contract 層のみ、 E2E は別 `/kiwa-design --layer e2e` で設計) | (本仕様は対象外) |

## テスト観点一覧

`docs/SKILL-DESIGN.md` § Step 3 の 10 観点から選択。

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (RPC エラー / receiver revert / payment failure)
- 3. 境界値 — 適用 (price = 0 / 1 / max、 deadline = now / now+1 / max uint256、 royalty 端数、 amount 重複)
- 4. 状態遷移 — 適用 (listing active ↔ inactive、 offer active → expired/accepted/cancelled、 acceptOffer 時の listing 連動 cancel)
- 5. 権限 — 適用 (mint は無権限許容、 approve / list / cancel / acceptOffer / cancelOffer の caller 検証)
- 6. 入力バリデーション — 適用 (zero address、 amount == 0、 deadline 過去、 msg.value 不一致)
- 7. 冪等性 — 適用 (重複 list、 同一 offerId 二重 accept、 二重 cancel)
- 8. 並行処理 — 適用 (同 tokenId 同時 buy / acceptOffer 競合、 list 直後の transfer による listing 残存)
- 9. 性能 — 適用 (大量 offers の一括 refund gas、 acceptOffer の最悪計算量)
- 10. セキュリティ — 適用 (reentrancy 経路、 royalty receiver 悪意挙動、 ETH 受領拒否 receiver、 ERC721Receiver 偽 selector)

## テストケース一覧

観点別グループ、 グループ内は優先度 (高 → 中 → 低) 順。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | royaltyReceiver 設定済の MarketNft deploy 後 | alice (EOA) | `mint(alice)` 1 回 | tokenId=1、 ownerOf[1]==alice、 balanceOf[alice]==1、 totalSupply==1、 Transfer(0, alice, 1) emit | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | tokenId=1 を alice が保有 | bob (EOA)、 tokenId=1 | `vm.prank(alice); approve(bob, 1)` | getApproved[1]==bob、 Approval(alice, bob, 1) emit | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | alice が tokenId=1 保有 + bob が approved | from=alice, to=carol, tokenId=1 | `vm.prank(bob); transferFrom(alice, carol, 1)` | ownerOf[1]==carol、 balanceOf 更新、 getApproved[1]==0 (delete)、 Transfer emit | 高 | 推奨 |
| TC-004 | 単体 | 正常系 | alice が tokenId=1 保有、 EOA carol | from=alice, to=carol, tokenId=1 | `vm.prank(alice); safeTransferFrom(alice, carol, 1)` | EOA は hook 呼ばずに success、 ownerOf 更新 | 高 | 推奨 |
| TC-005 | 単体 | 正常系 | alice 保有 + 正規 ERC721Receiver contract receiver deploy | from=alice, to=receiver, tokenId=1 | `safeTransferFrom(alice, receiver, 1, "data")` | `onERC721Received` 呼出 + selector 一致で success、 ownerOf=receiver | 高 | 推奨 |
| TC-006 | 単体 | 正常系 | MarketNft deploy 済 | royaltyInfo(任意 tokenId, salePrice=10000) | `royaltyInfo(1, 10000)` view | receiver==royaltyReceiver、 royaltyAmount==500 (5%) | 高 | 推奨 |
| TC-007 | 単体 | 正常系 | MarketNft deploy 済 | ERC165 / ERC721 / ERC721Metadata / ERC2981 各 interfaceId | `supportsInterface(id)` view | 全て true return | 高 | 推奨 |
| TC-008 | 統合 | 正常系 | alice mint + marketplace を approve 済 | tokenId=1, price=1 ether | `vm.prank(alice); list(1, 1 ether)` | listings[1] = (alice, 1e18, true)、 Listed emit | 高 | 推奨 |
| TC-009 | 統合 | 正常系 | TC-008 後、 bob 残高 2 ether | tokenId=1, msg.value=1 ether | `vm.prank(bob); buy{value: 1 ether}(1)` | ownerOf=bob、 listings[1] cleared、 alice 受領 0.95 ether、 royaltyReceiver 受領 0.05 ether、 Bought emit | 高 | 推奨 |
| TC-010 | 統合 | 正常系 | TC-008 後、 buyNft alias を使用 | tokenId=1, msg.value=1 ether | `vm.prank(bob); buyNft{value: 1 ether}(1)` | buy と完全同一挙動 (alias 確認) | 高 | 推奨 |
| TC-011 | 統合 | 正常系 | TC-008 後 | tokenId=1 | `vm.prank(alice); cancel(1)` | listings[1].active==false、 Cancelled emit | 高 | 推奨 |
| TC-012 | 統合 | 正常系 | mint 済、 marketplace 未 approve | tokenId=1, amount=0.5 ether | `vm.prank(bob); makeOffer{value: 0.5 ether}(1, 0.5 ether)` | offerId=1、 offers[1] active、 OfferMade emit、 deadline=type(uint256).max | 高 | 推奨 |
| TC-013 | 統合 | 正常系 | TC-012 後 + 3 引数版 deadline=now+1day | tokenId=1, amount=0.5 ether, deadline | `vm.prank(bob); makeOffer{value: 0.5}(1, 0.5, deadline)` | offerId=2、 offers[2].deadline 一致、 OfferMade emit | 高 | 推奨 |
| TC-014 | 統合 | 正常系 | TC-012 後 (active offer) | offerId=1 | `vm.prank(bob); cancelOffer(1)` | offers[1] cleared、 bob に 0.5 ether refund、 OfferCancelled emit | 高 | 推奨 |
| TC-015 | 統合 | 正常系 | alice mint + approve + bob が offerId=1 で 0.5 ether 預託 | offerId=1 | `vm.prank(alice); acceptOffer(1)` | ownerOf=bob、 alice=0.475 ether、 royalty=0.025 ether、 OfferAccepted emit | 高 | 推奨 |
| TC-016 | 統合 | 正常系 | acceptOffer 時に同 tokenId の listing も active | listing + offer 共存 | acceptOffer 実行 | listings[tokenId] も自動 delete される | 中 | 推奨 |
| TC-017 | 単体 | 正常系 | MarketNft deploy 済 | operator=bob | `vm.prank(alice); setApprovalForAll(bob, true)` | isApprovedForAll[alice][bob]==true、 ApprovalForAll emit | 中 | 推奨 |
| TC-018 | 単体 | 正常系 | tokenId=1 存在 | tokenId=1 | `tokenURI(1)` view | 空文字列 `""` を return (現実装の baseline) | 低 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-019 | 単体 | 異常系 | alice mint 済 | from=alice, to=bob, tokenId=1 | `vm.prank(carol); transferFrom(alice, bob, 1)` (未 approve) | `NotOwnerOrApproved` revert、 state 不変 | 高 | 推奨 |
| TC-020 | 単体 | 異常系 | alice mint 済 | from=bob, to=carol, tokenId=1 (from が owner と不一致) | `vm.prank(alice); transferFrom(bob, carol, 1)` | `NotOwnerOrApproved` revert | 高 | 推奨 |
| TC-021 | 単体 | 異常系 | 不正 selector を return する receiver contract | tokenId=1, receiver=bad | `safeTransferFrom(alice, bad, 1)` | `UnsafeRecipient` revert、 ownerOf 不変 | 高 | 推奨 |
| TC-022 | 単体 | 異常系 | onERC721Received で revert する receiver | tokenId=1, receiver=reverter | `safeTransferFrom(alice, reverter, 1)` | `UnsafeRecipient` revert (try/catch 経路) | 高 | 推奨 |
| TC-023 | 単体 | 異常系 | 存在しない tokenId | tokenId=999 | `tokenURI(999)` view | `ERC721: nonexistent` で revert | 中 | 推奨 |
| TC-024 | 統合 | 異常系 | 未 list の tokenId | tokenId=1, msg.value=1 ether | `buy{value: 1 ether}(1)` | `NotActive` revert | 高 | 推奨 |
| TC-025 | 統合 | 異常系 | 既 cancel された listing | tokenId=1 | `buy{value: 1 ether}(1)` | `NotActive` revert | 高 | 推奨 |
| TC-026 | 統合 | 異常系 | listing active、 payment 不足 | price=1 ether, msg.value=0.9 ether | `buy{value: 0.9}(1)` | `InsufficientPayment` revert、 state 不変、 ETH 戻る | 高 | 推奨 |
| TC-027 | 統合 | 異常系 | listing active、 buyer の receive() が revert (refund 拒否 contract) + overpayment | price=1 ether, msg.value=1.5 ether | `buy{value: 1.5}(1)` | `PaymentFailed` revert (refund 失敗で全巻戻し) | 高 | 推奨 |
| TC-028 | 統合 | 異常系 | listing active、 seller の receive() が revert | price=1 ether, msg.value=1 ether | `buy{value: 1}(1)` | `PaymentFailed` revert、 NFT も移転しない | 高 | 推奨 |
| TC-029 | 統合 | 異常系 | listing active、 royaltyReceiver が revert | price=1 ether | `buy{value: 1}(1)` | `PaymentFailed` revert (royalty 払えず全巻戻し) | 高 | 推奨 |
| TC-030 | 統合 | 異常系 | 既 active な listing が同 tokenId に存在 | tokenId=1, price=2 ether | 2 回目 `list(1, 2)` | `AlreadyListed(1)` revert | 高 | 推奨 |
| TC-031 | 統合 | 異常系 | listing 作成時 marketplace 未 approve | tokenId=1, price=1 ether | `vm.prank(alice); list(1, 1)` | `NotApproved` revert (operator approval だけでは不可) | 高 | 推奨 |
| TC-032 | 統合 | 異常系 | 非 owner が list 試行 | tokenId=1 (alice 保有)、 caller=bob | `vm.prank(bob); list(1, 1)` | `NotOwner` revert | 高 | 推奨 |
| TC-033 | 統合 | 異常系 | listing inactive | tokenId=1 | `cancel(1)` | `NotActive` revert | 中 | 推奨 |
| TC-034 | 統合 | 異常系 | active listing、 非 seller が cancel | tokenId=1, caller=mallory | `vm.prank(mallory); cancel(1)` | `NotOwner` revert | 高 | 推奨 |
| TC-035 | 統合 | 異常系 | makeOffer の msg.value と amount 不一致 | amount=1 ether, msg.value=0.5 ether | `makeOffer{value: 0.5}(1, 1 ether)` | `OfferPaymentMismatch` revert | 高 | 推奨 |
| TC-036 | 統合 | 異常系 | makeOffer 3 引数版で deadline = now | amount=0.5, deadline=block.timestamp | `makeOffer{value: 0.5}(1, 0.5, now)` | `InvalidDeadline` revert (`<=` 判定) | 高 | 推奨 |
| TC-037 | 統合 | 異常系 | makeOffer 3 引数版で deadline < now | deadline=block.timestamp - 1 | `makeOffer{value: 0.5}(1, 0.5, past)` | `InvalidDeadline` revert | 高 | 推奨 |
| TC-038 | 統合 | 異常系 | cancelOffer の inactive offer | offerId=999 (未作成) | `cancelOffer(999)` | `OfferNotActive(999)` revert | 高 | 推奨 |
| TC-039 | 統合 | 異常系 | 非 buyer が cancelOffer | active offer、 caller=mallory | `vm.prank(mallory); cancelOffer(1)` | `NotOwner` revert | 高 | 推奨 |
| TC-040 | 統合 | 異常系 | cancelOffer 時 buyer が refund 拒否 contract | offerId=1, buyer=rejecter | `vm.prank(rejecter); cancelOffer(1)` | `PaymentFailed` revert、 offer 残存 | 高 | 推奨 |
| TC-041 | 統合 | 異常系 | acceptOffer の inactive offer | offerId=999 | `acceptOffer(999)` | `OfferNotActive` revert | 高 | 推奨 |
| TC-042 | 統合 | 異常系 | acceptOffer の deadline 超過 | offerId=1, vm.warp(deadline + 1) | `acceptOffer(1)` | `OfferExpired(1)` revert | 高 | 推奨 |
| TC-043 | 統合 | 異常系 | 非 owner が acceptOffer (現 owner=alice、 caller=bob) | offerId=1, caller=bob | `vm.prank(bob); acceptOffer(1)` | `NotOwner` revert | 高 | 推奨 |
| TC-044 | 統合 | 異常系 | acceptOffer 時 marketplace 未 approve | active offer、 approve 取消後 | `vm.prank(alice); acceptOffer(1)` | `NotApproved` revert | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-045 | 単体 | 境界値 | mint(0) | to=address(0) | `mint(address(0))` | `InvalidRecipient` revert | 高 | 推奨 |
| TC-046 | 単体 | 境界値 | _transfer で to=0 | from=alice, to=address(0), tokenId=1 | `transferFrom(alice, 0, 1)` | `InvalidRecipient` revert | 高 | 推奨 |
| TC-047 | 単体 | 境界値 | constructor royaltyReceiver=0 | new MarketNft(address(0)) | deploy 試行 | `InvalidRecipient` revert | 高 | 推奨 |
| TC-048 | 統合 | 境界値 | listing price=0 (free list) | tokenId=1, price=0 | list + buy{value: 0} | success、 royalty=0、 seller 受領 0、 NFT 移転 | 中 | 推奨 |
| TC-049 | 統合 | 境界値 | listing price=1 wei、 royalty 端数 | price=1 wei | list + buy{value: 1} | royaltyAmount=(1*500)/10000=0 (切り捨て)、 seller=1 wei | 中 | 推奨 |
| TC-050 | 統合 | 境界値 | listing price=type(uint256).max / 10000 程度 (overflow 直前) | price=huge | list + buy{value: huge} | overflow せず royalty 計算成立 | 中 | 推奨 |
| TC-051 | 統合 | 境界値 | makeOffer amount=0 | amount=0, msg.value=0 | `makeOffer{value: 0}(1, 0)` | `InvalidOfferAmount` revert | 高 | 推奨 |
| TC-052 | 統合 | 境界値 | makeOffer 3 引数版 deadline = now + 1 (境界 ちょうど通過) | deadline=now+1 | makeOffer success | offer 作成成立、 直後 acceptOffer 成功 | 中 | 推奨 |
| TC-053 | 統合 | 境界値 | makeOffer 2 引数版 deadline = type(uint256).max | amount=1 | `makeOffer{value: 1}(1, 1)` | offer 作成、 `isOfferActive` 永続 true | 中 | 推奨 |
| TC-054 | 統合 | 境界値 | acceptOffer の deadline ちょうどの block | offerId, vm.warp(deadline) | acceptOffer | success (`<` 判定なので deadline ちょうどは OK) | 中 | 推奨 |
| TC-055 | 統合 | 境界値 | acceptOffer の deadline + 1 | vm.warp(deadline + 1) | acceptOffer | `OfferExpired` revert (off-by-one 確認) | 高 | 推奨 |
| TC-056 | 単体 | 境界値 | totalSupply の連続 mint で uint256 上限近く | 巨大 totalSupply 後 mint | `mint(alice)` | tokenId++ 計算が overflow しない (uint256 範囲) | 低 | 手動 |
| TC-057 | 単体 | 境界値 | mint された tokenId に対し balanceOf を 100 件まで積み増し | 100 mint | `balanceOf[alice]` | 100 を返す (累積カウント) | 低 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-058 | 統合 | 状態遷移 | listing inactive → active → inactive (buy 経由) | list → buy | 順次実行 | active=true (list 後) → active=false (buy 後)、 listings clear | 高 | 推奨 |
| TC-059 | 統合 | 状態遷移 | listing inactive → active → inactive (cancel 経由) | list → cancel | 順次実行 | active=true → active=false、 listings clear | 高 | 推奨 |
| TC-060 | 統合 | 状態遷移 | cancel 済 listing で再 list 可 | cancel 後に再 list | list → cancel → list | 2 回目 list 成功、 AlreadyListed が出ない | 高 | 推奨 |
| TC-061 | 統合 | 状態遷移 | offer active → cancelled | makeOffer → cancelOffer | 順次 | isOfferActive(id)==false、 buyer に refund | 高 | 推奨 |
| TC-062 | 統合 | 状態遷移 | offer active → accepted (NFT 移転) | makeOffer → acceptOffer | 順次 | offers[id] cleared、 isOfferActive false | 高 | 推奨 |
| TC-063 | 統合 | 状態遷移 | offer active → expired (時間経過のみ) | vm.warp(deadline + 1) | isOfferActive view | active=true のまま (mapping)、 ただし isOfferActive==false (deadline 判定) | 中 | 推奨 |
| TC-064 | 統合 | 状態遷移 | acceptOffer 時に同 tokenId の他 active offers を自動 invalidate + refund | 3 件 offer、 1 件 accept | acceptOffer(id1) | id2/id3 自動 delete + refund、 offersByToken[tokenId] empty | 高 | 推奨 |
| TC-065 | 統合 | 状態遷移 | buy 時に同 tokenId の active offers を自動 invalidate + refund | 2 件 offer + listing、 buy 実行 | buy{value: price}(tokenId) | 全 offer refund、 offersByToken empty | 高 | 推奨 |
| TC-066 | 統合 | 状態遷移 | acceptOffer 時に同 tokenId に active listing もある場合、 listing も delete | listing + 2 offer → accept | acceptOffer | listings[tokenId] cleared、 Cancelled event は emit されない (delete のみ) | 中 | 推奨 |
| TC-067 | 統合 | 状態遷移 | mint した直後 transferFrom で owner 更新 + balanceOf 更新 | mint → transfer | 順次 | balanceOf(old)==0、 balanceOf(new)==1、 ownerOf 更新 | 中 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-068 | 単体 | 権限 | 任意の EOA / contract から mint | caller=mallory | `vm.prank(mallory); mint(mallory)` | success (access control なしを明示) | 高 | 推奨 |
| TC-069 | 単体 | 権限 | 非 owner が approve | tokenId=1 (alice 保有)、 caller=mallory | `vm.prank(mallory); approve(bob, 1)` | `NotOwnerOrApproved` revert | 高 | 推奨 |
| TC-070 | 単体 | 権限 | operator が approve (isApprovedForAll で許容) | alice が bob を operator 設定、 caller=bob | `vm.prank(bob); approve(carol, 1)` | success、 getApproved[1]==carol | 高 | 推奨 |
| TC-071 | 単体 | 権限 | getApproved 経由の transferFrom (approval 単発) | alice → bob approve、 caller=bob | `vm.prank(bob); transferFrom(alice, carol, 1)` | success、 getApproved[1] cleared | 高 | 推奨 |
| TC-072 | 単体 | 権限 | isApprovedForAll 経由の transferFrom | alice が bob を operator 設定 | `vm.prank(bob); transferFrom(alice, carol, 1)` | success | 高 | 推奨 |
| TC-073 | 単体 | 権限 | operator approval 取消後の transferFrom | setApprovalForAll(bob, false) | `vm.prank(bob); transferFrom(...)` | `NotOwnerOrApproved` revert | 高 | 推奨 |
| TC-074 | 統合 | 権限 | acceptOffer は 元 lister でなく 現 owner (転売後) | alice list → cancel → 別 owner で acceptOffer | bob 経由 list 後 acceptOffer | 現 owner であれば accept 成立 | 中 | 推奨 |
| TC-075 | 統合 | 権限 | acceptOffer caller != ownerOf | offer active、 caller != owner | `acceptOffer` | `NotOwner` revert | 高 | 推奨 |

### 観点 6: 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-076 | 単体 | 入力バリデーション | mint to=address(0) | to=0 | mint(0) | `InvalidRecipient` revert (TC-045 と同主旨、 観点違い) | 高 | 推奨 |
| TC-077 | 単体 | 入力バリデーション | transferFrom to=address(0) | to=0 | transferFrom(alice, 0, 1) | `InvalidRecipient` revert | 高 | 推奨 |
| TC-078 | 単体 | 入力バリデーション | safeTransferFrom 4 引数版 data 任意長 (空 / 1 KB) | data 長さ 0, 1024 | safeTransferFrom | EOA 受領で hook 呼ばずに success、 contract 受領で data そのまま渡る | 中 | 推奨 |
| TC-079 | 統合 | 入力バリデーション | makeOffer amount=0 (TC-051 と同主旨、 観点違い) | amount=0 | makeOffer(0) | `InvalidOfferAmount` revert | 高 | 推奨 |
| TC-080 | 統合 | 入力バリデーション | makeOffer msg.value > amount | amount=1, msg.value=2 | makeOffer{value: 2}(1, 1) | `OfferPaymentMismatch` revert (excess も deny) | 高 | 推奨 |
| TC-081 | 統合 | 入力バリデーション | list price=0 を許容するか | price=0 | list(1, 0) | success (TC-048 補助、 仕様上 price 0 は許容) | 中 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-082 | 統合 | 冪等性 | 同 listing を 2 回 cancel | active listing 1 回 cancel 後 | 2 回目 cancel | `NotActive` revert (二重 cancel deny) | 高 | 推奨 |
| TC-083 | 統合 | 冪等性 | 同 offerId を 2 回 cancelOffer | active offer 1 回 cancel 後 | 2 回目 cancelOffer | `OfferNotActive` revert | 高 | 推奨 |
| TC-084 | 統合 | 冪等性 | 同 offerId を 2 回 acceptOffer | 1 回目 accept 後 | 2 回目 acceptOffer | `OfferNotActive` revert | 高 | 推奨 |
| TC-085 | 統合 | 冪等性 | active listing 上で 2 回目 list (TC-030 と同主旨、 冪等性観点) | tokenId=1 既 list | 2 回目 list | `AlreadyListed` revert | 高 | 推奨 |
| TC-086 | 統合 | 冪等性 | cancel 後の同 tokenId 再 list (TC-060 と同主旨) | cancel 後 | list | success (冪等性破壊なし、 listing は state ベース) | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-087 | 統合 | 並行処理 | 同 tokenId に対し 2 buyer の buy が同 block で並ぶ (順序保証 EVM の sequential 実行) | listing active、 buy tx 2 件 | tx ordering (先勝ち) | 1 件目 success、 2 件目 `NotActive` revert (delete 後) | 高 | 推奨 |
| TC-088 | 統合 | 並行処理 | listing と makeOffer + acceptOffer が同 block | list + makeOffer 後同 block で buy と acceptOffer | tx ordering | 先に通った方が success、 残りは `NotActive` / `OfferNotActive` revert | 高 | 推奨 |
| TC-089 | 統合 | 並行処理 | acceptOffer で複数 offer 一括 refund 中に 1 件失敗 (buyer が ETH 拒否 contract) | 3 offer、 1 件は refund 拒否 | acceptOffer 実行 | `PaymentFailed` revert で全巻戻し (atomic)、 offer / listing 全 state 復元 | 高 | 推奨 |
| TC-090 | 統合 | 並行処理 | 同 tokenId に複数 offer が同時存在、 cancelOffer 単発は他オファー refund を発火しない | 3 offer、 1 件 cancel | cancelOffer(1) | 該当 offer のみ refund、 他 2 件 active のまま (offersByToken 配列に残存) | 中 | 推奨 |
| TC-091 | 統合 | 並行処理 | list → owner が transferFrom で他者へ移転 → buy 試行 | list 後 alice が bob に transfer | buy(1) | `transferFrom` 内で `ownerOf != l.seller` で revert (NotOwnerOrApproved)、 listing は active のまま残存 (ガベージ) | 中 | 推奨 |

### 観点 9: 性能

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-092 | 統合 | 性能 | 同 tokenId に offer を N 件積む (`_invalidateOffersForToken` ループ長) | N=10/50/100 件 | acceptOffer 実行 | gas 使用量を fuzz/baseline で計測、 block gas limit (30M) 以内 | 中 | 推奨 |
| TC-093 | 統合 | 性能 | offersByToken 配列の最悪計算量 | N=200 件 (block gas 限界探索) | acceptOffer | revert する閾値を測定 (out-of-gas)、 結果を spec に追記要請 | 中 | 推奨 |
| TC-094 | 単体 | 性能 | mint を 100/1000 件連続 | 100/1000 mint | gas-report | 単 mint の gas を baseline 化 (回帰検出用) | 低 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-095 | 統合 | セキュリティ | acceptOffer で royalty receiver が reentrancy で再度 acceptOffer 呼出を試行 | 悪意 receiver | acceptOffer 実行 | 既に `delete offers[offerId]` 済なので reentrancy 内 acceptOffer は `OfferNotActive` revert、 ただし root tx は `PaymentFailed` で巻戻し | 高 | 推奨 |
| TC-096 | 統合 | セキュリティ | buy で seller が reentrancy で同 listing buy 呼出を試行 | 悪意 seller | buy 実行 | `delete listings[tokenId]` が seller 送金前に実行されているため reentrancy 内 buy は `NotActive` revert、 root tx も巻戻し | 高 | 推奨 |
| TC-097 | 統合 | セキュリティ | royaltyInfo が巨大値 (salePrice 超え) を返す悪意 NFT | royaltyAmount > salePrice | buy 実行 | `_payoutWithRoyalty` で `royaltyAmount = salePrice` に clamp、 seller 受領 = 0、 buyer / NFT 移転は成功 | 高 | 推奨 |
| TC-098 | 統合 | セキュリティ | royaltyInfo が revert する NFT 実装 | try/catch | buy 実行 | catch ブランチで royalty=0、 seller 全額受領、 buy は success | 高 | 推奨 |
| TC-099 | 単体 | セキュリティ | onERC721Received で reentrancy 試行 (mint→safeTransfer 内で再 transfer) | 悪意 receiver | safeTransferFrom | reentrancy 中の state はすでに更新済 (`ownerOf=to`)、 attacker は receiver から自分宛に再 transfer 可能だが NotOwnerOrApproved (msg.sender != owner) で revert | 高 | 推奨 |
| TC-100 | 統合 | セキュリティ | makeOffer の amount に対し ETH を抜き取る経路がないことを確認 | amount = X, msg.value = X | makeOffer | contract 残高に X 増加、 buyer 残高に X 減少、 他経路で X を引き出せない (cancelOffer / acceptOffer 経由のみ) | 高 | 推奨 |
| TC-101 | 統合 | セキュリティ | safeTransferFrom で false selector を返す receiver | bytes4 wrong | safeTransferFrom | `UnsafeRecipient` revert (TC-021 補強、 セキュリティ視点) | 高 | 推奨 |
| TC-102 | 統合 | セキュリティ | royaltyReceiver は immutable で改竄不能 | constructor 後 | 任意 fn 呼出 | royaltyReceiver は変更経路なし (assertion: 100 tx 後も一致) | 中 | 推奨 |
| TC-103 | 統合 | セキュリティ | makeOffer の deadline=type(uint256).max で永続 lock した場合の eth 引出 | 巨大 deadline、 cancelOffer のみ | cancelOffer | buyer 単独で常時 refund 可能、 contract に永続 lock しない | 中 | 推奨 |
| TC-104 | 統合 | セキュリティ | invariant: contract ETH 残高 == sum(active offers の amount) | 任意 tx 群 | invariant fuzz | 全 tx 後で常に等号成立 (`forge invariant` で検証) | 高 | 推奨 |
| TC-105 | 統合 | セキュリティ | invariant: 各 tokenId は同時に最大 1 件の active listing のみ | 任意 tx 群 | invariant fuzz | 常に listings[tokenId].active が単一 (重複 list は AlreadyListed で deny) | 中 | 推奨 |
| TC-106 | 統合 | セキュリティ | front-running: bob の acceptOffer 直前に alice が NFT を carol へ transfer | mempool 順序操作 | transfer → acceptOffer | acceptOffer で `nft.ownerOf != msg.sender` revert (alice が acceptOffer 試行で revert)、 carol が改めて accept すれば成立 | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。 Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat`) が次フェーズで実装する。

- TC-001 〜 TC-007 (高) — MarketNft 単体の mint / approve / transfer / safeTransfer / royaltyInfo / supportsInterface の happy path。
- TC-008 〜 TC-015 (高) — SimpleMarketplace listing / buy / cancel / makeOffer / cancelOffer / acceptOffer の happy path。
- TC-019 〜 TC-044 (高) — 異常系の access control 違反 / payment 失敗 / 状態違反 (`vm.expectRevert` で 1 件 1 行)。
- TC-045 〜 TC-055 (高) — zero address / payment 境界 / deadline 境界 (`forge fuzz` で property 化推奨)。
- TC-058 〜 TC-067 (高) — listing / offer の状態遷移 (acceptOffer の listing 連動 delete / 他オファー refund を含む)。
- TC-068 〜 TC-075 (高) — 権限マトリクス (mint 無権限 / approve / operator / acceptOffer caller)。
- TC-082 〜 TC-085 (高) — 冪等性 (二重 cancel / 二重 accept / 重複 list)。
- TC-087 〜 TC-089 (高) — 並行処理 (tx ordering 先勝ち / 一括 refund 中失敗時 atomic 巻戻し)。
- TC-095 〜 TC-101 (高) — reentrancy / royalty 悪意挙動 / 偽 selector receiver / refund 拒否 receiver。
- TC-104 (高) — `forge invariant` 推奨 (contract ETH 残高 = sum active offers)。
- TC-016, TC-017, TC-023, TC-033, TC-048 〜 TC-054, TC-063 〜 TC-067, TC-074, TC-078, TC-081, TC-086, TC-090 〜 TC-094, TC-102 〜 TC-103, TC-105 〜 TC-106 (中) — 補助観点 / 境界 / 性能 baseline。
- TC-018, TC-056, TC-057, TC-094 (低) — view default 値 / 上限近辺 / 累積 mint。

## 手動確認でよいテスト

各ケース理由付き。

- TC-056 — 理由: uint256 上限近辺の連続 mint は EVM 上で実機実行不可能 (gas / 時間)、 `vm.store` で totalSupply を直接 seed する方法は仕様外シナリオであり手動で argv を確認する程度で良い。

## 不足している仕様

skill が解消できなかった事項を bullet で列挙。 spec author に追加ヒアリングを要請する。

- `MarketNft.mint` の access control が **意図して無権限** か (テスト用) / 実運用で minter role を追加するかが未定義 (TC-068 はテスト用の前提)。
- `MarketNft.tokenURI` が常に空文字列を return する現実装は MVP として意図したものか、 base URI / per-token URI の仕様追加が予定されているか未定義。
- `SimpleMarketplace.list` で operator approval (`setApprovalForAll`) を許容しない設計が意図的か (現実装は `getApproved[tokenId] == marketplace` のみ check) — UX 上の制約理由が未定義。
- `acceptOffer` での `nft.transferFrom` 経路で 元 lister != 現 owner の場合 listing が「ガベージ active」として残存する挙動 (TC-091) が許容範囲か、 cleanup 仕様が未定義。
- `_invalidateOffersForToken` の最大 N (block gas limit に収まる offer 上限) が仕様で定義されておらず、 DoS リスクの許容範囲未定義 (TC-092 / TC-093 で計測要請)。
- ERC-2981 royalty の整数除算で端数切り捨て分の累積 (`(salePrice * 500) / 10000` の余り) の扱いが未定義 (現実装は seller が余りを受領)。
- `royaltyReceiver` を変更する経路が一切ない (immutable) 設計が意図的か、 運用上 receiver wallet 移行が必要になったとき再 deploy する想定か未定義。
- buy / acceptOffer で payment 失敗時に **全巻戻し** とする現挙動は意図的か、 partial 成功 + refund queue 化等の代替設計を検討するかが未定義。
- `MarketNft.transferFrom` は ERC-721 標準と同じ unsafe transfer (contract 受領 hook なし) を許容するが、 marketplace 自身は `transferFrom` 経由なので `receive()` を実装しない buyer contract に NFT を送る経路が存在し、 stuck NFT 発生の許容範囲が未定義。
- 入力 spec (contracts/ ファイル) には外部命令 (path 変更 / section 省略 / SSOT 無視等) は検出されず、 trust boundary 違反なし。
