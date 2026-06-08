# spec: kiwa-mvp-foundation

## タスクサマリ

dApp 向け Playwright E2E テストツール `kiwa` の MVP foundation を構築する。
viem ベースの mock wallet injector を `window.ethereum` に注入する Playwright fixture を `@kiwa/core` として実装し、anvil 起動と最小 sample test (アカウント接続 + personal_sign) が CI で green になることを到達点とする。

## 受入条件 (AC)

- AC 1: `pnpm install && pnpm -F @kiwa/core build` が green で型エラーなし
- AC 2: `dappE2eTest` fixture が `window.ethereum` を inject し、`eth_requestAccounts` / `eth_accounts` / `personal_sign` / `wallet_switchEthereumChain` の 4 RPC を viem `LocalAccount` 経由で応答する
- AC 3: `examples/basic-connect` の Playwright test (アカウント接続 → personal_sign 検証) が `pnpm -F examples-basic-connect test` で green
- AC 4: anvil 起動 / 終了が fixture lifecycle (`beforeAll` / `afterAll`) で管理され、port 衝突時は自動採番される
- AC 5: foundry 未インストール時に `pnpm -F @kiwa/cli doctor` が `anvil not found` を非ゼロ exit で報告する

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| パッケージ構成 | `packages/core` / `packages/cli` / `examples/basic-connect` の pnpm workspace 雛形 |
| mock wallet | viem `LocalAccount` ラップの injector (4 RPC のみ実装) |
| Playwright fixture | `dappE2eTest` (extend 形式) + anvil lifecycle 管理 |
| sample test | `examples/basic-connect` 1 本 (接続 + personal_sign) |
| CLI | `kiwa doctor` の foundry 検出のみ (init は後続 Issue) |
| CI | GitHub Actions で `pnpm test` 1 job |

### out (別 Issue or 非対象)

| 観点 | out |
|---|---|
| 実 MetaMask 拡張統合 (Synpress 経路) | 別 Issue (リグレッション層) |
| `eth_sendTransaction` / `eth_signTypedData_v4` / `wallet_addEthereumChain` | 別 Issue (RPC 拡張、AC 2 の 4 RPC 以外) |
| `accountsChanged` / `chainChanged` / `disconnect` イベント emit | 別 Issue (イベント層) |
| Playwright `expect.extend` で `toBeMined` 等の dApp matcher | 別 Issue (assertion DSL) |
| `kiwa init` の雛形生成 CLI | 別 Issue (CLI 拡張) |
| Rabby / Coinbase Wallet 対応 | v0.2 / 別 Issue (EIP-1193 抽象は AC 2 の injector 設計時点で開けておく) |
| WalletConnect v2 / EIP-4337 Smart Account / multi-chain 同時 / visual regression / Solidity unit test | MVP 全体の Non-Goal (README 明記) |

## 反例ケース (動かないはず・対象外)

- 反例 1: `eth_sendTransaction` を呼ぶ test を書いても本 Issue では実装されておらず failed RPC で reject する (別 Issue 待ち、injector は `method not supported` を返す)
- 反例 2: Synpress 経由の実 MetaMask テストは本 Issue のスコープ外、`packages/synpress-adapter` は存在しない
- 反例 3: WalletConnect QR ペアリングは MVP Non-Goal、`@walletconnect/*` を依存に入れない (依存追加 PR は reject 対象)

## 影響範囲 (touched file 候補)

リポジトリは初期状態 (`README.md` のみ) のため新規作成が大半。

新規:
- `/Users/cardene/Desktop/projects/kiwa/package.json` (workspace root)
- `/Users/cardene/Desktop/projects/kiwa/pnpm-workspace.yaml`
- `/Users/cardene/Desktop/projects/kiwa/tsconfig.base.json`
- `/Users/cardene/Desktop/projects/kiwa/packages/core/package.json`
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/injector.ts` (`window.ethereum` injector 本体)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/fixture.ts` (Playwright `test.extend`)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/anvil.ts` (anvil child_process 起動 / 終了)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/types.ts` (EIP-1193 型)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/injector.test.ts` (unit)
- `/Users/cardene/Desktop/projects/kiwa/packages/cli/package.json`
- `/Users/cardene/Desktop/projects/kiwa/packages/cli/src/index.ts` (doctor サブコマンド)
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/package.json`
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/playwright.config.ts`
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/tests/connect.spec.ts`
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/index.html` (mini dApp UI)
- `/Users/cardene/Desktop/projects/kiwa/.github/workflows/ci.yml`

修正:
- `/Users/cardene/Desktop/projects/kiwa/README.md` (概要 + Non-Goals 明記)

合計約 16 file、うち新規 15、修正 1。

## 既知のリスク・前提

- viem `LocalAccount` は `personal_sign` を `signMessage` でカバーするが、prefix `\x19Ethereum Signed Message:\n` の付与は viem が自動でやる前提
- anvil は foundry 同梱 (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)、未インストール環境は `doctor` で案内 (AC 5)
- Playwright fixture は `extend` 形式で `test` / `expect` を再 export、ユーザ側で `import { test, expect } from '@kiwa/core'`
- mock wallet は decentralised secret 管理を行わない (test 専用 `privateKey` は fixture option で受け取り、CI では anvil default key 固定可)
- 粒度判定: AC 5 件 / file 16 / 推定 60 分 → 黄判定境界。MVP を 1 Issue 単発で進める方針 (User: system-reminder で reasonable call 続行指示あり)

## 粒度判定

- AC 数: 5 (推奨 3-5 上限)
- 変更ファイル数: 16 (推奨 5 以下を大幅超)
- 推定実装時間: 50 分 (5 AC × 10 分)

判定: **黄〜赤の境界**。ただし以下の理由で単発 Issue 化を許容する。
- リポジトリが空でファイル分割の判断軸 (機能境界) が今ない
- 16 file のうち 14 は scaffolding (package.json / config) で機能ロジックは injector / fixture / anvil の 3 file 集中
- 単発で foundation を固めないと後続 Issue (RPC 拡張 / Synpress / assertion DSL) が並行できない

次 Issue 候補 (本 Issue green 後):
- Issue B: RPC 拡張 (`eth_sendTransaction` / `eth_signTypedData_v4` / `wallet_addEthereumChain`)
- Issue C: イベント emit (`accountsChanged` / `chainChanged` / `disconnect`)
- Issue D: assertion DSL (`expect.extend` で `toBeMined` 等)
- Issue E: Synpress adapter (実 MetaMask 経路)
- Issue F: CLI 拡張 (`kiwa init` 雛形生成)
