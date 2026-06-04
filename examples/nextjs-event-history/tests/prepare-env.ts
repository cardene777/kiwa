import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@dapp-e2e/core';
import type { Hex } from 'viem';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ wallet, publicClient }) => {
    const emitterArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/EventEmitter.sol/EventEmitter.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const eHash = await wallet.deployContract({
      abi: emitterArtifact.abi as never,
      bytecode: emitterArtifact.bytecode.object,
    });
    const eReceipt = await publicClient.waitForTransactionReceipt({ hash: eHash });
    const emitter = eReceipt.contractAddress!;

    return {
      NEXT_PUBLIC_EMITTER: emitter,
    };
  },
});
