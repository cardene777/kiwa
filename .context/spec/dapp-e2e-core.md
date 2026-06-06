# spec: kiwa-core

## タスクサマリ

dApp 向け Playwright E2E テストツール `kiwa` のコア機能を構築する。
viem を `peerDependencies` で取り扱い、`window.ethereum` mock injector が EIP-1193 主要 10 RPC と 4 event を満たし、anvil への TX broadcast / receipt 取得 / revert handling まで含む「使える状態」の dApp E2E 基盤を 1 Issue で完結させる (壁打ち 20260602T091702 合意、論点 C で粒度赤を許容)。

## 受入条件 (AC)

- AC 1: `pnpm install && pnpm -F @kiwa/core build` が green で型エラーなし
- AC 2: `dappE2eTest` fixture が `window.ethereum` を inject し、**10 RPC** (`eth_requestAccounts` / `eth_accounts` / `eth_chainId` / `eth_blockNumber` / `net_version` / `personal_sign` / `eth_signTypedData_v4` / `wallet_switchEthereumChain` / `wallet_addEthereumChain` / `eth_sendTransaction`) を viem `LocalAccount` 経由で応答する
- AC 3: `dappE2eTest` fixture が **4 event** (`accountsChanged` / `chainChanged` / `connect` / `disconnect`) を `window.ethereum.on(event, handler)` で emit し、`switchChain` / `disconnect` / `connect` 操作で発火する
- AC 4: `eth_sendTransaction` が anvil への TX broadcast を実行し、`eth_getTransactionReceipt` で receipt 取得まで成功する (revert 時は EIP-1193 code 3 で reject)
- AC 5: `examples/basic-connect` の Playwright test 6 本 (接続 / `personal_sign` / `eth_signTypedData_v4` / `eth_sendTransaction` / chain switch / `accountsChanged` 受信) が `pnpm -F examples-basic-connect test` で green
- AC 6: anvil 起動 / 終了が fixture lifecycle (`beforeAll` / `afterAll`) で管理され、port 衝突時は自動採番される
- AC 7: foundry 未インストール時に `pnpm -F @kiwa/cli doctor` が `anvil not found` を非ゼロ exit で報告する
- AC 8: `packages/core/package.json` で viem を `peerDependencies viem ^2` + `devDependencies viem ^2.21` として宣言し、runtime install では viem を巻き込まない (`pnpm install --filter @kiwa/core --prod` で viem が node_modules に入らないこと)

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| パッケージ構成 | `packages/core` / `packages/cli` / `examples/basic-connect` の pnpm workspace |
| mock wallet | viem `LocalAccount` ラップの injector (10 RPC) |
| Playwright fixture | `dappE2eTest` (extend 形式) + anvil lifecycle 管理 + page.exposeFunction で Node 側 dispatch |
| Event emit | `EventEmitter` パターンで `accountsChanged` / `chainChanged` / `connect` / `disconnect` を emit、fixture API で trigger 可能 |
| TX 系 | viem `createWalletClient` + `sendTransaction` で anvil に broadcast、receipt 取得、revert は EIP-1193 code 3 で reject |
| sample test | `examples/basic-connect` 6 本 (接続 + personal_sign + signTypedData_v4 + sendTransaction + chain switch + accountsChanged) |
| CLI | `kiwa doctor` の foundry 検出 |
| viem 戦略 | `peerDependencies viem ^2` + `devDependencies viem ^2.21` (runtime 巻き込みなし) |
| README | viem MIT クレジット 1 行 + Non-Goals 明記 |
| CI | GitHub Actions で `pnpm test` 1 job (playwright browser cache 含む) |

### out (別 Issue or 非対象)

| 観点 | out |
|---|---|
| 実 MetaMask 拡張統合 (Synpress 経路) | 別 Issue E (リグレッション層) |
| assertion DSL (`toBeMined` / `toEmit` 等の `expect.extend`) | 別 Issue D |
| `kiwa init` の雛形生成 CLI | 別 Issue F |
| Rabby / Coinbase Wallet 専用 adapter | v0.2 (本 MVP は MetaMask 互換 EIP-1193 のみ) |
| WalletConnect v2 / EIP-4337 Smart Account / multi-chain 同時 / visual regression / Solidity unit test | 全体 Non-Goal (README 明記) |
| `eth_subscribe` / WebSocket subscription | 別 Issue (本 MVP は HTTP RPC のみ) |
| EIP-712 nested struct hashing の手動実装 | viem に委譲 (本ツールで車輪の再発明しない) |
| Hardware wallet 連携 (Ledger / Trezor) | 全体 Non-Goal |
| GraphQL / Subgraph 連携 | 全体 Non-Goal |

## 反例ケース (動かないはず・対象外)

- 反例 1: `eth_subscribe` を呼ぶ test は本 Issue では未実装、`{ code: 4200, message: 'method not supported: eth_subscribe' }` で reject する (別 Issue 待ち、HTTP RPC 縛り)
- 反例 2: Synpress 経由の実 MetaMask テストは本 Issue のスコープ外、`packages/synpress-adapter` は存在しない (Issue E で別途対応)
- 反例 3: WalletConnect QR ペアリングは Non-Goal、`@walletconnect/*` を依存に入れない (依存追加 PR は reject 対象)
- 反例 4: `assertion DSL` (`expect(tx).toBeMined()`) は本 Issue 未実装、ユーザーは `expect.poll(() => provider.getTransactionReceipt(hash))` で代替する (Issue D で別途対応)
- 反例 5: viem を `dependencies` (runtime) に入れる PR は AC 8 違反、本 Issue では `peerDependencies` + `devDependencies` の 2 段構成のみ許容 (vendor 化議論は壁打ち 20260602T091702 論点 A で却下済み)

## 影響範囲 (touched file 候補)

リポジトリは既に scaffolding 18 file が untracked 状態 (Issue #1 RED 完了)。新 MVP では 追加 / 修正で計 32 file 程度。

### 維持 + 拡張 (既存 untracked から流用)

| ファイル | 状態 |
|---|---|
| `/Users/cardene/Desktop/projects/kiwa/package.json` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/pnpm-workspace.yaml` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/tsconfig.base.json` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/.gitignore` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/package.json` | **修正** (peerDependencies viem ^2 に変更) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tsconfig.json` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tsup.config.ts` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/vitest.config.ts` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/types.ts` | **拡張** (10 RPC + event type 追加) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/index.ts` | **拡張** (10 RPC dispatch + event emitter export) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/injector.test.ts` | **拡張** (6 → 14 ケース、新規 6 RPC + 反例) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/anvil.test.ts` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/packages/cli/*` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/package.json` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/tsconfig.json` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/playwright.config.ts` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/tests/connect.spec.ts` | **拡張** (3 → 6 ケース、signTypedData / sendTransaction / accountsChanged) |

### 新規追加 (本 Issue で増える file)

| ファイル | 用途 |
|---|---|
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/fixture.ts` | Playwright `test.extend` で `dappE2eTest` fixture、page.exposeFunction で Node 側 dispatch |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/injector-script.ts` | `createInjectorScript` 専用、page context で `window.ethereum` proxy を立てる pure JS 文字列 |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/anvil.ts` | anvil child_process spawn / SIGTERM / port 採番 (`startAnvil` / `getFreePort` の実体、現状は index.ts に stub) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/rpc-handlers.ts` | 10 RPC dispatch table + 反例ハンドラ (`method not supported`) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/event-emitter.ts` | EventEmitter ラップ (`accountsChanged` / `chainChanged` / `connect` / `disconnect`) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/src/tx.ts` | `eth_sendTransaction` 専用、viem `createWalletClient` + anvil broadcast |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/event-emitter.test.ts` | 4 event 単体テスト |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/tx.test.ts` | TX broadcast + receipt + revert 単体テスト (anvil 実 spawn) |
| `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/fixture.test.ts` | fixture 単体テスト (page.exposeFunction の wire-up) |
| `/Users/cardene/Desktop/projects/kiwa/packages/cli/package.json` | 既存維持 |
| `/Users/cardene/Desktop/projects/kiwa/packages/cli/src/index.ts` | doctor 実装 (現状 stub) |
| `/Users/cardene/Desktop/projects/kiwa/README.md` | **修正** (viem MIT クレジット + Non-Goals + quickstart) |
| `/Users/cardene/Desktop/projects/kiwa/.github/workflows/ci.yml` | 新規 (pnpm install + playwright browser cache + 全 test) |
| `/Users/cardene/Desktop/projects/kiwa/LICENSE` | 新規 (MIT、本ツール自体のライセンス) |

合計 — 既存維持 17 + 修正 5 + 新規追加 14 = **36 file (うち変更対象 19 file)**

## 既知のリスク・前提

### viem peerDependencies 戦略

- `packages/core/package.json` で `peerDependencies viem ^2` を宣言、`dependencies` には入れない
- `devDependencies viem ^2.21` で開発時に固定 version 利用、lockfile pin
- これにより `pnpm install --filter @kiwa/core --prod` で viem が巻き込まれない (AC 8 検証可能)
- ユーザー dApp プロジェクト側で viem 既存なら再利用、なければユーザーが install (peer warn 表示)
- README に「viem ^2 が必要」と明記

### `eth_sendTransaction` の TX broadcast 戦略

- viem `createWalletClient({ chain: anvil, transport: http(\`http://127.0.0.1:\${port}\`), account })` で anvil に直接 broadcast
- `sendTransaction({ to, value, data })` の戻り hash を test 側で `waitForTransactionReceipt` 可能
- revert 時は viem の `BaseError` を catch し EIP-1193 code 3 (transaction rejected) で reject
- gas 推定は viem 任せ (`estimateGas`)、本ツールで gas oracle は実装しない

### event emit の wire-up

- Node 側 `EventEmitter` で 4 event を管理
- page context への propagation は fixture (`page.exposeFunction('__dappE2eEvent', (event, args) => ...)`) で Node → page 方向の呼び出しを実現
- page 側 `window.ethereum.on('accountsChanged', cb)` は内部 `Map<string, Function[]>` で listener 管理、`__dappE2eEvent` で trigger
- fixture API として `await test.dappE2e.triggerEvent('accountsChanged', [newAddress])` を公開

### page.exposeFunction での Node 委譲

- injector script は page context で動く pure JS 文字列、内部で `window.__dappE2eRpc(request)` を呼ぶだけの thin proxy
- `__dappE2eRpc` は fixture が `page.exposeFunction` で Node 側 `handleRpcRequest(ctx, request)` を proxy 登録
- これにより page context に viem を bundle 不要、暗号実装は Node 側 viem に完全委譲
- 副作用 — `createInjectorScript` 単体では動かず fixture 経由が必須 (RED test T-E2E は fixture 経由に書き換え)

### 既存 RED テスト流用方針

- 既存 13 RED test のうち T-INJ-001〜005 / T-ANV-001〜004 (9 件) は新 MVP でも有効、流用
- T-INJ-006 (`script.includes('window.ethereum')`) は contract test として維持、ただし `createInjectorScript` 単体動作は不要 (fixture 経由前提なのでテスト名を変更してもよい)
- T-E2E-001〜003 (3 件) は fixture 経由 (`dappE2eTest`) に書き換える、テスト自体は同じ 3 ケース (window.ethereum 存在 / 接続 / personal_sign)
- 追加 RED は新規 6 RPC + 4 event + TX 系で計 8 ケース程度 (合計 13 + 8 = 21 ケース、これに event-emitter / tx / fixture 単体を加えて 30 ケース前後)

### 粒度判定

- AC 数: 8 件 (推奨 3-5 上限を大幅超、定量基準上は **赤**)
- 変更対象 file 数: 19 file (推奨 5 以下を大幅超、定量基準上は **赤**)
- 推定実装時間: 80 分 (8 AC × 10 分、定量基準 60 分超で **赤**)

定量判定: **赤 (分割推奨レベル)**

ただし以下の理由で単発 Issue 化を許容する (壁打ち 20260602T091702 論点 C 合意):

- ユーザー明示「一番理想の構成をとって完璧に dApp の E2E ができるようにしたい」要望に応える
- 4 RPC だけの分割案では「使える状態」にならず、wagmi/RainbowKit が動かない MVP は実用不可
- 既存 RED 13 件流用で実装コストは部分的に圧縮済み (scaffolding は完了)
- 後続 Issue は D (assertion DSL) / E (Synpress) / F (CLI init) の 3 件に縮約、B/C は本 Issue に統合
- 並走 case (Issue #1 = 4 RPC + Issue #2 = 拡張) は test の流用 / 整合性確認コストが大きく一括の方が clean

### 後続 Issue 候補 (本 Issue green 後)

- Issue D: assertion DSL (`expect.extend` で `toBeMined` / `toEmit` 等)
- Issue E: Synpress adapter (実 MetaMask 経路)
- Issue F: CLI init (`kiwa init` 雛形生成、Next.js / Vite template 対応)

### Non-Goals (README 明記)

- WalletConnect v2 / EIP-4337 Smart Account / multi-chain 同時 / visual regression / Solidity unit test
- Hardware wallet (Ledger / Trezor) / GraphQL / Subgraph
- `eth_subscribe` / WebSocket subscription
- vendor 化 (viem コードを本ツール内に取り込む方針は壁打ち 20260602T091702 論点 A で却下、peerDeps 戦略のみ)
