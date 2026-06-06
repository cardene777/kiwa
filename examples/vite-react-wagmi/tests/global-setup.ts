import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { startAnvil } from '@kiwa/core';
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilState } from './anvil-handle';

const ANVIL_PORT = 8545;
const PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

async function deployContract(): Promise<Hex> {
  const artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/MintNft.sol/MintNft.json'), 'utf8'),
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
  if (!receipt.contractAddress) throw new Error('contract deploy failed');
  return receipt.contractAddress;
}

export default async function globalSetup() {
  anvilState.handle = await startAnvil({ port: ANVIL_PORT });
  const contract = await deployContract();
  const envContent = `VITE_ANVIL_PORT=${ANVIL_PORT}
VITE_MINT_CONTRACT=${contract}
`;
  writeFileSync(resolve(exampleRoot, '.env'), envContent, 'utf8');
  process.env.MINT_CONTRACT = contract;
}
