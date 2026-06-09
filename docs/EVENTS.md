# Events reference

> [🇬🇧 English](./EVENTS.md) • [🇯🇵 日本語](./EVENTS.ja.md)

This document is intended for users who want to inspect kiwa's event API.
In v0.1.0, `packages/core/src/event-emitter.ts` and `packages/core/src/fixture.ts` work together
to deliver the four EIP-1193 events to the page side.
From tests, you can trigger them with `dappE2e.triggerEvent(name, payload)`.

## Four EIP-1193 events

| Event | Payload | Purpose |
|---|---|---|
| `accountsChanged` | `string[]` | Notify account switching or an empty account list |
| `chainChanged` | `0x${string}` | Reinitialize after a chain switch |
| `connect` | `{ chainId: 0x{hex} }` | Notify provider connection |
| `disconnect` | `{ code: number, message: string }` | Notify provider disconnection |

On the page side, subscribe with `window.ethereum.on(eventName, handler)`.
The injected provider also has `removeListener()`, so you can remove handlers when they are no longer needed.

```typescript
window.ethereum.on('chainChanged', (chainId) => {
  console.log('changed to', chainId);
});
```

## Test-side API

The `dappE2e` object passed from the fixture includes helpers for event control.

- `triggerEvent(event, ...args)`
- `connect()`
- `disconnect()`
- `switchChain(chainIdHex)`
- `waitForRpcIdle(timeoutMs?)`

`connect()` forwards a `connect` event to the page side as-is, and `disconnect()` does the same for `disconnect`.
`switchChain()` updates internal state before sending `chainChanged`,
so after the event fires, the state stays consistent with `eth_chainId`.

## Basic example

The following example is the minimum setup for receiving `accountsChanged` in a page-side handler.

```typescript
import { expect } from '@playwright/test';
import { dappE2eTest as test } from '@kiwa/core';

test('accountsChanged event が page 側 handler を発火する', async ({ page, dappE2e }) => {
  await page.setContent(`
    <pre id="event-result"></pre>
    <script>
      window.ethereum.on('accountsChanged', (accounts) => {
        document.getElementById('event-result').textContent = 'accountsChanged: ' + accounts[0];
      });
    </script>
  `);

  const newAddr = '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826';
  await dappE2e.triggerEvent('accountsChanged', [newAddr]);

  const text = await page.locator('#event-result').textContent({ timeout: 5000 });
  expect(text).toBe(`accountsChanged: ${newAddr}`);
});
```

This follows the same idea as `T-E2E-006` in [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts).

## How to synchronize with handlers

`triggerEvent()` itself only calls `window.__dappE2eEmit()` inside the page through `page.evaluate()`.
Because of that, for synchronous handlers, waiting on a locator is enough.
If the event handler fires more RPCs, combining it with `waitForRpcIdle()` lets you proceed to assertions
only after pending RPCs are drained.

```typescript
await dappE2e.triggerEvent('chainChanged', '0xa86a');
await dappE2e.waitForRpcIdle();
```

In addition to waiting for pending RPCs to resolve,
`waitForRpcIdle()` also waits for two final `requestAnimationFrame` ticks,
which makes it easier to wait for subsequent DOM updates caused by RPC results as well.

## Notes on payload design

The payload shapes for `connect` and `disconnect` follow EIP-1193.
However, `disconnect()` emitted automatically by the v0.1.0 helper
always sends `{ code: 4900, message: 'Disconnected' }`.
If you want to test `4901`, specify it explicitly, for example with `triggerEvent('disconnect', { code: 4901, message: 'Chain disconnected' })`.

Because `accountsChanged` uses an array payload, you pass an array as a single argument,
for example `triggerEvent('accountsChanged', [addr])`.

## EIP-6963 announcement behavior

kiwa supports EIP-6963 (Multi Injected Provider Discovery), so you can inject multiple wallets into a single page in parallel.

### Events

| Event | Direction | Description |
|---|---|---|
| `eip6963:announceProvider` | kiwa → window | Each wallet announces itself, with `detail: { info, provider }` (`Object.freeze`) |
| `eip6963:requestProvider` | dApp → window | The dApp requests the wallet list again, and kiwa re-announces all registered wallets |

### `info` specification

`info` is immutable with `Object.freeze` (required by the EIP-6963 spec).

| field | Type | Description |
|---|---|---|
| `uuid` | string | Unique per wallet, generated with `crypto.randomUUID()` |
| `name` | string | Wallet display name (for example `MetaMask`) |
| `icon` | string | Icon data URI (`data:image/svg+xml;base64,...`) |
| `rdns` | string | Reverse-DNS naming (for example `io.metamask`) |

### `rdns` naming convention

For dApp compatibility, it is recommended to use the same `rdns` value as the real wallet for each wallet.

| Wallet | rdns |
|---|---|
| MetaMask | `io.metamask` |
| Rabby | `io.rabby` |
| Coinbase Wallet | `com.coinbase.wallet` |

### `window.ethereum` compatibility

`window.ethereum` is injected for **only the first wallet**.
This preserves legacy provider compatibility.
If you want to handle multiple wallets, acquire them through EIP-6963 instead of `window.ethereum`.

## Related

- [EIP-1193 events](https://eips.ethereum.org/EIPS/eip-1193#events)
- [RPC.md](./RPC.md)
- [ERRORS.md](./ERRORS.md)
- [examples/basic-connect/tests/connect.spec.ts](../examples/basic-connect/tests/connect.spec.ts)
