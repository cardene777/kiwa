import {
  createPublicClient,
  defineChain,
  hashMessage,
  http,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const ANVIL_PORT = 8545;
const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

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

function anvilChain() {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
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
      // 既 deploy 済 (前 test の state)、本 test は deploy 後の状態確認のみで十分
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

    // ensure deployed
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

    // ensure deployed
    const isDeployed = (await page.getByTestId('is-deployed').textContent())?.includes('true');
    if (!isDeployed) {
      await page.getByTestId('deploy-account-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true', {
        timeout: 15_000,
      });
    }

    // refetchInterval が走っている中 before / after を取るとずれるため、
    // 「button click 前後の差分が >= 1」で assert
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

    // ensure deployed
    const isDeployed = (await page.getByTestId('is-deployed').textContent())?.includes('true');
    if (!isDeployed) {
      await page.getByTestId('deploy-account-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-deployed')).toHaveText('isDeployed: true', {
        timeout: 15_000,
      });
    }

    const accountAddress = await getPredictedAccount(page);

    // EOA owner で message sign
    const account = privateKeyToAccount(PRIVATE_KEY);
    const message = 'hello smart account';
    const messageHash = hashMessage(message);
    const signature = await account.signMessage({ message });

    // signMessage の結果は EthSignedMessage プレフィックス込みで、これを smart account.isValidSignature に渡す
    // smart account 側で hashMessage の raw hash を recover → ethSignedMessage で再 recover の両方を試す実装
    const pub = createPublicClient({ chain: anvilChain(), transport: http() });
    const result = (await pub.readContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_VIEW_ABI,
      functionName: 'isValidSignature',
      args: [messageHash, signature],
    })) as `0x${string}`;

    expect(result.toLowerCase()).toBe('0x1626ba7e');
  });
});
