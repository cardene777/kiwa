# test-spec-basic-connect.md (example)

> Layer 1 (`/test-design`) 出力サンプル — `examples/basic-connect/` の wallet connect dApp を題材にした最小サイズの仕様書

## 対象機能

`basic-connect` — window.ethereum を inject した anvil 接続経由で wallet connect ボタンを動作させ、 connected address を画面に表示する dApp。

対象 file:

- `examples/basic-connect/app/page.tsx` (UI screen)
- `examples/basic-connect/tests/connect.spec.ts` (既存 E2E test)
- `examples/basic-connect/tests/prepare-env.ts` (anvil 起動)

## 仕様の要約

### ユーザー操作

- ページを開くと「Connect Wallet」ボタンが表示される
- ボタンを押すと wallet (window.ethereum 経由) が反応し account 選択 prompt が出る (本 example では mock で即承認)
- 接続後は connected address が画面中央に表示される
- 「Disconnect」ボタンで切断、 再度「Connect Wallet」表示に戻る

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| JSON-RPC | `eth_requestAccounts` | `[]` | `[address]` |
| JSON-RPC | `eth_chainId` | `[]` | `0x7a69` (= 31337) |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|

(なし、 client-side state のみ)

### 権限モデル

- 全 user 共通、 wallet を持っていれば誰でも connect 可能
- account 選択は wallet UI に依存 (dApp 側で制御しない)

### 外部連携

- anvil RPC (`http://127.0.0.1:{port}`)
- window.ethereum (dapp-e2e fixture が inject)

### 失敗 mode

- RPC 未起動 / port 衝突 — connect button 押下後 「接続に失敗しました」を 5s 以内に表示
- user reject — wallet UI で reject を選んだ場合 button が「Connect Wallet」に戻る (state クリア)
- chainId mismatch — anvil 以外の chain で接続した場合 「chain を切り替えてください」warning 表示

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `eth_requestAccounts` 呼び出し | 低 | 中 | 低 | 高 | 低 | 全 user の entry point、 phishing 対象 |
| connected address 表示 | 低 | 低 | 低 | 高 | 低 | read-only UI |
| disconnect 状態管理 | 低 | 低 | 低 | 中 | 低 | client state cleanup |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | (なし、 page.tsx は最小 component で unit test 不要) | (なし) |
| 統合 | RPC mock 経由の接続成功 / 失敗 | 正常系 / 異常系 |
| E2E | UI button → wallet → address 表示の full flow | 正常系 / 異常系 / 状態遷移 |

## テスト観点一覧

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (anvil RPC 依存)
- 3. 境界値 — 非適用 (数値入力なし)
- 4. 状態遷移 — 適用 (connected ↔ disconnected)
- 5. 権限 — 非適用 (全 user 共通)
- 6. 入力バリデーション — 非適用 (user 入力なし、 button click のみ)
- 7. 冪等性 — 非適用 (副作用なし)
- 8. 並行処理 — 非適用 (single user / single tab 想定)
- 9. 性能 — 非適用 (高負荷 endpoint なし)
- 10. セキュリティ — 適用 (signature 検証なし、 connection の origin 検証は wallet 側に委任)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-001 | E2E | anvil 起動済 + window.ethereum inject 済 | (なし) | Connect Wallet button click | connected address (0x...) が UI に表示される | 中 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-002 | 統合 | RPC mock で `eth_requestAccounts` を 503 応答 | (なし) | Connect Wallet button click | 「接続に失敗しました」message が 5s 以内に表示 | 中 | 推奨 |
| TC-003 | E2E | wallet の reject prompt を返すよう mock | (なし) | Connect Wallet button click → reject | button が「Connect Wallet」表示に戻り state は disconnected | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-004 | E2E | TC-001 完了後 | (なし) | Disconnect button click | address 非表示、 Connect Wallet button 再表示 | 中 | 推奨 |
| TC-005 | E2E | TC-004 完了後 | (なし) | 再度 Connect Wallet click | 再度同 address が表示される | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|
| TC-006 | E2E | chain id を 1 (mainnet) に切替 | (なし) | Connect Wallet button click | 「anvil に切り替えてください」warning + button 無効化 | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-001 (中) — E2E happy path connect
- TC-002 (中) — 統合 RPC 503 fallback
- TC-003 (中) — E2E user reject
- TC-004 (中) — E2E disconnect
- TC-005 (中) — E2E reconnect
- TC-006 (中) — E2E chain mismatch warning

## 手動確認でよいテスト

- (なし) — 全 case が自動化推奨 (E2E / 統合 で覆える)

## 不足している仕様

- chainId mismatch 時の「切替」ボタンの有無が UI 仕様で未定義 (`page.tsx` 確認推奨)
- disconnect 後の cached account 表示の TTL 仕様が未定義 (現状は state リセットのみ)
- multi-account 環境での active account 切替の仕様が未定義 (本 example の対象外と仮定)
