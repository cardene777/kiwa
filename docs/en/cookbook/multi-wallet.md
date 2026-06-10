# Test a multi-wallet picker

> [🇬🇧 English](./multi-wallet.md) • [🇯🇵 日本語](../../ja/cookbook/multi-wallet.md)

## Goal

Inject two or more wallets via EIP-6963 and test the path of selecting a specific wallet through the picker UI.

## Prerequisites

- A wallet picker built on wagmi v2 + RainbowKit v2 (or equivalent)
- Two or more private keys for wallet configuration

## Steps

### 1. Configure wallets in the fixture

~~~ts
import { dappE2eTest } from '@kiwa-test/core';

const test = dappE2eTest.extend({});

test.use({
  wallets: [[
    { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: '0xac09...' },
    { name: 'Rabby',    rdns: 'io.rabby',    icon: 'data:,', privateKey: '0x59c6...' },
  ]],
} as never);
~~~

### 2. Select from the picker

~~~ts
test('connect via Rabby selection', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect wallet/i }).click();
  await page.getByText('Rabby').click();
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

### 3. Call wallet-specific helpers directly

~~~ts
test('connect via Rabby helper', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.wallets!['io.rabby'].connect();
});
~~~

## Verify

Check that the picker UI shows multiple wallets, or that `eip6963:announceProvider` events fire when `eip6963:requestProvider` is dispatched.

~~~ts
const announcements = await page.evaluate(() => {
  const seen: string[] = [];
  window.addEventListener('eip6963:announceProvider', (event) => {
    seen.push(((event as CustomEvent).detail.info.rdns));
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  return seen;
});
expect(announcements).toEqual(expect.arrayContaining(['io.metamask', 'io.rabby']));
~~~

## Related

- [Concepts: EIP-6963 Multi-Wallet](../concepts/eip-6963.md)
- [examples/basic-connect](../../../examples/basic-connect)
