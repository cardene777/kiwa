import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa/core';
import type { Hex } from 'viem';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ wallet, publicClient }) => {
    const artifact = JSON.parse(
      readFileSync(
        resolve(exampleRoot, 'forge-out/CommitmentVerifier.sol/CommitmentVerifier.json'),
        'utf8',
      ),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const rangeArtifact = JSON.parse(
      readFileSync(
        resolve(exampleRoot, 'forge-out/RangeProofVerifier.sol/RangeProofVerifier.json'),
        'utf8',
      ),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const hash = await wallet.deployContract({
      abi: artifact.abi as never,
      bytecode: artifact.bytecode.object,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const verifier = receipt.contractAddress!;

    const rangeHash = await wallet.deployContract({
      abi: rangeArtifact.abi as never,
      bytecode: rangeArtifact.bytecode.object,
    });
    const rangeReceipt = await publicClient.waitForTransactionReceipt({ hash: rangeHash });
    const rangeVerifier = rangeReceipt.contractAddress!;

    return {
      NEXT_PUBLIC_VERIFIER: verifier,
      NEXT_PUBLIC_RANGE_VERIFIER: rangeVerifier,
    };
  },
});
