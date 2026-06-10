# テスト観点カタログ

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点カタログ。 SSOT は `docs/SKILL-DESIGN.md`、 本 file は適用条件と典型 case の hint。

## 11 観点の全体像

skill は以下 11 観点から該当するものを選び、 Step 4 のテストケースカテゴリの見出しに使う。 順序固定、 拡張禁止 (SSOT 拡張は別 PR で `docs/SKILL-DESIGN.md` を更新する経路)。

### 1. 正常系 (Happy path)

**適用** — 常に (省略不可)。

**典型 case** — 仕様書の主機能を最短経路で 1 回実行。 input 正常値 / output 期待値 / state 期待遷移を assertion する。

例 (NFT mint):
- TC-001 — wallet connect 済の user が mint ボタン押下 → tokenId 1 の owner になる

### 2. 異常系 (Failure path)

**適用** — 外部依存が存在する場合 (RPC / API / DB / 3rd-party SDK)。

**典型 case** — 外部依存が落ちている / timeout / 不正レスポンスを返した時の挙動。 fallback / retry / error 表示を assertion する。

例 (RPC 経由 read):
- TC-NN — RPC が 503 を返した時、 UI に「再試行」ボタンが表示される
- TC-NN — RPC timeout 5s 超過で「ネットワークが不安定です」表示

### 3. 境界値 (Boundary value)

**適用** — 数値入力 / 文字列長 / 時間範囲 / 配列長 を扱う場合。

**典型 case** — 仕様で定義された min / max / off-by-one を全て叩く。

例 (vesting cliff):
- TC-NN — cliff 直前 1 秒 (release 不可)
- TC-NN — cliff ちょうど (release 可)
- TC-NN — cliff 後 1 秒 (release 可、 amount 正確)

### 4. 状態遷移 (State transition)

**適用** — state machine / status field (`pending → active → expired`) / 有限 state を持つ場合。

**典型 case** — 全 state 間遷移を網羅。 invalid 遷移 (`expired → active`) で revert / 403 を assertion。

例 (proposal lifecycle):
- TC-NN — `proposed → voted` (vote 関数で遷移)
- TC-NN — `voted → executed` (timelock 経由で遷移)
- TC-NN — `executed → executed` (重複 execute は revert)

### 5. 権限 (Permission)

**適用** — 認証ゲート / role-based UI / multi-tenant 隔離を持つ場合。

**典型 case** — 全 role × 全保護関数を 2 次元マトリクスで全て叩く (admin の OK + non-admin の revert)。

例 (admin pause):
- TC-NN — admin が pause 呼び → success
- TC-NN — non-admin が pause 呼び → AccessControl revert
- TC-NN — admin 権限剥奪後の元 admin が pause 呼び → revert

### 6. 入力バリデーション (Input validation)

**適用** — user 入力 (form / URL param / API body) を受ける場合。

**典型 case** — schema 違反 / SQL injection / XSS payload / Unicode 攻撃を network boundary で reject。

例 (profile update API):
- TC-NN — name に SQL injection payload → 422 で reject、 DB 書き込みなし
- TC-NN — bio に XSS payload → escape された state で保存

### 7. 冪等性 (Idempotency)

**適用** — webhook / payment / blockchain tx / retry を想定する処理。

**典型 case** — 同一 request を 2-3 回送り、 副作用が 1 回だけ発生することを assertion。

例 (Stripe webhook):
- TC-NN — 同 event_id で 2 回 webhook 受信 → DB row 1 件のみ
- TC-NN — 同 nonce で 2 回 tx 送信 → 2 回目は revert

### 8. 並行処理 (Concurrency)

**適用** — race condition / multi-tab / multi-user 同時操作が起きうる場合。

**典型 case** — `Promise.all` で同時実行、 行ロック / optimistic lock の挙動を assertion。

例 (NFT mint race):
- TC-NN — 2 user が同 tokenId mint 競合 → 1 user のみ成功、 もう 1 user は revert

### 9. 性能 (Performance)

**適用** — 高負荷 endpoint / 大 payload / 大量 record 処理を持つ場合。

**典型 case** — p95 latency / メモリ使用量 / gas 上限 を baseline と比較。

例 (batch transfer):
- TC-NN — 1000 件 transfer で gas < 30M (block gas limit 以内)
- TC-NN — API endpoint 100 req/s で p95 < 500ms

### 10. セキュリティ (Security)

**適用** — 認証 / 署名 / 暗号化 / secret 管理を扱う場合。

**典型 case** — OWASP Top 10 + SWC (Smart Contract Weakness Classification) に該当する攻撃を防御。

例 (signature verification):
- TC-NN — replay 攻撃 (使用済 nonce) → revert
- TC-NN — signature recovery で別 user の sig → revert
- TC-NN — front-running (commit-reveal なしの bid) → reveal phase で防御

### 11. 回帰 (Regression)

**適用** — 既存 test を持つ機能を改修する場合、 過去 bug fix した shape の test を持つ場合。

**典型 case** — bug 報告 ID と紐づく test を 1 case = 1 bug で残す。 同じ shape のバグが再発しないかを CI で常時検証する。 「change が既存挙動を壊していない」 を保証する net。

例 (token-gating):
- TC-NN — Issue #1234 で発見した `grantTimedAccess(addr, 0)` での 0 秒 grant が即時 expire しないバグの再発防御 test
- TC-NN — PR #567 で fix した `transfer` 後の grant 自動 revoke が、 別 user 経由でも有効か確認する test

skill 起動時の判定:
- 既存 test file が存在 → 全観点で「retrofit / regression 追加生成」を spec 化 (新規 + 既存保持の double 構造)
- 過去 bug 一覧 (Issue label `bug` + closed) を参照可能なら、 各 bug に対応する regression test を 1 件以上設計

### 12. multi-tab race (e2e 固有、 PR #301 観点 12/13 と相補)

**適用** — multi-tab で同時に同じ操作を行う流れが想定される dApp (例 NFT 大量 mint 競合 / batch tx 並行送出)。

**典型 case** — 2 BrowserContext で同 wallet を使い、 `Promise.all` で同 contract function を同時 invoke、 1 tab だけ success / もう 1 tab は revert (nonce 重複) を assertion。

例 (NFT mint race):
- TC-NN — tab A + tab B が同時に mint() → tab A success、 tab B が nonce conflict で revert
- TC-NN — tab A pending 中に tab B で disconnect → tab A の tx 状態が「user reject」 で UI 更新

実装。 `kiwa fixture` の `injectMultipleWallets` で別 BrowserContext を持ち、 `Promise.all([tabA.click(), tabB.click()])` で competing call を組む。

### 13. wallet account 切替 (e2e 固有)

**適用** — multi-account dApp / role 別 UI / account 表示更新が想定される dApp。

**典型 case** — `kiwa fixture` の `switchAccount(walletIndex)` で account を切り替え、 UI が新 account を表示 / 旧 account 関連データ (balance / ownership / role) を clear することを assertion。

例 (NFT collection 表示):
- TC-NN — account A で接続 → collection 3 件表示 → account B に切替 → collection 1 件に更新
- TC-NN — admin role の account で表示される admin button が、 non-admin account 切替後に消える

実装。 `kiwa fixture` の `walletClient.switchAccount()` 呼出 → `page.waitForLoadState` で UI 反映待機 → 新 testid assertion。

### 14. RPC error mock 注入 (e2e 固有)

**適用** — error fallback UX を持つ dApp (timeout 表示 / retry button / offline mode 切替)。

**典型 case** — kiwa fixture の `mockRpcResponse` で特定 RPC method の応答を error / timeout に差し替え、 UI が「再試行」 / 「ネットワーク確認」 等のメッセージを表示することを assertion。

例 (balance 取得 fallback):
- TC-NN — `eth_getBalance` を 503 で mock → UI に「残高取得失敗、 再試行」 表示
- TC-NN — `eth_call` を timeout 10s で mock → 自動 retry 3 回後に offline mode 切替

実装。 `kiwa fixture` の `mockRpcResponse({ method: 'eth_getBalance', error: { code: -32603 } })` で injection、 UI assertion を `getByTestId('error-message').toBeVisible()` で確認。

### 15. time-warp (e2e 固有)

**適用** — 時間依存ロジックを持つ dApp (vesting cliff / voting deadline / staking lock / auction expiry)。

**典型 case** — anvil の `evm_increaseTime` で時刻を進めて、 UI が時刻依存表示 (countdown / status badge) を更新することを assertion。 contract layer の境界値観点と相補。

例 (vesting cliff):
- TC-NN — cliff 直前 1 秒 で release ボタン disabled → cliff 経過後 enabled に変化
- TC-NN — voting deadline 通過時に proposal status が `voting` → `expired` に UI 更新

実装。 anvil RPC `anvil_setNextBlockTimestamp` を kiwa fixture 経由で叩き、 `page.reload()` または `page.waitForFunction` で UI 更新を観測。

### 16. 視覚 regression (e2e 固有、 任意適用)

**適用** — UI 重要 component の見た目変化を継続監視したい場合 (design system 更新 / theme 切替 / a11y diff)。

**典型 case** — Playwright の `page.screenshot()` で baseline 画像と比較、 pixel diff threshold 超過で fail。 比較対象は主要 page / state 別 (loading / error / empty)。

例 (mint flow):
- TC-NN — mint button enabled state の screenshot baseline と一致 (diff < 0.5%)
- TC-NN — error 表示時の error-banner screenshot が baseline と一致

実装。 `expect(page).toHaveScreenshot('mint-button-enabled.png', { maxDiffPixels: 100 })` で snapshot 比較、 baseline 更新は `--update-snapshots` flag で明示。 CI で不安定なら local 限定運用も可。

> 観点 12-16 は **e2e layer 固有** (contract layer では非適用)。 PR #301 で追加した観点 12 (UI feature 網羅) / 13 (wallet 接続 flow) は spec 単位での観点判断、 本観点 12-16 は spec の TC 設計 hint として使う相補関係。 観点番号の整合性は PR merge 順序で決まる、 重複が出た場合は merge 時に renumber する。

## 観点 × 優先度の決まり方

観点ごとの優先度は **対象機能のリスク score** で決まる (`references/risk-criteria.md` § 優先度導出)。 観点自体に固定優先度はない。

例 — mint() 関数のリスク = 高 (売上影響 / セキュリティ影響 高) の場合:
- 正常系 mint → 優先度 高
- 境界値 mint (max supply 直前) → 優先度 高
- 性能 mint (1000 件 batch) → 優先度 高

同 mint() でも metadata 表示 (リスク = 低) なら全観点 低。

## 観点 × Layer 2 ランナーの推奨マッピング

| 観点 | Foundry | Hardhat | Playwright |
|---|---|---|---|
| 正常系 | `forge test` | `it()` 通常 | `test()` happy path |
| 異常系 | `vm.expectRevert` | `expect(...).to.be.reverted` | mock RPC で error 注入 |
| 境界値 | `forge fuzz` | `fast-check` | parameterized test |
| 状態遷移 | `forge invariant` | `before/after` で state seed | Playwright fixture で state seed |
| 権限 | `vm.prank(role)` | `connect(signer)` | wallet account 切替 |
| 入力バリデーション | `forge fuzz` + revert assertion | `chai` schema check | form `getByTestId` + assertion |
| 冪等性 | `vm.expectRevert` 重複 | nonce 重複 test | retry test |
| 並行処理 | `vm.warp` 並列 | `Promise.all` race | multi-tab test |
| 性能 | `forge --gas-report` | `hardhat-gas-reporter` | Playwright trace + perf metrics |
| セキュリティ | `forge invariant` + symbolic | `ethers-rs` 検証 | E2E signature flow |
| 回帰 | 既存 `test_*` を full suite で実行 | 既存 `it()` を full suite で実行 | 既存 `test()` を full suite で実行 |

Layer 2 skill (`/kiwa-forge` 等) はこの表を読んで観点 → ランナー特化 helper に変換する。

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § Step 3 (11 観点)
- リスクとの連動: `references/risk-criteria.md`
- Layer 2 連携: `references/layer2-bridge.md`
