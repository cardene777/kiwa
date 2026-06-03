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

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

export default async function globalSetup() {
  anvilState.handle = await startAnvil({ port: ANVIL_PORT });

  const artifact = JSON.parse(
    readFileSync(
      resolve(exampleRoot, 'forge-out/CommitmentVerifier.sol/CommitmentVerifier.json'),
      'utf8',
    ),
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

  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  const verifier = receipt.contractAddress!;

  const envContent = `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}
NEXT_PUBLIC_VERIFIER=${verifier}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
}
