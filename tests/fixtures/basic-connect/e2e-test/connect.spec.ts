import { expect } from '@playwright/test';
import { dappE2eTest as test } from '@kiwa-test/core';
import { verifyMessage, verifyTypedData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

const MINI_DAPP_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>basic-connect</title></head>
<body>
  <button id="connect">Connect</button>
  <button id="sign">Sign</button>
  <button id="sign-typed">SignTypedData</button>
  <button id="send-tx">SendTransaction</button>
  <button id="register-event">RegisterEvent</button>
  <pre id="result"></pre>
  <pre id="event-result"></pre>
  <script>
    document.getElementById('connect').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById('result').textContent = accounts[0];
    });
    document.getElementById('sign').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const sig = await window.ethereum.request({
        method: 'personal_sign',
        params: ['hello kiwa', accounts[0]],
      });
      document.getElementById('result').textContent = sig;
    });
    document.getElementById('sign-typed').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const typedData = JSON.stringify({
        domain: { name: 'Mail', version: '1', chainId: 31337, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [{ name: 'contents', type: 'string' }],
        },
        primaryType: 'Mail',
        message: { contents: 'hello typed' },
      });
      const sig = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [accounts[0], typedData],
      });
      document.getElementById('result').textContent = sig;
    });
    document.getElementById('send-tx').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: '0xde0b6b3a7640000',
        }],
      });
      document.getElementById('result').textContent = hash;
    });
    document.getElementById('register-event').addEventListener('click', () => {
      window.ethereum.on('accountsChanged', (accounts) => {
        document.getElementById('event-result').textContent = 'accountsChanged: ' + accounts[0];
      });
    });
  </script>
</body>
</html>
`;

test.describe('basic-connect e2e (fixture 経由)', () => {
  test('T-E2E-001 fixture 経由で window.ethereum が定義される', async ({ page }) => {
    // Given
    await page.setContent(MINI_DAPP_HTML);
    // When
    const hasEthereum = await page.evaluate(() => typeof (window as any).ethereum !== 'undefined');
    // Then
    expect(hasEthereum).toBe(true);
  });

  test('T-E2E-002 #connect クリックでアドレスが #result に表示される', async ({ page, dappE2e }) => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.setContent(MINI_DAPP_HTML);
    // When
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    // Then - DOM 書き込み完了まで auto-wait、大文字小文字差異を許容するため poll で lower 比較
    await expect
      .poll(async () => (await page.locator('#result').textContent())?.toLowerCase() ?? '', {
        timeout: 5000,
      })
      .toBe(account.address.toLowerCase());
  });

  test('T-E2E-003 #sign クリックで返る signature が verifyMessage true になる', async ({ page, dappE2e }) => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    // When
    await page.click('#sign');
    await dappE2e.waitForRpcIdle();
    // sig 形式 (0x + 130 hex) が DOM に書き込まれるまで待つ
    await expect(page.locator('#result')).toHaveText(/^0x[0-9a-fA-F]{130}$/, { timeout: 5000 });
    const sigText = await page.locator('#result').textContent();
    const valid = await verifyMessage({
      address: account.address,
      message: 'hello kiwa',
      signature: sigText as `0x${string}`,
    });
    // Then
    expect(valid).toBe(true);
  });

  test('T-E2E-004 #sign-typed で eth_signTypedData_v4 署名が verifyTypedData で true', async ({ page, dappE2e }) => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    // When
    await page.click('#sign-typed');
    await dappE2e.waitForRpcIdle();
    // 0x + 130 hex の sig 形式が DOM に書き込まれるまで待つ
    await expect(page.locator('#result')).toHaveText(/^0x[0-9a-fA-F]{130}$/, { timeout: 5000 });
    const sigText = await page.locator('#result').textContent();
    const valid = await verifyTypedData({
      address: account.address,
      domain: {
        name: 'Mail',
        version: '1',
        chainId: 31337n,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
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
      primaryType: 'Mail',
      message: { contents: 'hello typed' },
      signature: sigText as `0x${string}`,
    });
    // Then
    expect(valid).toBe(true);
  });

  test('T-E2E-005 #send-tx で eth_sendTransaction が tx hash を返す', async ({ page, dappE2e }) => {
    // Given
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    // When
    await page.click('#send-tx');
    await dappE2e.waitForRpcIdle();
    // Then - tx hash 形式 (0x + 64 hex) が DOM に書き込まれるまで auto-wait
    await expect(page.locator('#result')).toHaveText(/^0x[0-9a-fA-F]{64}$/, { timeout: 10000 });
  });

  test('T-E2E-006 dappE2e.triggerEvent("accountsChanged") で page 側 handler が発火', async ({ page, dappE2e }) => {
    // Given
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#register-event');
    await dappE2e.waitForRpcIdle();
    const newAddr = '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826';
    // When
    await dappE2e.triggerEvent('accountsChanged', [newAddr]);
    // Then - event handler が DOM に書き込むまで auto-wait
    await expect(page.locator('#event-result')).toHaveText(`accountsChanged: ${newAddr}`, {
      timeout: 5000,
    });
  });

  test('T-E2E-007 eth_subscribe を page 側 catch で err.code === 4200 が観測される', async ({ page, dappE2e }) => {
    // Given
    await page.setContent(MINI_DAPP_HTML);
    // When - page context で window.ethereum.request({ method: 'eth_subscribe' }) を catch
    const errorCode = await page.evaluate(async () => {
      try {
        await (window as any).ethereum.request({
          method: 'eth_subscribe',
          params: ['newHeads'],
        });
        return null;
      } catch (e) {
        return (e as { code?: number }).code ?? null;
      }
    });
    await dappE2e.waitForRpcIdle();
    // Then - EIP-1193 method not supported code 4200 が page 境界を越えて保持される
    expect(errorCode).toBe(4200);
  });

  test('T-E2E-008 dappE2e.waitForRpcIdle() で chained RPC 完了を待機できる', async ({ page, dappE2e }) => {
    // Given - chained RPC を 3 つ並列発火、即座に DOM に書き込む dApp
    await page.setContent(MINI_DAPP_HTML);
    // When - 3 RPC を即時起動 (await しない)、すぐに waitForRpcIdle を呼ぶ
    await page.evaluate(() => {
      const eth = (window as any).ethereum;
      Promise.all([
        eth.request({ method: 'eth_accounts' }),
        eth.request({ method: 'eth_chainId' }),
        eth.request({ method: 'net_version' }),
      ]).then(([accounts, chainId, netVersion]) => {
        const el = document.getElementById('result');
        if (el) el.textContent = `${accounts[0]}|${chainId}|${netVersion}`;
      });
    });
    await dappE2e.waitForRpcIdle();
    // Then - waitForRpcIdle 後に 3 RPC 結果が DOM に揃って書き込まれている、format auto-wait
    await expect(page.locator('#result')).toHaveText(/^0x[0-9a-fA-F]{40}\|0x7a69\|31337$/, {
      timeout: 5000,
    });
  });

  test('T-E2E-009 reject mode で personal_sign が code 4001 で reject される', async ({ page, dappE2e }) => {
    await page.setContent(MINI_DAPP_HTML);
    await dappE2e.setApprovalMode('reject');

    const err = await page.evaluate(async () => {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        await (window as any).ethereum.request({
          method: 'personal_sign',
          params: ['hello', accounts[0]],
        });
        return null;
      } catch (e) {
        const error = e as { code?: number; message?: string };
        return {
          code: error.code ?? null,
          message: error.message ?? null,
        };
      }
    });
    await dappE2e.waitForRpcIdle();

    expect(err).toEqual({
      code: 4001,
      message: 'User rejected the request.',
    });
  });

  test('T-E2E-010 reject mode で wallet_switchEthereumChain が code 4001 で reject され、chainId は維持される', async ({ page, dappE2e }) => {
    await page.setContent(MINI_DAPP_HTML);
    await dappE2e.setApprovalMode('reject');

    const beforeChainId = await page.evaluate(
      async () => (window as any).ethereum.request({ method: 'eth_chainId' }),
    );
    const err = await page.evaluate(async () => {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }],
        });
        return null;
      } catch (e) {
        const error = e as { code?: number; message?: string };
        return {
          code: error.code ?? null,
          message: error.message ?? null,
        };
      }
    });
    await dappE2e.waitForRpcIdle();
    const afterChainId = await page.evaluate(
      async () => (window as any).ethereum.request({ method: 'eth_chainId' }),
    );

    expect(err).toEqual({
      code: 4001,
      message: 'User rejected the request.',
    });
    expect(afterChainId).toBe(beforeChainId);
  });

  test('T-E2E-011 reject mode で personal_sign が reject 後、 setApprovalMode("accept") で次回 personal_sign が成功する', async ({
    page,
    dappE2e,
  }) => {
    await page.setContent(MINI_DAPP_HTML);

    await dappE2e.setApprovalMode('reject');

    const rejectErr = await page.evaluate(async () => {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        await (window as any).ethereum.request({
          method: 'personal_sign',
          params: ['hello-after-reject', accounts[0]],
        });
        return null;
      } catch (e) {
        const error = e as { code?: number; message?: string };
        return { code: error.code ?? null, message: error.message ?? null };
      }
    });
    await dappE2e.waitForRpcIdle();

    expect(rejectErr).toEqual({
      code: 4001,
      message: 'User rejected the request.',
    });

    await dappE2e.setApprovalMode('approve');

    const accepted = await page.evaluate(async () => {
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: ['hello-after-reject', accounts[0]],
      });
      return { account: accounts[0] as string, signature: signature as string };
    });
    await dappE2e.waitForRpcIdle();

    expect(accepted.signature).toMatch(/^0x[0-9a-f]{130}$/i);

    const valid = await verifyMessage({
      address: accepted.account as `0x${string}`,
      message: 'hello-after-reject',
      signature: accepted.signature as `0x${string}`,
    });
    expect(valid).toBe(true);
  });
});
