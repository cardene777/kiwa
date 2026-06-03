import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

async function ensureConnected(page: import('@playwright/test').Page) {
  const connectBtn = page.getByRole('button', { name: /connect wallet/i });
  if (await connectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await connectBtn.click();
    const injected = page.getByText(/browser wallet|injected/i).first();
    if (await injected.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await injected.click();
    }
  }
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
    timeout: 15_000,
  });
}

test.describe('Vite + React + wagmi + RainbowKit e2e', () => {
  test('T-VR-001 connect 後 address が wagmi useAccount 経由で取得できる', async ({
    page,
    dappE2e,
  }) => {
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('account-address')).toContainText(account.address);
  });

  test('T-VR-002 useReadContract で totalSupply が数値表示される', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('total-supply')).toHaveText(/^totalSupply: \d+$/, {
      timeout: 15_000,
    });
  });

  test('T-VR-003 Mint button click → useWriteContract → balance が +1 増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();

    const balanceText = (await page.getByTestId('my-balance').textContent()) ?? '';
    const beforeBalance = Number(balanceText.replace('balance: ', '').trim());
    expect(Number.isFinite(beforeBalance)).toBe(true);

    await page.getByTestId('mint-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${beforeBalance + 1}`, {
      timeout: 15_000,
    });
  });
});
