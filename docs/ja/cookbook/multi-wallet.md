# Multi-Wallet picker を test する

## Goal

EIP-6963 で 2 以上の wallet を inject し、wallet picker UI から特定 wallet を選択して接続する経路を test する。

## Prerequisites

- wagmi v2 + RainbowKit v2 等の wallet picker を採用
- 2 つ以上の private key を持つ wallet 設定

## Steps

### 1. fixture で wallets を指定

~~~ts
import { dappE2eTest } from '@dapp-e2e/core';

const test = dappE2eTest.extend({});

test.use({
  wallets: [[
    { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: '0xac09...' },
    { name: 'Rabby',    rdns: 'io.rabby',    icon: 'data:,', privateKey: '0x59c6...' },
  ]],
} as never);
~~~

### 2. picker から選択

~~~ts
test('Rabby を選択して接続', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect wallet/i }).click();
  await page.getByText('Rabby').click();
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

### 3. wallet 別 helper を直接呼ぶ

~~~ts
test('Rabby helper 経由で connect', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.wallets!['io.rabby'].connect();
});
~~~

## Verify

picker UI で wallet が複数表示されるか、`window.dispatchEvent('eip6963:requestProvider')` で announce イベントが返ってくるかを確認。

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
