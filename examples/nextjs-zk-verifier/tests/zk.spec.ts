import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectCustomError } from '@kiwa-test/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  keccak256,
  encodePacked,
  parseAbi,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const RANGE_SALT: Hex =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const WRONG_RANGE_SALT: Hex =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const RANGE_VALUE = 42n;
const RANGE_MIN = 10n;
const RANGE_MAX = 100n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const RANGE_VERIFIER_ABI = parseAbi([
  'function setRangeCommitment(bytes32 commitment, uint256 minValue, uint256 maxValue)',
  'function verifyRange(uint256 value, bytes32 salt) returns (bool)',
  'function verifiedCount(address who) view returns (uint256)',
  'error InvalidRangeProof()',
]);

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
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

function computeRangeCommitment(value: bigint, salt: Hex): Hex {
  return keccak256(encodePacked(['uint256', 'bytes32'], [value, salt]));
}

function makeClients(port: number) {
  const account = privateKeyToAccount(PRIVATE_KEY);
  return {
    account,
    wallet: createWalletClient({
      account,
      chain: anvilChain(port),
      transport: http(),
    }),
    pub: createPublicClient({ chain: anvilChain(port), transport: http() }),
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
  await expect(page.getByTestId('stored-commitment')).not.toHaveText('stored: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('verified-count')).not.toHaveText(
    'verifiedCount: (loading)',
    { timeout: 30_000 },
  );
}

test.describe('Next.js ZK commit-reveal verifier e2e', () => {
  test('T-ZK-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('computed:', await page.getByTestId('computed-commitment').textContent());
    console.log('stored:', await page.getByTestId('stored-commitment').textContent());
  });

  test('T-ZK-001 connect 後 computedCommitment が 0x... + stored が 0x0 (未登録)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('computed-commitment')).toContainText(/^computed: 0x[0-9a-fA-F]{64}$/);
    await expect(page.getByTestId('stored-commitment')).toHaveText(
      `stored: 0x0000000000000000000000000000000000000000000000000000000000000000`,
    );
    await expect(page.getByTestId('matches')).toHaveText('matches: false');
  });

  test('T-ZK-002 Set Commitment で stored が computed と一致 (matches=true)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    await page.getByTestId('set-commitment-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('matches')).toHaveText('matches: true', { timeout: 15_000 });
  });

  test('T-ZK-003 Verify (valid) で verifiedCount が +1 増える', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // ensure commitment が登録済 (T-ZK-002 後の累積 state)
    const matches = (await page.getByTestId('matches').textContent())?.includes('true');
    if (!matches) {
      await page.getByTestId('set-commitment-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('matches')).toHaveText('matches: true', { timeout: 15_000 });
    }

    const beforeVerified = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );

    await page.getByTestId('verify-valid-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('verified-count')).toHaveText(
      `verifiedCount: ${beforeVerified + 1}`,
      { timeout: 15_000 },
    );
  });

  test('T-ZK-004 Verify (invalid) で revert + verifiedCount 不変', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // ensure commitment 登録
    const matches = (await page.getByTestId('matches').textContent())?.includes('true');
    if (!matches) {
      await page.getByTestId('set-commitment-button').click();
      await dappE2e.waitForRpcIdle();
    }

    const beforeVerified = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );

    await page.getByTestId('verify-invalid-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    // revert なので verifiedCount は不変
    const afterVerified = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );
    expect(afterVerified).toBe(beforeVerified);
    // lastError に何か入る (rejected 検知)
    await expect(page.getByTestId('last-error')).not.toHaveText('lastError: (none)', {
      timeout: 10_000,
    });
  });

  test('T-ZK-005 totalVerified と verifiedCount が同じ (caller 1 人)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const v = Number(
      ((await page.getByTestId('verified-count').textContent()) ?? '')
        .replace('verifiedCount: ', '')
        .trim(),
    );
    const t = Number(
      ((await page.getByTestId('total-verified').textContent()) ?? '')
        .replace('totalVerified: ', '')
        .trim(),
    );
    expect(v).toBe(t);
  });

  test('T-ZK-006 RangeProofVerifier valid proof accepts and invalid proof reverts', async ({
    anvilPort,
  }) => {
    const env = readEnv();
    const rangeVerifier = env.NEXT_PUBLIC_RANGE_VERIFIER as Address;
    const { account, wallet, pub } = makeClients(anvilPort);
    const commitment = computeRangeCommitment(RANGE_VALUE, RANGE_SALT);

    const setHash = await wallet.writeContract({
      address: rangeVerifier,
      abi: RANGE_VERIFIER_ABI,
      functionName: 'setRangeCommitment',
      args: [commitment, RANGE_MIN, RANGE_MAX],
    });
    await pub.waitForTransactionReceipt({ hash: setHash });

    const verifyHash = await wallet.writeContract({
      address: rangeVerifier,
      abi: RANGE_VERIFIER_ABI,
      functionName: 'verifyRange',
      args: [RANGE_VALUE, RANGE_SALT],
    });
    await pub.waitForTransactionReceipt({ hash: verifyHash });

    expect(
      await pub.readContract({
        address: rangeVerifier,
        abi: RANGE_VERIFIER_ABI,
        functionName: 'verifiedCount',
        args: [account.address],
      }),
    ).toBe(1n);

    try {
      await pub.simulateContract({
        address: rangeVerifier,
        abi: RANGE_VERIFIER_ABI,
        functionName: 'verifyRange',
        args: [RANGE_VALUE, WRONG_RANGE_SALT],
        account: account.address,
      });
      throw new Error('expected InvalidRangeProof revert');
    } catch (error) {
      expectCustomError(error, 'InvalidRangeProof');
    }
  });
});
