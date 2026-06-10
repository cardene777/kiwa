import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa-test/core';
import type { Hex } from 'viem';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ wallet, publicClient }) => {
    const resolverArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/SimpleResolver.sol/SimpleResolver.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const rHash = await wallet.deployContract({
      abi: resolverArtifact.abi as never,
      bytecode: resolverArtifact.bytecode.object,
    });
    const rReceipt = await publicClient.waitForTransactionReceipt({ hash: rHash });
    const resolver = rReceipt.contractAddress!;

    return {
      NEXT_PUBLIC_RESOLVER: resolver,
    };
  },
});
