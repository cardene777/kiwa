import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa/core';
import type { Hex } from 'viem';

const INITIAL_TOKEN = 100n * 10n ** 18n;
const VOTING_PERIOD = 100n;
const QUORUM_BPS = 400n;
const TIMELOCK_DELAY = 24n * 60n * 60n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ account, wallet, publicClient }) => {
    const tokenArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/VoteToken.sol/VoteToken.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const daoArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/SimpleDao.sol/SimpleDao.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const targetArtifact = JSON.parse(
      readFileSync(
        resolve(exampleRoot, 'forge-out/DaoExecutionTarget.sol/DaoExecutionTarget.json'),
        'utf8',
      ),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const tokenHash = await wallet.deployContract({
      abi: tokenArtifact.abi as never,
      bytecode: tokenArtifact.bytecode.object,
      args: ['VoteToken', 'VOTE', INITIAL_TOKEN, account.address],
    });
    const tokenReceipt = await publicClient.waitForTransactionReceipt({ hash: tokenHash });
    const voteToken = tokenReceipt.contractAddress!;

    const daoHash = await wallet.deployContract({
      abi: daoArtifact.abi as never,
      bytecode: daoArtifact.bytecode.object,
      args: [voteToken, VOTING_PERIOD, QUORUM_BPS, TIMELOCK_DELAY],
    });
    const daoReceipt = await publicClient.waitForTransactionReceipt({ hash: daoHash });
    const dao = daoReceipt.contractAddress!;

    const targetHash = await wallet.deployContract({
      abi: targetArtifact.abi as never,
      bytecode: targetArtifact.bytecode.object,
      args: [dao],
    });
    const targetReceipt = await publicClient.waitForTransactionReceipt({ hash: targetHash });
    const executionTarget = targetReceipt.contractAddress!;

    return {
      NEXT_PUBLIC_VOTE_TOKEN: voteToken,
      NEXT_PUBLIC_DAO: dao,
      NEXT_PUBLIC_DAO_EXECUTION_TARGET: executionTarget,
    };
  },
});
