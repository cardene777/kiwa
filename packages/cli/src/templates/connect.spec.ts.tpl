import { expect } from '@playwright/test';
import { dappE2eTest as test } from '@dapp-e2e/core';
import { verifyMessage } from 'viem';

// dapp-e2e fixture injects an anvil-backed wallet; the address is obtained via
// eth_requestAccounts so no private key needs to live in the template.

const MINI_DAPP_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>dapp-e2e quickstart</title></head>
<body>
  <button id="connect">Connect</button>
  <button id="sign">Sign</button>
  <button id="send-tx">SendTransaction</button>
  <pre id="result"></pre>
  <script>
    document.getElementById('connect').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById('result').textContent = accounts[0];
    });
    document.getElementById('sign').addEventListener('click', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const sig = await window.ethereum.request({
        method: 'personal_sign',
        params: ['hello dapp-e2e', accounts[0]],
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
  </script>
</body>
</html>
`;

test.describe('dapp-e2e quickstart', () => {
  test('window.ethereum が fixture 経由で inject される', async ({ page }) => {
    await page.setContent(MINI_DAPP_HTML);
    const hasEthereum = await page.evaluate(() => typeof (window as any).ethereum !== 'undefined');
    expect(hasEthereum).toBe(true);
  });

  test('Connect クリックで anvil の dev account が返る', async ({ page, dappE2e }) => {
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    const text = await page.locator('#result').textContent({ timeout: 5000 });
    // anvil dev account address starts with 0x and is 42 chars (0x + 40 hex)
    expect(text).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test('Sign + verifyMessage で署名が valid', async ({ page, dappE2e }) => {
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    // capture the connected address before signing so we can verify with it
    const addressText = await page.locator('#result').textContent({ timeout: 5000 });
    const address = addressText as `0x${string}`;
    await page.click('#sign');
    await dappE2e.waitForRpcIdle();
    const sigText = await page.locator('#result').textContent({ timeout: 5000 });
    const valid = await verifyMessage({
      address,
      message: 'hello dapp-e2e',
      signature: sigText as `0x${string}`,
    });
    expect(valid).toBe(true);
  });

  test('SendTransaction で anvil から tx hash が返る', async ({ page, dappE2e }) => {
    await page.setContent(MINI_DAPP_HTML);
    await page.click('#connect');
    await dappE2e.waitForRpcIdle();
    await page.click('#send-tx');
    await dappE2e.waitForRpcIdle();
    const hashText = await page.locator('#result').textContent({ timeout: 10000 });
    expect(hashText).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });
});
