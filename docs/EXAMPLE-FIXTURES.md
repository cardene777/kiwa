# Example fixtures policy

> [🇬🇧 English](./EXAMPLE-FIXTURES.md) • [🇯🇵 日本語](./EXAMPLE-FIXTURES.ja.md)

This document explains which examples have been retrofitted with a "completed reference fixture under `tests/fixtures/`" and which examples are intentionally out of scope.
It exists so contributors can predict, without reading commit history, whether a given example is meant to be walked through 0 → 1 with the skill chain or simply read as-is.

## TL;DR

| Group | Examples | Has `tests/fixtures/<name>/`? | What to expect |
|---|---|---|---|
| Contract-bearing fixtures | mint-nft / defi-swap / nextjs-token-gating / nft-marketplace | ✅ Yes | `examples/<name>/{test,hardhat-test,tests}/` is gitignored. The skill chain regenerates tests there. The completed reference suite lives under `tests/fixtures/<name>/`. |
| Connection-only fixture | basic-connect | ✅ Yes (e2e-test only) | Same shape but Foundry / Hardhat lanes are not applicable because the example has no Solidity contract of its own. |
| e2e-only examples (16) | basic-connect except / nextjs-aa-erc4337 / nextjs-aa-smart-account / nextjs-bridge / nextjs-dao-vote / nextjs-ens-resolver / nextjs-erc1155-game / nextjs-event-history / nextjs-lending / nextjs-multi-chain / nextjs-permit-swap / nextjs-staking / nextjs-vesting / nextjs-wagmi-rainbow / nextjs-zk-verifier / vite-react-wagmi | ❌ No (out of scope) | `examples/<name>/tests/` stays tracked. The retrofit walkthrough is not the recommended path for these examples. Read or fork them as-is. |

## Why the e2e-only examples are out of scope

These examples exist to demonstrate one integration pattern each (account abstraction, bridging, voting, ENS lookup, multi-chain, ZK verifier, etc.) on top of an upstream contract that kiwa does not own.
There are three concrete reasons we do not push them through the same fixtures-retrofit treatment as the four contract-bearing examples.

- They have no Solidity contract under `examples/<name>/contracts/` for kiwa to own as a source of truth. The Foundry / Hardhat lanes therefore have no surface area.
- The Playwright spec is typically demonstrating an end-to-end pattern with a specific helper composition (multi-step approval, paymaster setup, ZK proof generation). Splitting it into a "workbench" vs. "finished fixture" pair adds friction without clarifying the pattern.
- We want the e2e-only examples to be readable in one place. Forcing the retrofit walkthrough onto them would gitignore `tests/` and require contributors to walk the skill chain just to see what the integration looks like.

The four contract-bearing examples are different because they exist precisely to demonstrate the skill chain from contract spec to e2e flow, so the "workbench + finished fixture" split is the whole point.

## How to walk an e2e-only example

If you want to understand or extend an e2e-only example, read its `tests/*.spec.ts` directly, then either fork the example or copy the relevant helper into your own project.
The `/kiwa-play` skill can still be invoked against these examples — it will read the existing spec rather than scaffold a new one.

## Future direction

If a future change introduces a Solidity contract into one of the e2e-only examples (for instance, replacing a Goerli-deployed upstream contract with an in-repo `contracts/` source), that specific example becomes a candidate for fixtures retrofit on the same footing as the four current ones.
The decision is made per example, not as a sweep.

## Related

- [tests/docs/README.md](../tests/docs/README.md) — entry point for the skill-chain test docs
- [tests/docs/retrofit-existing-dapp.md](../tests/docs/retrofit-existing-dapp.md) — walkthrough for the contract-bearing examples
- [examples/mint-nft/README.md](../examples/mint-nft/README.md) — reference shape of the "workbench + finished fixture" split
- [docs/COMPARISON.md](./COMPARISON.md) — how kiwa positions itself versus Synpress / dappwright / wallet-mock
