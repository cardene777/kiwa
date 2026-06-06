import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  killAnvilFromPidFile,
  runE2EPrepareEnv,
  writePidEntry,
  type PidEntry,
} from '@kiwa/core';
import { getContractAddress, type Hex } from 'viem';

const L1_PORT = 8554;
const L2_PORT = 8555;
const L1_CHAIN_ID = 1;
const L2_CHAIN_ID = 10;

// operator は test 内で wallet client 経由で代行 (real bridge では off-chain relayer)
const USER_INITIAL = 1000n * 10n ** 18n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');
const mergedPidFilePath = resolve(exampleRoot, '.context/anvil.pid');
const l1PidFilePath = resolve(exampleRoot, '.context/anvil-l1.pid');
const l2PidFilePath = resolve(exampleRoot, '.context/anvil-l2.pid');

let destToken = '' as Hex;
let destBridge = '' as Hex;

killAnvilFromPidFile(mergedPidFilePath);

try {
  await runE2EPrepareEnv({
    exampleRoot,
    port: L2_PORT,
    chainId: L2_CHAIN_ID,
    envLocalPath: '.context/l2.env',
    nextCacheDir: '.context/.next-l2',
    pidFilePath: '.context/anvil-l2.pid',
    deploy: async ({ account, wallet, publicClient }) => {
      const destTokenArtifact = JSON.parse(
        readFileSync(resolve(exampleRoot, 'forge-out/DestToken.sol/DestToken.json'), 'utf8'),
      ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
      const destBridgeArtifact = JSON.parse(
        readFileSync(resolve(exampleRoot, 'forge-out/DestBridge.sol/DestBridge.json'), 'utf8'),
      ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

      // dummy self-transfer x2 で deploy address を変える
      for (let i = 0; i < 2; i++) {
        const padHash = await wallet.sendTransaction({ to: account.address, value: 0n });
        await publicClient.waitForTransactionReceipt({ hash: padHash });
      }

      const nextNonce = BigInt(
        await publicClient.getTransactionCount({ address: account.address }),
      );
      const predictedDestToken = getContractAddress({
        from: account.address,
        nonce: nextNonce,
      });
      const predictedDestBridge = getContractAddress({
        from: account.address,
        nonce: nextNonce + 1n,
      });

      // dest token/operator と dest bridge/token の循環依存は CREATE address を先読みして解決する
      const destTokenHash = await wallet.deployContract({
        abi: destTokenArtifact.abi as never,
        bytecode: destTokenArtifact.bytecode.object,
        args: ['DestToken', 'DST', predictedDestBridge],
      });
      const destTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: destTokenHash });
      destToken = destTokenReceipt.contractAddress!;
      if (destToken.toLowerCase() !== predictedDestToken.toLowerCase()) {
        throw new Error(`predicted DestToken mismatch: expected ${predictedDestToken}, got ${destToken}`);
      }

      const destBridgeHash = await wallet.deployContract({
        abi: destBridgeArtifact.abi as never,
        bytecode: destBridgeArtifact.bytecode.object,
        args: [destToken, account.address],
      });
      const destBridgeReceipt = await publicClient.waitForTransactionReceipt({
        hash: destBridgeHash,
      });
      destBridge = destBridgeReceipt.contractAddress!;
      if (destBridge.toLowerCase() !== predictedDestBridge.toLowerCase()) {
        throw new Error(
          `predicted DestBridge mismatch: expected ${predictedDestBridge}, got ${destBridge}`,
        );
      }

      return {
        NEXT_PUBLIC_L2_PORT: String(L2_PORT),
        NEXT_PUBLIC_DEST_TOKEN: destToken,
        NEXT_PUBLIC_DEST_BRIDGE: destBridge,
      };
    },
  });

  await runE2EPrepareEnv({
    exampleRoot,
    port: L1_PORT,
    chainId: L1_CHAIN_ID,
    pidFilePath: '.context/anvil-l1.pid',
    deploy: async ({ account, wallet, publicClient }) => {
      const erc20Artifact = JSON.parse(
        readFileSync(resolve(exampleRoot, 'forge-out/SimpleERC20.sol/SimpleERC20.json'), 'utf8'),
      ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
      const sourceBridgeArtifact = JSON.parse(
        readFileSync(resolve(exampleRoot, 'forge-out/SourceBridge.sol/SourceBridge.json'), 'utf8'),
      ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

      // L1: source token + source bridge deploy
      const srcTokenHash = await wallet.deployContract({
        abi: erc20Artifact.abi as never,
        bytecode: erc20Artifact.bytecode.object,
        args: ['SourceToken', 'SRC', USER_INITIAL, account.address],
      });
      const srcTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: srcTokenHash });
      const sourceToken = srcTokenReceipt.contractAddress!;

      const srcBridgeHash = await wallet.deployContract({
        abi: sourceBridgeArtifact.abi as never,
        bytecode: sourceBridgeArtifact.bytecode.object,
        args: [sourceToken, account.address],
      });
      const srcBridgeReceipt = await publicClient.waitForTransactionReceipt({
        hash: srcBridgeHash,
      });
      const sourceBridge = srcBridgeReceipt.contractAddress!;

      return {
        NEXT_PUBLIC_L1_PORT: String(L1_PORT),
        NEXT_PUBLIC_L2_PORT: String(L2_PORT),
        NEXT_PUBLIC_SOURCE_TOKEN: sourceToken,
        NEXT_PUBLIC_SOURCE_BRIDGE: sourceBridge,
        NEXT_PUBLIC_DEST_TOKEN: destToken,
        NEXT_PUBLIC_DEST_BRIDGE: destBridge,
      };
    },
  });

  writePidEntry(mergedPidFilePath, readPidEntry(l1PidFilePath));
  writePidEntry(mergedPidFilePath, readPidEntry(l2PidFilePath));
} catch (error) {
  killAnvilFromPidFile(l1PidFilePath);
  killAnvilFromPidFile(l2PidFilePath);
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
