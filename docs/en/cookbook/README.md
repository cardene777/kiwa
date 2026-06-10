# Cookbook

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](../../ja/cookbook/README.md)

kiwa usage by real scenario.

- [Test a connect button](./connect-button.md)
- [Test with time manipulation (vesting / streaming)](./time-manipulation.md)
- [Isolate tests with snapshot / revert](./snapshot-revert.md) ⭐ New in v0.2
- [Assert custom-error reverts with expectCustomError](./custom-error-revert.md) ⭐ New in v0.2
- [Test smart wallets (AA / smart contract accounts)](./smart-wallet-aa.md) ⭐ New in v0.3
- [Test a multi-wallet picker](./multi-wallet.md)
- [Test multi-wallet signature verification](./multi-wallet-signature.md)
- [Test the user-reject path](./user-reject.md)
- [Test multi-chain (L1/L2 in parallel)](./multi-chain.md)
- [Test a token approve flow](./token-approve-flow.md)
- [Generate framework integration boilerplate with `kiwa init --with-deploy`](./with-deploy.md) — automates anvil + forge build + forge create + `.env.local` writing via a four-file boilerplate
- [Stack three layers on the same contract](./three-layer-stack.md) — Foundry + Hardhat + Playwright on mint-nft / defi-swap / nextjs-token-gating (3 contract × 3 lane = 9 entries verified)
- [Stack five test layers on a single feature](./five-layer-stack.md) — Add Vitest (unit) + msw (integration) on top of the three-layer stack for features with TS helpers and HTTP / RPC adapters (F-3)

## Contributor-facing internal test docs

The skill-chain flow (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat` → `/kiwa-play`) — used inside the kiwa repo to generate / run contract tests + e2e tests — is kept separate from the user-facing docs, under `tests/docs/`.

- [tests/docs/README.md](../../../tests/docs/README.md) — Four-skill index + chapter navigation
- [tests/docs/run-tests.md](../../../tests/docs/run-tests.md) — Run the full chain in one command with `/kiwa-test` (contract / dApp / both, recommended entry point)
- [tests/docs/write-tests-manually.md](../../../tests/docs/write-tests-manually.md) — Hand-write tests by importing `@kiwa/core` as a library (four single-file samples)
- [tests/docs/skill-chain-tutorial.md](../../../tests/docs/skill-chain-tutorial.md) — Full flow from spec to contract test + e2e test, all the way to running them
- [tests/docs/retrofit-existing-dapp.md](../../../tests/docs/retrofit-existing-dapp.md) — Retrofit the skill chain into an existing dApp + Foundry project
- [tests/docs/run-contract-tests.md](../../../tests/docs/run-contract-tests.md) — Generate and run contract tests with the individual skills (Foundry + Hardhat)
- [tests/docs/run-dapp-e2e-tests.md](../../../tests/docs/run-dapp-e2e-tests.md) — Generate and run Playwright specs from the UI side with the individual skills

## Related

- [API Reference](../api/README.md)
- [Concepts](../concepts/README.md)
