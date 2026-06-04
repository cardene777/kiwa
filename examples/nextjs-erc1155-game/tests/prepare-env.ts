import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@dapp-e2e/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');
const ANVIL_PORT = 8545;
const CHAIN_ID = 31337;
const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

async function deployToExistingAnvil(): Promise<void> {
  const artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/GameItems.sol/GameItems.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const account = privateKeyToAccount(PRIVATE_KEY);
  const chain = defineChain({
    id: CHAIN_ID,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
  const wallet = createWalletClient({ account, chain, transport: http() });
  const publicClient = createPublicClient({ chain, transport: http() });

  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error('contract deploy failed');

  writeFileSync(
    resolve(exampleRoot, '.env.local'),
    [
      'NEXT_PUBLIC_RUNTIME_MODE=test',
      `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}`,
      `NEXT_PUBLIC_GAME_CONTRACT=${receipt.contractAddress}`,
      '',
    ].join('\n'),
    'utf8',
  );
  rmSync(resolve(exampleRoot, '.next'), { recursive: true, force: true });
  rmSync(resolve(exampleRoot, '.context/anvil.pid'), { force: true });
}

try {
  await runE2EPrepareEnv({
    exampleRoot,
    port: ANVIL_PORT,
    chainId: CHAIN_ID,
    deploy: async ({ wallet, publicClient }) => {
      const artifact = JSON.parse(
        readFileSync(resolve(exampleRoot, 'forge-out/GameItems.sol/GameItems.json'), 'utf8'),
      ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

      const hash = await wallet.deployContract({
        abi: artifact.abi as never,
        bytecode: artifact.bytecode.object,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) throw new Error('contract deploy failed');

      return {
        NEXT_PUBLIC_GAME_CONTRACT: receipt.contractAddress,
      };
    },
  });
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('anvil failed to listen')) {
    throw error;
  }
  await deployToExistingAnvil();
}
