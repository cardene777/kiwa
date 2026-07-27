# RPC handling

> [🇬🇧 English](./rpc-handling.md) • [🇯🇵 日本語](../../ja/concepts/rpc-handling.md)

## TL;DR

kiwa core handles 9 EIP-1193 RPC methods directly and forwards the rest to anvil JSON-RPC.
This lets you exercise flows like `eth_requestAccounts` and `personal_sign` without reproducing wallet popups.

## Why

A real wallet returns RPCs through popup / approve UIs that CI cannot reproduce.
kiwa keeps wallet behavior **inside code**, making it CI-friendly and giving switchable UX paths like `setApprovalMode('reject')` for testing rejection flows.

## The 9 directly-handled RPCs

The injected provider answers these 9 methods straight from fixture state.

| Method | Returns |
|---|---|
| `eth_requestAccounts` | The anvil dev account bound to the provider |
| `eth_accounts` | Same as above |
| `eth_chainId` | Current chain ID (hex) |
| `net_version` | Current chain ID (base-10 string) |
| `personal_sign` | Signature |
| `eth_signTypedData_v4` | Typed-data signature |
| `wallet_switchEthereumChain` | `null` (switches, then emits `chainChanged`) |
| `wallet_addEthereumChain` | `null` (adds to the registry only when `chainRegistry` is configured; either way it switches to that chain and emits `chainChanged`) |
| `eth_sendTransaction` | Transaction hash (broadcast to anvil) |

`eth_requestAccounts` and `eth_accounts` handle multiple accounts; the active one is switched via `setActiveAccount()`.
There are also paths for rejecting a connection (`rejectConnect`) and for contract accounts — see [docs/RPC.md](../../RPC.md).

These 5 methods are rejected with error code `4200` and never forwarded to anvil.

- `eth_subscribe`
- `eth_unsubscribe`
- `wallet_requestPermissions`
- `wallet_getPermissions`
- `eth_sign`

Every method outside the 9 handled and 5 blocked ones is forwarded to anvil's JSON-RPC as-is.

## Example: setApprovalMode

~~~ts
test('user reject path', async ({ page, dappE2e }) => {
  await dappE2e.setApprovalMode('reject');
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByTestId('error')).toContainText('User rejected'); // code 4001
});
~~~

## Related

- [RPC.md (Reference)](../../RPC.md)
- [Cookbook: User reject path](../cookbook/user-reject.md)
