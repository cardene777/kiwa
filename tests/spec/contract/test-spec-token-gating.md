# test-spec-token-gating.md

> Layer 1 (`/test-design`) 出力 — Layer 2 skill (`/contract-test-foundry` / `/contract-test-hardhat`) が消費する仕様書
> 生成元: `examples/nextjs-token-gating/contracts/GatedContent.sol` + `GateNFT.sol` (実 contract から逆算)
> 用途: 既存 dApp への test 後付け導入 (実挙動を仕様として記録)

## 対象機能

`token-gating` — `GateNFT` (ERC-721 minimum) を 1 枚以上保有する user が `GatedContent.getSecret()` を呼べる dApp。 NFT 保有者は `grantTimedAccess(user, ttl)` で他 user に期限付き access を付与でき、 grantor が NFT を transfer すると grantee の access も連動失効する。

対象 file (grep 抽出結果):

- `contracts/GateNFT.sol` (NFT contract、 `mint()` / `transferFrom()`、 error `NotOwner` / `InvalidRecipient`)
- `contracts/GatedContent.sol` (gated 制御、 `getSecret()` / `grantTimedAccess()` / `hasAccess()` / `isGated()`、 error `NotGated` / `InvalidTtl`、 event `Accessed` / `TimedAccessGranted`)

## 仕様の要約

### ユーザー操作

- `GateNFT.mint()` で 1 枚 mint、 nftBalance が +1
- mint 後に `GatedContent.getSecret()` を呼べる (NFT 保有者のみ、 secret 取得 + accessCount +1 + Accessed event)
- `grantTimedAccess(user, ttlSeconds)` で他 user に timed access を付与 (期限 = block.timestamp + ttl、 TimedAccessGranted event)
- NFT transfer 後、 grantor の balanceOf == 0 になると grantee の access も hasAccess で false (連動失効、 hasAccess 内部の grantor balanceOf 判定経由)

### API 契約 (JSON-RPC)

| Method | Request | Response |
|---|---|---|
| `GateNFT.mint()` | `[]` | `tokenId` (Transfer event emit) |
| `GateNFT.transferFrom(from, to, tokenId)` | `[address, address, uint256]` | (Transfer event emit、 owner check 違反は NotOwner revert) |
| `GatedContent.getSecret()` | `[]` | `string` (`SECRET` constant `"alpha-pass-2025"`、 accessCount +1、 Accessed event) |
| `GatedContent.grantTimedAccess(user, ttl)` | `[address, uint256]` | `expiresAt` (block.timestamp + ttl、 TimedAccessGranted event) |
| `GatedContent.hasAccess(user)` | `[address]` | `bool` (view) |
| `GatedContent.isGated(user)` | `[address]` | `bool` (view、 balanceOf > 0) |

### State 更新

| State | 変更タイミング |
|---|---|
| `GateNFT.balanceOf[user]` | mint で +1、 transferFrom で from -1 / to +1 |
| `GateNFT.ownerOf[tokenId]` | mint で set、 transferFrom で update |
| `GateNFT.totalSupply` | mint で +1 |
| `GatedContent.accessCount` | getSecret 成功で +1 |
| `GatedContent.timedAccessExpiry[user]` | grantTimedAccess で set |
| `GatedContent.timedAccessGrantor[user]` | grantTimedAccess で set |

### 権限モデル

- `GateNFT.mint` — 全 user 可能 (max supply 制限なし、 totalSupply 単調増加)
- `GateNFT.transferFrom` — `msg.sender == from` かつ `ownerOf[tokenId] == from` のみ (それ以外 NotOwner revert)
- `GatedContent.getSecret` — `hasAccess(msg.sender) == true` のみ (それ以外 NotGated revert)
- `GatedContent.grantTimedAccess` — NFT 保有者のみ (`balanceOf(msg.sender) > 0`、 違反は NotGated revert)

### 外部連携

- 単一 anvil chain (`http://127.0.0.1:{port}`)、 2 contract deploy (GateNFT → GatedContent(gateNftAddress) の順)
- 外部 oracle なし

### 失敗 mode

- `grantTimedAccess` 時 NFT 非保有 → NotGated revert
- `grantTimedAccess` 時 ttl = 0 → InvalidTtl revert
- `getSecret` 時 access なし → NotGated revert (`AccessExpired` 専用 error は存在しない、 期限切れも hasAccess false 経由で NotGated)
- `transferFrom` 時 owner mismatch → NotOwner revert、 to = address(0) → InvalidRecipient revert
- transfer 後の grantee state は cleanup されず、 hasAccess の grantor balanceOf 判定で false 化 (state は残るが accessor 無効)

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `GateNFT.mint()` | 中 | 中 | 中 | 高 | 低 | NFT 発行 entry point、 access の前提 |
| `GatedContent.grantTimedAccess()` | 低 | 高 | 中 | 中 | 低 | access control 核、 bypass で free gate 解除 |
| `GatedContent.getSecret()` | 中 | 高 | 低 | 高 | 低 | secret 露出経路、 hasAccess check 失敗で漏洩 |
| `GateNFT.transferFrom` 連動 revoke | 低 | 高 | 高 | 中 | 低 | hasAccess の grantor balanceOf 判定漏れで stale access |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | custom error の selector / event topic / state mapping 検証 | 境界値 / 入力バリデーション / 状態遷移 |
| 統合 | mint + grant + getSecret + transferFrom の chain 完走 | 正常系 / 異常系 / 冪等性 |
| E2E | UI button → wallet → contract → UI 反映の full flow | 正常系 / 状態遷移 / 権限 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (contract revert path)
- 3. 境界値 — 適用 (ttl の 0 / 期限直前直後)
- 4. 状態遷移 — 適用 (NFT 未保有 → 保有 → grant → transfer 後の access lifecycle)
- 5. 権限 — 適用 (NFT 保有者 vs 非保有者)
- 6. 入力バリデーション — 非適用 (ttl 数値のみで address 検証なし)
- 7. 冪等性 — 非適用 (mint / grant は単調増加で idempotent 要件なし)
- 8. 並行処理 — 非適用 (anvil ordering で確定、 multi-user race 対象外)
- 9. 性能 — 非適用 (gas budget 余裕あり)
- 10. セキュリティ — 適用 (transfer 連動 revoke、 access bypass 防御)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | wallet connected、 NFT 未保有 | (なし) | `GateNFT.mint()` 呼び出し | `balanceOf(msg.sender) == 1`、 `Transfer(0, msg.sender, 1)` emit | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | TC-001 完了 (NFT 1 枚保有) | grantee = OTHER、 ttl = 3600 | `grantTimedAccess(grantee, 3600)` 呼び出し | `timedAccessExpiry[grantee] == block.timestamp + 3600`、 TimedAccessGranted event | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | TC-002 完了 + grantee 視点 | (なし) | `GatedContent.getSecret()` 呼び出し | `SECRET == "alpha-pass-2025"` 取得、 accessCount +1、 Accessed event | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-004 | 単体 | 異常系 | NFT 未保有 | grantee = OTHER、 ttl = 3600 | `grantTimedAccess` 呼び出し | `NotGated()` revert、 `timedAccessExpiry[grantee]` 不変 (0) | 高 | 推奨 |
| TC-005 | 単体 | 異常系 | access 未付与 (NFT 0 枚 + grant なし) | (なし) | `getSecret` 呼び出し | `NotGated()` revert、 accessCount 不変 | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-006 | 単体 | 境界値 | NFT 1 枚保有 | ttl = 0 | `grantTimedAccess(grantee, 0)` | `InvalidTtl()` revert | 高 | 推奨 |
| TC-007 | 単体 | 境界値 | TC-002 完了、 ttl = 1 | (なし) | `block.timestamp` を `expiresAt - 1` まで warp → grantee 視点 `getSecret` | success、 accessCount +1 (期限直前で OK) | 高 | 推奨 |
| TC-008 | 単体 | 境界値 | TC-007 完了 | (なし) | `block.timestamp` を `expiresAt + 1` まで warp → grantee 視点 `getSecret` | `NotGated()` revert (期限切れで hasAccess false) | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-009 | 単体 | 状態遷移 | TC-002 完了 (grantor = NFT 1 枚保有、 grantee = grant 済) | (なし) | grantor が `GateNFT.transferFrom(self, OTHER, 1)` で NFT を移転 | grantor `balanceOf == 0`、 grantee 視点で `hasAccess(grantee) == false` (連動失効) | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | 単体 | 権限 | 非保有者がなりすまし試行 | grantee = SELF | 非保有者として `grantTimedAccess(self, 3600)` | `NotGated()` revert (msg.sender balanceOf check) | 高 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-011 | 単体 | セキュリティ | grantor が 2 grantee に grant、 grantor が NFT を 3rd party に transfer | grantee A, B 両方 grant 済 | transfer 後に grantee A / B 視点で `hasAccess` | 両方 false (grantor の balanceOf 0 で連動失効) | 高 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-001 (高) — mint
- TC-002 (高) — grantTimedAccess
- TC-003 (高) — getSecret
- TC-004 (高) — NotGated revert (grant)
- TC-005 (高) — NotGated revert (getSecret)
- TC-006 (高) — InvalidTtl boundary
- TC-007 (高) — TTL 直前 success
- TC-008 (高) — TTL 経過後 revert
- TC-009 (高) — transfer 連動 revoke
- TC-010 (高) — 非保有者 grant 試行 revert
- TC-011 (高) — multi-grantee 連動 revoke

## 手動確認でよいテスト

- (なし) — 全 case が contract test で自動化可能

## 不足している仕様

- `timedAccessExpiry` の cleanup タイミング (transfer 後も state は残り続ける、 storage gas 観点での清掃方針) が未定義
- `grantTimedAccess` の重複呼び出し挙動 (上書き / 加算 のいずれか、 現コードは上書き) の意図が docstring に未記載
- `GateNFT` の max supply 制限の有無 (現状 unbounded、 totalSupply 上限の仕様化要否)
- pause 機能の有無 (緊急停止経路、 現状なし)
