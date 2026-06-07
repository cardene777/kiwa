# examples/nextjs-token-gating

ERC721 (GateNFT) を hold する hold 者だけが getSecret() を読める gated content (GatedContent) を試す example。 NFT 保有者からの timed grant 経路と grantor revocation の挙動も含めて検証できる。 Phase F-1 第 1 弾で Hardhat 経路も並立。

## 2 動線

- 作業台: `examples/nextjs-token-gating/` は retrofit walkthrough 用 workspace。 docs を辿って `test/` / `hardhat-test/` / `tests/` を再生成する場所。
- 完成形 fixture: 保存済みの完成 test suite は `tests/fixtures/nextjs-token-gating/` にある。

## 何が試せるか

- GateNFT を hold する人だけが `GatedContent.getSecret()` を呼べる
- `grantTimedAccess` で NFT 非保有者に期限付き access を付与
- `time.increase` で期限切れ後 `NotGated` revert を発火
- grantor が NFT を transfer すると grantee の access が即時取消
- Hardhat 経路 (`pnpm -F examples-nextjs-token-gating test:hardhat`) も並立 (F-1 第 1 弾)

## 動かす

```bash
# example app
pnpm -F examples-nextjs-token-gating dev

# 完成形 Foundry fixture
pnpm --dir tests/fixtures/nextjs-token-gating test:foundry

# 完成形 Hardhat fixture
pnpm --dir tests/fixtures/nextjs-token-gating test:hardhat

# 完成形 Playwright fixture
pnpm --dir tests/fixtures/nextjs-token-gating test:e2e
```

Next.js dev server は port 3044。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/fixtures/nextjs-token-gating/e2e-test/gating.spec.ts` | Playwright e2e、 NFT mint → gated content access → timed grant → revoke の典型 flow |
| `tests/fixtures/nextjs-token-gating/hardhat-test/GatedContent.test.cjs` | Hardhat 単体 (F-1 第 1 弾)、 観点 6 系統で 23 ケース |
| `tests/fixtures/nextjs-token-gating/contract-test/GatedContent.t.sol` | Foundry 単体 lane を history 付きで保存 |

## 関連 cookbook

- [Time manipulation (timed access)](../../docs/ja/cookbook/time-manipulation.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- 複合 marketplace → [examples/nft-marketplace](../nft-marketplace/README.ja.md)
- ERC1155 game items → [examples/nextjs-erc1155-game](../nextjs-erc1155-game/README.ja.md)
