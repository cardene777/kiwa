# 同じ contract に 3 layer を重ねる

> [🇬🇧 English](../../en/cookbook/three-layer-stack.md) • [🇯🇵 日本語](./three-layer-stack.md)

kiwa は 1 つの Solidity contract に対して **Foundry (`.t.sol`) + Hardhat (`.test.cjs`) + Playwright (`.spec.ts`)** の 3 layer を並立できる。 この recipe では 3 つの reference contract で同じ構造を歩き、 「1 example だけの偶然」 ではなく汎用的な構造であることを確認する。

## 3 layer を選ぶべき場面

以下のいずれかが当てはまる時は 3 layer 全部を有効にする。

- runner 多様性 (Foundry `vm.warp` / Hardhat `solidity-coverage` / Playwright on-chain assertion) で同じバグを別角度から捕捉したい
- contract test (`forge test` + `npx hardhat test`) と UX 級 e2e test (`playwright test`) を 1 つの Layer 1 spec (`/kiwa-design --layer contract` と `--layer e2e`) で同期させたい
- contract surface と dApp surface 両方を 1 regression suite に含めたい

contract correctness だけなら Foundry 単独で十分、 UX だけなら Playwright 単独で十分。 3 layer を組むのは上記を同時に整合させたい時に効く。

## 3 つの reference contract

| Example | Contract | Foundry lane | Hardhat lane | Playwright lane |
|---|---|---|---|---|
| [`tests/fixtures/mint-nft`](../../../tests/fixtures/mint-nft/) | `MintNft.sol` (ERC721 + Enumerable + royalty) | `contract-test/MintNft.t.sol` (27/27) | `hardhat-test/MintNft.test.cjs` (24/24) | `e2e-test/mint.spec.ts` (8/8) |
| [`tests/fixtures/defi-swap`](../../../tests/fixtures/defi-swap/) | `SimpleSwap.sol` + `Erc20.sol` (1:1 swap pool with slippage protection) | `contract-test/SwapTokens.t.sol` (17/17) | `hardhat-test/SwapTokens.test.cjs` (23/23) | `e2e-test/swap.spec.ts` (7/7) |
| [`tests/fixtures/nextjs-token-gating`](../../../tests/fixtures/nextjs-token-gating/) | `GatedContent.sol` (NFT-gated access + timed grant) | `contract-test/GatedContent.t.sol` (20/20) | `hardhat-test/GatedContent.test.cjs` (23/23) | `e2e-test/gating.spec.ts` (8/8) |

各 lane は fixture dir から直接実行できる。

```bash
# Foundry lane (任意 example)
pnpm --dir tests/fixtures/<name> test:foundry

# Hardhat lane (任意 example)
pnpm --dir tests/fixtures/<name> test:hardhat

# Playwright lane (任意 example)
pnpm --dir tests/fixtures/<name> test:e2e
```

9 entry (3 example × 3 lane) で 3 つの contract 形状 (NFT mint / AMM swap / gated content) を cover、 stack が特定 contract pattern に依存していないことを示している。

## 同じ contract で 3 lane すべてが通る仕組み

共有の Layer 1 spec (`tests/spec/contract/test-spec-<name>.md` と `tests/spec/e2e/test-spec-<name>.md`) が単一 SSOT になっている。 Layer 2 skill はこれを読んで機械的に変換する。

- `/kiwa-forge` は spec の TC 表を Foundry helper (`vm.expectRevert`、 `forge fuzz`、 `vm.warp`) に変換
- `/kiwa-hardhat` は同表を Hardhat helper (`expect(...).to.be.reverted`、 `fast-check`、 `time.increaseTo`) に変換
- `/kiwa-play` は e2e TC 表を Playwright + `@kiwa-test/core` fixture helper (`getByTestId`、 `walletClient.signTypedData`) に変換

観点 × runner マッピング表は [`viewpoints-catalog.md`](../../../.claude/skills/kiwa-design/references/viewpoints-catalog.md) に列挙されており、 contributor は Layer 2 起動前にどんな test code が生成されるかを予測できる。

## 4 つ目の contract をこの stack に追加するには

`examples/<name>/contracts/` 配下の任意 contract を選び、 以下の順で skill chain を歩く。

1. `/kiwa-design --layer contract --module <name> --input examples/<name>/contracts/<Contract>.sol`
2. `/kiwa-forge --module <name>` → `examples/<name>/test/<Contract>.t.sol`
3. `/kiwa-hardhat --module <name>` → `examples/<name>/hardhat-test/<Contract>.test.cjs`
4. `/kiwa-design --layer e2e --module <name> --input examples/<name>/app/page.tsx`
5. `/kiwa-play --module <name>` → `examples/<name>/tests/<name>.spec.ts`

時刻依存ロジック (vesting / 投票 deadline) を持つ contract なら、 contract lane は Foundry を優先する (`vm.warp` で境界時刻を素直に test できる)。 UI が反応する event を多発する contract なら、 e2e lane を Playwright 優先で `getByTestId` 直接 assertion に倒す。

runner 固有の制約は spec の [`runner 差異`](../../../.claude/skills/kiwa-design/references/output-skeleton.md) bullet に記録される、 contributor は片方の runner で到達不能な branch を追わなくて済む。

## 関連

- [`tests/docs/skill-chain-tutorial.ja.md`](../../../tests/docs/skill-chain-tutorial.ja.md) — spec から test までの full flow
- [`tests/docs/run-contract-tests.ja.md`](../../../tests/docs/run-contract-tests.ja.md) — contract 側手順 (Foundry + Hardhat)
- [`tests/docs/run-dapp-e2e-tests.ja.md`](../../../tests/docs/run-dapp-e2e-tests.ja.md) — dApp e2e 手順 (Playwright)
- [`docs/EXAMPLE-FIXTURES.ja.md`](../../EXAMPLE-FIXTURES.ja.md) — どの example が完成形 fixture を持つか
