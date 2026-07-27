// example: 1 contract + 単純な happy path test 雛形
// 用途 — `mint-nft` `defi-swap` 系の最小構成
// 実例参照: tests/fixtures/mint-nft/e2e-test/mint.spec.ts

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

// anvil dev account #0
const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

const MY_CONTRACT_ABI = parseAbi([
  'function doSomething(uint256 value) returns (uint256)',
  'function value() view returns (uint256)',
  'error InvalidValue()',
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
  const envPath = resolve(__dirname, '../.env.local');
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l.length > 0 && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  ) as Record<string, string>;
}

function makeClients(port: number, privateKey: typeof OWNER_PK) {
  const account = privateKeyToAccount(privateKey);
  const chain = anvilChain(port);
  return {
    account,
    pub: createPublicClient({ chain, transport: http() }),
    wallet: createWalletClient({ account, chain, transport: http() }),
  };
}

test.describe('My dApp e2e', () => {
  test('T-MY-001 doSomething で value が更新される', async ({ page, anvilPort }) => {
    const env = readEnv();
    const contract = env.NEXT_PUBLIC_MY_CONTRACT as Address;
    const { pub, wallet, account } = makeClients(anvilPort, OWNER_PK);

    // UI 接続
    await page.goto('/');
    await page.getByTestId('connect-button').click();
    await page.waitForSelector('[data-testid="account-address"]');

    // contract 操作
    const hash = await wallet.writeContract({
      address: contract,
      abi: MY_CONTRACT_ABI,
      functionName: 'doSomething',
      args: [42n],
    });
    await pub.waitForTransactionReceipt({ hash });

    // state 検証
    const v = await pub.readContract({
      address: contract,
      abi: MY_CONTRACT_ABI,
      functionName: 'value',
    });
    expect(v).toBe(42n);

    // UI 反映確認
    await expect(page.getByTestId('value-display')).toHaveText('42');
  });
});
