import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa/core';
import type { Hex } from 'viem';

const VEST_TOTAL = 1000n * 10n ** 18n;
const CLIFF_DURATION = 300n; // 5 minutes
const VESTING_DURATION = 3600n; // 1 hour

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ account, wallet, publicClient }) => {
    const erc20Artifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/SimpleERC20.sol/SimpleERC20.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const vestingArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/TokenVesting.sol/TokenVesting.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    // vest token (deployer に VEST_TOTAL mint してから vesting contract に注入)
    const tHash = await wallet.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['VestToken', 'VST', VEST_TOTAL, account.address],
    });
    const tReceipt = await publicClient.waitForTransactionReceipt({ hash: tHash });
    const vestToken = tReceipt.contractAddress!;

    // 直近 block の timestamp を vesting start に使う
    const latest = await publicClient.getBlock();
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
    const vReceipt = await publicClient.waitForTransactionReceipt({ hash: vHash });
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
    await publicClient.waitForTransactionReceipt({ hash: fundHash });

    return {
      NEXT_PUBLIC_VEST_TOKEN: vestToken,
      NEXT_PUBLIC_VESTING: vesting,
      NEXT_PUBLIC_VEST_START: start.toString(),
      NEXT_PUBLIC_VEST_CLIFF: CLIFF_DURATION.toString(),
      NEXT_PUBLIC_VEST_DURATION: VESTING_DURATION.toString(),
      NEXT_PUBLIC_VEST_TOTAL: VEST_TOTAL.toString(),
    };
  },
});
