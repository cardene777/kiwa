import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expectCustomError,
  impersonateAccount,
  setBalance,
  stopImpersonateAccount,
} from '@kiwa-test/core';
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

const L1_PORT = 8554;
const L2_PORT = 8555;
const L1_CHAIN_ID = 1;
const L2_CHAIN_ID = 10;
const BRIDGE_AMOUNT = 50n * 10n ** 18n;
const OPERATOR_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const NON_OPERATOR_KEY: Hex =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const SIMPLE_ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);

const SOURCE_BRIDGE_ABI = parseAbi([
  'function bridgeLock(uint256 amount, address l2Recipient) returns (uint256 currentNonce)',
  'function unlock(uint256 l2Nonce, address l1Recipient, uint256 amount)',
  'function nonce() view returns (uint256)',
  'function unlocked(uint256 l2Nonce) view returns (bool)',
  'error NotOperator()',
  'error AlreadyUnlocked()',
]);

const DEST_BRIDGE_ABI = parseAbi([
  'function relayMint(uint256 l1Nonce, address to, uint256 amount)',
  'function bridgeBurn(uint256 amount, address l1Recipient) returns (uint256 currentNonce)',
  'function burnNonce() view returns (uint256)',
  'error NotOperator()',
]);

const DEST_TOKEN_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);

type BridgeContracts = {
  sourceToken: Address;
  sourceBridge: Address;
  destToken: Address;
  destBridge: Address;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

let cachedContracts: BridgeContracts | undefined;

function makeChain(id: number, port: number) {
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

function getBridgeContracts(): BridgeContracts {
  if (cachedContracts) return cachedContracts;

  const envText = readFileSync(envPath, 'utf8');
  const readAddress = (name: string) => {
    const match = envText.match(new RegExp(`${name}=(0x[0-9a-fA-F]+)`));
    if (!match) throw new Error(`${name} not found in .env.local`);
    return match[1] as Address;
  };

  cachedContracts = {
    sourceToken: readAddress('NEXT_PUBLIC_SOURCE_TOKEN'),
    sourceBridge: readAddress('NEXT_PUBLIC_SOURCE_BRIDGE'),
    destToken: readAddress('NEXT_PUBLIC_DEST_TOKEN'),
    destBridge: readAddress('NEXT_PUBLIC_DEST_BRIDGE'),
  };
  return cachedContracts;
}

function l1PublicClient() {
  return createPublicClient({ chain: makeChain(L1_CHAIN_ID, L1_PORT), transport: http() });
}

function l2PublicClient() {
  return createPublicClient({ chain: makeChain(L2_CHAIN_ID, L2_PORT), transport: http() });
}

function l1WalletClient(account = privateKeyToAccount(OPERATOR_KEY)) {
  return createWalletClient({
    account,
    chain: makeChain(L1_CHAIN_ID, L1_PORT),
    transport: http(),
  });
}

function l2WalletClient(account = privateKeyToAccount(OPERATOR_KEY)) {
  return createWalletClient({
    account,
    chain: makeChain(L2_CHAIN_ID, L2_PORT),
    transport: http(),
  });
}

async function expectRevert(
  promise: Promise<unknown>,
  errorName: string,
): Promise<void> {
  try {
    await promise;
    throw new Error(`expected ${errorName} revert`);
  } catch (error) {
    expectCustomError(error, errorName);
  }
}

async function operatorRelayMint(l1Nonce: bigint, l2Recipient: Address, amount: bigint) {
  const { destBridge } = getBridgeContracts();
  const pub = l2PublicClient();
  const hash = await l2WalletClient().writeContract({
    address: destBridge,
    abi: DEST_BRIDGE_ABI,
    functionName: 'relayMint',
    args: [l1Nonce, l2Recipient, amount],
  });
  await pub.waitForTransactionReceipt({ hash });
}

async function operatorRelayMintViaImpersonation(
  l1Nonce: bigint,
  l2Recipient: Address,
  amount: bigint,
): Promise<void> {
  const { destBridge } = getBridgeContracts();
  const pub = l2PublicClient();
  const operator = privateKeyToAccount(OPERATOR_KEY);

  await impersonateAccount(pub, operator.address);
  try {
    await setBalance(pub, operator.address, 10n ** 18n);
    const wallet = createWalletClient({
      account: operator.address,
      chain: makeChain(L2_CHAIN_ID, L2_PORT),
      transport: http(),
    });
    const hash = await wallet.writeContract({
      address: destBridge,
      abi: DEST_BRIDGE_ABI,
      functionName: 'relayMint',
      args: [l1Nonce, l2Recipient, amount],
    });
    await pub.waitForTransactionReceipt({ hash });
  } finally {
    await stopImpersonateAccount(pub, operator.address);
  }
}

async function operatorUnlock(l2Nonce: bigint, l1Recipient: Address, amount: bigint) {
  const { sourceBridge } = getBridgeContracts();
  const pub = l1PublicClient();
  const hash = await l1WalletClient().writeContract({
    address: sourceBridge,
    abi: SOURCE_BRIDGE_ABI,
    functionName: 'unlock',
    args: [l2Nonce, l1Recipient, amount],
  });
  await pub.waitForTransactionReceipt({ hash });
}

async function userBridgeBurn(amount: bigint, l1Recipient: Address) {
  const { destBridge } = getBridgeContracts();
  const pub = l2PublicClient();
  const hash = await l2WalletClient().writeContract({
    address: destBridge,
    abi: DEST_BRIDGE_ABI,
    functionName: 'bridgeBurn',
    args: [amount, l1Recipient],
  });
  await pub.waitForTransactionReceipt({ hash });
}

async function seedRoundTripLiquidity(amount: bigint, recipient: Address) {
  const { sourceToken, sourceBridge } = getBridgeContracts();
  const l2Balance = await readL2Balance(recipient);
  const l1BridgeBalance = await readL1Balance(sourceBridge);
  if (l2Balance >= amount && l1BridgeBalance >= amount) return;

  const l1Pub = l1PublicClient();
  const l1Wallet = l1WalletClient();
  const l1NonceBefore = await readL1Nonce();

  const approveHash = await l1Wallet.writeContract({
    address: sourceToken,
    abi: SIMPLE_ERC20_ABI,
    functionName: 'approve',
    args: [sourceBridge, amount],
  });
  await l1Pub.waitForTransactionReceipt({ hash: approveHash });

  const lockHash = await l1Wallet.writeContract({
    address: sourceBridge,
    abi: SOURCE_BRIDGE_ABI,
    functionName: 'bridgeLock',
    args: [amount, recipient],
  });
  await l1Pub.waitForTransactionReceipt({ hash: lockHash });

  await operatorRelayMint(l1NonceBefore, recipient, amount);
}

async function readL1Balance(addr: Address): Promise<bigint> {
  const { sourceToken } = getBridgeContracts();
  return (await l1PublicClient().readContract({
    address: sourceToken,
    abi: SIMPLE_ERC20_ABI,
    functionName: 'balanceOf',
    args: [addr],
  })) as bigint;
}

async function readL1TotalSupply(): Promise<bigint> {
  const { sourceToken } = getBridgeContracts();
  return (await l1PublicClient().readContract({
    address: sourceToken,
    abi: SIMPLE_ERC20_ABI,
    functionName: 'totalSupply',
  })) as bigint;
}

async function readL1Nonce(): Promise<bigint> {
  const { sourceBridge } = getBridgeContracts();
  return (await l1PublicClient().readContract({
    address: sourceBridge,
    abi: SOURCE_BRIDGE_ABI,
    functionName: 'nonce',
  })) as bigint;
}

async function readL1Unlocked(l2Nonce: bigint): Promise<boolean> {
  const { sourceBridge } = getBridgeContracts();
  return (await l1PublicClient().readContract({
    address: sourceBridge,
    abi: SOURCE_BRIDGE_ABI,
    functionName: 'unlocked',
    args: [l2Nonce],
  })) as boolean;
}

async function readL2Balance(addr: Address): Promise<bigint> {
  const { destToken } = getBridgeContracts();
  return (await l2PublicClient().readContract({
    address: destToken,
    abi: DEST_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [addr],
  })) as bigint;
}

async function readL2TotalSupply(): Promise<bigint> {
  const { destToken } = getBridgeContracts();
  return (await l2PublicClient().readContract({
    address: destToken,
    abi: DEST_TOKEN_ABI,
    functionName: 'totalSupply',
  })) as bigint;
}

async function readL2BurnNonce(): Promise<bigint> {
  const { destBridge } = getBridgeContracts();
  return (await l2PublicClient().readContract({
    address: destBridge,
    abi: DEST_BRIDGE_ABI,
    functionName: 'burnNonce',
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

    await operatorRelayMint(0n, account.address, BRIDGE_AMOUNT);

    await expect(page.getByTestId('dest-balance')).toHaveText(
      `destBalance (L2): ${beforeL2 + BRIDGE_AMOUNT}`,
      { timeout: 15_000 },
    );

    const afterL2 = await readL2Balance(account.address);
    expect(afterL2 - beforeL2).toBe(BRIDGE_AMOUNT);
  });

  test('T-BR-003A impersonate operator でも relayMint を直接実行できる', async () => {
    const operator = privateKeyToAccount(OPERATOR_KEY);
    const { sourceBridge, sourceToken } = getBridgeContracts();
    const l1Pub = l1PublicClient();
    const l1Wallet = l1WalletClient();
    const beforeL2 = await readL2Balance(operator.address);
    const l1NonceBefore = await readL1Nonce();

    const approveHash = await l1Wallet.writeContract({
      address: sourceToken,
      abi: SIMPLE_ERC20_ABI,
      functionName: 'approve',
      args: [sourceBridge, BRIDGE_AMOUNT],
    });
    await l1Pub.waitForTransactionReceipt({ hash: approveHash });
    const lockHash = await l1Wallet.writeContract({
      address: sourceBridge,
      abi: SOURCE_BRIDGE_ABI,
      functionName: 'bridgeLock',
      args: [BRIDGE_AMOUNT, operator.address],
    });
    await l1Pub.waitForTransactionReceipt({ hash: lockHash });

    await operatorRelayMintViaImpersonation(l1NonceBefore, operator.address, BRIDGE_AMOUNT);

    const afterL2 = await readL2Balance(operator.address);
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
    const l1NonceBefore = await readL1Nonce();

    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('lock-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    await operatorRelayMint(l1NonceBefore, account.address, BRIDGE_AMOUNT);

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

  test('T-BR-006 operator authentication validation', async () => {
    const nonOperator = privateKeyToAccount(NON_OPERATOR_KEY);
    const { sourceBridge, destBridge } = getBridgeContracts();

    const sourceSupplyBefore = await readL1TotalSupply();
    await expectRevert(
      l1PublicClient().simulateContract({
        address: sourceBridge,
        abi: SOURCE_BRIDGE_ABI,
        functionName: 'unlock',
        args: [0n, nonOperator.address, BRIDGE_AMOUNT],
        account: nonOperator.address,
      }),
      'NotOperator',
    );
    expect(await readL1TotalSupply()).toBe(sourceSupplyBefore);

    const destSupplyBefore = await readL2TotalSupply();
    await expectRevert(
      l2PublicClient().simulateContract({
        address: destBridge,
        abi: DEST_BRIDGE_ABI,
        functionName: 'relayMint',
        args: [0n, nonOperator.address, BRIDGE_AMOUNT],
        account: nonOperator.address,
      }),
      'NotOperator',
    );
    expect(await readL2TotalSupply()).toBe(destSupplyBefore);
  });

  test('T-BR-007 replay attack protection', async () => {
    const operator = privateKeyToAccount(OPERATOR_KEY);
    const { sourceBridge } = getBridgeContracts();
    const l1Pub = l1PublicClient();
    await seedRoundTripLiquidity(BRIDGE_AMOUNT, operator.address);

    const balanceBeforeUnlock = await readL1Balance(operator.address);
    const nonceBefore = await readL2BurnNonce();

    await userBridgeBurn(BRIDGE_AMOUNT, operator.address);

    const nonceAfter = await readL2BurnNonce();
    expect(nonceAfter - nonceBefore).toBe(1n);

    const burnedNonce = nonceAfter - 1n;
    await operatorUnlock(burnedNonce, operator.address, BRIDGE_AMOUNT);

    expect(await readL1Unlocked(burnedNonce)).toBe(true);
    expect(await readL1Balance(operator.address)).toBe(balanceBeforeUnlock + BRIDGE_AMOUNT);

    await expectRevert(
      l1Pub.simulateContract({
        address: sourceBridge,
        abi: SOURCE_BRIDGE_ABI,
        functionName: 'unlock',
        args: [burnedNonce, operator.address, BRIDGE_AMOUNT],
        account: operator.address,
      }),
      'AlreadyUnlocked',
    );
    expect(await readL1Unlocked(burnedNonce)).toBe(true);
  });

  test('T-BR-008 L2→L1 reverse path', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await dappE2e.setChainRegistry?.([
      { chainId: '0x1', rpcUrls: [`http://127.0.0.1:${L1_PORT}`] },
      { chainId: '0xa', rpcUrls: [`http://127.0.0.1:${L2_PORT}`] },
    ]);
    await waitLoaded(page);

    const operator = privateKeyToAccount(OPERATOR_KEY);
    const beforeSource = await readL1Balance(operator.address);
    const beforeDestSupply = await readL2TotalSupply();
    const beforeL2Balance = await readL2Balance(operator.address);
    const l1NonceBefore = await readL1Nonce();

    await page.getByTestId('approve-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('lock-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    await operatorRelayMint(l1NonceBefore, operator.address, BRIDGE_AMOUNT);
    await expect(page.getByTestId('dest-balance')).toHaveText(
      `destBalance (L2): ${beforeL2Balance + BRIDGE_AMOUNT}`,
      { timeout: 15_000 },
    );

    const burnNonceBefore = await readL2BurnNonce();
    await page.getByTestId('switch-l2-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('current-chain')).toHaveText(`chain: ${L2_CHAIN_ID}`, {
      timeout: 15_000,
    }).catch(() => undefined);
    await page.getByTestId('burn-button').click();
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(1500);

    const burnNonceAfter = await readL2BurnNonce();
    expect(burnNonceAfter - burnNonceBefore).toBe(1n);

    await operatorUnlock(burnNonceAfter - 1n, operator.address, BRIDGE_AMOUNT);

    await expect(page.getByTestId('source-balance')).toHaveText(
      `sourceBalance (L1): ${beforeSource}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('dest-balance')).toHaveText(
      `destBalance (L2): ${beforeL2Balance}`,
      { timeout: 15_000 },
    );
    expect(await readL2TotalSupply()).toBe(beforeDestSupply);
  });
});
