import { test, expect } from './fixture';

const SUPPLY_AMOUNT = 100n * 10n ** 18n;
const BORROW_AMOUNT = 50n * 10n ** 18n;

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
  await expect(page.getByTestId('collateral-balance')).not.toHaveText(
    'collBalance: (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('supplied')).not.toHaveText('supplied: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('debt')).not.toHaveText('debt: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js Lending (supply / borrow / repay / health factor) e2e', () => {
  test('T-LD-000 debug page render (warmup)', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('coll:', await page.getByTestId('collateral-balance').textContent());
    console.log('supplied:', await page.getByTestId('supplied').textContent());
  });

  test('T-LD-001 connect 後 collateral balance / supplied=0 / debt=0 / HF=∞ 表示', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('collateral-balance')).toContainText(/^collBalance: \d+$/);
    await expect(page.getByTestId('supplied')).toHaveText('supplied: 0');
    await expect(page.getByTestId('debt')).toHaveText('debt: 0');
    await expect(page.getByTestId('health-factor')).toContainText('∞');
  });

  test('T-LD-002 approve → supply で supplied = SUPPLY_AMOUNT に増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeSupplied = BigInt(
      ((await page.getByTestId('supplied').textContent()) ?? '')
        .replace('supplied: ', '')
        .trim(),
    );

    await page.getByTestId('approve-collateral-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('supply-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('supplied')).toHaveText(
      `supplied: ${beforeSupplied + SUPPLY_AMOUNT}`,
      { timeout: 15_000 },
    );
  });

  test('T-LD-003 supply → borrow で debt = BORROW_AMOUNT、HF 数値表示', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeDebt = BigInt(
      ((await page.getByTestId('debt').textContent()) ?? '').replace('debt: ', '').trim(),
    );

    await page.getByTestId('approve-collateral-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('supply-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('borrow-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('debt')).toHaveText(`debt: ${beforeDebt + BORROW_AMOUNT}`, {
      timeout: 15_000,
    });
    // HF は ∞ ではなく数値表示に変わるはず (debt > 0)
    await expect(page.getByTestId('health-factor')).not.toContainText('∞', { timeout: 15_000 });
  });

  test('T-LD-004 borrow → approve borrow token → repay で debt が BORROW_AMOUNT 減る', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('approve-collateral-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('supply-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('borrow-button').click();
    await dappE2e.waitForRpcIdle();

    // borrow 完了で debt 増加するまで wait
    await expect(page.getByTestId('debt')).not.toHaveText('debt: 0', { timeout: 15_000 });
    // refetch 完了を待つため 1 sec の余裕を取って snapshot 取る
    await page.waitForTimeout(1500);
    const debtAfterBorrow = BigInt(
      ((await page.getByTestId('debt').textContent()) ?? '').replace('debt: ', '').trim(),
    );
    expect(debtAfterBorrow).toBeGreaterThanOrEqual(BORROW_AMOUNT);

    await page.getByTestId('approve-borrow-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('repay-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const debtAfterRepay = BigInt(
      ((await page.getByTestId('debt').textContent()) ?? '').replace('debt: ', '').trim(),
    );
    expect(debtAfterBorrow - debtAfterRepay).toBe(BORROW_AMOUNT);
  });

  test('T-LD-005 supplied 100e18 → borrow 50e18 で LTV 50% (max 75e18) 内で成立', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('approve-collateral-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('supply-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('borrow-button').click();
    await dappE2e.waitForRpcIdle();

    // refetch まで wait してから取得 (前 test の state 影響を avoid するため最終値だけ assert)
    await expect(page.getByTestId('supplied')).not.toHaveText('supplied: (loading)', {
      timeout: 15_000,
    });
    const afterSupplied = BigInt(
      ((await page.getByTestId('supplied').textContent()) ?? '')
        .replace('supplied: ', '')
        .trim(),
    );
    const afterDebt = BigInt(
      ((await page.getByTestId('debt').textContent()) ?? '').replace('debt: ', '').trim(),
    );

    // LTV invariant check: debt <= supplied * 7500 / 10000 が常に成立
    expect(afterSupplied).toBeGreaterThanOrEqual(SUPPLY_AMOUNT);
    expect(afterDebt).toBeGreaterThanOrEqual(BORROW_AMOUNT);
    const maxBorrow = (afterSupplied * 7500n) / 10000n;
    expect(afterDebt).toBeLessThanOrEqual(maxBorrow);
  });

  test('T-LD-006 approve なしで直接 supply を呼ぶと collateral transferFrom が失敗し revert する', async () => {
    // bob (PK2) は collateral token を持たず、かつ approve していない
    // この状態で supply() を呼ぶと SimpleERC20.transferFrom が allowance チェックで revert する
    const fs = await import('node:fs');
    const path = await import('node:path');
    const url = await import('node:url');
    const { createPublicClient, defineChain, http } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');

    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envContent = fs.readFileSync(
      path.resolve(__dirname, '..', '.env.local'),
      'utf8',
    );
    const lendingMatch = envContent.match(/NEXT_PUBLIC_LENDING=(0x[0-9a-fA-F]+)/);
    expect(lendingMatch).not.toBeNull();
    const LENDING = lendingMatch![1] as `0x${string}`;

    const anvilChain = defineChain({
      id: 31337,
      name: 'Anvil',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
    });

    const bob = privateKeyToAccount(
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    );
    const pub = createPublicClient({ chain: anvilChain, transport: http() });

    const SUPPLY_ABI = [
      {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'supply',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;

    await expect(
      pub.simulateContract({
        address: LENDING,
        abi: SUPPLY_ABI,
        functionName: 'supply',
        args: [SUPPLY_AMOUNT],
        account: bob.address,
      }),
    ).rejects.toThrow();
  });
});
