import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectCustomError } from '@kiwa/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  hashMessage,
  http,
  parseAbi,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const ANVIL_PORT = 8545;
const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const GUARDIAN_ONE_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;
const GUARDIAN_TWO_PK =
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as const;
const GUARDIAN_THREE_PK =
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' as const;
const NEW_OWNER_PK =
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' as const;
const SALT = 1n;
const BATCH_AMOUNT = 2n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const SMART_ACCOUNT_VIEW_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'hash', type: 'bytes32' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const FACTORY_ABI = parseAbi([
  'function createAccount(address owner, uint256 salt) returns (address account)',
  'function getAddress(address owner, uint256 salt) view returns (address)',
]);

const SMART_ACCOUNT_ABI = parseAbi([
  'function executeBatch(address[] targets, uint256[] values, bytes[] data) returns (bytes[] results)',
  'function owner() view returns (address)',
  'function ownerEpoch() view returns (uint256)',
  'function recoveryRequestCount() view returns (uint256)',
  'function proposeRecovery(address newOwner) returns (uint256 requestId)',
  'function approveRecovery(uint256 requestId)',
  'function finalizeRecovery(uint256 requestId)',
  'function recoveryRequestView(uint256 requestId) view returns (address proposedOwner, uint256 approvals, bool finalized, uint256 requestOwnerEpoch)',
  'error BatchCallFailed(uint256 index, address target)',
  'error ThresholdNotReached(uint256 approved, uint256 required)',
  'error NotGuardian()',
  'error InvalidNewOwner()',
  'error RecoveryStale()',
  'error RecoveryAlreadyFinalized()',
]);

const TOKEN_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
]);

const SPENDER_ABI = parseAbi([
  'function pull(address token, address from, address to, uint256 amount)',
]);

function anvilChain() {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
}

function readEnv() {
  const envPath = resolve(exampleRoot, '.env.local');
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  ) as Record<string, string>;
}

function makeClients(
  privateKey:
    | typeof OWNER_PK
    | typeof GUARDIAN_ONE_PK
    | typeof GUARDIAN_TWO_PK
    | typeof GUARDIAN_THREE_PK
    | typeof NEW_OWNER_PK,
) {
  const account = privateKeyToAccount(privateKey);
  return {
    account,
    wallet: createWalletClient({
      account,
      chain: anvilChain(),
      transport: http(),
    }),
    pub: createPublicClient({ chain: anvilChain(), transport: http() }),
  };
}

async function ensureSmartAccountDeployed(salt: bigint = SALT) {
  const env = readEnv();
  const owner = makeClients(OWNER_PK);
  const factory = env.NEXT_PUBLIC_FACTORY as Address;
  const accountAddress = (await owner.pub.readContract({
    address: factory,
    abi: FACTORY_ABI,
    functionName: 'getAddress',
    args: [owner.account.address, salt],
  })) as Address;

  const code = await owner.pub.getBytecode({ address: accountAddress });
  if (!code) {
    const deployHash = await owner.wallet.writeContract({
      address: factory,
      abi: FACTORY_ABI,
      functionName: 'createAccount',
      args: [owner.account.address, salt],
    });
    await owner.pub.waitForTransactionReceipt({ hash: deployHash });
  }

  return { env, owner, accountAddress };
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
  await expect(page.getByTestId('predicted-account')).not.toHaveText(
    'predictedAccount: (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('sponsored-count')).not.toHaveText(
    'sponsoredCount: (loading)',
    { timeout: 30_000 },
  );
}

async function getPredictedAccount(page: import('@playwright/test').Page): Promise<Address> {
  const text = (await page.getByTestId('predicted-account').textContent()) ?? '';
  const addr = text.replace('predictedAccount: ', '').trim();
  return addr as Address;
}

test.describe('Next.js + AA Smart Account (ERC-4337 簡略版) e2e', () => {
  test('T-AA-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('predicted:', await page.getByTestId('predicted-account').textContent());
    console.log('is-deployed:', await page.getByTestId('is-deployed').textContent());
  });

  test('T-AA-001 connect 後 predictedAccount が counterfactual address で表示される', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    const predicted = await getPredictedAccount(page);
    expect(predicted).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(predicted).not.toBe('0x0000000000000000000000000000000000000000');
  });

  test('T-AA-002 Deploy Smart Account → isDeployed=true に遷移', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const isDeployedBefore = await page.getByTestId('is-deployed').textContent();
    if (isDeployedBefore?.includes('true')) {
      await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true');
      return;
    }

    await page.getByTestId('deploy-account-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true', {
      timeout: 15_000,
    });
  });

  test('T-AA-003 Execute via Account → counter.countByCaller[smartAccount] が +1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const isDeployed = (await page.getByTestId('is-deployed').textContent())?.includes('true');
    if (!isDeployed) {
      await page.getByTestId('deploy-account-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true', {
        timeout: 15_000,
      });
    }

    const beforeCount = BigInt(
      ((await page.getByTestId('account-count').textContent()) ?? '')
        .replace('accountCount: ', '')
        .trim(),
    );

    await page.getByTestId('execute-account-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('account-count')).toHaveText(
      `accountCount: ${beforeCount + 1n}`,
      { timeout: 15_000 },
    );
  });

  test('T-AA-004 Paymaster Sponsor → sponsoredCount が +1 / accountCount も +1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const isDeployed = (await page.getByTestId('is-deployed').textContent())?.includes('true');
    if (!isDeployed) {
      await page.getByTestId('deploy-account-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true', {
        timeout: 15_000,
      });
    }

    const beforeSponsored = BigInt(
      ((await page.getByTestId('sponsored-count').textContent()) ?? '')
        .replace('sponsoredCount: ', '')
        .trim(),
    );
    const beforeAccount = BigInt(
      ((await page.getByTestId('account-count').textContent()) ?? '')
        .replace('accountCount: ', '')
        .trim(),
    );

    await page.getByTestId('sponsor-execute-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(2000);

    const afterSponsored = BigInt(
      ((await page.getByTestId('sponsored-count').textContent()) ?? '')
        .replace('sponsoredCount: ', '')
        .trim(),
    );
    const afterAccount = BigInt(
      ((await page.getByTestId('account-count').textContent()) ?? '')
        .replace('accountCount: ', '')
        .trim(),
    );
    expect(afterSponsored - beforeSponsored).toBeGreaterThanOrEqual(1n);
    expect(afterAccount - beforeAccount).toBeGreaterThanOrEqual(1n);
  });

  test('T-AA-005 ERC-1271 isValidSignature: owner EOA で sign したら MAGICVALUE (0x1626ba7e)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const isDeployed = (await page.getByTestId('is-deployed').textContent())?.includes('true');
    if (!isDeployed) {
      await page.getByTestId('deploy-account-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true', {
        timeout: 15_000,
      });
    }

    const accountAddress = await getPredictedAccount(page);

    const account = privateKeyToAccount(OWNER_PK);
    const message = 'hello smart account';
    const messageHash = hashMessage(message);
    const signature = await account.signMessage({ message });

    const pub = createPublicClient({ chain: anvilChain(), transport: http() });
    const result = (await pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_VIEW_ABI,
      functionName: 'isValidSignature',
      args: [messageHash, signature],
    })) as `0x${string}`;

    expect(result.toLowerCase()).toBe('0x1626ba7e');
  });

  test('T-AA-007 executeBatch で approve + pull を 1 tx で実行し、invalid target は atomic に revert', async () => {
    const { env, owner, accountAddress } = await ensureSmartAccountDeployed();
    const mockToken = env.NEXT_PUBLIC_MOCK_TOKEN as Address;
    const spender = env.NEXT_PUBLIC_TOKEN_SPENDER as Address;
    const recipient = privateKeyToAccount(NEW_OWNER_PK).address;
    const invalidTarget = privateKeyToAccount(GUARDIAN_ONE_PK).address;

    const approveData = encodeFunctionData({
      abi: TOKEN_ABI,
      functionName: 'approve',
      args: [spender, BATCH_AMOUNT],
    });
    const pullData = encodeFunctionData({
      abi: SPENDER_ABI,
      functionName: 'pull',
      args: [mockToken, accountAddress, recipient, BATCH_AMOUNT],
    });

    const beforeAccountBalance = await owner.pub.readContract({
      address: mockToken,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [accountAddress],
    });
    const beforeRecipientBalance = await owner.pub.readContract({
      address: mockToken,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [recipient],
    });

    const batchHash = await owner.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'executeBatch',
      args: [[mockToken, spender], [0n, 0n], [approveData, pullData]],
    });
    await owner.pub.waitForTransactionReceipt({ hash: batchHash });

    const afterAccountBalance = await owner.pub.readContract({
      address: mockToken,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [accountAddress],
    });
    const afterRecipientBalance = await owner.pub.readContract({
      address: mockToken,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [recipient],
    });

    expect(beforeAccountBalance - afterAccountBalance).toBe(BATCH_AMOUNT);
    expect(afterRecipientBalance - beforeRecipientBalance).toBe(BATCH_AMOUNT);

    try {
      await owner.pub.simulateContract({
        account: owner.account.address,
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: 'executeBatch',
        args: [[mockToken, invalidTarget], [0n, 0n], [approveData, '0x']],
      });
      throw new Error('expected BatchCallFailed revert');
    } catch (error) {
      expectCustomError(error, 'BatchCallFailed', [1n, invalidTarget]);
    }
  });

  test('T-AA-008 guardian recovery は threshold 到達で owner を更新し、未達 / non-guardian は custom error で revert', async () => {
    const { owner, accountAddress } = await ensureSmartAccountDeployed();
    const guardianOne = makeClients(GUARDIAN_ONE_PK);
    const guardianTwo = makeClients(GUARDIAN_TWO_PK);
    const guardianThree = makeClients(GUARDIAN_THREE_PK);
    const outsider = makeClients(NEW_OWNER_PK);
    const newOwner = outsider.account.address;

    try {
      await outsider.pub.simulateContract({
        account: outsider.account.address,
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: 'proposeRecovery',
        args: [newOwner],
      });
      throw new Error('expected NotGuardian revert');
    } catch (error) {
      expectCustomError(error, 'NotGuardian');
    }

    const beforeRequestCount = await guardianOne.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'recoveryRequestCount',
    });

    const proposeHash = await guardianOne.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'proposeRecovery',
      args: [newOwner],
    });
    await guardianOne.pub.waitForTransactionReceipt({ hash: proposeHash });
    const requestId = beforeRequestCount + 1n;

    const approveTwoHash = await guardianTwo.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'approveRecovery',
      args: [requestId],
    });
    await guardianTwo.pub.waitForTransactionReceipt({ hash: approveTwoHash });

    try {
      await guardianTwo.pub.simulateContract({
        account: guardianTwo.account.address,
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: 'finalizeRecovery',
        args: [requestId],
      });
      throw new Error('expected ThresholdNotReached revert');
    } catch (error) {
      expectCustomError(error, 'ThresholdNotReached', [1n, 2n]);
    }

    const approveThreeHash = await guardianThree.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'approveRecovery',
      args: [requestId],
    });
    await guardianThree.pub.waitForTransactionReceipt({ hash: approveThreeHash });

    const finalizeHash = await guardianOne.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'finalizeRecovery',
      args: [requestId],
    });
    await guardianOne.pub.waitForTransactionReceipt({ hash: finalizeHash });

    const updatedOwner = await owner.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'owner',
    });
    expect(updatedOwner.toLowerCase()).toBe(newOwner.toLowerCase());
  });

  test('T-AA-009 proposeRecovery(address(0)) は InvalidNewOwner() で revert', async () => {
    const { accountAddress } = await ensureSmartAccountDeployed(2n);
    const guardianOne = makeClients(GUARDIAN_ONE_PK);

    try {
      await guardianOne.pub.simulateContract({
        account: guardianOne.account.address,
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: 'proposeRecovery',
        args: ['0x0000000000000000000000000000000000000000'],
      });
      throw new Error('expected InvalidNewOwner revert');
    } catch (error) {
      expectCustomError(error, 'InvalidNewOwner');
    }
  });

  test('T-AA-010 owner 変更後の stale recovery request は RecoveryStale() で revert', async () => {
    const { owner, accountAddress } = await ensureSmartAccountDeployed(3n);
    const guardianOne = makeClients(GUARDIAN_ONE_PK);
    const guardianTwo = makeClients(GUARDIAN_TWO_PK);
    const guardianThree = makeClients(GUARDIAN_THREE_PK);
    const ownerA = privateKeyToAccount(NEW_OWNER_PK).address;
    const ownerB = privateKeyToAccount(GUARDIAN_ONE_PK).address;

    const firstProposeHash = await guardianOne.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'proposeRecovery',
      args: [ownerA],
    });
    await guardianOne.pub.waitForTransactionReceipt({ hash: firstProposeHash });

    const firstRequestId = await owner.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'recoveryRequestCount',
    });

    const firstApproveTwoHash = await guardianTwo.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'approveRecovery',
      args: [firstRequestId],
    });
    await guardianTwo.pub.waitForTransactionReceipt({ hash: firstApproveTwoHash });

    const firstApproveThreeHash = await guardianThree.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'approveRecovery',
      args: [firstRequestId],
    });
    await guardianThree.pub.waitForTransactionReceipt({ hash: firstApproveThreeHash });

    const firstFinalizeHash = await guardianOne.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'finalizeRecovery',
      args: [firstRequestId],
    });
    await guardianOne.pub.waitForTransactionReceipt({ hash: firstFinalizeHash });

    const secondProposeHash = await guardianTwo.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'proposeRecovery',
      args: [ownerB],
    });
    await guardianTwo.pub.waitForTransactionReceipt({ hash: secondProposeHash });

    const secondRequestId = await owner.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'recoveryRequestCount',
    });

    const secondApproveOneHash = await guardianOne.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'approveRecovery',
      args: [secondRequestId],
    });
    await guardianOne.pub.waitForTransactionReceipt({ hash: secondApproveOneHash });

    const secondApproveThreeHash = await guardianThree.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'approveRecovery',
      args: [secondRequestId],
    });
    await guardianThree.pub.waitForTransactionReceipt({ hash: secondApproveThreeHash });

    const secondFinalizeHash = await guardianTwo.wallet.writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'finalizeRecovery',
      args: [secondRequestId],
    });
    await guardianTwo.pub.waitForTransactionReceipt({ hash: secondFinalizeHash });

    const currentOwner = await owner.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'owner',
    });
    const currentEpoch = await owner.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'ownerEpoch',
    });
    const [, , firstFinalized, firstOwnerEpoch] = await owner.pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'recoveryRequestView',
      args: [firstRequestId],
    });

    expect(currentOwner.toLowerCase()).toBe(ownerB.toLowerCase());
    expect(currentEpoch).toBe(2n);
    expect(firstFinalized).toBe(true);
    expect(firstOwnerEpoch).toBe(0n);

    try {
      await guardianOne.pub.simulateContract({
        account: guardianOne.account.address,
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: 'finalizeRecovery',
        args: [firstRequestId],
      });
      throw new Error('expected RecoveryStale revert');
    } catch (error) {
      expectCustomError(error, 'RecoveryStale');
    }
  });
});
