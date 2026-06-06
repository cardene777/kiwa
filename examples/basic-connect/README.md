# examples/basic-connect

The minimal example for first-time kiwa users. No contract, no Next.js — a single inline HTML page where `window.ethereum` is injected to exercise connect / sign / send-tx / EIP-6963 multi-wallet.

## What you can try

- `eth_requestAccounts` / `eth_accounts` to obtain anvil dev accounts
- `personal_sign` + viem `verifyMessage` round-trip
- `eth_signTypedData_v4` + viem `verifyTypedData` (EIP-712)
- `eth_sendTransaction` against the local anvil
- EIP-6963 `eip6963:announceProvider` multi-wallet discovery
- `dappE2e.waitForRpcIdle()` for pending-RPC quiescence

## How to run

Run `pnpm install` at the repo root first, then `pnpm exec playwright install chromium`. Foundry's `anvil` must be on your PATH.

```bash
# from the repo root
pnpm -F examples-basic-connect test
```

You should see all tests in `connect.spec.ts` and `eip6963.spec.ts` pass.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/connect.spec.ts` | Clicks on the inline-HTML Connect / Sign / SendTransaction buttons → fixture-injected `window.ethereum` → assertions against the anvil response |
| `tests/eip6963.spec.ts` | EIP-6963 multi-wallet announce → discover → pick → connect flow |

Each test starts with a header comment ("perspective / expected behaviour") and consistently calls `dappE2e.waitForRpcIdle()` before assertions so the `expect()` lines alone tell you what is being validated.

## Related cookbook entries

- [Connect button test](../../docs/en/cookbook/connect-button.md)
- [Multi-wallet detection](../../docs/en/cookbook/multi-wallet.md)
- [User reject path](../../docs/en/cookbook/user-reject.md)

## Where to go next

- Another contract-free starter → [examples/mint-nft](../mint-nft/README.md) (Foundry build + deploy + ERC721 mint flow)
- Next.js + wagmi starter → [examples/nextjs-wagmi-rainbow](../nextjs-wagmi-rainbow/README.md)
