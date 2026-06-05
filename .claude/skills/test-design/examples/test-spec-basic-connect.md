# test-spec-basic-connect.md (example)

> Layer 1 (`/test-design`) 出力サンプル — `examples/basic-connect/` の wallet connect dApp を題材にした最小サイズの仕様書 (SSOT `docs/SKILL-DESIGN.ja.md` 準拠)

## 対象機能

`basic-connect` — dapp-e2e fixture が inject する `window.ethereum` を経由して、 mini HTML dApp (inline で `page.setContent` 注入) の Connect / Sign / SignTypedData / SendTransaction / RegisterEvent ボタンを動作させる最小 example。

対象 file (実 repo state):

- `examples/basic-connect/tests/connect.spec.ts` (mini dApp HTML を inline 定義 + 5 button 動作確認 + 4 RPC 互換 test)
- `examples/basic-connect/tests/eip6963.spec.ts` (EIP-6963 multi-wallet discovery test)
- `examples/basic-connect/playwright.config.ts` (Playwright 設定)
- `examples/basic-connect/package.json` (依存定義)

contract deploy なし、 Next.js app dir なし (Mini HTML を `page.setContent(MINI_DAPP_HTML)` で注入する fixture-only example)。

## 仕様の要約

### ユーザー操作

- `page.setContent` で注入された mini HTML に Connect / Sign / SignTypedData / SendTransaction / RegisterEvent ボタンが並ぶ
- Connect → `eth_requestAccounts` で account を取得し `#result` に表示
- Sign → `personal_sign("hello dapp-e2e")` で signature を取得し `#result` に表示
- SignTypedData → EIP-712 typed data で `eth_signTypedData_v4` で signature を取得
- SendTransaction → `eth_sendTransaction` で 1 ETH を fixed address に送る
- RegisterEvent → `window.ethereum.on('accountsChanged', ...)` を listen

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| JSON-RPC | `eth_requestAccounts` | `[]` | `[address]` |
| JSON-RPC | `eth_accounts` | `[]` | `[address]` (connect 後) |
| JSON-RPC | `personal_sign` | `[message, address]` | `0x{130 hex}` signature |
| JSON-RPC | `eth_signTypedData_v4` | `[address, typedData JSON string]` | `0x{130 hex}` signature |
| JSON-RPC | `eth_sendTransaction` | `[{from, to, value}]` | `0x{tx hash}` |
| event | `accountsChanged` | (provider event) | callback(accounts) |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|

contract / DB なし (client-side wallet inject + RPC echo のみ)、 anvil 上で `eth_sendTransaction` は 1 tx commit するが本 example の assertion は tx hash 取得まで。

### 権限モデル

- 全 user 共通、 wallet を持っていれば誰でも connect 可能
- account 選択は fixture が anvil dev account #0 を固定で返す
- 本 example では permission gate なし (固定 PRIVATE_KEY で signature 検証)

### 外部連携

- anvil RPC (`http://127.0.0.1:{port}`、 dapp-e2e fixture が自動起動)
- `window.ethereum` (dapp-e2e fixture が inject、 EIP-1193 互換 + EIP-6963 announce)

### 失敗 mode

- fixture が anvil 起動失敗 → `runE2EPrepareEnv` 経由で test setup 段階で fail
- `eth_requestAccounts` の user reject — 本 example の fixture は常時 approve、 reject path は test 対象外
- `eth_sendTransaction` 残高不足 — 本 example は anvil dev account #0 (10000 ETH) で常時十分
- signature mismatch — viem `verifyMessage` / `verifyTypedData` が false を返した場合に test fail

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `eth_requestAccounts` 経由 connect | 低 | 中 | 低 | 高 | 低 | 全 user 共通 entry point、 fixture mock の正確性に依存 |
| `personal_sign` signature 生成 | 低 | 高 | 低 | 高 | 低 | signature の正当性で identity が立証される |
| `eth_signTypedData_v4` 生成 | 低 | 高 | 低 | 中 | 低 | EIP-712 typed data の domain separator drift で 別 dApp に流用される |
| `eth_sendTransaction` 経由 send | 低 | 中 | 低 | 中 | 低 | tx hash が返るのみで assertion 範囲は最小 |
| `accountsChanged` event listen | 低 | 低 | 低 | 中 | 低 | UI 同期、 fixture が emit しないなら test 限定 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | (なし、 spec.ts は最小 Playwright test で unit 切り出し不要) | (なし) |
| 統合 | RPC mock 経由の 4 method 互換 (request / sign / signTypedData / sendTransaction) | 正常系 / 異常系 / セキュリティ |
| E2E | UI button → wallet → DOM 反映の full flow (5 ボタン) | 正常系 / 状態遷移 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 非適用 (本 example の fixture は常時 approve、 RPC error 注入は別 example `nextjs-wagmi-rainbow` の責務)
- 3. 境界値 — 非適用 (数値入力なし、 signature 形式は固定 130 hex)
- 4. 状態遷移 — 適用 (connected ↔ disconnected の片方向のみ、 disconnect は本 example の対象外)
- 5. 権限 — 非適用 (全 user 共通)
- 6. 入力バリデーション — 非適用 (user 入力なし、 button click のみ)
- 7. 冪等性 — 非適用 (副作用なし、 sign は idempotent)
- 8. 並行処理 — 非適用 (single user / single tab 想定)
- 9. 性能 — 非適用 (高負荷 endpoint なし)
- 10. セキュリティ — 適用 (signature 検証 = identity 立証経路)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | 正常系 | dappE2eTest fixture 起動済 (anvil + window.ethereum inject) | (なし) | `page.setContent(MINI_DAPP_HTML)` 後に `typeof window.ethereum` を確認 | `typeof === "undefined"` でないこと (fixture inject 成功) | 中 | 推奨 |
| TC-002 | E2E | 正常系 | TC-001 完了 | (なし) | `#connect` click → `dappE2e.waitForRpcIdle()` | `#result` に anvil dev account #0 address (lowercase 比較) が表示 | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-003 | E2E | 状態遷移 | TC-002 完了 (connected state) | (なし) | `#register-event` click 後に provider 内部で account 切替を emit | `#event-result` に `accountsChanged: {新 address}` が表示 (RegisterEvent listener が発火) | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-004 | E2E | セキュリティ | TC-002 完了 + fixed PRIVATE_KEY | message = "hello dapp-e2e" | `#sign` click → `viem.verifyMessage({address, message, signature})` | signature が `0x{130 hex}` 形式 + `verifyMessage === true` (identity 立証 OK) | 高 | 推奨 |
| TC-005 | E2E | セキュリティ | TC-002 完了 | typedData = `{domain, types, primaryType: 'Mail', message}` | `#sign-typed` click → `viem.verifyTypedData(...)` | signature が `0x{130 hex}` + `verifyTypedData === true` (EIP-712 domain 整合確認) | 高 | 推奨 |
| TC-006 | E2E | セキュリティ | TC-002 完了 | to=`0x70997970..C8`、 value=1 ETH | `#send-tx` click → tx hash 取得 | `#result` に `0x{tx hash}` が表示 (anvil 上で commit) | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-004 (高) — E2E personal_sign + viem.verifyMessage
- TC-005 (高) — E2E signTypedData + viem.verifyTypedData
- TC-001 (中) — E2E fixture inject 確認
- TC-002 (中) — E2E connect + address 表示
- TC-003 (中) — E2E accountsChanged event listen
- TC-006 (中) — E2E sendTransaction + tx hash 表示

## 手動確認でよいテスト

- (なし) — 全 case が E2E で自動化可能 (`tests/connect.spec.ts` 既存実装で 4 round PASS 確認済)

## 不足している仕様

- `accountsChanged` event の発火タイミング (fixture が自動 emit するか手動で trigger するか) が docstring に未記載
- 別 chain id (mainnet 等) への切替 attempt の挙動 (本 example は anvil 31337 固定) が未定義
- disconnect path (現状 connect 片方向のみ、 wallet 切断シナリオが対象外) が未定義
- EIP-6963 multi-wallet (別 fixture で test 済) との関係性が本 example の docstring から不明
