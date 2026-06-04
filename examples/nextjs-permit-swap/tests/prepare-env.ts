import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@dapp-e2e/core';
import type { Hex } from 'viem';

const USER_INITIAL_A = 100n * 10n ** 18n;
const POOL_LIQUIDITY_B = 1000n * 10n ** 18n;
const TOKEN_A_NAME = 'PermitTokenA';
const TOKEN_B_NAME = 'PermitTokenB';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ account, wallet, publicClient }) => {
    const tokenArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/PermitToken.sol/PermitToken.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const swapArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/PermitSwap.sol/PermitSwap.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    // tokenA (user に USER_INITIAL_A mint)
    const aHash = await wallet.deployContract({
      abi: tokenArtifact.abi as never,
      bytecode: tokenArtifact.bytecode.object,
      args: [TOKEN_A_NAME, 'PA', USER_INITIAL_A, account.address],
    });
    const aReceipt = await publicClient.waitForTransactionReceipt({ hash: aHash });
    const tokenA = aReceipt.contractAddress!;

    // tokenB (POOL_LIQUIDITY_B を deployer mint → swap pool に transfer)
    const bHash = await wallet.deployContract({
      abi: tokenArtifact.abi as never,
      bytecode: tokenArtifact.bytecode.object,
      args: [TOKEN_B_NAME, 'PB', POOL_LIQUIDITY_B, account.address],
    });
    const bReceipt = await publicClient.waitForTransactionReceipt({ hash: bHash });
    const tokenB = bReceipt.contractAddress!;

    // swap pool
    const sHash = await wallet.deployContract({
      abi: swapArtifact.abi as never,
      bytecode: swapArtifact.bytecode.object,
      args: [tokenA, tokenB],
    });
    const sReceipt = await publicClient.waitForTransactionReceipt({ hash: sHash });
    const swap = sReceipt.contractAddress!;

    // tokenB を swap pool に注入
    const TOKEN_TRANSFER_ABI = [
      {
        inputs: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;
    const fundHash = await wallet.writeContract({
      address: tokenB,
      abi: TOKEN_TRANSFER_ABI,
      functionName: 'transfer',
      args: [swap, POOL_LIQUIDITY_B],
    });
    await publicClient.waitForTransactionReceipt({ hash: fundHash });

    return {
      NEXT_PUBLIC_TOKEN_A: tokenA,
      NEXT_PUBLIC_TOKEN_B: tokenB,
      NEXT_PUBLIC_SWAP: swap,
      NEXT_PUBLIC_TOKEN_A_NAME: TOKEN_A_NAME,
    };
  },
});
