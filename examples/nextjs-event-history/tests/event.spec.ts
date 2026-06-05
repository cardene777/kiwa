import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectEvent } from '@dapp-e2e/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  padHex,
  parseAbi,
  toEventSelector,
  toHex,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const OTHER_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const EMITTER_ABI = parseAbi([
  'function emitLog(uint256 value, string message)',
  'event Logged(address indexed sender, uint256 indexed value, string message)',
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

function makeClients(port: number, privateKey: typeof OWNER_PK | typeof OTHER_PK) {
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

async function getLogsWithTopics(
  pub: ReturnType<typeof createPublicClient>,
  {
    address,
    fromBlock,
    topics,
  }: {
    address: Address;
    fromBlock: bigint;
    topics: readonly [Hex, Hex, Hex];
  },
) {
  return await (
    pub as unknown as {
      request: (args: {
        method: 'eth_getLogs';
        params: [{ address: Address; fromBlock: Hex; toBlock: 'latest'; topics: readonly [Hex, Hex, Hex] }];
      }) => Promise<Array<{ data: Hex; topics: Hex[] }>>;
    }
  ).request({
    method: 'eth_getLogs',
    params: [{ address, fromBlock: toHex(fromBlock), toBlock: 'latest', topics }],
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
  await expect(page.getByTestId('total-logs')).not.toHaveText('totalLogs: (loading)', {
    timeout: 30_000,
  });
}

test.describe('Next.js Event history (past + watchContractEvent) e2e', () => {
  test('T-EV-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('total:', await page.getByTestId('total-logs').textContent());
    console.log('past:', await page.getByTestId('past-logs-count').textContent());
  });

  test('T-EV-001 connect 後 totalLogs / pastLogsCount / liveLogsCount が数値表示', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('total-logs')).toContainText(/^totalLogs: \d+$/);
    await expect(page.getByTestId('past-logs-count')).toContainText(/^pastLogsCount: \d+$/);
    await expect(page.getByTestId('live-logs-count')).toContainText(/^liveLogsCount: \d+$/);
  });

  test('T-EV-002 Emit Log 1 回で totalLogs / pastLogsCount が +1 増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeTotal = Number(
      ((await page.getByTestId('total-logs').textContent()) ?? '')
        .replace('totalLogs: ', '')
        .trim(),
    );
    const beforePast = Number(
      ((await page.getByTestId('past-logs-count').textContent()) ?? '')
        .replace('pastLogsCount: ', '')
        .trim(),
    );

    await page.getByTestId('emit-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('total-logs')).toHaveText(`totalLogs: ${beforeTotal + 1}`, {
      timeout: 15_000,
    });
    // refetchInterval 1.5s で past logs も更新される
    await expect(page.getByTestId('past-logs-count')).toHaveText(
      `pastLogsCount: ${beforePast + 1}`,
      { timeout: 15_000 },
    );
  });

  test('T-EV-003 3 回連続 Emit で totalLogs が +3 / pastLogsCount が +3', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const beforeTotal = Number(
      ((await page.getByTestId('total-logs').textContent()) ?? '')
        .replace('totalLogs: ', '')
        .trim(),
    );
    const beforePast = Number(
      ((await page.getByTestId('past-logs-count').textContent()) ?? '')
        .replace('pastLogsCount: ', '')
        .trim(),
    );

    for (let i = 0; i < 3; i++) {
      await page.getByTestId('emit-button').click();
      await dappE2e.waitForRpcIdle();
    }

    await expect(page.getByTestId('total-logs')).toHaveText(`totalLogs: ${beforeTotal + 3}`, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('past-logs-count')).toHaveText(
      `pastLogsCount: ${beforePast + 3}`,
      { timeout: 15_000 },
    );
  });

  test('T-EV-004 liveLogsCount は wagmi useWatchContractEvent の初期値が数値表示', async ({
    page,
    dappE2e,
  }) => {
    // 注意: dapp-e2e fixture は eth_subscribe を code 4200 で reject する仕様のため、
    // wagmi useWatchContractEvent の subscribe 経路は anvil 上で動作保証外。
    // 本 test では「liveLogsCount が数値で表示される」確認のみで、累積動作は test しない。
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    await expect(page.getByTestId('live-logs-count')).toContainText(/^liveLogsCount: \d+$/);
  });

  test('T-EV-005 totalLogs と pastLogsCount は累積で同じ値', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const total = Number(
      ((await page.getByTestId('total-logs').textContent()) ?? '')
        .replace('totalLogs: ', '')
        .trim(),
    );
    const past = Number(
      ((await page.getByTestId('past-logs-count').textContent()) ?? '')
        .replace('pastLogsCount: ', '')
        .trim(),
    );
    expect(total).toBe(past);
  });

  test('T-EV-006 multi-param indexed filter test', async ({ anvilPort }) => {
    const env = readEnv();
    const emitter = env.NEXT_PUBLIC_EMITTER as Address;
    const owner = makeClients(anvilPort, OWNER_PK);
    const other = makeClients(anvilPort, OTHER_PK);
    const fromBlock = (await owner.pub.getBlockNumber()) + 1n;

    const txHashes = [
      await owner.wallet.writeContract({
        address: emitter,
        abi: EMITTER_ABI,
        functionName: 'emitLog',
        args: [111n, 'owner-hit'],
      }),
      await owner.wallet.writeContract({
        address: emitter,
        abi: EMITTER_ABI,
        functionName: 'emitLog',
        args: [222n, 'owner-other'],
      }),
      await other.wallet.writeContract({
        address: emitter,
        abi: EMITTER_ABI,
        functionName: 'emitLog',
        args: [111n, 'other-other'],
      }),
    ];
    const receipts = await Promise.all(
      txHashes.map((hash) => owner.pub.waitForTransactionReceipt({ hash })),
    );

    const topics = [
      toEventSelector('Logged(address,uint256,string)'),
      padHex(owner.account.address.toLowerCase() as `0x${string}`, { size: 32 }),
      padHex(toHex(111n), { size: 32 }),
    ] as const;

    const logs = await getLogsWithTopics(owner.pub, { address: emitter, fromBlock, topics });

    expect(logs).toHaveLength(1);
    expect(logs[0]?.topics).toEqual(topics);
    expectEvent(receipts[0]!, EMITTER_ABI, 'Logged', {
      sender: owner.account.address,
      value: 111n,
      message: 'owner-hit',
    });
  });
});
