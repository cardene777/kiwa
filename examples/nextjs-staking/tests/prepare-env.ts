import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa/core';
import type { Hex } from 'viem';

const USER_STAKE_INITIAL = 1000n * 10n ** 18n;
const POOL_REWARD = 10000n * 10n ** 18n;
const REWARD_RATE = 10n ** 18n;
const CONTROLLER = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as const;

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
    const stakingArtifact = JSON.parse(
      readFileSync(
        resolve(exampleRoot, 'forge-out/SimpleStaking.sol/SimpleStaking.json'),
        'utf8',
      ),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const sHash = await wallet.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['StakeToken', 'STK', USER_STAKE_INITIAL, account.address],
    });
    const sReceipt = await publicClient.waitForTransactionReceipt({ hash: sHash });
    const stakeToken = sReceipt.contractAddress!;

    const rHash = await wallet.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['RewardToken', 'RWD', POOL_REWARD, account.address],
    });
    const rReceipt = await publicClient.waitForTransactionReceipt({ hash: rHash });
    const rewardToken = rReceipt.contractAddress!;

    const pHash = await wallet.deployContract({
      abi: stakingArtifact.abi as never,
      bytecode: stakingArtifact.bytecode.object,
      args: [stakeToken, rewardToken, CONTROLLER, REWARD_RATE],
    });
    const pReceipt = await publicClient.waitForTransactionReceipt({ hash: pHash });
    const staking = pReceipt.contractAddress!;

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
      address: rewardToken,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [staking, POOL_REWARD],
    });
    await publicClient.waitForTransactionReceipt({ hash: fundHash });

    return {
      NEXT_PUBLIC_STAKE_TOKEN: stakeToken,
      NEXT_PUBLIC_REWARD_TOKEN: rewardToken,
      NEXT_PUBLIC_STAKING: staking,
      NEXT_PUBLIC_CONTROLLER: CONTROLLER,
    };
  },
});
