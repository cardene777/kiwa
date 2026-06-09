# examples/nextjs-erc1155-game

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

ERC1155 ゲームアイテム (GameItems) を Next.js + Playwright で検証する example。 inventory 表示 → burn → mint の経路を viem WalletClient と組み合わせて回す。

## 何が試せるか

- ERC1155 mint / batchMint で複数 token id を 1 tx で配布
- balanceOfBatch で inventory を一括取得
- burn で token を消費する flow
- ERC1155 TransferSingle / TransferBatch event の args 検証

## 動かす

```bash
pnpm -F examples-nextjs-erc1155-game test
```

Next.js dev server は port 3034。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/inventory.spec.ts` | mint → balanceOfBatch で inventory 表示、 5 ケース |
| `tests/burn.spec.ts` | burn → balance 減算 → 残量検証、 5 ケース |

## 関連 cookbook

- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- ERC721 系 → [examples/mint-nft](../mint-nft/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
