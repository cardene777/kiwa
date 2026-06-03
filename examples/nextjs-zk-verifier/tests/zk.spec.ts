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
  await expect(page.getByTestId('stored-commitment')).not.toHaveText('stored: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('verified-count')).not.toHaveText(
    'verifiedCount: (loading)',
    { timeout: 30_000 },
  );
}

test.describe('Next.js ZK commit-reveal verifier e2e', () => {
  test('T-ZK-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('computed:', await page.getByTestId('computed-commitment').textContent());
    console.log('stored:', await page.getByTestId('stored-commitment').textContent());
  });

  test('T-ZK-001 connect 後 computedCommitment が 0x... + stored が 0x0 (未登録)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('computed-commitment')).toContainText(/^computed: 0x[0-9a-fA-F]{64}$/);
    await expect(page.getByTestId('stored-commitment')).toHaveText(
      `stored: 0x0000000000000000000000000000000000000000000000000000000000000000`,
    );
    await expect(page.getByTestId('matches')).toHaveText('matches: false');
  });

  test('T-ZK-002 Set Commitment で stored が computed と一致 (matches=true)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('set-commitment-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('matches')).toHaveText('matches: true', { timeout: 15_000 });
  });

  test('T-ZK-003 Verify (valid) で verifiedCount が +1 増える', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // ensure commitment が登録済 (T-ZK-002 後の累積 state)
    const matches = (await page.getByTestId('matches').textContent())?.includes('true');
    if (!matches) {
      await page.getByTestId('set-commitment-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('matches')).toHaveText('matches: true', { timeout: 15_000 });
    }

    const beforeVerified = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );

    await page.getByTestId('verify-valid-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('verified-count')).toHaveText(
      `verifiedCount: ${beforeVerified + 1}`,
      { timeout: 15_000 },
    );
  });

  test('T-ZK-004 Verify (invalid) で revert + verifiedCount 不変', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // ensure commitment 登録
    const matches = (await page.getByTestId('matches').textContent())?.includes('true');
    if (!matches) {
      await page.getByTestId('set-commitment-button').click();
      await dappE2e.waitForRpcIdle();
    }

    const beforeVerified = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );

    await page.getByTestId('verify-invalid-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    // revert なので verifiedCount は不変
    const afterVerified = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );
    expect(afterVerified).toBe(beforeVerified);
    // lastError に何か入る (rejected 検知)
    await expect(page.getByTestId('last-error')).not.toHaveText('lastError: (none)', {
      timeout: 10_000,
    });
  });

  test('T-ZK-005 totalVerified と verifiedCount が同じ (caller 1 人)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const v = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );
    const t = Number(
      ((await page.getByTestId('total-verified').textContent()) ?? '')
        .replace('totalVerified: ', '')
        .trim(),
    );
    expect(v).toBe(t);
  });
});
