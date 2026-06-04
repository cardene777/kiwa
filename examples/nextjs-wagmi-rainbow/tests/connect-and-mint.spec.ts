import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

async function ensureConnected(page: import('@playwright/test').Page) {
  // RainbowKit injectedWallet は window.ethereum を auto 検出 + autoConnect する。
  // Connect button が出ていれば click、既に connected なら skip。
  const connectBtn = page.getByRole('button', { name: /connect wallet/i });
  if (await connectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await connectBtn.click();
    // RainbowKit modal で Injected wallet を選択
    const injected = page.getByText(/browser wallet|injected/i).first();
    if (await injected.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await injected.click();
    }
  }
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
    timeout: 15_000,
  });
}

test.describe('Next.js + wagmi + RainbowKit e2e', () => {
  test('T-NXR-001 connect 後 address が wagmi useAccount 経由で取得できる', async ({
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

  test('T-NXR-002 useReadContract で totalSupply が数値表示される (loading から数値に遷移)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    // useReadContract の初期 fetch 完了で totalSupply: <数値> 形式に遷移する
    await expect(page.getByTestId('total-supply')).toHaveText(/^totalSupply: \d+$/, {
      timeout: 15_000,
    });
  });

  test('T-NXR-003 Mint button click → useWriteContract → balance が +1 増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();

    // 現在 balance を取得 (test 順序依存避けるため動的に)
    const balanceText = (await page.getByTestId('my-balance').textContent()) ?? '';
    const beforeBalance = Number(balanceText.replace('balance: ', '').trim());
    expect(Number.isFinite(beforeBalance)).toBe(true);

    await page.getByTestId('mint-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${beforeBalance + 1}`, {
      timeout: 15_000,
    });
  });

  test('T-WR-004 connection error recovery test', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('recovery-balance')).toHaveText(/^recoveryBalance: \d+$/, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('rpc-error')).toHaveText('rpcError: (none)');

    await page.getByTestId('break-rpc-button').click();
    await page.waitForFunction(
      () => document.querySelector('[data-testid="rpc-error"]')?.textContent !== 'rpcError: (none)',
      undefined,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('recovery-balance')).toHaveText('recoveryBalance: (error)');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('rpc-mode')).toHaveText('rpcMode: broken');
    await expect(page.getByTestId('rpc-error')).not.toHaveText('rpcError: (none)', {
      timeout: 15_000,
    });

    await page.getByTestId('restore-rpc-button').click();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('rpc-mode')).toHaveText('rpcMode: healthy');
    await expect(page.getByTestId('rpc-error')).toHaveText('rpcError: (none)', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('recovery-balance')).toHaveText(/^recoveryBalance: \d+$/, {
      timeout: 15_000,
    });
  });
});
