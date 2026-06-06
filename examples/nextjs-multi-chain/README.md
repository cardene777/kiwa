# examples/nextjs-multi-chain

Boots three anvils in parallel (A / B / C) and exercises `wallet_switchEthereumChain` against a per-chain `SimpleToken`. A focused way to try `setChainRegistry` and `startAnvilCluster`.

## What you can try

- `startAnvilCluster` running three anvils in parallel (chainId 31337 / 31338 / 31339)
- Rewrite chain registration mid-test via `setChainRegistry`
- Active chain switch through `wallet_switchEthereumChain`
- EIP-1193 code 4902 reject for unregistered chainIds
- Independent `SimpleToken` state per chain

## How to run

```bash
pnpm -F examples-nextjs-multi-chain test
```

Next.js dev server runs on port 3035.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/multi-chain.spec.ts` | Three-chain boot → chain switch → per-chain `SimpleToken` state, 6 cases |

## Related cookbook entries

- [Multi-chain](../../docs/en/cookbook/multi-chain.md)

## Where to go next

- L1 ↔ L2 bridge → [examples/nextjs-bridge](../nextjs-bridge/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
