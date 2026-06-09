# examples/nextjs-wagmi-rainbow

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Next.js + wagmi + RainbowKit の dApp 上で kiwa fixture が `window.ethereum` を inject し、 `useAccount` / `useReadContract` / `useWriteContract` 経由の test を回す example。 framework 統合経路 (anvil 起動 → forge build → forge create → .env.local 書き込み → playwright globalSetup) を 1 例で確認できる。

本 example は `kiwa init --with-deploy <foundry-path>` で生成される 4 file 構成 (`tests/prepare-env.ts` / `global-setup.ts` / `global-teardown.ts` / `fixture.ts`) の **動く reference 実装** にもなっている。 詳細は [Cookbook: kiwa init --with-deploy](../../docs/ja/cookbook/with-deploy.md) を参照。

## 何が試せるか

- RainbowKit の Connect modal 経由で injected wallet 選択 → wagmi `useAccount` で address 取得
- `useReadContract(totalSupply)` の loading → 数値遷移
- `useWriteContract(mint)` で tx 送信 → on-chain 反映を viem PublicClient で確認
- `tests/prepare-env.ts` + `tests/global-setup.ts` + `tests/global-teardown.ts` + `tests/fixture.ts` の framework 統合 boilerplate (kiwa CLI の `--with-deploy` 出力相当)
- Playwright globalSetup slot + dappE2eTest extend で `_anvilHandle` を override する pattern

## 動かす

前提として repo root で `pnpm install` 済 + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` / `forge` が PATH 上。

```bash
# repo root から
pnpm -F examples-nextjs-wagmi-rainbow test
```

中で起こること。

1. `pnpm -F @kiwa/core build` で fixture 用 dist 更新
2. `node --import tsx tests/prepare-env.ts` で anvil 起動 + forge build + forge create + `.env.local` 書き込み
3. `playwright test` で Next.js を起動 → connect-and-mint.spec.ts 実行
4. globalTeardown で anvil 停止 + pidfile cleanup

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/connect-and-mint.spec.ts` | RainbowKit modal click → wagmi state 遷移 → useReadContract / useWriteContract 経由の mint flow |
| `tests/fixture.ts` | `dappE2eTest` を extend して `_anvilHandle` を globalSetup の anvil に向ける override |
| `tests/prepare-env.ts` | anvil 起動 + forge build + forge create + `.env.local` 書き込みの boilerplate |
| `tests/global-setup.ts` / `tests/global-teardown.ts` | Playwright globalSetup / globalTeardown の slot |

`kiwa init --with-deploy <foundry-path>` で同じ 4 file 構成が自動生成される (CLI option PR #195)。

## 関連 cookbook

- [接続ボタン test](../../docs/ja/cookbook/connect-button.md)
- [Smart wallet / AA](../../docs/ja/cookbook/smart-wallet-aa.md) (応用)
- [Multi-wallet detection](../../docs/ja/cookbook/multi-wallet.md)

## 次に試す

- 複合 marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.ja.md)
- multi chain switch → [examples/nextjs-multi-chain](../nextjs-multi-chain/) (README 整備予定 / follow-up)
