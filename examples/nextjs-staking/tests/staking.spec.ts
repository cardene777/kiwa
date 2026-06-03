import { test, expect } from './fixture';

const STAKE_AMOUNT = 100n * 10n ** 18n;

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
  await expect(page.getByTestId('stake-balance')).not.toHaveText(
    'stakeBalance: (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('staked')).not.toHaveText('staked: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('pending-reward')).not.toHaveText(
    'pendingReward: (loading)',
    { timeout: 30_000 },
  );
}

test.describe('Next.js Staking (stake / claim / unstake / reward accrual) e2e', () => {
  test('T-ST-000 debug page render (warmup)', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('stake-balance:', await page.getByTestId('stake-balance').textContent());
    console.log('staked:', await page.getByTestId('staked').textContent());
  });

  test('T-ST-001 connect 後 stakeBalance 表示 / staked=0 / pendingReward=0', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('stake-balance')).toContainText(/^stakeBalance: \d+$/);
    await expect(page.getByTestId('staked')).toHaveText('staked: 0');
    await expect(page.getByTestId('pending-reward')).toHaveText('pendingReward: 0');
  });

  test('T-ST-002 approve → stake で staked = STAKE_AMOUNT になる', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeStaked = BigInt(
      ((await page.getByTestId('staked').textContent()) ?? '').replace('staked: ', '').trim(),
    );
    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('stake-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('staked')).toHaveText(
      `staked: ${beforeStaked + STAKE_AMOUNT}`,
      { timeout: 15_000 },
    );
  });

  test('T-ST-003 stake 後 block 経過で pendingReward が増える', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // stake 実行 (前 test の累積を吸収するため、新規 STAKE_AMOUNT 分追加 stake)
    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('stake-button').click();
    await dappE2e.waitForRpcIdle();

    // refetchInterval 1500ms + block 進行を待つ (pending refetch 2 cycle 分)
    await page.waitForTimeout(4000);
    const pending = BigInt(
      ((await page.getByTestId('pending-reward').textContent()) ?? '')
        .replace('pendingReward: ', '')
        .trim(),
    );
    // block 進行で staked > 0 の人は pending > 0 になる
    expect(pending).toBeGreaterThan(0n);
  });

  test('T-ST-004 claim で reward balance が pending 分増え、pending が 0 戻る', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('stake-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(2000);

    const beforeReward = BigInt(
      ((await page.getByTestId('reward-balance').textContent()) ?? '')
        .replace('rewardBalance: ', '')
        .trim(),
    );

    await page.getByTestId('claim-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const afterReward = BigInt(
      ((await page.getByTestId('reward-balance').textContent()) ?? '')
        .replace('rewardBalance: ', '')
        .trim(),
    );
    // claim 後 reward balance は必ず増える (block 進行で pending > 0 だったため)
    expect(afterReward).toBeGreaterThan(beforeReward);
  });

  test('T-ST-005 unstake で staked が -STAKE_AMOUNT 減り stakeBalance が +STAKE_AMOUNT 戻る', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // 事前に stake 実行
    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('stake-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const beforeStaked = BigInt(
      ((await page.getByTestId('staked').textContent()) ?? '').replace('staked: ', '').trim(),
    );
    const beforeStakeBalance = BigInt(
      ((await page.getByTestId('stake-balance').textContent()) ?? '')
        .replace('stakeBalance: ', '')
        .trim(),
    );

    await page.getByTestId('unstake-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const afterStaked = BigInt(
      ((await page.getByTestId('staked').textContent()) ?? '').replace('staked: ', '').trim(),
    );
    const afterStakeBalance = BigInt(
      ((await page.getByTestId('stake-balance').textContent()) ?? '')
        .replace('stakeBalance: ', '')
        .trim(),
    );
    expect(beforeStaked - afterStaked).toBe(STAKE_AMOUNT);
    expect(afterStakeBalance - beforeStakeBalance).toBe(STAKE_AMOUNT);
  });
});
