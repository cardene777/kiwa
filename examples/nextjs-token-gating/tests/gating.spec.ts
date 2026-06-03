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

async function waitLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('nft-balance')).not.toHaveText('nftBalance: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('is-gated')).not.toHaveText('isGated: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js Token gating (NFT 所有で access control) e2e', () => {
  test('T-GT-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('balance:', await page.getByTestId('nft-balance').textContent());
    console.log('gated:', await page.getByTestId('is-gated').textContent());
  });

  test('T-GT-001 connect 後 nftBalance / isGated / accessCount 数値表示', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('nft-balance')).toContainText(/^nftBalance: \d+$/);
    await expect(page.getByTestId('is-gated')).toContainText(/^isGated: (true|false)$/);
    await expect(page.getByTestId('access-count')).toContainText(/^accessCount: \d+$/);
  });

  test('T-GT-002 Mint NFT で nftBalance が +1、isGated=true に遷移', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeBalance = Number(
      ((await page.getByTestId('nft-balance').textContent()) ?? '')
        .replace('nftBalance: ', '')
        .trim(),
    );

    await page.getByTestId('mint-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('nft-balance')).toHaveText(`nftBalance: ${beforeBalance + 1}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('is-gated')).toHaveText('isGated: true', {
      timeout: 15_000,
    });
  });

  test('T-GT-003 mint 後 Read Secret で secret 取得 + accessCount +1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // ensure gated
    const isGated = (await page.getByTestId('is-gated').textContent())?.includes('true');
    if (!isGated) {
      await page.getByTestId('mint-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-gated')).toHaveText('isGated: true', {
        timeout: 15_000,
      });
    }

    const beforeAccess = Number(
      ((await page.getByTestId('access-count').textContent()) ?? '')
        .replace('accessCount: ', '')
        .trim(),
    );

    await page.getByTestId('read-secret-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('secret')).toHaveText('secret: alpha-pass-2025', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('access-count')).toHaveText(
      `accessCount: ${beforeAccess + 1}`,
      { timeout: 15_000 },
    );
  });

  test('T-GT-004 mint した後 isGated=true で読み取り可能 (累積動作確認)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    // T-GT-002 の累積で nftBalance > 0 + isGated=true 保証
    await expect(page.getByTestId('is-gated')).toHaveText('isGated: true');
  });

  test('T-GT-005 GatedContent.SECRET 定数が "alpha-pass-2025" と一致', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // Read Secret 経由で確認 (gated 必須なので mint 済み前提)
    const isGated = (await page.getByTestId('is-gated').textContent())?.includes('true');
    if (!isGated) {
      await page.getByTestId('mint-button').click();
      await dappE2e.waitForRpcIdle();
    }
    await page.getByTestId('read-secret-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('secret')).toHaveText('secret: alpha-pass-2025', {
      timeout: 15_000,
    });
  });
});
