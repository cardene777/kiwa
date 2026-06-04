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
    const nftArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/GateNFT.sol/GateNFT.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const gatedArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/GatedContent.sol/GatedContent.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    const nftHash = await wallet.deployContract({
      abi: nftArtifact.abi as never,
      bytecode: nftArtifact.bytecode.object,
    });
    const nftReceipt = await publicClient.waitForTransactionReceipt({ hash: nftHash });
    const gateNft = nftReceipt.contractAddress!;

    const gatedHash = await wallet.deployContract({
      abi: gatedArtifact.abi as never,
      bytecode: gatedArtifact.bytecode.object,
      args: [gateNft],
    });
    const gatedReceipt = await publicClient.waitForTransactionReceipt({ hash: gatedHash });
    const gatedContent = gatedReceipt.contractAddress!;

    return {
      NEXT_PUBLIC_GATE_NFT: gateNft,
      NEXT_PUBLIC_GATED_CONTENT: gatedContent,
    };
  },
});
