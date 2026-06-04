// example: startAnvilCluster + chain 切替 test 雛形
// 用途 — multi-chain dApp の chain 間独立性検証
// 実例参照: examples/nextjs-multi-chain/tests/multi-chain.spec.ts

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

const TOKEN_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function mint(address to, uint256 value)',
]);

function chainAtPort(port: number, id: number) {
  return defineChain({
    id,
    name: `Anvil-${id}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

function makeClient(port: number, id: number) {
  const account = privateKeyToAccount(OWNER_PK);
  const chain = chainAtPort(port, id);
  return {
    account,
    pub: createPublicClient({ chain, transport: http() }),
    wallet: createWalletClient({ account, chain, transport: http() }),
  };
}

test.describe('Multi-chain dApp e2e', () => {
  test('T-MC-001 chain A で mint した balance は chain B から読むと 0', async ({ page }) => {
    // prepare-env が 2 anvil 起動済 (port 8554 = chain A, port 8555 = chain B)
    const PORT_A = 8554;
    const CHAIN_ID_A = 31337;
    const PORT_B = 8555;
    const CHAIN_ID_B = 31338;

    const { account, pub: pubA, wallet: walletA } = makeClient(PORT_A, CHAIN_ID_A);
    const { pub: pubB } = makeClient(PORT_B, CHAIN_ID_B);

    // chain A 上の token (prepare-env で deploy 済、 env から取得)
    const tokenA = process.env.NEXT_PUBLIC_TOKEN_A as Address;
    const tokenB = process.env.NEXT_PUBLIC_TOKEN_B as Address;

    // chain A で 100 mint
    const hash = await walletA.writeContract({
      address: tokenA,
      abi: TOKEN_ABI,
      functionName: 'mint',
      args: [account.address, 100n],
    });
    await pubA.waitForTransactionReceipt({ hash });

    // chain A の balance = 100
    const balA = await pubA.readContract({
      address: tokenA,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    expect(balA).toBe(100n);

    // chain B の同 user balance = 0 (独立性)
    const balB = await pubB.readContract({
      address: tokenB,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    expect(balB).toBe(0n);

    // UI で chain B に切替後、 0 表示
    await page.goto('/');
    await page.getByTestId('switch-chain-b-button').click();
    await expect(page.getByTestId('balance-display')).toHaveText('0');
  });
});
