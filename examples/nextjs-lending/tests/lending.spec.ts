import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectCustomError, revertChain, snapshotChain } from '@kiwa-test/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const ANVIL_PORT = 8545;
const SUPPLY_AMOUNT = 100n * 10n ** 18n;
const BORROW_AMOUNT = 50n * 10n ** 18n;
const FULL_COLLATERAL_AMOUNT = 1000n * 10n ** 18n;
const MAX_LTV_DEBT = 750n * 10n ** 18n;
const EXCESSIVE_DEBT = 751n * 10n ** 18n;
const LIQUIDATION_BORROW_AMOUNT = 75n * 10n ** 18n;
const LIQUIDATION_PRICE = 7874n * 10n ** 14n;
const ALICE_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const BOB_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
});
const pub = createPublicClient({ chain: anvilChain, transport: http() });

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'available', type: 'uint256' },
      { name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientAllowance',
    type: 'error',
  },
] as const;

const LENDING_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'repay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'borrower', type: 'address' }],
    name: 'liquidate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'collateralBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'debtBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'collateralValue',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'requestedDebt', type: 'uint256' },
      { name: 'maxDebt', type: 'uint256' },
    ],
    name: 'MaxLTVExceeded',
    type: 'error',
  },
  {
    inputs: [
      { name: 'available', type: 'uint256' },
      { name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientAllowance',
    type: 'error',
  },
] as const;

const ORACLE_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'newPrice', type: 'uint256' },
    ],
    name: 'setPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NotOwner',
    type: 'error',
  },
] as const;

function walletFor(privateKey: Hex) {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: anvilChain,
    transport: http(),
  });
}

function readRuntimeEnv() {
  const envLocal = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
  const pairs = envLocal
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)] as const;
    });
  const env = Object.fromEntries(pairs);
  if (
    !env.NEXT_PUBLIC_COLLATERAL ||
    !env.NEXT_PUBLIC_BORROW ||
    !env.NEXT_PUBLIC_LENDING ||
    !env.NEXT_PUBLIC_ORACLE
  ) {
    throw new Error('Missing required values in examples/nextjs-lending/.env.local');
  }
  return {
    collateral: env.NEXT_PUBLIC_COLLATERAL as `0x${string}`,
    borrow: env.NEXT_PUBLIC_BORROW as `0x${string}`,
    lending: env.NEXT_PUBLIC_LENDING as `0x${string}`,
    oracle: env.NEXT_PUBLIC_ORACLE as `0x${string}`,
  };
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
  let snapshotId: Hex | undefined;

  test.beforeEach(async () => {
    snapshotId = await snapshotChain(pub);
  });

  test.afterEach(async () => {
    if (snapshotId) {
      await revertChain(pub, snapshotId);
      snapshotId = undefined;
    }
  });

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

    await expect(page.getByTestId('debt')).not.toHaveText('debt: 0', { timeout: 15_000 });
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

    await expect(page.getByTestId('supplied')).toHaveText(`supplied: ${SUPPLY_AMOUNT}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('debt')).toHaveText(`debt: ${BORROW_AMOUNT}`, {
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

    expect(afterSupplied).toBeGreaterThanOrEqual(SUPPLY_AMOUNT);
    expect(afterDebt).toBeGreaterThanOrEqual(BORROW_AMOUNT);
    const maxBorrow = (afterSupplied * 7500n) / 10000n;
    expect(afterDebt).toBeLessThanOrEqual(maxBorrow);
  });

  test('T-LD-006 approve なしで直接 supply を呼ぶと collateral transferFrom が custom error で revert する', async () => {
    const { lending } = readRuntimeEnv();
    const bob = privateKeyToAccount(BOB_PK);

    try {
      await pub.simulateContract({
        address: lending,
        abi: LENDING_ABI,
        functionName: 'supply',
        args: [SUPPLY_AMOUNT],
        account: bob.address,
      });
      throw new Error('expected supply() to revert');
    } catch (error) {
      expectCustomError(error, 'InsufficientAllowance', [0n, SUPPLY_AMOUNT]);
    }
  });

  test('T-LD-007 collateral 1000e18 に対して 751e18 borrow は MaxLTVExceeded(uint256,uint256) で revert する', async () => {
    const { collateral, lending } = readRuntimeEnv();
    const aliceWallet = walletFor(ALICE_PK);

    const approveHash = await aliceWallet.writeContract({
      address: collateral,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [lending, FULL_COLLATERAL_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: approveHash });

    const supplyHash = await aliceWallet.writeContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'supply',
      args: [FULL_COLLATERAL_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: supplyHash });

    await pub.simulateContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'borrow',
      args: [MAX_LTV_DEBT],
      account: aliceWallet.account.address,
    });

    try {
      await pub.simulateContract({
        address: lending,
        abi: LENDING_ABI,
        functionName: 'borrow',
        args: [EXCESSIVE_DEBT],
        account: aliceWallet.account.address,
      });
      throw new Error('expected borrow() to revert');
    } catch (error) {
      expectCustomError(error, 'MaxLTVExceeded', [EXCESSIVE_DEBT, MAX_LTV_DEBT]);
    }
  });

  test('T-LD-008 collateral price 下落後に liquidate で debt が cleared され liquidator が collateral を取得する', async () => {
    const { collateral, borrow, lending, oracle } = readRuntimeEnv();
    const aliceWallet = walletFor(ALICE_PK);
    const bobWallet = walletFor(BOB_PK);

    const approveCollateralHash = await aliceWallet.writeContract({
      address: collateral,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [lending, SUPPLY_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: approveCollateralHash });

    const supplyHash = await aliceWallet.writeContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'supply',
      args: [SUPPLY_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: supplyHash });

    const borrowHash = await aliceWallet.writeContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'borrow',
      args: [LIQUIDATION_BORROW_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: borrowHash });

    const setPriceHash = await aliceWallet.writeContract({
      address: oracle,
      abi: ORACLE_ABI,
      functionName: 'setPrice',
      args: [collateral, LIQUIDATION_PRICE],
    });
    await pub.waitForTransactionReceipt({ hash: setPriceHash });

    const approveBorrowHash = await bobWallet.writeContract({
      address: borrow,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [lending, LIQUIDATION_BORROW_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: approveBorrowHash });

    const collateralValueBefore = (await pub.readContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'collateralValue',
      args: [aliceWallet.account.address],
    })) as bigint;
    expect(collateralValueBefore).toBeLessThan((LIQUIDATION_BORROW_AMOUNT * 105n) / 100n);

    const bobBorrowBefore = (await pub.readContract({
      address: borrow,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [bobWallet.account.address],
    })) as bigint;
    const bobCollateralBefore = (await pub.readContract({
      address: collateral,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [bobWallet.account.address],
    })) as bigint;

    const liquidationHash = await bobWallet.writeContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'liquidate',
      args: [aliceWallet.account.address],
    });
    await pub.waitForTransactionReceipt({ hash: liquidationHash });

    const borrowerDebtAfter = (await pub.readContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'debtBalance',
      args: [aliceWallet.account.address],
    })) as bigint;
    const borrowerCollateralAfter = (await pub.readContract({
      address: lending,
      abi: LENDING_ABI,
      functionName: 'collateralBalance',
      args: [aliceWallet.account.address],
    })) as bigint;
    const bobBorrowAfter = (await pub.readContract({
      address: borrow,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [bobWallet.account.address],
    })) as bigint;
    const bobCollateralAfter = (await pub.readContract({
      address: collateral,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [bobWallet.account.address],
    })) as bigint;

    expect(borrowerDebtAfter).toBe(0n);
    expect(borrowerCollateralAfter).toBe(0n);
    expect(bobBorrowBefore - bobBorrowAfter).toBe(LIQUIDATION_BORROW_AMOUNT);
    expect(bobCollateralAfter - bobCollateralBefore).toBe(SUPPLY_AMOUNT);
  });

  test('T-LD-009 non-owner から setPrice を呼ぶと NotOwner() で revert する', async () => {
    const { collateral, oracle } = readRuntimeEnv();
    const bob = privateKeyToAccount(BOB_PK);

    try {
      await pub.simulateContract({
        address: oracle,
        abi: ORACLE_ABI,
        functionName: 'setPrice',
        args: [collateral, LIQUIDATION_PRICE],
        account: bob.address,
      });
      throw new Error('expected setPrice() to revert');
    } catch (error) {
      expectCustomError(error, 'NotOwner');
    }
  });
});
