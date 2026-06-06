# Cookbook

実シナリオ別に kiwa の使い方を示します。

- [Connect ボタンを test する](./connect-button.md)
- [時間操作で test する (vesting / streaming)](./time-manipulation.md)
- [Snapshot / revert で test 間隔離する](./snapshot-revert.md) ⭐ v0.2 新規
- [Custom error revert を expectCustomError で検証する](./custom-error-revert.md) ⭐ v0.2 新規
- [Smart wallet (AA / smart contract account) を test する](./smart-wallet-aa.md) ⭐ v0.3 新規
- [Multi-Wallet picker を test する](./multi-wallet.md)
- [Multi-Wallet 署名検証を test する](./multi-wallet-signature.md)
- [User reject 経路を test する](./user-reject.md)
- [Multi-Chain (L1/L2 並走) を test する](./multi-chain.md)
- [Token approve flow を test する](./token-approve-flow.md)
- [3 layer テスト設計 flow (Phase E 統合)](./kiwa-design-flow.md) ⭐ v0.5 新規 — Layer 1 (`/kiwa-design`) → Layer 2 (Foundry / Hardhat / Playwright) chain で contract test と dApp e2e test を 1 仕様書から生成
- [kiwa init --with-deploy で framework 統合 boilerplate を生成する](./with-deploy.md) — anvil + forge build + forge create + .env.local 書き込みを 4 file boilerplate で自動化

## 関連

- [API Reference](../api/README.md)
- [Concepts](../concepts/README.md)
