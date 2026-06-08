# examples/mint-nft

ERC721 contract (MintNft.sol) を anvil に deploy し、 Playwright + viem からだけでなく Foundry / Hardhat の 3 経路で test できる example。 kiwa の dApp 経路と「contract 単体 test の Foundry + Hardhat 並立」をまとめて確認できる。

## このディレクトリの 2 つの動線

### 1. retrofit walkthrough を歩く (authoring 用)

`test/` `hardhat-test/` `tests/` は `.gitignore` 対象で git clone 直後は空。 `/kiwa-design` → `/kiwa-forge` → `/kiwa-hardhat` → `/kiwa-play` の skill chain を起動して test を 0 から再生成する。 再生成後は `cd examples/mint-nft && forge test` 等で実走できる。

### 2. 完成形 reference を読む / 実走する

完成形 test は `tests/fixtures/mint-nft/` に退避済。 実走は以下:

```bash
pnpm --dir tests/fixtures/mint-nft test:foundry    # 27/27
pnpm --dir tests/fixtures/mint-nft test:hardhat    # 24/24
pnpm --dir tests/fixtures/mint-nft test:e2e        # 8/8
```

詳細は `tests/fixtures/mint-nft/README.md` を参照。

### migration 注記

旧 `cd examples/mint-nft && forge test` (clone 直後) は空 dir で何も実行されない。 完成形を実走したい場合は `tests/fixtures/mint-nft/` 側を使う。

## 何が試せるか

- `startAnvil` + `forge create` 相当の deploy flow を Playwright fixture と組み合わせて回す
- ERC721 mint / batchMint / transferFrom / royaltyInfo / safeTransferFrom / supportsInterface
- ERC721Enumerable 経由の tokenOfOwnerByIndex / tokenByIndex
- Foundry `.t.sol` と Hardhat `.test.cjs` の並立 (同一 contract に対する 2 経路 test)
- coverage 4 metric (Stmts / Branch / Funcs / Lines) の Hardhat 経路での測定

## 動かす

前提として repo root で `pnpm install` 済 + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` / `forge` が PATH 上。

```bash
# 完成形 reference fixture を実走
pnpm --dir tests/fixtures/mint-nft test:foundry
pnpm --dir tests/fixtures/mint-nft test:hardhat
pnpm --dir tests/fixtures/mint-nft test:e2e

# retrofit walkthrough の作業台を自分で埋めた後だけ examples 側を直接実行
cd examples/mint-nft && forge test
```

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/fixtures/mint-nft/e2e-test/mint.spec.ts` | Playwright e2e 経路、 viem WalletClient で deploy → mint → balanceOf → transferFrom の検証 |
| `tests/fixtures/mint-nft/contract-test/MintNft.t.sol` | Foundry 単体、 invariant / fuzz 含む |
| `tests/fixtures/mint-nft/hardhat-test/MintNft.test.cjs` | Hardhat 単体 (F-1 で追加)、 観点 6 系統 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / セキュリティ) |

3 経路を 1 contract で並立できることが kiwa の `/kiwa-hardhat` skill の動作実証の起点になっている。

## 関連 cookbook

- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)
- [Snapshot revert](../../docs/ja/cookbook/snapshot-revert.md)
- [テスト設計フロー (skill chain tutorial)](../../tests/docs/skill-chain-tutorial.ja.md)

## 次に試す

- ERC20 + AMM swap → [examples/defi-swap](../defi-swap/README.ja.md)
- 複合 marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.ja.md)
