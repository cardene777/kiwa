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

// 本 example では paymaster を entryPoint として扱い、smart account.execute を paymaster からも許可する
// entryPoint address は paymaster deploy 後に確定するため、deploy 順序が
// Paymaster (no constructor arg) → AccountFactory(paymaster as entryPoint) になる

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

export default async function globalSetup() {
  anvilState.handle = await startAnvil({ port: ANVIL_PORT });

  const factoryArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/AccountFactory.sol/AccountFactory.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const paymasterArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/Paymaster.sol/Paymaster.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const counterArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/Counter.sol/Counter.json'), 'utf8'),
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

  // 先に Paymaster deploy (constructor arg なし)
  const pHash = await wallet.deployContract({
    abi: paymasterArtifact.abi as never,
    bytecode: paymasterArtifact.bytecode.object,
  });
  const pReceipt = await pub.waitForTransactionReceipt({ hash: pHash });
  const paymaster = pReceipt.contractAddress!;

  // paymaster を entryPoint として AccountFactory deploy
  const fHash = await wallet.deployContract({
    abi: factoryArtifact.abi as never,
    bytecode: factoryArtifact.bytecode.object,
    args: [paymaster],
  });
  const fReceipt = await pub.waitForTransactionReceipt({ hash: fHash });
  const factory = fReceipt.contractAddress!;

  // Counter deploy
  const cHash = await wallet.deployContract({
    abi: counterArtifact.abi as never,
    bytecode: counterArtifact.bytecode.object,
  });
  const cReceipt = await pub.waitForTransactionReceipt({ hash: cHash });
  const counter = cReceipt.contractAddress!;

  const envContent = `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}
NEXT_PUBLIC_FACTORY=${factory}
NEXT_PUBLIC_PAYMASTER=${paymaster}
NEXT_PUBLIC_COUNTER=${counter}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
}
