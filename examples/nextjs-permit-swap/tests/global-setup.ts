import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { startAnvil } from '@dapp-e2e/core';
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilState } from './anvil-handle';

const ANVIL_PORT = 8545;
const PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const USER_INITIAL_A = 100n * 10n ** 18n;
const POOL_LIQUIDITY_B = 1000n * 10n ** 18n;
const TOKEN_A_NAME = 'PermitTokenA';
const TOKEN_B_NAME = 'PermitTokenB';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

export default async function globalSetup() {
  anvilState.handle = await startAnvil({ port: ANVIL_PORT });

  const tokenArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/PermitToken.sol/PermitToken.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const swapArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/PermitSwap.sol/PermitSwap.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

  const chain = defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
  const account = privateKeyToAccount(PRIVATE_KEY);
  const wallet = createWalletClient({ account, chain, transport: http() });
  const pub = createPublicClient({ chain, transport: http() });

  // tokenA (user に USER_INITIAL_A mint)
  const aHash = await wallet.deployContract({
    abi: tokenArtifact.abi as never,
    bytecode: tokenArtifact.bytecode.object,
    args: [TOKEN_A_NAME, 'PA', USER_INITIAL_A, account.address],
  });
  const aReceipt = await pub.waitForTransactionReceipt({ hash: aHash });
  const tokenA = aReceipt.contractAddress!;

  // tokenB (POOL_LIQUIDITY_B を deployer mint → swap pool に transfer)
  const bHash = await wallet.deployContract({
    abi: tokenArtifact.abi as never,
    bytecode: tokenArtifact.bytecode.object,
    args: [TOKEN_B_NAME, 'PB', POOL_LIQUIDITY_B, account.address],
  });
  const bReceipt = await pub.waitForTransactionReceipt({ hash: bHash });
  const tokenB = bReceipt.contractAddress!;

  // swap pool
  const sHash = await wallet.deployContract({
    abi: swapArtifact.abi as never,
    bytecode: swapArtifact.bytecode.object,
    args: [tokenA, tokenB],
  });
  const sReceipt = await pub.waitForTransactionReceipt({ hash: sHash });
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
  await pub.waitForTransactionReceipt({ hash: fundHash });

  const envContent = `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}
NEXT_PUBLIC_TOKEN_A=${tokenA}
NEXT_PUBLIC_TOKEN_B=${tokenB}
NEXT_PUBLIC_SWAP=${swap}
NEXT_PUBLIC_TOKEN_A_NAME=${TOKEN_A_NAME}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
}
