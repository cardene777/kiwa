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
- [3-layer test design flow (Phase E integration)](./kiwa-design-flow.md) ⭐ New in v0.5 — generates contract tests and dApp e2e tests from a single spec via Layer 1 (`/kiwa-design`) → Layer 2 (Foundry / Hardhat / Playwright)
- [Generate framework integration boilerplate with `kiwa init --with-deploy`](./with-deploy.md) — automates anvil + forge build + forge create + `.env.local` writing via a four-file boilerplate

## Related

- [API Reference](../api/README.md)
- [Concepts](../concepts/README.md)
