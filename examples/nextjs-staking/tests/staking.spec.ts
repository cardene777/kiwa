import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expectBalanceChange,
  expectCustomError,
  increaseTime,
  revertChain,
  snapshotChain,
} from '@kiwa-test/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  decodeErrorResult,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const ANVIL_PORT = 8545;
const STAKE_AMOUNT = 100n * 10n ** 18n;
const SMALL_STAKE_AMOUNT = 1n;
const TOP_UP_AMOUNT = 1n * 10n ** 18n;
const POOL_REWARD = 10000n * 10n ** 18n;
const TEN_YEARS = 315_360_000n;
const ONE_DAY = 24n * 60n * 60n;
const EIGHT_DAYS = 8n * ONE_DAY;
const PENALTY_AMOUNT = (STAKE_AMOUNT * 10n) / 100n;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
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
    inputs: [{ name: 'user', type: 'address' }],
    name: 'stakeStartedAt',
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
  {
    inputs: [],
    name: 'InvalidController',
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

function expectConstructorCustomError(
  error: unknown,
  abi: readonly unknown[],
  errorName: string,
  expectedArgs?: readonly unknown[],
): void {
  const match = /custom error (0x[a-fA-F0-9]+)/.exec(String(error));
  if (!match) throw error;
  const decoded = decodeErrorResult({
    abi: abi as never,
    data: match[1] as Hex,
  });
  expect(decoded.errorName).toBe(errorName);
  if (expectedArgs) {
    expect(decoded.args).toEqual(expectedArgs);
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

function readArtifact<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, '..', relativePath), 'utf8')) as T;
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

    await increaseTime(pub, 2n);
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
    await increaseTime(pub, 2n);
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
    await increaseTime(pub, EIGHT_DAYS);
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

    await increaseTime(pub, TEN_YEARS);

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

    const earlyScenario = await snapshotChain(pub);

    const earlyStakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: earlyStakeHash });
    await increaseTime(pub, ONE_DAY);

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

    await revertChain(pub, earlyScenario);

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
    await increaseTime(pub, EIGHT_DAYS);

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

  test('T-ST-009 reward pool 不足時の claim は funded balance までに cap され未払い accrued を保持する', async () => {
    const { stakeToken, rewardToken, staking } = readRuntimeEnv();
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

    await increaseTime(pub, TEN_YEARS);

    const pendingBefore = (await pub.readContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'pendingReward',
      args: [aliceWallet.account.address],
    })) as bigint;
    expect(pendingBefore).toBeGreaterThan(POOL_REWARD);

    await expectBalanceChange(
      pub,
      rewardToken,
      aliceWallet.account.address,
      POOL_REWARD,
      async () => {
        const claimHash = await aliceWallet.writeContract({
          address: staking,
          abi: STAKING_ABI,
          functionName: 'claim',
        });
        await pub.waitForTransactionReceipt({ hash: claimHash });
      },
    );
    const rewardPoolAfter = (await pub.readContract({
      address: rewardToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [staking],
    })) as bigint;
    const pendingAfter = (await pub.readContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'pendingReward',
      args: [aliceWallet.account.address],
    })) as bigint;

    expect(rewardPoolAfter).toBe(0n);
    expect(pendingAfter).toBeGreaterThan(0n);
    expect(pendingAfter).toBeLessThan(pendingBefore);
  });

  test('T-ST-010 top-up stake でも stakeStartedAt は reset されず既存 penalty clock を維持する', async () => {
    const { stakeToken, staking, controller } = readRuntimeEnv();
    const aliceWallet = walletFor(ALICE_PK);
    const totalStake = STAKE_AMOUNT + TOP_UP_AMOUNT;

    const approveHash = await aliceWallet.writeContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [staking, totalStake],
    });
    await pub.waitForTransactionReceipt({ hash: approveHash });

    const initialStakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [STAKE_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: initialStakeHash });

    const startedAtBeforeTopUp = (await pub.readContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stakeStartedAt',
      args: [aliceWallet.account.address],
    })) as bigint;

    await increaseTime(pub, EIGHT_DAYS);

    const topUpHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [TOP_UP_AMOUNT],
    });
    await pub.waitForTransactionReceipt({ hash: topUpHash });

    const startedAtAfterTopUp = (await pub.readContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'stakeStartedAt',
      args: [aliceWallet.account.address],
    })) as bigint;
    expect(startedAtAfterTopUp).toBe(startedAtBeforeTopUp);

    const controllerBefore = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [controller],
    })) as bigint;
    const stakeBalanceBefore = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [aliceWallet.account.address],
    })) as bigint;

    const unstakeHash = await aliceWallet.writeContract({
      address: staking,
      abi: STAKING_ABI,
      functionName: 'unstake',
      args: [totalStake],
    });
    await pub.waitForTransactionReceipt({ hash: unstakeHash });

    const controllerAfter = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [controller],
    })) as bigint;
    const stakeBalanceAfter = (await pub.readContract({
      address: stakeToken,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [aliceWallet.account.address],
    })) as bigint;

    expect(controllerAfter - controllerBefore).toBe(0n);
    expect(stakeBalanceAfter - stakeBalanceBefore).toBe(totalStake);
  });

  test('T-ST-011 controller = zero address の deploy は InvalidController() で revert する', async () => {
    const deployer = walletFor(ALICE_PK);
    const erc20Artifact = readArtifact<{ abi: readonly unknown[]; bytecode: { object: Hex } }>(
      'forge-out/SimpleERC20.sol/SimpleERC20.json',
    );
    const stakingArtifact = readArtifact<{ abi: readonly unknown[]; bytecode: { object: Hex } }>(
      'forge-out/SimpleStaking.sol/SimpleStaking.json',
    );

    const stakeTokenHash = await deployer.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['StakeToken', 'STK', 1n, deployer.account.address],
    });
    const stakeTokenReceipt = await pub.waitForTransactionReceipt({ hash: stakeTokenHash });

    const rewardTokenHash = await deployer.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['RewardToken', 'RWD', 1n, deployer.account.address],
    });
    const rewardTokenReceipt = await pub.waitForTransactionReceipt({ hash: rewardTokenHash });

    try {
      await deployer.deployContract({
        abi: stakingArtifact.abi as never,
        bytecode: stakingArtifact.bytecode.object,
        args: [
          stakeTokenReceipt.contractAddress!,
          rewardTokenReceipt.contractAddress!,
          ZERO_ADDRESS,
          1n,
        ],
      });
      throw new Error('expected constructor to revert');
    } catch (error) {
      expectConstructorCustomError(error, stakingArtifact.abi, 'InvalidController');
    }
  });
});
