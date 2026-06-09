# Test multi-wallet signature verification

> [🇬🇧 English](./multi-wallet-signature.md) • [🇯🇵 日本語](../../ja/cookbook/multi-wallet-signature.md)

## Goal

Inject two wallets through EIP-6963 and verify that a signature produced by Wallet A
actually resolves back to Wallet A's address inside the test.
Wallet B is used as an independent provider/address for comparison.

## Prerequisites

- Inject two or more wallets with `test.use({ wallets: [...] })`
- Have viem `recoverMessageAddress` and `recoverTypedDataAddress` available
- When using EIP-712 typed data, be able to reuse the exact same domain object for signing and verification

## Steps

### 1. Collect Wallet A and Wallet B providers

Subscribe to `eip6963:announceProvider` in the page and collect providers by `rdns`.
`window.ethereum` only points to the first wallet, so EIP-6963 is the safer path for multi-wallet verification.

### 2. Sign with Wallet A using `personal_sign` and `eth_signTypedData_v4`

Fetch Wallet A's address via `eth_requestAccounts`,
then pass that same address into `personal_sign` and `eth_signTypedData_v4`.
kiwa handles both methods directly, so the test stays deterministic without popup UI.

### 3. Recover in the test process and compare with Wallet A

Recovery itself is a pure function, so it does not need Wallet B RPC calls.
Still, fetching Wallet B's address in the same test is useful because you can assert
"matches Wallet A and does not match Wallet B" in one place.

### 4. Account for the EIP-191 prefix

`personal_sign` signs the EIP-191 message hash with the `\x19Ethereum Signed Message:\n...` prefix.
That is why verification should use `recoverMessageAddress()` rather than raw-digest recovery.

`eth_sign` is blocked in kiwa.
Only use `recoverAddress({ hash, signature })` when you already have a raw-digest signature from another path.

### 5. Keep the EIP-712 domain separator identical

`eth_signTypedData_v4` hashes `domain.name`, `version`, `chainId`, and `verifyingContract`.
Reuse the exact same object for signing and verification so the domain separator cannot drift.

## Complete example

~~~ts
import { expect } from '@playwright/test';
import { dappE2eTest } from '@kiwa/core';
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

## Related

- [Concepts: EIP-6963 Multi-Wallet](../concepts/eip-6963.md)
- [Concepts: Fixture design](../concepts/fixture.md)
- [ERRORS.md](../../ERRORS.md)
