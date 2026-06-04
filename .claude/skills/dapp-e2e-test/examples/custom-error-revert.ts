// example: custom error revert の expectCustomError パターン
// 用途 — solidity contract の custom error 検証
// 実例参照: examples/nextjs-dao-vote/tests/dao.spec.ts T-DAO-005, T-DAO-007

import {
  BaseError,
  ContractFunctionRevertedError,
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
const NON_OPERATOR_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const PROTECTED_ABI = parseAbi([
  'function protectedFn(uint256 value)',
  'error NotOperator()',
  'error InvalidValue()',
  'error AlreadyExecuted()',
]);

// 全 test で再利用する helper
function expectCustomError(error: unknown, errorName: string): void {
  if (!(error instanceof BaseError)) throw error;
  const reverted = error.walk((c) => c instanceof ContractFunctionRevertedError);
  if (!(reverted instanceof ContractFunctionRevertedError)) throw error;
  expect(reverted.data?.errorName).toBe(errorName);
}

function anvilChain(port: number) {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
}

function makeClients(port: number, privateKey: typeof OWNER_PK | typeof NON_OPERATOR_PK) {
  const account = privateKeyToAccount(privateKey);
  const chain = anvilChain(port);
  return {
    account,
    pub: createPublicClient({ chain, transport: http() }),
    wallet: createWalletClient({ account, chain, transport: http() }),
  };
}

test.describe('Custom error revert pattern', () => {
  test('T-CE-001 非 operator から protectedFn を呼ぶと NotOperator() で revert', async ({
    anvilPort,
  }) => {
    const contract = process.env.NEXT_PUBLIC_PROTECTED_CONTRACT as Address;
    const { account, pub } = makeClients(anvilPort, NON_OPERATOR_PK);

    try {
      await pub.simulateContract({
        account: account.address,
        address: contract,
        abi: PROTECTED_ABI,
        functionName: 'protectedFn',
        args: [42n],
      });
      throw new Error('expected NotOperator revert');
    } catch (error) {
      expectCustomError(error, 'NotOperator');
    }
  });

  test('T-CE-002 operator が同じ id で 2 回実行すると AlreadyExecuted() で revert', async ({
    anvilPort,
  }) => {
    const contract = process.env.NEXT_PUBLIC_PROTECTED_CONTRACT as Address;
    const { wallet, pub } = makeClients(anvilPort, OWNER_PK);

    // 1 回目: 成功
    const hash = await wallet.writeContract({
      address: contract,
      abi: PROTECTED_ABI,
      functionName: 'protectedFn',
      args: [1n],
    });
    await pub.waitForTransactionReceipt({ hash });

    // 2 回目: revert
    try {
      await pub.simulateContract({
        account: wallet.account.address,
        address: contract,
        abi: PROTECTED_ABI,
        functionName: 'protectedFn',
        args: [1n],
      });
      throw new Error('expected AlreadyExecuted revert');
    } catch (error) {
      expectCustomError(error, 'AlreadyExecuted');
    }
  });
});
