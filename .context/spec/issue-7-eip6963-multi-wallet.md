# spec: issue-7-eip6963-multi-wallet

## タスクサマリ

EIP-6963 (Multi Injected Provider Discovery) announce 対応を実装し、1 page 内に複数 wallet (MetaMask / Rabby / Coinbase 名乗り) を並走 inject できるようにする。
全 wallet 同じ EIP-1193 provider を使い、`info` (uuid / name / icon / rdns) だけ変えて並走 announce する設計で、v0.2 マイルストーンの目玉機能。

## 受入条件 (AC)

- AC 1: `Eip6963ProviderInfo` (`uuid: string, name: string, icon: string, rdns: string`) と `WalletConfig` (`name: string, rdns: string, icon: string, privateKey: Hex, chainId?: number`) 型が `packages/core/src/types.ts` に export されている
- AC 2: `dappE2eTest` fixture に `wallets: WalletConfig[]` option が追加されており、未指定時は単一 wallet (現行 MetaMask 互換 default) で動作する (既存挙動互換、breaking なし)
- AC 3: `createInjectorScript` が複数 wallet を受け取り、各 wallet について `window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }))` を実行する (EIP-6963 仕様準拠、`info` は Object.freeze で immutable)
- AC 4: `window.addEventListener('eip6963:requestProvider', ...)` が登録され、dApp 側からの再 announce 要求に対して全 wallet が再度 announce する
- AC 5: `window.ethereum` は **最初の wallet のみ** inject される (legacy 互換維持、複数 wallet inject で `window.ethereum` 上書き競合を避ける)
- AC 6: vitest (`packages/core/tests/eip6963.test.ts` 新規) で announce event の dispatch / requestProvider listener / Object.freeze immutability / window.ethereum 単一 inject を検証し全 PASS
- AC 7: examples e2e (`examples/basic-connect/tests/eip6963.spec.ts` 新規) で 2 wallet 並走 inject + 各 wallet 個別 connect (異なる address 返却) を検証し全 PASS

## スコープ境界

### in (本 Issue で対応)

- `packages/core/src/types.ts` に `Eip6963ProviderInfo` + `WalletConfig` 型追加 (`InjectorOptions` への wallets array 追加含む)
- `packages/core/src/injector-script.ts` を multi-wallet 対応に拡張 (eip6963 announce + requestProvider listener)
- `packages/core/src/fixture.ts` に `wallets` option 追加、default 単一 MetaMask 互換
- `packages/core/src/fixture.ts` で各 wallet 用 RPC 経路 (`__dappE2eRpc_${rdns}` 形式) を `exposeFunction` で N 個登録
- `DappE2eApi` を multi-wallet 対応 (`api.wallets[rdns]` で wallet 別 triggerEvent / connect / disconnect、top-level method は最初の wallet を指して backwards compat)
- `packages/core/tests/eip6963.test.ts` 新規 (vitest unit、AC 3-6 検証)
- `examples/basic-connect/tests/eip6963.spec.ts` 新規 (E2E、AC 7 検証)
- `packages/core/src/index.ts` に `Eip6963ProviderInfo` / `WalletConfig` 型を public export
- `README.md` に EIP-6963 multi-wallet 章を追加
- `docs/EVENTS.md` に EIP-6963 announce 仕様を追記

### out (本 Issue で対応しない)

- wallet 種別ごとの個別 class 化 (`RabbyWallet` / `CoinbaseWallet` 等) — Non-Goal、`info` だけ差別化が正解
- 各 wallet で `chainId` を独立に持つ chainState 完全隔離 — 各 wallet が同 anvil port を共有する設計、chainId 別チェーンは Issue #16 setChainRegistry (v0.3)
- 各 wallet の異なる private key で独立 sign — `WalletConfig.privateKey` で実現するが、test 並列で各 wallet が独立 RpcContext を持つ仕組みは out (本 PR では同じ anvil chain 上で複数 wallet が独立 address を持つだけ)
- wagmi v2 + RainbowKit v2 の dApp での手動確認は完了条件に含めるが、本 PR 内で自動化しない (手動確認のみ)
- `window.ethereum` を multi wallet すべて inject (legacy 互換破壊) — 反例 5
- `wallets` option の動的追加 / 削除 API (`addWallet` / `removeWallet`) — 本 PR では fixture 初期化時の static 配列のみ
- CHANGELOG 自動更新 — Changesets で別途

### in/out 表

| 観点 | in (本 PR) | out (別 Issue / 不要) |
|---|---|---|
| 型定義 | `Eip6963ProviderInfo` + `WalletConfig` 追加 | wallet 種別 enum / class 階層 |
| injector-script | multi-wallet 並走 announce | wallet 別 provider class 化 |
| fixture | `wallets` option + 各 wallet RPC 経路 | wallet 別 chainState 完全隔離 |
| DappE2eApi | `wallets[rdns]` で wallet 別 method | 動的追加 / 削除 API |
| window.ethereum | 最初の wallet のみ inject | 全 wallet 同時 inject |
| test | vitest unit + e2e 2 wallet 並走 | wagmi/RainbowKit dApp 自動 e2e |

## 反例ケース (動かないはず・対象外)

- 反例 1: wallet 種別ごとに `RabbyWallet extends Wallet` のような class 階層を作る — Non-Goal、Issue #7 本文「wallet 種別ごとの個別 class 化」明示禁止、EIP-6963 で label 差別化が正解
- 反例 2: `eip6963:announceProvider` event の `detail.info` を mutable オブジェクトで送る — EIP-6963 仕様で `Object.freeze` 必須、frozen でないと wagmi が reject
- 反例 3: 複数 wallet を全て `window.ethereum` に同時 inject (上書き競合) — legacy 互換破壊、最後の wallet で覆われて他 wallet が dead
- 反例 4: `eip6963:requestProvider` listener なし (初回 announce のみ) — wagmi は connect 直前に `requestProvider` を再 dispatch する経路があり、listener 不在で wallet picker UI に表示されないケースがある
- 反例 5: `wallets` option 未指定で fixture を呼ぶと throw する — 既存 single wallet 経路の breaking、default で MetaMask 1 wallet を inject する設計が必須
- 反例 6: `info.uuid` を hardcoded で全 wallet 共通にする — EIP-6963 仕様で UUID は wallet ごとに unique 必須、`crypto.randomUUID()` で生成する
- 反例 7: `dappE2e.wallets[rdns]` が undefined を返した時に throw せず silent fail — multi wallet 設計の使い方ミスを検出できない、unknown rdns で明示 throw する

## 影響範囲 (touched file 候補)

新規 2 file:
- `packages/core/tests/eip6963.test.ts` (AC 6、vitest unit)
- `examples/basic-connect/tests/eip6963.spec.ts` (AC 7、E2E 2 wallet 並走)

修正 5 file:
- `packages/core/src/types.ts` (AC 1、`Eip6963ProviderInfo` + `WalletConfig` 型 + `InjectorOptions.wallets` 追加 + `DappE2eApi.wallets[rdns]` 拡張)
- `packages/core/src/injector-script.ts` (AC 3-5、multi-wallet announce + requestProvider listener + window.ethereum 単一 inject)
- `packages/core/src/fixture.ts` (AC 2、`wallets` option + 各 wallet RPC 経路 `__dappE2eRpc_${rdns}` + `DappE2eApi.wallets` 構築)
- `packages/core/src/index.ts` (AC 1、`Eip6963ProviderInfo` / `WalletConfig` public export)
- `README.md` (完了条件 6、EIP-6963 multi-wallet 章追加)
- `docs/EVENTS.md` (完了条件 7、EIP-6963 announce 仕様追記)

合計 7 file (新規 2 + 修正 5)。

grep ベース確認結果。

```text
packages/core/src/injector-script.ts:1-56  全 56 行 (現状 single wallet、multi-wallet 化で 100-150 行想定)
packages/core/src/fixture.ts:38-95  dappE2eTest extend + _rpcContext + dappE2e API
packages/core/src/types.ts:23-26  InjectorOptions (現状 privateKey + chainId)、78-93  DappE2eApi (現状 single)
packages/core/src/index.ts:1-8  current public exports
```

## 既知のリスク・前提

- リスク 1: `__dappE2eRpc_${rdns}` の関数名生成で rdns に `/`, `.`, 特殊文字が含まれると `exposeFunction` で invalid identifier として fail — sanitize ロジック (`io.metamask` → `io_metamask`) を fixture 内で実装、テストで sanitize logic を carve
- リスク 2: `Object.freeze` した `info` を wagmi 経路で再代入しようとすると TypeError — EIP-6963 仕様準拠だが、test では frozen 状態を `Object.isFrozen(info)` で assert すること
- リスク 3: 複数 wallet が同 anvil port を共有する場合の chainId 切替競合 — 本 PR では各 wallet が独立 `chainState` を持たない設計 (chainId 別チェーンは Issue #16)、複数 wallet で `wallet_switchEthereumChain` を同時呼出すると最後の wallet の chainId が反映される (これは本 PR scope の制約として明示)
- リスク 4: examples/basic-connect の Playwright fixture override で `wallets` option を渡すと既存 connect.spec.ts (single wallet 前提) が breaking — default 単一 MetaMask 互換維持で既存 test PASS を担保 (AC 2)、追加 e2e は新規 file `eip6963.spec.ts` で別ファイル化
- リスク 5: PR #22 で ci.yml 削除済のため PR 提出時の自動 test なし — host 側で `pnpm typecheck && pnpm test && pnpm build` を実行して結果を PR 本文に記載する運用 (docs/RELEASING.md L55 準拠)
- リスク 6: AC 数 7 件 + 影響 7 file + 推定 90-120 分は粒度判定で **赤 (分割推奨)** に該当する可能性 → ただし v0.2 マイルストーン目玉機能で 1 PR 完結が要件、分割すると EIP-6963 spec 不整合 (announce + requestProvider listener + window.ethereum 単一 inject の 3 つは密結合) のため単発で進行
- 前提 1: `RpcContext` は既に `approvalMode?: { current: ApprovalMode }` optional 化済 (PR #23 merge 済)、本 PR の各 wallet RpcContext も `approvalMode` を引き継ぐ
- 前提 2: `Eip1193Error` (types.ts L13-21) と `BLOCKED_METHODS` (rpc-handlers.ts L19-25) は既存、本 PR で再利用
- 前提 3: `crypto.randomUUID()` はモダンブラウザの標準 API、Playwright headless でも利用可能

## 粒度判定

- AC 数: 7 (推奨 3-5 を超過、黄〜赤)
- 影響ファイル数: 7 (推奨 5 以下を超過、黄)
- 推定実装時間: 約 90-120 分 (Phase 1 型定義 15 分 + Phase 2 injector-script 30 分 + Phase 3 fixture 30 分 + Phase 4 vitest+e2e 30 分 + Phase 5 docs 15 分、推奨 30 分超過、赤)

**判定: 赤 (分割推奨)** — AC 7 + file 7 + 90-120 分は単発 Issue では大きい。
ただし v0.2 マイルストーン目玉機能で EIP-6963 announce + requestProvider listener + window.ethereum 単一 inject の 3 つは密結合 (分割すると spec 不整合)、Issue #7 本文も 7 AC 一括の単発設計。
本 PR で単発実装する方針、PR 内でレビュー round が 2-3 回発生する想定 (setApprovalMode と同じパターン)。
