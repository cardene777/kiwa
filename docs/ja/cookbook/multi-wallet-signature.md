# Multi-Wallet 署名検証を test する

> [🇬🇧 English](../../en/cookbook/multi-wallet-signature.md) • [🇯🇵 日本語](./multi-wallet-signature.md)

## Goal

EIP-6963 で 2 つの wallet を inject し、Wallet A で署名した値が
Wallet A の address に対応していることを test 側で検証します。
Wallet B は別 provider / 別 address の比較対象として使います。

## Prerequisites

- 2 つ以上の wallet を `test.use({ wallets: [...] })` で inject 済み
- viem の `recoverMessageAddress` / `recoverTypedDataAddress` が使える
- EIP-712 typed data を使う場合、sign 時と verify 時で同じ domain を再利用できる

## Steps

### 1. Wallet A / Wallet B provider を取り出す

page 側で `eip6963:announceProvider` を購読し、`rdns` ごとに provider を集めます。
`window.ethereum` は先頭 wallet だけなので、multi-wallet 検証では EIP-6963 経由で取得する方が安全です。

### 2. Wallet A で `personal_sign` と `eth_signTypedData_v4` を実行する

Wallet A の address を `eth_requestAccounts` で取得し、
同じ address を signer 引数として `personal_sign` と `eth_signTypedData_v4` を呼びます。
どちらも kiwa が直接処理するため、popup を待たず deterministic に test できます。

### 3. test 側で recover して Wallet A と一致するか確認する

recover 自体は pure function なので、Wallet B の RPC を使って実行する必要はありません。
ただし Wallet B の address を同時に取得しておくと、「Wallet A と一致し、Wallet B とは一致しない」を 1 test で確認できます。

### 4. EIP-191 prefix を意識する

`personal_sign` は EIP-191 の `\x19Ethereum Signed Message:\n...` prefix を含む message hash を署名します。
そのため verify 側は raw digest ではなく `recoverMessageAddress()` を使います。

`eth_sign` は kiwa では blocked です。
raw digest を別系統で署名済みのケースだけ、`recoverAddress({ hash, signature })` を使って verify してください。

### 5. EIP-712 domain separator を一致させる

`eth_signTypedData_v4` は `domain.name`、`version`、`chainId`、`verifyingContract` を含めて hash します。
sign に使った object をそのまま verify に再利用し、domain separator のずれを作らないのが安全です。

## 完全 example

~~~ts
import { expect } from '@playwright/test';
import { dappE2eTest } from '@kiwa-test/core';
import { recoverMessageAddress, recoverTypedDataAddress } from 'viem';

const test = dappE2eTest.extend({});

test.use({
  wallets: [[
    { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: '0xac09...' },
    { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: '0x59c6...' },
  ]],
} as never);

test('Wallet A signature is not confused with Wallet B', async ({ page, dappE2e }) => {
  const typedData = {
    domain: {
      name: 'Mail',
      version: '1',
      chainId: 31337,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as const,
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Mail: [{ name: 'contents', type: 'string' }],
    },
    primaryType: 'Mail' as const,
    message: { contents: 'hello typed' },
  };

  await page.setContent('<!doctype html><html><body></body></html>');

  const result = await page.evaluate(async (typedDataJson) => {
    const providers: Record<
      string,
      { request(args: { method: string; params?: unknown[] }): Promise<unknown> }
    > = {};
    window.addEventListener('eip6963:announceProvider', (event) => {
      const detail = (event as CustomEvent).detail as {
        info: { rdns: string };
        provider: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
      };
      providers[detail.info.rdns] = detail.provider;
    });
    window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));

    const walletA = providers['io.metamask'];
    const walletB = providers['io.rabby'];
    if (!walletA || !walletB) throw new Error('providers not announced');

    const [walletAAddress] = (await walletA.request({ method: 'eth_requestAccounts' })) as string[];
    const [walletBAddress] = (await walletB.request({ method: 'eth_requestAccounts' })) as string[];

    const personalSig = (await walletA.request({
      method: 'personal_sign',
      params: ['hello kiwa', walletAAddress],
    })) as `0x${string}`;

    const typedSig = (await walletA.request({
      method: 'eth_signTypedData_v4',
      params: [walletAAddress, typedDataJson],
    })) as `0x${string}`;

    return { walletAAddress, walletBAddress, personalSig, typedSig };
  }, JSON.stringify(typedData));

  await dappE2e.waitForRpcIdle();

  const recoveredPersonal = await recoverMessageAddress({
    message: 'hello kiwa',
    signature: result.personalSig,
  });
  const recoveredTyped = await recoverTypedDataAddress({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
    signature: result.typedSig,
  });

  expect(recoveredPersonal.toLowerCase()).toBe(result.walletAAddress.toLowerCase());
  expect(recoveredTyped.toLowerCase()).toBe(result.walletAAddress.toLowerCase());
  expect(result.walletBAddress.toLowerCase()).not.toBe(result.walletAAddress.toLowerCase());
});
~~~

## 関連

- [Concepts: EIP-6963 Multi-Wallet](../concepts/eip-6963.md)
- [Concepts: Fixture 設計](../concepts/fixture.md)
- [ERRORS.md](../../ERRORS.md)
