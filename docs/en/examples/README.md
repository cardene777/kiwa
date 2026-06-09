# Examples Map

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](../../ja/examples/README.md)

The `examples/` directory contains 20 test dApps and contracts. This page is the reverse lookup — pick what you want to try, find the right example, dApp lane vs. contract-only lane laid out side by side.

For a guided tour through five examples in order, read [walkthrough.md](./walkthrough.md). Until publish lands, every example can be run locally with `pnpm -F examples-{name} test`.

## Prerequisites

- `pnpm install` run at the repo root
- `pnpm exec playwright install chromium` done
- Foundry's `anvil` and `forge` on PATH (`anvil --version`)
- Node.js 20+

## Contract-only lane (Foundry + Hardhat side by side)

For when you want to write contract tests next to Playwright e2e or kick the tires on the `/kiwa-hardhat` skill output.

| Example | What you can try | Lanes |
|---|---|---|
| [mint-nft](../../../examples/mint-nft/README.md) | ERC721 + ERC2981 royalty / Enumerable / supportsInterface | Playwright + Foundry + Hardhat |
| [defi-swap](../../../examples/defi-swap/README.md) | ERC20 + 1:1 swap pool + slippage protection + token-specific approval | Playwright + Foundry + Hardhat |
| [nft-marketplace](../../../examples/nft-marketplace/README.md) | ERC721 + composite marketplace (listing + offer + royalty payout + offer invalidation) | Playwright + Foundry + Hardhat |

## dApp lane (Next.js + wagmi + framework integration)

For exercising the framework-integration flow (`anvil + forge build + forge create + .env.local`) and writing tests with wagmi hooks (`useAccount` / `useReadContract`, etc.).

| Example | What you can try | README |
|---|---|---|
| [basic-connect](../../../examples/basic-connect/README.md) | A single inline HTML page for connect / sign / sendTx / EIP-6963 multi-wallet | Ready |
| [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.md) | Next.js + wagmi + RainbowKit, mint flow through useAccount / useReadContract / useWriteContract | Ready |
| [nextjs-aa-erc4337](../../../examples/nextjs-aa-erc4337/README.md) | Full ERC-4337 v0.7 Account Abstraction (EntryPoint + Smart Account) | Ready |
| [nextjs-aa-smart-account](../../../examples/nextjs-aa-smart-account/README.md) | Simplified Smart Account (Paymaster / TokenSpender / guardian / ERC-1271) | Ready |
| [nextjs-bridge](../../../examples/nextjs-bridge/README.md) | L1 ↔ L2 bridge (two anvils + lock/mint/burn/unlock) | Ready |
| [nextjs-dao-vote](../../../examples/nextjs-dao-vote/README.md) | DAO vote contract + execute target | Ready |
| [nextjs-ens-resolver](../../../examples/nextjs-ens-resolver/README.md) | ENS-style name → address resolver | Ready |
| [nextjs-erc1155-game](../../../examples/nextjs-erc1155-game/README.md) | ERC1155 game items (inventory / burn) | Ready |
| [nextjs-event-history](../../../examples/nextjs-event-history/README.md) | Event emit / getLogs / history rendering | Ready |
| [nextjs-lending](../../../examples/nextjs-lending/README.md) | Lending pool + price oracle + liquidation | Ready |
| [nextjs-multi-chain](../../../examples/nextjs-multi-chain/README.md) | 3-chain anvil cluster + chain switch | Ready |
| [nextjs-permit-swap](../../../examples/nextjs-permit-swap/README.md) | EIP-2612 permit + gasless swap | Ready |
| [nextjs-staking](../../../examples/nextjs-staking/README.md) | Staking + reward accrual + withdraw | Ready |
| [nextjs-token-gating](../../../examples/nextjs-token-gating/README.md) | Gated content + timed grant (F-1 wave 1 Hardhat lane) | Ready |
| [nextjs-vesting](../../../examples/nextjs-vesting/README.md) | Token vesting schedule + cliff / linear claim | Ready |
| [nextjs-zk-verifier](../../../examples/nextjs-zk-verifier/README.md) | zk-proof commitment / range verifier | Ready |
| [vite-react-wagmi](../../../examples/vite-react-wagmi/README.md) | Vite 5 + React 18 + wagmi v2 SPA | Ready |

All 20 examples now ship with bilingual READMEs (`README.md` + `README.ja.md`).

## Reverse lookup by kiwa feature

| Feature you want to try | Recommended example |
|---|---|
| Connect / sign / sendTx basics | [basic-connect](../../../examples/basic-connect/README.md) |
| EIP-6963 multi-wallet | [basic-connect](../../../examples/basic-connect/README.md) |
| Foundry build → forge create → ABI loading | [mint-nft](../../../examples/mint-nft/README.md) |
| ERC20 approve + auto swap | [defi-swap](../../../examples/defi-swap/README.md) |
| Token-specific approval policy / limits | [defi-swap](../../../examples/defi-swap/README.md) |
| Hardhat `.test.cjs` + 80%+ coverage in front of you | [mint-nft](../../../examples/mint-nft/README.md) / [defi-swap](../../../examples/defi-swap/README.md) / [nft-marketplace](../../../examples/nft-marketplace/README.md) |
| ERC2981 royalty auto-split | [nft-marketplace](../../../examples/nft-marketplace/README.md) |
| `time.increase` for deadline expiry | [nft-marketplace](../../../examples/nft-marketplace/README.md) |
| wagmi `useAccount` / `useReadContract` | [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.md) |
| Playwright globalSetup + `dappE2eTest` extend | [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.md) |
| Mirror of `kiwa init --with-deploy` output | [nextjs-wagmi-rainbow](../../../examples/nextjs-wagmi-rainbow/README.md) |

## Related docs

- [Quickstart](../quickstart.md) — the first five minutes (the post-publish `pnpm dlx @kiwa/cli init` route — pre-publish, follow these examples docs)
- [Concepts](../concepts/README.md) — fixture / EIP-6963 / RPC handling
- [Cookbook](../cookbook/README.md) — feature-by-feature recipes
- [API Reference](../api/README.md) — `dappE2eTest` / `startAnvil` / friends
