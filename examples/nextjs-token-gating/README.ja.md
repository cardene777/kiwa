# examples/nextjs-token-gating

ERC721 (GateNFT) を hold する hold 者だけが getSecret() を読める gated content (GatedContent) を試す example。 NFT 保有者からの timed grant 経路と grantor revocation の挙動も含めて検証できる。 Phase F-1 第 1 弾で Hardhat 経路も並立。

## 何が試せるか

- GateNFT を hold する人だけが `GatedContent.getSecret()` を呼べる
- `grantTimedAccess` で NFT 非保有者に期限付き access を付与
- `time.increase` で期限切れ後 `NotGated` revert を発火
- grantor が NFT を transfer すると grantee の access が即時取消
- Hardhat 経路 (`pnpm -F examples-nextjs-token-gating test:hardhat`) も並立 (F-1 第 1 弾)

## 動かす

```bash
# Playwright e2e
pnpm -F examples-nextjs-token-gating test

# Hardhat 単体 (F-1 第 1 弾、 観点 6 系統 23 ケース)
pnpm -F examples-nextjs-token-gating test:hardhat

# Hardhat coverage (Stmts 94.74% / Branch 88.89% / Funcs 100% / Lines 100%)
pnpm -F examples-nextjs-token-gating test:hardhat:coverage
```

Next.js dev server は port 3044。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/gating.spec.ts` | Playwright e2e、 NFT mint → gated content access → timed grant → revoke の典型 flow |
| `hardhat-test/GatedContent.test.cjs` | Hardhat 単体 (F-1 第 1 弾)、 観点 6 系統で 23 ケース |

## 関連 cookbook

- [Time manipulation (timed access)](../../docs/ja/cookbook/time-manipulation.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- 複合 marketplace → [examples/nft-marketplace](../nft-marketplace/README.ja.md)
- ERC1155 game items → [examples/nextjs-erc1155-game](../nextjs-erc1155-game/README.ja.md)
