import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@dapp-e2e/core';
import type { Hex } from 'viem';

const SMART_ACCOUNT_SALT = 1n;
const RECOVERY_THRESHOLD = 2n;
const BATCH_TEST_BALANCE = 10n * 10n ** 18n;
const GUARDIAN_ADDRESSES = [
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
] as const;

// 本 example では paymaster を entryPoint として扱い、smart account.execute を paymaster からも許可する
// entryPoint address は paymaster deploy 後に確定するため、deploy 順序が
// Paymaster (no constructor arg) → AccountFactory(paymaster as entryPoint) になる

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ account, wallet, publicClient }) => {
    const factoryArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/AccountFactory.sol/AccountFactory.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const paymasterArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/Paymaster.sol/Paymaster.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const counterArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/Counter.sol/Counter.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const tokenArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/MockToken.sol/MockToken.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const spenderArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/TokenSpender.sol/TokenSpender.json'), 'utf8'),
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
      args: [paymaster, GUARDIAN_ADDRESSES, RECOVERY_THRESHOLD],
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

    const tHash = await wallet.deployContract({
      abi: tokenArtifact.abi as never,
      bytecode: tokenArtifact.bytecode.object,
      args: ['Batch Token', 'BATCH'],
    });
    const tReceipt = await publicClient.waitForTransactionReceipt({ hash: tHash });
    const mockToken = tReceipt.contractAddress!;

    const sHash = await wallet.deployContract({
      abi: spenderArtifact.abi as never,
      bytecode: spenderArtifact.bytecode.object,
    });
    const sReceipt = await publicClient.waitForTransactionReceipt({ hash: sHash });
    const tokenSpender = sReceipt.contractAddress!;

    const accountAddress = (await publicClient.readContract({
      address: factory,
      abi: factoryArtifact.abi as never,
      functionName: 'getAddress',
      args: [account.address, SMART_ACCOUNT_SALT],
    })) as `0x${string}`;

    const mintHash = await wallet.writeContract({
      address: mockToken,
      abi: tokenArtifact.abi as never,
      functionName: 'mint',
      args: [accountAddress, BATCH_TEST_BALANCE],
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });

    return {
      NEXT_PUBLIC_FACTORY: factory,
      NEXT_PUBLIC_PAYMASTER: paymaster,
      NEXT_PUBLIC_COUNTER: counter,
      NEXT_PUBLIC_MOCK_TOKEN: mockToken,
      NEXT_PUBLIC_TOKEN_SPENDER: tokenSpender,
    };
  },
});
