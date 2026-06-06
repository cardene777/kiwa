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
- [kiwa init --with-deploy で framework 統合 boilerplate を生成する](./with-deploy.md) — anvil + forge build + forge create + .env.local 書き込みを 4 file boilerplate で自動化

## kiwa contributor 向け内部 test docs

kiwa repo 内で skill chain (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat` → `/kiwa-play`) を回して contract test + e2e test を生成 / 実走する手順は user 向け docs と分離して `tests/docs/` 配下に集約している。

- [tests/docs/README.ja.md](../../../tests/docs/README.ja.md) — 4 skill 案内 + chapter 動線
- [tests/docs/skill-chain-tutorial.ja.md](../../../tests/docs/skill-chain-tutorial.ja.md) — 仕様書から contract test + e2e test 生成 → 実走の full flow
- [tests/docs/retrofit-existing-dapp.ja.md](../../../tests/docs/retrofit-existing-dapp.ja.md) — 既存 dApp + Foundry project に skill chain を後付け導入する手順

## 関連

- [API Reference](../api/README.md)
- [Concepts](../concepts/README.md)
