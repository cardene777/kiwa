# tests/fixtures/nft-marketplace

`examples/nft-marketplace` の完成形 test を retrofit walkthrough から独立させた reference fixture。

## 出自

- Moved from `examples/nft-marketplace/{test,hardhat-test,tests}/`
- Baseline: PR #198 (nft-marketplace に Hardhat 構成導入 #197 F-1 第 2 弾) + skill chain で生成された test 群

## 構成

- `contract-test/MarketNft.t.sol` / `contract-test/SimpleMarketplace.t.sol` — Foundry test
- `hardhat-test/MarketNft.test.cjs` / `hardhat-test/SimpleMarketplace.test.cjs` — Hardhat test
- `e2e-test/marketplace.spec.ts` — Playwright e2e test
- `contracts/` / `lib/` — `examples/nft-marketplace/` から `cp -r` で複製。contract や lib を更新した場合は fixture 側への sync が必要

## 実走

```bash
pnpm --dir tests/fixtures/nft-marketplace test:foundry
pnpm --dir tests/fixtures/nft-marketplace test:hardhat
pnpm --dir tests/fixtures/nft-marketplace test:e2e
```

## retrofit walkthrough との関係

`examples/nft-marketplace/{test,hardhat-test,tests}/` は `.gitignore` 対象の retrofit 作業台。 contributor は skill chain で空 dir から test を再生成し、完成形との比較は `tests/fixtures/nft-marketplace/` を参照する。
