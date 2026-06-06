# examples/nextjs-multi-chain

3 chain (anvil A / B / C) を並列起動し、 wallet_switchEthereumChain で chain を切替えながら SimpleToken の状態を読む example。 kiwa の `setChainRegistry` と `startAnvilCluster` の使い方を試せる。

## 何が試せるか

- `startAnvilCluster` で 3 anvil を並列起動 (chainId 31337 / 31338 / 31339)
- `setChainRegistry` で test 内 chain 登録を書換え
- wallet_switchEthereumChain による active chain 切替
- 未登録 chainId の EIP-1193 code 4902 reject
- chain ごとに deploy された SimpleToken の独立状態確認

## 動かす

```bash
pnpm -F examples-nextjs-multi-chain test
```

Next.js dev server は port 3035。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/multi-chain.spec.ts` | 3 chain 起動 → chain 切替 → 各 chain での SimpleToken state 確認、 6 ケース |

## 関連 cookbook

- [Multi-chain](../../docs/ja/cookbook/multi-chain.md)

## 次に試す

- L1 ↔ L2 bridge → [examples/nextjs-bridge](../nextjs-bridge/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
