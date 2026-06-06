# Examples Walkthrough

kiwa の人気 5 example を 30 分 ~ 1 時間で順に試すツアー。 入門 → contract 単体 → framework 統合 → 複合 と段階的に難易度を上げる。

各 Stage の所要時間は「読みながら挙動を観察する目安」で、 test コマンド自体の実行時間は数秒 ~ 数十秒 (Next.js boot を含む Stage 4 が約 25 秒、 他は 4 秒前後)。

## 前提

- repo root で `pnpm install` 済
- `pnpm exec playwright install chromium` 済
- Foundry の `anvil` / `forge` が PATH 上
- Node.js 20+

## Stage 1 — basic-connect (約 5 分)

contract 不要、 inline HTML 1 枚で kiwa fixture の動きを掴む。

```bash
pnpm -F examples-basic-connect test
```

期待 — `connect.spec.ts` 11 件 + `eip6963.spec.ts` 4 件 = 計 15 件 PASS、 実行は約 4 秒 (内訳 — `pnpm -F @kiwa/core build` で fixture dist 更新 → playwright test)。

確認したいこと。

- Playwright が起動 → fixture が `window.ethereum` を inject
- Connect button click → `eth_requestAccounts` → anvil dev account 取得
- Sign button click → `personal_sign` → viem `verifyMessage` で検証
- `dappE2e.waitForRpcIdle()` が pending RPC を待ってから assertion が走る pattern

詳細は [examples/basic-connect/README.ja.md](../../../examples/basic-connect/README.ja.md)。

## Stage 2 — mint-nft (約 10 分)

最小 contract (ERC721 + ERC2981 + Enumerable) を anvil に deploy し、 Playwright + viem + Foundry + Hardhat の 3 経路で test を回す。

```bash
# Playwright e2e
pnpm -F examples-mint-nft test

# Foundry 単体
cd examples/mint-nft && forge test

# Hardhat 単体 (kiwa-hardhat skill の出力)
pnpm -F examples-mint-nft test:hardhat

# Hardhat coverage
pnpm -F examples-mint-nft test:hardhat:coverage
```

期待 — e2e 8 件 + Foundry 27 件 + Hardhat 24 件、 Hardhat coverage は Stmts 92.86% / Branch 80.56% / Funcs 100% / Lines 93.75% (実行は e2e 約 3 秒 / forge test 約 0.1 秒 / hardhat test 約 0.4 秒)。

確認したいこと。

- 同一 contract に対して 3 経路で test を書ける (e2e / forge / hardhat)
- Hardhat coverage で Stmts / Branch / Funcs / Lines の 4 metric が出る
- `forge create` 経由の deploy が Playwright fixture と組み合わせて動く

詳細は [examples/mint-nft/README.ja.md](../../../examples/mint-nft/README.ja.md)。

## Stage 3 — defi-swap (約 15 分)

ERC20 + 1:1 swap pool。 token approve flow と slippage protection を試す。

```bash
# Playwright e2e (approve → swap + SlippageExceeded / InsufficientLiquidity)
pnpm -F examples-defi-swap test

# Hardhat 単体 (観点 6 系統 23 ケース)
pnpm -F examples-defi-swap test:hardhat

# Hardhat coverage (Stmts/Funcs/Lines 100% + Branch 87.5%)
pnpm -F examples-defi-swap test:hardhat:coverage
```

期待 — e2e 7 件 + Hardhat 23 件、 Hardhat coverage は Stmts 100% / Branch 87.5% / Funcs 100% / Lines 100% (実行は e2e 約 4 秒 / hardhat test 約 0.3 秒)。

確認したいこと。

- `setApprovalModeForToken` で per-token approve reject / limit を制御できる
- `swapAforB(amountIn, minOutputAmount)` overload で SlippageExceeded を強制 revert
- pool 流動性超過時の InsufficientLiquidity が引数情報付きで返る
- `expectBalanceChange` helper で balance 差分 assertion が書ける

詳細は [examples/defi-swap/README.ja.md](../../../examples/defi-swap/README.ja.md)。

## Stage 4 — nextjs-wagmi-rainbow (約 15 分)

framework 統合経路を 1 例で確認する。 Next.js + wagmi + RainbowKit の完成形に kiwa fixture を組み込んだ最小構成。

```bash
pnpm -F examples-nextjs-wagmi-rainbow test
```

期待 — `connect-and-mint.spec.ts` 4 件 PASS、 実行は約 25 秒 (Next.js dev server boot 含む)。

中で起こること。

1. `pnpm -F @kiwa/core build` で fixture dist 更新
2. `tests/prepare-env.ts` 実行 (anvil 起動 + forge build + forge create + `.env.local` 書き込み)
3. Playwright が Next.js を起動 → `connect-and-mint.spec.ts` 実行
4. globalTeardown で anvil 停止 + pidfile cleanup

確認したいこと。

- `tests/prepare-env.ts` + `tests/global-setup.ts` + `tests/global-teardown.ts` + `tests/fixture.ts` の 4 file 構成
- `dappE2eTest.extend({ _anvilHandle: ... })` で globalSetup 起動済 anvil を fixture に渡す pattern
- RainbowKit modal click → wagmi `useAccount` で address が wire される流れ

`kiwa init --with-deploy <foundry-path>` で同じ 4 file が自動生成される (CLI option PR #195)。

詳細は [examples/nextjs-wagmi-rainbow/README.ja.md](../../../examples/nextjs-wagmi-rainbow/README.ja.md)。

## Stage 5 — nft-marketplace (約 20 分)

最も複雑な test 用 dApp。 listing + offer + royalty payout + offer invalidation を 1 contract で網羅する。

```bash
# Playwright e2e (4 wallet で seller / buyer / royalty receiver / counter-buyer を分けて検証)
pnpm -F examples-nft-marketplace test

# Hardhat 単体 (MarketNft 21 件 + SimpleMarketplace 30 件、 観点 6 系統)
pnpm -F examples-nft-marketplace test:hardhat

# Hardhat coverage (Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25%)
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

期待 — e2e 12 件 + Hardhat (MarketNft 21 件 + SimpleMarketplace 30 件) = 51 件、 Hardhat coverage は Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25% (実行は e2e 約 4 秒 / hardhat test 約 0.6 秒)。

確認したいこと。

- ERC2981 royaltyInfo (500 bps) 経由で royalty が自動分配される (seller 95% / royalty receiver 5%)
- acceptOffer 時に同 tokenId の他 offer が全 invalidation + 返金される
- buy 時の差額 refund (msg.value > price ならお釣り)
- Hardhat `time.increase` で deadline 過ぎた offer を `OfferExpired` で revert
- 4 wallet の multi-account test pattern

詳細は [examples/nft-marketplace/README.ja.md](../../../examples/nft-marketplace/README.ja.md)。

## 次に試す方向

- 全 20 example のマップ → [examples/README.md](./README.md)
- 機能別レシピ → [Cookbook](../cookbook/README.md)
- 仕組みを理解 → [Concepts](../concepts/README.md)
- API を引く → [API Reference](../api/README.md)
