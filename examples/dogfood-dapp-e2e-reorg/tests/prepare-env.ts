import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa-test/dapp';
import { parseUnits, type Hex } from 'viem';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8557,
  chainId: 31337,
  deploy: async ({ wallet, publicClient }) => {
    const tokenArtifact = JSON.parse(
      readFileSync(
        resolve(exampleRoot, 'forge-out/ReorgToken.sol/ReorgToken.json'),
        'utf8',
      ),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const initialSupply = parseUnits('1000000', 18);
    const deployHash = await wallet.deployContract({
      abi: tokenArtifact.abi as never,
      bytecode: tokenArtifact.bytecode.object,
      args: [initialSupply],
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deployHash,
    });
    const token = receipt.contractAddress!;

    return {
      NEXT_PUBLIC_REORG_TOKEN: token,
      NEXT_PUBLIC_ANVIL_PORT: '8557',
    };
  },
});
