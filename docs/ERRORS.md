# Errors reference

> [🇬🇧 English](./ERRORS.md) • [🇯🇵 日本語](./ERRORS.ja.md)

This document is intended for users who want to inspect kiwa's error design.
In v0.1.0, `packages/core/src/rpc-handlers.ts` throws errors with EIP-1193-compatible codes,
and `packages/core/src/fixture.ts` converts them into the envelope returned to the page.
The injector script unwraps that envelope and restores it into a form where page-side `catch` blocks can read `code`.

## Official EIP-1193 error codes

| Code | Name | Meaning |
|---|---|---|
| `4001` | User Rejected Request | User rejected |
| `4100` | Unauthorized | Operation does not match the active account |
| `4200` | Unsupported Method | Method unsupported by the provider |
| `4900` | Disconnected | Provider disconnected |
| `4901` | Chain Disconnected | Disconnected from a specific chain |
| `-32700` | Parse error | Failed to parse the JSON string |
| `-32602` | Invalid params | Invalid param type or format |
| `-32603` | Internal error | Internal failure or transport failure |

The main codes that kiwa actually uses in v0.1.0 are `4100` `4200` `-32700` `-32602` `-32603`.
`4902`, which is often seen around EIP-1193, is also used in surrounding specs,
but the current core does not emit it because it does not have a chain registration table.

## Implementation-specific error code

This code is not part of the official EIP-1193 set but is used by this implementation.

| Code | Purpose |
|---|---|
| `3` | `eth_sendTransaction` transaction rejected (insufficient balance / revert / signer-related viem error) |

code `3` is produced in `packages/core/src/tx.ts`, where an error thrown by viem is caught and normalized into `Eip1193Error(3, 'transaction rejected: ...')`.
Using `(e as { code?: number }).code === 3` in a page-side `catch` block lets you observe rejection during submission to anvil.

## Main conditions in kiwa

### `4100`

- The address in `personal_sign` does not match the active account
- The signer address in `eth_signTypedData_v4` does not match
- `from` in `eth_sendTransaction` does not match

### `4200`

- `eth_subscribe`
- `eth_unsubscribe`
- `wallet_requestPermissions`
- `wallet_getPermissions`
- `eth_sign`

These are rejected immediately in core as blocked methods.

## `BLOCKED_METHODS` list and reasons

`BLOCKED_METHODS` in `packages/core/src/rpc-handlers.ts` is the list used to explicitly reject wallet features that the fixture does not reproduce
with `4200 (Unsupported Method)`.

| Method | Reason it is blocked |
|---|---|
| `eth_subscribe` | The injected provider assumes an HTTP bridge, so it cannot keep subscription ID allocation and ongoing push delivery |
| `eth_unsubscribe` | Because `eth_subscribe` is not implemented, there is no subscription state to cancel |
| `wallet_requestPermissions` | EIP-2255 permission scopes require state management across requests, but the HTTP path cannot retain that state. In the test fixture, approval UX is substituted with `setApprovalMode('approve' | 'reject')` instead of dynamic allowlist / blocklist management |
| `wallet_getPermissions` | Because there is no internal permission registry, the wallet cannot generate permission descriptors to return consistently |
| `eth_sign` | Raw digest signing differs significantly across wallet implementations, so kiwa narrows the deterministic test surface to `personal_sign` / `eth_signTypedData_v4` |

### `-32700`

- The typed data string for `eth_signTypedData_v4` is broken as JSON

### `-32602`

- The message for `personal_sign` looks like hex but contains invalid characters
- The message for `personal_sign` is not a string
- `wallet_switchEthereumChain` / `wallet_addEthereumChain` do not include `chainId`
- `chainId` is not in `0x` format

### `-32603`

- `eth_sendTransaction` or fallback RPC is called when no anvil port is available
- HTTP connection to anvil fails
- anvil returns a non-200 response or a non-JSON response
- An exception without an EIP-1193 code occurs inside core

## Error envelope

The fixture does not throw directly to the page. It first repacks the result into a plain object.

```typescript
type Envelope<T> =
  | { ok: true; result: T }
  | { ok: false; error: { code: number; message: string } };
```

This envelope is built in `page.exposeFunction('__dappE2eRpc', ...)` in `packages/core/src/fixture.ts`.
When `handleRpcRequest()` throws `Eip1193Error`, it keeps that `code` and `message`.
For a normal `Error` or an unknown exception, it fills in `-32603` before returning.

```typescript
try {
  const result = await handleRpcRequest(ctx, request);
  return { ok: true, result };
} catch (e) {
  const err = e as Error & { code?: number };
  return {
    ok: false,
    error: { code: err.code ?? -32603, message: err.message },
  };
}
```

## How `code` is preserved across the page boundary

The injector script receives the result of `window.__dappE2eRpc(args)`.
If `ok: false`, it creates a new `Error` and attaches `err.code = envelope.error.code`.
It then throws inside the page, so `catch` around `window.ethereum.request()` can read `code`.

```typescript
try {
  await window.ethereum.request({ method: 'eth_subscribe', params: ['newHeads'] });
} catch (e) {
  console.log((e as { code?: number }).code);
}
```

With this approach, even across Playwright `page.evaluate()`,
you can write page-side assertions such as `err.code === 4200`.
For a concrete example, see `T-E2E-007` in [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts).

## Relationship between events and errors

The payload code of the `disconnect` event is not necessarily the same as the rejection code of a request.
The helper `disconnect()` only sends `4900`, and it does not have a mechanism to automatically fail in-flight RPCs.
If you need to reproduce post-disconnect behavior strictly, it is safer to write event triggering and request assertions separately.

If `waitForRpcIdle()` times out, it also uses `-32603` as an `Eip1193Error`.
That failure comes from fixture control rather than the provider itself,
so in tests it is practical to assert the timeout message as well.

## Related

- [EIP-1193 provider errors](https://eips.ethereum.org/EIPS/eip-1193#provider-errors)
- [RPC.md](./RPC.md)
- [EVENTS.md](./EVENTS.md)
- [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts)
