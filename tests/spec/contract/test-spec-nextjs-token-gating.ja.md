# test-spec-nextjs-token-gating.ja.md

> Layer 1 (`/kiwa-design --layer contract`) 出力 — Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat`) が消費する仕様書

## 対象機能

`nextjs-token-gating` — GateNFT (誰でも mint 可能な minimum ERC-721) を hold する人だけが GatedContent の SECRET を取得できる token-gating パターン。 さらに NFT holder が別 address に期限付き access を委譲できる time-bound delegation を提供する。

対象 file。

- `examples/nextjs-token-gating/contracts/GateNFT.sol` — ERC-721 ベース (mint / transferFrom / ownerOf / balanceOf)
- `examples/nextjs-token-gating/contracts/GatedContent.sol` — gated access (getSecret / isGated / grantTimedAccess / hasAccess)

対象 function / event / error の一覧。

| symbol | kind | file |
|---|---|---|
| `mint()` | function | GateNFT.sol |
| `transferFrom(from, to, tokenId)` | function | GateNFT.sol |
| `Transfer(from, to, tokenId)` | event | GateNFT.sol |
| `NotOwner()` | error | GateNFT.sol |
| `InvalidRecipient()` | error | GateNFT.sol |
| `getSecret()` | function | GatedContent.sol |
| `isGated(user)` | view function | GatedContent.sol |
| `grantTimedAccess(user, ttlSeconds)` | function | GatedContent.sol |
| `hasAccess(user)` | view function | GatedContent.sol |
| `Accessed(caller)` | event | GatedContent.sol |
| `TimedAccessGranted(grantedBy, user, expiresAt)` | event | GatedContent.sol |
| `NotGated()` | error | GatedContent.sol |
| `InvalidTtl()` | error | GatedContent.sol |
| `SECRET` | constant string | GatedContent.sol (`"alpha-pass-2025"`) |
| `accessCount` | public uint256 | GatedContent.sol |
| `timedAccessExpiry` | mapping(address ⇒ uint256) | GatedContent.sol |
| `timedAccessGrantor` | mapping(address ⇒ address) | GatedContent.sol |

## 仕様の要約

### ユーザー操作

- GateNFT を mint する (誰でも、 1 user 何度でも、 fee なし)
- GatedContent.getSecret() を呼ぶ (NFT 1 個以上 hold or 期限付き access 付与済が前提)
- GatedContent.grantTimedAccess(receiver, ttl) で別 address に期限付き access 委譲
- GateNFT.transferFrom() で自分の NFT を別 address に転送

### API 契約 (HTTP / RPC)

contract 自体は HTTP API を持たない (dApp 経由で読み書き)。 関数 signature 一覧 (Solidity ABI ベース)。

| function | input | output | mutability |
|---|---|---|---|
| `mint()` | (なし) | `uint256 tokenId` | nonpayable |
| `transferFrom(address from, address to, uint256 tokenId)` | from / to / tokenId | (なし) | nonpayable |
| `ownerOf(uint256)` | tokenId | `address` | view |
| `balanceOf(address)` | owner | `uint256` | view |
| `totalSupply()` | (なし) | `uint256` | view |
| `getSecret()` | (なし) | `string memory` | nonpayable (accessCount++) |
| `isGated(address user)` | user | `bool` | view |
| `grantTimedAccess(address user, uint256 ttlSeconds)` | user / ttl | `uint256 expiresAt` | nonpayable |
| `hasAccess(address user)` | user | `bool` | view |
| `SECRET()` | (なし) | `string` | pure (constant) |
| `accessCount()` | (なし) | `uint256` | view |
| `timedAccessExpiry(address)` | user | `uint256` | view |
| `timedAccessGrantor(address)` | user | `address` | view |

### DB / State 更新

| state slot | 触れる variable | tx 境界 |
|---|---|---|
| GateNFT | `ownerOf[tokenId]` / `balanceOf[user]` / `totalSupply` | 1 tx (mint or transferFrom) |
| GatedContent | `accessCount` | 1 tx (getSecret 呼び出し時にインクリメント) |
| GatedContent | `timedAccessExpiry[user]` / `timedAccessGrantor[user]` | 1 tx (grantTimedAccess 呼び出し時に両方更新) |

`SECRET` は constant、 storage を消費しない。

### 権限モデル

- 誰でも — GateNFT.mint() / GatedContent.isGated() / hasAccess() / getSecret() (ただし getSecret は access 条件を満たす場合のみ revert 回避)
- NFT 所有者のみ — GateNFT.transferFrom() (`from == msg.sender` 必須) / GatedContent.grantTimedAccess() (`balanceOf(msg.sender) > 0` 必須)
- 期限付き access 受領者 — getSecret() を expiresAt まで呼べる (ただし grantor が NFT を失うと無効化される、 hasAccess の grantor.balanceOf check)

#### kiwa fixture inject 前提 (e2e layer のみ、 改善 2 / Issue #226)

(該当なし、 contract test に wallet inject 概念なし)

### 外部連携

- GateNFT は外部 contract / library 依存なし (OpenZeppelin 不使用、 minimum 実装)
- GatedContent は GateNFT の `balanceOf(address)` のみを `IGateNFT` interface 経由で参照 (constructor で渡された address に確定)
- block.timestamp に依存 (grantTimedAccess の expiresAt 計算 / hasAccess の expiry 比較)

### 失敗 mode

- mint() — 失敗 mode なし (誰でも success)
- transferFrom() — `ownerOf != from` or `msg.sender != from` → `NotOwner()` revert / `to == address(0)` → `InvalidRecipient()` revert
- getSecret() — `hasAccess(msg.sender) == false` → `NotGated()` revert
- grantTimedAccess() — `balanceOf(msg.sender) == 0` → `NotGated()` revert / `ttlSeconds == 0` → `InvalidTtl()` revert
- hasAccess() — revert しない (view、 false return)
- block.timestamp 巻き戻し — Hardhat 制約により再現不能 (Foundry vm.warp(0) でのみ再現可能、 runner 差異として許容)

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `mint()` | 低 | 中 | 中 | 高 | 低 | mint fee なし (売上影響低)、 同 user の連続 mint で totalSupply overflow リスク (uint256 overflow は実質不可能だが) |
| `transferFrom()` | 低 | 高 | 高 | 中 | 低 | unauthorized transfer による NFT 盗難、 不可逆 write、 OZ 不使用の最小実装で attack surface あり |
| `getSecret()` | 中 | 高 | 中 | 高 | 低 | access control bypass で free read 可能性、 access count 改ざんで監査ログ破壊リスク |
| `grantTimedAccess()` | 低 | 高 | 中 | 中 | 低 | unauthorized grant で他 user の access 経路を意図せず開く、 ttl=0 で permanent grant の意図せざる成立 |
| `hasAccess()` | 低 | 中 | 低 | 高 | 低 | view 関数、 内部 logic 不整合で access 判定誤り |

**総合リスク = 高** (transferFrom / getSecret / grantTimedAccess のセキュリティ影響高 + データ破壊高)

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | 各 function の input / output / state 遷移を検証 | 正常系 / 異常系 / 境界値 / 入力バリデーション |
| 統合 | GateNFT ↔ GatedContent の cross-contract 連携を検証 | 状態遷移 / 権限 / セキュリティ |
| E2E | UI から mint → getSecret 完走 | (本 contract layer spec の対象外、 e2e spec を別途参照) |

## テスト観点一覧

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点から選択。

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (revert 経路 4 種 NotOwner / InvalidRecipient / NotGated / InvalidTtl)
- 3. 境界値 — 適用 (ttl 境界、 expiry 境界、 totalSupply overflow)
- 4. 状態遷移 — 適用 (mint → transferFrom → balance 変動 / grantTimedAccess → expiry → access 失効)
- 5. 権限 — 適用 (transferFrom is owner-only / grantTimedAccess は NFT 所有者のみ)
- 6. 入力バリデーション — 適用 (ttl=0 拒否、 to=zero address 拒否)
- 7. 冪等性 — 適用 (getSecret 連続呼び出しで accessCount 増分)
- 8. 並行処理 — 適用 (同 block 内での mint 競合 / grantTimedAccess の上書き)
- 9. 性能 — 非適用 (本 contract は gas 重要だが性能 threshold 未設定、 将来追加候補)
- 10. セキュリティ — 適用 (transferFrom の access control、 grant の grantor 失効後挙動、 reentrancy 経路)
- 11. 回帰 — 非適用 (新規 contract、 過去 bug fix shape なし)

## テストケース一覧

観点別グループ、 グループ内は優先度 (高 → 中 → 低) 順。 総合リスク=高なので各観点 3 TC 以上を確保 (PR #230 改善 5 enforce 適用)。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | (なし) | (なし) | GateNFT.mint() を呼ぶ | tokenId=1、 ownerOf[1]=msg.sender、 balanceOf[sender]=1、 totalSupply=1、 Transfer(0, sender, 1) emit | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | NFT 1 個保有 | (なし) | GatedContent.getSecret() を呼ぶ | SECRET="alpha-pass-2025" return、 accessCount+1、 Accessed(sender) emit | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | NFT 1 個保有 | other / ttl=3600 | GatedContent.grantTimedAccess(other, 3600) を呼ぶ | expiresAt=block.timestamp+3600 return、 timedAccessExpiry[other]=expiresAt、 timedAccessGrantor[other]=sender、 TimedAccessGranted emit | 高 | 推奨 |
| TC-004 | 単体 | 正常系 | NFT 1 個保有 | to=other / tokenId=1 | GateNFT.transferFrom(self, other, 1) を呼ぶ | ownerOf[1]=other、 balanceOf[self]=0、 balanceOf[other]=1、 Transfer(self, other, 1) emit | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-005 | 単体 | 異常系 | NFT 0 個 | (なし) | GatedContent.getSecret() を呼ぶ | NotGated() で revert、 accessCount 不変 | 高 | 推奨 |
| TC-006 | 単体 | 異常系 | NFT 0 個 | other / ttl=3600 | GatedContent.grantTimedAccess(other, 3600) を呼ぶ | NotGated() で revert、 timedAccessExpiry / timedAccessGrantor 不変 | 高 | 推奨 |
| TC-007 | 単体 | 異常系 | NFT 1 個保有 | other / ttl=0 | GatedContent.grantTimedAccess(other, 0) を呼ぶ | InvalidTtl() で revert | 高 | 推奨 |
| TC-008 | 単体 | 異常系 | other が NFT 1 個保有 (self 0 個) | from=other / to=self / tokenId=1 | GateNFT.transferFrom(other, self, 1) を呼ぶ | NotOwner() で revert (msg.sender != from) | 高 | 推奨 |
| TC-009 | 単体 | 異常系 | NFT 1 個保有 | to=address(0) / tokenId=1 | GateNFT.transferFrom(self, 0, 1) を呼ぶ | InvalidRecipient() で revert | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | 単体 | 境界値 | NFT 1 個保有 | other / ttl=1 (最小有効値) | grantTimedAccess(other, 1) 後、 block.timestamp+0 で hasAccess(other) | true return (expiresAt = block.timestamp+1 > block.timestamp、 grantor が NFT 保有) | 高 | 推奨 |
| TC-011 | 単体 | 境界値 | NFT 1 個保有、 grantTimedAccess(other, 1) 済 | other | block.timestamp を expiresAt+1 に進めて hasAccess(other) | false return (expiry 過ぎたら grantor 保有でも false) | 高 | 推奨 |
| TC-012 | 単体 | 境界値 | NFT 1 個保有、 grantTimedAccess(other, ttl) 済 | other / 様々な ttl | hasAccess(other) を expiresAt-1 / expiresAt / expiresAt+1 で呼ぶ | expiresAt-1 → true (`expiresAt-1 < expiresAt` 不成立で expiry check pass) / expiresAt → true (strict less-than `<` で同値 false) / expiresAt+1 → false | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-013 | 統合 | 状態遷移 | NFT 1 個保有、 grantTimedAccess(other, 3600) 済 | other | (1) other.getSecret() (2) self.transferFrom(self, third, 1) (3) other.getSecret() | (1) success (grantor=self が NFT 保有) (2) self の NFT 失った (3) NotGated revert (hasAccess の grantor.balanceOf check で false) | 高 | 推奨 |
| TC-014 | 単体 | 状態遷移 | (なし) | (なし) | mint() を 3 回連続 → 各 tokenId 確認 | tokenId 1 / 2 / 3、 totalSupply=3、 balanceOf[sender]=3 | 高 | 推奨 |
| TC-015 | 単体 | 状態遷移 | NFT 1 個保有、 grantTimedAccess(other, 3600) 済 | other / 新 ttl=7200 | 再度 grantTimedAccess(other, 7200) を呼ぶ | timedAccessExpiry[other] 上書き、 timedAccessGrantor[other] は変わらず (同 grantor) | 中 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-016 | 単体 | 権限 | other が NFT 1 個保有 | from=other / to=self / tokenId=1 (vm.prank で self が呼ぶ) | GateNFT.transferFrom(other, self, 1) を vm.prank(self) で呼ぶ | NotOwner() で revert (msg.sender=self != from=other) | 高 | 推奨 |
| TC-017 | 単体 | 権限 | NFT 1 個保有 (self) | other / ttl=3600 (vm.prank(other) で呼ぶ) | vm.prank(other) で grantTimedAccess(self, 3600) | NotGated() で revert (other は NFT 0 個) | 高 | 推奨 |
| TC-018 | 単体 | 権限 | NFT 1 個保有 (self) | self / ttl=3600 (self 自身に grant) | grantTimedAccess(self, 3600) | success、 timedAccessExpiry[self]=expiresAt 設定 (自分自身への grant も許容仕様) | 中 | 推奨 |

### 観点 6: 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-019 | 単体 | 入力バリデーション | NFT 1 個保有 | other / ttl=0 | grantTimedAccess(other, 0) | InvalidTtl() で revert | 高 | 推奨 |
| TC-020 | 単体 | 入力バリデーション | NFT 1 個保有 | other / ttl=type(uint256).max | grantTimedAccess(other, max) | block.timestamp + max が overflow で revert (Solidity 0.8 checked arithmetic) | 中 | 推奨 |
| TC-021 | 単体 | 入力バリデーション | NFT 1 個保有 | to=address(0) / tokenId=1 | transferFrom(self, 0, 1) | InvalidRecipient() で revert | 高 | 推奨 |
| TC-022 | 単体 | 入力バリデーション | NFT 0 個 | from=self / to=other / tokenId=999 (存在しない) | transferFrom(self, other, 999) | NotOwner() で revert (ownerOf[999]=0 != self) | 中 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-023 | 単体 | 冪等性 | NFT 1 個保有 | (なし) | getSecret() を 3 回連続呼ぶ | 全 3 回 success、 accessCount=3、 Accessed event 3 回 emit (副作用が累積する、 idempotent ではない) | 中 | 推奨 |
| TC-024 | 単体 | 冪等性 | NFT 1 個保有 | other / ttl=3600 | grantTimedAccess(other, 3600) を 2 回連続 | 2 回目で expiresAt 上書き、 timedAccessGrantor[other]=self は変わらず | 中 | 推奨 |
| TC-025 | 単体 | 冪等性 | NFT 1 個保有 | (なし) | mint() を 2 回連続 + ownerOf 確認 | tokenId 1 / 2 が同 user に割り当てられる (1 user 何度でも mint 可能、 idempotent ではない) | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-026 | 統合 | 並行処理 | (なし) | (なし) | 同 block 内で 2 user が mint() を呼ぶ (Promise.all 相当の tx ordering) | 両方 success、 tokenId 1 / 2 が異なる user に割当、 totalSupply=2 | 中 | 推奨 |
| TC-027 | 統合 | 並行処理 | NFT 1 個保有 | other / ttl=3600 | grantTimedAccess(other, ttl_a) と grantTimedAccess(other, ttl_b) を同 block で呼ぶ | 後勝ち、 timedAccessExpiry[other] = 後の ttl_b に対応する expiresAt、 grantor は同じなので変化なし | 中 | 推奨 |
| TC-028 | 統合 | 並行処理 | (なし) | (なし) | 2 user が同 tokenId に対して transferFrom を試みる (1 人は ownerOf 直後 transfer、 1 人は revert 想定) | 1 人 success / 1 人 NotOwner revert (ordering で決まる) | 低 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-029 | 単体 | セキュリティ | NFT 0 個、 timedAccessExpiry[self]=未来 / timedAccessGrantor[self]=address(0) | (なし) | getSecret() を呼ぶ | NotGated revert (hasAccess は grantor==0 で false 返す、 expiry だけでは bypass 不可) | 高 | 推奨 |
| TC-030 | 単体 | セキュリティ | NFT 1 個保有、 grantTimedAccess(other, 3600) 済 | other | self.transferFrom(self, third, 1) 後に other.getSecret() | NotGated revert (grantor self が NFT 失ったので hasAccess の grantor.balanceOf check で false) | 高 | 推奨 |
| TC-031 | 単体 | セキュリティ | NFT 1 個保有 | (reentrancy 攻撃用 mock NFT contract を構築、 transferFrom 内で getSecret 呼出を試みる) | reentrancy attack を試みる | reentrancy guard なしだが state 不整合は起きない (getSecret は独立 storage、 reentrancy で accessCount 過剰増加リスクは残るが SECRET 値は変わらない) | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。 Layer 2 skill が次フェーズで実装する。

- TC-001 (高、 単体) — mint happy path
- TC-002 (高、 単体) — getSecret happy path
- TC-003 (高、 単体) — grantTimedAccess happy path
- TC-004 (高、 単体) — transferFrom happy path
- TC-005 (高、 単体) — getSecret without NFT → NotGated
- TC-006 (高、 単体) — grantTimedAccess without NFT → NotGated
- TC-007 (高、 単体) — grantTimedAccess with ttl=0 → InvalidTtl
- TC-008 (高、 単体) — transferFrom with wrong msg.sender → NotOwner
- TC-009 (高、 単体) — transferFrom to address(0) → InvalidRecipient
- TC-010 (高、 単体) — hasAccess at minimum ttl boundary
- TC-011 (高、 単体) — hasAccess after expiry
- TC-012 (高、 単体) — hasAccess at exact expiry (strict less-than)
- TC-013 (高、 統合) — TimedAccess revocation when grantor transfers NFT
- TC-014 (高、 単体) — totalSupply state transition
- TC-016 (高、 単体) — transferFrom unauthorized → NotOwner
- TC-017 (高、 単体) — grantTimedAccess unauthorized → NotGated
- TC-019 (高、 単体) — ttl=0 validation
- TC-021 (高、 単体) — address(0) validation
- TC-029 (高、 単体) — bypass attempt with expiry but no grantor
- TC-030 (高、 単体) — grantor revocation security
- TC-015 (中、 単体) — grantTimedAccess overwrite
- TC-018 (中、 単体) — self-grant allowed
- TC-020 (中、 単体) — ttl=max overflow
- TC-022 (中、 単体) — non-existent tokenId
- TC-023 (中、 単体) — getSecret idempotency (accessCount cumulative)
- TC-024 (中、 単体) — grantTimedAccess idempotency
- TC-025 (中、 単体) — mint idempotency (新 tokenId)
- TC-026 (中、 統合) — concurrent mint
- TC-027 (中、 統合) — concurrent grantTimedAccess
- TC-031 (中、 単体) — reentrancy resistance
- TC-028 (低、 統合) — concurrent transferFrom race

## 手動確認でよいテスト

(なし) — 全 TC が automatable な contract test (Foundry / Hardhat の決定論的環境で再現可能)。

## 不足している仕様

skill が解消できなかった事項を bullet で列挙。 spec author に追加ヒアリングを要請する。

- gas budget 上限が未定義 (TC-性能 が non-applicable、 将来 mint / grantTimedAccess の gas 上限を仕様化する余地)
- `transferFrom` における ERC-721 approval mechanism 不在 (OZ 不使用の最小実装ゆえ approve/setApprovalForAll なし、 これが意図的なのか実装漏れなのか確認)
- block.timestamp に依存するため、 timestamp manipulation attack (miner extractable) の許容範囲が未定義
- `SECRET = "alpha-pass-2025"` は constant でも contract bytecode から読み取り可能 (機密ではない)、 secret という命名が誤解を招く可能性

### runner 差異 (Foundry / Hardhat の制約) bullet

contract layer で「Foundry でしか cover できない / Hardhat でしか cover できない」 branch がある場合は、 必ず本 section に bullet として明示する。 Layer 2 skill (`/kiwa-forge` `/kiwa-hardhat`) の Step 5c で coverage 評価時に未踏 branch を検出した場合、 runner 制約由来であれば本 bullet を自動追加する。

- `GatedContent.sol:54 grantor == address(0) 分岐` は Foundry vm.warp(0) でのみ再現可能 (block.timestamp=0 で且つ grantor 未設定の組合せ)、 Hardhat は block.timestamp 巻き戻し不可制約により未踏 (許容)

## Layer 2 連携

本 spec は `/kiwa-forge` および `/kiwa-hardhat` の Layer 2 skill が消費する。 Layer 2 起動時は以下のように呼ぶ。

```text
/kiwa-forge --module nextjs-token-gating --gas-report --lang ja
/kiwa-hardhat --module nextjs-token-gating --gas-report --lang ja
```

両 skill とも 11 観点を runner 別 helper (forge fuzz / invariant / vm.warp、 chai matchers / fast-check / Promise.all) にマッピングし、 同一 spec を Foundry と Hardhat の両方で実装することで runner 差異を fully cover する。
