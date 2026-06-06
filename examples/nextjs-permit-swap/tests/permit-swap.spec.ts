import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectCustomError } from '@kiwa/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const ANVIL_PORT = 8546;
const SWAP_AMOUNT = 25n * 10n ** 18n;
const USER_INITIAL_A = 100n * 10n ** 18n;
const __dirname = dirname(fileURLToPath(import.meta.url));
const account = privateKeyToAccount(PRIVATE_KEY);
const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;
const PERMIT_SWAP_ABI = parseAbi([
  'function permitAndSwap(uint256 amountIn, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'error PermitExpired()',
]);

function anvilChain() {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
}

function readRuntimeEnv() {
  const envLocal = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  const pairs = envLocal
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)] as const;
    });
  const env = Object.fromEntries(pairs);
  if (!env.NEXT_PUBLIC_TOKEN_A || !env.NEXT_PUBLIC_SWAP || !env.NEXT_PUBLIC_TOKEN_A_NAME) {
    throw new Error('Missing required values in examples/nextjs-permit-swap/.env.local');
  }
  return {
    tokenA: env.NEXT_PUBLIC_TOKEN_A as `0x${string}`,
    swap: env.NEXT_PUBLIC_SWAP as `0x${string}`,
    tokenAName: env.NEXT_PUBLIC_TOKEN_A_NAME,
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

async function waitDataLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('balance-a')).not.toHaveText('tokenA: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('balance-b')).not.toHaveText('tokenB: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('nonce')).not.toHaveText('nonce: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js EIP-2612 Permit + 1-tx swap e2e', () => {
  test('T-PM-001 connect 後 tokenA balance + nonce が数値表示される', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitDataLoaded(page);
    await expect(page.getByTestId('balance-a')).toContainText(/^tokenA: \d+$/);
    await expect(page.getByTestId('nonce')).toContainText(/^nonce: \d+$/);
  });

  test('T-PM-002 Sign Permit click → permit-sig が v|r... 形式で生成される', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitDataLoaded(page);
    await page.getByTestId('sign-permit-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('permit-sig')).not.toHaveText('permitSig: (none)', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('permit-sig')).toContainText(/^permitSig: \d+\|0x[0-9a-f]+\.\.\.$/);
  });

  test('T-PM-003 Permit + Swap で balance-a が -SWAP_AMOUNT / balance-b が +SWAP_AMOUNT', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitDataLoaded(page);

    const beforeA = BigInt(
      ((await page.getByTestId('balance-a').textContent()) ?? '').replace('tokenA: ', '').trim(),
    );
    const beforeB = BigInt(
      ((await page.getByTestId('balance-b').textContent()) ?? '').replace('tokenB: ', '').trim(),
    );

    await page.getByTestId('sign-permit-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('permit-sig')).not.toHaveText('permitSig: (none)', {
      timeout: 15_000,
    });

    await page.getByTestId('permit-swap-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('balance-a')).toHaveText(`tokenA: ${beforeA - SWAP_AMOUNT}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('balance-b')).toHaveText(`tokenB: ${beforeB + SWAP_AMOUNT}`, {
      timeout: 15_000,
    });
  });

  test('T-PM-004 permit 使用後 nonce が +1 増える (replay 防止)', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitDataLoaded(page);

    const beforeNonce = Number(
      ((await page.getByTestId('nonce').textContent()) ?? '').replace('nonce: ', '').trim(),
    );

    await page.getByTestId('sign-permit-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('permit-swap-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('nonce')).toHaveText(`nonce: ${beforeNonce + 1}`, {
      timeout: 15_000,
    });
  });

  test('T-PM-005 USER_INITIAL_A 100e18 から SWAP_AMOUNT 25e18 swap で 75e18 残る (初期 state 確認)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitDataLoaded(page);
    // 初期 + 累計 swap 合計を計算
    const tokenAText = (await page.getByTestId('balance-a').textContent()) ?? '';
    const currentA = BigInt(tokenAText.replace('tokenA: ', '').trim());
    // 累計 swap 数を nonce で推定 (nonce = swap 回数)
    const nonce = BigInt(
      ((await page.getByTestId('nonce').textContent()) ?? '').replace('nonce: ', '').trim(),
    );
    // 期待: USER_INITIAL_A - nonce * SWAP_AMOUNT === currentA
    expect(currentA).toBe(USER_INITIAL_A - nonce * SWAP_AMOUNT);
  });

  test('T-PM-006 過去 deadline の permit signature を使うと permitAndSwap が revert する', async ({
    page,
    dappE2e,
  }) => {
    const { tokenA, swap, tokenAName } = readRuntimeEnv();
    const chain = anvilChain();
    const publicClient = createPublicClient({ chain, transport: http() });
    const walletClient = createWalletClient({ account, chain, transport: http() });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitDataLoaded(page);

    const beforeNonce = BigInt(
      ((await page.getByTestId('nonce').textContent()) ?? '').replace('nonce: ', '').trim(),
    );
    const beforeBalanceA = BigInt(
      ((await page.getByTestId('balance-a').textContent()) ?? '').replace('tokenA: ', '').trim(),
    );
    const beforeBalanceB = BigInt(
      ((await page.getByTestId('balance-b').textContent()) ?? '').replace('tokenB: ', '').trim(),
    );

    const deadline = BigInt(Math.floor(Date.now() / 1000) - 3600);
    const signature = await walletClient.signTypedData({
      account,
      domain: {
        name: tokenAName,
        version: '1',
        chainId: chain.id,
        verifyingContract: tokenA,
      },
      types: PERMIT_TYPES,
      primaryType: 'Permit',
      message: {
        owner: account.address,
        spender: swap,
        value: SWAP_AMOUNT,
        nonce: beforeNonce,
        deadline,
      },
    });

    const signatureBody = signature.slice(2);
    const v = parseInt(signatureBody.slice(128, 130), 16);
    const r = `0x${signatureBody.slice(0, 64)}` as `0x${string}`;
    const s = `0x${signatureBody.slice(64, 128)}` as `0x${string}`;
    try {
      await publicClient.simulateContract({
        account: account.address,
        address: swap,
        abi: PERMIT_SWAP_ABI,
        functionName: 'permitAndSwap',
        args: [SWAP_AMOUNT, deadline, v, r, s],
      });
      throw new Error('expected PermitExpired revert');
    } catch (error) {
      expectCustomError(error, 'PermitExpired');
    }

    await expect(page.getByTestId('nonce')).toHaveText(`nonce: ${beforeNonce}`, { timeout: 15_000 });
    await expect(page.getByTestId('balance-a')).toHaveText(`tokenA: ${beforeBalanceA}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('balance-b')).toHaveText(`tokenB: ${beforeBalanceB}`, {
      timeout: 15_000,
    });
  });
});
