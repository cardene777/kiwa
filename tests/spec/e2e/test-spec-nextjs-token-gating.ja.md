# test-spec-nextjs-token-gating.ja.md (e2e)

> Layer 1 (`/kiwa-design --layer e2e`) 出力 — Layer 2 skill (`/kiwa-play`) が消費する仕様書

## 対象機能

`nextjs-token-gating` — Next.js + wagmi + RainbowKit UI で GateNFT / GatedContent contract を操作する dApp。 wallet connect → NFT mint → gated content read を 1 page で完結させる token-gating デモ。

対象 file。

- `examples/nextjs-token-gating/app/page.tsx` — 全 UI ロジック (mint / read secret / 数値表示)
- `examples/nextjs-token-gating/app/providers.tsx` — wagmi / RainbowKit provider
- `examples/nextjs-token-gating/lib/wagmi.ts` — contract address / ABI / chain 定義

UI testid 一覧。

| testid | 種別 | 内容 |
|---|---|---|
| `connection-status` | div | `connected` / `disconnected` |
| `nft-balance` | div | `nftBalance: N` |
| `is-gated` | div | `isGated: true / false` |
| `access-count` | div | `accessCount: N` |
| `secret` | div | `secret: alpha-pass-2025` / `(none)` |
| `error` | div | `error: <message>` / `(none)` |
| `mint-button` | button | Mint NFT |
| `read-secret-button` | button | Read Secret |

## 仕様の要約

### ユーザー操作

- Connect Wallet を押す → RainbowKit modal → ウォレット選択 → 接続
- Mint NFT ボタン押下 → wagmi writeContract で GateNFT.mint() 発行 → 1.5s で refetch
- Read Secret ボタン押下 → simulateContract → success なら getSecret() 発行 → "alpha-pass-2025" 表示

### API 契約 (HTTP / RPC)

(該当なし、 contract 直接呼出のみ)

### DB / State 更新

UI 側 state。

| state | 触れる variable | tx 境界 |
|---|---|---|
| local | `secret` / `error` (useState) | UI イベントごと |
| react-query cache | `balance` / `gated` / `accessCount` (useReadContract、 refetchInterval 1500ms) | 1.5s ごと再 fetch |

### 権限モデル

- wallet 未接続 — Mint / Read Secret ボタン disabled
- wallet 接続済 — Mint NFT 自由、 Read Secret は NFT 1 個以上 or grantTimedAccess 済時のみ成功
- 未保有で Read Secret → simulateContract で revert detect → error 表示

#### kiwa fixture inject 前提 (e2e layer のみ、 改善 2 / Issue #226)

`--layer e2e` 時、 kiwa fixture (`tests/prepare-env.ts` 経由の `dappE2eTest`) が wallet を auto-inject する前提を必ず明示する。 Layer 2 (`/kiwa-play`) が assertion 設計時に「wallet 未接続を前提とした test」 を緩和する判断材料にする。

- default 接続済 前提 — kiwa fixture が wallet auto-inject (default 1 wallet, chainId 31337)。 wallet 未接続 state を再現するには test 内で page を新しい BrowserContext で開くか、 connection-status testid を直接 disconnected 状態で render する経路を test で構築する

### 外部連携

- wagmi v2 + viem (RPC: anvil 127.0.0.1:8551)
- RainbowKit (wallet inject は kiwa fixture が injector script で eth_provider 注入)
- contract: GateNFT / GatedContent (deploy は prepare-env.ts で実施)

### 失敗 mode

- simulateContract revert → catch → error message 100 文字に truncate して `error` testid に表示
- writeContract onError → error message を `error` に表示
- refetch race — refetchInterval 1500ms 中に状態変化があれば 800ms の `refetchAll()` で即更新

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| Mint NFT button | 低 | 中 | 中 | 高 | 低 | 主要 flow、 NFT 取得経路 |
| Read Secret button | 中 | 高 | 中 | 高 | 低 | gated content access、 unauthorized read で SECRET 漏洩リスク |
| accessCount 表示 | 低 | 中 | 低 | 中 | 低 | 監査ログ的意味、 race で表示遅延 |
| connection-status | 低 | 中 | 低 | 高 | 低 | wallet 接続状態の誤認は UX 重大 |

**総合リスク = 高** (Read Secret のセキュリティ高 + Mint の利用頻度高)

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| E2E (Playwright + kiwa fixture) | UI flow 完走、 testid assertion で state 確認 | 正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 並行処理 / セキュリティ |

## テスト観点一覧

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (simulateContract revert 経路)
- 3. 境界値 — 適用 (NFT 0 個 / 1 個 / 複数個 で UI 表示)
- 4. 状態遷移 — 適用 (disconnected → connected / NFT 0 → 1 / accessCount 増分)
- 5. 権限 — 適用 (wallet 未接続でボタン disabled / NFT 0 で Read Secret revert)
- 6. 入力バリデーション — 非適用 (UI に直接入力なし、 button click のみ)
- 7. 冪等性 — 適用 (連続 mint で nftBalance 増分 / 連続 Read で accessCount 増分)
- 8. 並行処理 — 適用 (refetchInterval と user 操作の race、 multi-tab)
- 9. 性能 — 非適用 (静的 SPA、 性能 threshold 未設定)
- 10. セキュリティ — 適用 (Read Secret 不正経路、 NFT 0 個での SECRET 取得試行)
- 11. 回帰 — 非適用 (新規 dApp)

## テストケース一覧

総合リスク=高なので各観点 3 TC 以上を確保 (PR #230 改善 5 enforce)。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E001 | E2E | 正常系 | kiwa fixture wallet 接続済 | (なし) | page load 後 connection-status / nft-balance testid を確認 | connection-status=connected、 nftBalance=0、 isGated=false、 accessCount=0 | 高 | 推奨 |
| TC-E002 | E2E | 正常系 | wallet 接続済 / NFT 0 | mint-button click | Mint NFT 押下 → 1.5s 待機 → nft-balance / is-gated 確認 | nftBalance=1、 isGated=true、 mint tx success | 高 | 推奨 |
| TC-E003 | E2E | 正常系 | wallet 接続済 / NFT 1 個 | read-secret-button click | Read Secret 押下 → secret / access-count 確認 | secret=alpha-pass-2025、 accessCount=1、 error=(none) | 高 | 推奨 |
| TC-E004 | E2E | 正常系 | wallet 接続済 / NFT 1 個 / Read 済 | read-secret-button click 2 回目 | 連続 Read | accessCount=2 (累積)、 secret 表示維持 | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E005 | E2E | 異常系 | wallet 接続済 / NFT 0 | read-secret-button click | Read Secret 押下 → simulateContract revert detect | error testid に NotGated 関連 message、 secret=(none)、 accessCount 不変 | 高 | 推奨 |
| TC-E006 | E2E | 異常系 | wallet 接続済 (anvil 停止状態) | mint-button click | Mint 押下 → RPC error | error testid に "Network" or 接続 error message、 nftBalance 不変 | 中 | 推奨 |
| TC-E007 | E2E | 異常系 | wallet 接続済 / 不正 chainId | mint-button click | wrong chain 状態で Mint | error / nft-balance に "(loading)" 表示維持、 tx 発火しない | 中 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E008 | E2E | 境界値 | wallet 接続済 / NFT 0 | (なし) | nftBalance=0 から isGated=false 確認 | nftBalance=0、 isGated=false、 Read Secret は disabled でなく click 可能だが error | 高 | 推奨 |
| TC-E009 | E2E | 境界値 | wallet 接続済 / NFT 連続 mint | mint-button 3 回 click | 3 回 mint で nft-balance 表示更新 | nftBalance=3、 totalSupply=3 (UI 外)、 isGated=true | 中 | 推奨 |
| TC-E010 | E2E | 境界値 | wallet 接続済 / accessCount=0 | Read Secret 1 回 | accessCount=0 → 1 への state transition | accessCount testid が "0" から "1" へ変化 (refetchInterval 1500ms で更新) | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E011 | E2E | 状態遷移 | 接続前 | wallet inject 完了 | page load → connection-status 確認 | connection-status: connected (kiwa fixture が auto-inject) | 高 | 推奨 |
| TC-E012 | E2E | 状態遷移 | wallet 接続済 / NFT 0 | Mint → Read の full flow | (1) Mint click (2) nft-balance=1 確認 (3) Read click (4) secret 確認 | 4 step 全 success、 accessCount=1 | 高 | 推奨 |
| TC-E013 | E2E | 状態遷移 | wallet 接続済 / NFT 1 / Read 済 | (なし) | refetchInterval 1500ms の間 mint なしで accessCount 不変 | accessCount テキスト 1500ms 間隔 polling でも変化なし | 中 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E014 | E2E | 権限 | wallet 接続済 / NFT 0 | (なし) | mint-button / read-secret-button の disabled 属性 check | 両 button enabled (isConnected=true、 isPending=false)、 disconnected 状態が test fixture では再現困難なので接続済 default で確認 | 中 | 推奨 |
| TC-E015 | E2E | 権限 | wallet 接続済 / NFT 0 | read-secret-button click | NFT 0 で Read 試行 → error 表示 | error testid に NotGated 関連の text、 secret=(none) | 高 | 推奨 |
| TC-E016 | E2E | 権限 | wallet 接続済 / mint 後 NFT 1 | Read Secret | NFT 取得後 Read 可能 | secret=alpha-pass-2025、 accessCount+1 | 高 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E017 | E2E | 冪等性 | wallet 接続済 | mint 5 回連続 | nft-balance が 5 になるまで連続 mint | nftBalance=5、 各 mint は新 tokenId 発行 (UI 上は totalSupply 非表示だがバックエンド整合) | 中 | 推奨 |
| TC-E018 | E2E | 冪等性 | wallet 接続済 / NFT 1 | Read Secret 5 回連続 | accessCount=5 まで増分 | accessCount=5、 secret 表示維持 | 中 | 推奨 |
| TC-E019 | E2E | 冪等性 | wallet 接続済 / NFT 1 | Mint 後即 Read | mint と read の order 入れ替えても結果同じ | nftBalance=2 (1 増分)、 accessCount=1 | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E020 | E2E | 並行処理 | wallet 接続済 | mint-button 即 2 回 click | refetchInterval 1500ms 中に 2 回 mint | 2 mint tx 両方 success、 nftBalance=2 (1.5s 内に反映) | 中 | 推奨 |
| TC-E021 | E2E | 並行処理 | wallet 接続済 / NFT 1 | Mint → Read 連打 | UI 操作 race condition (連打) | tx ordering で nftBalance=2、 accessCount=1、 error なし | 中 | 推奨 |
| TC-E022 | E2E | 並行処理 | wallet 接続済 | page 表示中の refetch | refetchInterval 1500ms で自動 refetch する間に user mint | 自動 refetch と user-triggered refetchAll() (800ms) が干渉しても最終 state 一貫 | 低 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-E023 | E2E | セキュリティ | wallet 接続済 / NFT 0 | (なし) | Read Secret 試行 → simulateContract で revert detect | secret testid="(none)"、 SECRET 値が UI に絶対漏れない (revert で writeContract 自体 skip) | 高 | 推奨 |
| TC-E024 | E2E | セキュリティ | wallet 接続済 / NFT 1 / Read 済 / その後 NFT transfer して 0 個 | Read Secret 再試行 | NFT 失った後の Read | error 表示、 secret=(none) (キャッシュも消去)、 accessCount 不変 | 高 | 推奨 |
| TC-E025 | E2E | セキュリティ | wallet 接続済 / 別 user の NFT で grant 受領 | (なし) | grant 受領者として getSecret() | grant 経路で secret 表示可能 (UI 上は別 grant flow 未実装、 spec 要望) | 低 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。

- TC-E001, E002, E003, E004 (高、 正常系)
- TC-E005 (高、 異常系)
- TC-E011, E012 (高、 状態遷移)
- TC-E015, E016 (高、 権限)
- TC-E023, E024 (高、 セキュリティ)
- TC-E006, E007 (中、 異常系)
- TC-E008, E009, E010 (中、 境界値)
- TC-E013 (中、 状態遷移)
- TC-E014 (中、 権限)
- TC-E017, E018, E019 (中、 冪等性)
- TC-E020, E021 (中、 並行処理)
- TC-E022 (低、 並行処理)
- TC-E025 (低、 セキュリティ — UI 未実装で skip 候補)

## 手動確認でよいテスト

- TC-E025 — UI に grant 受領者の flow が未実装、 contract layer test で代替 (kiwa fixture 拡張前提のため別 issue 化候補、 #224 helper を使えば実装可能)

## 不足している仕様

- wallet 未接続 (disconnected) state を test で再現する方法が未定義 (kiwa fixture は default 接続済、 PR #229 で追加した別 BrowserContext 経路で代替可能)
- grant 受領者 UI が未実装 (TC-E025 が contract 層のみ cover、 UI 拡張余地)
- accessCount の refetchInterval 1500ms と user-triggered 800ms refetchAll() の race 仕様が docs 未定義 (実装は問題ないが test author に依存)
- error message の truncate 100 文字制約は意図的 UX か不明 (full error log を取れる経路を追加検討)

### runner 差異 (Foundry / Hardhat の制約) bullet

(該当なし、 e2e layer は Playwright 単一 runner)

## Layer 2 連携

```text
/kiwa-play --mode new --rounds 4 --lang ja
```

Playwright + @kiwa-test/core fixture で wallet inject auto。 PR #229 の 3 helper (waitForWalletConnected / injectMultipleWallets / setStorageSlot) を opt-in 利用可能 (TC-E024 / E025 で setStorageSlot / injectMultipleWallets が有用)。
