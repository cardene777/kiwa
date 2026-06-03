import { test, expect } from './fixture';

const INITIAL_TOKEN = 100n * 10n ** 18n;

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
  await expect(page.getByTestId('my-votes')).not.toHaveText('myVotes: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('proposal-count')).not.toHaveText('proposalCount: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js DAO Governor propose/vote e2e', () => {
  test('T-DAO-001 connect 後 myVotes が初期 0 (delegate 前) 表示', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('my-votes')).toContainText(/^myVotes: \d+$/);
  });

  test('T-DAO-002 Delegate to Self click → myVotes が INITIAL_TOKEN になる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await page.getByTestId('delegate-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('my-votes')).toHaveText(`myVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });
  });

  test('T-DAO-003 Create Proposal で proposalCount が +1、currentId が新 id', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeCount = BigInt(
      ((await page.getByTestId('proposal-count').textContent()) ?? '')
        .replace('proposalCount: ', '')
        .trim(),
    );

    await page.getByTestId('propose-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('proposal-count')).toHaveText(
      `proposalCount: ${beforeCount + 1n}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('current-proposal-id')).toHaveText(
      `currentId: ${beforeCount + 1n}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('proposal-state')).toHaveText('state: Active', {
      timeout: 15_000,
    });
  });

  test('T-DAO-004 delegate → propose → Vote For で forVotes が INITIAL_TOKEN になる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('delegate-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('my-votes')).toHaveText(`myVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });

    await page.getByTestId('propose-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('proposal-state')).toHaveText('state: Active', {
      timeout: 15_000,
    });

    await page.getByTestId('vote-for-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('for-votes')).toHaveText(`forVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('against-votes')).toHaveText('againstVotes: 0');
    await expect(page.getByTestId('abstain-votes')).toHaveText('abstainVotes: 0');
  });

  test('T-DAO-005 Vote Against / Abstain でも対応する counter が増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('delegate-button').click();
    await dappE2e.waitForRpcIdle();

    await page.getByTestId('propose-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('proposal-state')).toHaveText('state: Active', {
      timeout: 15_000,
    });

    await page.getByTestId('vote-against-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('against-votes')).toHaveText(`againstVotes: ${INITIAL_TOKEN}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('for-votes')).toHaveText('forVotes: 0');
  });
});
