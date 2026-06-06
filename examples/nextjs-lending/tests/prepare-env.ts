import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runE2EPrepareEnv } from '@kiwa/core';
import type { Hex } from 'viem';

const USER_COLLATERAL = 1000n * 10n ** 18n;
const POOL_LIQUIDITY = 5000n * 10n ** 18n;
const LIQUIDATOR_LIQUIDITY = 1000n * 10n ** 18n;
const INITIAL_PRICE = 10n ** 18n;
const BOB_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ account, wallet, publicClient }) => {
    const erc20Artifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/SimpleERC20.sol/SimpleERC20.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const lendingArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/SimpleLending.sol/SimpleLending.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };
    const oracleArtifact = JSON.parse(
      readFileSync(resolve(exampleRoot, 'forge-out/MockPriceOracle.sol/MockPriceOracle.json'), 'utf8'),
    ) as { abi: readonly unknown[]; bytecode: { object: Hex } };

    // collateral token (user に USER_COLLATERAL mint)
    const cHash = await wallet.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['Collateral', 'COLL', USER_COLLATERAL, account.address],
    });
    const cReceipt = await publicClient.waitForTransactionReceipt({ hash: cHash });
    const collateral = cReceipt.contractAddress!;

    // borrow token (deployer に pool + liquidator 分 mint)
    const bHash = await wallet.deployContract({
      abi: erc20Artifact.abi as never,
      bytecode: erc20Artifact.bytecode.object,
      args: ['Borrow', 'BORR', POOL_LIQUIDITY + LIQUIDATOR_LIQUIDITY, account.address],
    });
    const bReceipt = await publicClient.waitForTransactionReceipt({ hash: bHash });
    const borrow = bReceipt.contractAddress!;

    const oHash = await wallet.deployContract({
      abi: oracleArtifact.abi as never,
      bytecode: oracleArtifact.bytecode.object,
    });
    const oReceipt = await publicClient.waitForTransactionReceipt({ hash: oHash });
    const oracle = oReceipt.contractAddress!;

    const SET_PRICE_ABI = [
      {
        inputs: [
          { internalType: 'address', name: 'asset', type: 'address' },
          { internalType: 'uint256', name: 'newPrice', type: 'uint256' },
        ],
        name: 'setPrice',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;
    const setPriceHash = await wallet.writeContract({
      address: oracle,
      abi: SET_PRICE_ABI,
      functionName: 'setPrice',
      args: [collateral, INITIAL_PRICE],
    });
    await publicClient.waitForTransactionReceipt({ hash: setPriceHash });

    // lending pool
    const lHash = await wallet.deployContract({
      abi: lendingArtifact.abi as never,
      bytecode: lendingArtifact.bytecode.object,
      args: [collateral, borrow, oracle],
    });
    const lReceipt = await publicClient.waitForTransactionReceipt({ hash: lHash });
    const lending = lReceipt.contractAddress!;

    // pool に borrowToken liquidity 注入
    const TRANSFER_ABI = [
      {
        inputs: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;
    const fundHash = await wallet.writeContract({
      address: borrow,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [lending, POOL_LIQUIDITY],
    });
    await publicClient.waitForTransactionReceipt({ hash: fundHash });

    const liquidatorFundHash = await wallet.writeContract({
      address: borrow,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [BOB_ADDRESS, LIQUIDATOR_LIQUIDITY],
    });
    await publicClient.waitForTransactionReceipt({ hash: liquidatorFundHash });

    return {
      NEXT_PUBLIC_COLLATERAL: collateral,
      NEXT_PUBLIC_BORROW: borrow,
      NEXT_PUBLIC_LENDING: lending,
      NEXT_PUBLIC_ORACLE: oracle,
    };
  },
});
