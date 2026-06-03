import { test, expect } from './fixture';

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

async function waitBalanceLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('my-balance')).not.toHaveText('balance: (loading)', {
    timeout: 15_000,
  });
}

test.describe('Next.js multi-chain switch e2e', () => {
  test('T-MC-001 初期 chain は Mainnet (id=1) で表示される', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Mainnet', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('current-chain')).toContainText('id=1');
  });

  test('T-MC-002 Optimism switch button → current-chain が Optimism (id=10) に切替', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism (id=10)', {
      timeout: 15_000,
    });
  });

  test('T-MC-003 Base switch button → current-chain が Base (id=8453) に切替', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('switch-8453-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Base (id=8453)', {
      timeout: 15_000,
    });
  });

  test('T-MC-004 chain switch で contract address が変わる', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    const mainnetAddr = (await page.getByTestId('current-contract').textContent()) ?? '';
    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism');
    const optimismAddr = (await page.getByTestId('current-contract').textContent()) ?? '';
    expect(mainnetAddr.replace('contract: ', '')).not.toBe(optimismAddr.replace('contract: ', ''));
    expect(mainnetAddr).toMatch(/0x[0-9a-fA-F]{40}/);
    expect(optimismAddr).toMatch(/0x[0-9a-fA-F]{40}/);
  });

  test('T-MC-005 全 3 chain で balance が INITIAL_SUPPLY (1000e18) 表示される', async ({
    page,
    dappE2e,
  }) => {
    const EXPECTED = String(1000n * 10n ** 18n);
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitBalanceLoaded(page);
    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${EXPECTED}`, {
      timeout: 15_000,
    });

    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism');
    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${EXPECTED}`, {
      timeout: 15_000,
    });

    await page.getByTestId('switch-8453-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Base');
    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${EXPECTED}`, {
      timeout: 15_000,
    });
  });
});
