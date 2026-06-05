# dapp-e2e

dapp-e2e は anvil をローカルで起動して使う headless な E2E test fixture for dApps です。
Playwright と viem を組み合わせ、ブラウザ拡張なしで `window.ethereum` を inject し、
anvil の dev account を使った接続、署名、送金までを 1 つの fixture で通せます。
実 MetaMask UI の確認は別ツールに任せ、本ツールは CI 上で安定して動く E2E に集中します。
比較の考え方は [docs/COMPARISON.md](./docs/COMPARISON.md) にまとめています。

## Quickstart

以下の手順は v0.1.0 が npmjs.com に publish された後に動作します。
publish 前に手元で試したい場合は、本リポジトリを clone して `pnpm install && pnpm -F @dapp-e2e/core -F @dapp-e2e/cli build` を実行し、`node packages/cli/dist/index.js init` を直接呼び出してください。

```bash
pnpm dlx @dapp-e2e/cli init
pnpm install
pnpm exec playwright test
```

`init` は `e2e/connect.spec.ts` と `playwright.config.ts` を生成します。
`package.json` が存在する場合は `scripts.test:e2e` と必要な `devDependencies` も追記します。
既存 file と衝突する場合は上書きせず停止し、`--force` を明示したときだけ置き換えます。

### 生成される最小構成

1. `e2e/connect.spec.ts`
   `window.ethereum` の接続、署名、送金を確認する Playwright spec です。
2. `playwright.config.ts`
   `./e2e` を対象にした headless Chromium 設定です。
3. `package.json` の補助更新
   既存 `package.json` があるときだけ、`test:e2e` と peer 依存に合わせた開発依存を追加します。

### 想定している前提

- Node.js 20 以上
- pnpm
- Playwright が利用できるローカルまたは CI 環境
- `anvil` (Foundry) がインストール済みで PATH から実行できる状態

## Multi-Wallet (EIP-6963)

dapp-e2e は EIP-6963 (Multi Injected Provider Discovery) に対応しており、1 page 内に複数 wallet を並走 inject できます。
wagmi v2 / RainbowKit v2 の wallet picker UI でも正しく検出されます。

### 利用例

```typescript
import { dappE2eTest } from '@dapp-e2e/core';

const test = dappE2eTest.extend({
  wallets: [
    {
      name: 'MetaMask',
      rdns: 'io.metamask',
      icon: 'data:image/svg+xml;base64,...',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    },
    {
      name: 'Rabby',
      rdns: 'io.rabby',
      icon: 'data:image/svg+xml;base64,...',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    },
  ],
});

test('multi wallet picker', async ({ page, dappE2e }) => {
  await dappE2e.wallets!['io.rabby'].connect();
});
```

`wallets` option 未指定時は単一 MetaMask 互換 wallet で動作します (既存挙動互換)。

## Features

### Wallet / RPC / Fixture

- anvil を test 単位で直接 spawn し、 ローカル chain を隔離して扱える
- `eth_requestAccounts` など 9 RPC を core が直接処理し、 その他は anvil JSON-RPC へ forward する
- `viem` を peerDependency に寄せ、 host project 側で version を一元管理できる
- `dappE2e.triggerEvent()` と `connect()` `disconnect()` `switchChain()` で page 側 event を制御できる
- Playwright fixture が anvil 起動、 inject script、 終了処理までを自動化する
- error envelope で EIP-1193 の `code` と `message` を page 境界の先まで保持できる
- CLI `init` だけで fixture import 済みの雛形を作れる
- EIP-6963 multi-wallet announce (wagmi v2 / RainbowKit v2 picker 対応)

### Test helper (v0.2 以降)

業界標準 (hardhat / foundry / viem / hardhat-chai-matchers) と並ぶ 7 helper を core に集約:

| helper | 用途 |
|---|---|
| `snapshotChain(client)` / `revertChain(client, id)` | `evm_snapshot` / `evm_revert` wrapper、 test 間隔離 |
| `expectCustomError(error, errorName)` | viem `BaseError` + `ContractFunctionRevertedError` chain walk、 custom error 検証を 1 関数化 |
| `increaseTime(client, sec)` / `mineBlock(client, n?)` / `setNextBlockTimestamp(client, ts)` | 時間操作 helper (vesting / TTL / timelock 系) |
| `impersonateAccount(client, addr)` / `setBalance(client, addr, wei)` | 任意 EOA / contract への impersonate と balance 注入 |
| `startAnvilFork(options)` | `anvil --fork-url` の thin wrapper、 mainnet/sepolia fork test |
| `expectEvent(receipt, abi, eventName, expectedArgs?)` | `decodeEventLog` + assertion 統合 |
| `expectBalanceChange(client, token, account, delta, action)` / `expectEthBalanceChange` | hardhat-chai-matchers 互換 API |

### Claude Code skill (Claude 利用者向け)

`.claude/skills/dapp-e2e-test/` に skill `/dapp-e2e-test` を同梱しており、 Claude Code から呼び出すと test 仕様書生成 → 実装 → 4 round 連続 PASS 検証までを構造化フローで進められる。
詳細は [.claude/skills/dapp-e2e-test/SKILL.md](./.claude/skills/dapp-e2e-test/SKILL.md) を参照。

### スコープ

ブラウザ拡張なしで完結する headless 実行を優先しているため、 wallet extension の popup 操作や UI 差分の確認よりも、 dApp 側の接続フローを CI 上で安定して検証したい場面に向いています。

## Examples

`examples/` 配下に 19 個の参考実装があり、 合計 159 test が全て PASS する状態で main にあります。
全 example が 4 round 連続 PASS の flaky 0 件状態で安定化済みです (合計 636 assertion green)。
自分の dApp 種別に近い example を起点に、 dapp-e2e の使い方をコピペで掴めます。

### Framework 統合 (Next.js / Vite から始める場合)

| example | 用途 | wagmi feature | tests |
|---|---|---|---|
| [`examples/nextjs-wagmi-rainbow`](./examples/nextjs-wagmi-rainbow) | Next.js 14 App Router + wagmi v2 + RainbowKit で connect + mint | `useAccount` / `useReadContract` / `useWriteContract` | 4 |
| [`examples/vite-react-wagmi`](./examples/vite-react-wagmi) | Vite 5 + React 18 + wagmi v2 + RainbowKit の SPA 版 | 同上、 `vite preview` で production build を test | 3 |

### dApp カテゴリ別 (NFT / DeFi / Governance / Multi-chain)

| example | 用途 | wagmi feature | tests |
|---|---|---|---|
| [`examples/nextjs-erc1155-game`](./examples/nextjs-erc1155-game) | ERC1155 で game item 3 種 (Sword / Shield / Potion) を batch mint / transfer + burn | `balanceOfBatch` / `mintBatch` / `safeBatchTransferFrom` / burn | 8 |
| [`examples/nextjs-multi-chain`](./examples/nextjs-multi-chain) | Mainnet / Optimism / Base sim 3 chain を anvil 並走で切替 + chain 独立性検証 | `useSwitchChain` / `useChainId` / chain 別 transport / `startAnvilCluster` で multi-chain test | 6 |
| [`examples/nextjs-permit-swap`](./examples/nextjs-permit-swap) | EIP-2612 permit で gasless approve + 1 tx swap + deadline 経過 revert | `useSignTypedData` (EIP-712) + `useWriteContract` | 6 |
| [`examples/nextjs-dao-vote`](./examples/nextjs-dao-vote) | Compound 風 Governor で delegate / propose / vote / timelock execute / quorum / DaoExecutionTarget access control | `useWriteContract` × delegate/propose/castVote、 切り上げ quorum + msg.sender == dao guard | 10 |
| [`examples/nextjs-lending`](./examples/nextjs-lending) | Aave 風 lending で supply / borrow / repay / liquidation / max LTV / health factor | LTV 75% / `healthFactor` / multi-step approve+supply+borrow + approve なし supply revert + 清算 path | 10 |
| [`examples/nextjs-staking`](./examples/nextjs-staking) | Lido / Convex 風 staking で stake / claim / unstake + reward accrual + reward overflow + 早期 unstake penalty | block 経過に応じた `pendingReward` + `refetchInterval` で auto refetch + approve なし stake revert | 12 |
| [`examples/nextjs-bridge`](./examples/nextjs-bridge) | ERC20 cross-chain lock / operator relay mint (L1 sim → L2 sim) + L2→L1 reverse path + operator auth + replay 防御 | 2 anvil 並走 + chainId 別 useReadContract で L1/L2 同時 watch + UI 経由 burn-button | 10 |
| [`examples/nextjs-aa-smart-account`](./examples/nextjs-aa-smart-account) | Account Abstraction (ERC-4337 簡略版) で smart account deploy / execute / paymaster sponsor / ERC-1271 sig 検証 / batch / guardian recovery + ownerEpoch で stale recovery 防御 | deterministic create2 + counterfactual address + paymaster 経由 execute + isValidSignature MAGICVALUE | 10 |
| [`examples/nextjs-ens-resolver`](./examples/nextjs-ens-resolver) | ENS-like 名前解決 (forward name → address + reverse address → name + collision 検証) を 1 contract 簡略実装 | useReadContract refetchInterval で resolved/reverseName を自動更新 | 7 |
| [`examples/nextjs-event-history`](./examples/nextjs-event-history) | 過去 event 履歴取得 (Subgraph 代替) + watchContractEvent + multi-param indexed filter | publicClient.getLogs 1.5s polling + useWatchContractEvent (eth_subscribe は dapp-e2e fixture で reject、 subscribe 経路は動作保証外) | 7 |
| [`examples/nextjs-token-gating`](./examples/nextjs-token-gating) | NFT 所有判定で content / feature access 制御 + TTL grantTimedAccess + transfer 連動 revoke + grantor 再検証 | GateNFT.balanceOf チェック + GatedContent.getSecret revert/allow + publicClient.simulateContract で pre-check | 8 |
| [`examples/nextjs-zk-verifier`](./examples/nextjs-zk-verifier) | ZK commit-reveal scheme verifier + range proof variant (off-chain commitment 生成 + on-chain verify) を最小実装 | viem keccak256 + encodePacked で client commitment + CommitmentVerifier.verify + RangeProofVerifier | 7 |
| [`examples/nextjs-vesting`](./examples/nextjs-vesting) | Token release schedule (cliff + linear vesting + schedule immutability) を anvil 時間操作で test | `publicClient.request({ method: 'evm_increaseTime' })` + `evm_snapshot` / `evm_revert` で test 毎に時間軸 isolation + cliff 前 no-op / partial / full / 二重 claim 0 / 第三者 wallet release / vestedAmount 境界値検証 | 9 |

### 低レベル RPC + 単純な dApp (inline HTML、framework 抜きで動作確認したい場合)

| example | 用途 | 検証範囲 | tests |
|---|---|---|---|
| [`examples/basic-connect`](./examples/basic-connect) | `window.ethereum` 直叩きで connect / sign / sendTx / EIP-6963 / reject 経路 / mode 切替 | `personal_sign` / `eth_signTypedData_v4` / `eth_sendTransaction` / `eth_subscribe` reject (code 4200) / multi-wallet announce / `setApprovalMode('reject')` で code 4001 / accept 切替後の再 sign 成功 | 15 |
| [`examples/mint-nft`](./examples/mint-nft) | ERC721 mint flow + batch mint + supply cap + EIP-2981 royalty を inline HTML で | `mint` / `balanceOf` / `transferFrom` / Transfer event / royaltyInfo | 8 |
| [`examples/nft-marketplace`](./examples/nft-marketplace) | listing + buy + offer + double-listing + royalty split + seller/buyer 2 actor flow | viem 経由で 2 wallet 操作 + dapp-e2e で viewer page 検証、 `InsufficientPayment` custom error revert | 12 |
| [`examples/defi-swap`](./examples/defi-swap) | ERC20 approve → 1:1 swap + reject 経路 + slippage / 流動性不足 | `setApprovalMode('reject')` で UI レベルの user reject | 7 |

### 構成パターン (実装ヒント)

framework 統合 example はいずれも以下の共通構成です。

- `lib/wagmi.ts` で `createConfig` + `connectorsForWallets([injectedWallet])` (MetaMask SDK を bundle から除外して webpack の Invalid token error を回避)
- `tests/prepare-env.ts` で anvil 起動 + contract deploy + `.env.local` に address 書き込み (`NEXT_PUBLIC_RUNTIME_MODE=test` もここで付与)
- `tests/global-setup.ts` は no-op (Playwright の globalSetup slot を維持するための placeholder)
- `tests/fixture.ts` で `dappE2eTest` を extend し `_anvilHandle` を外部 anvil に override
- `playwright.config.ts` で `webServer.command: tsx tests/prepare-env.ts && pnpm build && pnpm start` (production server。`pnpm dev` は webpack chunk 404 を踏むため避ける)
- `tests/global-teardown.ts` で `killAnvilFromPidFile('.context/anvil.pid')` を呼び、prepare-env が残した anvil を teardown で回収
- 各 test 冒頭で `ensureConnected(page)` helper で RainbowKit autoConnect を待つ

詳細は `examples/nextjs-wagmi-rainbow/` を Stage 1 の base、`examples/nextjs-lending/` を Stage 2 の代表として参照してください。

## Documentation

公開ドキュメント (Quickstart / Concepts / API Reference / Cookbook / FAQ 5 部構成、 JP/EN 1:1 対訳)。

- 🇯🇵 [日本語ドキュメント](./docs/ja/README.md) — `docs/ja/` 配下
- 🇬🇧 [English documentation](./docs/en/README.md) — `docs/en/`

その他の reference。

- [docs/RPC.md](./docs/RPC.md) — 直接処理する 9 RPC と anvil fallback の整理
- [docs/EVENTS.md](./docs/EVENTS.md) — 4 event と `triggerEvent()` の使い方
- [docs/ERRORS.md](./docs/ERRORS.md) — EIP-1193 error code と envelope 設計
- [docs/MIGRATION.md](./docs/MIGRATION.md) — v0.x 系の破壊的変更ポリシー
- [docs/COMPARISON.md](./docs/COMPARISON.md) — Synpress / wallet-mock との使い分け
- [docs/RELEASING.md](./docs/RELEASING.md) — publish 手順と provenance 設定

### Claude Code 利用者向け

- [.claude/skills/dapp-e2e-test/SKILL.md](./.claude/skills/dapp-e2e-test/SKILL.md) — `/dapp-e2e-test` skill (test 仕様書生成 → 実装 → 4 round 連続 PASS の構造化フロー)
- [.claude/skills/dapp-e2e-test/references/example-patterns.md](./.claude/skills/dapp-e2e-test/references/example-patterns.md) — 19 example の用途別 index
- [.claude/skills/dapp-e2e-test/references/adversarial-pitfalls.md](./.claude/skills/dapp-e2e-test/references/adversarial-pitfalls.md) — 偽陽性パターン 9 種 + self-check 5 問 (公開 PR から学べる教材)

各ドキュメントは MVP foundation の実装と整合した最小実用ガイドです。
API の詳細は `packages/core/src` と `packages/cli/src` の実装を SSOT とし、 今後の機能追加に応じて必要な章だけを増やす方針です。

## License + Issues

- MIT License
- [Issue tracker](https://github.com/cardene777/dapp-e2e/issues)
- [Pull requests](https://github.com/cardene777/dapp-e2e/pulls)

公開前の変更や互換性の注意点は [docs/MIGRATION.md](./docs/MIGRATION.md) を参照してください。
