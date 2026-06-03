import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { startAnvil } from '@dapp-e2e/core';
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilState } from './anvil-handle';

const CHAIN_CONFIGS = [
  { id: 1, port: 8551, label: 'Mainnet' },
  { id: 10, port: 8552, label: 'Optimism' },
  { id: 8453, port: 8553, label: 'Base' },
] as const;

const PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const INITIAL_SUPPLY = 1_000n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

async function deploySimpleToken(
  port: number,
  chainId: number,
  symbol: string,
  noncePadding: number,
): Promise<Hex> {
  const artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleToken.sol/SimpleToken.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

  const chain = defineChain({
    id: chainId,
    name: `chain-${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
  const account = privateKeyToAccount(PRIVATE_KEY);
  const wallet = createWalletClient({ account, chain, transport: http() });
  const pub = createPublicClient({ chain, transport: http() });

  // nonce padding: 同一 deployer の同一 nonce で deploy すると CREATE address が
  // 全 chain で同一になるため、chain ごとに dummy self-transfer で nonce をずらす
  for (let i = 0; i < noncePadding; i++) {
    const padHash = await wallet.sendTransaction({
      to: account.address,
      value: 0n,
    });
    await pub.waitForTransactionReceipt({ hash: padHash });
  }

  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object,
    args: [`Token-${symbol}`, symbol, INITIAL_SUPPLY, account.address],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error(`deploy failed on chain ${chainId}`);
  return receipt.contractAddress;
}

export default async function globalSetup() {
  const deployedAddresses: Record<string, Hex> = {};
  for (let i = 0; i < CHAIN_CONFIGS.length; i++) {
    const c = CHAIN_CONFIGS[i]!;
    const h = await startAnvil({ port: c.port, chainId: c.id });
    anvilState.handles.push(h);
    // chain 別に nonce padding (Mainnet=0 / Optimism=1 / Base=2) で deploy address を変える
    const addr = await deploySimpleToken(c.port, c.id, c.label, i);
    deployedAddresses[c.label] = addr;
  }

  const envContent = `NEXT_PUBLIC_MAINNET_PORT=${CHAIN_CONFIGS[0].port}
NEXT_PUBLIC_OPTIMISM_PORT=${CHAIN_CONFIGS[1].port}
NEXT_PUBLIC_BASE_PORT=${CHAIN_CONFIGS[2].port}
NEXT_PUBLIC_MAINNET_TOKEN=${deployedAddresses.Mainnet}
NEXT_PUBLIC_OPTIMISM_TOKEN=${deployedAddresses.Optimism}
NEXT_PUBLIC_BASE_TOKEN=${deployedAddresses.Base}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
}
