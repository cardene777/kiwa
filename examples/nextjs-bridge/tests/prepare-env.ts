import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { killAnvilFromPidFile, runE2EPrepareEnv } from '@dapp-e2e/core';
import type { Hex } from 'viem';

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

      // dest bridge は operator を持つ必要、先に dest token deploy (operator として dest bridge address 必要だが先に dest bridge も deploy 必要 → CREATE 順序ハック)
      // 簡略化: dest token の operator を後でセットできないため、dest bridge を deploy 後に dest token を deploy し token は bridge を operator として指定
      // ただし dest bridge は destToken address を constructor で取る → 先に dest token 必要
      // 妥協案: operator = EOA (deployer) として dest token を deploy、dest bridge にはこの EOA が operator として relay する形式

      // dest token は operator = EOA (deployer)
      const destTokenHash = await wallet.deployContract({
        abi: destTokenArtifact.abi as never,
        bytecode: destTokenArtifact.bytecode.object,
        args: ['DestToken', 'DST', account.address],
      });
      const destTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: destTokenHash });
      destToken = destTokenReceipt.contractAddress!;

      // dest bridge は destToken の operator として EOA を渡す (bridge 自身は token を呼ぶ際 operator として token に identify される)
      // 本構成では bridge は token の operator 権限を持たないため、bridgeBurn は test 内で operator が直接 destToken.burn() を呼ぶ形にする
      // 簡略化のため DestBridge は不要、test では operator が直接 destToken.mint / burn を呼ぶ形式に変更する
      // ただし e2e の demonstrative value を保つため DestBridge も deploy しておく
      const destBridgeHash = await wallet.deployContract({
        abi: destBridgeArtifact.abi as never,
        bytecode: destBridgeArtifact.bytecode.object,
        args: [destToken, account.address],
      });
      const destBridgeReceipt = await publicClient.waitForTransactionReceipt({
        hash: destBridgeHash,
      });
      destBridge = destBridgeReceipt.contractAddress!;

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

  const l1Pid = readFileSync(l1PidFilePath, 'utf8').trim();
  const l2Pid = readFileSync(l2PidFilePath, 'utf8').trim();
  writeFileSync(mergedPidFilePath, `${l1Pid}\n${l2Pid}\n`, 'utf8');
} catch (error) {
  killAnvilFromPidFile(l1PidFilePath);
  killAnvilFromPidFile(l2PidFilePath);
  killAnvilFromPidFile(mergedPidFilePath);
  throw error;
}
