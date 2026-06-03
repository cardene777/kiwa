import { createPublicClient, defineChain, http } from 'viem';
import { test, expect } from './fixture';

const ANVIL_PORT = 8545;
const VEST_TOTAL = 1000n * 10n ** 18n;
const CLIFF_DURATION = 300n;
const VESTING_DURATION = 3600n;

const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
});

const pub = createPublicClient({ chain: anvilChain, transport: http() });

async function rpc(method: string, params: unknown[] = []): Promise<unknown> {
  return await (pub as unknown as { request: (a: { method: string; params: unknown[] }) => Promise<unknown> })
    .request({ method, params });
}

async function snapshot(): Promise<string> {
  return (await rpc('evm_snapshot')) as string;
}

async function revert(id: string): Promise<void> {
  await rpc('evm_revert', [id]);
}

async function increaseTime(seconds: bigint): Promise<void> {
  await rpc('evm_increaseTime', [Number(seconds)]);
  await rpc('evm_mine');
}

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
  await expect(page.getByTestId('token-balance')).not.toHaveText(
    'tokenBalance: (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('releasable')).not.toHaveText(
    'releasable: (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('released')).not.toHaveText(
    'released: (loading)',
    { timeout: 30_000 },
  );
}

function bigintFromText(text: string, prefix: string): bigint {
  return BigInt(text.replace(prefix, '').trim());
}

test.describe('Next.js Vesting (cliff + linear release + anvil 時間操作) e2e', () => {
  let snapshotId: string | undefined;

  test.beforeEach(async () => {
    snapshotId = await snapshot();
  });

  test.afterEach(async () => {
    if (snapshotId) {
      await revert(snapshotId);
      snapshotId = undefined;
    }
  });

  test('T-VS-000 debug page render (warmup)', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('total:', await page.getByTestId('total').textContent());
    console.log('cliff:', await page.getByTestId('cliff').textContent());
    console.log('releasable:', await page.getByTestId('releasable').textContent());
    console.log('released:', await page.getByTestId('released').textContent());
    console.log('token-balance:', await page.getByTestId('token-balance').textContent());
  });

  test('T-VS-001 connect 後 total / cliff 表示 / releasable=0 / released=0', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await expect(page.getByTestId('total')).toHaveText(`total: ${VEST_TOTAL}`);
    await expect(page.getByTestId('cliff')).toContainText(/^cliff: \d+$/);
    await expect(page.getByTestId('releasable')).toHaveText('releasable: 0');
    await expect(page.getByTestId('released')).toHaveText('released: 0');
  });

  test('T-VS-002 cliff 前は release しても token balance / released 変わらず 0 のまま', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeBalance = bigintFromText(
      (await page.getByTestId('token-balance').textContent()) ?? '',
      'tokenBalance: ',
    );

    await page.getByTestId('release-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const afterBalance = bigintFromText(
      (await page.getByTestId('token-balance').textContent()) ?? '',
      'tokenBalance: ',
    );
    await expect(page.getByTestId('released')).toHaveText('released: 0');
    expect(afterBalance).toBe(beforeBalance);
  });

  test('T-VS-003 cliff 通過後は partial release で released > 0 かつ < total になる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // cliff + 200s = 500s 進める (duration 3600s に対して 500/3600 = 13.8%)
    await increaseTime(CLIFF_DURATION + 200n);
    await page.waitForTimeout(2000);

    await page.getByTestId('release-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const released = bigintFromText(
      (await page.getByTestId('released').textContent()) ?? '',
      'released: ',
    );
    expect(released).toBeGreaterThan(0n);
    expect(released).toBeLessThan(VEST_TOTAL);
  });

  test('T-VS-004 期間満了 (start + duration 経過) で release すると released = total になる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // duration + buffer 分進める (1 hour + 60s で確実に satisfaction)
    await increaseTime(VESTING_DURATION + 60n);
    await page.waitForTimeout(2000);

    await page.getByTestId('release-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    await expect(page.getByTestId('released')).toHaveText(`released: ${VEST_TOTAL}`, {
      timeout: 10_000,
    });
    await expect(page.getByTestId('releasable')).toHaveText('releasable: 0', {
      timeout: 10_000,
    });
  });

  test('T-VS-005 full release 後にもう一度 release を呼んでも released は total から増えない', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // 1 回目 — 期間満了で全額 release
    await increaseTime(VESTING_DURATION + 60n);
    await page.waitForTimeout(2000);
    await page.getByTestId('release-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('released')).toHaveText(`released: ${VEST_TOTAL}`, {
      timeout: 10_000,
    });

    const balanceAfterFirst = bigintFromText(
      (await page.getByTestId('token-balance').textContent()) ?? '',
      'tokenBalance: ',
    );

    // 2 回目 — releasable=0 なので no-op
    await page.getByTestId('release-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    await expect(page.getByTestId('released')).toHaveText(`released: ${VEST_TOTAL}`);
    const balanceAfterSecond = bigintFromText(
      (await page.getByTestId('token-balance').textContent()) ?? '',
      'tokenBalance: ',
    );
    expect(balanceAfterSecond).toBe(balanceAfterFirst);
  });
});
