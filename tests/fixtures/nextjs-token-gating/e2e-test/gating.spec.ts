import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectCustomError, increaseTime } from '@kiwa-test/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const GRANTEE_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;
const TRANSFER_OWNER_PK =
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as const;
const TRANSFER_RECIPIENT_PK =
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const GATE_NFT_ABI = parseAbi([
  'function mint() returns (uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function totalSupply() view returns (uint256)',
]);

const GATED_CONTENT_ABI = parseAbi([
  'function getSecret() returns (string)',
  'function isGated(address user) view returns (bool)',
  'function hasAccess(address user) view returns (bool)',
  'function grantTimedAccess(address user, uint256 ttlSeconds) returns (uint256 expiresAt)',
  'error NotGated()',
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

function makeClients(
  port: number,
  privateKey:
    | typeof OWNER_PK
    | typeof GRANTEE_PK
    | typeof TRANSFER_OWNER_PK
    | typeof TRANSFER_RECIPIENT_PK,
) {
  const account = privateKeyToAccount(privateKey);
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

async function ensureConnected(
  page: import('@playwright/test').Page,
) {
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
  await expect(page.getByTestId('nft-balance')).not.toHaveText('nftBalance: (loading)', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('is-gated')).not.toHaveText('isGated: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js Token gating (NFT 所有で access control) e2e', () => {
  test('T-GT-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('balance:', await page.getByTestId('nft-balance').textContent());
    console.log('gated:', await page.getByTestId('is-gated').textContent());
  });

  test('T-GT-001 connect 後 nftBalance / isGated / accessCount 数値表示', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('nft-balance')).toContainText(/^nftBalance: \d+$/);
    await expect(page.getByTestId('is-gated')).toContainText(/^isGated: (true|false)$/);
    await expect(page.getByTestId('access-count')).toContainText(/^accessCount: \d+$/);
  });

  test('T-GT-002 Mint NFT で nftBalance が +1、isGated=true に遷移', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeBalance = Number(
      ((await page.getByTestId('nft-balance').textContent()) ?? '')
        .replace('nftBalance: ', '')
        .trim(),
    );

    await page.getByTestId('mint-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('nft-balance')).toHaveText(`nftBalance: ${beforeBalance + 1}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('is-gated')).toHaveText('isGated: true', {
      timeout: 15_000,
    });
  });

  test('T-GT-003 mint 後 Read Secret で secret 取得 + accessCount +1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // ensure gated
    const isGated = (await page.getByTestId('is-gated').textContent())?.includes('true');
    if (!isGated) {
      await page.getByTestId('mint-button').click();
      await dappE2e.waitForRpcIdle();
      await expect(page.getByTestId('is-gated')).toHaveText('isGated: true', {
        timeout: 15_000,
      });
    }

    const beforeAccess = Number(
      ((await page.getByTestId('access-count').textContent()) ?? '')
        .replace('accessCount: ', '')
        .trim(),
    );

    await page.getByTestId('read-secret-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('secret')).toHaveText('secret: alpha-pass-2025', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('access-count')).toHaveText(
      `accessCount: ${beforeAccess + 1}`,
      { timeout: 15_000 },
    );
  });

  test('T-GT-004 mint した後 isGated=true で読み取り可能 (累積動作確認)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    // T-GT-002 の累積で nftBalance > 0 + isGated=true 保証
    await expect(page.getByTestId('is-gated')).toHaveText('isGated: true');
  });

  test('T-GT-005 GatedContent.SECRET 定数が "alpha-pass-2025" と一致', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    // Read Secret 経由で確認 (gated 必須なので mint 済み前提)
    const isGated = (await page.getByTestId('is-gated').textContent())?.includes('true');
    if (!isGated) {
      await page.getByTestId('mint-button').click();
      await dappE2e.waitForRpcIdle();
    }
    await page.getByTestId('read-secret-button').click();
    await dappE2e.waitForRpcIdle();
    await expect(page.getByTestId('secret')).toHaveText('secret: alpha-pass-2025', {
      timeout: 15_000,
    });
  });

  test('T-GT-006 TTL expiration test', async ({ anvilPort }) => {
    const env = readEnv();
    const gateNft = env.NEXT_PUBLIC_GATE_NFT as Address;
    const gatedContent = env.NEXT_PUBLIC_GATED_CONTENT as Address;
    const owner = makeClients(anvilPort, OWNER_PK);
    const grantee = makeClients(anvilPort, GRANTEE_PK);

    const mintHash = await owner.wallet.writeContract({
      address: gateNft,
      abi: GATE_NFT_ABI,
      functionName: 'mint',
    });
    await owner.pub.waitForTransactionReceipt({ hash: mintHash });

    const grantHash = await owner.wallet.writeContract({
      address: gatedContent,
      abi: GATED_CONTENT_ABI,
      functionName: 'grantTimedAccess',
      args: [grantee.account.address, 60n],
    });
    await owner.pub.waitForTransactionReceipt({ hash: grantHash });

    expect(
      await owner.pub.readContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'hasAccess',
        args: [grantee.account.address],
      }),
    ).toBe(true);

    await grantee.pub.simulateContract({
      address: gatedContent,
      abi: GATED_CONTENT_ABI,
      functionName: 'getSecret',
      account: grantee.account.address,
    });

    await increaseTime(owner.pub, 61);

    expect(
      await owner.pub.readContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'hasAccess',
        args: [grantee.account.address],
      }),
    ).toBe(false);

    try {
      await grantee.pub.simulateContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'getSecret',
        account: grantee.account.address,
      });
      throw new Error('expected NotGated revert after TTL expiry');
    } catch (error) {
      expectCustomError(error, 'NotGated');
    }
  });

  test('T-GT-007 post-transfer revocation test', async ({ anvilPort }) => {
    const env = readEnv();
    const gateNft = env.NEXT_PUBLIC_GATE_NFT as Address;
    const gatedContent = env.NEXT_PUBLIC_GATED_CONTENT as Address;
    const owner = makeClients(anvilPort, TRANSFER_OWNER_PK);
    const grantee = makeClients(anvilPort, GRANTEE_PK);
    const recipient = makeClients(anvilPort, TRANSFER_RECIPIENT_PK);

    const mintHash = await owner.wallet.writeContract({
      address: gateNft,
      abi: GATE_NFT_ABI,
      functionName: 'mint',
    });
    await owner.pub.waitForTransactionReceipt({ hash: mintHash });
    const tokenId = await owner.pub.readContract({
      address: gateNft,
      abi: GATE_NFT_ABI,
      functionName: 'totalSupply',
    });

    const grantHash = await owner.wallet.writeContract({
      address: gatedContent,
      abi: GATED_CONTENT_ABI,
      functionName: 'grantTimedAccess',
      args: [grantee.account.address, 60n],
    });
    await owner.pub.waitForTransactionReceipt({ hash: grantHash });

    const transferHash = await owner.wallet.writeContract({
      address: gateNft,
      abi: GATE_NFT_ABI,
      functionName: 'transferFrom',
      args: [owner.account.address, recipient.account.address, tokenId],
    });
    await owner.pub.waitForTransactionReceipt({ hash: transferHash });

    expect(
      await owner.pub.readContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'hasAccess',
        args: [owner.account.address],
      }),
    ).toBe(false);
    expect(
      await owner.pub.readContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'hasAccess',
        args: [recipient.account.address],
      }),
    ).toBe(true);

    try {
      await owner.pub.simulateContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'getSecret',
        account: owner.account.address,
      });
      throw new Error('expected NotGated revert after transfer');
    } catch (error) {
      expectCustomError(error, 'NotGated');
    }

    try {
      await grantee.pub.simulateContract({
        address: gatedContent,
        abi: GATED_CONTENT_ABI,
        functionName: 'getSecret',
        account: grantee.account.address,
      });
      throw new Error('expected NotGated revert for grantee after transfer');
    } catch (error) {
      expectCustomError(error, 'NotGated');
    }

    await recipient.pub.simulateContract({
      address: gatedContent,
      abi: GATED_CONTENT_ABI,
      functionName: 'getSecret',
      account: recipient.account.address,
    });

    const accessHash = await recipient.wallet.writeContract({
      address: gatedContent,
      abi: GATED_CONTENT_ABI,
      functionName: 'getSecret',
    });
    await recipient.pub.waitForTransactionReceipt({ hash: accessHash });
  });
});
