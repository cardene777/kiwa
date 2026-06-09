# examples/nextjs-bridge

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

A two-anvil L1 ↔ L2 bridge built on four contracts (SourceBridge / SimpleERC20 / DestBridge / DestToken). The lock → mint and burn → unlock paths both run through kiwa's multi-chain anvil cluster.

## What you can try

- `startAnvilCluster` spinning up two anvils in parallel (L1 chainId 1 / L2 chainId 2)
- `SourceBridge.lock` → `DestBridge.mint` to bridge L1 tokens into L2
- `DestBridge.burn` → `SourceBridge.unlock` for the reverse path
- `wallet_switchEthereumChain` via `setChainRegistry`
- EIP-1193 code 4902 reject on chainId mismatch

## How to run

```bash
pnpm -F examples-nextjs-bridge test
```

Next.js dev server runs on port 3040. Internally a two-anvil cluster boots on ports 8554 and 8555.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/bridge.spec.ts` | Bidirectional bridge flow — L1 lock → L2 mint → L2 burn → L1 unlock, 10 cases |

## Related cookbook entries

- [Multi-chain](../../docs/en/cookbook/multi-chain.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Chain switch UI → [examples/nextjs-multi-chain](../nextjs-multi-chain/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
