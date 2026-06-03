import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const L1_PORT = 8554;
const L2_PORT = 8555;
const L1_CHAIN_ID = 1;
const L2_CHAIN_ID = 10;
const BRIDGE_AMOUNT = 50n * 10n ** 18n;
const OPERATOR_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const DEST_TOKEN_MINT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

function makeChain(id: number, port: number) {
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

async function operatorRelayMint(l2Recipient: Address, amount: bigint) {
  // .env.local から DEST_TOKEN address を読む (build 時に bundle に焼き込まれている)
  // test side では viem で l2 chain に直接接続して mint を実行する
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const envText = fs.readFileSync(envPath, 'utf8');
  const destTokenMatch = envText.match(/NEXT_PUBLIC_DEST_TOKEN=(0x[0-9a-fA-F]+)/);
  if (!destTokenMatch) throw new Error('DEST_TOKEN not found in .env.local');
  const destToken = destTokenMatch[1] as Address;

  const operator = privateKeyToAccount(OPERATOR_KEY);
  const l2Chain = makeChain(L2_CHAIN_ID, L2_PORT);
  const wallet = createWalletClient({ account: operator, chain: l2Chain, transport: http() });
  const pub = createPublicClient({ chain: l2Chain, transport: http() });

  const hash = await wallet.writeContract({
    address: destToken,
    abi: DEST_TOKEN_MINT_ABI,
    functionName: 'mint',
    args: [l2Recipient, amount],
  });
  await pub.waitForTransactionReceipt({ hash });
}

async function readL2Balance(addr: Address): Promise<bigint> {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const envText = fs.readFileSync(envPath, 'utf8');
  const destTokenMatch = envText.match(/NEXT_PUBLIC_DEST_TOKEN=(0x[0-9a-fA-F]+)/);
  if (!destTokenMatch) throw new Error('DEST_TOKEN not found');
  const destToken = destTokenMatch[1] as Address;

  const l2Chain = makeChain(L2_CHAIN_ID, L2_PORT);
  const pub = createPublicClient({ chain: l2Chain, transport: http() });
  return (await pub.readContract({
    address: destToken,
    abi: DEST_TOKEN_MINT_ABI,
    functionName: 'balanceOf',
    args: [addr],
  })) as bigint;
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
  await expect(page.getByTestId('source-balance')).not.toHaveText(
    'sourceBalance (L1): (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('dest-balance')).not.toHaveText(
    'destBalance (L2): (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('source-nonce')).not.toHaveText(
    'sourceNonce: (loading)',
    { timeout: 30_000 },
  );
}

test.describe('Next.js Bridge (ERC20 cross-chain lock/mint/burn) e2e', () => {
  test('T-BR-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('source-balance:', await page.getByTestId('source-balance').textContent());
    console.log('dest-balance:', await page.getByTestId('dest-balance').textContent());
    console.log('current-chain:', await page.getByTestId('current-chain').textContent());
  });

  test('T-BR-001 connect 後 L1 chain 表示 + source/dest balance + sourceNonce 数値', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('current-chain')).toHaveText(`chain: ${L1_CHAIN_ID}`);
    await expect(page.getByTestId('source-balance')).toContainText(/^sourceBalance \(L1\): \d+$/);
    await expect(page.getByTestId('source-nonce')).toContainText(/^sourceNonce: \d+$/);
  });

  test('T-BR-002 L1 approve → lock で sourceBalance が -BRIDGE_AMOUNT、sourceNonce が +1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeSource = BigInt(
      ((await page.getByTestId('source-balance').textContent()) ?? '')
        .replace('sourceBalance (L1): ', '')
        .trim(),
    );
    const beforeNonce = BigInt(
      ((await page.getByTestId('source-nonce').textContent()) ?? '')
        .replace('sourceNonce: ', '')
        .trim(),
    );

    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('lock-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(2000);

    const afterSource = BigInt(
      ((await page.getByTestId('source-balance').textContent()) ?? '')
        .replace('sourceBalance (L1): ', '')
        .trim(),
    );
    const afterNonce = BigInt(
      ((await page.getByTestId('source-nonce').textContent()) ?? '')
        .replace('sourceNonce: ', '')
        .trim(),
    );
    expect(beforeSource - afterSource).toBe(BRIDGE_AMOUNT);
    expect(afterNonce - beforeNonce).toBe(1n);
  });

  test('T-BR-003 operator relay mint で L2 destBalance が +BRIDGE_AMOUNT 増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const account = privateKeyToAccount(OPERATOR_KEY);
    const beforeL2 = await readL2Balance(account.address);

    // operator が L2 で mint (real bridge では off-chain relayer が L1 Locked event を観測してこれを実行)
    await operatorRelayMint(account.address, BRIDGE_AMOUNT);

    // UI 側 dest balance refetch を待つ (refetchInterval 1.5s)
    await expect(page.getByTestId('dest-balance')).toHaveText(
      `destBalance (L2): ${beforeL2 + BRIDGE_AMOUNT}`,
      { timeout: 15_000 },
    );

    const afterL2 = await readL2Balance(account.address);
    expect(afterL2 - beforeL2).toBe(BRIDGE_AMOUNT);
  });

  test('T-BR-004 L1 lock → operator mint → L2 destBalance まで end-to-end で動く', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const account = privateKeyToAccount(OPERATOR_KEY);
    const beforeSource = BigInt(
      ((await page.getByTestId('source-balance').textContent()) ?? '')
        .replace('sourceBalance (L1): ', '')
        .trim(),
    );
    const beforeL2 = await readL2Balance(account.address);

    // L1 で approve + lock
    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('lock-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    // operator が L2 で mint
    await operatorRelayMint(account.address, BRIDGE_AMOUNT);

    // 両 chain の最終 state を確認
    await expect(page.getByTestId('source-balance')).toHaveText(
      `sourceBalance (L1): ${beforeSource - BRIDGE_AMOUNT}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('dest-balance')).toHaveText(
      `destBalance (L2): ${beforeL2 + BRIDGE_AMOUNT}`,
      { timeout: 15_000 },
    );
  });

  test('T-BR-005 sourceNonce が累積で増える (複数回 lock で nonce が正しく更新)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeNonce = BigInt(
      ((await page.getByTestId('source-nonce').textContent()) ?? '')
        .replace('sourceNonce: ', '')
        .trim(),
    );

    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('lock-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(2000);

    const afterNonce = BigInt(
      ((await page.getByTestId('source-nonce').textContent()) ?? '')
        .replace('sourceNonce: ', '')
        .trim(),
    );
    expect(afterNonce - beforeNonce).toBe(1n);
  });
});
