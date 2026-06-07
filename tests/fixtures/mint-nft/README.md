# tests/fixtures/mint-nft

`examples/mint-nft` の完成形 test を retrofit walkthrough から独立させた reference fixture。

## 出自

- Test files moved from `examples/mint-nft/{test,hardhat-test,tests}/` via git mv (history preserved, `git log --follow` で確認可)
- Baseline tests introduced in:
  - PR #184 — Hardhat chain 動作実証 (npx hardhat test 17/17 × 4 round 全 PASS)
  - PR #185 — CRITICAL/MAJOR 抜け漏れ 12 件補完 + coverage 必須化 (Hardhat 24/24 / Foundry 27/27)

## 構成

- `contract-test/MintNft.t.sol` — Foundry test (27 件)
- `hardhat-test/MintNft.test.cjs` — Hardhat test (24 件、 4 round 連続 PASS / flaky 0)
- `e2e-test/mint.spec.ts` — Playwright test (8 件)
- `contracts/MintNft.sol` — examples/mint-nft/contracts/ から cp で複製 (contract 変更時は sync が必要)
- `lib/forge-std/` — Foundry lib 一式 (同上)

## 実走

```bash
pnpm --dir tests/fixtures/mint-nft test:foundry      # Foundry 27/27
pnpm --dir tests/fixtures/mint-nft test:hardhat      # Hardhat 24/24
pnpm --dir tests/fixtures/mint-nft test:e2e          # Playwright 8/8
```

## retrofit walkthrough との関係

`examples/mint-nft/{test,hardhat-test,tests}/` は `.gitignore` 対象になっており、 contributor が `/kiwa-design` → `/kiwa-forge` → `/kiwa-hardhat` → `/kiwa-play` の skill chain で空 dir から test を再生成する作業台として使う。 再生成後に `diff -r examples/mint-nft/test tests/fixtures/mint-nft/contract-test` で本 fixture と比較できる。
