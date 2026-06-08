# test-spec-nextjs-token-gating.md (e2e)

> Layer 1 (`/kiwa-design --layer e2e`) 出力 — Layer 2 skill (`/kiwa-play`) が消費する仕様書

## 対象機能

`nextjs-token-gating` (dApp e2e) — Next.js 14 App Router + wagmi + RainbowKit 構成の token-gating dApp UI。 wallet 接続 → NFT mint → gating 判定で `accessCount` / `secret` を取得・表示する一連のユーザー体験を Playwright で検証する。

対象 file:

- `examples/nextjs-token-gating/app/page.tsx` — メイン UI (ConnectButton / Mint NFT / Read Secret / 状態表示 6 種)
- `examples/nextjs-token-gating/app/providers.tsx` — WagmiProvider + RainbowKit + react-query Provider
- `examples/nextjs-token-gating/app/layout.tsx` — Next.js root layout
- `examples/nextjs-token-gating/contracts/GateNFT.sol` / `GatedContent.sol` — 連携 contract (anvil deploy 想定)
- 既存 e2e 基盤 (`/kiwa-play` 想定): `tests/prepare-env.ts` (anvil 起動 + contract deploy + UI wallet inject) / `tests/global-setup.ts` / `tests/global-teardown.ts`

## 仕様の要約

### ユーザー操作

- ブラウザで `http://127.0.0.1:3044` を開き、 RainbowKit の Connect ボタン (kiwa 環境では auto-inject mock wallet) で wallet 接続する。
- 接続後、 `Mint NFT` ボタンを押す → wagmi `useWriteContract` で `GateNFT.mint()` 呼出 → tx 完了 → 1.5 秒間隔の `refetchInterval` と onSuccess の `setTimeout(800ms)` で `nftBalance` / `isGated` / `accessCount` が更新表示される。
- NFT 保有後、 `Read Secret` ボタンを押す → `publicClient.simulateContract` で `getSecret` の revert 有無を事前 check → 通過すれば `writeContract` で getSecret tx 発行 → `secret = "alpha-pass-2025"` を state に保存し UI 表示 → onSuccess で `refetchAll` が走り `accessCount += 1`。
- NFT 未所有で `Read Secret` を押すと simulateContract が `NotGated` revert で `setError` され、 `error` 表示要素に最初の 100 文字が出る。

### API 契約 (HTTP / RPC)

UI が叩く on-chain endpoint。 HTTP API は存在せず、 wagmi 経由で anvil JSON-RPC を呼ぶ。

| 種別 | 経路 | 関数 / 用途 | 観測点 |
|---|---|---|---|
| read | `useReadContract` (auto poll 1.5s) | `GateNFT.balanceOf(address)` | `data-testid="nft-balance"` の number |
| read | `useReadContract` (auto poll 1.5s) | `GatedContent.isGated(address)` | `data-testid="is-gated"` の bool |
| read | `useReadContract` (auto poll 1.5s) | `GatedContent.accessCount()` | `data-testid="access-count"` の number |
| simulate | `publicClient.simulateContract` | `GatedContent.getSecret()` (revert 検出) | catch で `data-testid="error"` 表示 |
| write | `useWriteContract` | `GateNFT.mint()` | tx 成功 onSuccess で `refetchAll()` |
| write | `useWriteContract` | `GatedContent.getSecret()` | tx 成功 onSuccess で `setSecret("alpha-pass-2025")` |

### DB / State 更新

UI 内部 React state:

| state | trigger | 観測 testid |
|---|---|---|
| `secret` (string) | Read Secret 成功 onSuccess | `secret` |
| `error` (string) | simulateContract / writeContract onError | `error` |
| `tick` (number) | refetchAll の `setTick((n) => n + 1)` | (内部のみ、 強制 re-render 用) |

オンチェーン state は contract spec (`tests/spec/contract/test-spec-nextjs-token-gating.ja.md`) の 7 種と同じ。

### 権限モデル

- wallet 未接続 → Mint / Read Secret button が `disabled` (`!isConnected || isPending` 判定)。
- wallet 接続 + NFT 未保有 → Read Secret 押下で `NotGated` revert、 mint は可。
- NFT 保有 → Read Secret で `secret` 取得可、 accessCount 加算。

### 外部連携

- anvil ローカル RPC (`http://127.0.0.1:8545`、 chain id 31337) を wagmi 経由で呼ぶ。
- RainbowKit (`@rainbow-me/rainbowkit` 2.2+) は kiwa の auto-inject mock wallet (test 環境では `tests/prepare-env.ts` の wallet 注入) に置換される。
- react-query (`@tanstack/react-query` 5.59+) の QueryClient で全 useReadContract を 1.5 秒間隔 refetch。

### 失敗 mode

- wallet 接続前の操作 → button が `disabled` で UI から trigger 不可。
- NFT 未保有で Read Secret → `publicClient.simulateContract` 段階で revert を捕捉、 `data-testid="error"` に `NotGated` 由来のメッセージを表示。
- mint tx が wallet reject → wagmi の onError は本実装で未配線 (writeContract に onError なし)、 UI に明示的なエラー表示が出ない。 「不足している仕様」 に記録。
- anvil 切断 / RPC 503 → wagmi の useReadContract が data undefined のまま (`(loading)` 表示)、 button は依然押せる。 タイムアウト UX が未定義。
- `refetchAll` の `setTimeout(800ms)` 内に複数操作を連打 → state update が 800ms ずれで重畳、 表示の race あり。
- secret 表示は contract 戻り値ではなく **UI でハードコードした文字列** (`setSecret('alpha-pass-2025')`)。 contract の `SECRET` 定数を変更しても UI 表示は連動しない。

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| ConnectButton + wallet inject | 低 | 中 | 低 | 高 | 低 | dApp の入口、 wallet inject 失敗で UI 全体 disabled |
| Mint NFT button | 低 | 中 | 中 | 高 | 低 | free mint の起点、 button disabled 制御漏れで未接続時 mint 試行が走るリスク |
| Read Secret button | 中 | 高 | 低 | 高 | 低 | gating 判定の UX、 simulateContract bypass / UI ハードコード文字列の改ざんで secret 表示の信頼性低下 |
| 状態表示 (6 testid) | 低 | 中 | 低 | 高 | 低 | refetchInterval / setTimeout で表示遅延、 試験で polling 完了待ち不足だと flaky |
| エラー表示 | 中 | 高 | 低 | 中 | 低 | NotGated revert message の見せ方が 100 文字 truncate で具体 error 種別が見えにくい |
| accessCount 表示 | 低 | 中 | 低 | 高 | 低 | gating bypass 試行を観察する key metric、 polling 1.5s で race が起きやすい |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | (本仕様書は e2e、 単体は contract 側 spec で扱う) | (該当なし) |
| 統合 | wagmi hook 単体は test しないが、 UI と contract の橋渡し (read polling / write callback) は次の E2E で吸収 | (該当なし) |
| E2E | wallet 接続 / mint / read secret の主要導線、 disabled 制御、 revert UX、 polling 反映、 multi-user gating | 正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / セキュリティ / 回帰 |

## テスト観点一覧

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点から選択。

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (anvil RPC / wallet 接続失敗 / contract revert)
- 3. 境界値 — 適用 (refetch polling 1.5s + setTimeout 800ms / accessCount のゼロ初期値)
- 4. 状態遷移 — 適用 (disconnected → connected → minted → gated → secret-read の 5 state)
- 5. 権限 — 適用 (wallet 未接続 / NFT 未保有 / NFT 保有 の 3 階層)
- 6. 入力バリデーション — 適用 (button disabled、 連打防御)
- 7. 冪等性 — 適用 (Mint / Read Secret 連打時の重複 tx 防御 / 重複表示防御)
- 8. 並行処理 — 適用 (multi-tab で同 wallet が連続 mint、 別 user の race)
- 9. 性能 — 非適用 (UI は 1 ページのみ、 large payload なし、 polling 1.5s も負荷無視可)
- 10. セキュリティ — 適用 (UI 表示 secret は contract 値の re-display、 ハードコード値との乖離検出)
- 11. 回帰 — 非適用 (現時点で既存 e2e test 不在の clean start)

## テストケース一覧

観点別グループ、 グループ内は優先度 (高 → 中 → 低) 順。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | 正常系 | anvil 起動 + contract deploy + wallet inject (alice) | (なし) | UI を開く | `connection-status` が `connected` を表示、 `nft-balance` が `0`、 `is-gated` が `false`、 `access-count` が `0`、 `mint-button` / `read-secret-button` が enabled | 高 | 推奨 |
| TC-002 | E2E | 正常系 | TC-001 完了 | (なし) | `Mint NFT` を click → tx 完了を polling で確認 | `nft-balance` が `1` に更新、 `is-gated` が `true` に更新、 `access-count` は `0` のまま | 高 | 推奨 |
| TC-003 | E2E | 正常系 | TC-002 完了 (NFT 保有済) | (なし) | `Read Secret` を click → tx 完了を polling で確認 | `secret` が `alpha-pass-2025` を表示、 `access-count` が `1` に更新、 `error` は `(none)` のまま | 高 | 推奨 |
| TC-004 | E2E | 正常系 | wallet 未接続 (mock inject 未実行) | (なし) | UI を開く | `connection-status` が `disconnected`、 `mint-button` / `read-secret-button` が `disabled`、 `nft-balance` / `is-gated` が `(loading)` 表示 | 中 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-005 | E2E | 異常系 | wallet 接続済 + NFT 未保有 | (なし) | `Read Secret` を click | `error` testid に `NotGated` 由来の文字列 (例 `execution reverted: NotGated()` の頭 100 文字) が表示、 `secret` は `(none)` のまま、 `access-count` 不変 | 高 | 推奨 |
| TC-006 | E2E | 異常系 | wallet 接続済 + NFT 未保有 + `error` 表示状態 (TC-005 完了直後) | (なし) | 続けて `Mint NFT` を click | `nft-balance` が `1` に更新、 `is-gated` が `true` に更新、 `error` は `(none)` か旧表示のまま (UI には clear 経路あり?要確認) | 中 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-007 | E2E | 境界値 | wallet 接続済 | (なし) | `Mint NFT` 押下後 `refetchInterval` 1.5s + `setTimeout` 800ms の合計 (約 2.3s) 待機 | `nft-balance` が `(loading)` から `1` へ非可逆的に遷移 (途中で `0` 表示はあっても最終 `1` に固定) | 中 | 推奨 |
| TC-008 | E2E | 境界値 | wallet 接続済 + NFT 保有済 | (なし) | `Read Secret` 押下後 1 秒以内に再度 click | 2 回目の click は wagmi `isPending` で button disabled、 重複 tx 発行されない、 `access-count` は最終 1 回分のみ加算 | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-009 | E2E | 状態遷移 | clean start (anvil reset + contract redeploy) | (なし) | 全 5 state を順次たどる: `disconnected → connected (wallet inject) → minted (Mint) → gated (state 表示確認) → secret-read (Read Secret)` | 各 state で観測点 (testid) が期待値に推移する、 逆順 (例 `secret-read → disconnected`) で button が `disabled` になるかは TC-004 で別途確認 | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | E2E | 権限 | wallet 未接続 | (なし) | `mint-button` / `read-secret-button` の disabled 属性を Playwright で確認 | 両 button が `disabled`、 force click でも tx 発行されない (button click 自体が DOM レベルで block される) | 高 | 推奨 |

### 観点 6: 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-011 | E2E | 入力バリデーション | wallet 接続済 | (なし) | `Mint NFT` を 3 回連打 (300ms 間隔) | `isPending` で 2 回目以降 button disabled、 tx は 1 件のみ発行、 `nft-balance` は最終 `1` (期間中の polling で連続 mint しない) | 高 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-012 | E2E | 冪等性 | wallet 接続済 + NFT 保有済 + `secret` 表示済 | (なし) | `Read Secret` を再度 click | 2 回目の tx も成功し `access-count` が `+1`、 `secret` 表示文字列は変わらず `alpha-pass-2025` のまま (idempotent UI 表示) | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-013 | E2E | 並行処理 | 2 つの browser context (alice / bob)、 双方接続済 | (なし) | alice が Mint → bob が Mint を同時実行、 双方の UI で polling 反映を観測 | alice の `nft-balance` が `1`、 bob の `nft-balance` が `1`、 双方の `is-gated` が `true`、 tokenId は別個に発行 (alice=1, bob=2 のいずれか) | 中 | 推奨 |
| TC-014 | E2E | 並行処理 | TC-013 完了 (alice / bob が NFT 保有) | (なし) | alice が grant→bob で getSecret 経由 + 直接 bob が mint 済の経路で getSecret、 双方の `access-count` が同時に更新される | 双方の UI で `access-count` が `2` に到達 (polling 1.5s 内で順次反映)、 表示の race で `1 → 0 → 2` のような巻き戻りが無いこと | 低 | 手動 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-015 | E2E | セキュリティ | wallet 接続済 + NFT 未保有 | (なし) | DevTools 経由で `mint-button` の `disabled` 属性を強制削除 → click | RPC レベルでは `mint()` は誰でも実行可能なため tx は通る (free mint 設計、 UI の disabled は UX 制約のみ)、 `nft-balance` が `1` に更新、 「UI 改ざんで secret を読めるか」 は別 TC で確認 | 高 | 推奨 |
| TC-016 | E2E | セキュリティ | wallet 接続済 + NFT 未保有 | (なし) | DevTools 経由で `read-secret-button` の `disabled` 属性を強制削除 → click | simulateContract が `NotGated` で revert、 `error` 表示、 `secret` は `(none)` のまま、 UI ハードコード `alpha-pass-2025` が DOM 出現しない | 高 | 推奨 |
| TC-017 | E2E | セキュリティ | contract の `SECRET` 定数 を hardcode と異なる値で再 deploy (例 `"changed-pass"`) | (なし) | NFT 保有後 `Read Secret` click | UI 表示 `secret` は **UI ハードコード値 (`alpha-pass-2025`)** のまま、 contract 戻り値とは乖離 (実装上の bug、 セキュリティ的には deceptive UI) | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。 Layer 2 (`/kiwa-play`) が次フェーズで `tests/{example}.spec.ts` に変換する。

- TC-001 / TC-002 / TC-003 (高) — 正常系: 初期状態 → mint → read secret の主要導線
- TC-005 (高) — 異常系: NFT 未保有 + read secret で error 表示
- TC-009 (高) — 状態遷移: 5 state 順次遷移
- TC-010 (高) — 権限: button disabled 制御 (未接続)
- TC-011 (高) — 入力バリデーション: 連打防御
- TC-015 / TC-016 (高) — セキュリティ: DOM 改ざんで button disabled bypass / secret leak 防御
- TC-004 / TC-006 (中) — 異常系の補助 / 切替直後 state
- TC-007 / TC-008 (中) — polling 境界値 / 連打 race
- TC-012 (中) — 冪等性: 二重 read 表示
- TC-013 (中) — 並行処理: multi-user mint race (browser context 2 つ)
- TC-017 (中) — セキュリティ: UI ハードコード値と contract SECRET の乖離

## 手動確認でよいテスト

- TC-014 (並行処理 — accessCount の race) — 理由: 2 user の polling タイミングが unstable で flaky になりやすい、 手動で実機確認 (browser 2 tab 開いて目視で `access-count` 推移) の方が再現性高い。

## 不足している仕様

- wagmi `useWriteContract` の `onError` が `Mint NFT` 経路で未配線、 mint tx が wallet reject されたときの UI 表示 (button reset / error 表示 / 再試行可否) が仕様で未定義。
- `Read Secret` 成功後の `error` state clear (TC-006 ケース) の仕様が未定義、 連続操作で残存 error が view にとどまる可能性。
- `refetchInterval: 1500` と `onSuccess` 内 `setTimeout(800ms)` の合計 wait time (約 2.3 秒) が UI 表示更新の SLA、 Playwright の `expect(...).toHaveText` polling は default 5 秒なので余裕あるが、 dev server 遅延込みの最大 wait は仕様で明示されていない (Layer 2 で expect の timeout 設定が必要)。
- `setSecret('alpha-pass-2025')` が UI ハードコードで contract の戻り値と乖離する仕様意図が不明。 仕様上の制約か単純な実装簡略化か未確定。
- multi-tab / multi-account の wallet inject 戦略 (`tests/prepare-env.ts` が複数 account を inject できる構成か) が確認できていない、 TC-013 / TC-014 の前提条件成立可否がここに依存。
- DevTools 改ざん test (TC-015 / TC-016) は Playwright の `evaluate` で `button.removeAttribute('disabled')` した後 click する形を想定しているが、 React 側の `disabled={!isConnected || isPending}` が次の render で revert する可能性がある。 厳密な「DOM 改ざん」かどうかの定義を Layer 2 で確定する必要あり。
