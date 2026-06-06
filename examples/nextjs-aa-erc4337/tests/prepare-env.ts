import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deployContract, loadForgeArtifact, runE2EPrepareEnv } from '@kiwa/core';
import { type Address } from 'viem';

const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const BUNDLER_PRIVATE_KEY =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;
const ACCOUNT_SALT = 1n;

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  exampleRoot,
  port: 8545,
  chainId: 31337,
  deploy: async ({ account, wallet, publicClient }) => {
    const entryPointArtifact = loadForgeArtifact({
      exampleRoot,
      contractSlug: 'EntryPoint.sol/EntryPoint',
    });
    const factoryArtifact = loadForgeArtifact({
      exampleRoot,
      contractSlug: 'SimpleAccountFactory.sol/SimpleAccountFactory',
    });
    const mockTargetArtifact = loadForgeArtifact({
      exampleRoot,
      contractSlug: 'MockTarget.sol/MockTarget',
    });

    const entryPoint = (
      await deployContract({
        account,
        wallet,
        publicClient,
        abi: entryPointArtifact.abi,
        bytecode: entryPointArtifact.bytecode,
      })
    ).address;

    const factory = (
      await deployContract({
        account,
        wallet,
        publicClient,
        abi: factoryArtifact.abi,
        bytecode: factoryArtifact.bytecode,
        args: [entryPoint],
      })
    ).address;

    const mockTarget = (
      await deployContract({
        account,
        wallet,
        publicClient,
        abi: mockTargetArtifact.abi,
        bytecode: mockTargetArtifact.bytecode,
      })
    ).address;

    const smartAccount = (await publicClient.readContract({
      address: factory,
      abi: factoryArtifact.abi,
      functionName: 'getAddress',
      args: [account.address, ACCOUNT_SALT],
    })) as Address;

    return {
      NEXT_PUBLIC_OWNER: account.address,
      NEXT_PUBLIC_ENTRY_POINT: entryPoint,
      NEXT_PUBLIC_FACTORY: factory,
      NEXT_PUBLIC_MOCK_TARGET: mockTarget,
      NEXT_PUBLIC_SMART_ACCOUNT: smartAccount,
      NEXT_PUBLIC_ACCOUNT_SALT: ACCOUNT_SALT.toString(),
      BUNDLER_PRIVATE_KEY,
      TEST_OWNER_PRIVATE_KEY: OWNER_PK,
    };
  },
});
