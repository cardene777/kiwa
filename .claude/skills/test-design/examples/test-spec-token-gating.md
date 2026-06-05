# test-spec-token-gating.md (example)

> Layer 1 (`/test-design`) 出力サンプル — `examples/nextjs-token-gating/` の NFT 所有 = access control の dApp を題材にした完全な 9 section 仕様書 (SSOT `docs/SKILL-DESIGN.ja.md` 準拠)

## 対象機能

`nextjs-token-gating` — `GateNFT` (ERC-721 minimum) を 1 枚以上保有する user が `GatedContent.getSecret()` を呼べる dApp。 NFT 保有者は `grantTimedAccess(user, ttl)` で他 user に期限付き access を付与でき、 grantor が NFT を transfer すると grantee の access も連動失効する。

対象 file (実 repo state):

- `examples/nextjs-token-gating/contracts/GateNFT.sol` (NFT contract、 `mint()` / `transferFrom()`)
- `examples/nextjs-token-gating/contracts/GatedContent.sol` (gated 制御、 `getSecret()` / `grantTimedAccess()` / `hasAccess()` / `isGated()`)
- `examples/nextjs-token-gating/tests/gating.spec.ts` (既存 E2E test)
- `examples/nextjs-token-gating/tests/prepare-env.ts` (anvil + 2 contract deploy)

## 仕様の要約

### ユーザー操作

- Mint NFT button で `GateNFT.mint()` を呼び 1 枚 mint、 nftBalance が +1
- mint 後に「Read Secret」を実行できる (`GatedContent.getSecret()`、 NFT 保有者のみ)
- 「Grant access to ...」入力で他 user に timed access を付与 (`grantTimedAccess(user, ttlSeconds)`)
- NFT transfer 後、 grantor の `balanceOf == 0` になると grantee の access も `hasAccess` で false (連動失効)

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| JSON-RPC | `GateNFT.mint()` | `[]` | `tokenId` (Transfer event emit) |
| JSON-RPC | `GateNFT.transferFrom(from,to,tokenId)` | `[address, address, uint256]` | (Transfer event emit) |
| JSON-RPC | `GatedContent.getSecret()` | `[]` | `string` (`SECRET` constant)、 `accessCount++`、 Accessed event |
| JSON-RPC | `GatedContent.grantTimedAccess(user,ttl)` | `[address, uint256]` | `expiresAt` (TimedAccessGranted event) |
| JSON-RPC | `GatedContent.hasAccess(user)` | `[address]` | `bool` (view) |
| JSON-RPC | `GatedContent.isGated(user)` | `[address]` | `bool` (view、 balanceOf > 0) |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| `GateNFT.balanceOf[user]` | mapping (uint256) | mint で +1、 transferFrom で from -1 / to +1 |
| `GateNFT.ownerOf[tokenId]` | mapping (address) | mint で set、 transferFrom で update |
| `GateNFT.totalSupply` | uint256 | mint で +1 |
| `GatedContent.accessCount` | uint256 | getSecret 成功で +1 |
| `GatedContent.timedAccessExpiry[user]` | mapping (uint256) | grantTimedAccess で set |
| `GatedContent.timedAccessGrantor[user]` | mapping (address) | grantTimedAccess で set |

### 権限モデル

- `GateNFT.mint` — 全 user 可能 (max supply 制限なし、 totalSupply は単調増加)
- `GateNFT.transferFrom` — `msg.sender == from` かつ `ownerOf[tokenId] == from` のみ (それ以外 `NotOwner` revert)
- `GatedContent.getSecret` — `hasAccess(msg.sender) == true` のみ (それ以外 `NotGated` revert)
- `GatedContent.grantTimedAccess` — NFT 保有者のみ (`balanceOf(msg.sender) > 0`、 違反は `NotGated` revert)

### 外部連携

- anvil RPC (`http://127.0.0.1:{port}`、 `runE2EPrepareEnv` 経由)
- 2 contract deploy (`GateNFT` → `GatedContent(gateNftAddress)` の順)、 外部 oracle なし

### 失敗 mode

- `grantTimedAccess` 時 NFT 非保有 → `NotGated()` custom error で revert
- `grantTimedAccess` 時 ttl = 0 → `InvalidTtl()` custom error で revert
- `getSecret` 時 access なし → `NotGated()` custom error で revert (`AccessExpired` 専用 error は存在しない、 期限切れも `hasAccess` false 経由で `NotGated` 報告)
- `transferFrom` 時 owner mismatch → `NotOwner()` revert、 to = address(0) → `InvalidRecipient()` revert
- transfer 後の grantee state は cleanup されず、 `hasAccess` の grantor balanceOf 判定で false 化 (state は残り続けるが accessor 無効)

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `GateNFT.mint()` | 中 | 中 | 中 | 高 | 低 | NFT 発行 entry point、 access の前提 |
| `GatedContent.grantTimedAccess()` | 低 | 高 | 中 | 中 | 低 | access control 核、 bypass で free gate 解除 |
| `GatedContent.getSecret()` | 中 | 高 | 低 | 高 | 低 | secret 露出経路、 hasAccess check 失敗で漏洩 |
| `GateNFT.transferFrom` 連動 revoke | 低 | 高 | 高 | 中 | 低 | hasAccess の grantor balanceOf 判定漏れで stale access |
| `GatedContent.accessCount` 更新 | 低 | 低 | 中 | 高 | 低 | 利用ログ、 増分のみで不可逆 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | custom error の selector / event topic / state mapping 検証 | 境界値 / 入力バリデーション / 状態遷移 |
| 統合 | mint + grant + getSecret + transferFrom の chain 完走 | 正常系 / 異常系 / 冪等性 |
| E2E | UI button → wallet → contract → UI 反映の full flow | 正常系 / 状態遷移 / 権限 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (anvil RPC + contract revert path)
- 3. 境界値 — 適用 (ttl の 0 / 期限直前直後)
- 4. 状態遷移 — 適用 (NFT 未保有 → 保有 → grant → transfer 後の access lifecycle)
- 5. 権限 — 適用 (NFT 保有者 vs 非保有者)
- 6. 入力バリデーション — 非適用 (ttl 数値のみで address は ERC-20 calldata 検証なし)
- 7. 冪等性 — 非適用 (mint / grant は単調増加で複数回呼び出しの副作用が積み重なる設計、 idempotent 要件なし)
- 8. 並行処理 — 非適用 (anvil ordering で確定、 multi-user race condition は対象外)
- 9. 性能 — 非適用 (gas budget 余裕あり)
- 10. セキュリティ — 適用 (transfer 連動 revoke、 access bypass 防御)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | 正常系 | wallet connected、 NFT 未保有 | (なし) | `GateNFT.mint()` 呼び出し | `balanceOf(msg.sender) == 1`、 `Transfer(0, msg.sender, 1)` emit | 高 | 推奨 |
| TC-002 | E2E | 正常系 | TC-001 完了 (NFT 1 枚保有) | grantee = OTHER_ADDR、 ttl = 3600 | `grantTimedAccess(grantee, 3600)` 呼び出し | `timedAccessExpiry[grantee] == block.timestamp + 3600`、 `TimedAccessGranted` event | 高 | 推奨 |
| TC-003 | E2E | 正常系 | TC-002 完了 + grantee 視点で switch | (なし) | `GatedContent.getSecret()` 呼び出し | `SECRET == "alpha-pass-2025"` 取得、 `accessCount` +1、 `Accessed` event | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-004 | 統合 | 異常系 | NFT 未保有 | grantee = OTHER_ADDR、 ttl = 3600 | `grantTimedAccess` 呼び出し | `NotGated()` custom error で revert、 `timedAccessExpiry[grantee]` 不変 (0) | 高 | 推奨 |
| TC-005 | 統合 | 異常系 | access 未付与 (NFT 0 枚 + grant なし) | (なし) | `getSecret` 呼び出し | `NotGated()` custom error で revert、 `accessCount` 不変 | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-006 | 単体 | 境界値 | NFT 1 枚保有 | ttl = 0 | `grantTimedAccess(grantee, 0)` | `InvalidTtl()` custom error で revert (ttl > 0 を強制) | 高 | 推奨 |
| TC-007 | 単体 | 境界値 | TC-002 完了、 ttl = 1 | (なし) | `block.timestamp` を `expiresAt - 1` まで warp → grantee 視点 `getSecret` | success、 `accessCount` +1 (期限直前で OK) | 高 | 推奨 |
| TC-008 | 単体 | 境界値 | TC-007 完了 | (なし) | `block.timestamp` を `expiresAt + 1` まで warp → grantee 視点 `getSecret` | `NotGated()` で revert (期限切れで hasAccess false) | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-009 | E2E | 状態遷移 | TC-002 完了 (grantor = NFT 1 枚保有、 grantee = grant 済) | (なし) | grantor が `GateNFT.transferFrom(self, OTHER, 1)` で NFT を移転 | grantor `balanceOf == 0`、 grantee 視点で `hasAccess(grantee) == false` (連動失効、 timedAccessGrantor の balanceOf 判定経由) | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | 統合 | 権限 | NFT 保有者 (msg.sender) | grantee = OTHER、 ttl = 3600 | `grantTimedAccess` 呼び出し | success、 `TimedAccessGranted(msg.sender, OTHER, _)` event の `grantedBy` が msg.sender | 中 | 推奨 |
| TC-011 | 統合 | 権限 | 非保有者がなりすまし試行 | grantee = SELF | 非保有者として `grantTimedAccess(self, 3600)` | `NotGated()` revert (msg.sender balanceOf check) | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-012 | 統合 | セキュリティ | grantor が 2 grantee に grant、 grantor が NFT 1 枚を 3rd party に transfer | grantee A, B 両方 grant 済 | transfer 後に grantee A / B 視点で `hasAccess` | 両方 false (grantor の balanceOf 0 で連動失効、 単一 cleanup 不要の防御パターン) | 高 | 推奨 |
| TC-013 | E2E | セキュリティ | NFT 未保有者の self-grant 試行 | grantee = self | 非保有者として `grantTimedAccess(self, 3600)` 呼び出し | `NotGated()` revert (self-grant bypass 防御) | 高 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-001 (高) — E2E mint
- TC-002 (高) — E2E grantTimedAccess
- TC-003 (高) — E2E getSecret (gated success)
- TC-004 (高) — 統合 NotGated revert (grant)
- TC-005 (高) — 統合 NotGated revert (getSecret)
- TC-006 (高) — 単体 InvalidTtl boundary
- TC-007 (高) — 単体 TTL 直前 success
- TC-008 (高) — 単体 TTL 経過後 revert
- TC-009 (高) — E2E transfer 連動 revoke
- TC-012 (高) — 統合 multi-grantee 連動 revoke
- TC-013 (高) — E2E self-grant bypass 防御
- TC-010 (中) — 統合 NFT 保有者 grant success + event grantedBy 確認
- TC-011 (中) — 統合 非保有者 grant 試行 revert

## 手動確認でよいテスト

- (なし) — 全 case が contract test / E2E で自動化可能

## 不足している仕様

- `timedAccessExpiry` の clean up タイミング (transfer 後も state は残り続ける、 storage gas 観点での清掃方針) が未定義
- `grantTimedAccess` の重複呼び出し挙動 (上書き / 加算 のいずれか、 現コードは上書き) の意図が docstring に明記されていない
- `getSecret` の reentrancy 防御の必要性 (現状 state 更新後 emit で問題なし、 ただし return string で external call なし)
- `GateNFT` の max supply 制限の有無 (現状 unbounded、 totalSupply 上限の仕様化要否)
- pause 機能の有無 (緊急停止経路、 現状なし)
