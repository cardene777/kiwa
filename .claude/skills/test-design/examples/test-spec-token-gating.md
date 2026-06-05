# test-spec-token-gating.md (example)

> Layer 1 (`/test-design`) 出力サンプル — `examples/nextjs-token-gating/` の NFT 所有 = access control の dApp を題材にした完全な 9 section 仕様書

## 対象機能

`nextjs-token-gating` — NFT 所有を access control 条件とする dApp。 NFT 保有者が他 user に `grantTimedAccess` で timed access を付与でき、 NFT を transfer したら付与済 access が自動で revoke される設計。

対象 file:

- `examples/nextjs-token-gating/contracts/TokenGating.sol` (contract)
- `examples/nextjs-token-gating/app/page.tsx` (UI screen)
- `examples/nextjs-token-gating/tests/token-gating.spec.ts` (既存 E2E test)
- `examples/nextjs-token-gating/tests/prepare-env.ts` (anvil + deploy)

## 仕様の要約

### ユーザー操作

- Mint NFT button で 1 枚 mint、 nftBalance が +1
- mint 後に「Read Secret」を実行できる (NFT 保有者のみ)
- 「Grant access to ...」入力で他 user に timed access を付与 (TTL 指定可)
- NFT transfer 後、 付与済 access が自動で revoke

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| JSON-RPC | `mint()` | `[]` | tokenId emit |
| JSON-RPC | `grantTimedAccess(grantee, ttl)` | `[address, uint256]` | event AccessGranted |
| JSON-RPC | `hasAccess(user)` | `[address]` | `bool` |
| JSON-RPC | `readSecret()` | `[]` | `string` (gated) |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| `nftBalance[user]` | (mapping uint256) | mint で +1、 transfer で ±1 |
| `timedAccessExpiry[user]` | (mapping uint256) | grant で set、 transfer で clear |
| `accessCount[user]` | (mapping uint256) | readSecret で +1 |

### 権限モデル

- mint — 全 user 可能 (max supply あり)
- grantTimedAccess — NFT 保有者のみ (`hasNFT(msg.sender)` check)
- readSecret — `hasAccess(msg.sender) == true` のみ
- transfer — NFT owner のみ (ERC-721 標準)

### 外部連携

- anvil RPC (`http://127.0.0.1:{port}`)
- 単一 contract、 外部 oracle なし

### 失敗 mode

- grant 時 NFT 非保有 → `NotGated()` custom error で revert
- readSecret 時 access なし → `AccessDenied()` custom error で revert
- TTL 経過後 readSecret → `AccessExpired()` で revert
- transfer 中の grant 衝突 — block 境界で順次処理 (anvil の確定的 ordering で問題なし)

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `mint()` | 中 | 中 | 中 | 高 | 低 | NFT 発行の entry point |
| `grantTimedAccess()` | 低 | 高 | 中 | 中 | 低 | access control の核、 bypass で free access |
| `readSecret()` | 中 | 高 | 低 | 高 | 低 | secret 露出、 access check 経路 |
| `transfer()` 連動 revoke | 低 | 高 | 高 | 中 | 低 | transfer 後の grantee state cleanup 漏れで stale access |
| `accessCount` 更新 | 低 | 低 | 中 | 高 | 低 | 利用ログ、 増分のみで不可逆 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | custom error の selector / event topic 検証 | 境界値 / 入力バリデーション / 状態遷移 |
| 統合 | mint + grant + read の chain 完走、 RPC 失敗時 fallback | 正常系 / 異常系 / 冪等性 |
| E2E | UI button → wallet → contract → UI 反映の full flow | 正常系 / 状態遷移 / 権限 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (anvil RPC + contract revert path)
- 3. 境界値 — 適用 (TTL の 0 / max / 期限直前直後)
- 4. 状態遷移 — 適用 (granted → expired → revoked)
- 5. 権限 — 適用 (NFT 保有者 vs 非保有者)
- 6. 入力バリデーション — 適用 (grantee address 形式)
- 7. 冪等性 — 適用 (重複 grant の挙動)
- 8. 並行処理 — 非適用 (single-user dApp 想定、 race condition は anvil ordering で確定)
- 9. 性能 — 非適用 (gas budget 余裕あり)
- 10. セキュリティ — 適用 (transfer 連動 revoke、 access bypass 防御)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-001 | E2E | wallet connected、 NFT 未保有 | (なし) | Mint NFT button click | nftBalance == 1、 tokenId 1 emit、 UI 反映 | 高 | 推奨 |
| TC-002 | E2E | TC-001 完了 | grantee = OTHER_ADDR、 ttl = 1h | Grant button click | hasAccess(grantee) == true、 AccessGranted event emit | 高 | 推奨 |
| TC-003 | E2E | TC-002 完了 + grantee として switch | (なし) | Read Secret button click | secret 取得、 accessCount +1 | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-004 | 統合 | NFT 未保有 | grantee = OTHER_ADDR | grantTimedAccess 呼び出し | `NotGated()` で revert、 timedAccessExpiry[grantee] 不変 | 高 | 推奨 |
| TC-005 | 統合 | access 未付与 | (なし) | readSecret 呼び出し | `AccessDenied()` で revert | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-006 | 単体 | TC-002 完了、 ttl = 1s | (なし) | block.timestamp を ttl 直前まで warp → readSecret | success、 accessCount +1 | 高 | 推奨 |
| TC-007 | 単体 | TC-006 完了 | (なし) | block.timestamp を ttl 経過まで warp → readSecret | `AccessExpired()` で revert | 高 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-008 | E2E | TC-002 完了 (granted) | (なし) | NFT を別 user に transfer | hasAccess(grantee) == false (transfer で revoke 連動) | 高 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-009 | 統合 | grantee 2 名 (A, B) に同時 grant、 grantor が NFT transfer | (なし) | transfer 後に hasAccess(A) / hasAccess(B) | 両方 false (まとめて revoke) | 高 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-001 (高) — E2E mint
- TC-002 (高) — E2E grantTimedAccess
- TC-003 (高) — E2E readSecret (gated success)
- TC-004 (高) — 統合 NotGated revert
- TC-005 (高) — 統合 AccessDenied revert
- TC-006 (高) — 単体 TTL boundary (直前)
- TC-007 (高) — 単体 TTL boundary (経過後)
- TC-008 (高) — E2E transfer 連動 revoke
- TC-009 (高) — 統合 multi-grantee 同時 revoke

## 手動確認でよいテスト

- (なし) — 全 case が contract test / E2E で自動化可能

## 不足している仕様

- TTL 上限 (uint256 max まで許容するか上限値を強制するか) が contract で未定義
- grant 後の TTL 延長 (重複 grant 時の挙動) が仕様書で未定義 (上書き / revert / 加算 のいずれか)
- multi-NFT holder の場合の access scope (どの tokenId に紐付くか) が未定義
- pause 機能の有無 (緊急停止経路) が未定義
