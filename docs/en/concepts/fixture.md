# Fixture design

> [🇬🇧 English](./fixture.md) • [🇯🇵 日本語](../../ja/concepts/fixture.md)

## TL;DR

`dappE2eTest` is a Playwright `test` extension that bundles anvil launch, wallet injection, and the connect flow into a single fixture.

## Why

dApp E2E tests involve many steps: anvil launch, contract deploy, wallet injection, connect, sign, send tx.
Writing this boilerplate per test produces flakiness.
kiwa offers anvil launch / EIP-1193 injection / Playwright fixture wiring in one path; the user just receives `page` and `dappE2e` to write tests.

## How

From test startup to the point where helpers are usable, the steps run in this order.

1. The Playwright test starts
2. `globalSetup` or `pretest` runs
3. `startAnvil` launches anvil
4. Contracts are deployed and `.env.local` is written
5. The Playwright fixture initializes
6. `dappE2eTest` injects the provider script into the page
7. `window.ethereum` is exposed via EIP-1193 and EIP-6963
8. Your test code runs
9. connect / sign / sendTx are issued through `dappE2e` helpers

## Account-switch event order

`setActiveAccount()` updates internal state before forwarding `accountsChanged` into the page,
so wagmi `useAccount()` observes the flow as "state update -> event delivery -> re-render".

Calling `setActiveAccount(1)` breaks down as follows.

1. The test calls `setActiveAccount(1)` on `DappE2eApi`
2. `DappE2eApi` sets the fixture's `rpcContext.activeIndex.current` to `1`
3. `DappE2eApi` emits `emitPageEvent('accountsChanged', [newAddress])`
4. The injected `window.ethereum` re-emits the same event inside the page
5. wagmi updates `useAccount()` and React re-renders
6. The fixture reports back to the test that `accountsChanged` was emitted

## Example

~~~ts
import { dappE2eTest as test, expect } from '@kiwa-lab/dapp';

const customTest = test.extend({
  // Override wallet private keys or approval mode as needed
  approvalMode: 'approve',
});

customTest('can sign after connect', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();
  const sig = await dappE2e.personalSign('hello');
  expect(sig).toMatch(/^0x[0-9a-f]+$/);
});
~~~

## Related

- [EIP-6963 Multi-Wallet](./eip-6963.md)
- [API Reference: dappE2eTest](../api/dapp-e2e-test.md)
