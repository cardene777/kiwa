import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectCustomError } from '@dapp-e2e/core';
import { createPublicClient, createWalletClient, defineChain, http, parseAbi, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const SECOND_PRIVATE_KEY =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const RESOLVER_ABI = parseAbi([
  'function setRecord(string name, address addr)',
  'function resolve(string name) view returns (address)',
  'error AlreadyRegistered()',
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

function makeClients(port: number, privateKey: typeof PRIVATE_KEY | typeof SECOND_PRIVATE_KEY) {
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
  await expect(page.getByTestId('resolved-address')).not.toHaveText(
    'resolved: (loading)',
    { timeout: 30_000 },
  );
  await expect(page.getByTestId('reverse-name')).not.toHaveText(
    'myReverseName: (loading)',
    { timeout: 30_000 },
  );
}

/// 各 test 個別の name (anvil state は global-setup 1 回でしか reset されないため)
function makeName(suffix: string) {
  return `alice-${suffix}-${Date.now()}`;
}

async function setNameInput(page: import('@playwright/test').Page, value: string) {
  await page.getByTestId('name-input').fill(value);
}

async function setLookupInput(page: import('@playwright/test').Page, value: string) {
  await page.getByTestId('lookup-input').fill(value);
}

test.describe('Next.js ENS-like resolver (forward / reverse 名前解決) e2e', () => {
  test('T-ENS-000 warmup page render', async ({ page, dappE2e }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await page.waitForTimeout(5000);
    console.log('resolved:', await page.getByTestId('resolved-address').textContent());
    console.log('reverse:', await page.getByTestId('reverse-name').textContent());
  });

  test('T-ENS-001 connect 後 resolved=0x0 / reverseName="" (未登録 default)', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);
    // 未登録なので resolved は 0x0、reverse は 空文字
    await expect(page.getByTestId('resolved-address')).toHaveText(
      'resolved: 0x0000000000000000000000000000000000000000',
    );
    await expect(page.getByTestId('reverse-name')).toHaveText('myReverseName: ""');
  });

  test('T-ENS-002 setRecord で name → my address 登録 → forward resolve で取得', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const account = privateKeyToAccount(PRIVATE_KEY);
    const name = makeName('record');

    await setNameInput(page, name);
    await setLookupInput(page, name);
    await page.getByTestId('set-record-button').click();
    await dappE2e.waitForRpcIdle();

    // forward resolve は同じ name で lookup
    await expect(page.getByTestId('resolved-address')).toHaveText(
      `resolved: ${account.address}`,
      { timeout: 15_000 },
    );
  });

  test('T-ENS-003 setReverse で my address → name 登録 → reverse lookup で取得', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const name = makeName('reverse');
    await setNameInput(page, name);
    await page.getByTestId('set-reverse-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('reverse-name')).toHaveText(`myReverseName: "${name}"`, {
      timeout: 15_000,
    });
  });

  test('T-ENS-004 forward と reverse を両方設定 → round-trip 整合', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const account = privateKeyToAccount(PRIVATE_KEY);
    const name = makeName('roundtrip');

    await setNameInput(page, name);
    await setLookupInput(page, name);

    await page.getByTestId('set-record-button').click();
    await dappE2e.waitForRpcIdle();
    await page.getByTestId('set-reverse-button').click();
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('resolved-address')).toHaveText(
      `resolved: ${account.address}`,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('reverse-name')).toHaveText(`myReverseName: "${name}"`, {
      timeout: 15_000,
    });
  });

  test('T-ENS-005 未登録 name を lookup したら resolved=0x0 のまま', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitLoaded(page);

    const unknownName = `nonexistent-${Date.now()}`;
    await setLookupInput(page, unknownName);
    await dappE2e.waitForRpcIdle();

    await expect(page.getByTestId('resolved-address')).toHaveText(
      'resolved: 0x0000000000000000000000000000000000000000',
      { timeout: 15_000 },
    );
  });

  test('T-ENS-006 name collision handling test', async ({ anvilPort }) => {
    const env = readEnv();
    const resolver = env.NEXT_PUBLIC_RESOLVER as Address;
    const owner = makeClients(anvilPort, PRIVATE_KEY);
    const other = makeClients(anvilPort, SECOND_PRIVATE_KEY);
    const name = makeName('collision');

    const registerHash = await owner.wallet.writeContract({
      address: resolver,
      abi: RESOLVER_ABI,
      functionName: 'setRecord',
      args: [name, owner.account.address],
    });
    await owner.pub.waitForTransactionReceipt({ hash: registerHash });

    try {
      await other.pub.simulateContract({
        address: resolver,
        abi: RESOLVER_ABI,
        functionName: 'setRecord',
        args: [name, other.account.address],
        account: other.account.address,
      });
      throw new Error('expected AlreadyRegistered revert');
    } catch (error) {
      expectCustomError(error, 'AlreadyRegistered');
    }

    expect(
      await owner.pub.readContract({
        address: resolver,
        abi: RESOLVER_ABI,
        functionName: 'resolve',
        args: [name],
      }),
    ).toBe(owner.account.address);
  });
});
