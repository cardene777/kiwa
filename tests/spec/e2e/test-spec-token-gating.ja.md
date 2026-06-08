# test-spec-token-gating.ja.md

> Layer 1 (`/kiwa-design --layer e2e --module token-gating --input app/`) 出力 — Layer 2 skill (`/kiwa-play`) が消費する E2E 仕様書、 `examples/nextjs-token-gating/app/` の UI 実装に忠実な範囲で生成

## 対象機能

`token-gating` (e2e 視点) — Next.js dApp で wallet connect 後に `GateNFT.mint()` で NFT を 1 枚発行し、 NFT 保有者だけが `GatedContent.getSecret()` を呼んで gated secret を UI 上に表示できる token gating の UI flow。 page.tsx は `Mint NFT` / `Read Secret` の 2 ボタンと 6 個の `data-testid` ステータス表示で構成され、 `useReadContract` の `refetchInterval: 1500` で on-chain state を polling し UI に反映する。

対象 file (実 repo state、 `app/` 配下のみ):

- `examples/nextjs-token-gating/app/page.tsx` (Home component、 Mint / Read Secret button + 6 個の `data-testid` 表示)
- `examples/nextjs-token-gating/app/layout.tsx` (RootLayout、 Providers wrap)
- `examples/nextjs-token-gating/app/providers.tsx` (`WagmiProvider` + `QueryClientProvider` + `RainbowKitProvider`)
- `examples/nextjs-token-gating/lib/wagmi.ts` (`anvilChain` 31337、 `GATE_NFT` / `GATED_CONTENT` address、 ABI 定義)
- `examples/nextjs-token-gating/contracts/GateNFT.sol` (page.tsx が呼ぶ `mint` / `balanceOf`)
- `examples/nextjs-token-gating/contracts/GatedContent.sol` (page.tsx が呼ぶ `getSecret` / `isGated` / `accessCount`)

## 仕様の要約

### ユーザー操作

- `<ConnectButton />` (RainbowKit、 injected wallet) で wallet connect、 `data-testid="connection-status"` が `connected` 表示に切り替わる
- `data-testid="mint-button"` を押下で `GateNFT.mint()` を `writeContract` 経由実行、 success 時に 800ms 後 `balance` / `gated` / `accessCount` を refetch
- `data-testid="read-secret-button"` を押下で `publicClient.simulateContract(getSecret)` で revert 検出、 success なら `writeContract(getSecret)` を発行し `data-testid="secret"` に `alpha-pass-2025` を表示
- connect 前は両 button が `disabled`、 mint pending 中も `disabled` (`isPending` フラグ)
- 6 個の `data-testid` (`connection-status` / `nft-balance` / `is-gated` / `access-count` / `secret` / `error`) が polling (1500ms) で反映される

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| JSON-RPC | `GateNFT.mint()` | `[]` | `tokenId` (Transfer event emit、 page.tsx は戻り値を直接使わず balanceOf を refetch) |
| JSON-RPC | `GateNFT.balanceOf(address)` | `[address]` | `uint256` (`useReadContract` で 1500ms polling) |
| JSON-RPC | `GatedContent.getSecret()` | `[]` | `string` (`writeContract` 経由、 page.tsx は emit + state 反映を polling で観測) |
| JSON-RPC | `GatedContent.isGated(address)` | `[address]` | `bool` (`balanceOf > 0` の view) |
| JSON-RPC | `GatedContent.accessCount()` | `[]` | `uint256` (success 累積 count、 view) |
| Local | `publicClient.simulateContract(getSecret)` | `{ account, abi, fn }` | revert 検出用 dry-run、 NotGated revert を fetch error として throw |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| `GateNFT.balanceOf[user]` | mapping (uint256) | `mint()` で +1 (1 tx) |
| `GateNFT.ownerOf[tokenId]` | mapping (address) | `mint()` で set (同 tx) |
| `GateNFT.totalSupply` | uint256 | `mint()` で +1 |
| `GatedContent.accessCount` | uint256 | `getSecret()` success で +1 |
| React state `secret` | string | success callback で `setSecret('alpha-pass-2025')` |
| React state `error` | string | catch / onError で `e.message.slice(0, 100)` set |

### 権限モデル

- wallet connect — 全 user 可能 (injected wallet 必須)、 disconnect 時は両 button `disabled`
- `GateNFT.mint` — connect 済 user は誰でも可、 max supply 制限なし
- `GatedContent.getSecret` — `hasAccess(msg.sender) == true` (= `balanceOf > 0`) のみ、 違反は `NotGated()` custom error で revert (= UI 上 `error` testid に message 表示、 `secret` は `(none)` のまま)

### 外部連携

- anvil RPC (`http://127.0.0.1:${NEXT_PUBLIC_ANVIL_PORT ?? 8545}`、 `lib/wagmi.ts` の `anvilChain` chainId 31337)
- injected wallet (MetaMask 互換、 RainbowKit `injectedWallet`、 test 時は kiwa fixture で injection)
- 2 contract address は環境変数 `NEXT_PUBLIC_GATE_NFT` / `NEXT_PUBLIC_GATED_CONTENT` で渡される、 `NEXT_PUBLIC_RUNTIME_MODE === 'test'` の時に未設定なら build 時 throw

### 失敗 mode

- `getSecret` 時 NFT 未保有 → `publicClient.simulateContract` 段階で revert detect、 catch で `error` testid に `NotGated` message が `slice(0, 100)` で表示、 `writeContract` は発火しない
- `writeContract(mint)` の user reject (wallet 側 Reject) → `onError` で `setError` (page.tsx には mint の onError がないため UI 反映は wagmi 内部のみ、 console error 経路)
- `RPC` timeout / disconnect → wagmi 内部 retry、 UI 上は `data-testid="nft-balance"` が `(loading)` のまま
- env 変数 (`NEXT_PUBLIC_GATE_NFT` / `NEXT_PUBLIC_GATED_CONTENT`) 未設定で `NEXT_PUBLIC_RUNTIME_MODE === 'test'` → build error (test 開始前に fail)
- mint pending 中の重複 click → `disabled` 属性で UI 側 reject (`isPending` フラグ)

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| Mint button → `GateNFT.mint()` UI flow | 中 | 中 | 中 | 高 | 低 | NFT 発行 entry、 access の前提条件、 失敗時 access 不能 |
| Read Secret button → `getSecret()` UI flow | 中 | 高 | 低 | 高 | 低 | secret 表示経路、 NotGated revert 検出失敗で secret 漏洩リスク |
| `data-testid` polling (1500ms) 整合 | 低 | 中 | 低 | 高 | 低 | UI state と on-chain state の同期、 stale 表示で誤判断 |
| ConnectButton (RainbowKit) | 低 | 中 | 低 | 高 | 低 | wallet connect entry、 disconnect 状態保護 (button disabled) |
| simulateContract → writeContract chain | 低 | 高 | 低 | 高 | 低 | revert 検出 logic、 simulate 通過後 write fail で error 表示不整合 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | 非対象 (app/ は UI のみ、 contract 単体は `.context/spec/contract/` 経由) | (なし) |
| 統合 | 非対象 (app/ + contract の chain は E2E でカバー) | (なし) |
| E2E | UI button → wallet → contract → polling → UI 反映の full flow | 正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / セキュリティ |

`--layer e2e` 指定のため E2E 観点に集約。 contract 単体・統合は別途 `/kiwa-design --layer contract --module token-gating` で生成する。

## テスト観点一覧

`docs/SKILL-DESIGN.ja.md` § Step 3 の 10 観点から選択。

- 1. 正常系 — 適用 (常に、 connect → mint → secret 読み出しの happy path)
- 2. 異常系 — 適用 (anvil RPC + contract revert、 simulateContract での NotGated 検出)
- 3. 境界値 — 適用 (NFT 0 枚 / 1 枚の境界、 disconnect 状態の button disabled)
- 4. 状態遷移 — 適用 (disconnected → connected → minted → gated access の UI state lifecycle)
- 5. 権限 — 適用 (NFT 保有者のみ getSecret 成功、 非保有者は revert)
- 6. 入力バリデーション — 非適用 (`app/page.tsx` に user 入力 form なし、 button click のみで入力値なし)
- 7. 冪等性 — 非適用 (連続 mint は仕様上許容、 accessCount も単調増加で idempotency 要件なし)
- 8. 並行処理 — 非適用 (multi-tab UI race は対象外、 anvil tx ordering で確定)
- 9. 性能 — 非適用 (gas / p95 latency の baseline が `app/` 仕様にない、 polling 1500ms は spec 外)
- 10. セキュリティ — 適用 (UI 上 `secret` testid の露出条件、 NFT 未保有時に secret が表示されないこと)

## テストケース一覧

観点別グループ、 グループ内は優先度 (高 → 中 → 低) 順。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | 正常系 | anvil 起動済、 contract deploy 済、 wallet inject 済 | (なし) | ConnectButton 押下 → wallet approve | `data-testid="connection-status"` が `connected` を含む、 両 button が `disabled` 解除 | 高 | 推奨 |
| TC-002 | E2E | 正常系 | TC-001 完了 (connected、 NFT 0 枚) | (なし) | `data-testid="mint-button"` click → wallet approve | `data-testid="nft-balance"` が `1` を含む (refetchInterval 1500ms + 800ms delay 後)、 `data-testid="is-gated"` が `true` を含む | 高 | 推奨 |
| TC-003 | E2E | 正常系 | TC-002 完了 (NFT 1 枚保有、 isGated = true) | (なし) | `data-testid="read-secret-button"` click → simulate success → write approve | `data-testid="secret"` が `alpha-pass-2025` を含む、 `data-testid="access-count"` が +1 (refetch 後)、 `data-testid="error"` が `(none)` のまま | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-004 | E2E | 異常系 | connected、 NFT 0 枚 (`isGated = false`) | (なし) | `data-testid="read-secret-button"` click → `publicClient.simulateContract` で revert | `data-testid="error"` に `NotGated` を含む message が表示 (`slice(0, 100)`)、 `data-testid="secret"` は `(none)` のまま、 `accessCount` 不変 | 高 | 推奨 |
| TC-005 | E2E | 異常系 | connected、 NFT 0 枚、 wallet で mint tx を Reject | (なし) | `data-testid="mint-button"` click → wallet Reject | `data-testid="nft-balance"` が `0` のまま、 `data-testid="is-gated"` が `false` のまま、 button が `disabled` 解除に戻る (`isPending` false) | 中 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-006 | E2E | 境界値 | wallet 未 inject / disconnect 状態 | (なし) | page load 後 disconnect のままで両 button を観測 | 両 button が `disabled` 属性を持つ、 `data-testid="connection-status"` が `disconnected` を含む、 `data-testid="nft-balance"` が `(loading)` のまま (`enabled: Boolean(address)` で query 抑止) | 高 | 推奨 |
| TC-007 | E2E | 境界値 | mint tx 発行直後 (`isPending = true`) | (なし) | mint button 押下後 receipt 確定前に両 button を観測 | 両 button が `disabled` 属性を持つ (重複 click 防御)、 receipt 確定後に `disabled` 解除 | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-008 | E2E | 状態遷移 | 新規 page load (disconnected) | (なし) | connect → mint → read secret の順に全 state を観測 | `connection-status` が disconnected → connected、 `nft-balance` が `(loading)` → `0` → `1`、 `is-gated` が `(loading)` → `false` → `true`、 `secret` が `(none)` → `alpha-pass-2025` の順で遷移 | 高 | 推奨 |
| TC-009 | E2E | 状態遷移 | TC-003 完了 (secret 表示済) | (なし) | 同 page 内で `read-secret-button` を再 click | `accessCount` が +1 (累積)、 `secret` は `alpha-pass-2025` のまま再表示 (state 上書き)、 `error` は `(none)` のまま | 中 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | E2E | 権限 | wallet A (NFT 0 枚) で接続 → mint → secret 読了後、 wallet B (別 account、 NFT 0 枚) に switch | (なし) | wallet account 切替後 `read-secret-button` を click | `data-testid="error"` に `NotGated` 表示、 `data-testid="nft-balance"` が `0`、 `data-testid="is-gated"` が `false` で wallet B 視点で再評価される | 高 | 推奨 |
| TC-011 | E2E | 権限 | TC-010 の wallet B 視点 | (なし) | wallet B で `mint-button` click → success | `data-testid="nft-balance"` が `1` (wallet B の `balanceOf`)、 `is-gated` が `true`、 wallet B でも `read-secret-button` 成功で secret 取得可 | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-012 | E2E | セキュリティ | connected、 NFT 0 枚 | (なし) | page load 直後の DOM を観測 (mint 前) | `data-testid="secret"` が `(none)`、 button 直接 click で secret hardcode が UI に露出しない (simulate revert で early return)、 `error` testid 経路でのみ revert message 表示 | 高 | 推奨 |
| TC-013 | E2E | セキュリティ | TC-004 完了 (NFT 0 枚で revert) | (なし) | DevTools / Playwright で page HTML を dump し `alpha-pass-2025` 文字列の不在を確認 | NFT 未保有時の DOM dump に `alpha-pass-2025` が含まれない (簡略実装の `setSecret('alpha-pass-2025')` は success branch 限定で発火することを assertion) | 高 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。 Layer 2 skill (`/kiwa-play`) が次フェーズで `tests/*.spec.ts` に実装する。

- TC-001 (高) — connect happy path
- TC-002 (高) — mint happy path
- TC-003 (高) — read secret happy path
- TC-004 (高) — NotGated revert 検出
- TC-006 (高) — disconnect 時 button disabled
- TC-008 (高) — full UI state lifecycle
- TC-010 (高) — wallet account 切替で権限再評価
- TC-012 (高) — DOM 上 secret 不在 (mint 前)
- TC-013 (高) — DOM 上 secret 不在 (revert 後)
- TC-005 (中) — mint Reject 時 state 不変
- TC-007 (中) — mint pending 中 button disabled
- TC-009 (中) — accessCount 累積
- TC-011 (中) — wallet B での mint + 権限獲得

## 手動確認でよいテスト

- (なし) — 全 case が Playwright + kiwa fixture (`tests/prepare-env.ts` で anvil + contract deploy + wallet inject) で自動化可能

## 不足している仕様

skill が解消できなかった事項を bullet で列挙。 spec author に追加ヒアリングを要請する。

- `writeContract(mint)` の `onError` ハンドラが page.tsx に未実装、 user Reject 時の UI fallback (toast / error testid 表示) が未定義
- `refetchInterval: 1500` の polling 間隔が固定値で、 高速 e2e test における観測待ち時間 (`refetchAll` の 800ms delay と整合) の SSOT 化が未明示
- `setError(e.message.slice(0, 100))` の 100 文字 truncation 上限がマジックナンバー、 仕様書での明文化なし
- `data-testid="secret"` の表示文字列 `alpha-pass-2025` が page.tsx 側 hardcode (`SECRET` constant を contract から fetch せず、 success callback で `setSecret` 固定値)、 contract 側 `SECRET` 変更時の UI 同期方針が未定義
- mint pending 中の re-click 防御 (`isPending`) は wagmi 内部 state 依存、 multi-tab で同 wallet を operate した場合の `isPending` 共有可否が仕様未定義
- `app/` 内に `grantTimedAccess` UI が未実装 (contract には存在)、 README.ja.md が言及する timed grant flow を UI に追加する計画の有無
