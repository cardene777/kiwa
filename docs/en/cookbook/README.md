# Cookbook

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

## Contributor-facing internal test docs

The skill-chain flow (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat` → `/kiwa-play`) — used inside the kiwa repo to generate / run contract tests + e2e tests — is kept separate from the user-facing docs, under `tests/docs/`.

- [tests/docs/README.md](../../../tests/docs/README.md) — Four-skill index + chapter navigation
- [tests/docs/skill-chain-tutorial.md](../../../tests/docs/skill-chain-tutorial.md) — Full flow from spec to contract test + e2e test, all the way to running them
- [tests/docs/retrofit-existing-dapp.md](../../../tests/docs/retrofit-existing-dapp.md) — Retrofit the skill chain into an existing dApp + Foundry project

## Related

- [API Reference](../api/README.md)
- [Concepts](../concepts/README.md)
