# Cookbook

> [🇬🇧 English](../../en/cookbook/README.md) • [🇯🇵 日本語](./README.md)

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
- [同じ contract に 3 layer を重ねる](./three-layer-stack.md) — Foundry + Hardhat + Playwright を mint-nft / defi-swap / nextjs-token-gating で並立 (3 contract × 3 lane = 9 entry 検証済)

## kiwa contributor 向け内部 test docs

kiwa repo 内で skill chain (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat` → `/kiwa-play`) を回して contract test + e2e test を生成 / 実走する手順は user 向け docs と分離して `tests/docs/` 配下に集約している。

- [tests/docs/README.ja.md](../../../tests/docs/README.ja.md) — 4 skill 案内 + chapter 動線
- [tests/docs/run-tests.ja.md](../../../tests/docs/run-tests.ja.md) — `/kiwa-test` 1 コマンドで全 chain 一括実行 (contract / dApp / 両方、 最初に試すならこれ)
- [tests/docs/write-tests-manually.ja.md](../../../tests/docs/write-tests-manually.ja.md) — skill を使わず `@kiwa/core` を library として import して手書きで test を書く手順 (1 file 完結 sample 4 種)
- [tests/docs/skill-chain-tutorial.ja.md](../../../tests/docs/skill-chain-tutorial.ja.md) — 仕様書から contract test + e2e test 生成 → 実走の full flow
- [tests/docs/retrofit-existing-dapp.ja.md](../../../tests/docs/retrofit-existing-dapp.ja.md) — 既存 dApp + Foundry project に skill chain を後付け導入する手順
- [tests/docs/run-contract-tests.ja.md](../../../tests/docs/run-contract-tests.ja.md) — 個別 skill (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat`) で contract test を生成 → 実走 (Foundry + Hardhat)
- [tests/docs/run-dapp-e2e-tests.ja.md](../../../tests/docs/run-dapp-e2e-tests.ja.md) — UI (app/) を起点に個別 skill (`/kiwa-design --input app/` → `/kiwa-play`) で Playwright spec を生成 → 実走

## 関連

- [API Reference](../api/README.md)
- [Concepts](../concepts/README.md)
