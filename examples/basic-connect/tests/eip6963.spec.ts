import { expect } from '@playwright/test';
import { dappE2eTest } from '@dapp-e2e/core';
import { privateKeyToAccount } from 'viem/accounts';

const PK1 =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const PK2 =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const test = dappE2eTest.extend({});

test.use({
  wallets: [[
    { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
    { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: PK2 },
  ]],
} as never);

test.describe('EIP-6963 multi-wallet e2e', () => {
  test('T-E6E-001 2 wallet 並走 announce を requestProvider で再取得できる', async ({ page }) => {
    await page.setContent('<!doctype html><html><body></body></html>');

    const announcements = await page.evaluate(() => {
      const seen: Array<{ name: string; rdns: string; isMetaMask: boolean }> = [];
      window.addEventListener('eip6963:announceProvider', (event) => {
        const detail = (event as CustomEvent).detail as {
          info: { name: string; rdns: string };
          provider: { isMetaMask?: boolean };
        };
        seen.push({
          name: detail.info.name,
          rdns: detail.info.rdns,
          isMetaMask: detail.provider.isMetaMask === true,
        });
      });
      window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));
      return seen;
    });

    expect(announcements).toHaveLength(2);
    expect(announcements).toEqual(
      expect.arrayContaining([
        { name: 'MetaMask', rdns: 'io.metamask', isMetaMask: true },
        { name: 'Rabby', rdns: 'io.rabby', isMetaMask: true },
      ]),
    );
  });

  test('T-E6E-002 各 wallet provider で eth_requestAccounts すると異なる address を返す', async ({
    page,
    dappE2e,
  }) => {
    const metamaskAccount = privateKeyToAccount(PK1);
    const rabbyAccount = privateKeyToAccount(PK2);

    await page.setContent('<!doctype html><html><body></body></html>');

    const accounts = await page.evaluate(async () => {
      const providers: Record<
        string,
        { request(args: { method: string; params?: unknown[] }): Promise<string[]> }
      > = {};
      window.addEventListener('eip6963:announceProvider', (event) => {
        const detail = (event as CustomEvent).detail as {
          info: { rdns: string };
          provider: { request(args: { method: string; params?: unknown[] }): Promise<string[]> };
        };
        providers[detail.info.rdns] = detail.provider;
      });
      window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));
      const metamaskProvider = providers['io.metamask'];
      const rabbyProvider = providers['io.rabby'];
      if (!metamaskProvider || !rabbyProvider) {
        throw new Error('providers not announced');
      }
      const metamask = await metamaskProvider.request({
        method: 'eth_requestAccounts',
      });
      const rabby = await rabbyProvider.request({
        method: 'eth_requestAccounts',
      });
      const metamaskAddress = metamask[0];
      const rabbyAddress = rabby[0];
      if (!metamaskAddress || !rabbyAddress) {
        throw new Error('accounts not returned');
      }
      return {
        metamask: metamaskAddress,
        rabby: rabbyAddress,
      };
    });

    await dappE2e.waitForRpcIdle();

    expect(accounts.metamask.toLowerCase()).toBe(metamaskAccount.address.toLowerCase());
    expect(accounts.rabby.toLowerCase()).toBe(rabbyAccount.address.toLowerCase());
    expect(accounts.metamask.toLowerCase()).not.toBe(accounts.rabby.toLowerCase());
  });

  test('T-E6E-003 window.ethereum は最初の wallet のみを指す', async ({ page, dappE2e }) => {
    const metamaskAccount = privateKeyToAccount(PK1);
    const rabbyAccount = privateKeyToAccount(PK2);

    await page.setContent('<!doctype html><html><body></body></html>');

    const result = await page.evaluate(async () => {
      const providers: Record<
        string,
        { request(args: { method: string; params?: unknown[] }): Promise<string[]> }
      > = {};
      window.addEventListener('eip6963:announceProvider', (event) => {
        const detail = (event as CustomEvent).detail as {
          info: { rdns: string };
          provider: { request(args: { method: string; params?: unknown[] }): Promise<string[]> };
        };
        providers[detail.info.rdns] = detail.provider;
      });
      window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));
      const legacy = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      const firstWalletProvider = providers['io.metamask'];
      const secondWalletProvider = providers['io.rabby'];
      if (!firstWalletProvider || !secondWalletProvider) {
        throw new Error('providers not announced');
      }
      const firstWallet = await firstWalletProvider.request({
        method: 'eth_requestAccounts',
      });
      const secondWallet = await secondWalletProvider.request({
        method: 'eth_requestAccounts',
      });
      const legacyAddress = legacy[0];
      const firstWalletAddress = firstWallet[0];
      const secondWalletAddress = secondWallet[0];
      if (!legacyAddress || !firstWalletAddress || !secondWalletAddress) {
        throw new Error('accounts not returned');
      }
      return {
        isMetaMask: (window as any).ethereum.isMetaMask === true,
        legacy: legacyAddress,
        firstWallet: firstWalletAddress,
        secondWallet: secondWalletAddress,
      };
    });

    await dappE2e.waitForRpcIdle();

    expect(result.isMetaMask).toBe(true);
    expect(result.legacy.toLowerCase()).toBe(metamaskAccount.address.toLowerCase());
    expect(result.firstWallet.toLowerCase()).toBe(metamaskAccount.address.toLowerCase());
    expect(result.secondWallet.toLowerCase()).toBe(rabbyAccount.address.toLowerCase());
  });
});
