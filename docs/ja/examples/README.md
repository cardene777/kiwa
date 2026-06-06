# Examples Map

kiwa の `examples/` には 20 個の test 用 dApp / contract が並んでいる。 ここでは「何を試したいか」から逆引きできるよう、 dApp 系 / Contract 単体系の 2 区分でまとめる。

ツアー形式で 5 例を順に試したい場合は [walkthrough.md](./walkthrough.md) を読む。 publish 前なので、 どの example も `pnpm -F examples-{name} test` で local から直接動かせる。

## 共通の前提

- repo root で `pnpm install` 済
- `pnpm exec playwright install chromium` 済
- Foundry の `anvil` / `forge` が PATH 上 (`anvil --version` で確認)
- Node.js 20+

## Contract 単体系 (Foundry + Hardhat 並立)

contract test を Playwright e2e と並立で書きたい / `/kiwa-hardhat` skill の出力を試したい人向け。

| Example | 何が試せるか | 経路 |
|---|---|---|
| [mint-nft](../../../examples/mint-nft/README.ja.md) | ERC721 + ERC2981 royalty / Enumerable / supportsInterface | Playwright + Foundry + Hardhat |
| [defi-swap](../../../examples/defi-swap/README.ja.md) | ERC20 + 1:1 swap pool + slippage protection + token-specific approval | Playwright + Foundry + Hardhat |
| [nft-marketplace](../../../examples/nft-marketplace/README.ja.md) | ERC721 + 複合 marketplace (listing + offer + royalty payout + offer invalidation) | Playwright + Foundry + Hardhat |

## dApp 系 (Next.js + wagmi + framework 統合)

framework 統合経路 (`anvil + forge build + forge create + .env.local`) を試したい / `useAccount` `useReadContract` 等の wagmi hook で test を書きたい人向け。

| Example | 何が試せるか | README |
|---|---|---|
| [basic-connect](../../../examples/basic-connect/README.ja.md) | inline HTML 1 枚で connect / sign / sendTx / EIP-6963 multi-wallet | 整備済 |
| [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.ja.md) | Next.js + wagmi + RainbowKit、 useAccount / useReadContract / useWriteContract で mint flow | 整備済 |
| nextjs-aa-erc4337 | ERC-4337 Account Abstraction (Smart Account) | follow-up |
| nextjs-aa-smart-account | Smart Account 基礎 | follow-up |
| nextjs-bridge | L1 ↔ L2 bridge flow | follow-up |
| nextjs-dao-vote | DAO vote contract + UI | follow-up |
| nextjs-ens-resolver | ENS resolver | follow-up |
| nextjs-erc1155-game | ERC1155 game item | follow-up |
| nextjs-event-history | Event 検索 / history 表示 | follow-up |
| nextjs-lending | Lending pool + price oracle | follow-up |
| nextjs-multi-chain | Multi-chain switch (chainRegistry) | follow-up |
| nextjs-permit-swap | EIP-2612 permit + swap | follow-up |
| nextjs-staking | Staking + reward distribution | follow-up |
| nextjs-token-gating | gated content + timed grant (F-1 第 1 弾) | follow-up |
| nextjs-vesting | Token vesting schedule | follow-up |
| nextjs-zk-verifier | zk-proof verifier | follow-up |
| vite-react-wagmi | Vite + React + wagmi 構成 | follow-up |

「follow-up」は次の Issue で README 整備予定。 本 PR の scope は人気 5 例 (basic-connect / mint-nft / defi-swap / nextjs-wagmi-rainbow / nft-marketplace) + 集約 docs。

## 試したい kiwa 機能から逆引き

| 試したい機能 | 推奨 example |
|---|---|
| 接続 / 署名 / sendTx 基本 | [basic-connect](../../../examples/basic-connect/README.ja.md) |
| EIP-6963 multi-wallet | [basic-connect](../../../examples/basic-connect/README.ja.md) |
| Foundry build → forge create → ABI ロード | [mint-nft](../../../examples/mint-nft/README.ja.md) |
| ERC20 approve + 自動 swap | [defi-swap](../../../examples/defi-swap/README.ja.md) |
| Token-specific approval policy / limit | [defi-swap](../../../examples/defi-swap/README.ja.md) |
| Hardhat .test.cjs + coverage 80%+ 目視 | [mint-nft](../../../examples/mint-nft/README.ja.md) / [defi-swap](../../../examples/defi-swap/README.ja.md) / [nft-marketplace](../../../examples/nft-marketplace/README.ja.md) |
| ERC2981 royalty 自動分配 | [nft-marketplace](../../../examples/nft-marketplace/README.ja.md) |
| time.increase で deadline 超過検証 | [nft-marketplace](../../../examples/nft-marketplace/README.ja.md) |
| wagmi useAccount / useReadContract | [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.ja.md) |
| Playwright globalSetup + dappE2eTest extend | [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.ja.md) |
| kiwa init `--with-deploy` の出力相当 | [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.ja.md) |

## 関連 docs

- [Quickstart](../quickstart.md) — 最初の 5 分 (publish 後の `pnpm dlx @kiwa/cli init` 経路、 publish 前は本 examples docs を参照)
- [Concepts](../concepts/README.md) — fixture / EIP-6963 / RPC handling の仕組み
- [Cookbook](../cookbook/README.md) — 機能別レシピ集
- [API Reference](../api/README.md) — `dappE2eTest` / `startAnvil` 等の API
