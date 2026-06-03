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
  await expect(page.getByTestId('total-logs')).not.toHaveText('totalLogs: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js Event history (past + watchContractEvent) e2e', () => {
  test('T-EV-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('total:', await page.getByTestId('total-logs').textContent());
    console.log('past:', await page.getByTestId('past-logs-count').textContent());
  });

  test('T-EV-001 connect 後 totalLogs / pastLogsCount / liveLogsCount が数値表示', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('total-logs')).toContainText(/^totalLogs: \d+$/);
    await expect(page.getByTestId('past-logs-count')).toContainText(/^pastLogsCount: \d+$/);
    await expect(page.getByTestId('live-logs-count')).toContainText(/^liveLogsCount: \d+$/);
  });

  test('T-EV-002 Emit Log 1 回で totalLogs / pastLogsCount が +1 増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeTotal = Number(
      ((await page.getByTestId('total-logs').textContent()) ?? '')
        .replace('totalLogs: ', '')
        .trim(),
    );
    const beforePast = Number(
      ((await page.getByTestId('past-logs-count').textContent()) ?? '')
        .replace('pastLogsCount: ', '')
        .trim(),
    );

    await page.getByTestId('emit-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('total-logs')).toHaveText(`totalLogs: ${beforeTotal + 1}`, {
      timeout: 15_000,
    });
    // refetchInterval 1.5s で past logs も更新される
    await expect(page.getByTestId('past-logs-count')).toHaveText(
      `pastLogsCount: ${beforePast + 1}`,
      { timeout: 15_000 },
    );
  });

  test('T-EV-003 3 回連続 Emit で totalLogs が +3 / pastLogsCount が +3', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeTotal = Number(
      ((await page.getByTestId('total-logs').textContent()) ?? '')
        .replace('totalLogs: ', '')
        .trim(),
    );
    const beforePast = Number(
      ((await page.getByTestId('past-logs-count').textContent()) ?? '')
        .replace('pastLogsCount: ', '')
        .trim(),
    );

    for (let i = 0; i < 3; i++) {
      await page.getByTestId('emit-button').click();
      await dappE2e.waitForRpcIdle();
    }

    await expect(page.getByTestId('total-logs')).toHaveText(`totalLogs: ${beforeTotal + 3}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('past-logs-count')).toHaveText(
      `pastLogsCount: ${beforePast + 3}`,
      { timeout: 15_000 },
    );
  });

  test('T-EV-004 liveLogsCount は wagmi useWatchContractEvent の初期値が数値表示', async ({
    page,
    dappE2e,
  }) => {
    // 注意: dapp-e2e fixture は eth_subscribe を code 4200 で reject する仕様のため、
    // wagmi useWatchContractEvent の subscribe 経路は anvil 上で動作保証外。
    // 本 test では「liveLogsCount が数値で表示される」確認のみで、累積動作は test しない。
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('live-logs-count')).toContainText(/^liveLogsCount: \d+$/);
  });

  test('T-EV-005 totalLogs と pastLogsCount は累積で同じ値', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const total = Number(
      ((await page.getByTestId('total-logs').textContent()) ?? '')
        .replace('totalLogs: ', '')
        .trim(),
    );
    const past = Number(
      ((await page.getByTestId('past-logs-count').textContent()) ?? '')
        .replace('pastLogsCount: ', '')
        .trim(),
    );
    expect(total).toBe(past);
  });
});
