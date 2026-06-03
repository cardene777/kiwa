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

const VEST_TOTAL = 1000n * 10n ** 18n;
const CLIFF_DURATION = 300n; // 5 minutes
const VESTING_DURATION = 3600n; // 1 hour

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

export default async function globalSetup() {
  anvilState.handle = await startAnvil({ port: ANVIL_PORT });

  const erc20Artifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/SimpleERC20.sol/SimpleERC20.json'), 'utf8'),
  ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
  const vestingArtifact = JSON.parse(
    readFileSync(resolve(exampleRoot, 'forge-out/TokenVesting.sol/TokenVesting.json'), 'utf8'),
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

  // vest token (deployer に VEST_TOTAL mint してから vesting contract に注入)
  const tHash = await wallet.deployContract({
    abi: erc20Artifact.abi as never,
    bytecode: erc20Artifact.bytecode.object,
    args: ['VestToken', 'VST', VEST_TOTAL, account.address],
  });
  const tReceipt = await pub.waitForTransactionReceipt({ hash: tHash });
  const vestToken = tReceipt.contractAddress!;

  // 直近 block の timestamp を vesting start に使う
  const latest = await pub.getBlock();
  const start = latest.timestamp;

  const vHash = await wallet.deployContract({
    abi: vestingArtifact.abi as never,
    bytecode: vestingArtifact.bytecode.object,
    args: [
      vestToken,
      account.address,
      start,
      CLIFF_DURATION,
      VESTING_DURATION,
      VEST_TOTAL,
    ],
  });
  const vReceipt = await pub.waitForTransactionReceipt({ hash: vHash });
  const vesting = vReceipt.contractAddress!;

  // vesting contract に総量を注入
  const TRANSFER_ABI = [
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
    address: vestToken,
    abi: TRANSFER_ABI,
    functionName: 'transfer',
    args: [vesting, VEST_TOTAL],
  });
  await pub.waitForTransactionReceipt({ hash: fundHash });

  const envContent = `NEXT_PUBLIC_ANVIL_PORT=${ANVIL_PORT}
NEXT_PUBLIC_VEST_TOKEN=${vestToken}
NEXT_PUBLIC_VESTING=${vesting}
NEXT_PUBLIC_VEST_START=${start}
NEXT_PUBLIC_VEST_CLIFF=${CLIFF_DURATION}
NEXT_PUBLIC_VEST_DURATION=${VESTING_DURATION}
NEXT_PUBLIC_VEST_TOTAL=${VEST_TOTAL}
`;
  writeFileSync(resolve(exampleRoot, '.env.local'), envContent, 'utf8');
}
