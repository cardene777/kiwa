# テスト観点カタログ

`docs/SKILL-DESIGN.md` § Step 3 の 10 観点カタログ。 SSOT は `docs/SKILL-DESIGN.md`、 本 file は適用条件と典型 case の hint。

## 10 観点の全体像

skill は以下 10 観点から該当するものを選び、 Step 4 のテストケースカテゴリの見出しに使う。 順序固定、 拡張禁止 (SSOT 拡張は別 PR で `docs/SKILL-DESIGN.md` を更新する経路)。

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

Layer 2 skill (`/contract-test-foundry` 等) はこの表を読んで観点 → ランナー特化 helper に変換する。

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § Step 3 (10 観点)
- リスクとの連動: `references/risk-criteria.md`
- Layer 2 連携: `references/layer2-bridge.md`
