import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const ANVIL_PORT = 8545;
const STAKE_AMOUNT = 100n * 10n ** 18n;
const SMALL_STAKE_AMOUNT = 1n;
const TEN_YEARS = 315_360_000n;
const ONE_DAY = 24n * 60n * 60n;
const EIGHT_DAYS = 8n * ONE_DAY;
const PENALTY_AMOUNT = (STAKE_AMOUNT * 10n) / 100n;
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

const STAKING_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claim',
    outputs: [{ name: 'payout', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'stakedBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'pendingReward',
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

function walletFor(privateKey: Hex) {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: anvilChain,
    transport: http(),
  });
}

async function rpc(method: string, params: unknown[] = []): Promise<unknown> {
  return await (
    pub as unknown as { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }
  ).request({ method, params });
}

async function snapshot(): Promise<string> {
  return (await rpc('evm_snapshot')) as string;
}

async function revertSnapshot(id: string): Promise<void> {
  await rpc('evm_revert', [id]);
}

async function setNextBlockTimestamp(timestamp: bigint): Promise<void> {
  await rpc('anvil_setNextBlockTimestamp', [Number(timestamp)]);
  await rpc('evm_mine');
}

async function increaseTime(seconds: bigint): Promise<void> {
  const latest = await pub.getBlock();
  await setNextBlockTimestamp(latest.timestamp + seconds);
}

function expectCustomError(
  error: unknown,
  errorName: string,
  expectedArgs?: readonly unknown[],
): void {
  if (!(error instanceof BaseError)) throw error;
  const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
  if (!(reverted instanceof ContractFunctionRevertedError)) throw error;
  expect(reverted.data?.errorName).toBe(errorName);
  if (expectedArgs) {
    expect(reverted.data?.args).toEqual(expectedArgs);
  }
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
    !env.NEXT_PUBLIC_STAKE_TOKEN ||
    !env.NEXT_PUBLIC_REWARD_TOKEN ||
    !env.NEXT_PUBLIC_STAKING ||
    !env.NEXT_PUBLIC_CONTROLLER
  ) {
    throw new Error('Missing required values in examples/nextjs-staking/.env.local');
  }
  return {
    stakeToken: env.NEXT_PUBLIC_STAKE_TOKEN as `0x${string}`,
    rewardToken: env.NEXT_PUBLIC_REWARD_TOKEN as `0x${string}`,
    staking: env.NEXT_PUBLIC_STAKING as `0x${string}`,
    controller: env.NEXT_PUBLIC_CONTROLLER as `0x${string}`,
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
  let snapshotId: string | undefined;

  test.beforeEach(async () => {
    snapshotId = await snapshot();
  });

  test.afterEach(async () => {
    if (snapshotId) {
      await revertSnapshot(snapshotId);
      snapshotId = undefined;
    }
  });

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

  test('T-ST-003 stake 後 time 経過で pendingReward が増える', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('stake-button').click();
    await dappE2e.waitForRpcIdle();

    await increaseTime(2n);
    await page.waitForTimeout(2000);
    const pending = BigInt(
      ((await page.getByTestId('pending-reward').textContent()) ?? '')
        .replace('pendingReward: ', '')
        .trim(),
    );
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
    await increaseTime(2n);
    await page.waitForTimeout(1500);

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
    expect(afterReward).toBeGreaterThan(beforeReward);
    await expect(page.getByTestId('pending-reward')).toHaveText('pendingReward: 0', {
      timeout: 10_000,
    });
  });

  test('T-ST-005 8 days 経過後の unstake では staked が -STAKE_AMOUNT 減り stakeBalance が +STAKE_AMOUNT 戻る', async ({
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
    await increaseTime(EIGHT_DAYS);
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

  test('T-ST-006 approve なしで直接 stake を呼ぶと SimpleERC20 transferFrom が custom error で revert する', async () => {
    const { staking } = readRuntimeEnv();
    const bob = privateKeyToAccount(BOB_PK);

    try {
      await pub.simulateContract({
        address: staking,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [STAKE_AMOUNT],
        account: bob.address,
      });
      throw new Error('expected stake() to revert');
    } catch (error) {
      expectCustomError(error, 'InsufficientAllowance', [0n, STAKE_AMOUNT]);
    }
  });

  test('T-ST-007 10 年経過後でも pendingReward が overflow せず正常値を返す', async () => {
    const { stakeToken, staking } = readRuntimeEnv();
    const aliceWallet = walletFor(ALICE_PK);

    const approveHash = await aliceWallet.writeContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [staking, SMALL_STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: approveHash });

    const stakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [SMALL_STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: stakeHash });

    await increaseTime(TEN_YEARS);

    const pending = (await pub.readContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'pendingReward',
      args: [aliceWallet.account.address],
    })) as bigint;

    expect(pending).toBe(TEN_YEARS * 10n ** 18n);
  });

  test('T-ST-008 early unstake は 10% penalty、8 days 経過後は penalty なし', async () => {
    const { stakeToken, staking, controller } = readRuntimeEnv();
    const aliceWallet = walletFor(ALICE_PK);

    const initialApprovalHash = await aliceWallet.writeContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [staking, STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: initialApprovalHash });

    const earlyScenario = await snapshot();

    const earlyStakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: earlyStakeHash });
    await increaseTime(ONE_DAY);

    const controllerBeforeEarly = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [controller],
    })) as bigint;
    const stakeBalanceBeforeEarly = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [aliceWallet.account.address],
    })) as bigint;

    const earlyUnstakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'unstake',
      args: [STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: earlyUnstakeHash });

    const controllerAfterEarly = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [controller],
    })) as bigint;
    const stakeBalanceAfterEarly = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [aliceWallet.account.address],
    })) as bigint;

    expect(controllerAfterEarly - controllerBeforeEarly).toBe(PENALTY_AMOUNT);
    expect(stakeBalanceAfterEarly - stakeBalanceBeforeEarly).toBe(STAKE_AMOUNT - PENALTY_AMOUNT);

    await revertSnapshot(earlyScenario);

    const matureApprovalHash = await aliceWallet.writeContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [staking, STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: matureApprovalHash });

    const matureStakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: matureStakeHash });
    await increaseTime(EIGHT_DAYS);

    const controllerBeforeMature = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [controller],
    })) as bigint;
    const stakeBalanceBeforeMature = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [aliceWallet.account.address],
    })) as bigint;

    const matureUnstakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'unstake',
      args: [STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: matureUnstakeHash });

    const controllerAfterMature = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [controller],
    })) as bigint;
    const stakeBalanceAfterMature = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [aliceWallet.account.address],
    })) as bigint;

    expect(controllerAfterMature - controllerBeforeMature).toBe(0n);
    expect(stakeBalanceAfterMature - stakeBalanceBeforeMature).toBe(STAKE_AMOUNT);
  });
});
