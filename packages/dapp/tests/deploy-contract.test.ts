import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  deployContract,
  loadForgeArtifact,
  startAnvil,
  type AnvilHandle,
} from '../src/index.js';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const account = privateKeyToAccount(PRIVATE_KEY);
const exampleRoot = resolve(process.cwd(), '../../examples/nextjs-bridge');
const contractSlug = 'SimpleERC20.sol/SimpleERC20';
const erc20ViewAbi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
]);

describe('loadForgeArtifact', () => {
  it('T-DPL-001 forge-out から abi と bytecode を読み込める', () => {
    // Given / When
    const artifact = loadForgeArtifact({ exampleRoot, contractSlug });
    // Then
    expect(artifact.abi.length).toBeGreaterThan(0);
    expect(artifact.bytecode.startsWith('0x')).toBe(true);
  });

  it('T-DPL-002 artifact 不在時は throw する', () => {
    // Given / When / Then
    expect(() =>
      loadForgeArtifact({
        exampleRoot,
        contractSlug: 'Missing.sol/Missing',
      }),
    ).toThrow();
  });
});

describe.skipIf(process.env.SKIP_ANVIL_TESTS === '1')('deployContract', () => {
  let handle: AnvilHandle | null = null;
  let wallet: ReturnType<typeof createWalletClient> | null = null;
  let publicClient: ReturnType<typeof createPublicClient> | null = null;

  beforeAll(async () => {
    handle = await startAnvil();
    const chain = defineChain({
      id: 31337,
      name: 'Anvil',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [`http://127.0.0.1:${handle.port}`] } },
    });
    wallet = createWalletClient({ account, chain, transport: http() });
    publicClient = createPublicClient({ chain, transport: http() });
  });

  afterAll(async () => {
    if (handle) await handle.stop();
  });

  it('T-DPL-003 ERC20 を deploy し address / txHash / receipt を返す', async () => {
    // Given
    const artifact = loadForgeArtifact({ exampleRoot, contractSlug });
    // When
    const deployed = await deployContract({
      account,
      wallet: wallet!,
      publicClient: publicClient!,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: ['Token A', 'TKA', 1_000n, account.address],
    });
    // Then
    expect(deployed.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(deployed.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(deployed.receipt.status).toBe('success');
  });

  it('T-DPL-004 constructor args が contract state に反映される', async () => {
    // Given
    const artifact = loadForgeArtifact({ exampleRoot, contractSlug });
    const initialSupply = 123_456n;
    // When
    const deployed = await deployContract({
      account,
      wallet: wallet!,
      publicClient: publicClient!,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: ['Token B', 'TKB', initialSupply, account.address],
    });
    const [name, symbol, totalSupply, balance] = await Promise.all([
      publicClient!.readContract({
        address: deployed.address,
        abi: erc20ViewAbi,
        functionName: 'name',
      }),
      publicClient!.readContract({
        address: deployed.address,
        abi: erc20ViewAbi,
        functionName: 'symbol',
      }),
      publicClient!.readContract({
        address: deployed.address,
        abi: erc20ViewAbi,
        functionName: 'totalSupply',
      }),
      publicClient!.readContract({
        address: deployed.address,
        abi: erc20ViewAbi,
        functionName: 'balanceOf',
        args: [account.address],
      }),
    ]);
    // Then
    expect(name).toBe('Token B');
    expect(symbol).toBe('TKB');
    expect(totalSupply).toBe(initialSupply);
    expect(balance).toBe(initialSupply);
  });

  it('T-DPL-005 receipt.contractAddress を result.address として返す', async () => {
    // Given
    const artifact = loadForgeArtifact({ exampleRoot, contractSlug });
    // When
    const deployed = await deployContract({
      account,
      wallet: wallet!,
      publicClient: publicClient!,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: ['Token C', 'TKC', 999n, account.address],
    });
    // Then
    expect(deployed.receipt.contractAddress).toBe(deployed.address);
  });
});
