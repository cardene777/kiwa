# 9 section 出力テンプレ (完全雛形)

`docs/SKILL-DESIGN.ja.md` § 出力フォーマット の 9 section (日本語版 SSOT) を埋める完全な markdown 雛形。 skill は本 file を Read してそのまま `--layer` で決定した出力 path (`tests/spec/{layer}/test-spec-{module}.md` または `tests/spec/test-spec-{module}.md`) の枠組みとする。 英語版 SSOT (`docs/SKILL-DESIGN.md` の `## Target feature` 等) を生成する経路は本 skill の対象外。

順序固定、 section 省略禁止、 該当事項なしは `(なし)` placeholder。

## 出力 path 早見

| `--layer` | 出力 path |
|---|---|
| `contract` | `tests/spec/contract/test-spec-{module}.md` |
| `e2e` | `tests/spec/e2e/test-spec-{module}.md` |
| `integration` | `tests/spec/integration/test-spec-{module}.md` |
| `unit` | `tests/spec/unit/test-spec-{module}.md` |
| `all` (default) | `tests/spec/test-spec-{module}.md` |

## 雛形 (そのまま流用)

```markdown
# test-spec-{module}.md

> Layer 1 (`/kiwa-design`) 出力 — Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play`) が消費する仕様書

## 対象機能

`{module 名}` — 1-2 文で「何をする機能か」を要約。

対象 file (もしあれば):

- `{path/to/contract.sol}` (contract 改変対象)
- `{path/to/api/route.ts}` (API endpoint)
- `{path/to/page.tsx}` (UI screen)

## 仕様の要約

### ユーザー操作

- {UI / CLI / API クライアントの観点で何ができるか 3-5 bullet}

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/...` | `{ ... }` | `{ ... }` |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| `mints` | `id`, `to`, `tokenId` | 1 tx (mint + index 同時) |

### 権限モデル

- {role 1} — {権限内容}
- {role 2} — {権限内容}

#### kiwa fixture inject 前提 (e2e layer のみ、 改善 2 / Issue #226)

`--layer e2e` 時、 kiwa fixture (`tests/prepare-env.ts` 経由の `dappE2eTest`) が wallet を auto-inject する前提を必ず明示する。 Layer 2 (`/kiwa-play`) が assertion 設計時に「wallet 未接続を前提とした test」 を緩和する判断材料にする。

format。

- `{state} 前提 — kiwa fixture が wallet auto-inject (default {wallet_count} wallet, chainId {chainId})。 wallet 未接続 state を再現するには {手段} を使う`

実例。

- `default 接続済 前提 — kiwa fixture が wallet auto-inject (default 1 wallet, chainId 31337)。 wallet 未接続 state を再現するには test 内で wallet を switchAccount() で剥がすか、 別 BrowserContext (injectMultipleWallets を使わず素の newContext) を使う`

contract layer (`--layer contract`) では本 sub-section を `(該当なし、 contract test に wallet inject 概念なし)` で埋める。

### 外部連携

- {3rd-party API / blockchain RPC / webhook}

### 失敗 mode

- {timeout 設定}
- {retry policy}
- {partial state からの復旧}
- {idempotency key 設計}

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `mint()` | 高 | 高 | 中 | 高 | 低 | 主要収益 fn + access control 経路 |
| `transfer()` | 低 | 中 | 高 | 中 | 低 | 不可逆 write、 owner check 必須 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | {何を unit で検証するか} | 境界値 / 入力バリデーション |
| 統合 | {何を integration で検証するか} | 状態遷移 / 冪等性 |
| E2E | {何を E2E で検証するか} | 正常系 / 異常系 / 権限 |

## UI feature 一覧 (e2e layer 必須、 contract layer は省略可)

e2e layer (`--layer e2e` or `--layer all`) では本 sub-section を **必ず埋める**。 `app/page.tsx` を grep して testid / button / form 入力 / state 表示要素を機械的に列挙し、 各 element に対応する TC を最低 1 件以上紐付けることで「spec author が UI 要素を忘れたまま Layer 2 / 3 に進む」 構造的問題を防ぐ。

| UI element 種別 | testid / 識別子 | 対応 TC | 備考 |
|---|---|---|---|
| button (action trigger) | `data-testid="connect-button"` | TC-001 | enabled / disabled / loading 3 state を別 TC で cover |
| button (action trigger) | `data-testid="mint-button"` | TC-005 / TC-006 | disabled (未接続時) / enabled (接続後) を分けて検証 |
| state display | `data-testid="status"` | TC-002 | `connected` / `disconnected` / `pending` の 3 値遷移 |
| state display | `data-testid="balance"` | TC-007 | 残高変化を polling 経由で観測する経路 |
| form input | `name="amount"` | TC-010 | 数値入力の境界値 (0 / max+1 / 負数) を含む |
| error display | `data-testid="error-message"` | TC-012 | onError 経由の error 表示、 testid 経路で assert |

埋め方の規約。

- testid / 識別子は **`grep -rn 'data-testid' app/ src/components/'` で実 grep した結果のみ**を記載 (推測で書かない)
- 「対応 TC」 列は当該 element を test する TC id を全件カンマ区切りで列挙 (1 件以上必須、 0 件は spec の欠落として扱う)
- button の `enabled` / `disabled` / `loading` 3 state は **別 TC として cover** する (1 TC で 3 state 兼ねない)
- form input は **境界値 (0 / max / 負数 / 空文字 / 異常値)** をそれぞれ別 TC で cover
- error display は **onError ハンドラ経由の表示経路** (simulateContract revert / RPC error / user reject 等) を別 TC で cover

(UI element が 1 件も無い場合 `(該当なし、 contract layer のみ)` 1 行で代替)

## テスト観点一覧

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点から選択 + e2e layer では新規 2 観点 (12 / 13) も評価する。

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 ({外部依存内容})
- 3. 境界値 — 適用 ({境界対象})
- 4. 状態遷移 — 適用 / 非適用
- 5. 権限 — 適用 / 非適用
- 6. 入力バリデーション — 適用 / 非適用
- 7. 冪等性 — 適用 / 非適用
- 8. 並行処理 — 適用 / 非適用
- 9. 性能 — 適用 / 非適用
- 10. セキュリティ — 適用 / 非適用
- 11. 回帰 — 適用 / 非適用
- 12. **UI feature 網羅 (e2e layer のみ)** — 適用必須 (testid / button state / error 表示 / form 入力境界の網羅性を検証)
- 13. **wallet 接続 flow (e2e layer のみ)** — 適用 / 非適用 (mock wallet 接続 / chain switch / account switch / 切断 flow)

## テストケース一覧

観点別グループ、 グループ内は優先度 (高 → 中 → 低) 順。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | 正常系 | wallet connected | tokenId 1 | mint() 呼び出し | owner == msg.sender、 tokenId 1 emit | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-002 | 統合 | 異常系 | RPC 503 | tokenId 1 | mint() 呼び出し | UI に再試行ボタン表示 | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-003 | 単体 | 境界値 | maxSupply = 100 | tokenId 100 | mint() 呼び出し | success、 tokenId 101 で revert(MaxSupplyExceeded) | 高 | 推奨 |

{該当観点を順に列挙、 case がない観点は section 内に `(なし)` 1 行のみ}

## 「期待結果」 column の layer 別意味 (本 sub-section は contract / e2e で読み替え必須)

9 column 表の「期待結果」 column は layer によって書くべき内容が異なる。 Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play`) が test code に変換する際の正確性を上げるため、 layer 別に以下の細分項目を **「期待結果」 セル内で 1-3 個カンマ区切り** で必ず明示する。

### contract layer (`--layer contract`) — 4 細分項目

| 細分項目 | 何を書くか | 例 |
|---|---|---|
| event emit | emit される event 名 + indexed param | `Transfer(from=0x0, to=msg.sender, tokenId=1)` |
| revert error | revert される custom error 名 + arg | `revert MaxSupplyExceeded(101)` |
| state 変化 | storage slot / mapping の before → after | `_owners[1] : address(0) → msg.sender` |
| return 値 | function return の具体値 | `return tokenId == 1` |

contract layer の「期待結果」 セル例。

```
emit Transfer(from=0x0, to=msg.sender, tokenId=1)、 _owners[1] : address(0) → msg.sender、 return tokenId == 1
```

### e2e layer (`--layer e2e`) — 4 細分項目

| 細分項目 | 何を書くか | 例 |
|---|---|---|
| UI 表示 | locator + 期待 text or 属性 | `getByTestId('status').toHaveText('connected')` |
| wallet state | account / chainId / balance の変化 | `walletClient.getBalance() : 1 ETH → 0.99 ETH (gas 込)` |
| on-chain state | block / contract storage の変化 | `publicClient.readContract({ abi, address, fn: 'balanceOf', args: [addr] }) === 1n` |
| 画面遷移 | URL or routing 変化 | `page.url() : /mint → /collection` |

e2e layer の「期待結果」 セル例。

```
getByTestId('status').toHaveText('connected')、 walletClient.getBalance() : 1 ETH → 0.99 ETH、 publicClient.readContract balanceOf === 1n
```

### contract / e2e の区別が無い場合 (`--layer all` / `--layer integration` / `--layer unit`)

contract / e2e 両方の細分項目を併記してよい。 ただし Layer 2 skill の変換精度が下がるため、 `--layer all` での運用は legacy compatibility 用とし、 新規 spec は `--layer contract` / `--layer e2e` のいずれかに倒すことを推奨する。

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。 Layer 2 skill が次フェーズで実装する。

- TC-001 (高) — E2E happy path mint
- TC-002 (高) — 統合 RPC error fallback
- TC-003 (高) — 単体 maxSupply boundary

## 手動確認でよいテスト

各ケース理由付き。

- TC-NNN — 理由: {まれな flow / UI のみ / 手動の方がコスト効率}

該当なしなら `(なし)`。

## 不足している仕様

skill が解消できなかった事項を bullet で列挙。 spec author に追加ヒアリングを要請する。

- `mint()` の `maxSupply` 値が仕様書に未定義
- `transfer()` の event topic 仕様が不明
- pause 時の既存 tx の扱い (revert / queue) が未定義

### runner 差異 (Foundry / Hardhat の制約) bullet

contract layer で「Foundry でしか cover できない / Hardhat でしか cover できない」 branch がある場合は、 必ず本 section に bullet として明示する。 Layer 2 skill (`/kiwa-forge` `/kiwa-hardhat`) の Step 5c で coverage 評価時に未踏 branch を検出した場合、 runner 制約由来であれば本 bullet を自動追加する。

format。

- `{branch_path} は {runner_a} only で cover、 {runner_b} は {制約理由} により未踏 (許容)`

実例 (PR #223 nextjs-token-gating より)。

- `GatedContent.sol:54 grantor == address(0) 分岐は Foundry vm.warp(0) でのみ再現可能、 Hardhat は block.timestamp 巻き戻し不可制約により未踏 (許容)`

該当なしなら `(なし)`。
```

## 雛形使用ルール

skill は本雛形を **そのまま流用** し、 以下を変える / 変えないを区別する。

| 変更可 | 変更禁止 |
|---|---|
| `{module 名}` 等の placeholder 置換 | section ヘッダ (`## 対象機能` 等) の文字列 |
| 表の column / 行追加 | column の名前 / 順序 |
| 観点の選択 (適用 / 非適用) | 観点の番号 / 名称 |
| TC-XXX の連番 | TC-XXX の prefix `TC-` |

section ヘッダ文字列が SSOT (`docs/SKILL-DESIGN.md` § 出力フォーマット) と一致しないと、 Layer 2 skill が parser でケース表を抽出できなくなる。

## placeholder 規約

該当事項がない時の `(なし)` placeholder は以下ルールで置く。

- section 単位で空 → section 直下に `(なし)` 1 行のみ
- 表の中身が空 → 表ヘッダのみ残し、 直後に `(なし)` 1 行追加
- bullet list が空 → `- (なし)` 1 bullet

完全空白 (`## section\n\n## section`) は禁止 (Layer 2 parser が section 境界を見失う)。

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § 出力フォーマット (9 section 順序固定)
- risk 表の埋め方: `references/risk-criteria.md`
- 観点選択: `references/viewpoints-catalog.md`
- Layer 2 連携: `references/layer2-bridge.md`
