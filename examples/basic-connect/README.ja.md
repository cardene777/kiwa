# examples/basic-connect

kiwa を最初に触る人向けの最小 example。 contract も Next.js も不要、 inline HTML 1 枚に `window.ethereum` を inject して接続 / 署名 / 送金 / EIP-6963 multi-wallet を試す。

## 何が試せるか

- `eth_requestAccounts` / `eth_accounts` で anvil dev account の取得
- `personal_sign` + viem `verifyMessage` で署名検証
- `eth_signTypedData_v4` + viem `verifyTypedData` で EIP-712 検証
- `eth_sendTransaction` で anvil への tx 送信
- EIP-6963 `eip6963:announceProvider` で multi-wallet 検出
- `dappE2e.waitForRpcIdle()` による RPC pending 待ち

## 動かす

前提として repo root で `pnpm install` 済 + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` が PATH 上。

```bash
# repo root から
pnpm -F examples-basic-connect test
```

期待する出力。 `connect.spec.ts` と `eip6963.spec.ts` の test が all pass する。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/connect.spec.ts` | inline HTML 上の Connect / Sign / SendTransaction button click → fixture inject の `window.ethereum` 経由 → anvil 応答を検証 |
| `tests/eip6963.spec.ts` | EIP-6963 multi-wallet announce → 検出 → 選択 → 接続のフロー検証 |

各 test の頭にコメント形式で「観点 / 期待挙動」が書かれている。 `expect()` 行を読むだけで何が validate されているか分かるよう、 `dappE2e.waitForRpcIdle()` を経由してから assertion する pattern が統一されている。

## 関連 cookbook

- [接続ボタン test](../../docs/ja/cookbook/connect-button.md)
- [Multi-wallet detection](../../docs/ja/cookbook/multi-wallet.md)
- [User reject path 検証](../../docs/ja/cookbook/user-reject.md)

## 次に試す

- 同じく contract 不要の入門 → [examples/mint-nft](../mint-nft/README.ja.md) (Foundry build + deploy + ERC721 mint flow)
- Next.js + wagmi 入門 → [examples/nextjs-wagmi-rainbow](../nextjs-wagmi-rainbow/README.ja.md)
