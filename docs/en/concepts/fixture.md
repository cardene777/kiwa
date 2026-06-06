# Fixture design

## TL;DR

`dappE2eTest` is a Playwright `test` extension that bundles anvil launch, wallet injection, and the connect flow into a single fixture.

## Why

dApp E2E tests involve many steps: anvil launch, contract deploy, wallet injection, connect, sign, send tx.
Writing this boilerplate per test produces flakiness.
kiwa offers anvil launch / EIP-1193 injection / Playwright fixture wiring in one path; the user just receives `page` and `dappE2e` to write tests.

## How

```mermaid
graph TB
    A[playwright test starts] --> B[globalSetup or pretest]
    B --> C[startAnvil launches anvil]
    C --> D[deploy contracts and write .env.local]
    D --> E[Playwright fixture initializes]
    E --> F[dappE2eTest injects the provider script into page]
    F --> G[window.ethereum is exposed via EIP-1193 / EIP-6963]
    G --> H[user test code runs]
    H --> I[connect / sign / sendTx via dappE2e helpers]
```

## Account-switch event order

`setActiveAccount()` updates internal state before forwarding `accountsChanged` into the page,
so wagmi `useAccount()` observes the flow as "state update -> event delivery -> re-render".

```mermaid
sequenceDiagram
    participant T as test
    participant F as fixture
    participant API as DappE2eApi
    participant W as window.ethereum (inject)
    participant App as React app (wagmi useAccount)

    T->>API: setActiveAccount(1)
    API->>F: rpcContext.activeIndex.current = 1
    API->>W: emitPageEvent('accountsChanged', [newAddress])
    W->>App: window.ethereum.emit('accountsChanged', [newAddress])
    App->>App: wagmi internal: useAccount update -> re-render
    F-->>T: accountsChanged event emitted
```

## Example

~~~ts
import { dappE2eTest as test, expect } from '@kiwa/core';

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
- [API Reference: dappE2eTest](../api/kiwa-play.md)
