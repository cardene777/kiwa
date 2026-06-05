import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expectCustomError } from '@dapp-e2e/core';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const OWNER_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const OTHER_PK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;
const ANVIL_PORT = 8545;

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifact = JSON.parse(
  readFileSync(resolve(__dirname, '../forge-out/GameItems.sol/GameItems.json'), 'utf8'),
) as { abi: readonly unknown[]; bytecode: { object: Hex } };

const GAME_ITEMS_ABI = parseAbi([
  'function mint(address to, uint256 id, uint256 amount)',
  'function burn(address account, uint256 id, uint256 amount)',
  'function balanceOf(uint256 id, address owner) view returns (uint256)',
  'function totalSupply(uint256 id) view returns (uint256)',
  'error NotAuthorized()',
]);

function anvilChain() {
  return defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${ANVIL_PORT}`] } },
  });
}

async function deployGameItems(): Promise<{
  address: Address;
  owner: ReturnType<typeof privateKeyToAccount>;
  other: ReturnType<typeof privateKeyToAccount>;
}> {
  const owner = privateKeyToAccount(OWNER_PK);
  const other = privateKeyToAccount(OTHER_PK);
  const wallet = createWalletClient({
    account: owner,
    chain: anvilChain(),
    transport: http(),
  });
  const pub = createPublicClient({ chain: anvilChain(), transport: http() });
  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error('GameItems deploy failed');
  return { address: receipt.contractAddress, owner, other };
}

test.describe('ERC1155 burn direct contract tests', () => {
  test('T-ER-006 mint → burn で balance が 0 に戻る', async () => {
    const { address, owner } = await deployGameItems();
    const wallet = createWalletClient({
      account: owner,
      chain: anvilChain(),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(), transport: http() });

    await pub.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address,
        abi: GAME_ITEMS_ABI,
        functionName: 'mint',
        args: [owner.address, 1n, 1n],
      }),
    });
    await pub.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address,
        abi: GAME_ITEMS_ABI,
        functionName: 'burn',
        args: [owner.address, 1n, 1n],
      }),
    });

    const balance = await pub.readContract({
      address,
      abi: GAME_ITEMS_ABI,
      functionName: 'balanceOf',
      args: [1n, owner.address],
    });
    expect(balance).toBe(0n);
  });

  test('T-ER-007 burn 後 token totalSupply が減る', async () => {
    const { address, owner } = await deployGameItems();
    const wallet = createWalletClient({
      account: owner,
      chain: anvilChain(),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(), transport: http() });

    await pub.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address,
        abi: GAME_ITEMS_ABI,
        functionName: 'mint',
        args: [owner.address, 1n, 3n],
      }),
    });

    const supplyBefore = await pub.readContract({
      address,
      abi: GAME_ITEMS_ABI,
      functionName: 'totalSupply',
      args: [1n],
    });

    await pub.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address,
        abi: GAME_ITEMS_ABI,
        functionName: 'burn',
        args: [owner.address, 1n, 2n],
      }),
    });

    const supplyAfter = await pub.readContract({
      address,
      abi: GAME_ITEMS_ABI,
      functionName: 'totalSupply',
      args: [1n],
    });
    expect(supplyBefore).toBe(3n);
    expect(supplyAfter).toBe(1n);
  });

  test('T-ER-008 他人の token burn は NotAuthorized() で revert', async () => {
    const { address, owner, other } = await deployGameItems();
    const ownerWallet = createWalletClient({
      account: owner,
      chain: anvilChain(),
      transport: http(),
    });
    const pub = createPublicClient({ chain: anvilChain(), transport: http() });

    await pub.waitForTransactionReceipt({
      hash: await ownerWallet.writeContract({
        address,
        abi: GAME_ITEMS_ABI,
        functionName: 'mint',
        args: [owner.address, 1n, 1n],
      }),
    });

    try {
      await pub.simulateContract({
        account: other.address,
        address,
        abi: GAME_ITEMS_ABI,
        functionName: 'burn',
        args: [owner.address, 1n, 1n],
      });
      throw new Error('expected NotAuthorized revert');
    } catch (error) {
      expectCustomError(error, 'NotAuthorized');
    }
  });
});
