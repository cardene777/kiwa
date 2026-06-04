import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { killAnvilFromPidFile, runE2EPrepareEnv } from '@dapp-e2e/core';
import type { Hex } from 'viem';

const CHAIN_CONFIGS = [
  { id: 1, port: 8551, label: 'Mainnet', noncePadding: 0, pidFilePath: '.context/anvil-mainnet.pid' },
  { id: 10, port: 8552, label: 'Optimism', noncePadding: 1, pidFilePath: '.context/anvil-optimism.pid' },
  { id: 8453, port: 8553, label: 'Base', noncePadding: 2, pidFilePath: '.context/anvil-base.pid' },
] as const;

const INITIAL_SUPPLY = 1_000n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');
const mergedPidFilePath = resolve(exampleRoot, '.context/anvil.pid');

const deployedAddresses: Record<string, Hex> = {};

killAnvilFromPidFile(mergedPidFilePath);

try {
  for (const config of CHAIN_CONFIGS.slice(1)) {
    await runE2EPrepareEnv({
      exampleRoot,
      port: config.port,
      chainId: config.id,
      envLocalPath: `.context/${config.label.toLowerCase()}.env`,
      nextCacheDir: `.context/.next-${config.label.toLowerCase()}`,
      pidFilePath: config.pidFilePath,
      deploy: async ({ account, wallet, publicClient }) => {
        const artifact = JSON.parse(
          readFileSync(resolve(exampleRoot, 'forge-out/SimpleToken.sol/SimpleToken.json'), 'utf8'),
        ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

        // nonce padding: 同一 deployer の同一 nonce で deploy すると CREATE address が
        // 全 chain で同一になるため、chain ごとに dummy self-transfer で nonce をずらす
        for (let i = 0; i < config.noncePadding; i++) {
          const padHash = await wallet.sendTransaction({
            to: account.address,
            value: 0n,
          });
          await publicClient.waitForTransactionReceipt({ hash: padHash });
        }

        const hash = await wallet.deployContract({
          abi: artifact.abi as never,
          bytecode: artifact.bytecode.object,
          args: [`Token-${config.label}`, config.label, INITIAL_SUPPLY, account.address],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (!receipt.contractAddress) throw new Error(`deploy failed on chain ${config.id}`);
        deployedAddresses[config.label] = receipt.contractAddress;

        return {
          [`NEXT_PUBLIC_${config.label.toUpperCase()}_PORT`]: String(config.port),
          [`NEXT_PUBLIC_${config.label.toUpperCase()}_TOKEN`]: receipt.contractAddress,
        };
      },
    });
  }

  const mainnetConfig = CHAIN_CONFIGS[0];
  await runE2EPrepareEnv({
    exampleRoot,
    port: mainnetConfig.port,
    chainId: mainnetConfig.id,
    pidFilePath: mainnetConfig.pidFilePath,
    deploy: async ({ account, wallet, publicClient }) => {
      const artifact = JSON.parse(
        readFileSync(resolve(exampleRoot, 'forge-out/SimpleToken.sol/SimpleToken.json'), 'utf8'),
      ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

      const hash = await wallet.deployContract({
        abi: artifact.abi as never,
        bytecode: artifact.bytecode.object,
        args: [`Token-${mainnetConfig.label}`, mainnetConfig.label, INITIAL_SUPPLY, account.address],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) {
        throw new Error(`deploy failed on chain ${mainnetConfig.id}`);
      }
      deployedAddresses[mainnetConfig.label] = receipt.contractAddress;

      return {
        NEXT_PUBLIC_MAINNET_PORT: String(CHAIN_CONFIGS[0].port),
        NEXT_PUBLIC_OPTIMISM_PORT: String(CHAIN_CONFIGS[1].port),
        NEXT_PUBLIC_BASE_PORT: String(CHAIN_CONFIGS[2].port),
        NEXT_PUBLIC_MAINNET_TOKEN: deployedAddresses.Mainnet,
        NEXT_PUBLIC_OPTIMISM_TOKEN: deployedAddresses.Optimism,
        NEXT_PUBLIC_BASE_TOKEN: deployedAddresses.Base,
      };
    },
  });

  const pidContent = CHAIN_CONFIGS.map((config) =>
    readFileSync(resolve(exampleRoot, config.pidFilePath), 'utf8').trim(),
  ).join('\n');
  writeFileSync(mergedPidFilePath, `${pidContent}\n`, 'utf8');
} catch (error) {
  for (const config of CHAIN_CONFIGS) {
    killAnvilFromPidFile(resolve(exampleRoot, config.pidFilePath));
  }
  killAnvilFromPidFile(mergedPidFilePath);
  throw error;
}
