# examples/mint-nft

ERC721 contract (MintNft.sol) を anvil に deploy し、 Playwright + viem からだけでなく Foundry / Hardhat の 3 経路で test できる example。 kiwa の dApp 経路と「contract 単体 test の Foundry + Hardhat 並立」をまとめて確認できる。

## 何が試せるか

- `startAnvil` + `forge create` 相当の deploy flow を Playwright fixture と組み合わせて回す
- ERC721 mint / batchMint / transferFrom / royaltyInfo / safeTransferFrom / supportsInterface
- ERC721Enumerable 経由の tokenOfOwnerByIndex / tokenByIndex
- Foundry `.t.sol` と Hardhat `.test.cjs` の並立 (同一 contract に対する 2 経路 test)
- coverage 4 metric (Stmts / Branch / Funcs / Lines) の Hardhat 経路での測定

## 動かす

前提として repo root で `pnpm install` 済 + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` / `forge` が PATH 上。

```bash
# Playwright e2e (kiwa fixture 経由)
pnpm -F examples-mint-nft test

# Foundry 単体 test
cd examples/mint-nft && forge test

# Hardhat 単体 test
pnpm -F examples-mint-nft test:hardhat

# Hardhat coverage
pnpm -F examples-mint-nft test:hardhat:coverage
```

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/mint.spec.ts` | Playwright e2e 経路、 viem WalletClient で deploy → mint → balanceOf → transferFrom の検証 |
| `test/MintNft.t.sol` | Foundry 単体、 invariant / fuzz 含む |
| `hardhat-test/MintNft.test.cjs` | Hardhat 単体 (F-1 で追加)、 観点 6 系統 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / セキュリティ) |

3 経路を 1 contract で並立できることが kiwa の `/kiwa-hardhat` skill の動作実証の起点になっている。

## 関連 cookbook

- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)
- [Snapshot revert](../../docs/ja/cookbook/snapshot-revert.md)
- [テスト設計フロー](../../docs/ja/cookbook/test-design-flow.md)

## 次に試す

- ERC20 + AMM swap → [examples/defi-swap](../defi-swap/README.ja.md)
- 複合 marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.ja.md)
