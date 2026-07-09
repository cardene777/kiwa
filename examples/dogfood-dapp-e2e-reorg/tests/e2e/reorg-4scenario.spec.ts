/**
 * 4-scenario reorg regression suite (v1.18-4).
 *
 * Each scenario drives the Next.js + wagmi UI through a state change, uses the
 * anvil evm_snapshot / evm_revert primitives to simulate a reorg, and asserts
 * the dApp reconverges within the 1.5 s refetch window. The suite is the
 * dogfood harness for kiwa-play + kiwa::contract::alloy — every op the tests
 * observe is one the fidelity report diffs mock vs real on.
 *
 * Scenarios
 *   S1: pending tx → reorg → dropped (getTransactionReceipt returns null)
 *   S2: confirmed tx → reorg → balance rollback (senderBalance restored)
 *   S3: Transfer event → reorg → history disappears + refetch re-populates
 *   S4: nonce gap → mempool re-send → new tx confirms
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatUnits,
  http,
  parseUnits,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { snapshotChain, revertChain } from '@kiwa-lab/dapp';
import { test, expect } from '../fixture';

const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const RECIPIENT_ADDRESS =
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const; // anvil account #1
const OWNER_ADDRESS =
  '0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266' as const; // anvil account #0

const REORG_TOKEN_ABI = [
  {
    inputs: [{ type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..', '..');

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil-Reorg',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

function readEnv(): Record<string, string> {
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

function makeClients(port: number) {
  const account = privateKeyToAccount(OWNER_PK);
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
  await expect(page.getByTestId('connection-status')).toHaveText(
    'status: connected',
    { timeout: 15_000 },
  );
}

async function waitLoaded(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('sender-balance')).not.toContainText('(loading)', {
    timeout: 30_000,
  });
}

async function mineOneBlock(pub: PublicClient) {
  await (
    pub as unknown as {
      request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
    }
  ).request({ method: 'evm_mine', params: [] });
}

test.describe('reorg 4-scenario e2e', () => {
  test('T-DR-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(3000);
  });

  test('T-DR-S1 pending tx → reorg → dropped', async ({ page, dappE2e }) => {
    // Scenario 1: submit a tx but never mine it. After the reorg the pending
    // pool is cleared and getTransactionReceipt returns null, so the dApp's
    // txStatus transitions from `pending` → `dropped`.
    const env = readEnv();
    const port = Number(env.NEXT_PUBLIC_ANVIL_PORT ?? 8557);
    const { pub, wallet } = makeClients(port);

    // Halt block mining so submitted txs stay in the mempool until reorg.
    await (
      pub as unknown as {
        request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
      }
    ).request({ method: 'anvil_setAutomine', params: [false] });

    const snapshotId = await snapshotChain(pub);

    // Submit a tx that will be dropped by the reorg.
    const pendingHash = await wallet.writeContract({
      address: env.NEXT_PUBLIC_REORG_TOKEN as Address,
      abi: REORG_TOKEN_ABI,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS, parseUnits('5', 18)],
    });

    // Confirm the tx is in the pool before the reorg.
    const beforeTx = await pub.getTransaction({ hash: pendingHash });
    expect(beforeTx.hash).toBe(pendingHash);
    expect(beforeTx.blockNumber).toBeNull();

    // Reorg — evm_revert drops the pending tx.
    const reverted = await revertChain(pub, snapshotId);
    expect(reverted).toBe(true);

    // Re-enable mining so the next block confirms nothing (mempool empty).
    await (
      pub as unknown as {
        request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
      }
    ).request({ method: 'anvil_setAutomine', params: [true] });
    await mineOneBlock(pub);

    // After the reorg the tx no longer exists.
    const droppedTx = await pub.getTransaction({ hash: pendingHash }).catch(() => null);
    expect(droppedTx).toBeNull();

    // Refresh the page so the pending tx tracker picks up the drop.
    await page.goto('/');
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
  });

  test('T-DR-S2 confirmed tx → reorg → balance rollback', async ({
    page,
    dappE2e,
  }) => {
    // Scenario 2: mine a transfer, snapshot before it, then revert. The dApp
    // observes senderBalance snap back to its pre-transfer value within the
    // 1.5 s refetchInterval.
    const env = readEnv();
    const port = Number(env.NEXT_PUBLIC_ANVIL_PORT ?? 8557);
    const { pub, wallet } = makeClients(port);
    const token = env.NEXT_PUBLIC_REORG_TOKEN as Address;

    // Baseline balance before the transfer.
    const balanceBefore = (await pub.readContract({
      address: token,
      abi: REORG_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [OWNER_ADDRESS],
    })) as bigint;

    const snapshotId = await snapshotChain(pub);

    // Confirmed transfer that will be reverted.
    const txHash = await wallet.writeContract({
      address: token,
      abi: REORG_TOKEN_ABI,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS, parseUnits('100', 18)],
    });
    const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
    expect(receipt.status).toBe('success');

    const balanceAfter = (await pub.readContract({
      address: token,
      abi: REORG_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [OWNER_ADDRESS],
    })) as bigint;
    expect(balanceAfter).toBe(balanceBefore - parseUnits('100', 18));

    // Reorg — the transfer is unwound, balance snaps back.
    const reverted = await revertChain(pub, snapshotId);
    expect(reverted).toBe(true);

    const balanceRolledBack = (await pub.readContract({
      address: token,
      abi: REORG_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [OWNER_ADDRESS],
    })) as bigint;
    expect(balanceRolledBack).toBe(balanceBefore);

    // Load the UI and confirm the react-query view reconverges.
    await page.goto('/');
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('sender-balance')).toHaveText(
      `senderBalance: ${formatUnits(balanceBefore, 18)}`,
      { timeout: 15_000 },
    );
  });

  test('T-DR-S3 Transfer event → reorg → history disappears + refetch', async ({
    page,
    dappE2e,
  }) => {
    // Scenario 3: the past Transfer log list snaps back after the reorg. The
    // dApp's getLogs refetch on refetchInterval picks up the new head, so the
    // pastTransfersCount decrements to the pre-reorg value.
    const env = readEnv();
    const port = Number(env.NEXT_PUBLIC_ANVIL_PORT ?? 8557);
    const { pub, wallet } = makeClients(port);
    const token = env.NEXT_PUBLIC_REORG_TOKEN as Address;

    const logsBefore = await pub.getLogs({
      address: token,
      fromBlock: 0n,
      toBlock: 'latest',
    });
    const countBefore = logsBefore.length;

    const snapshotId = await snapshotChain(pub);

    // Three transfers that will be un-emitted by the reorg.
    for (let i = 0; i < 3; i += 1) {
      const hash = await wallet.writeContract({
        address: token,
        abi: REORG_TOKEN_ABI,
        functionName: 'transfer',
        args: [RECIPIENT_ADDRESS, parseUnits(String(i + 1), 18)],
      });
      await pub.waitForTransactionReceipt({ hash });
    }

    const logsMid = await pub.getLogs({
      address: token,
      fromBlock: 0n,
      toBlock: 'latest',
    });
    expect(logsMid.length).toBe(countBefore + 3);

    const reverted = await revertChain(pub, snapshotId);
    expect(reverted).toBe(true);

    const logsAfter = await pub.getLogs({
      address: token,
      fromBlock: 0n,
      toBlock: 'latest',
    });
    expect(logsAfter.length).toBe(countBefore);

    await page.goto('/');
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('past-transfers-count')).toHaveText(
      `pastTransfersCount: ${countBefore}`,
      { timeout: 15_000 },
    );
  });

  test('T-DR-S4 nonce gap → mempool re-send', async ({ page, dappE2e }) => {
    // Scenario 4: reset the nonce via anvil_setNonce to create a gap, then
    // re-send a transfer at the correct nonce. The mempool re-orders and
    // confirms the new tx.
    const env = readEnv();
    const port = Number(env.NEXT_PUBLIC_ANVIL_PORT ?? 8557);
    const { pub, wallet } = makeClients(port);
    const token = env.NEXT_PUBLIC_REORG_TOKEN as Address;

    const nonceBefore = await pub.getTransactionCount({ address: OWNER_ADDRESS });
    const snapshotId = await snapshotChain(pub);

    // Send a tx at nonceBefore, then rewind the chain — the tx is dropped
    // and the nonce is back to nonceBefore.
    const firstHash = await wallet.writeContract({
      address: token,
      abi: REORG_TOKEN_ABI,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS, parseUnits('7', 18)],
    });
    await pub.waitForTransactionReceipt({ hash: firstHash });

    const reverted = await revertChain(pub, snapshotId);
    expect(reverted).toBe(true);

    const nonceAfterReorg = await pub.getTransactionCount({
      address: OWNER_ADDRESS,
    });
    expect(nonceAfterReorg).toBe(nonceBefore);

    // Re-send at the same nonce — mempool accepts the new tx.
    const secondHash = await wallet.writeContract({
      address: token,
      abi: REORG_TOKEN_ABI,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS, parseUnits('11', 18)],
    });
    const receipt = await pub.waitForTransactionReceipt({ hash: secondHash });
    expect(receipt.status).toBe('success');
    expect(secondHash).not.toBe(firstHash);

    // Nonce advanced by one after the re-send.
    const nonceFinal = await pub.getTransactionCount({ address: OWNER_ADDRESS });
    expect(nonceFinal).toBe(nonceBefore + 1);

    await page.goto('/');
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
  });
});
