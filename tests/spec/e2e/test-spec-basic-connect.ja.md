# test-spec-basic-connect.ja.md (e2e)

> Layer 1 (`/kiwa-design --layer e2e`) 出力 — Layer 2 skill (`/kiwa-play`) が消費する仕様書

## 対象機能

`basic-connect` — kiwa fixture (@kiwa-test/core の `dappE2eTest`) を使う最小 wallet inject e2e example。 inline HTML を `page.setContent` で injection し、 EIP-1193 / EIP-6963 wallet API の動作を検証する。 contract / Next.js app 不要、 純粋に kiwa の fixture 機構を実証する demo。

対象 file。

- `examples/basic-connect/tests/connect.spec.ts` — 単一 wallet で connect / sign / signTypedData / sendTransaction / event 5 操作
- `examples/basic-connect/tests/eip6963.spec.ts` — multi-wallet (MetaMask + Rabby 2 個 inject) で EIP-6963 announceProvider / 各 provider の eth_requestAccounts

対象 wallet RPC method 一覧。

| method | spec |
|---|---|
| `eth_requestAccounts` | EIP-1193 wallet connect |
| `eth_accounts` | 接続済 wallet の address 取得 |
| `personal_sign` | 任意 message に対する署名 |
| `eth_signTypedData_v4` | EIP-712 typed data 署名 |
| `eth_sendTransaction` | tx 発行 |
| `eip6963:requestProvider` / `eip6963:announceProvider` | EIP-6963 multi-wallet discovery |
| `accountsChanged` event | EIP-1193 wallet event |

## 仕様の要約

### ユーザー操作

- ボタン click で wallet 操作 (connect / sign / sign-typed / send-tx / register-event)
- inline HTML で wallet behavior を逐次検証
- multi-wallet (`test.use({ wallets: [...] })`) で EIP-6963 announce を確認

### API 契約 (HTTP / RPC)

window.ethereum 経由の EIP-1193 RPC。 anvil RPC を localhost:port で利用 (kiwa fixture が自動起動)。

### DB / State 更新

(該当なし、 e2e は in-memory + anvil ephemeral state)

### 権限モデル

- wallet 接続前 — eth_accounts は空配列を返す
- wallet 接続後 — connected wallet の address を全 method で利用可能

#### kiwa fixture inject 前提 (e2e layer のみ、 改善 2 / Issue #226)

`--layer e2e` 時、 kiwa fixture (`dappE2eTest`) が wallet を auto-inject する前提を必ず明示する。

- default 接続済 前提 — kiwa fixture が wallet auto-inject (default 1 wallet `PRIVATE_KEY = 0xac09...`, chainId 31337)。 multi-wallet test は `test.use({ wallets: [{...}, {...}] })` で fixture option を上書きする経路で実現 (eip6963.spec.ts の例)。 wallet 未接続 state を再現するには `eth_accounts` を最初に call して空配列を確認する

### 外部連携

- anvil (kiwa fixture が自動起動、 localhost:RANDOM_PORT)
- viem (verifyMessage / verifyTypedData / privateKeyToAccount)

### 失敗 mode

- wallet inject 失敗 → `window.ethereum` undefined、 fixture セットアップエラーで test 中断
- multi-wallet announce 漏れ → `eip6963:announceProvider` listener が wallet 数より少ない場合 expect.toHaveLength fail
- 署名検証 mismatch → viem の verifyMessage / verifyTypedData が false return

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| window.ethereum injection | 低 | 高 | 低 | 高 | 低 | wallet mock の core、 不在で全 dApp が動かない |
| personal_sign / signTypedData | 低 | 高 | 低 | 高 | 低 | 署名偽造で UI bypass 可能、 verify ロジックの誤りはセキュリティ重大 |
| eth_sendTransaction | 中 | 高 | 中 | 中 | 低 | tx 発行で chain state 変更、 from address 不一致でリプレイ攻撃懸念 |
| EIP-6963 multi-wallet | 低 | 中 | 低 | 中 | 低 | wallet 選択 UX、 announce 漏れで dApp が wallet 認識せず |
| accountsChanged event | 低 | 中 | 低 | 高 | 低 | wallet 切替 UX、 event 伝播失敗で UI 不整合 |

**総合リスク = 高** (wallet inject + 署名 のセキュリティ影響高)

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| E2E (Playwright + kiwa fixture) | window.ethereum API 動作確認、 EIP-1193 / EIP-6963 準拠検証 | 正常系 / 異常系 / 状態遷移 / 権限 / 並行処理 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用
- 2. 異常系 — 適用 (wallet 未 inject 想定 / 不正 signature 等)
- 3. 境界値 — 非適用 (UI 直接入力なし)
- 4. 状態遷移 — 適用 (未接続 → 接続済 / accountsChanged event)
- 5. 権限 — 適用 (default 1 wallet と multi-wallet の使い分け)
- 6. 入力バリデーション — 非適用 (RPC method 名 は固定)
- 7. 冪等性 — 適用 (eth_requestAccounts を複数回 call)
- 8. 並行処理 — 適用 (multi-wallet 並走 announce)
- 9. 性能 — 非適用 (e2e 性能 threshold 未設定)
- 10. セキュリティ — 適用 (署名検証 with viem、 EIP-6963 isMetaMask フラグ整合)
- 11. 回帰 — 非適用

## テストケース一覧

総合リスク=高なので各観点 3 TC 以上を確保 (PR #230 改善 5 enforce)。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | 正常系 | kiwa fixture wallet 接続済 | (なし) | window.ethereum が定義されているか check | typeof window.ethereum !== 'undefined' | 高 | 推奨 |
| TC-002 | E2E | 正常系 | wallet inject 済 | (なし) | eth_requestAccounts → #result 表示 | account.address (case insensitive) と一致 | 高 | 推奨 |
| TC-003 | E2E | 正常系 | wallet 接続済 | message="hello kiwa" | personal_sign → viem.verifyMessage | true (signature が account に対応) | 高 | 推奨 |
| TC-004 | E2E | 正常系 | wallet 接続済 | EIP-712 typed data | eth_signTypedData_v4 → viem.verifyTypedData | true | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-005 | E2E | 異常系 | wallet 未接続 (eth_accounts call 前) | (なし) | eth_accounts (request 前) | 空配列 [] (kiwa fixture は default で接続済なので、 fixture override で未接続再現) | 中 | 推奨 |
| TC-006 | E2E | 異常系 | wallet 接続済 | 別 wallet の signature で verify | personal_sign の signature を別 account で verify | viem.verifyMessage false | 高 | 推奨 |
| TC-007 | E2E | 異常系 | multi-wallet 1 個のみ inject | (なし) | requestProvider で 2 個 announce 期待 | 1 個しか返らないので toHaveLength(2) fail | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-008 | E2E | 状態遷移 | wallet inject 済 | (なし) | connect → eth_accounts → 同じ address | 同 address 取得 | 高 | 推奨 |
| TC-009 | E2E | 状態遷移 | wallet 接続済、 register-event 済 | (なし) | accountsChanged event の listener 登録 → wallet 側で account 切替 | event-result に新 account 表示 | 中 | 推奨 |
| TC-010 | E2E | 状態遷移 | wallet 接続済 | tx params | eth_sendTransaction → tx hash 取得 | 0x... の tx hash | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-011 | E2E | 権限 | default 1 wallet | (なし) | eth_accounts で wallet address 取得 | privateKeyToAccount(PRIVATE_KEY).address と一致 | 高 | 推奨 |
| TC-012 | E2E | 権限 | multi-wallet (MetaMask + Rabby) | (なし) | eip6963:requestProvider で 2 個 announce | 2 個の wallet 情報 (name / rdns / isMetaMask) | 高 | 推奨 |
| TC-013 | E2E | 権限 | multi-wallet | 各 wallet provider で eth_requestAccounts | 異なる address を返す | 各 PK に対応する 2 address | 高 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-014 | E2E | 冪等性 | wallet inject 済 | (なし) | eth_requestAccounts を 3 回連続 | 全 3 回同 address (冪等) | 中 | 推奨 |
| TC-015 | E2E | 冪等性 | wallet 接続済 | message="hello kiwa" | personal_sign を 2 回 | 同 message + 同 PK で同 signature (deterministic) | 中 | 推奨 |
| TC-016 | E2E | 冪等性 | wallet 接続済 | tx params 同じ | eth_sendTransaction を 2 回 | 2 つの異なる tx hash (nonce 増分で非冪等) | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-017 | E2E | 並行処理 | multi-wallet (MetaMask + Rabby) | (なし) | 同時に eip6963:announceProvider を 2 個 emit | 両 wallet 順序不問で listener に到達 | 高 | 推奨 |
| TC-018 | E2E | 並行処理 | multi-wallet 2 個 | (なし) | 各 wallet の Promise.all([requestAccounts]) を同時 | 各々の address を独立に取得 | 中 | 推奨 |
| TC-019 | E2E | 並行処理 | wallet 接続済 | (なし) | personal_sign と eth_sendTransaction を同時 Promise.all | 両 RPC が独立完了、 結果が互いに干渉しない | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-020 | E2E | セキュリティ | wallet 接続済 | message + signature | personal_sign 後 viem.verifyMessage で検証 | true (kiwa fixture が secp256k1 で正しく署名) | 高 | 推奨 |
| TC-021 | E2E | セキュリティ | wallet 接続済 | EIP-712 typed data | eth_signTypedData_v4 → viem.verifyTypedData | true (domain / types / message を厳密 verify) | 高 | 推奨 |
| TC-022 | E2E | セキュリティ | multi-wallet (MetaMask + Rabby) | (なし) | 各 provider が isMetaMask=true フラグを持つことを確認 (kiwa fixture が EIP-1193 互換性のため設定) | isMetaMask=true (2 個とも、 kiwa fixture の互換性設計) | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-001, 002, 003, 004 (高、 正常系)
- TC-006 (高、 異常系)
- TC-008, 010 (高、 状態遷移)
- TC-011, 012, 013 (高、 権限)
- TC-017 (高、 並行処理)
- TC-020, 021 (高、 セキュリティ)
- TC-005, 007 (中、 異常系)
- TC-009 (中、 状態遷移)
- TC-014, 015, 016 (中、 冪等性)
- TC-018, 019 (中、 並行処理)
- TC-022 (中、 セキュリティ)

## 手動確認でよいテスト

(なし) — 全 TC が automatable な fixture-based e2e。

## 不足している仕様

- accountsChanged event の listener 登録後、 fixture 側で account 切替を triger する API が `dappE2eApi` 経由で必要 — 現状は register のみで切替検証が UI 駆動でなく fixture API 経由になる
- `eth_sendTransaction` の tx receipt を waitForTransactionReceipt するための `publicClient` が test 内で別途生成されているが、 fixture の `anvilPort` から自動派生する helper があると DX 改善
- `eip6963:requestProvider` の announce timing が race の場合の動作 (kiwa fixture が同期 dispatch なので race は起きないが、 仕様明示推奨)

### runner 差異 (Foundry / Hardhat の制約) bullet

(該当なし — e2e layer は Playwright 単一 runner)

## Layer 2 連携

```text
/kiwa-play --mode new --rounds 4 --lang ja
```

Playwright + @kiwa-test/core fixture。 PR #229 の 3 helper のうち `waitForWalletConnected` は `connection-status` testid が UI にないため利用不可、 `injectMultipleWallets` は `test.use({ wallets: [...] })` で既に同等の multi-wallet inject が可能、 `setStorageSlot` は本 example に contract storage がないため不要。

→ **PR #229 helper は本 example で発火しない** (機会なし)。 別 example (contract 起点 dApp) で発火期待。
