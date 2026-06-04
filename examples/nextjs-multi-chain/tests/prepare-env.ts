import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  killAnvilFromPidFile,
  runE2EPrepareEnv,
  writePidEntry,
  type PidEntry,
} from '@dapp-e2e/core';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';

const CHAIN_CONFIGS = [
  { id: 1, port: 8551, label: 'Mainnet', noncePadding: 0, pidFilePath: '.context/anvil-mainnet.pid' },
  { id: 10, port: 8552, label: 'Optimism', noncePadding: 1, pidFilePath: '.context/anvil-optimism.pid' },
  { id: 8453, port: 8553, label: 'Base', noncePadding: 2, pidFilePath: '.context/anvil-base.pid' },
] as const;

const INITIAL_SUPPLY = 1_000n * 10n ** 18n;
const MINTER_KEY: Hex =
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const MINTER = privateKeyToAccount(MINTER_KEY).address;
const PROBE_USER = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
).address;

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
          args: [`Token-${config.label}`, config.label, INITIAL_SUPPLY, account.address, MINTER],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (!receipt.contractAddress) throw new Error(`deploy failed on chain ${config.id}`);
        deployedAddresses[config.label] = receipt.contractAddress;

        return {
          [`NEXT_PUBLIC_${config.label.toUpperCase()}_PORT`]: String(config.port),
          [`NEXT_PUBLIC_${config.label.toUpperCase()}_TOKEN`]: receipt.contractAddress,
          NEXT_PUBLIC_PROBE_USER: PROBE_USER,
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
        args: [
          `Token-${mainnetConfig.label}`,
          mainnetConfig.label,
          INITIAL_SUPPLY,
          account.address,
          MINTER,
        ],
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
        NEXT_PUBLIC_PROBE_USER: PROBE_USER,
      };
    },
  });

  for (const config of CHAIN_CONFIGS) {
    writePidEntry(mergedPidFilePath, readPidEntry(resolve(exampleRoot, config.pidFilePath)));
  }
} catch (error) {
  for (const config of CHAIN_CONFIGS) {
    killAnvilFromPidFile(resolve(exampleRoot, config.pidFilePath));
  }
  killAnvilFromPidFile(mergedPidFilePath);
  throw error;
}

function readPidEntry(pidFilePath: string): PidEntry {
  const line = readFileSync(pidFilePath, 'utf8')
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.length > 0);
  if (!line) {
    throw new Error(`PID file is empty: ${pidFilePath}`);
  }

  const parsed = JSON.parse(line) as PidEntry;
  if (!Number.isInteger(parsed.pid) || parsed.pid <= 0) {
    throw new Error(`Invalid PID entry in ${pidFilePath}`);
  }

  return parsed;
}
