import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const MAINNET_PORT = 8551;
const OPTIMISM_PORT = 8552;
const MAINNET_CHAIN_ID = 1;
const OPTIMISM_CHAIN_ID = 10;
const OPERATOR_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const SIMPLE_TOKEN_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function mint(address to, uint256 value)',
]);

type MultiChainContracts = {
  mainnetToken: Address;
  optimismToken: Address;
  probeUser: Address;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

let cachedContracts: MultiChainContracts | undefined;

function getContracts(): MultiChainContracts {
  if (cachedContracts) return cachedContracts;

  const envText = readFileSync(envPath, 'utf8');
  const readAddress = (name: string) => {
    const match = envText.match(new RegExp(`${name}=(0x[0-9a-fA-F]+)`));
    if (!match) throw new Error(`${name} not found in .env.local`);
    return match[1] as Address;
  };

  cachedContracts = {
    mainnetToken: readAddress('NEXT_PUBLIC_MAINNET_TOKEN'),
    optimismToken: readAddress('NEXT_PUBLIC_OPTIMISM_TOKEN'),
    probeUser: readAddress('NEXT_PUBLIC_PROBE_USER'),
  };
  return cachedContracts;
}

function makeChain(id: number, port: number) {
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

function publicClient(chainId: number, port: number) {
  return createPublicClient({ chain: makeChain(chainId, port), transport: http() });
}

function walletClient(chainId: number, port: number) {
  return createWalletClient({
    account: privateKeyToAccount(OPERATOR_KEY),
    chain: makeChain(chainId, port),
    transport: http(),
  });
}

async function readBalance(chainId: number, port: number, token: Address, owner: Address): Promise<bigint> {
  return (await publicClient(chainId, port).readContract({
    address: token,
    abi: SIMPLE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [owner],
  })) as bigint;
}

async function mintOnChain(
  chainId: number,
  port: number,
  token: Address,
  to: Address,
  amount: bigint,
) {
  const pub = publicClient(chainId, port);
  const hash = await walletClient(chainId, port).writeContract({
    address: token,
    abi: SIMPLE_TOKEN_ABI,
    functionName: 'mint',
    args: [to, amount],
  });
  await pub.waitForTransactionReceipt({ hash });
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

async function waitBalanceLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('my-balance')).not.toHaveText('balance: (loading)', {
    timeout: 15_000,
  });
}

async function waitProbeBalanceLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('probe-balance')).not.toHaveText('probeBalance: (loading)', {
    timeout: 15_000,
  });
}

test.describe('Next.js multi-chain switch e2e', () => {
  test('T-MC-001 初期 chain は Mainnet (id=1) で表示される', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Mainnet', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('current-chain')).toContainText('id=1');
  });

  test('T-MC-002 Optimism switch button → current-chain が Optimism (id=10) に切替', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism (id=10)', {
      timeout: 15_000,
    });
  });

  test('T-MC-003 Base switch button → current-chain が Base (id=8453) に切替', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('switch-8453-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Base (id=8453)', {
      timeout: 15_000,
    });
  });

  test('T-MC-004 chain switch で contract address が変わる', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    const mainnetAddr = (await page.getByTestId('current-contract').textContent()) ?? '';
    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism');
    const optimismAddr = (await page.getByTestId('current-contract').textContent()) ?? '';
    expect(mainnetAddr.replace('contract: ', '')).not.toBe(optimismAddr.replace('contract: ', ''));
    expect(mainnetAddr).toMatch(/0x[0-9a-fA-F]{40}/);
    expect(optimismAddr).toMatch(/0x[0-9a-fA-F]{40}/);
  });

  test('T-MC-005 全 3 chain で balance が INITIAL_SUPPLY (1000e18) 表示される', async ({
    page,
    dappE2e,
  }) => {
    const EXPECTED = String(1000n * 10n ** 18n);
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitBalanceLoaded(page);
    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${EXPECTED}`, {
      timeout: 15_000,
    });

    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism');
    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${EXPECTED}`, {
      timeout: 15_000,
    });

    await page.getByTestId('switch-8453-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Base');
    await expect(page.getByTestId('my-balance')).toHaveText(`balance: ${EXPECTED}`, {
      timeout: 15_000,
    });
  });

  test('T-MC-006 cross-chain state consistency', async ({ page, dappE2e }) => {
    const { mainnetToken, optimismToken, probeUser } = getContracts();
    const amountOnMainnet = 7n * 10n ** 18n;
    const amountOnOptimism = 11n * 10n ** 18n;

    expect(await readBalance(MAINNET_CHAIN_ID, MAINNET_PORT, mainnetToken, probeUser)).toBe(0n);
    expect(await readBalance(OPTIMISM_CHAIN_ID, OPTIMISM_PORT, optimismToken, probeUser)).toBe(0n);

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitBalanceLoaded(page);
    await waitProbeBalanceLoaded(page);
    await expect(page.getByTestId('probe-balance')).toHaveText('probeBalance: 0', {
      timeout: 15_000,
    });

    await mintOnChain(MAINNET_CHAIN_ID, MAINNET_PORT, mainnetToken, probeUser, amountOnMainnet);
    await expect(page.getByTestId('probe-balance')).toHaveText(
      `probeBalance: ${amountOnMainnet}`,
      {
        timeout: 15_000,
      },
    );

    await page.getByTestId('switch-10-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Optimism (id=10)');
    await expect(page.getByTestId('probe-balance')).toHaveText('probeBalance: 0', {
      timeout: 15_000,
    });

    await mintOnChain(
      OPTIMISM_CHAIN_ID,
      OPTIMISM_PORT,
      optimismToken,
      probeUser,
      amountOnOptimism,
    );
    await expect(page.getByTestId('probe-balance')).toHaveText(
      `probeBalance: ${amountOnOptimism}`,
      {
        timeout: 15_000,
      },
    );

    await page.getByTestId('switch-1-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toContainText('Mainnet (id=1)');
    await expect(page.getByTestId('probe-balance')).toHaveText(
      `probeBalance: ${amountOnMainnet}`,
      {
        timeout: 15_000,
      },
    );

    expect(await readBalance(MAINNET_CHAIN_ID, MAINNET_PORT, mainnetToken, probeUser)).toBe(
      amountOnMainnet,
    );
    expect(await readBalance(OPTIMISM_CHAIN_ID, OPTIMISM_PORT, optimismToken, probeUser)).toBe(
      amountOnOptimism,
    );
  });
});
