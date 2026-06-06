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
      readFileSync(resolve(exampleRoot, 'forge-out/MintNft.sol/MintNft.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const hash = await wallet.deployContract({
      abi: artifact.abi as never,
      bytecode: artifact.bytecode.object,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) throw new Error('contract deploy failed');

    return {
      NEXT_PUBLIC_MINT_CONTRACT: receipt.contractAddress,
    };
  },
});
