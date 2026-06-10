# RPC reference

> [🇬🇧 English](./RPC.md) • [🇯🇵 日本語](./RPC.ja.md)

This document is intended for users who want to inspect kiwa's EIP-1193-compatible RPCs.
In v0.1.0, core handles 9 methods directly in `packages/core/src/rpc-handlers.ts`,
and forwards everything else to anvil JSON-RPC.
See [ERRORS.md](./ERRORS.md) for how errors are returned.

## Nine RPCs handled directly

| Method | Params | Returns | Primary error codes |
|---|---|---|---|
| `eth_requestAccounts` | None | `string[]` | None |
| `eth_accounts` | None | `string[]` | None |
| `eth_chainId` | None | `0x${string}` | None |
| `net_version` | None | `string` | None |
| `personal_sign` | `[message: string, address: 0x{hex}]` | `0x${string}` | `4001` / `4100` / `-32602` |
| `eth_signTypedData_v4` | `[address: 0x{hex}, typedDataJson: string]` | `0x${string}` | `4001` / `4100` / `-32700` |
| `wallet_switchEthereumChain` | `[{ chainId: 0x{hex} }]` | `null` | `4001` / `4902` / `-32602` |
| `wallet_addEthereumChain` | `[{ chainId: 0x{hex}, ... }]` | `null` | `-32602` |
| `eth_sendTransaction` | `[txRequest]` | `0x${string}` | `3` / `4001` / `4100` / `-32603` |

These 9 methods return values based on the fixture state for the active account and current chain.
Only `eth_sendTransaction` needs to broadcast to anvil, so it calls `sendTransaction()` internally.
The signing methods use viem's account implementation, but callers can treat them in the same shape as normal `window.ethereum.request()`.

### Account / chain methods

`eth_requestAccounts` and `eth_accounts` return the anvil dev account bound to the injected provider.
`eth_chainId` returns hex, and `net_version` returns a base-10 string,
which makes it easier to pass existing dApp provider initialization code through unchanged.

```typescript
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
const networkId = await window.ethereum.request({ method: 'net_version' });
```

The returned values are `accounts[0]` as a 20-byte address, `chainId` as hex such as `0x7a69`,
and `networkId` as a base-10 string such as `31337`.

### Signing methods

`personal_sign` accepts two kinds of message.

- An even-length hex string starting with `0x`
- A regular UTF-8 string

If a hex-like string contains invalid characters or has odd length, it returns `-32602`.
If the address does not match the active account, it returns `4100`.
While fixture API `dappE2e.setApprovalMode('reject')` is enabled,
`personal_sign` and `eth_signTypedData_v4` return `4001` (`User rejected the request.`).

```typescript
const sig = await window.ethereum.request({
  method: 'personal_sign',
  params: ['hello kiwa', account],
});
```

`eth_signTypedData_v4` accepts a JSON string as its second argument,
calls `JSON.parse()` internally, and then passes `types` excluding `EIP712Domain` to viem.
If the JSON itself is broken, it fails with `-32700`.

```typescript
const sig = await window.ethereum.request({
  method: 'eth_signTypedData_v4',
  params: [account, JSON.stringify(typedData)],
});
```

### Chain update methods

`wallet_switchEthereumChain` and `wallet_addEthereumChain` both validate `chainId`,
update `chainState.current`, and notify the page side with `chainChanged` through the internal emitter.
Starting in v0.3, an optional chain registry (`dappE2e.setChainRegistry(chains)`) is available.
When the registry is enabled, `wallet_switchEthereumChain` to an unregistered chain returns EIP-3326's `4902 (Unrecognized Chain ID)`.
When the registry is not configured, it continues to always succeed for backward compatibility.
When approval mode is `'reject'`, only `wallet_switchEthereumChain` fails with `4001`,
while `wallet_addEthereumChain` still executes as before.

```typescript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xa86a' }],
});
```

#### Using the chain registry (v0.3+)

If you set the initial chain set with `dappE2e.setChainRegistry(chains)`, `wallet_switchEthereumChain` to an unregistered chain will fail with `4902`.

```typescript
await dappE2e.setChainRegistry([
  { chainId: '0x1', chainName: 'Ethereum Mainnet' },
  { chainId: '0xa', chainName: 'Optimism' },
]);

// 0xa86a (Avalanche) is not registered, so this fails with 4902
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xa86a' }],
});
```

Calling `wallet_addEthereumChain` also adds the chain to the registry, so switching succeeds afterward (EIP-3085 compliant).

### Transaction methods

`eth_sendTransaction` checks whether `from` matches the active account
and returns the tx hash submitted to anvil.
If no anvil port is available outside the fixture lifecycle, it fails with `-32603`.
Transaction rejection from viem (insufficient balance / revert / signer-related error) is rejected with EIP-1193 code `3`.
When approval mode is `'reject'`, it returns `4001` before broadcasting.

```typescript
const hash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: account,
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    value: '0xde0b6b3a7640000',
  }],
});
```

## Approval Mode (v0.2+)

`dappE2e.setApprovalMode(mode)` lets you switch wallet approval behavior.
Use it when you want to deterministically trigger User Reject (`EIP-1193` code `4001`) from tests.

### API

| Mode | Behavior |
|---|---|
| `'approve'` (default) | Execute the 4 target methods normally |
| `'reject'` | The 4 target methods return `Eip1193Error(4001, 'User rejected the request.')` |

### Target methods

- `personal_sign`
- `eth_signTypedData_v4`
- `eth_sendTransaction`
- `wallet_switchEthereumChain`

### Example

```typescript
import { dappE2eTest as test } from '@kiwa-test/core';

test('reject 経路の error UX 確認', async ({ page, dappE2e }) => {
  await dappE2e.setApprovalMode('reject');

  const error = await page.evaluate(async () => {
    try {
      await (window as any).ethereum.request({
        method: 'personal_sign',
        params: ['hello', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      });
      return null;
    } catch (e) {
      return { code: (e as { code?: number }).code ?? null };
    }
  });

  expect(error?.code).toBe(4001);
});
```

Read-only methods (`eth_requestAccounts` / `eth_accounts` / `eth_chainId` / `net_version` and so on) and
`wallet_addEthereumChain` are outside approval checks.

## anvilProxy fallback

Methods other than the 9 above are forwarded to anvil JSON-RPC through `proxyToAnvil()`.
Typical examples are `eth_blockNumber` `eth_getBalance` `eth_call` `eth_estimateGas` `eth_getCode`.
If anvil returns a normal JSON-RPC error, its `code` and `message` are returned to the page side unchanged.
Connection failure, non-200 responses, non-JSON responses, and invalid response shapes become `-32603`.

```typescript
const blockNumber = await window.ethereum.request({ method: 'eth_blockNumber' });
```

## Blocked methods

Methods not handled over the HTTP path are rejected in core before forwarding.
The blocked methods in v0.1.0 are the following five.

- `eth_subscribe`
- `eth_unsubscribe`
- `wallet_requestPermissions`
- `wallet_getPermissions`
- `eth_sign`

These are never forwarded to anvil and always return `4200`.
[ERRORS.md](./ERRORS.md) explains how to observe them across the page boundary.

## Related

- [EIP-1193 specification](https://eips.ethereum.org/EIPS/eip-1193)
- [viem local account docs](https://viem.sh/docs/accounts/local/privateKeyToAccount.html)
- [EVENTS.md](./EVENTS.md)
- [ERRORS.md](./ERRORS.md)
- [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts)
