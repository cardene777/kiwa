import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@dapp-e2e/core';
import type { Hex } from 'viem';

// 本 example では paymaster を entryPoint として扱い、smart account.execute を paymaster からも許可する
// entryPoint address は paymaster deploy 後に確定するため、deploy 順序が
// Paymaster (no constructor arg) → AccountFactory(paymaster as entryPoint) になる

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ wallet, publicClient }) => {
    const factoryArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/AccountFactory.sol/AccountFactory.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const paymasterArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/Paymaster.sol/Paymaster.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const counterArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/Counter.sol/Counter.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    // 先に Paymaster deploy (constructor arg なし)
    const pHash = await wallet.deployContract({
      abi: paymasterArtifact.abi as never,
      bytecode: paymasterArtifact.bytecode.object,
    });
    const pReceipt = await publicClient.waitForTransactionReceipt({ hash: pHash });
    const paymaster = pReceipt.contractAddress!;

    // paymaster を entryPoint として AccountFactory deploy
    const fHash = await wallet.deployContract({
      abi: factoryArtifact.abi as never,
      bytecode: factoryArtifact.bytecode.object,
      args: [paymaster],
    });
    const fReceipt = await publicClient.waitForTransactionReceipt({ hash: fHash });
    const factory = fReceipt.contractAddress!;

    // Counter deploy
    const cHash = await wallet.deployContract({
      abi: counterArtifact.abi as never,
      bytecode: counterArtifact.bytecode.object,
    });
    const cReceipt = await publicClient.waitForTransactionReceipt({ hash: cHash });
    const counter = cReceipt.contractAddress!;

    return {
      NEXT_PUBLIC_FACTORY: factory,
      NEXT_PUBLIC_PAYMASTER: paymaster,
      NEXT_PUBLIC_COUNTER: counter,
    };
  },
});
