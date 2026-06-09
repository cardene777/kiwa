# examples/nextjs-bridge

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

L1 ↔ L2 bridge を 2 anvil + 4 contract (SourceBridge / SimpleERC20 / DestBridge / DestToken) で実証する example。 lock → mint と burn → unlock の双方向経路を kiwa の multi-chain anvil cluster で回す。

## 何が試せるか

- 2 anvil (L1 = chainId 1 / L2 = chainId 2) を並列起動する `startAnvilCluster`
- SourceBridge.lock で L1 token を lock → DestBridge.mint で L2 token を mint
- DestBridge.burn で L2 token を burn → SourceBridge.unlock で L1 token を unlock
- chain registry (`setChainRegistry`) 経由の wallet_switchEthereumChain
- chainId 不一致時の EIP-1193 code 4902 reject

## 動かす

```bash
pnpm -F examples-nextjs-bridge test
```

Next.js dev server は port 3040。 内部で 2 anvil cluster (port 8554 / 8555) が起動する。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/bridge.spec.ts` | L1 lock → L2 mint → L2 burn → L1 unlock の双方向 bridge flow を 10 ケース |

## 関連 cookbook

- [Multi-chain](../../docs/ja/cookbook/multi-chain.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- chain switch UI → [examples/nextjs-multi-chain](../nextjs-multi-chain/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
